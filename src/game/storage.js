// Local persistence for guest play. All progress stored in localStorage.
import { base44 } from "@/api/base44Client";

const KEY = "neon_rush_profile_v1";
const LB_KEY = "neon_rush_leaderboard_v1";

const DEFAULT_PROFILE = {
  name: "PILOT-0001",
  totalRuns: 0,
  bestScore: 0,
  totalSurvival: 0,
  totalEnergy: 0,
  bestCombo: 0,
  maxWave: 0,
  totalNearMisses: 0,
  bestSurvival: 0,
  ownedSkins: ["default"],
  equippedSkin: "default",
  neonCredits: 500, // premium "makeup" currency (demo — no real money)
  lastDailyReward: null, // YYYY-MM-DD of last daily reward claim (UTC)
  loginStreak: 0, // consecutive-day login streak
  lastLoginDate: null, // YYYY-MM-DD of last login (for streak calc)
  achievements: {}, // id -> true
  milestones: [], // ids of in-run milestones ever achieved
  challenge: { date: null, id: null, progress: 0, completed: false, claimed: false },
  settings: { musicOn: true, sfxOn: true, musicVolume: 0.4, sfxVolume: 0.6, discordWebhook: "" },
  unlockedAbilities: { dash: true, shield: false, slow: false },
  // --- expansion progression (offline, locally persisted) ---
  xp: 0,
  level: 1,
  titles: [],
  storyProgress: { completed: [], current: 1, ending: null },
  missions: { daily: { date: null, items: {} }, weekly: { week: null, items: {} } },
  sideQuests: { progress: {}, completed: [] },
  database: { unlocked: [] },
  arcade: { highScores: {}, played: [] },
  skillChallenges: {}, // id -> { completed, best }
  upgrades: {}, // id -> purchased tier
  notified: { dailyDate: null, week: null, sq: [] }, // availability-notification state
};

export function loadProfile() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT_PROFILE };
    const p = JSON.parse(raw);
    return {
      ...DEFAULT_PROFILE,
      ...p,
      settings: { ...DEFAULT_PROFILE.settings, ...(p.settings || {}) },
      unlockedAbilities: { ...DEFAULT_PROFILE.unlockedAbilities, ...(p.unlockedAbilities || {}) },
      ownedSkins: p.ownedSkins || ["default"],
      achievements: p.achievements || {},
      milestones: p.milestones || [],
      challenge: { ...DEFAULT_PROFILE.challenge, ...(p.challenge || {}) },
      xp: p.xp || 0,
      level: p.level || 1,
      titles: p.titles || [],
      storyProgress: { ...DEFAULT_PROFILE.storyProgress, ...(p.storyProgress || {}) },
      missions: p.missions
        ? {
            daily: { date: p.missions.daily?.date ?? null, items: p.missions.daily?.items || {} },
            weekly: { week: p.missions.weekly?.week ?? null, items: p.missions.weekly?.items || {} },
          }
        : DEFAULT_PROFILE.missions,
      sideQuests: { progress: p.sideQuests?.progress || {}, completed: p.sideQuests?.completed || [] },
      database: { unlocked: p.database?.unlocked || [] },
      arcade: { highScores: p.arcade?.highScores || {}, played: p.arcade?.played || [] },
      skillChallenges: p.skillChallenges || {},
      upgrades: p.upgrades || {},
      notified: { dailyDate: null, week: null, sq: [], ...(p.notified || {}) },
    };
  } catch {
    return { ...DEFAULT_PROFILE };
  }
}

export function saveProfile(p) {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* ignore quota */
  }
}

// --- Leaderboard (local) ---
export function loadLeaderboard() {
  try {
    const raw = localStorage.getItem(LB_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function submitScoreLocal(entry) {
  const lb = loadLeaderboard();
  // basic server-side-style validation: clamp values
  const clean = {
    name: String(entry.name || "PILOT").slice(0, 16),
    score: Math.max(0, Math.min(9999999, Math.floor(entry.score || 0))),
    time: Math.max(0, Math.floor(entry.time || 0)),
    wave: Math.max(0, Math.floor(entry.wave || 0)),
    energy: Math.max(0, Math.floor(entry.energy || 0)),
    orbs: Math.max(0, Math.floor(entry.orbs || 0)),
    maxCombo: Math.max(0, Math.floor(entry.maxCombo || 0)),
    difficulty: String(entry.difficulty || "normal"),
    date: Date.now(),
  };
  lb.push(clean);
  lb.sort((a, b) => b.score - a.score);
  const trimmed = lb.slice(0, 100);
  try {
    localStorage.setItem(LB_KEY, JSON.stringify(trimmed));
  } catch {
    /* ignore */
  }
  return clean;
}

export function getLeaderboardSections(name) {
  const lb = loadLeaderboard();
  const now = Date.now();
  const weekAgo = now - 7 * 24 * 3600 * 1000;
  const allTime = [...lb].sort((a, b) => b.score - a.score).slice(0, 50);
  const weekly = lb.filter((e) => e.date >= weekAgo).sort((a, b) => b.score - a.score).slice(0, 50);
  const personal = lb.filter((e) => e.name === name).sort((a, b) => b.score - a.score).slice(0, 20);
  return { allTime, weekly, personal };
}

// --- Global leaderboard (Base44 backend entity, real-time) ---
// The global leaderboard is online-only. When the player is offline we avoid
// hanging network requests, keep local scores available, and queue any score
// submissions for a safe sync when connectivity returns (flushPendingScores).
const PENDING_KEY = "neon_rush_pending_scores_v1";
const isOnline = () => (typeof navigator !== "undefined" ? navigator.onLine : true);

function loadPending() {
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
function savePending(list) {
  try {
    localStorage.setItem(PENDING_KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

export function getPendingScores() {
  return loadPending();
}

export async function submitGlobalScore(entry) {
  const clean = {
    player_name: String(entry.name || "PILOT").slice(0, 16),
    score: Math.max(0, Math.min(9999999, Math.floor(entry.score || 0))),
    wave: Math.max(0, Math.floor(entry.wave || 0)),
    max_combo: Math.max(0, Math.floor(entry.maxCombo || 0)),
    duration: Math.max(0, Math.floor(entry.time || 0)),
    skin: String(entry.skin || "default"),
    energy: Math.max(0, Math.floor(entry.energy || 0)),
    difficulty: String(entry.difficulty || "normal"),
    badges: Array.isArray(entry.badges) ? entry.badges.slice(0, 12) : [],
    path: Array.isArray(entry.path) ? entry.path.slice(0, 400) : [],
  };
  // Offline: don't attempt a round-trip — queue for later sync.
  if (!isOnline()) {
    const q = loadPending();
    q.push({ id: Date.now() + "-" + Math.random().toString(36).slice(2, 8), ...clean });
    savePending(q);
    return null;
  }
  try {
    await base44.entities.Score.create(clean);
    return clean;
  } catch (e) {
    // Network/permission failure — keep the run locally so it can sync later.
    const q = loadPending();
    q.push({ id: Date.now() + "-" + Math.random().toString(36).slice(2, 8), ...clean });
    savePending(q);
    return null;
  }
}

// Retry queued submissions when the connection is back. A run is only removed
// from the queue after a confirmed successful create, so scores are never
// duplicated. Returns the number of runs synced. Never throws.
export async function flushPendingScores() {
  if (!isOnline()) return 0;
  const q = loadPending();
  if (q.length === 0) return 0;
  let synced = 0;
  const remaining = [];
  for (const item of q) {
    try {
      await base44.entities.Score.create(item);
      synced++;
    } catch (e) {
      remaining.push(item);
    }
  }
  savePending(remaining);
  return synced;
}

export async function fetchGlobalScores() {
  if (!isOnline()) return [];
  try {
    return await base44.entities.Score.list("-score", 50);
  } catch (e) {
    return [];
  }
}

export function subscribeGlobalScores(cb) {
  if (!isOnline()) return () => {};
  try {
    return base44.entities.Score.subscribe((event) => cb(event));
  } catch (e) {
    return () => {};
  }
}

// --- Best run ghost path (for the in-run Ghost practice trail) ---
const BEST_PATH_KEY = "neon_rush_best_path_v1";
export function getBestPath() {
  try {
    const raw = localStorage.getItem(BEST_PATH_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw);
    return p && Array.isArray(p.path) ? p : null;
  } catch {
    return null;
  }
}
export function saveBestPath(path, score) {
  try {
    localStorage.setItem(BEST_PATH_KEY, JSON.stringify({ path, score, date: Date.now() }));
  } catch {
    /* ignore */
  }
}

// Wipe all local NEON RUSH data (profile, leaderboard, best-path ghost).
// Used by the "Delete Account" flow for guest/local players.
export function clearAllLocalData() {
  try {
    localStorage.removeItem(KEY);
    localStorage.removeItem(LB_KEY);
    localStorage.removeItem(BEST_PATH_KEY);
  } catch {
    /* ignore */
  }
}

// Export all locally stored runs as a CSV file (importable into Google Sheets).
export function exportRunsCSV() {
  const lb = loadLeaderboard();
  const headers = ["Date", "Name", "Score", "Wave", "Time (s)", "Energy", "Orbs", "Max Combo", "Difficulty"];
  const rows = [...lb].sort((a, b) => a.date - b.date).map((r) => [
    new Date(r.date).toISOString(),
    r.name,
    r.score,
    r.wave,
    r.time,
    r.energy,
    r.orbs,
    r.maxCombo,
    r.difficulty,
  ]);
  const csv = [headers, ...rows]
    .map((row) => row.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `neon-rush-runs-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}