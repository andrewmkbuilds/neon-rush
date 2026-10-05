import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function About() {
  return (
    <div className="relative min-h-screen w-full bg-[#05060D] text-[#F8FAFC] overflow-y-auto">
      <div className="sticky top-0 z-20 flex items-center justify-between px-4 sm:px-6 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-3 bg-[#05060D]/90 backdrop-blur border-b border-white/5">
        <Link to="/" className="flex items-center gap-2 text-sm text-[#94A3B8] hover:text-[#F8FAFC] transition">
          <ArrowLeft size={18} /> Back to game
        </Link>
        <span className="font-display font-black tracking-wider text-lg" style={{ background: "linear-gradient(90deg,#00F5FF,#8B5CF6)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>
          ABOUT
        </span>
        <div className="w-20" />
      </div>

      <article className="max-w-2xl mx-auto px-4 sm:px-6 py-8 leading-relaxed text-[#CBD5E1]">
        <h1 className="font-display font-black tracking-wider text-3xl sm:text-4xl mb-4" style={{ background: "linear-gradient(180deg,#00F5FF,#FF2E93)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>
          About NEON RUSH
        </h1>

        <p className="mb-4">
          NEON RUSH is a fast, free-to-play browser arcade survival game built for players who love
          skill-based dodging, near-miss combo systems, and chasing the perfect run. You pilot a neon
          ship through THE NEXUS GRID — an endless arena of geometric threats — homing trackers, dashing diamonds,
          sweeping rotators, proximity mines, teleporting hexagons, and instant lasers — each with a
          clear, readable warning before it strikes. The longer you survive, the faster and denser the
          arena becomes, with difficulty stepping up every thirty seconds.
        </p>

        <p className="mb-4">
          The core of the game is the near-miss combo system: skimming past obstacles without getting
          hit builds your multiplier, rewards bold flying, and feeds a score that climbs the global
          leaderboard. Energy orbs scattered through the arena charge your abilities — a burst Dash
          that grants a flicker of invulnerability, a Shield that absorbs a hit, and a Slow-time field
          that thins the chaos. Three difficulty modes — Easy, Normal, and Neon Hard — let everyone
          from first-time pilots to hardcore score chasers find their lane, each with its own hull
          plates, threat speed, and score multiplier.
        </p>

        <p className="mb-4">
          NEON RUSH is built for arcade fans, game-jam voters, and competitive players who want a deep,
          replayable survival challenge that runs in any modern browser on desktop or mobile. Progress
          persists across sessions: unlock ship skins, earn daily login-streak Neon Credits, complete
          daily challenges, collect milestone badges like Centurion and Survival Master, and watch
          replay playbacks of the top-ranked runs to learn new strategies. The global leaderboard is
          backed by a live database, so every score you submit is ranked against players worldwide in
          real time.
        </p>

        <p className="mb-4">
          NEON RUSH was built as an indie entry for the Vibe Sprint Game Jam and is developed on the
          Base44 platform. It is a skill-first arcade experience: no paywalls, no installs, no
          downloads — just open the page, pick a mode, and chase your best run.
        </p>

        <div className="mt-8 flex items-center gap-4 text-sm">
          <Link to="/" className="px-5 py-2.5 rounded-xl font-display font-bold tracking-wider text-[#05060D]" style={{ background: "linear-gradient(90deg,#00F5FF,#8B5CF6)" }}>
            PLAY NOW
          </Link>
          <Link to="/contact" className="px-5 py-2.5 rounded-xl border border-white/15 bg-white/5 text-[#F8FAFC] font-display font-bold tracking-wider hover:bg-white/10 transition">
            CONTACT
          </Link>
        </div>
      </article>
    </div>
  );
}