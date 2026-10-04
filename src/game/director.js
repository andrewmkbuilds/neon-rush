// Run Director: controlled variety + pacing for NEON RUSH survival runs.
// Picks wave themes and rotates in-run objectives while avoiding repetition.

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

export const WAVE_THEMES = [
  { id: "standard", name: "STANDARD PATROL", color: "#00F5FF", weight: 4, minTime: 0 },
  { id: "energy_storm", name: "ENERGY STORM", color: "#FFD166", weight: 2, minTime: 10 },
  { id: "hunter_wave", name: "HUNTER WAVE", color: "#FF2E93", weight: 2, minTime: 25 },
  { id: "laser_carnage", name: "LASER CARNAGE", color: "#A855F7", weight: 2, minTime: 40 },
  { id: "bonus_round", name: "BONUS ROUND", color: "#34D399", weight: 1, minTime: 20 },
  { id: "gravity_shift", name: "GRAVITY SHIFT", color: "#22D3EE", weight: 1, minTime: 55 },
  { id: "gauntlet", name: "SURVIVAL GAUNTLET", color: "#FF8A3D", weight: 1, minTime: 90 },
];

export const OBJECTIVES = [
  { id: "orbs", name: "Collect 12 energy fragments", target: 12, reward: 200, kind: "orbs", time: 35 },
  { id: "nearmiss", name: "Perform 8 near-misses", target: 8, reward: 250, kind: "nearmiss", time: 35 },
  { id: "clean", name: "Survive 25s without damage", target: 25, reward: 300, kind: "clean", time: 30 },
  { id: "gold", name: "Collect a golden fragment", target: 1, reward: 350, kind: "gold", time: 40 },
  { id: "combo", name: "Reach a x6 combo", target: 6, reward: 300, kind: "combo", time: 40 },
  { id: "nodash", name: "Survive 20s using 1 dash max", target: 20, reward: 280, kind: "nodash", time: 25 },
];

export class RunDirector {
  constructor() { this.reset(); }
  reset() {
    this.recentThemes = [];
    this.lastObjective = null;
  }
  // Weighted pick that avoids repeating non-standard themes too often.
  pickTheme(time) {
    const avail = WAVE_THEMES.filter((t) => t.weight > 0 && time >= t.minTime);
    const fresh = avail.filter((t) => t.id === "standard" || !this.recentThemes.includes(t.id));
    const pool = fresh.length ? fresh : avail;
    let total = 0;
    for (const t of pool) total += t.weight;
    let r = Math.random() * total;
    let chosen = pool[0];
    for (const t of pool) { r -= t.weight; if (r <= 0) { chosen = t; break; } }
    if (chosen.id !== "standard") {
      this.recentThemes.push(chosen.id);
      if (this.recentThemes.length > 2) this.recentThemes.shift();
    }
    return chosen;
  }
  pickObjective() {
    const pool = this.lastObjective ? OBJECTIVES.filter((o) => o.id !== this.lastObjective) : OBJECTIVES;
    const def = pick(pool);
    this.lastObjective = def.id;
    return def;
  }
}