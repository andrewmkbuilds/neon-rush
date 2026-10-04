// Daily Challenge: deterministic modifiers so every pilot faces the same
// conditions on the same day. The modifier set is seeded from today's date
// so all players get identical gameplay constraints and can compare scores.
import { MODIFIERS } from "./modifiers";

export function dateKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function seededRandom(seed) {
  let s = 0;
  for (let i = 0; i < seed.length; i++) s = (s * 31 + seed.charCodeAt(i)) % 100000;
  return s;
}

// Returns today's challenge: 2 modifiers picked deterministically from the pool.
export function getDailyChallenge() {
  const key = dateKey();
  let seed = seededRandom(key + "neon-rush-daily");
  const rng = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  const pool = [...MODIFIERS];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const chosen = pool.slice(0, 2);
  const modifiers = {};
  chosen.forEach((m) => { modifiers[m.id] = true; });
  return {
    date: key,
    modifiers,
    modNames: chosen.map((m) => m.name),
    modDetails: chosen,
  };
}