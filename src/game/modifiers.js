// Pre-run modifiers: each one makes the run harder and adds to the score multiplier.
// Pure data (no React imports) so the engine can read `modBonus` without pulling UI deps.
export const MODIFIERS = [
  { id: "fasterProjectiles", name: "Faster Projectiles", desc: "All threats move 25% faster.", mult: 0.5, color: "#FF2E93" },
  { id: "denseWaves", name: "Increased Density", desc: "+2 extra threats every wave.", mult: 0.5, color: "#A855F7" },
  { id: "longDashCd", name: "Sluggish Dash", desc: "Dash cooldown doubled.", mult: 0.4, color: "#22D3EE" },
  { id: "fragile", name: "Fragile Hull", desc: "Start with 1 fewer hull plate.", mult: 0.6, color: "#FF3B5C" },
];

// Total score-multiplier bonus from the active modifiers (sum of their .mult values).
export function modBonus(mods) {
  if (!mods) return 0;
  return MODIFIERS.reduce((a, m) => a + (mods[m.id] ? m.mult : 0), 0);
}