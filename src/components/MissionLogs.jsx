import React, { useState } from "react";
import { ArrowLeft, ClipboardList, Check, Gem, Star, Lock, Calendar, Compass } from "lucide-react";
import { getMissionView } from "@/game/missions";
import { getActiveSideQuests } from "@/game/sidequests";

const DIFF_COLOR = { Easy: "#34D399", Normal: "#FFD166", Hard: "#FF3B5C" };

function StatusBadge({ status }) {
  const map = {
    locked: { label: "LOCKED", color: "#64748B" },
    active: { label: "ACTIVE", color: "#00F5FF" },
    ready: { label: "READY", color: "#FFD166" },
    done: { label: "DONE", color: "#34D399" },
  };
  const s = map[status] || map.active;
  return (
    <span className="px-1.5 py-0.5 rounded text-xs font-display font-bold tracking-wider uppercase shrink-0" style={{ color: s.color, background: `${s.color}1a`, border: `1px solid ${s.color}33` }}>
      {s.label}
    </span>
  );
}

function StatPill({ label, value, color }) {
  return (
    <div className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-center">
      <div className="font-display font-black text-xl tabular-nums" style={{ color }}>{value}</div>
      <div className="text-xs uppercase tracking-wider text-[#94A3B8] mt-0.5">{label}</div>
    </div>
  );
}

function ItemRow({ title, subtitle, progress, target, difficulty, status, reward, onClaim, claimLabel, claimable }) {
  const pct = Math.min(100, (progress / target) * 100);
  return (
    <div className={`rounded-2xl border p-3.5 ${status === "done" ? "border-[#34D399]/20 bg-[#34D399]/[0.04]" : status === "ready" ? "border-[#FFD166]/30 bg-[#FFD166]/[0.05]" : status === "locked" ? "border-white/5 bg-white/[0.02] opacity-70" : "border-white/10 bg-white/5"}`}>
      <div className="flex items-center gap-2">
        <span className="font-display font-bold text-sm flex-1 min-w-0 truncate">{title}</span>
        <span className="px-1.5 py-0.5 rounded text-xs font-display font-bold tracking-wider uppercase" style={{ color: DIFF_COLOR[difficulty], background: `${DIFF_COLOR[difficulty]}1a` }}>{difficulty}</span>
        <StatusBadge status={status} />
      </div>
      {subtitle && <p className="text-xs text-[#94A3B8] mt-1">{subtitle}</p>}
      {status !== "locked" ? (
        <>
          <div className="mt-2.5 h-2 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: status === "done" ? "linear-gradient(90deg,#34D399,#00F5FF)" : status === "ready" ? "linear-gradient(90deg,#FFD166,#FF2E93)" : "linear-gradient(90deg,#00F5FF,#8B5CF6)" }} />
          </div>
          <div className="mt-1.5 flex items-center justify-between text-xs text-[#94A3B8]">
            <span className="tabular-nums">{progress} / {target}</span>
            <span className="flex items-center gap-2">
              <span className="flex items-center gap-0.5"><Gem size={11} className="text-[#00F5FF]" /> {reward.credits}</span>
              <span className="flex items-center gap-0.5"><Star size={11} className="text-[#FFD166]" /> {reward.xp}</span>
            </span>
          </div>
          {onClaim && (
            <button
              onClick={onClaim}
              disabled={!claimable}
              onMouseDown={(e) => e.preventDefault()}
              className={`mt-3 w-full py-2 rounded-xl font-display font-bold tracking-wider text-sm flex items-center justify-center gap-2 active:scale-95 transition ${status === "done" ? "bg-white/5 text-[#64748B] border border-white/10" : claimable ? "text-[#05060D]" : "bg-white/5 text-[#64748B] border border-white/10"}`}
              style={claimable && status !== "done" ? { background: "linear-gradient(90deg,#00F5FF,#8B5CF6)" } : undefined}
            >
              {status === "done" ? <><Check size={15} /> CLAIMED</> : claimable ? <><Gem size={15} /> {claimLabel}</> : <><Lock size={14} /> IN PROGRESS</>}
            </button>
          )}
        </>
      ) : (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-[#64748B]"><Lock size={12} /> {subtitle || "Locked"}</div>
      )}
    </div>
  );
}

function SectionHeader({ icon: Icon, title, color, count }) {
  return (
    <div className="flex items-center gap-2 mb-2.5 mt-1">
      <Icon size={16} style={{ color }} />
      <h2 className="font-display font-bold tracking-wider text-sm" style={{ color }}>{title}</h2>
      <span className="text-xs text-[#64748B] tabular-nums">({count})</span>
      <div className="flex-1 h-px bg-white/5" />
    </div>
  );
}

export default function MissionLogs({ profile, onBack, onClaimMission, onClaimSideQuest }) {
  const [tab, setTab] = useState("all");
  const view = getMissionView(profile);
  const sideQuests = getActiveSideQuests(profile);

  const daily = view.daily.map((m) => ({
    type: "daily",
    id: m.id,
    title: m.desc,
    progress: m.progress,
    target: m.target,
    difficulty: m.difficulty,
    reward: m.reward,
    status: m.claimed ? "done" : m.complete ? "ready" : "active",
    onClaim: () => onClaimMission(m, "daily"),
  }));
  const weekly = view.weekly.map((m) => ({
    type: "weekly",
    id: m.id,
    title: m.desc,
    progress: m.progress,
    target: m.target,
    difficulty: m.difficulty,
    reward: m.reward,
    status: m.claimed ? "done" : m.complete ? "ready" : "active",
    onClaim: () => onClaimMission(m, "weekly"),
  }));
  const sq = sideQuests.map((q) => ({
    type: "sidequest",
    id: q.id,
    title: q.name,
    subtitle: q.unlocked ? q.desc : `Unlocks after Story Chapter ${q.unlockChapter}`,
    progress: q.progress,
    target: q.objective.target,
    difficulty: q.difficulty,
    reward: q.reward,
    status: !q.unlocked ? "locked" : q.claimed ? "done" : q.complete ? "ready" : "active",
    onClaim: () => onClaimSideQuest(q),
  }));

  const all = [...daily, ...weekly, ...sq];
  const totals = {
    count: all.length,
    active: all.filter((x) => x.status === "active").length,
    ready: all.filter((x) => x.status === "ready").length,
    done: all.filter((x) => x.status === "done").length,
  };

  let items = all;
  if (tab === "active") items = all.filter((x) => x.status === "active" || x.status === "ready");
  else if (tab === "done") items = all.filter((x) => x.status === "done");
  else if (tab === "daily") items = daily;
  else if (tab === "weekly") items = weekly;
  else if (tab === "side") items = sq;

  const tabs = [
    { id: "all", label: "All" },
    { id: "active", label: "Active" },
    { id: "done", label: "Done" },
    { id: "daily", label: "Daily" },
    { id: "weekly", label: "Weekly" },
    { id: "side", label: "Side" },
  ];

  return (
    <div className="relative h-screen w-full bg-[#05060D] text-[#F8FAFC] overflow-y-auto">
      <div className="sticky top-0 z-20 flex items-center justify-between px-4 sm:px-6 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-3 bg-[#05060D]/90 backdrop-blur border-b border-white/5">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-[#94A3B8] hover:text-[#F8FAFC] transition"><ArrowLeft size={18} /> Back</button>
        <h1 className="font-display font-black tracking-wider text-lg flex items-center gap-1.5" style={{ background: "linear-gradient(90deg,#00F5FF,#34D399)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>
          <ClipboardList size={16} className="text-[#00F5FF]" /> MISSION LOGS
        </h1>
        <div className="w-16" />
      </div>

      <div className="max-w-xl mx-auto px-4 py-6">
        {/* Summary */}
        <div className="flex gap-2 mb-5">
          <StatPill label="Objectives" value={totals.count} color="#F8FAFC" />
          <StatPill label="Active" value={totals.active} color="#00F5FF" />
          <StatPill label="Ready" value={totals.ready} color="#FFD166" />
          <StatPill label="Done" value={totals.done} color="#34D399" />
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-5">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`flex-1 min-w-[5rem] py-2 rounded-xl text-xs font-display font-bold tracking-wider transition ${tab === t.id ? "bg-[#00F5FF]/15 border border-[#00F5FF]/40 text-[#00F5FF]" : "border border-white/10 bg-white/5 text-[#94A3B8]"}`}>{t.label}</button>
          ))}
        </div>

        {/* Sections */}
        {tab === "all" || tab === "active" || tab === "done" ? (
          <div className="space-y-5">
            {((tab === "all" || tab === "active") && daily.some((x) => tab === "all" || (tab === "active" && (x.status === "active" || x.status === "ready")))) && (
              <div>
                <SectionHeader icon={Calendar} title="DAILY" color="#00F5FF" count={daily.length} />
                <div className="space-y-2.5">
                  {daily.filter((x) => tab === "all" || (tab === "active" ? (x.status === "active" || x.status === "ready") : x.status === "done")).map((m) => (
                    <ItemRow key={`d-${m.id}`} {...m} claimLabel="CLAIM" claimable={m.status === "ready"} />
                  ))}
                </div>
              </div>
            )}
            {((tab === "all" || tab === "active") && weekly.some((x) => tab === "all" || (tab === "active" && (x.status === "active" || x.status === "ready")))) && (
              <div>
                <SectionHeader icon={Calendar} title="WEEKLY" color="#8B5CF6" count={weekly.length} />
                <div className="space-y-2.5">
                  {weekly.filter((x) => tab === "all" || (tab === "active" ? (x.status === "active" || x.status === "ready") : x.status === "done")).map((m) => (
                    <ItemRow key={`w-${m.id}`} {...m} claimLabel="CLAIM" claimable={m.status === "ready"} />
                  ))}
                </div>
              </div>
            )}
            <div>
              <SectionHeader icon={Compass} title="SIDE QUESTS" color="#FFD166" count={sq.length} />
              <div className="space-y-2.5">
                {sq.filter((x) => tab === "all" || (tab === "active" ? (x.status === "active" || x.status === "ready" || x.status === "locked") : x.status === "done")).map((m) => (
                  <ItemRow key={`s-${m.id}`} {...m} claimLabel="CLAIM" claimable={m.status === "ready"} />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-2.5">
            {items.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center">
                <ClipboardList size={28} className="mx-auto text-[#64748B] mb-2" />
                <p className="text-[#94A3B8] text-sm">Nothing here yet.</p>
              </div>
            ) : (
              items.map((m) => <ItemRow key={`${m.type}-${m.id}`} {...m} claimLabel="CLAIM" claimable={m.status === "ready"} />)
            )}
          </div>
        )}
      </div>
    </div>
  );
}