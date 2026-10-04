import confetti from "canvas-confetti";

const NEON_COLORS = ["#00F5FF", "#FF2E93", "#8B5CF6", "#FFD166"];

export function fireConfetti(opts = {}) {
  confetti({
    particleCount: 80,
    spread: 70,
    origin: { y: 0.5 },
    colors: NEON_COLORS,
    disableForReducedMotion: true,
    ...opts,
  });
}

export function fireBigConfetti() {
  fireConfetti({ particleCount: 50, spread: 60, origin: { y: 0.4 } });
  setTimeout(() => fireConfetti({ particleCount: 40, spread: 80, origin: { y: 0.5 } }), 200);
  setTimeout(() => fireConfetti({ particleCount: 30, spread: 100, origin: { y: 0.6 } }), 400);
}

export function fireRewardConfetti(color) {
  confetti({
    particleCount: 60,
    spread: 50,
    origin: { y: 0.6 },
    colors: color ? [color, "#FFFFFF", "#FFD166"] : NEON_COLORS,
    disableForReducedMotion: true,
  });
}