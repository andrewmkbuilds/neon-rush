import React from "react";
import { ArrowLeft, Gamepad2, Lock, Trophy } from "lucide-react";
import { ARCADE_GAMES } from "@/game/arcade";
import NeonBackground from "@/components/ui/NeonBackground";

const DIFF_COLOR = { Easy: "#34D399", Normal: "#FFD166", Hard: "#FF3B5C" };

export default function Arcade({ profile, onBack, onPlay }) {
  return (
    <div className="relative h-screen w-full bg-[#05060D] text-[#F8FAFC] overflow-y-auto">
      <NeonBackground />
      <div className="sticky top-0 z-20 flex items-center justify-between px-4 sm:px-6 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-3 bg-[#05060D]/90 backdrop-blur border-b border-white/5">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-[#94A3B8] hover:text-[#F8FAFC] transition"><ArrowLeft size={18} /> Back</button>
        <h1 className="font-display font-black tracking-wider text-lg" style={{ background: "linear-gradient(90deg,#FF2E93,#00F5FF)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>ARCADE</h1>
        <div className="w-16" />
      </div>

      <div className="max-w-xl mx-auto px-4 py-6">
        <p className="text-xs text-[#94A3B8] mb-4 px-1">Quick, self-contained mini-games. Each has its own scoring and works fully offline.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {ARCADE_GAMES.map((g) => {
            const playable = g.status === "playable";
            const hi = profile.arcade?.highScores?.[g.id] || 0;
            return (
              <button
                key={g.id}
                onClick={() => playable && onPlay(g.id)}
                disabled={!playable}
                onMouseDown={(e) => e.preventDefault()}
                className={`text-left rounded-2xl border p-4 transition active:scale-[0.99] ${playable ? "border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20" : "border-white/5 bg-white/[0.02] opacity-70"}`}
              >
                <div className="flex items-center gap-2">
                  <div className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${g.color}1a`, boxShadow: playable ? `0 0 12px ${g.color}33` : "none" }}>
                    <Gamepad2 size={18} style={{ color: g.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-display font-bold tracking-wider text-sm" style={{ color: g.color }}>{g.name}</div>
                    <span className="px-1.5 py-0.5 rounded text-xs font-display font-bold tracking-wider uppercase" style={{ color: DIFF_COLOR[g.difficulty], background: `${DIFF_COLOR[g.difficulty]}1a` }}>{g.difficulty}</span>
                  </div>
                  {!playable && <Lock size={14} className="text-[#64748B]" />}
                </div>
                <p className="text-xs text-[#94A3B8] mt-2.5">{g.desc}</p>
                <div className="mt-2.5 flex items-center justify-between text-xs">
                  {playable ? (
                    <span className="flex items-center gap-1 text-[#FFD166]"><Trophy size={12} /> Best: {hi.toLocaleString()}</span>
                  ) : (
                    <span className="text-[#64748B]">Coming Soon</span>
                  )}
                  {playable && <span className="text-[#00F5FF] font-bold">PLAY →</span>}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}