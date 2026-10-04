import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function Guide() {
  return (
    <div className="relative min-h-screen w-full bg-[#05060D] text-[#F8FAFC] overflow-y-auto">
      <div className="sticky top-0 z-20 flex items-center justify-between px-4 sm:px-6 py-3 bg-[#05060D]/90 backdrop-blur border-b border-white/5">
        <Link to="/" className="flex items-center gap-2 text-sm text-[#94A3B8] hover:text-[#F8FAFC] transition">
          <ArrowLeft size={18} /> Back to game
        </Link>
        <span className="font-display font-black tracking-wider text-lg" style={{ background: "linear-gradient(90deg,#00F5FF,#FF2E93)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>
          GUIDE
        </span>
        <div className="w-20" />
      </div>

      <article className="max-w-2xl mx-auto px-4 sm:px-6 py-8 leading-relaxed text-[#CBD5E1]">
        <h1 className="font-display font-black tracking-wider text-3xl sm:text-4xl mb-4" style={{ background: "linear-gradient(180deg,#00F5FF,#8B5CF6)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>
          NEON RUSH — Gameplay &amp; Strategy Guide
        </h1>

        <p className="mb-5">
          NEON RUSH is a browser-based arcade survival game where you pilot a neon ship through an
          endless arena of geometric threats. The goal is simple: survive as long as possible while
          building near-miss combos and collecting energy to push your score up the global leaderboard.
          This guide covers the controls, scoring, abilities, obstacles, and the strategies that separate
          a rookie pilot from an ace.
        </p>

        <h2 className="font-display font-bold tracking-wider text-xl text-[#00F5FF] mt-6 mb-2">Controls</h2>
        <p className="mb-4">
          On desktop, move with WASD or the arrow keys and activate your Dash with the Spacebar (Q for
          Shield, E for Slow-time once unlocked). On mobile, drag anywhere on the left half of the screen
          to steer with the virtual joystick and tap the ability buttons on the right. Movement is
          responsive and clamped to the arena, so you can never fly off-screen.
        </p>

        <h2 className="font-display font-bold tracking-wider text-xl text-[#00F5FF] mt-6 mb-2">Scoring &amp; Combos</h2>
        <p className="mb-4">
          Your score grows from three sources: survival time, energy orbs, and near-misses. Skimming past
          an obstacle without touching it registers a near-miss, which adds to your combo and multiplies
          every point you earn. Combo multipliers tier up at 2x, 3x, 5x, and 8x, so chaining near-misses
          is far more valuable than playing it safe. The combo timer resets if you take damage or let it
          expire, so keep the pressure on. Gold orbs are rare and worth a large burst of score and energy.
        </p>

        <h2 className="font-display font-bold tracking-wider text-xl text-[#00F5FF] mt-6 mb-2">Abilities</h2>
        <p className="mb-4">
          The Dash grants a short burst of speed with a flicker of invulnerability — your best escape and
          your best way to thread a tight gap. The Shield absorbs one hit on a cooldown, and the
          Slow-time field thins the chaos for a few seconds when the arena gets overwhelming. Abilities
          unlock as you accumulate total energy across runs, so every play session moves you toward a
          deeper toolkit.
        </p>

        <h2 className="font-display font-bold tracking-wider text-xl text-[#00F5FF] mt-6 mb-2">Obstacles &amp; Difficulty</h2>
        <p className="mb-4">
          Every threat telegraphs its behavior: homing trackers, dashing diamonds, sweeping rotators,
          proximity mines, teleporting hexagons, and instant-kill lasers all give a clear warning before
          they activate. Difficulty steps up every thirty seconds, increasing speed and wave density.
          Three modes — Easy, Normal, and Neon Hard — trade hull plates and threat speed for score
          multipliers, so harder modes reward bolder play.
        </p>

        <h2 className="font-display font-bold tracking-wider text-xl text-[#00F5FF] mt-6 mb-2">Strategy Tips</h2>
        <p className="mb-4">
          Stay near the edges of the arena to keep escape routes open, but dart inward to collect orbs
          and trigger near-misses. Prioritize gold orbs when they appear, save your Dash for genuine
          emergencies rather than repositioning, and use Slow-time when multiple warnings fire at once.
          Watch the replay of any top-ranked run from the leaderboard to learn the lines the best pilots
          fly — then chase their score.
        </p>

        <div className="mt-8 flex items-center gap-4 text-sm">
          <Link to="/" className="px-5 py-2.5 rounded-xl font-display font-bold tracking-wider text-[#05060D]" style={{ background: "linear-gradient(90deg,#00F5FF,#8B5CF6)" }}>
            PLAY NOW
          </Link>
          <Link to="/about" className="px-5 py-2.5 rounded-xl border border-white/15 bg-white/5 text-[#F8FAFC] font-display font-bold tracking-wider hover:bg-white/10 transition">
            ABOUT
          </Link>
        </div>
      </article>
    </div>
  );
}