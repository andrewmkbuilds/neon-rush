import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Play, BookOpen, Target, Compass, Gamepad2, Plane, Trophy, Database as DbIcon,
  User, Settings as SettingsIcon, BarChart3, HelpCircle, Volume2, VolumeX,
  Gem, ChevronRight, Lock, Star, ClipboardList, Swords, Flame, Calendar, Bot,
} from "lucide-react";
import Logo from "@/components/Logo";
import NeonBackground from "@/components/ui/NeonBackground";
import NeonButton from "@/components/ui/NeonButton";
import { levelProgress } from "@/game/progression";
import { getChapter } from "@/game/story";
import { getMissionView } from "@/game/missions";
import { getActiveSideQuests } from "@/game/sidequests";

function ModeCard({ icon: Icon, title, subtitle, color, onClick, locked, badge }) {
  return (
    <button
      onClick={onClick}
      onMouseDown={(e) => e.preventDefault()}
      disabled={locked}
      className={`group relative rounded-2xl border p-5 text-left active:scale-95 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00F5FF]/50 ${locked ? "border-white/10 bg-white/[0.04] opacity-60" : "border-white/20 bg-white/10 hover:bg-white/[0.15] hover:border-white/30"}`}
    >
      <div className="flex items-center gap-3">
        <div className="shrink-0 w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${color}1a`, boxShadow: `0 0 14px ${color}44` }}>
          <Icon size={24} style={{ color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-display font-bold tracking-wider text-sm" style={{ color }}>{title}</div>
          <div className="text-xs text-[#94A3B8] truncate">{subtitle}</div>
        </div>
        {locked ? <Lock size={14} className="text-[#64748B]" /> : <ChevronRight size={16} className="text-[#64748B] group-hover:text-[#F8FAFC] transition" />}
      </div>
      {badge && <div className="absolute top-2 right-2 text-xs font-display font-bold px-1.5 py-0.5 rounded-full" style={{ color, background: `${color}1a` }}>{badge}</div>}
    </button>
  );
}

export default function CommandCenter({ profile, onNav, onPlay, onContinue, continueLabel, audio, user, isAuthenticated, onSignIn, onLogout }) {
  const [titlePulse, setTitlePulse] = useState(false);
  useEffect(() => {
    const t = setInterval(() => setTitlePulse((p) => !p), 1800);
    return () => clearInterval(t);
  }, []);

  const lp = levelProgress(profile.xp);
  const storyDone = profile.storyProgress?.completed || [];
  const currentChapter = storyDone.length >= 6 ? 6 : storyDone.length + 1;
  const ch = getChapter(currentChapter);
  const missions = getMissionView(profile);
  const claimableDaily = missions.daily.filter((m) => m.complete && !m.claimed).length;
  const claimableWeekly = missions.weekly.filter((m) => m.complete && !m.claimed).length;
  const sqActive = getActiveSideQuests(profile).filter((q) => q.unlocked && q.complete && !q.claimed).length;
  const totalClaimable = claimableDaily + claimableWeekly + sqActive;

  return (
    <div className="relative h-screen w-full overflow-y-auto bg-[#05060D] text-[#F8FAFC]">
      <NeonBackground />

      {/* Header */}
      <header className="relative z-20 flex items-center justify-between gap-2 px-4 sm:px-6 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-3">
        <button onClick={() => onNav("menu")} className="flex items-center gap-2">
          <Logo size={28} />
          <span className="font-display font-black tracking-[0.1em] sm:tracking-[0.2em] text-base sm:text-lg" style={{ background: "linear-gradient(90deg,#00F5FF,#FF2E93)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>
            NEON RUSH
          </span>
        </button>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 border border-white/20">
            <Star size={13} className="text-[#FFD166]" />
            <span className="text-xs font-display font-bold tabular-nums">LV {lp.level}</span>
            <div className="w-20 h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${lp.pct * 100}%`, background: "linear-gradient(90deg,#FFD166,#FF2E93)" }} />
            </div>
          </div>
          <div className="px-2 py-1 rounded-lg bg-[#00F5FF]/10 border border-[#00F5FF]/30 text-xs font-bold text-[#00F5FF] tabular-nums flex items-center gap-1">
            <Gem size={12} /> {profile.neonCredits ?? 0}
          </div>
          {profile.loginStreak > 1 && (
            <div className="px-2 py-1 rounded-lg bg-[#FF2E93]/10 border border-[#FF2E93]/30 text-xs font-bold text-[#FF2E93] tabular-nums flex items-center gap-1" title={`${profile.loginStreak}-day login streak`}>
              <Flame size={12} /> {profile.loginStreak}
            </div>
          )}
          <button onClick={audio.toggleSound} onMouseDown={(e) => e.preventDefault()} className="w-11 h-11 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/10 active:scale-95 transition" aria-label="Toggle sound">
            {audio.musicOn ? <Volume2 size={16} className="text-[#00F5FF]" /> : <VolumeX size={16} className="text-[#94A3B8]" />}
          </button>
          <button onClick={() => onNav("profile")} onMouseDown={(e) => e.preventDefault()} className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg bg-white/10 border border-white/20 hover:bg-white/10 active:scale-95 transition" aria-label="Profile">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#00F5FF] to-[#8B5CF6] flex items-center justify-center">
              <User size={13} className="text-[#05060D]" />
            </div>
            <span className="text-xs font-medium hidden sm:block">{profile.name}</span>
          </button>
        </div>
      </header>

      <div className="relative z-10 flex flex-col items-center px-4 pt-6 pb-12 max-w-4xl mx-auto">
        {/* Title */}
        <div className="text-center">
          <div className="flex justify-center mb-3">
            <Logo size={64} rounded="rounded-2xl" />
          </div>
          <div className="text-xs uppercase tracking-[0.4em] text-[#00F5FF] mb-1">Command Center</div>
          <h1
            className="font-display font-black tracking-[0.15em] leading-none transition-transform duration-700"
            style={{
              fontSize: "clamp(2.5rem, 9vw, 5rem)",
              background: "linear-gradient(180deg,#00F5FF 0%,#8B5CF6 60%,#FF2E93 100%)",
              WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent",
              filter: `drop-shadow(0 0 ${titlePulse ? 24 : 14}px rgba(0,245,255,0.5))`,
              transform: titlePulse ? "scale(1.02)" : "scale(1)",
            }}
          >
            NEON RUSH
          </h1>
          <div className="mt-2 text-xs sm:text-xs uppercase tracking-[0.35em] text-[#8B5CF6]" style={{ textShadow: "0 0 10px rgba(139,92,246,0.5)" }}>
            The Nexus Grid
          </div>
        </div>

        {/* Primary actions */}
        <div className="mt-6 w-full max-w-xl grid grid-cols-1 sm:grid-cols-2 gap-4">
          <NeonButton onClick={onContinue} color="#FF2E93" size="lg" pulse className="py-5 rounded-2xl font-black tracking-[0.15em]">
            <Play size={20} fill="#05060D" /> {continueLabel || "CONTINUE"}
          </NeonButton>
          <NeonButton onClick={onPlay} color="#00F5FF" size="lg" pulse className="py-5 rounded-2xl font-black tracking-[0.15em]">
            <Play size={20} fill="#05060D" /> SURVIVAL
          </NeonButton>
        </div>

        {/* Mode cards */}
        <div className="mt-6 w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <ModeCard icon={BookOpen} title="STORY MODE" subtitle={ch ? `Chapter ${currentChapter}: ${ch.title}` : "Campaign complete"} color="#8B5CF6" onClick={() => onNav("story")} badge={storyDone.length >= 6 ? "DONE" : `CH ${currentChapter}`} />
          <ModeCard icon={Target} title="MISSIONS" subtitle="Daily & weekly objectives" color="#00F5FF" onClick={() => onNav("missions")} badge={claimableDaily + claimableWeekly > 0 ? `${claimableDaily + claimableWeekly} CLAIM` : undefined} />
          <ModeCard icon={Compass} title="SIDE QUESTS" subtitle="Optional lore & rewards" color="#FFD166" onClick={() => onNav("sidequests")} badge={sqActive > 0 ? `${sqActive} CLAIM` : undefined} />
          <ModeCard icon={Gamepad2} title="ARCADE" subtitle="Mini-games" color="#FF2E93" onClick={() => onNav("arcade")} />
          <ModeCard icon={Plane} title="HANGAR" subtitle="Ships & skins" color="#A78BFA" onClick={() => onNav("hangar")} />
          <ModeCard icon={Trophy} title="LEADERBOARD" subtitle="Records & rankings" color="#FFD166" onClick={() => onNav("leaderboard")} />
          <ModeCard icon={DbIcon} title="DATABASE" subtitle={`${storyDone.length}/6 sectors decoded`} color="#00F5FF" onClick={() => onNav("database")} />
          <ModeCard icon={BarChart3} title="STATS" subtitle="Your performance" color="#34D399" onClick={() => onNav("stats")} />
          <ModeCard icon={ClipboardList} title="MISSION LOGS" subtitle="Track all objectives" color="#22D3EE" onClick={() => onNav("missionlogs")} badge={totalClaimable > 0 ? `${totalClaimable} CLAIM` : undefined} />
          <ModeCard icon={Swords} title="SKILL CHALLENGES" subtitle="No-dash trials" color="#F472B6" onClick={() => onNav("skillchallenges")} />
          <ModeCard icon={Calendar} title="DAILY CHALLENGE" subtitle="Same modifiers, same leaderboard" color="#FF2E93" onClick={() => onNav("daily")} />
          <ModeCard icon={Bot} title="AI ADVISORS" subtitle="Support, coach & tips" color="#A78BFA" onClick={() => onNav("assistants")} />
        </div>

        {/* Secondary */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          <button onClick={() => onNav("profile")} className="px-4 py-3.5 rounded-xl border border-white/20 bg-white/10 text-sm flex items-center gap-2 hover:bg-white/10 active:scale-95 transition">
            <User size={16} className="text-[#00F5FF]" /> Profile
          </button>
          <button onClick={() => onNav("settings")} className="px-4 py-3.5 rounded-xl border border-white/20 bg-white/10 text-sm flex items-center gap-2 hover:bg-white/10 active:scale-95 transition">
            <SettingsIcon size={16} className="text-[#00F5FF]" /> Settings
          </button>
          <button onClick={() => onNav("howto")} className="px-4 py-3.5 rounded-xl border border-white/20 bg-white/10 text-sm flex items-center gap-2 hover:bg-white/10 active:scale-95 transition">
            <HelpCircle size={16} className="text-[#00F5FF]" /> How to Play
          </button>
        </div>

        {/* Account */}
        <div className="mt-5 w-full max-w-xl">
          {isAuthenticated ? (
            <div className="rounded-2xl border border-[#00F5FF]/25 bg-[#00F5FF]/5 p-3 flex items-center gap-3">
              <div className="shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-[#00F5FF] to-[#8B5CF6] flex items-center justify-center font-display font-black text-[#05060D]">
                {(user?.full_name || user?.email || "P").charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs uppercase tracking-widest text-[#94A3B8]">Signed in</div>
                <div className="font-display font-bold text-sm truncate">{user?.full_name || user?.email}</div>
              </div>
              <button onClick={onLogout} className="px-4 py-2.5 rounded-lg border border-white/25 bg-white/10 text-sm font-bold hover:bg-white/10 active:scale-95 transition">Sign Out</button>
            </div>
          ) : (
            <button onClick={onSignIn} className="w-full rounded-2xl border border-[#00F5FF]/30 bg-[#00F5FF]/5 px-4 py-3 flex items-center gap-3 hover:bg-[#00F5FF]/10 active:scale-95 transition">
              <div className="shrink-0 w-10 h-10 rounded-full bg-white/5 flex items-center justify-center"><User size={18} className="text-[#00F5FF]" /></div>
              <div className="flex-1 text-left">
                <div className="font-display font-bold text-sm">Sign In or Sign Up</div>
                <div className="text-xs text-[#94A3B8]">Save your scores & sync your progress</div>
              </div>
              <ChevronRight size={18} className="text-[#94A3B8]" />
            </button>
          )}
        </div>

        <div className="mt-8 flex items-center justify-center gap-4 text-sm text-[#64748B] flex-wrap">
          <Link to="/about" className="hover:text-[#00F5FF] transition">About</Link>
          <span className="text-[#334155]">·</span>
          <Link to="/guide" className="hover:text-[#00F5FF] transition">Guide</Link>
          <span className="text-[#334155]">·</span>
          <Link to="/contact" className="hover:text-[#00F5FF] transition">Contact</Link>
          <span className="text-[#334155]">·</span>
          <Link to="/privacy" className="hover:text-[#00F5FF] transition">Privacy</Link>
          <span className="text-[#334155]">·</span>
          <Link to="/terms" className="hover:text-[#00F5FF] transition">Terms</Link>
        </div>
      </div>
    </div>
  );
}