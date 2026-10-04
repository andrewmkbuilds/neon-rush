import React, { useMemo } from "react";

export default function NeonBackground() {
  const particles = useMemo(
    () =>
      Array.from({ length: 35 }, () => ({
        x: Math.random() * 100,
        y: Math.random() * 100,
        s: Math.random() * 2 + 0.5,
        d: Math.random() * 6 + 3,
        delay: Math.random() * 4,
      })),
    []
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Drifting nebula blobs */}
      <div
        className="absolute -top-20 -left-20 w-72 h-72 rounded-full opacity-[0.18] blur-3xl"
        style={{ background: "radial-gradient(circle, #00F5FF 0%, transparent 70%)", animation: "nr-nebula-drift 18s ease-in-out infinite" }}
      />
      <div
        className="absolute top-1/3 -right-20 w-80 h-80 rounded-full opacity-[0.13] blur-3xl"
        style={{ background: "radial-gradient(circle, #FF2E93 0%, transparent 70%)", animation: "nr-nebula-drift 22s ease-in-out infinite reverse" }}
      />
      <div
        className="absolute -bottom-20 left-1/3 w-72 h-72 rounded-full opacity-[0.13] blur-3xl"
        style={{ background: "radial-gradient(circle, #8B5CF6 0%, transparent 70%)", animation: "nr-nebula-drift 20s ease-in-out infinite", animationDelay: "3s" }}
      />

      {/* Flowing grid */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,245,255,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(0,245,255,0.04) 1px,transparent 1px)",
          backgroundSize: "50px 50px",
          animation: "nr-grid-flow 8s linear infinite",
        }}
      />

      {/* Floating particles */}
      {particles.map((p, i) => (
        <span
          key={i}
          className="absolute rounded-full bg-[#7DD3FC]"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.s,
            height: p.s,
            opacity: 0.4,
            animation: `nr-float ${p.d}s ease-in-out infinite alternate`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
}