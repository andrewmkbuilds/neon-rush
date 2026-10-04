package com.company.neonrush

import android.annotation.SuppressLint
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.os.Message
import android.webkit.*
import android.widget.FrameLayout
import android.widget.ImageView
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {
    private lateinit var webView: WebView
    private var pendingWebPermissionRequest: PermissionRequest? = null

    // OAuth providers (Google, Apple, etc.) MUST stay inside the WebView — opening them
    // in Chrome logs the user into Chrome, not the app. Allow these to load in-app.
    private val authHosts = listOf(
        "accounts.google.com", "accounts.youtube.com", "appleid.apple.com",
        "apple.com", "icloud.com", "github.com", "login.microsoftonline.com",
        "facebook.com", "base44.com", "oauth.googleusercontent.com"
    )

    private fun isAllowedHost(host: String): Boolean {
        if (host.endsWith("the-neonrush.base44.app") || host.endsWith("accounts.google.com") || host.endsWith("apis.google.com") || host.endsWith("oauth2.googleapis.com") || host.endsWith("www.googleapis.com") || host.endsWith("appleid.apple.com") || host.endsWith("app.base44.com") || host.endsWith("api.base44.com") || host.endsWith("accounts.base44.com") || host.endsWith("lovable.dev") || host.endsWith("api.lovable.dev") || host.endsWith("github.com") || host.endsWith("api.github.com")) return true
        return authHosts.any { host == it || host.endsWith(".$it") }
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        // Swap off the splash theme so the splash art isn't left sitting behind the app.
        setTheme(R.style.AppTheme)
        super.onCreate(savedInstanceState)
        webView = WebView(this).apply {
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            settings.databaseEnabled = true
            settings.cacheMode = WebSettings.LOAD_DEFAULT
            settings.mediaPlaybackRequiresUserGesture = false
            settings.javaScriptCanOpenWindowsAutomatically = true
            settings.setSupportMultipleWindows(true)
            // Google's OAuth flow rejects the default Android WebView user agent
            // ("disallowed_useragent"). Use a Chrome UA so sign-in completes in-app.
            settings.userAgentString = "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
            // Allow 3rd-party cookies so the OAuth popup can set its session cookie.
            CookieManager.getInstance().setAcceptCookie(true)
            CookieManager.getInstance().setAcceptThirdPartyCookies(this, true)
            webViewClient = object : WebViewClient() {
                override fun onPageFinished(view: WebView?, url: String?) { super.onPageFinished(view, url); view?.evaluateJavascript("(function(){\n  fetch('https://appnative.base44.app/api/functions/checkWrapperSubscription',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({app_id:'6ac2a3905e8487f66dad5a60'})})\n  .then(function(r){return r.json()}).then(function(d){\n    if(d.active||document.getElementById('appnative-wrapper-banner'))return;\n    function openUpsell(){\n      if(document.getElementById('appnative-upsell'))return;\n      var o=document.createElement('div');o.id='appnative-upsell';\n      o.style.cssText='position:fixed;inset:0;z-index:2147483647;background:rgba(8,12,20,.72);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;padding:24px;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;';\n      var c=document.createElement('div');\n      c.style.cssText='background:#fff;color:#0f172a;border-radius:20px;max-width:360px;width:100%;padding:28px 24px;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,.4);';\n      c.innerHTML='<div style=\"width:56px;height:56px;border-radius:16px;margin:0 auto 16px;background:linear-gradient(135deg,#4f46e5,#06b6d4);display:flex;align-items:center;justify-content:center;font-size:28px\">📱</div>'\n        +'<h2 style=\"margin:0 0 8px;font-size:20px;font-weight:800\">Get Your Own Mobile App</h2>'\n        +'<p style=\"margin:0 0 20px;font-size:14px;line-height:1.5;color:#475569\">Launch your own branded iOS &amp; Android app on the App Store &amp; Google Play — no code, powered by AppNative.io.</p>'\n        +'<a href=\"https://appnative.io/\" target=\"_blank\" style=\"display:block;text-decoration:none;background:linear-gradient(135deg,#4f46e5,#06b6d4);color:#fff;border-radius:12px;padding:14px;font-size:15px;font-weight:700;margin-bottom:10px\">Get Started →</a>'\n        +'<button id=\"appnative-upsell-close\" style=\"width:100%;background:transparent;border:none;color:#64748b;font-size:14px;font-weight:600;padding:8px;cursor:pointer\">Maybe later</button>';\n      o.appendChild(c);\n      o.addEventListener('click',function(e){if(e.target===o)o.remove()});\n      document.body.appendChild(o);\n      document.getElementById('appnative-upsell-close').onclick=function(){o.remove()};\n    }\n    var b=document.createElement('a');b.id='appnative-wrapper-banner';b.href='#';\n    b.textContent=d.banner_text||'This App Was Wrapped By AppNative.io';\n    b.style.cssText='display:block;text-decoration:none;cursor:pointer;position:fixed;top:0;left:0;right:0;z-index:2147483646;background:#0f172a;color:#fff;text-align:center;font:600 13px -apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;padding:10px 12px;box-shadow:0 2px 12px rgba(0,0,0,.25);';\n    b.onclick=function(e){e.preventDefault();openUpsell()};\n    document.body.style.paddingTop='44px';document.body.appendChild(b);\n  }).catch(function(){})\n})();", null); hideSplashOverlay() }
                override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                    val url = request?.url ?: return false
                    val scheme = url.scheme ?: return false
                    if (scheme == "http" || scheme == "https") {
                        val host = url.host ?: return false
                        // Keep app + OAuth provider pages inside the WebView
                        if (isAllowedHost(host)) return false
                    }
                    // Everything else (browser, maps, tel:, mailto:, intent://, app links)
                    // hands off to the OS. Never let a missing handler crash the app.
                    openExternally(url)
                    return true
                }
            }
            // target="_blank" / window.open links arrive here instead of the main
            // WebViewClient. Android forbids reusing an already-navigated WebView as the
            // popup transport (and can crash before shouldOverrideUrlLoading runs), so use
            // a short-lived WebView that forwards the destination safely.
            webChromeClient = object : WebChromeClient() {
                override fun onCreateWindow(view: WebView?, isDialog: Boolean, isUserGesture: Boolean, resultMsg: Message?): Boolean {
                    val transport = resultMsg?.obj as? WebView.WebViewTransport ?: return false
                    val popup = WebView(this@MainActivity)
                    popup.webViewClient = object : WebViewClient() {
                        override fun shouldOverrideUrlLoading(child: WebView?, request: WebResourceRequest?): Boolean {
                            val popupUrl = request?.url ?: return false
                            val host = popupUrl.host
                            if ((popupUrl.scheme == "http" || popupUrl.scheme == "https") && host != null && isAllowedHost(host)) {
                                this@MainActivity.webView.loadUrl(popupUrl.toString())
                            } else {
                                openExternally(popupUrl)
                            }
                            child?.destroy()
                            return true
                        }
                    }
                    transport.webView = popup
                    resultMsg.sendToTarget()
                    return true
                }

                // Mic/camera are "dangerous" Android permissions: granting the WebView
                // request is silently ignored unless the matching OS runtime permission
                // was granted first. Ask the user, then grant the web request.
                override fun onPermissionRequest(request: PermissionRequest?) {
                    request ?: return
                    runOnUiThread {
                        val needed = mutableListOf<String>()
                        if (request.resources.contains(PermissionRequest.RESOURCE_AUDIO_CAPTURE)) needed.add(android.Manifest.permission.RECORD_AUDIO)
                        if (request.resources.contains(PermissionRequest.RESOURCE_VIDEO_CAPTURE)) needed.add(android.Manifest.permission.CAMERA)
                        val missing = needed.filter { this@MainActivity.checkSelfPermission(it) != android.content.pm.PackageManager.PERMISSION_GRANTED }
                        if (missing.isEmpty()) {
                            request.grant(request.resources)
                        } else {
                            pendingWebPermissionRequest = request
                            this@MainActivity.requestPermissions(missing.toTypedArray(), 1002)
                        }
                    }
                }
            }
            loadUrl(anLaunchUrl("https://the-neonrush.base44.app/"))
        }
        // Stage 2 splash: the OS splash only allows a solid color, so we draw the real
        // artwork over the WebView and fade it out once the web app has loaded.
        val root = FrameLayout(this)
        root.addView(webView, FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT))
        splashOverlay = buildSplashOverlay()
        root.addView(splashOverlay, FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT))
        setContentView(root)
        // Safety net: never leave the user staring at the splash if the page never finishes.
        root.postDelayed({ hideSplashOverlay() }, 12000)
        handleDeepLink(intent)
    }

    private var splashOverlay: android.view.View? = null

    // Centered logo: the logo sits centered on the brand splash color, like the iOS launch screen.
    private fun buildSplashOverlay(): android.view.View {
        val frame = FrameLayout(this)
        frame.setBackgroundColor(resources.getColor(R.color.splash_background, theme))
        val image = ImageView(this)
        image.setImageResource(R.drawable.splash_logo)
        image.scaleType = ImageView.ScaleType.FIT_CENTER
        val side = (180 * resources.displayMetrics.density).toInt()
        val params = FrameLayout.LayoutParams(side, side)
        params.gravity = android.view.Gravity.CENTER
        frame.addView(image, params)
        return frame
    }

    private fun hideSplashOverlay() {
        val overlay = splashOverlay ?: return
        splashOverlay = null
        overlay.animate().alpha(0f).setDuration(280).withEndAction {
            (overlay.parent as? android.view.ViewGroup)?.removeView(overlay)
        }.start()
    }

    // Opens a non-app URL in whatever the OS has for it (browser, Google Maps, dialer...).
    // intent:// links (what Google Maps "Directions" buttons emit) must be parsed with
    // parseUri; a plain ACTION_VIEW on them has no handler and throws
    // ActivityNotFoundException, which used to take the whole app down.
    private fun openExternally(url: android.net.Uri) {
        val raw = url.toString()
        try {
            if (url.scheme == "intent") {
                val intent = Intent.parseUri(raw, Intent.URI_INTENT_SCHEME)
                intent.addCategory(Intent.CATEGORY_BROWSABLE)
                intent.component = null
                intent.selector = null
                if (intent.resolveActivity(packageManager) != null) { startActivity(intent); return }
                val fallback = intent.getStringExtra("browser_fallback_url")
                if (!fallback.isNullOrEmpty()) { startActivity(Intent(Intent.ACTION_VIEW, android.net.Uri.parse(fallback))); return }
                val market = intent.`package`?.let { "https://play.google.com/store/apps/details?id=$it" }
                if (market != null) startActivity(Intent(Intent.ACTION_VIEW, android.net.Uri.parse(market)))
                return
            }
            startActivity(Intent(Intent.ACTION_VIEW, url))
        } catch (e: Exception) {
            // Unknown scheme with no app installed (e.g. comgooglemaps:// without Maps):
            // try the web equivalent for map links, otherwise just do nothing.
            val web = when (url.scheme) {
                "geo", "google.navigation", "comgooglemaps" -> "https://www.google.com/maps/search/?api=1&query=" + android.net.Uri.encode(url.schemeSpecificPart.substringAfter("q=").substringBefore("&"))
                else -> null
            }
            if (web != null) try { startActivity(Intent(Intent.ACTION_VIEW, android.net.Uri.parse(web))) } catch (_: Exception) {}
        }
    }

    override fun onBackPressed() {
        if (webView.canGoBack()) webView.goBack() else super.onBackPressed()
    }

    override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<out String>, grantResults: IntArray) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == 1002) {
            val request = pendingWebPermissionRequest ?: return
            pendingWebPermissionRequest = null
            if (grantResults.isNotEmpty() && grantResults.all { it == android.content.pm.PackageManager.PERMISSION_GRANTED }) {
                request.grant(request.resources)
            } else {
                request.deny()
            }
        }
    }

    // ---- AppNative Deep Links (push notification taps) ----
    private var anLaunchLinkConsumed = false

    // Cold start: if the launch intent carries a deep link, load THAT page first.
    // Pushing the path into a half-loaded page got wiped by the app's own initial
    // navigation (login -> home), which is why push taps used to land on home.
    private fun anLaunchUrl(defaultUrl: String): String {
        val path = anDeepLinkPath(intent) ?: return defaultUrl
        anLaunchLinkConsumed = true
        return "https://the-neonrush.base44.app" + path
    }

    private fun anDeepLinkPath(intent: Intent?): String? {
        intent ?: return null
        // Tapped push notification: the payload's deep_link value arrives as an
        // intent extra (FCM data keys become extras on the launch intent).
        val fromPush = intent.getStringExtra("deep_link")
        if (!fromPush.isNullOrBlank() && fromPush.startsWith("/")) return fromPush
        return null
    }

    // Warm open: app already running when the link / notification was opened.
    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        handleDeepLink(intent)
    }

    private fun handleDeepLink(intent: Intent?) {
        // Already loaded directly by anLaunchUrl on this cold start.
        if (anLaunchLinkConsumed) { anLaunchLinkConsumed = false; return }
        val path = anDeepLinkPath(intent) ?: return
        navigateToDeepLink(path, 0)
    }

    // Navigate the running SPA to the path. History API + popstate works with
    // React Router / most SPA routers; retries briefly if the page isn't ready.
    private fun navigateToDeepLink(path: String, attempt: Int) {
        val escaped = path.replace("\\", "\\\\").replace("'", "\\'")
        val js = "(function(){try{if(!window.history||!document.body){return 'err';}window.history.pushState({},'','" + escaped + "');window.dispatchEvent(new PopStateEvent('popstate'));return 'ok';}catch(e){return 'err';}})();"
        webView.evaluateJavascript(js) { result ->
            if (result != "\"ok\"" && attempt < 20) {
                webView.postDelayed({ navigateToDeepLink(path, attempt + 1) }, 500)
            }
        }
    }
}