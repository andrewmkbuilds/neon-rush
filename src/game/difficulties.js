// Difficulty modes for NEON RUSH. Centralized so the engine and the menu agree.
export const DIFFICULTIES = [
  {
    id: "easy",
    name: "Easy",
    tag: "ROOKIE",
    color: "#34D399",
    desc: "Slower threats, 4 hull plates, relaxed wave gaps. Learn the ropes.",
    diffMult: 0.7,
    scoreMult: 0.85,
    waveGap: 10,
    dashCd: 8,
    health: 4,
  },
  {
    id: "normal",
    name: "Normal",
    tag: "PILOT",
    color: "#00F5FF",
    desc: "The true NEON RUSH experience. Balanced ramp, 3 hull plates.",
    diffMult: 1.0,
    scoreMult: 1.0,
    waveGap: 8,
    dashCd: 8,
    health: 3,
  },
  {
    id: "hard",
    name: "Neon Hard",
    tag: "ACE",
    color: "#FF2E93",
    desc: "Fast and relentless, 2 hull plates. x1.6 score multiplier for the bold.",
    diffMult: 1.4,
    scoreMult: 1.6,
    waveGap: 6.5,
    dashCd: 6.5,
    health: 2,
  },
];

export function getDifficulty(id) {
  return DIFFICULTIES.find((d) => d.id === id) || DIFFICULTIES[1];
}