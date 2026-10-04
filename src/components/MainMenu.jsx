import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Play, HelpCircle, Trophy, Plane, User, Calendar, ChevronRight, Gem, Settings as SettingsIcon, Flame, TrendingUp, LogIn } from "lucide-react";
import TopNav from "./TopNav";
import LeaderboardTicker from "./LeaderboardTicker";
import { getTodayChallenge } from "@/game/challenges";

function StatChip({ label, value, color }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-center">
      <div className="text-xs uppercase tracking-widest text-[#94A3B8]">{label}</div>
      <div className="font-display font-bold text-lg tabular-nums" style={{ color }}>{value}</div>
    </div>
  );
}

export default function MainMenu({ profile, onPlay, onNav, audio, user, isAuthenticated, onSignIn, onLogout }) {
  const [titlePulse, setTitlePulse] = useState(false);
  const challenge = getTodayChallenge();

  useEffect(() => {
    const t = setInterval(() => setTitlePulse((p) => !p), 1800);
    return () => clearInterval(t);
  }, []);

  const challengePct = Math.min(100, (profile.challenge.progress / challenge.target) * 100);

  return (
    <div className="relative h-screen w-full overflow-y-auto bg-[#05060D] text-[#F8FAFC]">
      <StarfieldBg />
      <TopNav profile={profile} onNav={onNav} onPlay={onPlay} audio={audio} />

      <div className="relative z-10 flex flex-col items-center justify-center px-4 pt-24 pb-12 min-h-screen">
        {/* Title */}
        <h1
          className="font-display font-black tracking-[0.15em] text-center leading-none transition-transform duration-700"
          style={{
            fontSize: "clamp(3rem, 11vw, 7rem)",
            background: "linear-gradient(180deg,#00F5FF 0%,#8B5CF6 60%,#FF2E93 100%)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
            filter: `drop-shadow(0 0 ${titlePulse ? 28 : 16}px rgba(0,245,255,0.5))`,
            transform: titlePulse ? "scale(1.02)" : "scale(1)",
          }}
        >
          NEON RUSH
        </h1>
        <p className="mt-3 text-sm sm:text-base text-[#94A3B8] tracking-widest uppercase text-center max-w-md">
          Enter the neon arena. Dodge the impossible. Chase the perfect run.
        </p>

        {/* Ship preview */}
        <div className="my-6 sm:my-8 relative h-20 w-40 flex items-center justify-center">
          <div
            className="absolute inset-0 rounded-full blur-2xl opacity-40"
            style={{ background: "radial-gradient(circle,#00F5FF,transparent 70%)" }}
          />
          <svg width="120" height="60" viewBox="-60 -30 120 60" className="relative animate-pulse">
            <polygon points="40,0 -30,-22 -16,0 -30,22" fill="rgba(5,6,13,0.85)" stroke="#00F5FF" strokeWidth="2.5" style={{ filter: "drop-shadow(0 0 8px #00F5FF)" }} />
            <circle cx="0" cy="0" r="5" fill="#fff" style={{ filter: "drop-shadow(0 0 8px #fff)" }} />
          </svg>
        </div>

        {/* Play */}
        <button
          onClick={onPlay}
          onMouseDown={(e) => e.preventDefault()}
          className="group relative px-12 py-4 rounded-2xl font-display font-black text-xl tracking-[0.2em] text-[#05060D] active:scale-95 transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00F5FF]/60"
          style={{ background: "linear-gradient(90deg,#00F5FF,#8B5CF6)", boxShadow: "0 0 30px rgba(0,245,255,0.5)" }}
        >
          <span className="flex items-center gap-3"><Play size={22} fill="#05060D" /> PLAY NOW</span>
          <span className="absolute -inset-0.5 rounded-2xl border border-[#00F5FF]/40 -z-10 group-hover:scale-105 transition-transform" />
        </button>
        <button
          onClick={() => onNav("howto")}
          onMouseDown={(e) => e.preventDefault()}
          className="mt-3 px-6 py-2.5 rounded-xl border border-white/15 bg-white/5 text-[#F8FAFC] font-display font-bold tracking-wider text-sm flex items-center gap-2 hover:bg-white/10 active:scale-95 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
        >
          <HelpCircle size={16} /> HOW TO PLAY
        </button>

        <LeaderboardTicker onOpenLeaderboard={() => onNav("leaderboard")} />

        {/* Account */}
        {isAuthenticated ? (
          <div className="mt-5 w-full max-w-xl rounded-2xl border border-[#00F5FF]/25 bg-[#00F5FF]/5 p-3 flex items-center gap-3">
            <div className="shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-[#00F5FF] to-[#8B5CF6] flex items-center justify-center font-display font-black text-[#05060D]">
              {(user?.full_name || user?.email || "P").charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs uppercase tracking-widest text-[#94A3B8]">Signed in</div>
              <div className="font-display font-bold text-sm truncate">{user?.full_name || user?.email}</div>
            </div>
            <button onClick={onLogout} className="px-3 py-1.5 rounded-lg border border-white/15 bg-white/5 text-xs font-bold hover:bg-white/10 active:scale-95 transition">Sign Out</button>
          </div>
        ) : (
          <button onClick={onSignIn} className="mt-5 w-full max-w-xl rounded-2xl border border-[#00F5FF]/30 bg-[#00F5FF]/5 px-4 py-3 flex items-center gap-3 hover:bg-[#00F5FF]/10 active:scale-95 transition">
            <div className="shrink-0 w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
              <LogIn size={18} className="text-[#00F5FF]" />
            </div>
            <div className="flex-1 text-left">
              <div className="font-display font-bold text-sm">Sign In or Sign Up</div>
              <div className="text-xs text-[#94A3B8]">Save your scores to your account & share your results</div>
            </div>
            <ChevronRight size={18} className="text-[#94A3B8]" />
          </button>
        )}

        {/* Stats */}
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full max-w-xl">
          <StatChip label="Personal Best" value={profile.bestScore.toLocaleString()} color="#FFD166" />
          <StatChip label="Total Runs" value={profile.totalRuns} color="#00F5FF" />
          <StatChip label="Energy" value={profile.totalEnergy} color="#8B5CF6" />
          <StatChip label="Best Combo" value={`x${profile.bestCombo}`} color="#FF2E93" />
        </div>

        {/* Login streak */}
        <div className="mt-5 w-full max-w-xl rounded-2xl border border-[#FF2E93]/25 bg-[#FF2E93]/5 p-4 flex items-center gap-4">
          <div className="shrink-0 w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,46,147,0.15)", boxShadow: "0 0 16px rgba(255,46,147,0.3)" }}>
            <Flame size={24} className="text-[#FF2E93]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-display font-bold tracking-wider text-[#FF2E93] text-sm uppercase">Login Streak</span>
              <span className="ml-auto font-display font-black text-2xl tabular-nums text-[#F8FAFC]">
                {profile.loginStreak || 0}<span className="text-sm text-[#94A3B8] font-bold ml-1">DAY{(profile.loginStreak || 0) === 1 ? "" : "S"}</span>
              </span>
            </div>
            <p className="text-xs text-[#94A3B8] mt-0.5">Open daily to grow your streak and earn bonus Neon Credits.</p>
          </div>
        </div>

        {/* Daily challenge */}
        <div className="mt-5 w-full max-w-xl rounded-2xl border border-[#FFD166]/25 bg-[#FFD166]/5 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar size={16} className="text-[#FFD166]" />
            <span className="font-display font-bold tracking-wider text-[#FFD166] text-sm uppercase">Daily Challenge</span>
            <span className="ml-auto text-xs text-[#94A3B8]">+{challenge.reward} energy</span>
          </div>
          <p className="text-sm text-[#F8FAFC]">{challenge.desc}</p>
          <div className="mt-2.5 h-2 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full rounded-full bg-[#FFD166]" style={{ width: `${challengePct}%`, boxShadow: "0 0 10px #FFD166" }} />
          </div>
          <div className="mt-1.5 flex items-center justify-between text-xs text-[#94A3B8]">
            <span>{profile.challenge.progress} / {challenge.target}</span>
            {profile.challenge.completed ? (
              <span className="text-[#FFD166] font-bold">COMPLETE — claim in profile</span>
            ) : (
              <button onClick={onPlay} className="text-[#00F5FF] font-bold flex items-center gap-1 hover:underline">
                Start run <ChevronRight size={12} />
              </button>
            )}
          </div>
        </div>

        {/* quick nav */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button onClick={() => onNav("hangar")} className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-sm flex items-center gap-2 hover:bg-white/10 active:scale-95 transition">
            <Plane size={15} className="text-[#8B5CF6]" /> Hangar
          </button>
          <button onClick={() => onNav("store")} className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-sm flex items-center gap-2 hover:bg-white/10 active:scale-95 transition" style={{ borderColor: "rgba(0,245,255,0.3)" }}>
            <Gem size={15} className="text-[#00F5FF]" /> Store
          </button>
          <button onClick={() => onNav("leaderboard")} className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-sm flex items-center gap-2 hover:bg-white/10 active:scale-95 transition">
            <Trophy size={15} className="text-[#FFD166]" /> Leaderboard
          </button>
          <button onClick={() => onNav("stats")} className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-sm flex items-center gap-2 hover:bg-white/10 active:scale-95 transition">
            <TrendingUp size={15} className="text-[#00F5FF]" /> Stats
          </button>
          <button onClick={() => onNav("profile")} className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-sm flex items-center gap-2 hover:bg-white/10 active:scale-95 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00F5FF]/40">
            <User size={15} className="text-[#00F5FF]" /> Profile
          </button>
          <button onClick={() => onNav("settings")} className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-sm flex items-center gap-2 hover:bg-white/10 active:scale-95 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00F5FF]/40">
            <SettingsIcon size={15} className="text-[#00F5FF]" /> Settings
          </button>
        </div>

        <div className="mt-8 flex items-center justify-center gap-4 text-xs text-[#64748B]">
          <Link to="/about" className="hover:text-[#00F5FF] transition">About</Link>
          <span className="text-[#334155]">·</span>
          <Link to="/guide" className="hover:text-[#00F5FF] transition">Guide</Link>
          <span className="text-[#334155]">·</span>
          <Link to="/contact" className="hover:text-[#00F5FF] transition">Contact</Link>
        </div>
        <div className="mt-2 flex items-center justify-center gap-4 text-xs text-[#64748B]">
          <Link to="/privacy" className="hover:text-[#00F5FF] transition">Privacy</Link>
          <span className="text-[#334155]">·</span>
          <Link to="/terms" className="hover:text-[#00F5FF] transition">Terms</Link>
        </div>
      </div>
    </div>
  );
}

function StarfieldBg() {
  const [stars] = useState(() =>
    Array.from({ length: 60 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      s: Math.random() * 2 + 0.5,
      d: Math.random() * 4 + 2,
    }))
  );
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "linear-gradient(rgba(0,245,255,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(0,245,255,0.04) 1px,transparent 1px)", backgroundSize: "50px 50px" }} />
      {stars.map((s, i) => (
        <span
          key={i}
          className="absolute rounded-full bg-[#7DD3FC]"
          style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.s, height: s.s, opacity: 0.4, animation: `nr-float ${s.d}s ease-in-out infinite alternate` }}
        />
      ))}
    </div>
  );
}