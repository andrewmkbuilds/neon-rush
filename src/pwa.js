// Runtime PWA bootstrap. index.html is platform-managed, so the web app
// manifest link is injected here and the service worker is registered only in
// production (never in dev, to avoid interfering with HMR).
export function initPWA() {
  if (typeof document !== "undefined") {
    const link = document.createElement("link");
    link.rel = "manifest";
    link.href = "/manifest.webmanifest";
    document.head.appendChild(link);
  }
  if ("serviceWorker" in navigator && import.meta.env.PROD) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Best-effort: a host that won't serve /sw.js simply stays without
        // offline shell caching. The game still runs normally.
      });
    });
  }
}