// Daily challenges + achievements definitions.

export const ACHIEVEMENTS = [
  { id: "first_flight", name: "First Flight", desc: "Complete your first run.", icon: "Rocket" },
  { id: "survivor", name: "Survivor", desc: "Survive for 60 seconds in a single run.", icon: "Shield" },
  { id: "untouchable", name: "Untouchable", desc: "Finish a run without taking damage.", icon: "Feather" },
  { id: "combo_master", name: "Combo Master", desc: "Reach a x8 near-miss multiplier.", icon: "Flame" },
  { id: "energy_hunter", name: "Energy Hunter", desc: "Collect 100 energy orbs total.", icon: "Zap" },
  { id: "speed_demon", name: "Speed Demon", desc: "Reach wave 8.", icon: "Gauge" },
  { id: "neon_legend", name: "Neon Legend", desc: "Set a new personal best score.", icon: "Trophy" },
  { id: "marathon", name: "Marathon Runner", desc: "Survive for 120 seconds in a single run.", icon: "Shield" },
];

// In-run milestones — checked live during a run; grant bonus Neon Credits + toast when met.
export const MILESTONES = [
  { id: "orbs_10", name: "Orb Collector", reward: 20, check: (s) => s.orbsCollected >= 10 },
  { id: "orbs_25", name: "Orb Hoarder", reward: 30, check: (s) => s.orbsCollected >= 25 },
  { id: "orbs_50", name: "Orb Master", reward: 50, check: (s) => s.orbsCollected >= 50 },
  { id: "clean3", name: "Clean Run", reward: 30, check: (s) => s.cleanWaves >= 3 },
  { id: "clean5", name: "Untouchable", reward: 60, check: (s) => s.cleanWaves >= 5 },
  { id: "nearmiss_20", name: "Daredevil", reward: 30, check: (s) => s.nearMisses >= 20 },
  { id: "nearmiss_50", name: "Grim Reaper", reward: 60, check: (s) => s.nearMisses >= 50 },
  { id: "survive_60", name: "Endurance", reward: 40, check: (s) => s.time >= 60 },
  { id: "survive_120", name: "Marathoner", reward: 80, check: (s) => s.time >= 120 },
];

const CHALLENGE_POOL = [
  { id: "survive60", desc: "Survive for 60 seconds in a single run.", target: 60, reward: 60, type: "survive" },
  { id: "collect20", desc: "Collect 20 energy orbs in a single run.", target: 20, reward: 50, type: "collect" },
  { id: "combo5", desc: "Reach a x5 near-miss combo.", target: 5, reward: 80, type: "combo" },
  { id: "nodash", desc: "Complete a run without using Dash.", target: 1, reward: 70, type: "nodash" },
  { id: "nearmiss10", desc: "Perform 10 near misses in a single run.", target: 10, reward: 60, type: "nearmiss" },
  { id: "wave5", desc: "Reach wave 5.", target: 5, reward: 75, type: "wave" },
  { id: "collect200", desc: "Collect 200 energy orbs today across all your runs.", target: 200, reward: 120, type: "collectTotal" },
  { id: "nearmiss100", desc: "Perform 100 near misses today across all your runs.", target: 100, reward: 150, type: "nearmissTotal" },
  { id: "score5000", desc: "Score 5,000 points today across all your runs.", target: 5000, reward: 100, type: "scoreTotal" },
];

function dateKey(d = new Date()) {
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function seededRandom(seed) {
  let s = 0;
  for (let i = 0; i < seed.length; i++) s = (s * 31 + seed.charCodeAt(i)) % 100000;
  return s;
}

export function getTodayChallenge() {
  const key = dateKey();
  const idx = seededRandom(key) % CHALLENGE_POOL.length;
  return { ...CHALLENGE_POOL[idx], date: key };
}

// Evaluate run summary against achievements + challenge. Returns newly unlocked + challenge progress.
export function evaluateRun(profile, summary) {
  const newlyUnlocked = [];
  const ach = profile.achievements;
  const check = (id, cond) => {
    if (!ach[id] && cond) { ach[id] = true; newlyUnlocked.push(id); }
  };
  check("first_flight", true);
  check("survivor", summary.time >= 60);
  check("untouchable", summary.damageTaken === 0);
  check("combo_master", summary.maxCombo >= 8);
  check("energy_hunter", profile.totalEnergy >= 100);
  check("speed_demon", summary.wave >= 8);
  check("neon_legend", summary.isNewBest);
  check("marathon", summary.time >= 120);

  // challenge progress
  const today = getTodayChallenge();
  let challenge = profile.challenge;
  if (!challenge || challenge.date !== today.date || challenge.id !== today.id) {
    challenge = { date: today.date, id: today.id, progress: 0, completed: false, claimed: false };
  }
  let progress = challenge.progress;
  let completed = challenge.completed;
  if (today.type === "survive") progress = Math.max(progress, summary.time);
  else if (today.type === "collect") progress = Math.max(progress, summary.orbsCollected);
  else if (today.type === "combo") progress = Math.max(progress, summary.maxCombo);
  else if (today.type === "nodash") progress = summary.dashUsed ? progress : 1;
  else if (today.type === "nearmiss") progress = Math.max(progress, summary.nearMisses);
  else if (today.type === "wave") progress = Math.max(progress, summary.wave);
  else if (today.type === "collectTotal") progress = progress + (summary.orbsCollected || 0);
  else if (today.type === "nearmissTotal") progress = progress + (summary.nearMisses || 0);
  else if (today.type === "scoreTotal") progress = progress + Math.floor(summary.score || 0);
  if (progress >= today.target) completed = true;
  challenge = { ...challenge, progress, completed };

  return { achievements: ach, newlyUnlocked, challenge };
}