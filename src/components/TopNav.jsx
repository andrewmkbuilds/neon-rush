import React from "react";
import { Volume2, VolumeX, User } from "lucide-react";

export default function TopNav({ profile, onNav, onPlay, audio }) {
  const items = [
    { id: "play", label: "Play", run: onPlay },
    { id: "leaderboard", label: "Leaderboard", run: () => onNav("leaderboard") },
    { id: "hangar", label: "Hangar", run: () => onNav("hangar") },
    { id: "store", label: "Store", run: () => onNav("store") },
    { id: "howto", label: "How to Play", run: () => onNav("howto") },
    { id: "settings", label: "Settings", run: () => onNav("settings") },
  ];
  return (
    <header className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 sm:px-6 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-3">
      <button
        onClick={() => onNav("menu")}
        onMouseDown={(e) => e.preventDefault()}
        className="font-display font-black tracking-[0.2em] text-lg sm:text-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00F5FF]/50 rounded px-1"
        style={{ background: "linear-gradient(90deg,#00F5FF,#FF2E93)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}
        aria-label="Home"
      >
        NEON RUSH
      </button>
      <nav className="hidden md:flex items-center gap-1">
        {items.map((it) => (
          <button
            key={it.id}
            onClick={it.run}
            onMouseDown={(e) => e.preventDefault()}
            className="px-3 py-1.5 rounded-lg text-sm text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-white/5 active:scale-95 transition font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00F5FF]/40"
          >
            {it.label}
          </button>
        ))}
      </nav>
      <div className="flex items-center gap-2">
        <button
          onClick={audio.toggleSound}
          onMouseDown={(e) => e.preventDefault()}
          className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 active:scale-95 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00F5FF]/40"
          aria-label="Toggle sound"
        >
          {audio.musicOn ? <Volume2 size={16} className="text-[#00F5FF]" /> : <VolumeX size={16} className="text-[#94A3B8]" />}
        </button>
        <button
          onClick={() => onNav("profile")}
          onMouseDown={(e) => e.preventDefault()}
          className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 active:scale-95 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00F5FF]/40"
          aria-label="Profile"
        >
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#00F5FF] to-[#8B5CF6] flex items-center justify-center">
            <User size={13} className="text-[#05060D]" />
          </div>
          <span className="text-xs font-medium text-[#F8FAFC] hidden sm:block">{profile.name}</span>
        </button>
      </div>
    </header>
  );
}