// Arcade mini-game metadata. LASER DODGE is playable now; the rest are
// scaffolded and marked "Coming Soon" so the arcade feels complete.

export const ARCADE_GAMES = [
  { id: "laser_dodge", name: "LASER DODGE", desc: "Survive in a small arena filled with laser beams. Dodge increasingly complex patterns.", difficulty: "Easy", status: "playable", color: "#00F5FF" },
  { id: "energy_rush", name: "ENERGY RUSH", desc: "Collect as many energy fragments as possible before time runs out.", difficulty: "Easy", status: "soon", color: "#8B5CF6" },
  { id: "neon_drift", name: "NEON DRIFT", desc: "Steer through a futuristic tunnel, avoid obstacles and collect speed boosts.", difficulty: "Normal", status: "soon", color: "#FF2E93" },
  { id: "grid_breaker", name: "GRID BREAKER", desc: "Connect energy nodes and solve grid puzzles against a timer.", difficulty: "Normal", status: "soon", color: "#FFD166" },
  { id: "boss_rush", name: "BOSS RUSH", desc: "Fight a series of previously encountered bosses in short battles.", difficulty: "Hard", status: "soon", color: "#FF3B5C" },
];

export function getArcadeGame(id) {
  return ARCADE_GAMES.find((g) => g.id === id);
}