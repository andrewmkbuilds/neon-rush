import React from "react";
import { ArrowLeft, Check, Play, Gem, Star, Zap, Crosshair } from "lucide-react";
import { getSkillChallengeView } from "@/game/sidequests";

const DIFF_COLOR = { Easy: "#34D399", Normal: "#FFD166", Hard: "#FF3B5C" };

function ConstraintTag({ constraint }) {
  if (constraint?.noDash) {
    return (
      <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-display font-bold tracking-wider uppercase" style={{ color: "#FF3B5C", background: "#FF3B5C1a", border: "1px solid #FF3B5C33" }}>
        <Zap size={10} /> No Dash
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-display font-bold tracking-wider uppercase" style={{ color: "#00F5FF", background: "#00F5FF1a", border: "1px solid #00F5FF33" }}>
      <Crosshair size={10} /> Pure Skill
    </span>
  );
}

export default function SkillChallenges({ profile, onBack, onPlay }) {
  const challenges = getSkillChallengeView(profile);
  const done = challenges.filter((c) => c.completed).length;

  return (
    <div className="relative h-screen w-full bg-[#05060D] text-[#F8FAFC] overflow-y-auto">
      <div className="sticky top-0 z-20 flex items-center justify-between px-4 sm:px-6 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-3 bg-[#05060D]/90 backdrop-blur border-b border-white/5">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-[#94A3B8] hover:text-[#F8FAFC] transition"><ArrowLeft size={18} /> Back</button>
        <h1 className="font-display font-black tracking-wider text-sm sm:text-lg" style={{ background: "linear-gradient(90deg,#F472B6,#FFD166)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>
          SKILL CHALLENGES
        </h1>
        <div className="w-16 text-right text-xs font-display font-bold text-[#94A3B8] tabular-nums">{done}/{challenges.length}</div>
      </div>

      <div className="max-w-xl mx-auto px-4 py-6">
        <p className="text-xs text-[#94A3B8] mb-4 px-1">
          Small, skill-based trials with tight constraints — no dash, no hits. Each first clear grants bonus Neon Credits. Replay any time to beat your best.
        </p>
        <div className="space-y-3">
          {challenges.map((c) => {
            const best = c.best;
            return (
              <div key={c.id} className={`rounded-2xl border p-4 ${c.completed ? "border-[#34D399]/25 bg-[#34D399]/[0.04]" : "border-white/10 bg-white/5"}`}>
                <div className="flex items-center gap-2">
                  <span className="font-display font-bold tracking-wider text-sm flex-1">{c.name}</span>
                  <span className="px-1.5 py-0.5 rounded text-xs font-display font-bold tracking-wider uppercase" style={{ color: DIFF_COLOR[c.difficulty], background: `${DIFF_COLOR[c.difficulty]}1a` }}>{c.difficulty}</span>
                  <ConstraintTag constraint={c.constraint} />
                </div>
                <p className="text-xs text-[#94A3B8] mt-1.5">{c.desc}</p>
                <div className="mt-2.5 flex items-center justify-between">
                  <span className="flex items-center gap-2 text-xs text-[#94A3B8]">
                    <span className="flex items-center gap-0.5"><Gem size={11} className="text-[#00F5FF]" /> {c.reward.credits}</span>
                    <span className="flex items-center gap-0.5"><Star size={11} className="text-[#FFD166]" /> {c.reward.xp} XP</span>
                  </span>
                  {c.completed && <span className="flex items-center gap-1 text-xs font-display font-bold tracking-wider text-[#34D399]"><Check size={12} /> CLEARED</span>}
                </div>
                {best && (
                  <div className="mt-2 text-xs text-[#64748B] tabular-nums">
                    Best: {best.score?.toLocaleString()} pts · {best.time}s · W{best.wave}
                  </div>
                )}
                <button
                  onClick={() => onPlay(c)}
                  onMouseDown={(e) => e.preventDefault()}
                  className="mt-3 w-full py-2 rounded-xl font-display font-bold tracking-wider text-sm flex items-center justify-center gap-2 active:scale-95 transition text-[#05060D]"
                  style={{ background: c.completed ? "linear-gradient(90deg,#34D399,#00F5FF)" : "linear-gradient(90deg,#F472B6,#FFD166)" }}
                >
                  {c.completed ? <><Play size={14} fill="#05060D" /> REPLAY</> : <><Play size={14} fill="#05060D" /> START CHALLENGE</>}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}