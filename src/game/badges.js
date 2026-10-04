// Profile badges — earned from cumulative stats, shown on the profile and
// attached to global score submissions so the leaderboard can display them.
import { Crosshair, Flame, Waves, Clock, Trophy, Zap } from "lucide-react";

export const BADGES = [
  { id: "centurion", name: "Centurion", desc: "100 near misses total", icon: Crosshair, color: "#FF2E93", test: (p) => (p.totalNearMisses ?? 0) >= 100 },
  { id: "combo_king", name: "Combo King", desc: "Reach a x20 near-miss combo", icon: Flame, color: "#FF8A65", test: (p) => (p.bestCombo ?? 0) >= 20 },
  { id: "wave_breaker", name: "Wave Breaker", desc: "Reach wave 10", icon: Waves, color: "#00F5FF", test: (p) => (p.maxWave ?? 0) >= 10 },
  { id: "survival_master", name: "Survival Master", desc: "Survive 120s in a run", icon: Clock, color: "#34D399", test: (p) => (p.bestSurvival ?? 0) >= 120 },
  { id: "score_hunter", name: "Score Hunter", desc: "Score 15,000 in a run", icon: Trophy, color: "#FFD166", test: (p) => (p.bestScore ?? 0) >= 15000 },
  { id: "energy_vault", name: "Energy Vault", desc: "Bank 500 total energy", icon: Zap, color: "#8B5CF6", test: (p) => (p.totalEnergy ?? 0) >= 500 },
];

export function earnedBadges(profile) {
  return BADGES.filter((b) => b.test(profile || {})).map((b) => b.id);
}

export function badgeById(id) {
  return BADGES.find((b) => b.id === id);
}