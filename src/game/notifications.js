// Desktop notification helpers — login-streak reminders for inactive players.
const GAME_URL = "https://the-neonrush.base44.app";
const SEEN_KEY = "neon_rush_last_seen";

export function notifSupported() {
  return typeof window !== "undefined" && "Notification" in window;
}

export function getLastSeen() {
  try { return Number(localStorage.getItem(SEEN_KEY)) || 0; } catch { return 0; }
}

export function setLastSeen(ts = Date.now()) {
  try { localStorage.setItem(SEEN_KEY, String(ts)); } catch { /* ignore */ }
}

export async function ensurePermission() {
  if (!notifSupported()) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  try { return (await Notification.requestPermission()) === "granted"; }
  catch { return false; }
}

export function showStreakReminder(streak) {
  if (!notifSupported() || Notification.permission !== "granted") return;
  try {
    const n = new Notification("🚀 NEON RUSH misses you, pilot!", {
      body: streak > 0
        ? `Your ${streak}-day login streak is waiting — jump back in to keep it alive and claim bonus Neon Credits.`
        : `Jump back into the neon arena and claim your daily Neon Credits.`,
      tag: "nr-streak-reminder",
      data: { url: GAME_URL },
    });
    n.onclick = () => { window.focus(); n.close(); };
  } catch { /* notifications can be blocked; ignore */ }
}