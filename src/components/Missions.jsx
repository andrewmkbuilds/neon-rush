import React, { useState } from "react";
import { ArrowLeft, Check, Gem, Star, Lock, Flame, Loader2 } from "lucide-react";
import { getMissionView } from "@/game/missions";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import NeonBackground from "@/components/ui/NeonBackground";

const DIFF_COLOR = { Easy: "#34D399", Normal: "#FFD166", Hard: "#FF3B5C" };

function MissionCard({ m, onClaim, group }) {
  const pct = Math.min(100, (m.progress / m.target) * 100);
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-3.5">
      <div className="flex items-center gap-2">
        <span className="font-display font-bold text-sm flex-1">{m.desc}</span>
        <span className="px-1.5 py-0.5 rounded text-xs font-display font-bold tracking-wider uppercase" style={{ color: DIFF_COLOR[m.difficulty], background: `${DIFF_COLOR[m.difficulty]}1a` }}>{m.difficulty}</span>
      </div>
      <div className="mt-2.5 h-2 rounded-full bg-white/10 overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: m.complete ? "linear-gradient(90deg,#34D399,#00F5FF)" : "linear-gradient(90deg,#00F5FF,#8B5CF6)" }} />
      </div>
      <div className="mt-1.5 flex items-center justify-between text-xs text-[#94A3B8]">
        <span>{m.progress} / {m.target}</span>
        <span className="flex items-center gap-2">
          <span className="flex items-center gap-0.5"><Gem size={11} className="text-[#00F5FF]" /> {Math.round(m.reward.credits * (m.multiplier || 1))}</span>
          <span className="flex items-center gap-0.5"><Star size={11} className="text-[#FFD166]" /> {m.reward.xp}</span>
        </span>
      </div>
      {(m.multiplier || 1) > 1 && (
        <div className="mt-1.5 flex items-center gap-1 text-xs font-display font-bold tracking-wider" style={{ color: "#FF2E93" }}>
          <Flame size={11} /> x{m.multiplier} {m.bestDiff >= 3 ? "HARD" : "NORMAL"} BONUS CREDITS
        </div>
      )}
      <button
        onClick={() => onClaim(m, group)}
        disabled={!m.complete || m.claimed}
        onMouseDown={(e) => e.preventDefault()}
        className={`mt-3 w-full py-2 rounded-xl font-display font-bold tracking-wider text-sm flex items-center justify-center gap-2 active:scale-95 transition ${m.claimed ? "bg-white/5 text-[#64748B] border border-white/10" : m.complete ? "text-[#05060D]" : "bg-white/5 text-[#64748B] border border-white/10"}`}
        style={m.complete && !m.claimed ? { background: "linear-gradient(90deg,#00F5FF,#8B5CF6)" } : undefined}
      >
        {m.claimed ? <><Check size={15} /> CLAIMED</> : m.complete ? <><Gem size={15} /> CLAIM REWARD</> : <><Lock size={14} /> IN PROGRESS</>}
      </button>
    </div>
  );
}

export default function Missions({ profile, onBack, onClaim }) {
  const [tab, setTab] = useState("daily");
  const view = getMissionView(profile);
  const { ref, pull, refreshing } = usePullToRefresh(async () => { await new Promise((r) => setTimeout(r, 600)); });

  return (
    <div ref={ref} className="relative h-screen w-full bg-[#05060D] text-[#F8FAFC] overflow-y-auto">
      <NeonBackground />
      <div className="flex items-center justify-center overflow-hidden text-[#00F5FF]" style={{ height: pull }}>
        <Loader2 size={22} className={refreshing ? "animate-spin" : ""} />
      </div>
      <div className="sticky top-0 z-20 flex items-center justify-between px-4 sm:px-6 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-3 bg-[#05060D]/90 backdrop-blur border-b border-white/5">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-[#94A3B8] hover:text-[#F8FAFC] transition"><ArrowLeft size={18} /> Back</button>
        <h1 className="font-display font-black tracking-wider text-lg" style={{ background: "linear-gradient(90deg,#00F5FF,#8B5CF6)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>MISSIONS</h1>
        <div className="w-16" />
      </div>

      <div className="max-w-xl mx-auto px-4 py-6">
        <div className="flex gap-2 mb-4">
          {[
            { id: "daily", label: "Daily" },
            { id: "weekly", label: "Weekly" },
          ].map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`flex-1 py-2 rounded-xl text-xs font-display font-bold tracking-wider transition ${tab === t.id ? "bg-[#00F5FF]/15 border border-[#00F5FF]/40 text-[#00F5FF]" : "border border-white/10 bg-white/5 text-[#94A3B8]"}`}>{t.label}</button>
          ))}
        </div>
        <p className="text-xs text-[#94A3B8] mb-3 px-1">
          {tab === "daily" ? "Three fresh objectives every day. Progress resets daily — claim before they're gone." : "Longer weekly objectives. Progress resets every Monday."}
        </p>
        <div className="space-y-3">
          {(tab === "daily" ? view.daily : view.weekly).map((m) => (
            <MissionCard key={m.id} m={m} onClaim={onClaim} group={tab} />
          ))}
        </div>
      </div>
    </div>
  );
}