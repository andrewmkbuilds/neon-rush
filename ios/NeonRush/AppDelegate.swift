import UIKit
import WebKit

import UserNotifications

@main
class AppDelegate: UIResponder, UIApplicationDelegate, UNUserNotificationCenterDelegate {
    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Single splash: load the WebView immediately as the root, with a splash
        // overlay ON TOP of it. The system launch screen is background-color ONLY
        // (no logo), so there is exactly ONE logo on screen — no double/zoom flash.
        let webVC = WebViewController()
        self.window = UIWindow(frame: UIScreen.main.bounds)
        self.window?.rootViewController = webVC
        self.window?.makeKeyAndVisible()

        // Splash overlay matches the launch screen's background exactly so the
        // transition from system launch screen → overlay is seamless (no flash).
        let overlay = UIView(frame: UIScreen.main.bounds)
        overlay.backgroundColor = UIColor(hex: "#0A0F1C")
        overlay.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        if let img = UIImage(named: "SplashLogo") {
            let iv = UIImageView(image: img); iv.translatesAutoresizingMaskIntoConstraints = false; iv.contentMode = .scaleAspectFit
            overlay.addSubview(iv)
            NSLayoutConstraint.activate([iv.centerXAnchor.constraint(equalTo: overlay.centerXAnchor), iv.centerYAnchor.constraint(equalTo: overlay.centerYAnchor), iv.widthAnchor.constraint(lessThanOrEqualToConstant: 180), iv.heightAnchor.constraint(lessThanOrEqualToConstant: 180)])
        }
        self.window?.addSubview(overlay)

        let t0 = CFAbsoluteTimeGetCurrent()
        restoreCookies {
            WKWebsiteDataStore.default().httpCookieStore.add(self)
            let delay = max(0, 1.5 - (CFAbsoluteTimeGetCurrent() - t0))
            DispatchQueue.main.asyncAfter(deadline: .now() + delay) {
                UIView.animate(withDuration: 0.25, animations: { overlay.alpha = 0 }) { _ in overlay.removeFromSuperview() }
            }
        }

        UNUserNotificationCenter.current().delegate = self
        return true
    }


    // MARK: - Cookie Persistence (UserDefaults-backed)

    private func restoreCookies(completion: @escaping () -> Void) {
        guard let cookiesData = UserDefaults.standard.array(forKey: "persisted_cookies") as? [[String: Any]] else {
            completion()
            return
        }
        let cookies = cookiesData.compactMap { dict -> HTTPCookie? in
            var props: [HTTPCookiePropertyKey: Any] = [:]
            for (key, value) in dict { props[HTTPCookiePropertyKey(key)] = value }
            return HTTPCookie(properties: props)
        }
        guard !cookies.isEmpty else { completion(); return }

        let store = WKWebsiteDataStore.default().httpCookieStore
        let group = DispatchGroup()
        for cookie in cookies {
            group.enter()
            store.setCookie(cookie) { group.leave() }
        }
        group.notify(queue: .main) { completion() }
    }

    private func persistCookies() {
        WKWebsiteDataStore.default().httpCookieStore.getAllCookies { cookies in
            let cookieData = cookies.compactMap { $0.properties as? [String: Any] }
            UserDefaults.standard.set(cookieData, forKey: "persisted_cookies")
        }
    }

    // MARK: - Push Notifications

    func requestPushPermissionIfNeeded() {
        UNUserNotificationCenter.current().getNotificationSettings { settings in
            if settings.authorizationStatus == .notDetermined {
                UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .badge, .sound]) { granted, _ in
                    if granted {
                        DispatchQueue.main.async { UIApplication.shared.registerForRemoteNotifications() }
                    }
                }
            } else if settings.authorizationStatus == .authorized {
                DispatchQueue.main.async { UIApplication.shared.registerForRemoteNotifications() }
            }
        }
    }

    func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
        let token = deviceToken.map { String(format: "%02.2hhx", $0) }.joined()
        print("APNs device token: \(token)")
        UserDefaults.standard.set(token, forKey: "apns_device_token")
        if let vc = window?.rootViewController as? WebViewController {
            vc.registerPushToken(token)
            vc.registerTokenWithBackend(token)
        }
    }

    func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
        print("Failed to register for push: \(error.localizedDescription)")
    }

    func userNotificationCenter(_ center: UNUserNotificationCenter, willPresent notification: UNNotification, withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
        completionHandler([.banner, .badge, .sound])
    }

    // MARK: - App Lifecycle

    func applicationDidBecomeActive(_ application: UIApplication) {
        // Clear the app icon badge the instant the user opens the app. This is the
        // native, instant, offline-safe clear — it does NOT depend on a push round-trip.
        if #available(iOS 16.0, *) {
            UNUserNotificationCenter.current().setBadgeCount(0)
        } else {
            application.applicationIconBadgeNumber = 0
        }

        // Also reset the server-tracked counter so the next push starts back at 1.
        if let vc = window?.rootViewController as? WebViewController {
            vc.clearBadgeOnBackend()
        }
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
        persistCookies()
        if let vc = window?.rootViewController as? WebViewController {
            vc.flushWebData()
            vc.backupAuthToken()
        }
    }

    func applicationWillResignActive(_ application: UIApplication) {
        persistCookies()
        if let vc = window?.rootViewController as? WebViewController {
            vc.backupAuthToken()
        }
    }

    func applicationWillTerminate(_ application: UIApplication) {
        persistCookies()
        if let vc = window?.rootViewController as? WebViewController {
            vc.flushWebData()
            vc.backupAuthToken()
        }
    }
}

// MARK: - Cookie Observer
extension AppDelegate: WKHTTPCookieStoreObserver {
    func cookiesDidChange(in cookieStore: WKHTTPCookieStore) {
        persistCookies()
    }
}
