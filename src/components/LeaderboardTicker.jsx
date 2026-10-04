import React, { useEffect, useState } from "react";
import { Trophy, ChevronRight } from "lucide-react";
import { fetchGlobalScores } from "@/game/storage";

function fmtTime(sec) {
  const s = Math.max(0, Math.floor(sec || 0));
  const mm = Math.floor(s / 60) % 60;
  const ss = s % 60;
  return `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}

export default function LeaderboardTicker({ onOpenLeaderboard }) {
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    fetchGlobalScores()
      .then((rows) => {
        if (!alive) return;
        setScores((rows || []).slice(0, 10));
        setLoading(false);
      })
      .catch(() => alive && setLoading(false));
    return () => { alive = false; };
  }, []);

  if (loading) {
    return (
      <div className="w-full max-w-xl mx-auto mt-6 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-center text-xs text-[#94A3B8]">
        Loading global leaderboard…
      </div>
    );
  }
  if (!scores.length) {
    return (
      <div className="w-full max-w-xl mx-auto mt-6 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-center text-xs text-[#94A3B8]">
        No global scores yet — be the first to claim the top!
      </div>
    );
  }

  const items = [...scores, ...scores];
  return (
    <div className="w-full max-w-xl mx-auto mt-6">
      <div className="flex items-center gap-2 mb-1.5 px-1">
        <Trophy size={13} className="text-[#FFD166]" />
        <span className="text-xs uppercase tracking-widest text-[#94A3B8]">Top Runs Worldwide</span>
      </div>
      <div className="relative overflow-hidden rounded-xl border border-[#FFD166]/25 bg-[#0B1020]/60">
        <div className="flex whitespace-nowrap" style={{ animation: "nr-ticker 32s linear infinite" }}>
          {items.map((s, i) => (
            <div key={i} className="shrink-0 flex items-center gap-2 px-4 py-2 border-r border-white/5">
              <span className="font-display font-black text-xs text-[#FFD166] tabular-nums">#{(i % scores.length) + 1}</span>
              <span className="font-display font-bold text-sm text-[#F8FAFC] max-w-[120px] truncate">{s.player_name || "PILOT"}</span>
              <span className="font-display font-bold text-sm text-[#00F5FF] tabular-nums">{(s.score || 0).toLocaleString()}</span>
              <span className="text-xs text-[#94A3B8] tabular-nums">⏱{fmtTime(s.duration)}</span>
            </div>
          ))}
        </div>
        <div className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-[#0B1020] to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-[#0B1020] to-transparent" />
      </div>
      <button
        onClick={onOpenLeaderboard}
        onMouseDown={(e) => e.preventDefault()}
        className="mt-1.5 w-full flex items-center justify-center gap-1 text-xs text-[#00F5FF] font-bold hover:underline"
      >
        View full leaderboard <ChevronRight size={12} />
      </button>
    </div>
  );
}