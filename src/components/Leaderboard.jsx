import React, { useEffect, useState, useCallback } from "react";
import { ArrowLeft, Trophy, Calendar, User, Globe, Loader2, Radio, Play, WifiOff } from "lucide-react";
import { getLeaderboardSections, fetchGlobalScores, fetchDailyScores, subscribeGlobalScores } from "@/game/storage";
import { dateKey } from "@/game/dailyChallenge";
import PlaybackModal from "@/components/PlaybackModal";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { badgeById } from "@/game/badges";
import { getDifficulty } from "@/game/difficulties";
import NeonBackground from "@/components/ui/NeonBackground";

function fmtDate(ts) {
  const d = new Date(ts);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}
function toMs(d) {
  const t = new Date(d).getTime();
  return isNaN(t) ? 0 : t;
}
function diffColor(id) { return getDifficulty(id).color; }
function diffLabel(id) { return getDifficulty(id).tag; }

export default function Leaderboard({ profile, onBack }) {
  const [tab, setTab] = useState("global");
  const [globalScores, setGlobalScores] = useState([]);
  const [weeklyGlobal, setWeeklyGlobal] = useState([]);
  const [dailyScores, setDailyScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [live, setLive] = useState(false);
  const [playback, setPlayback] = useState(null);
  const online = useOnlineStatus();

  const reload = useCallback(async () => {
    if (!online) return;
    const all = await fetchGlobalScores();
    const arr = all || [];
    setGlobalScores(arr);
    const weekAgo = Date.now() - 7 * 24 * 3600 * 1000;
    setWeeklyGlobal(arr.filter((e) => toMs(e.created_date) >= weekAgo));
    setDailyScores(await fetchDailyScores(dateKey()));
  }, [online]);
  const { ref, pull, refreshing } = usePullToRefresh(reload);

  const sections = getLeaderboardSections(profile.name);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      if (!online) {
        setGlobalScores([]);
        setWeeklyGlobal([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      const all = await fetchGlobalScores();
      if (!alive) return;
      const arr = all || [];
      setGlobalScores(arr);
      const weekAgo = Date.now() - 7 * 24 * 3600 * 1000;
      setWeeklyGlobal(arr.filter((e) => toMs(e.created_date) >= weekAgo));
      setDailyScores(await fetchDailyScores(dateKey()));
      setLoading(false);
    };
    load();
    if (!online) return () => { alive = false; };
    const unsub = subscribeGlobalScores(() => {
      setLive(true);
      load().finally(() => alive && setLive(false));
    });
    return () => { alive = false; if (unsub) unsub(); };
  }, [online]);

  const tabs = [
    { id: "daily", label: "Daily", icon: Calendar },
    { id: "global", label: "Global", icon: Globe },
    { id: "weeklyGlobal", label: "Weekly", icon: Calendar },
    { id: "allTime", label: "Local All", icon: Trophy },
    { id: "personal", label: "Personal", icon: User },
  ];

  let data = [];
  if (tab === "daily") data = dailyScores;
  else if (tab === "global") data = globalScores;
  else if (tab === "weeklyGlobal") data = weeklyGlobal;
  else data = sections[tab] || [];

  const isGlobal = tab === "daily" || tab === "global" || tab === "weeklyGlobal";

  return (
    <div ref={ref} className="relative h-screen w-full bg-[#05060D] text-[#F8FAFC] overflow-y-auto">
      <NeonBackground />
      <div className="flex items-center justify-center overflow-hidden text-[#00F5FF]" style={{ height: pull }}>
        <Loader2 size={22} className={refreshing ? "animate-spin" : ""} />
      </div>
      <div className="sticky top-0 z-20 flex items-center justify-between px-4 sm:px-6 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-3 bg-[#05060D]/90 backdrop-blur border-b border-white/5">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-[#94A3B8] hover:text-[#F8FAFC] transition">
          <ArrowLeft size={18} /> Back
        </button>
        <h1 className="font-display font-black tracking-wider text-lg" style={{ background: "linear-gradient(90deg,#FFD166,#FF2E93)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>
          LEADERBOARD
        </h1>
        <div className="w-16 flex justify-end">
          {live && <Radio size={16} className="text-[#34D399] animate-pulse" />}
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 py-6">
        <div className="flex flex-wrap gap-2 mb-4">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 min-w-[6.5rem] py-2 rounded-xl text-xs font-display font-bold tracking-wider flex items-center justify-center gap-1.5 transition ${tab === t.id ? "bg-[#FFD166]/15 border border-[#FFD166]/40 text-[#FFD166]" : "border border-white/10 bg-white/5 text-[#94A3B8]"}`}
            >
              <t.icon size={13} /> {t.label}
            </button>
          ))}
        </div>

        <div className="text-xs text-[#94A3B8] mb-3 px-1 flex items-center gap-1.5">
          {isGlobal ? (
            online ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-[#34D399] animate-pulse" /> {tab === "daily" ? "Daily challenge — same modifiers, same leaderboard for all pilots today." : "Global leaderboard — live scores from all players worldwide."}
              </>
            ) : (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF3B5C]" /> You're offline — global scores aren't available. Local scores still work.
              </>
            )
          ) : (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-[#FFD166]" /> Local leaderboard — your runs saved on this device.
            </>
          )}
        </div>

        {tab === "daily" && dailyScores.length > 0 && dailyScores[0]?.path?.length >= 4 && (
          <button
            onClick={() => setPlayback(dailyScores[0])}
            onMouseDown={(e) => e.preventDefault()}
            className="w-full mb-3 py-3 rounded-xl border border-[#FF2E93]/40 bg-[#FF2E93]/10 text-[#FF2E93] font-display font-bold tracking-wider flex items-center justify-center gap-2 hover:bg-[#FF2E93]/20 active:scale-95 transition"
          >
            <Play size={16} fill="#FF2E93" /> WATCH TODAY'S BEST: {dailyScores[0].player_name}
          </button>
        )}

        {isGlobal && !online ? (
          <div className="rounded-2xl border border-[#FF3B5C]/25 bg-[#FF3B5C]/5 p-10 text-center">
            <WifiOff size={28} className="mx-auto text-[#FF3B5C] mb-2" />
            <p className="text-[#94A3B8] text-sm">You're offline. Global scores aren't available right now — your local scores and personal bests still work.</p>
          </div>
        ) : isGlobal && loading ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center">
            <Loader2 size={28} className="mx-auto text-[#00F5FF] animate-spin mb-2" />
            <p className="text-[#94A3B8] text-sm">Loading global scores…</p>
          </div>
        ) : data.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center">
            <Trophy size={32} className="mx-auto text-[#94A3B8] mb-2" />
            <p className="text-[#94A3B8] text-sm">{isGlobal ? "No global scores yet. Be the first to claim the top spot!" : "No scores yet. Play a run to claim the top spot!"}</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {data.map((e, i) => {
              const name = isGlobal ? e.player_name : e.name;
              const score = isGlobal ? e.score : e.score;
              const date = isGlobal ? new Date(e.created_date).getTime() : e.date;
              const time = isGlobal ? e.duration : e.time;
              const wave = isGlobal ? e.wave : e.wave;
              const mine = name === profile.name && tab !== "personal";
              return (
                <div
                  key={e.id || i}
                  className={`flex items-center gap-3 rounded-xl p-3 border ${mine ? "border-[#00F5FF]/50 bg-[#00F5FF]/10" : "border-white/10 bg-white/5"}`}
                >
                  <div className={`w-8 text-center font-display font-bold tabular-nums ${i === 0 ? "text-[#FFD166]" : i === 1 ? "text-[#CBD5E1]" : i === 2 ? "text-[#FF8A65]" : "text-[#94A3B8]"}`}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm truncate">{name}</span>
                      {isGlobal && e.difficulty && e.difficulty !== "normal" && (
                        <span className="shrink-0 px-1.5 py-0.5 rounded text-xs font-display font-bold tracking-wider" style={{ color: diffColor(e.difficulty), background: `${diffColor(e.difficulty)}1a`, border: `1px solid ${diffColor(e.difficulty)}40` }}>
                          {diffLabel(e.difficulty)}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-[#94A3B8]">{fmtDate(date)} · {time}s · W{wave}</div>
                    {isGlobal && e.badges && e.badges.length > 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        {e.badges.slice(0, 5).map((id) => {
                          const b = badgeById(id);
                          if (!b) return null;
                          const Icon = b.icon;
                          return <Icon key={id} size={12} style={{ color: b.color }} title={b.name} />;
                        })}
                      </div>
                    )}
                  </div>
                  <div className="font-display font-bold tabular-nums text-[#F8FAFC]">{Number(score).toLocaleString()}</div>
                  {isGlobal && e.path && e.path.length >= 4 && (
                    <button
                      onClick={() => setPlayback(e)}
                      onMouseDown={(ev) => ev.preventDefault()}
                      className="shrink-0 w-8 h-8 rounded-lg border border-[#00F5FF]/30 bg-[#00F5FF]/10 text-[#00F5FF] flex items-center justify-center hover:bg-[#00F5FF]/20 active:scale-95 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00F5FF]/50"
                      aria-label="Watch run playback"
                      title="Watch run playback"
                    >
                      <Play size={13} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      {playback && <PlaybackModal entry={playback} onClose={() => setPlayback(null)} />}
    </div>
  );
}