import UIKit
import WebKit
import Security

// Standalone Keychain bridge for the wrapped web app — secure key-value storage
// WITHOUT biometric gating (works on every device, no Face ID required).
// The web app calls it via window.AppNative.keychain.* (all Promise-based):
//   setItem(key, value) / getItem(key) / removeItem(key) / hasItem(key)
final class KeychainBridgeHandler: NSObject, WKScriptMessageHandler {
    private weak var webView: WKWebView?
    private static let keychainService = "appnative.keychain"

    init(webView: WKWebView) {
        self.webView = webView
        super.init()
    }

    static let shimJS = """
    (function(){
      if (window.AppNative && window.AppNative.keychain) return;
      window.AppNative = window.AppNative || {};
      window.AppNative._keychainCallbacks = window.AppNative._keychainCallbacks || {};
      function call(action, payload){
        return new Promise(function(resolve){
          var id = 'kc_' + Date.now() + '_' + Math.random().toString(36).slice(2,8);
          window.AppNative._keychainCallbacks[id] = resolve;
          try {
            window.webkit.messageHandlers.appNativeKeychain.postMessage(Object.assign({action: action, callbackId: id}, payload || {}));
          } catch(e){ resolve({success:false, error:'bridge_unavailable'}); }
        });
      }
      window.AppNative.keychain = {
        setItem: function(key, value){ return call('setItem', {key: key, value: value}); },
        getItem: function(key){ return call('getItem', {key: key}); },
        removeItem: function(key){ return call('removeItem', {key: key}); },
        hasItem: function(key){ return call('hasItem', {key: key}); },
        platform: 'ios'
      };
      window.ShipWrap = window.AppNative;
    })();
    """

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard message.name == "appNativeKeychain",
              let body = message.body as? [String: Any],
              let action = body["action"] as? String,
              let callbackId = body["callbackId"] as? String else { return }
        guard let key = body["key"] as? String, !key.isEmpty else {
            replyToWeb(callbackId: callbackId, payload: ["success": false, "error": "missing_key"]); return
        }

        switch action {
        case "setItem":
            guard let value = body["value"] as? String else {
                replyToWeb(callbackId: callbackId, payload: ["success": false, "error": "missing_value"]); return
            }
            replyToWeb(callbackId: callbackId, payload: ["success": setItem(key: key, value: value)])
        case "getItem":
            if let value = getItem(key: key) {
                replyToWeb(callbackId: callbackId, payload: ["success": true, "value": value])
            } else {
                replyToWeb(callbackId: callbackId, payload: ["success": false, "error": "not_found"])
            }
        case "removeItem":
            replyToWeb(callbackId: callbackId, payload: ["success": removeItem(key: key)])
        case "hasItem":
            replyToWeb(callbackId: callbackId, payload: ["hasItem": getItem(key: key) != nil])
        default:
            replyToWeb(callbackId: callbackId, payload: ["error": "unknown_action"])
        }
    }

    private func replyToWeb(callbackId: String, payload: [String: Any]) {
        guard let data = try? JSONSerialization.data(withJSONObject: payload),
              let json = String(data: data, encoding: .utf8) else { return }
        let js = "if (window.AppNative && window.AppNative._keychainCallbacks && window.AppNative._keychainCallbacks['\(callbackId)']) { window.AppNative._keychainCallbacks['\(callbackId)'](\(json)); delete window.AppNative._keychainCallbacks['\(callbackId)']; }"
        DispatchQueue.main.async { self.webView?.evaluateJavaScript(js, completionHandler: nil) }
    }

    private func baseQuery(key: String) -> [String: Any] {
        return [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: Self.keychainService,
            kSecAttrAccount as String: key,
        ]
    }

    private func setItem(key: String, value: String) -> Bool {
        _ = removeItem(key: key) // overwrite any existing value
        guard let data = value.data(using: .utf8) else { return false }
        var query = baseQuery(key: key)
        query[kSecValueData as String] = data
        query[kSecAttrAccessible as String] = kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly
        return SecItemAdd(query as CFDictionary, nil) == errSecSuccess
    }

    private func getItem(key: String) -> String? {
        var query = baseQuery(key: key)
        query[kSecReturnData as String] = true
        query[kSecMatchLimit as String] = kSecMatchLimitOne
        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)
        guard status == errSecSuccess, let data = result as? Data else { return nil }
        return String(data: data, encoding: .utf8)
    }

    private func removeItem(key: String) -> Bool {
        let status = SecItemDelete(baseQuery(key: key) as CFDictionary)
        return status == errSecSuccess || status == errSecItemNotFound
    }
}

extension WebViewController {
    // Wired into the END of viewDidLoad at CI time (perl injection, verified in the workflow).
    // WKUserContentController retains the handler, so no extra storage is needed.
    func setupKeychainBridge() {
        guard let wv = webView else { return }
        let ucc = wv.configuration.userContentController
        let handler = KeychainBridgeHandler(webView: wv)
        ucc.add(handler, name: "appNativeKeychain")
        // Covers every navigation from here on.
        ucc.addUserScript(WKUserScript(source: KeychainBridgeHandler.shimJS, injectionTime: .atDocumentStart, forMainFrameOnly: false))
        // The initial page load is already in flight when this runs, so a user script added
        // now may miss it — evaluate the (idempotent) shim directly a few times as cover.
        for delay in [1.0, 3.0, 6.0] {
            DispatchQueue.main.asyncAfter(deadline: .now() + delay) { [weak self] in
                self?.webView?.evaluateJavaScript(KeychainBridgeHandler.shimJS, completionHandler: nil)
            }
        }
    }
}
