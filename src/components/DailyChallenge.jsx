import React from "react";
import { ArrowLeft, Calendar, Zap, Play, Trophy, ChevronRight } from "lucide-react";
import { getDailyChallenge } from "@/game/dailyChallenge";
import NeonBackground from "@/components/ui/NeonBackground";

export default function DailyChallenge({ onBack, onStart, onLeaderboard }) {
  const dc = getDailyChallenge();
  const today = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });

  return (
    <div className="relative h-screen w-full bg-[#05060D] text-[#F8FAFC] overflow-y-auto">
      <NeonBackground />
      <div className="sticky top-0 z-20 flex items-center justify-between px-4 sm:px-6 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-3 bg-[#05060D]/90 backdrop-blur border-b border-white/5">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-[#94A3B8] hover:text-[#F8FAFC] transition">
          <ArrowLeft size={18} /> Back
        </button>
        <h1 className="font-display font-black tracking-wider text-lg" style={{ background: "linear-gradient(90deg,#FF2E93,#FFD166)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>
          DAILY CHALLENGE
        </h1>
        <div className="w-16" />
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="text-center mb-6">
          <Calendar size={32} className="text-[#FFD166] mx-auto mb-2" />
          <div className="text-xs uppercase tracking-[0.3em] text-[#94A3B8]">{today}</div>
        </div>

        <div className="rounded-2xl border border-[#FF2E93]/30 bg-[#FF2E93]/5 p-5 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Zap size={16} className="text-[#FF2E93]" />
            <span className="font-display font-bold tracking-wider text-sm uppercase text-[#FF2E93]">Today's Modifiers</span>
          </div>
          <div className="space-y-2">
            {dc.modDetails.map((m) => (
              <div key={m.id} className="rounded-xl bg-white/5 border border-white/10 p-3">
                <div className="font-display font-bold text-sm" style={{ color: m.color }}>{m.name}</div>
                <div className="text-xs text-[#94A3B8] mt-0.5">{m.desc}</div>
                <div className="text-xs text-[#FFD166] mt-1 font-bold">+{Math.round(m.mult * 100)}% score bonus</div>
              </div>
            ))}
          </div>
          <p className="text-xs text-[#94A3B8] mt-3 text-center">
            Every pilot faces the same modifiers today. Same conditions, same leaderboard.
          </p>
        </div>

        <button
          onClick={onStart}
          onMouseDown={(e) => e.preventDefault()}
          className="w-full py-4 rounded-2xl bg-[#FF2E93] text-[#05060D] font-display font-black tracking-[0.15em] flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition"
        >
          <Play size={20} fill="#05060D" /> START DAILY RUN
        </button>

        <button
          onClick={onLeaderboard}
          onMouseDown={(e) => e.preventDefault()}
          className="w-full mt-3 py-3.5 rounded-2xl border border-[#FFD166]/40 bg-[#FFD166]/10 text-[#FFD166] font-display font-bold tracking-wider flex items-center justify-center gap-2 hover:bg-[#FFD166]/20 active:scale-95 transition"
        >
          <Trophy size={18} /> DAILY LEADERBOARD <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}