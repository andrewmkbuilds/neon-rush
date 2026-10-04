// Daily & weekly missions. All objectives are evaluated from the run summary
// the survival engine already emits, so missions work fully offline with no
// engine changes.

const DAILY_POOL = [
  { id: "d_survive60", desc: "Survive for 60 seconds in one run", mode: "best", metric: "time", target: 60, difficulty: "Easy", reward: { credits: 30, xp: 50 } },
  { id: "d_energy20", desc: "Collect 20 energy fragments", mode: "sum", metric: "orbsCollected", target: 20, difficulty: "Easy", reward: { credits: 30, xp: 50 } },
  { id: "d_nearmiss10", desc: "Perform 10 near-misses", mode: "sum", metric: "nearMisses", target: 10, difficulty: "Easy", reward: { credits: 30, xp: 50 } },
  { id: "d_score5000", desc: "Reach a score of 5,000", mode: "best", metric: "score", target: 5000, difficulty: "Normal", reward: { credits: 40, xp: 60 } },
  { id: "d_dash5", desc: "Use dash 5 times", mode: "sum", metric: "dashUsed", target: 5, difficulty: "Easy", reward: { credits: 30, xp: 50 } },
  { id: "d_wave5", desc: "Reach wave 5", mode: "best", metric: "wave", target: 5, difficulty: "Normal", reward: { credits: 40, xp: 60 } },
  { id: "d_combo10", desc: "Reach a x10 combo", mode: "best", metric: "maxCombo", target: 10, difficulty: "Normal", reward: { credits: 40, xp: 60 } },
  { id: "d_cleanrun", desc: "Complete a run without taking damage", mode: "cleanRun", target: 1, difficulty: "Hard", reward: { credits: 60, xp: 80 } },
];

const WEEKLY_POOL = [
  { id: "w_runs5", desc: "Complete 5 survival runs", mode: "count", target: 5, difficulty: "Normal", reward: { credits: 100, xp: 150 } },
  { id: "w_score10000", desc: "Reach a score of 10,000", mode: "best", metric: "score", target: 10000, difficulty: "Hard", reward: { credits: 120, xp: 180 } },
  { id: "w_nearmiss100", desc: "Earn 100 near-misses", mode: "sum", metric: "nearMisses", target: 100, difficulty: "Hard", reward: { credits: 120, xp: 180 } },
  { id: "w_energy100", desc: "Collect 100 energy fragments", mode: "sum", metric: "orbsCollected", target: 100, difficulty: "Normal", reward: { credits: 120, xp: 180 } },
  { id: "w_wave10", desc: "Reach wave 10", mode: "best", metric: "wave", target: 10, difficulty: "Hard", reward: { credits: 140, xp: 200 } },
  { id: "w_combo20", desc: "Reach a x20 combo", mode: "best", metric: "maxCombo", target: 20, difficulty: "Hard", reward: { credits: 140, xp: 200 } },
];

function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}
function pickN(pool, seed, n) {
  const idx = pool.map((_, i) => i);
  const out = [];
  let s = seed || 1;
  while (out.length < n && idx.length) {
    s = (s * 1103515245 + 12345) >>> 0;
    const k = s % idx.length;
    out.push(pool[idx[k]]);
    idx.splice(k, 1);
  }
  return out;
}

export function todayKey(d = new Date()) {
  return d.toISOString().slice(0, 10);
}
export function weekKey(d = new Date()) {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = (date.getUTCDay() + 6) % 7; // Monday = 0
  date.setUTCDate(date.getUTCDate() - day);
  return date.toISOString().slice(0, 10);
}

export function getDailyMissions(dateStr) {
  return pickN(DAILY_POOL, hashStr(dateStr || todayKey()), 3);
}
export function getWeeklyMissions(weekStr) {
  return pickN(WEEKLY_POOL, hashStr(weekStr || weekKey()), 3);
}

// Reset stored mission progress when the day/week rolls over.
export function syncMissionSchedules(profile) {
  const d = todayKey();
  const w = weekKey();
  const m = profile.missions || { daily: { date: null, items: {} }, weekly: { week: null, items: {} } };
  const daily = m.daily && m.daily.date === d ? m.daily : { date: d, items: {} };
  const weekly = m.weekly && m.weekly.week === w ? m.weekly : { week: w, items: {} };
  return { daily, weekly };
}

function metricValue(summary, metric) {
  if (!summary) return 0;
  return summary[metric] || 0;
}

// Difficulty tier + credit multiplier for missions cleared on higher settings.
export function diffTier(d) {
  return d === "hard" ? 3 : d === "normal" ? 2 : 1;
}
export function missionCreditMultiplier(bestDiff) {
  if (bestDiff >= 3) return 1.5;
  if (bestDiff === 2) return 1.25;
  return 1;
}

// Update mission progress from a run summary. Does NOT award rewards —
// claiming does. Returns a new profile object.
export function applyRunToMissions(profile, summary) {
  const p = { ...profile };
  p.missions = syncMissionSchedules(profile);
  const updateGroup = (group, defs) => {
    const items = { ...group.items };
    const dTier = diffTier(summary.difficulty);
    for (const def of defs) {
      const cur = items[def.id] || { progress: 0, claimed: false, bestDiff: 0 };
      let np = cur.progress || 0;
      if (def.mode === "best") np = Math.max(np, metricValue(summary, def.metric));
      else if (def.mode === "sum") np = np + metricValue(summary, def.metric);
      else if (def.mode === "count") np = np + 1;
      else if (def.mode === "cleanRun") np = np + ((summary.damageTaken || 0) === 0 ? 1 : 0);
      items[def.id] = { progress: np, claimed: !!cur.claimed, bestDiff: Math.max(cur.bestDiff || 0, dTier) };
    }
    return { ...group, items };
  };
  p.missions.daily = updateGroup(p.missions.daily, getDailyMissions(p.missions.daily.date));
  p.missions.weekly = updateGroup(p.missions.weekly, getWeeklyMissions(p.missions.weekly.week));
  return p;
}

// Active missions merged with live progress for display.
export function getMissionView(profile) {
  const m = syncMissionSchedules(profile);
  const build = (group, defs) =>
    defs.map((def) => {
      const st = group.items[def.id] || { progress: 0, claimed: false, bestDiff: 0 };
      const progress = Math.min(def.target, st.progress || 0);
      const bestDiff = st.bestDiff || 0;
      return { ...def, progress, claimed: !!st.claimed, complete: progress >= def.target, bestDiff, multiplier: missionCreditMultiplier(bestDiff) };
    });
  return {
    daily: build(m.daily, getDailyMissions(m.daily.date)),
    weekly: build(m.weekly, getWeeklyMissions(m.weekly.week)),
  };
}