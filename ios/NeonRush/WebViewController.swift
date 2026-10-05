import UIKit
import WebKit

class WebViewController: UIViewController, WKNavigationDelegate, WKUIDelegate, WKScriptMessageHandler {
    var webView: WKWebView!
    private var hasRequestedPush = false
    private var pendingPushToken: String?
    // CRITICAL: Static shared process pool — prevents fresh browsing context on each launch.
    // Without this, even with WKWebsiteDataStore.default(), localStorage may not load properly.
    private static let sharedProcessPool = WKProcessPool()

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = UIColor(hex: "#090e21")

        let config = WKWebViewConfiguration()
        config.allowsInlineMediaPlayback = true
        config.mediaTypesRequiringUserActionForPlayback = []
        // NOTE: limitsNavigationsToAppBoundDomains intentionally NOT enabled (breaks OAuth).
        // CRITICAL: default persistent data store — .nonPersistent() breaks offline/session.
        config.websiteDataStore = WKWebsiteDataStore.default()
        // CRITICAL: Reuse shared process pool so localStorage/cookies survive app restarts
        config.processPool = WebViewController.sharedProcessPool
        config.preferences.javaScriptCanOpenWindowsAutomatically = true

        // Restore auth token from UserDefaults backup into localStorage BEFORE page JS runs.
        // This is belt-and-suspenders insurance in case iOS purges WKWebView data.
        let restoreScript = WKUserScript(source: tokenRestorationScript(), injectionTime: .atDocumentStart, forMainFrameOnly: false)
        config.userContentController.addUserScript(restoreScript)
        // On-device sign-out diagnostics HUD (only ever visible during a sign-out).
        // Sign-out watcher — flags an explicit sign-out and signals native teardown so
        // the token/cookie backups can't silently log the user back in on next launch.
        config.userContentController.addUserScript(WKUserScript(source: "(function() {\n  if (window.__anLogoutWatch) return; window.__anLogoutWatch = true;\n  var FLAG = 'appnative_logged_out';\n  var ls = window.localStorage;\n  // Any auth-ish key counts, not just base44_access_token — apps name their session\n  // key differently (token, auth, session, jwt, sb-*-auth-token, ...).\n  // AppNative's own keys (e.g. the IAP runtime's appnative_account_token, which is\n  // cleared on every launch) are never the web app's login — skip them, or that\n  // launch-time clear is mistaken for a sign-out and wipes the real session.\n  var isAuthKey = function(k) { return typeof k === 'string' && k.indexOf('appnative_') !== 0 && /token|auth|session|jwt/i.test(k); };\n  var signalled = false;\n  var signalSignOut = function() {\n    if (signalled) return; signalled = true;\n\n    try { window.webkit.messageHandlers.appNativeAuth.postMessage({ action: 'signedOut' }); }\n    catch (e) { if (window.__anLog) window.__anLog('BRIDGE MISSING: ' + (e.message || e) + ' (old build?)', '#ff7b72'); }\n  };\n  var origSet = Storage.prototype.setItem;\n  var origRemove = Storage.prototype.removeItem;\n  var origClear = Storage.prototype.clear;\n  Storage.prototype.setItem = function(k, v) {\n    if (this === ls && isAuthKey(k)) {\n      if (!v || v === 'null' || v === 'undefined' || v === '\"\"') { origSet.call(ls, FLAG, '1'); signalSignOut(); }\n      else { origRemove.call(ls, FLAG); }\n    }\n    return origSet.apply(this, arguments);\n  };\n  Storage.prototype.removeItem = function(k) {\n    var had = this === ls && isAuthKey(k) && !!ls.getItem(k) && ls.getItem(k) !== 'null';\n    var r = origRemove.apply(this, arguments);\n    if (had) { origSet.call(ls, FLAG, '1'); signalSignOut(); }\n    return r;\n  };\n  Storage.prototype.clear = function() {\n    var r = origClear.apply(this, arguments);\n    if (this === ls) { origSet.call(ls, FLAG, '1'); signalSignOut(); }\n    return r;\n  };\n})();", injectionTime: .atDocumentStart, forMainFrameOnly: false))
        config.userContentController.add(self, name: "appNativeAuth")
        
        config.userContentController.addUserScript(WKUserScript(source: "(function(){\n  fetch('https://appnative.base44.app/api/functions/checkWrapperSubscription',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({app_id:'6ac2a3905e8487f66dad5a60'})})\n  .then(function(r){return r.json()}).then(function(d){\n    if(d.active||document.getElementById('appnative-wrapper-banner'))return;\n    function openUpsell(){\n      if(document.getElementById('appnative-upsell'))return;\n      var o=document.createElement('div');o.id='appnative-upsell';\n      o.style.cssText='position:fixed;inset:0;z-index:2147483647;background:rgba(8,12,20,.72);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;padding:24px;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;';\n      var c=document.createElement('div');\n      c.style.cssText='background:#fff;color:#0f172a;border-radius:20px;max-width:360px;width:100%;padding:28px 24px;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,.4);';\n      c.innerHTML='<div style=\"width:56px;height:56px;border-radius:16px;margin:0 auto 16px;background:linear-gradient(135deg,#4f46e5,#06b6d4);display:flex;align-items:center;justify-content:center;font-size:28px\">📱</div>'\n        +'<h2 style=\"margin:0 0 8px;font-size:20px;font-weight:800\">Get Your Own Mobile App</h2>'\n        +'<p style=\"margin:0 0 20px;font-size:14px;line-height:1.5;color:#475569\">Launch your own branded iOS &amp; Android app on the App Store &amp; Google Play — no code, powered by AppNative.io.</p>'\n        +'<a href=\"https://appnative.io/\" target=\"_blank\" style=\"display:block;text-decoration:none;background:linear-gradient(135deg,#4f46e5,#06b6d4);color:#fff;border-radius:12px;padding:14px;font-size:15px;font-weight:700;margin-bottom:10px\">Get Started →</a>'\n        +'<button id=\"appnative-upsell-close\" style=\"width:100%;background:transparent;border:none;color:#64748b;font-size:14px;font-weight:600;padding:8px;cursor:pointer\">Maybe later</button>';\n      o.appendChild(c);\n      o.addEventListener('click',function(e){if(e.target===o)o.remove()});\n      document.body.appendChild(o);\n      document.getElementById('appnative-upsell-close').onclick=function(){o.remove()};\n    }\n    var b=document.createElement('a');b.id='appnative-wrapper-banner';b.href='#';\n    b.textContent=d.banner_text||'This App Was Wrapped By AppNative.io';\n    b.style.cssText='display:block;text-decoration:none;cursor:pointer;position:fixed;top:0;left:0;right:0;z-index:2147483646;background:#0f172a;color:#fff;text-align:center;font:600 13px -apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;padding:10px 12px;padding-top:calc(10px + env(safe-area-inset-top,0px));box-shadow:0 2px 12px rgba(0,0,0,.25);';\n    b.onclick=function(e){e.preventDefault();openUpsell()};\n    document.body.style.paddingTop='44px';document.body.appendChild(b);\n  }).catch(function(){})\n})();", injectionTime: .atDocumentEnd, forMainFrameOnly: true))
        // Always tell the web app it's running inside the native wrapper.
        config.userContentController.addUserScript(WKUserScript(source: "window.AppNative = window.AppNative || {}; window.ShipWrap = window.AppNative; window.AppNative.platform = 'ios'; window.AppNative.isNative = true;", injectionTime: .atDocumentStart, forMainFrameOnly: false))

        // Message handler that the async email-extraction JS posts the result back to.
        config.userContentController.add(self, name: "pushAuth")
        // window.AppNative.identify('<any id>') defined at documentStart so it EXISTS on
        // every page load, even before the APNs token arrives or permission is granted.
        config.userContentController.addUserScript(WKUserScript(source: "window.AppNative = window.AppNative || {}; window.ShipWrap = window.AppNative; window.AppNative.identify = function(id) { try { window.webkit.messageHandlers.pushAuth.postMessage({ identify: String(id == null ? '' : id) }); } catch (e) {} };", injectionTime: .atDocumentStart, forMainFrameOnly: false))
        webView = WKWebView(frame: .zero, configuration: config)
        webView.navigationDelegate = self
        webView.uiDelegate = self
        webView.allowsBackForwardNavigationGestures = true
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        webView.isOpaque = false
        webView.backgroundColor = UIColor(hex: "#090e21")

        // Set Safari user agent BEFORE loading any URL.
        webView.customUserAgent = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"

        view.addSubview(webView)
        webView.translatesAutoresizingMaskIntoConstraints = false
        NSLayoutConstraint.activate([
            webView.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
            webView.bottomAnchor.constraint(equalTo: view.bottomAnchor),
            webView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            webView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
        ])

        // Load AFTER customUserAgent is set. The Service Worker (when offline_service is on)
        // serves the cached shell on a cold offline launch, so a plain load works offline
        // after the first online launch — no cache-policy juggling needed here.
        if let url = URL(string: "https://the-neonrush.base44.app/") {
            webView.load(URLRequest(url: url))
        }
        
    }

    override var preferredStatusBarStyle: UIStatusBarStyle { anStatusBarStyleOverride ?? .lightContent }

    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        guard let url = navigationAction.request.url else { decisionHandler(.allow); return }
        // Apple deep links (App Store, Apple ID › Subscriptions) can't be rendered by a
        // WebView — hand them to iOS or the tap silently does nothing.
        let s = url.absoluteString
        if url.scheme == "itms-apps" || url.scheme == "itms-appss" || s.contains("apps.apple.com") || s.contains("finance-app.itunes.apple.com") {
            UIApplication.shared.open(url)
            decisionHandler(.cancel)
            return
        }
        guard let host = url.host else { decisionHandler(.allow); return }
        
        if host.hasSuffix("the-neonrush.base44.app") || host.hasSuffix("accounts.google.com") || host.hasSuffix("apis.google.com") || host.hasSuffix("oauth2.googleapis.com") || host.hasSuffix("www.googleapis.com") || host.hasSuffix("appleid.apple.com") || host.hasSuffix("app.base44.com") || host.hasSuffix("api.base44.com") || host.hasSuffix("accounts.base44.com") || host.hasSuffix("lovable.dev") || host.hasSuffix("api.lovable.dev") || host.hasSuffix("github.com") || host.hasSuffix("api.github.com") { decisionHandler(.allow); return }
        let authDomains = ["accounts.google.com", "appleid.apple.com", "apple.com", "icloud.com", "github.com", "base44.com"]
        if authDomains.contains(where: { host.hasSuffix($0) }) { decisionHandler(.allow); return }
        if navigationAction.navigationType == .linkActivated { UIApplication.shared.open(url); decisionHandler(.cancel); return }
        decisionHandler(.allow)
    }

    func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration, for navigationAction: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
        if let url = navigationAction.request.url { webView.load(URLRequest(url: url)) }
        return nil
    }

    // MARK: - Camera & Mic Capture Permission (iOS 15+)
    // Auto-grant the WebView-level request for enabled capabilities — iOS still shows
    // its own system permission prompt (backed by the Info.plist usage strings) the
    // first time. Without this, WebKit shows a second per-site prompt on every use.
    @available(iOS 15.0, *)
    func webView(_ webView: WKWebView, requestMediaCapturePermissionFor origin: WKSecurityOrigin, initiatedByFrame frame: WKFrameInfo, type: WKMediaCaptureType, decisionHandler: @escaping (WKPermissionDecision) -> Void) {
        switch type {
        case .microphone: decisionHandler(.deny)
        case .camera: decisionHandler(.deny)
        default: decisionHandler(.deny)
        }
    }

    // Ensure cookies/localStorage are flushed to disk when app backgrounds
    func flushWebData() {
        // Force WKWebView to persist cookies by reading them (triggers internal flush)
        WKWebsiteDataStore.default().httpCookieStore.getAllCookies { cookies in
            print("[WebView] Flushed \(cookies.count) cookies to disk")
        }
        // Also force JavaScript to flush any pending writes
        webView?.evaluateJavaScript("void(0)", completionHandler: nil)
    }

    // MARK: - Auth Token Backup (localStorage → UserDefaults)

    // Save auth token from localStorage to UserDefaults when app backgrounds
    func backupAuthToken() {
        webView?.evaluateJavaScript("""
            JSON.stringify({
                access_token: localStorage.getItem('base44_access_token'),
                token: localStorage.getItem('base44_token'),
                app_id: localStorage.getItem('base44_app_id'),
                logged_out: localStorage.getItem('appnative_logged_out')
            })
        """) { result, error in
            if let jsonString = result as? String,
               let data = jsonString.data(using: .utf8),
               let dict = try? JSONSerialization.jsonObject(with: data) as? [String: Any] {
                // The user explicitly signed out — drop the backups instead of saving
                // over them, so a background/terminate can't resurrect the session.
                if let loggedOut = dict["logged_out"] as? String, loggedOut == "1" {
                    ["base44_access_token_backup", "base44_token_backup", "base44_app_id_backup", "persisted_cookies"].forEach {
                        UserDefaults.standard.removeObject(forKey: $0)
                    }
                    UserDefaults.standard.synchronize()
                    return
                }
                if let token = dict["access_token"] as? String, !token.isEmpty, token != "null" {
                    UserDefaults.standard.set(token, forKey: "base44_access_token_backup")
                    print("[Auth] Backed up access_token to UserDefaults")
                }
                if let token = dict["token"] as? String, !token.isEmpty, token != "null" {
                    UserDefaults.standard.set(token, forKey: "base44_token_backup")
                }
                if let appId = dict["app_id"] as? String, !appId.isEmpty, appId != "null" {
                    UserDefaults.standard.set(appId, forKey: "base44_app_id_backup")
                }
            }
        }
    }

    // Generate JS that restores backed-up tokens into localStorage at document start
    private func tokenRestorationScript() -> String {
        let token = UserDefaults.standard.string(forKey: "base44_access_token_backup") ?? ""
        let legacyToken = UserDefaults.standard.string(forKey: "base44_token_backup") ?? ""
        let appId = UserDefaults.standard.string(forKey: "base44_app_id_backup") ?? ""

        guard !token.isEmpty else { return "" }

        return """
        (function() {
            // CRITICAL: never re-inject the token if the user explicitly signed out.
            // Without this guard, document-start restore silently logs the user back in
            // on the next launch — the exact "I signed out but I'm still logged in" bug.
            if (localStorage.getItem('appnative_logged_out') === '1') { return; }
            if (!localStorage.getItem('base44_access_token') || localStorage.getItem('base44_access_token') === 'null') {
                if ('\(token)' !== '') {
                    localStorage.setItem('base44_access_token', '\(token)');
                    console.log('[AppNative] Restored access_token from native backup');
                }
                if ('\(legacyToken)' !== '') {
                    localStorage.setItem('base44_token', '\(legacyToken)');
                }
                if ('\(appId)' !== '') {
                    localStorage.setItem('base44_app_id', '\(appId)');
                }
            }
        })();
        """
    }

    // MARK: - Native message router
    // Always present so sign-out teardown works whether or not push is enabled.
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        if message.name == "appNativeAuth" { handleSignOut(); return }
        
        if message.name == "pushAuth" { handlePushAuthMessage(message) }
    }

    // MARK: - Sign-out session teardown
    // Fired by the logout watcher the moment the web app clears its auth token.
    private func handleSignOut() {
        // 1. Drop the native token backup so nothing can re-inject it on next launch.
        //    "persisted_cookies" is the SECOND, independent re-login path: AppDelegate
        //    mirrors every cookie into UserDefaults and re-injects them at launch, so
        //    wiping only the WebView data store would let the session come straight back.
        ["base44_access_token_backup", "base44_token_backup", "base44_app_id_backup", "persisted_cookies"].forEach {
            UserDefaults.standard.removeObject(forKey: $0)
        }
        UserDefaults.standard.synchronize()

        // 2. Wipe the ENTIRE WebView data store — cookies (incl. HttpOnly, all
        //    domains), localStorage, sessionStorage, caches, IndexedDB.
        let types = WKWebsiteDataStore.allWebsiteDataTypes()
        WKWebsiteDataStore.default().removeData(ofTypes: types, modifiedSince: Date(timeIntervalSince1970: 0)) { [weak self] in
            guard let self = self else { return }

            // 3. Belt-and-braces: shared cookie storage used by non-WebView requests.
            HTTPCookieStorage.shared.cookies?.forEach { HTTPCookieStorage.shared.deleteCookie($0) }

            // 4. Re-arm the signed-out marker in the now-empty store. The token restore
            //    user script was built at launch with the OLD token baked in and still
            //    runs on every document start; the wipe above just deleted the marker it
            //    checks, so without this the very next reload re-injected the token and
            //    logged the user straight back in (only after an app restart, because on
            //    a fresh launch there's no backup for the script to carry).
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.2) {
                self.webView.evaluateJavaScript("try { localStorage.setItem('appnative_logged_out', '1'); } catch (e) {}") { _, _ in
                    // 5. Hard reload the start URL with caches bypassed so the user lands on a
                    //    genuinely clean login screen with no session to silently resume.
                    if let url = URL(string: "https://the-neonrush.base44.app/") {
                        var request = URLRequest(url: url)
                        request.cachePolicy = .reloadIgnoringLocalAndRemoteCacheData
                        self.webView.load(request)
                    }
                }
            }
            print("[AppNative] Signed out — cleared all cookies, storage and token backup")
        }
    }


    // MARK: - Navigation finished
    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        
    
        // Push setup is timing-sensitive on fresh installs — self-healing retries (~18s).
        schedulePushRegistrationRetries()
    
    }
    
    // Retries push permission request + token registration until it succeeds (or gives up).
    private var pushRetryCount = 0
    private func schedulePushRegistrationRetries() {
        // Reset the counter on each fresh page load so SPA navigations re-arm it.
        pushRetryCount = 0
        attemptPushRegistration()
    }

    private func attemptPushRegistration() {
        // Re-send a token we already have — registerTokenWithBackend resolves the email itself.
        if let token = UserDefaults.standard.string(forKey: "apns_device_token") {
            registerPushToken(token)
            registerTokenWithBackend(token)
        }

        // Request permission once the user is authenticated.
        if !self.hasRequestedPush {
            webView.evaluateJavaScript("localStorage.getItem('base44_access_token') || ''") { [weak self] result, _ in
                guard let self = self else { return }
                if !self.hasRequestedPush, let token = result as? String, !token.isEmpty, token != "null" {
                    self.hasRequestedPush = true
                    if let ad = UIApplication.shared.delegate as? AppDelegate { ad.requestPushPermissionIfNeeded() }
                }
            }
        }

        // Keep retrying for a while: catches the "logged in just after page load" case
        // AND the "permission granted but token arrives later" case. ~6 tries over ~18s.
        pushRetryCount += 1
        if pushRetryCount < 6 {
            DispatchQueue.main.asyncAfter(deadline: .now() + 3) { [weak self] in self?.attemptPushRegistration() }
        }
    }
    
    
    // MARK: - Push Notifications

    func registerPushToken(_ token: String) {
        let pushJS = "window.AppNative = window.AppNative || {}; window.ShipWrap = window.AppNative; window.AppNative.pushToken = '\(token)'; window.AppNative.platform = 'ios'; if (window.AppNative.onPushToken) { window.AppNative.onPushToken('\(token)'); }"
        self.webView.evaluateJavaScript(pushJS, completionHandler: nil)
        // window.AppNative.identify('<any id>') — lets the web app tag this device with
        // its OWN identifier (customer, household, profile...) so pushes can be aimed at
        // a specific person even when there is no sign-in. Persisted across launches.
        let identifyJS = "window.AppNative = window.AppNative || {}; window.ShipWrap = window.AppNative; window.AppNative.identify = function(id) { try { window.webkit.messageHandlers.pushAuth.postMessage({ identify: String(id == null ? '' : id) }); } catch (e) {} };"
        self.webView.evaluateJavaScript(identifyJS, completionHandler: nil)
    }

    // Entry point from AppDelegate when the APNs token arrives. The user is logged
    // in, so grab their email from the page's own authenticated SDK FIRST, then send
    // the webhook with the email attached — a single call that always includes it.
    func registerTokenWithBackend(_ token: String, userEmail: String? = nil) {
        if let email = userEmail, !email.isEmpty {
            self.postTokenToBackend(token, userEmail: email, debug: "passed-in")
            return
        }
        // Stash the token, then kick off ASYNC email extraction. The result comes
        // back through the "pushAuth" message handler (evaluateJavaScript cannot
        // await a Promise — it returns nil — so we must use a message callback).
        self.pendingPushToken = token
        extractEmailViaMessageHandler()
    }

    // Runs async JS that resolves the logged-in user's email and posts it back to
    // the native "pushAuth" handler. The key insight: this fetch uses the USER's own
    // session token inside their authenticated WebView, so /entities/User/me succeeds
    // (the service-role backend got 401 because it had no user session).
    private func extractEmailViaMessageHandler() {
        let js = """
        (async function() {
            function post(email, dbg){ try { window.webkit.messageHandlers.pushAuth.postMessage({ email: email || '', debug: dbg || '' }); } catch(e){} }
            function pick(u){ return (u && (u.email || u.user_email)) || ''; }
            if (window.AppNative && window.AppNative.userEmail) { post(window.AppNative.userEmail, 'bridge'); return; }
            var dbg = ['no-bridge'];
            try {
                var sdk = window.base44 || (window.AppNative && window.AppNative.base44);
                if (sdk && sdk.auth && typeof sdk.auth.me === 'function') {
                    var me = await sdk.auth.me();
                    var e = pick(me);
                    if (e) { post(e, 'sdk'); return; }
                    dbg.push('sdk-no-email');
                } else { dbg.push('no-sdk'); }
            } catch (e) { dbg.push('sdk-err:' + (e.message||e)); }
            try {
                var token = localStorage.getItem('base44_access_token');
                var appId = localStorage.getItem('base44_app_id');
                dbg.push('tok=' + (token && token !== 'null' ? 'Y' : 'N'));
                dbg.push('appId=' + (appId && appId !== 'null' ? appId : 'N'));
                if (!token || token === 'null' || !appId || appId === 'null') { post('', dbg.join(',')); return; }
                var host = (localStorage.getItem('base44_app_base_url') || 'https://app.base44.com');
                while (host.charAt(host.length-1) === '/') host = host.slice(0, -1);
                var r = await fetch(host + '/api/apps/' + appId + '/entities/User/me', {
                    headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' }
                });
                dbg.push('status=' + r.status);
                if (!r.ok) { post('', dbg.join(',')); return; }
                var user = await r.json();
                var e2 = pick(user);
                if (e2) { post(e2, 'api'); return; }
                dbg.push('api-no-email');
            } catch (e) { dbg.push('api-err:' + (e.message||e)); }
            post('', dbg.join(','));
        })();
        """
        webView.evaluateJavaScript(js, completionHandler: nil)
    }

    // Receives the email/debug posted back from the async JS above.
    private func handlePushAuthMessage(_ message: WKScriptMessage) {
        // The web app calling window.AppNative.identify('...') — store the third-party
        // identifier and immediately re-register the device so the backend gets it.
        if let ident = (message.body as? [String: Any])?["identify"] as? String {
            UserDefaults.standard.set(ident, forKey: "an_external_id")
            if let token = UserDefaults.standard.string(forKey: "apns_device_token") {
                postTokenToBackend(token, userEmail: nil, debug: "ios:identify")
            }
            return
        }
        guard let token = pendingPushToken else { return }
        let body = message.body as? [String: Any]
        let email = (body?["email"] as? String) ?? ""
        let dbg = (body?["debug"] as? String) ?? "no-body"
        pendingPushToken = nil
        postTokenToBackend(token, userEmail: email.isEmpty ? nil : email, debug: "ios:" + dbg)
    }

    // Sends the token (+ email if found) to the AppNative backend. The debug string
    // is stored on the device record so we can inspect extraction failures via a DB query.
    private func postTokenToBackend(_ token: String, userEmail: String?, debug: String) {
        guard let apiUrl = URL(string: "https://appnative.base44.app/api/functions/registerPushToken") else { return }
        var request = URLRequest(url: apiUrl)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        let vendorId = UIDevice.current.identifierForVendor?.uuidString ?? ""
    var payload: [String: Any] = ["app_id": "6ac2a3905e8487f66dad5a60", "api_key": "", "device_token": token, "device_id": vendorId, "platform": "ios", "device_name": UIDevice.current.name, "app_version": "1.0.0", "debug_info": debug]
        if let email = userEmail, !email.isEmpty { payload["user_email"] = email }
        if let ext = UserDefaults.standard.string(forKey: "an_external_id"), !ext.isEmpty { payload["external_id"] = ext }
        print("[Push] registering token, email=\(userEmail ?? "<none>"), debug=\(debug)")
        request.httpBody = try? JSONSerialization.data(withJSONObject: payload)
        URLSession.shared.dataTask(with: request) { data, response, error in
            if let error = error { print("[Push] err: \(error.localizedDescription)"); return }
            if let data = data, let r = String(data: data, encoding: .utf8) { print("[Push] \(r)") }
        }.resume()
    }

    // Resets the server-side per-device badge counter to 0 so the next push starts at 1.
    // Called from AppDelegate's applicationDidBecomeActive (the native icon badge is
    // already zeroed there instantly — this just keeps the backend counter in sync).
    func clearBadgeOnBackend() {
        guard let apiUrl = URL(string: "https://appnative.base44.app/api/functions/clearBadge") else { return }
        var request = URLRequest(url: apiUrl)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        let payload: [String: Any] = ["app_id": "6ac2a3905e8487f66dad5a60", "api_key": ""]
        request.httpBody = try? JSONSerialization.data(withJSONObject: payload)
        URLSession.shared.dataTask(with: request) { data, _, error in
            if let error = error { print("[Push] clearBadge err: \(error.localizedDescription)"); return }
            if let data = data, let r = String(data: data, encoding: .utf8) { print("[Push] clearBadge \(r)") }
        }.resume()
    }
    
    
}

// Set by AdaptiveTheme.swift when the web background flips light/dark.
var anStatusBarStyleOverride: UIStatusBarStyle? = nil
extension UIColor {
    convenience init(hex: String) {
        let h = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0; Scanner(string: h).scanHexInt64(&int)
        self.init(red: CGFloat((int >> 16) & 0xFF) / 255, green: CGFloat((int >> 8) & 0xFF) / 255, blue: CGFloat(int & 0xFF) / 255, alpha: 1)
    }
}