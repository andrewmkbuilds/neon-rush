import React, { useMemo } from "react";

/**
 * Screen-space retro-cyberpunk FX overlay: scanlines, vignette, and a subtle
 * flicker. Intensifies with gameplay intensity (0..1). Pure CSS, pointer-events
 * none, GPU-friendly — no per-frame canvas work.
 */
export default function ScreenFX({ intensity = 0 }) {
  // ramp only after the run heats up so early play stays clean
  const i = Math.max(0, Math.min(1, (intensity - 0.45) / 0.55));
  const scanOpacity = 0.06 + i * 0.14;
  const vignetteOpacity = 0.25 + i * 0.35;

  // a few static scanline "glitch" bars, memoized so they don't reflow
  const bars = useMemo(
    () =>
      Array.from({ length: 3 }, () => ({
        top: 10 + Math.random() * 80,
        h: 1 + Math.random() * 2,
        d: 4 + Math.random() * 6,
        delay: Math.random() * 4,
      })),
    []
  );

  return (
    <div className="pointer-events-none absolute inset-0 z-[5] overflow-hidden" aria-hidden="true">
      {/* scanlines */}
      <div
        className="absolute inset-0"
        style={{
          opacity: scanOpacity,
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(0,0,0,0.55) 0px, rgba(0,0,0,0.55) 1px, transparent 1px, transparent 3px)",
          mixBlendMode: "multiply",
        }}
      />
      {/* moving chroma bands — subtle horizontal RGB shimmer */}
      <div
        className="absolute inset-0"
        style={{
          opacity: i * 0.5,
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(255,0,80,0.05) 0px, transparent 2px, rgba(0,229,255,0.05) 4px, transparent 6px)",
          mixBlendMode: "screen",
          animation: i > 0.1 ? `nr-grid-flow ${Math.max(1.5, 4 - i * 2).toFixed(2)}s linear infinite` : "none",
        }}
      />
      {/* glitch bars */}
      {bars.map((b, idx) => (
        <div
          key={idx}
          className="absolute left-0 right-0"
          style={{
            top: `${b.top}%`,
            height: b.h,
            opacity: i * 0.4,
            background: "linear-gradient(90deg, transparent, rgba(0,229,255,0.35), transparent)",
            animation: i > 0.2 ? `nr-float ${b.d}s ease-in-out infinite alternate` : "none",
            animationDelay: `${b.delay}s`,
          }}
        />
      ))}
      {/* vignette */}
      <div
        className="absolute inset-0"
        style={{
          opacity: vignetteOpacity,
          background: "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.9) 100%)",
        }}
      />
      {/* intensity flash — a faint magenta edge glow when maxed out */}
      {i > 0.7 && (
        <div
          className="absolute inset-0"
          style={{
            opacity: (i - 0.7) * 0.6,
            boxShadow: "inset 0 0 120px rgba(255,46,147,0.25)",
            animation: "nr-diffpulse 1.2s ease-in-out infinite",
          }}
        />
      )}
    </div>
  );
}