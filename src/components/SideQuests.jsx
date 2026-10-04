import React from "react";
import { ArrowLeft, Check, Lock, Gem, Star, BookOpen } from "lucide-react";
import { getActiveSideQuests } from "@/game/sidequests";
import NeonBackground from "@/components/ui/NeonBackground";

const DIFF_COLOR = { Easy: "#34D399", Normal: "#FFD166", Hard: "#FF3B5C" };

export default function SideQuests({ profile, onBack, onClaim }) {
  const quests = getActiveSideQuests(profile);

  return (
    <div className="relative h-screen w-full bg-[#05060D] text-[#F8FAFC] overflow-y-auto">
      <NeonBackground />
      <div className="sticky top-0 z-20 flex items-center justify-between px-4 sm:px-6 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-3 bg-[#05060D]/90 backdrop-blur border-b border-white/5">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-[#94A3B8] hover:text-[#F8FAFC] transition"><ArrowLeft size={18} /> Back</button>
        <h1 className="font-display font-black tracking-wider text-lg" style={{ background: "linear-gradient(90deg,#FFD166,#FF2E93)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>SIDE QUESTS</h1>
        <div className="w-16" />
      </div>

      <div className="max-w-xl mx-auto px-4 py-6 space-y-3">
        <p className="text-xs text-[#94A3B8] px-1">Optional story-driven objectives. They never block the campaign — but they reveal more of the universe.</p>
        {quests.map((sq) => {
          const pct = Math.min(100, (sq.progress / sq.objective.target) * 100);
          return (
            <div key={sq.id} className={`rounded-2xl border p-4 ${sq.unlocked ? "border-white/10 bg-white/5" : "border-white/5 bg-white/[0.02] opacity-70"}`}>
              <div className="flex items-center gap-2">
                <BookOpen size={16} className={sq.unlocked ? "text-[#FFD166]" : "text-[#64748B]"} />
                <span className="font-display font-bold tracking-wider text-sm flex-1">{sq.name}</span>
                <span className="px-1.5 py-0.5 rounded text-xs font-display font-bold tracking-wider uppercase" style={{ color: DIFF_COLOR[sq.difficulty], background: `${DIFF_COLOR[sq.difficulty]}1a` }}>{sq.difficulty}</span>
              </div>
              {!sq.unlocked ? (
                <div className="mt-2 flex items-center gap-1.5 text-xs text-[#64748B]"><Lock size={12} /> Unlocks after Story Chapter {sq.unlockChapter}.</div>
              ) : (
                <>
                  <p className="text-xs text-[#94A3B8] mt-1.5">{sq.desc}</p>
                  <p className="text-xs text-[#64748B] italic mt-1">“{sq.lore}”</p>
                  <div className="mt-2.5 h-2 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: sq.complete ? "linear-gradient(90deg,#34D399,#FFD166)" : "linear-gradient(90deg,#FFD166,#FF2E93)" }} />
                  </div>
                  <div className="mt-1.5 flex items-center justify-between text-xs text-[#94A3B8]">
                    <span>{sq.progress} / {sq.objective.target}</span>
                    <span className="flex items-center gap-2"><span className="flex items-center gap-0.5"><Gem size={11} className="text-[#00F5FF]" /> {sq.reward.credits}</span><span className="flex items-center gap-0.5"><Star size={11} className="text-[#FFD166]" /> {sq.reward.xp}</span></span>
                  </div>
                  <button
                    onClick={() => onClaim(sq)}
                    disabled={!sq.complete || sq.claimed}
                    onMouseDown={(e) => e.preventDefault()}
                    className={`mt-3 w-full py-2 rounded-xl font-display font-bold tracking-wider text-sm flex items-center justify-center gap-2 active:scale-95 transition ${sq.claimed ? "bg-white/5 text-[#64748B] border border-white/10" : sq.complete ? "text-[#05060D]" : "bg-white/5 text-[#64748B] border border-white/10"}`}
                    style={sq.complete && !sq.claimed ? { background: "linear-gradient(90deg,#FFD166,#FF2E93)" } : undefined}
                  >
                    {sq.claimed ? <><Check size={15} /> CLAIMED</> : sq.complete ? <><Gem size={15} /> CLAIM REWARD</> : "IN PROGRESS"}
                  </button>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}