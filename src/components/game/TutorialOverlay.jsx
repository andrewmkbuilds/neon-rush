import React from "react";
import { SkipForward, ChevronRight } from "lucide-react";

const STEPS = [
  { title: "MOVE", body: "Use WASD / Arrow keys or drag to fly your ship. Try moving around the arena." },
  { title: "COLLECT", body: "Fly into the glowing energy orb. Orbs charge your abilities and boost your score." },
  { title: "DASH", body: "Press SPACE or the DASH button to burst forward. You're invulnerable while dashing." },
  { title: "READY", body: "You're ready for the arena, pilot. Entering live combat…" },
];

export default function TutorialOverlay({ hud, onSkip }) {
  const step = hud?.tutorialStep ?? 0;
  const cur = STEPS[step] || STEPS[0];
  const isDone = step >= 3;

  return (
    <div className="absolute inset-x-0 top-0 z-20 flex flex-col items-center px-3 pt-3 pointer-events-none">
      <div className="w-full max-w-md rounded-2xl border border-[#8B5CF6]/40 bg-[#0B1020]/90 backdrop-blur p-4 shadow-[0_0_30px_rgba(139,92,246,0.25)] pointer-events-auto">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-widest text-[#A78BFA] font-display font-bold">
              Tutorial {isDone ? "" : `· Step ${step + 1}/3`}
            </span>
          </div>
          <button
            onClick={onSkip}
            onMouseDown={(e) => e.preventDefault()}
            className="flex items-center gap-1 text-xs text-[#94A3B8] hover:text-[#F8FAFC] transition"
          >
            <SkipForward size={13} /> Skip
          </button>
        </div>

        <div className="mt-2 flex items-center gap-2">
          <h2 className="font-display font-black tracking-wider text-xl" style={{ color: isDone ? "#34D399" : "#A78BFA" }}>
            {cur.title}
          </h2>
          {!isDone && step > 0 && <ChevronRight size={16} className="text-[#34D399]" />}
        </div>
        <p className="mt-1 text-sm text-[#CBD5E1] leading-snug">{cur.body}</p>

        {/* progress dots */}
        <div className="mt-3 flex items-center gap-2">
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className="h-1.5 flex-1 rounded-full transition-all"
              style={{
                background: i < step ? "#34D399" : i === step ? "#A78BFA" : "rgba(255,255,255,0.12)",
                boxShadow: i === step ? "0 0 8px #A78BFA" : "none",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}