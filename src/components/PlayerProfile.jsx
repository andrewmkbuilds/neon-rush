import React, { useState } from "react";
import { ArrowLeft, Edit2, Check, Award, Calendar, Gift, Trash2, AlertTriangle, X } from "lucide-react";
import { ACHIEVEMENTS, MILESTONES, getTodayChallenge } from "@/game/challenges";
import { BADGES, earnedBadges } from "@/game/badges";

const ICONS = { Rocket: Award, Shield: Award, Feather: Award, Flame: Award, Zap: Award, Gauge: Award, Trophy: Award };

export default function PlayerProfile({ profile, onBack, onRename, onClaim, onDeleteAccount }) {
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [name, setName] = useState(profile.name);
  const challenge = getTodayChallenge();
  const challengePct = Math.min(100, (profile.challenge.progress / challenge.target) * 100);
  const earnedIds = earnedBadges(profile);

  const stats = [
    { label: "Personal Best", value: profile.bestScore.toLocaleString(), color: "#FFD166" },
    { label: "Total Runs", value: profile.totalRuns, color: "#00F5FF" },
    { label: "Total Survival", value: `${Math.floor(profile.totalSurvival / 60)}m ${Math.floor(profile.totalSurvival % 60)}s`, color: "#00F5FF" },
    { label: "Total Energy", value: profile.totalEnergy, color: "#8B5CF6" },
    { label: "Best Combo", value: `x${profile.bestCombo}`, color: "#FF2E93" },
    { label: "Max Wave", value: profile.maxWave, color: "#FFD166" },
  ];

  return (
    <div className="relative h-screen w-full bg-[#05060D] text-[#F8FAFC] overflow-y-auto">
      <div className="sticky top-0 z-20 flex items-center justify-between px-4 sm:px-6 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-3 bg-[#05060D]/90 backdrop-blur border-b border-white/5">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-[#94A3B8] hover:text-[#F8FAFC] transition">
          <ArrowLeft size={18} /> Back
        </button>
        <h1 className="font-display font-black tracking-wider text-lg" style={{ background: "linear-gradient(90deg,#00F5FF,#8B5CF6)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>
          PROFILE
        </h1>
        <div className="w-16" />
      </div>

      <div className="max-w-xl mx-auto px-4 pt-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
        {/* name */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#00F5FF] to-[#8B5CF6] flex items-center justify-center font-display font-black text-xl text-[#05060D]">
            {profile.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            {editing ? (
              <div className="flex gap-2">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value.slice(0, 16))}
                  className="flex-1 bg-[#05060D] border border-[#00F5FF]/40 rounded-lg px-3 py-1.5 text-sm outline-none select-text"
                  autoFocus
                />
                <button
                  onClick={() => { onRename(name.trim() || "PILOT"); setEditing(false); }}
                  className="px-3 rounded-lg bg-[#00F5FF] text-[#05060D]"
                >
                  <Check size={16} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-lg">{profile.name}</span>
                <button onClick={() => setEditing(true)} className="text-[#94A3B8] hover:text-[#00F5FF] transition">
                  <Edit2 size={14} />
                </button>
              </div>
            )}
            <div className="text-xs text-[#94A3B8] mt-0.5">Guest pilot · progress saved locally</div>
          </div>
        </div>

        {/* stats */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {stats.map((s) => (
            <div key={s.label} className="rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="text-xs uppercase tracking-widest text-[#94A3B8]">{s.label}</div>
              <div className="font-display font-bold text-lg tabular-nums" style={{ color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* daily challenge */}
        <div className="mt-4 rounded-2xl border border-[#FFD166]/25 bg-[#FFD166]/5 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Calendar size={16} className="text-[#FFD166]" />
            <span className="font-display font-bold tracking-wider text-[#FFD166] text-sm uppercase">Daily Challenge</span>
            <span className="ml-auto text-xs text-[#94A3B8]">+{challenge.reward} Neon Credits</span>
          </div>
          <p className="text-sm text-[#F8FAFC]">{challenge.desc}</p>
          <div className="mt-2.5 h-2 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full rounded-full bg-[#FFD166]" style={{ width: `${challengePct}%`, boxShadow: "0 0 10px #FFD166" }} />
          </div>
          <div className="mt-1.5 flex items-center justify-between text-xs text-[#94A3B8]">
            <span>{profile.challenge.progress} / {challenge.target}</span>
            {profile.challenge.completed && !profile.challenge.claimed && (
              <button onClick={onClaim} className="flex items-center gap-1 text-[#FFD166] font-bold hover:underline">
                <Gift size={13} /> Claim reward
              </button>
            )}
            {profile.challenge.claimed && <span className="text-[#94A3B8]">Reward claimed</span>}
          </div>
        </div>

        {/* badges */}
        <h3 className="mt-6 font-display font-bold tracking-wider text-sm text-[#94A3B8] uppercase mb-2">Badges</h3>
        <div className="grid grid-cols-3 gap-2.5">
          {BADGES.map((b) => {
            const earned = earnedIds.includes(b.id);
            const Icon = b.icon;
            return (
              <div key={b.id} className={`flex flex-col items-center text-center rounded-xl p-3 border ${earned ? "border-white/15 bg-white/5" : "border-white/10 bg-white/5 opacity-50"}`} title={b.desc}>
                <div className="w-11 h-11 rounded-full flex items-center justify-center mb-1.5" style={earned ? { background: `${b.color}22`, boxShadow: `0 0 12px ${b.color}55` } : { background: "rgba(255,255,255,0.05)" }}>
                  <Icon size={20} style={{ color: earned ? b.color : "#64748B" }} />
                </div>
                <div className="font-display font-bold text-xs leading-tight">{b.name}</div>
                <div className="text-xs text-[#94A3B8] leading-tight mt-0.5">{b.desc}</div>
              </div>
            );
          })}
        </div>

        {/* milestones */}
        <h3 className="mt-6 font-display font-bold tracking-wider text-sm text-[#94A3B8] uppercase mb-2">Milestones</h3>
        <div className="grid grid-cols-1 gap-2">
          {MILESTONES.map((m) => {
            const done = (profile.milestones || []).includes(m.id);
            return (
              <div key={m.id} className={`flex items-center gap-3 rounded-xl p-3 border ${done ? "border-[#00F5FF]/30 bg-[#00F5FF]/5" : "border-white/10 bg-white/5 opacity-60"}`}>
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${done ? "bg-[#00F5FF]/15" : "bg-white/5"}`}>
                  <Award size={18} className={done ? "text-[#00F5FF]" : "text-[#64748B]"} />
                </div>
                <div className="flex-1">
                  <div className="font-bold text-sm">{m.name}</div>
                  <div className="text-xs text-[#94A3B8]">+{m.reward} Neon Credits</div>
                </div>
                {done ? <Check size={16} className="text-[#00F5FF]" /> : <span className="text-xs text-[#64748B] uppercase tracking-widest">Locked</span>}
              </div>
            );
          })}
        </div>

        {/* achievements */}
        <h3 className="mt-6 font-display font-bold tracking-wider text-sm text-[#94A3B8] uppercase mb-2">Achievements</h3>
        <div className="grid grid-cols-1 gap-2">
          {ACHIEVEMENTS.map((a) => {
            const unlocked = !!profile.achievements[a.id];
            const Icon = ICONS[a.icon] || Award;
            return (
              <div key={a.id} className={`flex items-center gap-3 rounded-xl p-3 border ${unlocked ? "border-[#FFD166]/30 bg-[#FFD166]/5" : "border-white/10 bg-white/5 opacity-60"}`}>
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${unlocked ? "bg-[#FFD166]/15" : "bg-white/5"}`}>
                  <Icon size={18} className={unlocked ? "text-[#FFD166]" : "text-[#64748B]"} />
                </div>
                <div className="flex-1">
                  <div className="font-bold text-sm">{a.name}</div>
                  <div className="text-xs text-[#94A3B8]">{a.desc}</div>
                </div>
                {unlocked && <Check size={16} className="text-[#FFD166]" />}
              </div>
            );
          })}
        </div>

        {/* danger zone — delete account */}
        <h3 className="mt-6 font-display font-bold tracking-wider text-sm text-[#FF3B5C] uppercase mb-2">Danger Zone</h3>
        <div className="rounded-2xl border border-[#FF3B5C]/30 bg-[#FF3B5C]/5 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle size={18} className="text-[#FF3B5C] shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-bold text-sm text-[#F8FAFC]">Delete Account</div>
              <p className="text-xs text-[#94A3B8] mt-1">Permanently erases your local pilot profile, scores, unlocks, and progress. This cannot be undone.</p>
            </div>
          </div>
          <button
            onClick={() => setConfirmDelete(true)}
            onMouseDown={(e) => e.preventDefault()}
            className="mt-3 w-full rounded-xl border border-[#FF3B5C]/50 bg-[#FF3B5C]/10 text-[#FF3B5C] font-display font-bold tracking-wider text-sm uppercase py-2.5 flex items-center justify-center gap-2 hover:bg-[#FF3B5C]/20 active:scale-95 transition"
          >
            <Trash2 size={15} /> Delete Account
          </button>
        </div>
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setConfirmDelete(false)}>
          <div className="w-full max-w-sm rounded-2xl border border-[#FF3B5C]/40 bg-[#0A0B14] p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle size={18} className="text-[#FF3B5C]" />
                <span className="font-display font-black tracking-wider text-[#FF3B5C] uppercase">Delete Account?</span>
              </div>
              <button onClick={() => setConfirmDelete(false)} className="text-[#94A3B8] hover:text-[#F8FAFC] transition" aria-label="Cancel">
                <X size={18} />
              </button>
            </div>
            <p className="text-sm text-[#94A3B8] mb-5">This will permanently erase all local progress, scores, skins, and credits. This action cannot be undone.</p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmDelete(false)}
                onMouseDown={(e) => e.preventDefault()}
                className="flex-1 rounded-xl border border-white/15 bg-white/5 text-[#F8FAFC] font-bold text-sm py-2.5 hover:bg-white/10 active:scale-95 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => { setConfirmDelete(false); onDeleteAccount && onDeleteAccount(); }}
                onMouseDown={(e) => e.preventDefault()}
                className="flex-1 rounded-xl bg-[#FF3B5C] text-white font-display font-bold tracking-wider text-sm uppercase py-2.5 hover:bg-[#FF3B5C]/90 active:scale-95 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}