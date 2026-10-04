// Optional story-driven side quests. Unlocked by story progress, tracked
// from run summaries, completed independently of the main campaign.

function metricValue(summary, m) {
  return summary ? summary[m] || 0 : 0;
}

export const SIDE_QUESTS = [
  {
    id: "lost_transmission",
    name: "Lost Transmission",
    desc: "Recover hidden transmissions scattered through the Dead Sector.",
    lore: "Fragments of ORION's past linger in corrupted data caches.",
    unlockChapter: 2,
    objective: { mode: "sum", metric: "orbsCollected", target: 15 },
    reward: { credits: 120, xp: 150, database: ["orion_past"] },
    difficulty: "Normal",
  },
  {
    id: "ghost_in_grid",
    name: "Ghost in the Grid",
    desc: "Investigate a mysterious entity. Survive 75 seconds in a single run.",
    lore: "Something watches from between the sectors.",
    unlockChapter: 3,
    objective: { mode: "best", metric: "time", target: 75 },
    reward: { credits: 150, xp: 180, database: ["ghost_entity"] },
    difficulty: "Hard",
  },
  {
    id: "forgotten_pilot",
    name: "The Forgotten Pilot",
    desc: "Recover lost flight records. Reach a score of 8,000.",
    lore: "A pilot vanished here long ago. Their records remain.",
    unlockChapter: 4,
    objective: { mode: "best", metric: "score", target: 8000 },
    reward: { credits: 180, xp: 200, database: ["forgotten_pilot"] },
    difficulty: "Hard",
  },
  {
    id: "energy_crisis",
    name: "Energy Crisis",
    desc: "Stabilize the grid. Collect 60 energy fragments across your runs.",
    lore: "The grid hungers. Feed it, pilot.",
    unlockChapter: 2,
    objective: { mode: "sum", metric: "orbsCollected", target: 60 },
    reward: { credits: 200, xp: 220, database: ["nexus_core"] },
    difficulty: "Normal",
  },
];

// Skill-based side challenges: small, constrained runs (e.g. "no dashing")
// that test pure piloting. Each has a `check(summary)` evaluated from the
// run summary the engine emits, and grants bonus Neon Credits on first clear.
export const SKILL_CHALLENGES = [
  { id: "sc_pure_pilot", name: "Pure Pilot", desc: "Survive 30 seconds without dashing.", constraint: { noDash: true }, difficulty: "Normal", reward: { credits: 60, xp: 80 }, check: (s) => s.time >= 30 },
  { id: "sc_steady_hand", name: "Steady Hand", desc: "Survive 45 seconds without dashing.", constraint: { noDash: true }, difficulty: "Hard", reward: { credits: 100, xp: 120 }, check: (s) => s.time >= 45 },
  { id: "sc_close_calls", name: "Close Calls", desc: "Earn 20 near-misses without dashing.", constraint: { noDash: true }, difficulty: "Normal", reward: { credits: 120, xp: 130 }, check: (s) => s.nearMisses >= 20 },
  { id: "sc_zen_combo", name: "Zen Combo", desc: "Reach a x10 combo without dashing.", constraint: { noDash: true }, difficulty: "Hard", reward: { credits: 140, xp: 150 }, check: (s) => s.maxCombo >= 10 },
  { id: "sc_untouched", name: "Untouched", desc: "Survive 40 seconds without taking a single hit.", constraint: {}, difficulty: "Hard", reward: { credits: 150, xp: 160 }, check: (s) => s.time >= 40 && (s.damageTaken || 0) === 0 },
];

export function getSkillChallengeView(profile) {
  const done = profile.skillChallenges || {};
  return SKILL_CHALLENGES.map((c) => {
    const rec = done[c.id] || {};
    return { ...c, completed: !!rec.completed, best: rec.best || null };
  });
}

export function getActiveSideQuests(profile) {
  const completed = profile.sideQuests?.completed || [];
  const storyDone = profile.storyProgress?.completed || [];
  return SIDE_QUESTS.map((sq) => {
    const unlocked = storyDone.includes(sq.unlockChapter);
    const st = profile.sideQuests?.progress?.[sq.id] || { progress: 0 };
    const progress = Math.min(sq.objective.target, st.progress || 0);
    return { ...sq, unlocked, progress, complete: progress >= sq.objective.target, claimed: completed.includes(sq.id) };
  });
}

export function applyRunToSideQuests(profile, summary) {
  const prog = { ...(profile.sideQuests?.progress || {}) };
  const storyDone = profile.storyProgress?.completed || [];
  for (const sq of SIDE_QUESTS) {
    if (!storyDone.includes(sq.unlockChapter)) continue;
    const cur = prog[sq.id] || { progress: 0 };
    let np = cur.progress || 0;
    const o = sq.objective;
    if (o.mode === "best") np = Math.max(np, metricValue(summary, o.metric));
    else if (o.mode === "sum") np = np + metricValue(summary, o.metric);
    else if (o.mode === "count") np = np + 1;
    else if (o.mode === "cleanRun") np = np + ((summary.damageTaken || 0) === 0 ? 1 : 0);
    prog[sq.id] = { progress: np };
  }
  return {
    progress: prog,
    completed: [...(profile.sideQuests?.completed || [])],
  };
}