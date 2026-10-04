import React, { useEffect, useState } from "react";
import { RotateCcw, Home, Trophy, Zap, Target, Clock, Flame, Share2, Twitter, Facebook, Link2, Check, Swords } from "lucide-react";
import { fireBigConfetti } from "@/lib/confetti";

function Stat({ icon: Icon, label, value, color }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-white/5 border border-white/10 px-3 py-2">
      <Icon size={16} style={{ color }} />
      <span className="text-xs text-[#94A3B8] uppercase tracking-wider flex-1">{label}</span>
      <span className="font-display font-bold tabular-nums text-[#F8FAFC]">{value}</span>
    </div>
  );
}

export default function GameOver({ summary, onRestart, onMenu, onLeaderboard, isNewBest }) {
  const [displayScore, setDisplayScore] = useState(0);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [challengeToast, setChallengeToast] = useState(false);
  const [challengeSeed] = useState(() => Math.floor(Math.random() * 1e9).toString(36));
  const GAME_URL = "https://the-neonrush.base44.app";
  const challengeId = `${summary.score.toString(36)}-${challengeSeed}`;
  const challengeUrl = `${GAME_URL}/?challenge=${challengeId}`;
  const challengeBadge = `I survived ${summary.time}s in NEON RUSH! Can you beat me?`;
  const challengeFriend = async () => {
    try { await navigator.clipboard.writeText(`${challengeBadge} ${challengeUrl}`); } catch { /* ignore */ }
    setChallengeToast(true);
    setTimeout(() => setChallengeToast(false), 2200);
  };
  const shareText = `I scored ${summary.score.toLocaleString()} points in NEON RUSH, reaching Wave ${summary.wave} with ${summary.nearMisses} near misses! Can you beat me?`;
  const shareX = () => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(GAME_URL)}`, "_blank", "noopener");
  const shareFb = () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(GAME_URL)}&quote=${encodeURIComponent(shareText)}`, "_blank", "noopener");
  const copyLink = () => { try { navigator.clipboard.writeText(`${shareText} ${GAME_URL}`); } catch { /* ignore */ } setCopied(true); setTimeout(() => setCopied(false), 2000); };
  const shareNative = () => { if (navigator.share) navigator.share({ title: "NEON RUSH", text: shareText, url: GAME_URL }).catch(() => {}); else copyLink(); };
  const playAgain = () => {
    if (busy) return;
    setBusy(true);
    onRestart();
  };
  useEffect(() => {
    let raf;
    const start = performance.now();
    const dur = 900;
    const tick = (t) => {
      const p = Math.min(1, (t - start) / dur);
      setDisplayScore(Math.floor(summary.score * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [summary.score]);

  useEffect(() => {
    if (isNewBest) {
      const t1 = setTimeout(() => fireBigConfetti(), 300);
      return () => clearTimeout(t1);
    }
  }, [isNewBest]);

  return (
    <div className="absolute inset-0 z-20 overflow-y-auto bg-[#05060D]/85 backdrop-blur-md">
      <div className="min-h-full flex items-center justify-center p-4">
      <div className="w-[min(92vw,440px)] rounded-2xl border border-[#FF2E93]/30 bg-[#0B1020]/95 p-6 shadow-[0_0_50px_rgba(255,46,147,0.2)] my-auto">
        {isNewBest ? (
          <div className="text-center" style={{ animation: "nr-pb 0.6s ease-out" }}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full" style={{ background: "linear-gradient(90deg,#FFD166,#FF2E93)" }}>
              <Trophy size={14} className="text-[#05060D]" />
              <span className="font-display font-black tracking-widest text-sm text-[#05060D]">NEW PERSONAL BEST</span>
            </div>
            <h2 className="font-display text-2xl font-bold tracking-widest mt-2" style={{ background: "linear-gradient(90deg,#FFD166,#FF2E93)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>
              RUN COMPLETE
            </h2>
          </div>
        ) : (
          <h2 className="font-display text-2xl font-bold text-center tracking-widest text-[#FF2E93]" style={{ textShadow: "0 0 16px rgba(255,46,147,0.6)" }}>
            RUN COMPLETE
          </h2>
        )}
        <div className="mt-4 text-center">
          <div className="text-xs text-[#94A3B8] uppercase tracking-widest">Final Score</div>
          <div className="font-display text-5xl font-bold tabular-nums text-[#F8FAFC]" style={{ textShadow: "0 0 20px rgba(0,245,255,0.5)" }}>
            {displayScore.toLocaleString()}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2">
          <Stat icon={Clock} label="Time" value={`${String(Math.floor(summary.time / 60)).padStart(2, "0")}:${String(summary.time % 60).padStart(2, "0")}`} color="#00F5FF" />
          <Stat icon={Trophy} label="Wave" value={summary.wave} color="#FFD166" />
          <Stat icon={Zap} label="Energy" value={summary.energy} color="#FFD166" />
          <Stat icon={Target} label="Near Miss" value={summary.nearMisses} color="#00F5FF" />
          <Stat icon={Flame} label="Best Combo" value={`x${summary.maxCombo}`} color="#FF2E93" />
          <Stat icon={Zap} label="Orbs" value={summary.orbsCollected} color="#8B5CF6" />
          <Stat icon={Target} label="Objectives" value={summary.objectivesCompleted || 0} color="#FFD166" />
          <Stat icon={Swords} label="Events" value={summary.eventsSurvived || 0} color="#FF8A3D" />
        </div>

        <div className="mt-6 space-y-2.5">
          <button
            onClick={playAgain}
            onMouseDown={(e) => e.preventDefault()}
            disabled={busy}
            className="w-full py-3 rounded-xl bg-[#00F5FF] text-[#05060D] font-display font-bold tracking-wider flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00F5FF]/50 disabled:opacity-60 disabled:active:scale-100"
          >
            <RotateCcw size={18} /> PLAY AGAIN
          </button>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={onLeaderboard}
              onMouseDown={(e) => e.preventDefault()}
              className="py-3 rounded-xl border border-[#FFD166]/40 bg-[#FFD166]/10 text-[#FFD166] font-display font-bold tracking-wider flex items-center justify-center gap-2 hover:bg-[#FFD166]/20 active:scale-95 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD166]/50"
            >
              <Trophy size={16} /> SCORES
            </button>
            <button
              onClick={onMenu}
              onMouseDown={(e) => e.preventDefault()}
              className="py-3 rounded-xl border border-white/15 bg-white/5 text-[#F8FAFC] font-display font-bold tracking-wider flex items-center justify-center gap-2 hover:bg-white/10 active:scale-95 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
            >
              <Home size={16} /> MENU
            </button>
          </div>
        </div>

        {/* Share */}
        <div className="mt-4">
          <div className="text-xs text-[#94A3B8] uppercase tracking-widest text-center mb-2">Brag about your run</div>
          <button
            onClick={challengeFriend}
            onMouseDown={(e) => e.preventDefault()}
            className="w-full py-2.5 rounded-xl border border-[#FF2E93]/50 bg-[#FF2E93]/10 text-[#FF2E93] font-display font-bold tracking-wider flex items-center justify-center gap-2 hover:bg-[#FF2E93]/20 active:scale-95 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF2E93]/50"
          >
            <Swords size={16} /> CHALLENGE FRIEND
          </button>
          <button
            onClick={shareNative}
            onMouseDown={(e) => e.preventDefault()}
            className="w-full py-2.5 rounded-xl border border-[#00F5FF]/40 bg-[#00F5FF]/10 text-[#00F5FF] font-display font-bold tracking-wider flex items-center justify-center gap-2 hover:bg-[#00F5FF]/20 active:scale-95 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00F5FF]/50"
          >
            <Share2 size={16} /> SHARE RUN
          </button>
          <div className="mt-2 grid grid-cols-3 gap-2">
            <button onClick={shareX} onMouseDown={(e) => e.preventDefault()} className="py-2.5 rounded-lg border border-[#00F5FF]/40 bg-[#00F5FF]/10 text-[#00F5FF] text-xs font-display font-bold tracking-wider flex items-center justify-center gap-1.5 hover:bg-[#00F5FF]/20 active:scale-95 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00F5FF]/50" aria-label="Share on X">
              <Twitter size={14} /> X
            </button>
            <button onClick={shareFb} onMouseDown={(e) => e.preventDefault()} className="py-2.5 rounded-lg border border-[#8B5CF6]/40 bg-[#8B5CF6]/10 text-[#A78BFA] text-xs font-display font-bold tracking-wider flex items-center justify-center gap-1.5 hover:bg-[#8B5CF6]/20 active:scale-95 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6]/50" aria-label="Share on Facebook">
              <Facebook size={14} /> Facebook
            </button>
            <button onClick={copyLink} onMouseDown={(e) => e.preventDefault()} className="py-2.5 rounded-lg border border-[#FF2E93]/40 bg-[#FF2E93]/10 text-[#FF2E93] text-xs font-display font-bold tracking-wider flex items-center justify-center gap-1.5 hover:bg-[#FF2E93]/20 active:scale-95 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF2E93]/50" aria-label="Copy link">
              {copied ? <><Check size={14} className="text-[#34D399]" /> Copied</> : <><Link2 size={14} /> Copy</>}
            </button>
          </div>
        </div>
      </div>
      </div>
      {challengeToast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl border border-[#FF2E93]/50 bg-[#0B1020]/95 text-[#F8FAFC] font-display font-bold tracking-wider text-sm flex items-center gap-2 shadow-[0_0_24px_rgba(255,46,147,0.4)]"
          style={{ animation: "nr-toast 0.25s ease-out" }}
        >
          <Check size={16} className="text-[#FF2E93]" /> CHALLENGE LINK COPIED!
        </div>
      )}
    </div>
  );
}