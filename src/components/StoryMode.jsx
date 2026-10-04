import React, { useEffect, useState } from "react";
import { ArrowLeft, Play, Star, Gem } from "lucide-react";
import { getSkin } from "@/game/skins";
import CampaignMap from "@/components/CampaignMap";
import NeonBackground from "@/components/ui/NeonBackground";

function RewardTag({ reward }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 text-xs text-[#94A3B8]">
      {reward.credits > 0 && <span className="flex items-center gap-0.5"><Gem size={11} className="text-[#00F5FF]" /> {reward.credits}</span>}
      {reward.xp > 0 && <span className="flex items-center gap-0.5"><Star size={11} className="text-[#FFD166]" /> {reward.xp} XP</span>}
      {reward.skin && <span className="flex items-center gap-0.5" style={{ color: getSkin(reward.skin).color }}>{getSkin(reward.skin).name}</span>}
      {reward.title && <span className="text-[#A78BFA]">“{reward.title}”</span>}
    </div>
  );
}

function Dialogue({ lines }) {
  return (
    <div className="space-y-2.5">
      {lines.map((l, i) => (
        <div key={i} className="flex gap-2.5">
          <div className="shrink-0 w-1.5 rounded-full" style={{ background: l.who === "ORION" ? "#00F5FF" : "#FF2E93" }} />
          <div>
            <div className="text-xs uppercase tracking-widest" style={{ color: l.who === "ORION" ? "#00F5FF" : "#FF2E93" }}>{l.who}</div>
            <div className="text-sm text-[#F8FAFC]">{l.text}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function StoryMode({ profile, onBack, onStartChapter, storyResult, onResultSeen, onNav }) {
  const [view, setView] = useState("list");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (storyResult) setView("debrief");
  }, [storyResult]);

  const startBriefing = (ch) => { setSelected(ch); setView("briefing"); };

  const deploy = () => {
    if (!selected) return;
    onStartChapter(selected);
  };

  const backToList = () => {
    onResultSeen && onResultSeen();
    setSelected(null);
    setView("list");
  };

  return (
    <div className="relative h-screen w-full bg-[#05060D] text-[#F8FAFC] overflow-y-auto">
      <NeonBackground />
      <div className="sticky top-0 z-20 flex items-center justify-between px-4 sm:px-6 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-3 bg-[#05060D]/90 backdrop-blur border-b border-white/5">
        <button onClick={view === "list" ? onBack : backToList} className="flex items-center gap-2 text-sm text-[#94A3B8] hover:text-[#F8FAFC] transition">
          <ArrowLeft size={18} /> {view === "list" ? "Back" : "Chapters"}
        </button>
        <h1 className="font-display font-black tracking-wider text-xs sm:text-lg" style={{ background: "linear-gradient(90deg,#8B5CF6,#00F5FF)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>
          STORY — THE LAST SIGNAL
        </h1>
        <div className="w-20" />
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {view === "list" && (
          <CampaignMap profile={profile} onSelect={startBriefing} onNav={onNav} />
        )}

        {view === "briefing" && selected && (
          <div className="space-y-5">
            <div className="rounded-2xl border border-[#8B5CF6]/30 bg-[#8B5CF6]/5 p-4">
              <div className="text-xs uppercase tracking-widest text-[#8B5CF6]">Mission Briefing — Chapter {selected.num}</div>
              <h2 className="font-display font-black tracking-wider text-xl mt-0.5">{selected.title}</h2>
              <div className="text-xs text-[#94A3B8] mt-1">{selected.setting}</div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {selected.enemies.map((e) => (
                  <span key={e} className="px-2 py-0.5 rounded-full text-xs bg-white/5 border border-white/10 text-[#CBD5E1]">{e}</span>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <Dialogue lines={selected.briefing} />
            </div>
            <div className="rounded-2xl border border-[#00F5FF]/25 bg-[#00F5FF]/5 p-4">
              <div className="text-xs uppercase tracking-widest text-[#00F5FF] mb-1">Objective</div>
              <div className="text-sm font-display font-bold">{selected.objective.label}</div>
            </div>
            <button
              onClick={deploy}
              onMouseDown={(e) => e.preventDefault()}
              className="w-full py-3.5 rounded-2xl font-display font-black tracking-[0.15em] text-[#05060D] active:scale-95 transition"
              style={{ background: "linear-gradient(90deg,#00F5FF,#8B5CF6)", boxShadow: "0 0 20px rgba(0,245,255,0.4)" }}
            >
              <span className="flex items-center justify-center gap-2"><Play size={18} fill="#05060D" /> DEPLOY</span>
            </button>
          </div>
        )}

        {view === "debrief" && storyResult && (() => {
          const ch = storyResult.chapter;
          const lines = storyResult.success ? ch.debriefSuccess : ch.debriefFail;
          return (
            <div className="space-y-5">
              <div className={`rounded-2xl border p-4 text-center ${storyResult.success ? "border-[#34D399]/30 bg-[#34D399]/5" : "border-[#FF3B5C]/30 bg-[#FF3B5C]/5"}`}>
                <div className={`text-xs uppercase tracking-widest ${storyResult.success ? "text-[#34D399]" : "text-[#FF3B5C]"}`}>{storyResult.success ? "Mission Complete" : "Mission Failed"}</div>
                <h2 className="font-display font-black tracking-wider text-xl mt-0.5">{ch.title}</h2>
                <div className="text-xs text-[#94A3B8] mt-1">Score {storyResult.score?.toLocaleString()} · {storyResult.time}s · Wave {storyResult.wave}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <Dialogue lines={lines} />
              </div>
              {storyResult.success && storyResult.firstCompletion && (
                <div className="rounded-2xl border border-[#FFD166]/30 bg-[#FFD166]/5 p-4">
                  <div className="text-xs uppercase tracking-widest text-[#FFD166] mb-1.5">Rewards Earned</div>
                  <RewardTag reward={ch.reward} />
                </div>
              )}
              <button onClick={backToList} className="w-full py-3 rounded-2xl border border-white/15 bg-white/5 font-display font-bold tracking-wider active:scale-95 transition">
                CONTINUE
              </button>
            </div>
          );
        })()}
      </div>
    </div>
  );
}