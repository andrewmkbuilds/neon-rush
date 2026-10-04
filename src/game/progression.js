// Unified progression: XP, levels, and credit rewards shared across all modes.
// Cosmetics only — no pay-to-win, no gameplay advantages.

export function xpForLevel(level) {
  return Math.floor(100 * Math.pow(Math.max(0, level - 1), 1.5));
}

export function levelFromXp(xp) {
  let lvl = 1;
  while (xpForLevel(lvl + 1) <= xp) lvl++;
  return lvl;
}

export function levelProgress(xp) {
  const level = levelFromXp(xp || 0);
  const cur = xpForLevel(level);
  const next = xpForLevel(level + 1);
  const span = Math.max(1, next - cur);
  const into = (xp || 0) - cur;
  return { level, cur, next, into, span, pct: Math.min(1, into / span) };
}

// Award xp + credits. Returns { profile, leveledUp, newLevel }.
export function grantRewards(profile, { xp = 0, credits = 0 } = {}) {
  const oldLevel = levelFromXp(profile.xp || 0);
  const newXp = (profile.xp || 0) + xp;
  const newLevel = levelFromXp(newXp);
  return {
    profile: {
      ...profile,
      xp: newXp,
      level: newLevel,
      neonCredits: (profile.neonCredits || 0) + credits,
    },
    leveledUp: newLevel > oldLevel,
    newLevel,
  };
}