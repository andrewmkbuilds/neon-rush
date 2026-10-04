import React from "react";
import { Lock, Check, ChevronRight, BookOpen, Star } from "lucide-react";
import { CHAPTERS, chapterStatus } from "@/game/story";
import { SIDE_QUESTS, getActiveSideQuests } from "@/game/sidequests";

const DIFF_COLOR = { easy: "#34D399", normal: "#FFD166", hard: "#FF3B5C" };

function ChapterDot({ status, num }) {
  const color = status === "completed" ? "#34D399" : status === "available" ? "#8B5CF6" : "#475569";
  return (
    <div
      className="w-7 h-7 rounded-full flex items-center justify-center font-display font-black text-xs shrink-0 z-10"
      style={{ background: `${color}1f`, color, boxShadow: status === "available" ? `0 0 14px ${color}66` : "none", border: `2px solid ${color}` }}
    >
      {status === "completed" ? <Check size={15} /> : status === "locked" ? <Lock size={12} /> : num}
    </div>
  );
}

function SideQuestNode({ sq, view, onNav }) {
  const v = view.find((x) => x.id === sq.id) || { unlocked: false, complete: false, claimed: false, progress: 0 };
  const color = v.claimed ? "#34D399" : v.complete ? "#FFD166" : v.unlocked ? "#FFD166" : "#475569";
  return (
    <button
      onClick={() => v.unlocked && onNav && onNav("sidequests")}
      disabled={!v.unlocked}
      onMouseDown={(e) => e.preventDefault()}
      className={`w-full text-left flex items-center gap-2 rounded-xl border px-2.5 py-2 transition active:scale-[0.99] ${v.unlocked ? "border-[#FFD166]/25 bg-[#FFD166]/[0.05] hover:bg-[#FFD166]/10" : "border-white/5 bg-white/[0.02] opacity-70"}`}
    >
      <BookOpen size={13} style={{ color }} className="shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="font-display font-bold text-xs tracking-wider truncate" style={{ color: v.unlocked ? "#F8FAFC" : "#64748B" }}>{sq.name}</div>
        <div className="text-xs text-[#94A3B8] truncate">
          {v.claimed ? "Completed" : v.complete ? "Ready to claim" : v.unlocked ? `${v.progress}/${sq.objective.target}` : `Unlocks here`}
        </div>
      </div>
      {v.unlocked && !v.claimed && <ChevronRight size={13} className="text-[#FFD166] shrink-0" />}
      {v.claimed && <Check size={13} className="text-[#34D399] shrink-0" />}
    </button>
  );
}

export default function CampaignMap({ profile, onSelect, onNav }) {
  const sqView = getActiveSideQuests(profile);
  const storyDone = profile.storyProgress?.completed || [];

  return (
    <div className="relative">
      <p className="text-sm text-[#94A3B8] mb-5 text-center">
        Year 2189. THE NEXUS GRID has fallen silent. Follow the signal, complete chapters, and branch into side quests as they unlock.
      </p>

      <div className="space-y-0">
        {CHAPTERS.map((ch, i) => {
          const status = chapterStatus(profile, ch.num);
          const sqs = SIDE_QUESTS.filter((sq) => sq.unlockChapter === ch.num);
          const isLast = i === CHAPTERS.length - 1;
          const spineColor = status === "completed" ? "#34D399" : "rgba(139,92,246,0.45)";
          return (
            <div key={ch.id} className="flex gap-3">
              {/* spine column */}
              <div className="relative flex flex-col items-center w-7 shrink-0">
                <ChapterDot status={status} num={ch.num} />
                {!isLast && <div className="flex-1 w-0.5 my-1 rounded-full" style={{ background: spineColor }} />}
              </div>

              {/* content */}
              <div className="flex-1 min-w-0 pb-5">
                <button
                  onClick={() => status === "available" && onSelect(ch)}
                  disabled={status === "locked"}
                  onMouseDown={(e) => e.preventDefault()}
                  className={`w-full text-left rounded-2xl border p-3 transition active:scale-[0.99] ${status === "locked" ? "border-white/5 bg-white/[0.02] opacity-60" : "border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20"}`}
                  style={status === "available" ? { boxShadow: "0 0 18px rgba(139,92,246,0.25)" } : undefined}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-display font-bold tracking-wider text-sm flex-1 truncate">{ch.title}</span>
                    <span className="px-1.5 py-0.5 rounded text-xs font-display font-bold tracking-wider uppercase shrink-0" style={{ color: DIFF_COLOR[ch.difficulty], background: `${DIFF_COLOR[ch.difficulty]}1a` }}>{ch.difficulty}</span>
                    {status === "available" && <ChevronRight size={15} className="text-[#8B5CF6] shrink-0" />}
                    {status === "completed" && <Check size={15} className="text-[#34D399] shrink-0" />}
                  </div>
                  <div className="text-xs text-[#94A3B8] mt-0.5 truncate">{ch.objective.label}</div>
                  <div className="mt-1.5 flex items-center gap-2 text-xs text-[#94A3B8]">
                    <span className="flex items-center gap-0.5"><Star size={10} className="text-[#FFD166]" /> {ch.reward.xp} XP</span>
                    {ch.reward.credits > 0 && <span className="flex items-center gap-0.5">+{ch.reward.credits} cr</span>}
                    {status === "locked" && <span className="text-[#64748B]">· Clear Ch {ch.num - 1}</span>}
                  </div>
                </button>

                {/* side quests branching at this chapter */}
                {sqs.length > 0 && (
                  <div className="mt-2 ml-1 pl-3 border-l-2 border-[#FFD166]/25 space-y-1.5">
                    <div className="text-xs uppercase tracking-widest text-[#FFD166]/80 flex items-center gap-1"><BookOpen size={10} /> Side Quests</div>
                    {sqs.map((sq) => (
                      <SideQuestNode key={sq.id} sq={sq} view={sqView} onNav={onNav} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {storyDone.length >= CHAPTERS.length && (
        <div className="mt-2 rounded-2xl border border-[#34D399]/30 bg-[#34D399]/5 p-3 text-center text-xs text-[#34D399] font-display font-bold tracking-wider">
          CAMPAIGN COMPLETE — THE SIGNAL IS SILENT
        </div>
      )}
    </div>
  );
}