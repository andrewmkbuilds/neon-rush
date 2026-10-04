import React from "react";
import { Pause, Volume2, VolumeX, Target } from "lucide-react";

function HealthPip({ filled }) {
  return (
    <span
      className="inline-block w-3.5 h-3.5 rounded-sm transition-all"
      style={{
        background: filled ? "#FF3B5C" : "transparent",
        border: "1px solid #FF3B5C",
        boxShadow: filled ? "0 0 8px #FF3B5C" : "none",
      }}
    />
  );
}

export default function GameHUD({ hud, onPause, soundOn, onToggleSound }) {
  const mult = hud.multiplier;
  const multColor = mult >= 8 ? "#FF2E93" : mult >= 5 ? "#FF2E93" : mult >= 3 ? "#8B5CF6" : mult >= 2 ? "#00F5FF" : "#94A3B8";

  return (
    <div className="pointer-events-none absolute inset-0 z-10 p-3 sm:p-4 pt-[calc(0.75rem+env(safe-area-inset-top))] font-body text-[#F8FAFC]">
      {/* top left */}
      <div className="absolute top-3 left-3 sm:top-4 sm:left-4 space-y-1">
        <div className="text-2xl sm:text-3xl font-display font-bold tracking-wider tabular-nums" style={{ textShadow: "0 0 12px rgba(0,245,255,0.6)" }}>
          {hud.score.toLocaleString()}
        </div>
        <div className="text-xs sm:text-sm text-[#94A3B8] tabular-nums">
          {String(Math.floor(hud.time / 60)).padStart(2, "0")}:{String(Math.floor(hud.time % 60)).padStart(2, "0")} · WAVE {hud.wave}
        </div>
        <div className="flex gap-1.5 pt-0.5">
          <HealthPip filled={hud.health >= 1} />
          <HealthPip filled={hud.health >= 2} />
          <HealthPip filled={hud.health >= 3} />
        </div>
        {/* difficulty meter — pulses faster as the run ramps up */}
        <div className="pt-2 w-28">
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-xs text-[#94A3B8] uppercase tracking-widest">Difficulty</span>
            {hud.difficultyPct > 0.75 && <span className="text-xs text-[#FF2E93] font-bold tracking-widest">MAX</span>}
          </div>
          <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: `${hud.difficultyPct * 100}%`,
                background: "linear-gradient(90deg,#00F5FF,#FF2E93)",
                transition: "width 0.3s ease-out",
                animation: hud.difficultyPct > 0.4 ? `nr-diffpulse ${(1.3 - hud.difficultyPct * 0.8).toFixed(2)}s ease-in-out infinite` : "none",
              }}
            />
          </div>
        </div>
      </div>

      {/* top center combo */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 sm:top-4 text-center">
        <div
          className="font-display font-bold text-xl sm:text-2xl transition-all"
          style={{ color: multColor, textShadow: `0 0 14px ${multColor}`, transform: mult >= 2 ? "scale(1)" : "scale(0.9)" }}
        >
          {mult >= 2 ? `x${mult}` : "x1"}
        </div>
        <div className="w-24 sm:w-32 h-1.5 mt-1 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-100"
            style={{ width: `${hud.comboPct * 100}%`, background: multColor, boxShadow: `0 0 8px ${multColor}` }}
          />
        </div>
        <div className="text-xs sm:text-xs text-[#94A3B8] mt-0.5 tracking-widest uppercase">
          {hud.combo >= 2 ? `${hud.combo} streak` : "near miss"}
        </div>
      </div>

      {/* top right */}
      <div className="absolute top-3 right-3 sm:top-4 sm:right-4 flex gap-2 pointer-events-auto">
        <button
          onClick={onToggleSound}
          onMouseDown={(e) => e.preventDefault()}
          className="w-12 h-12 rounded-lg bg-white/5 border border-white/10 backdrop-blur flex items-center justify-center hover:bg-white/10 active:scale-95 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00F5FF]/50"
          aria-label="Toggle sound"
        >
          {soundOn ? <Volume2 size={16} className="text-[#00F5FF]" /> : <VolumeX size={16} className="text-[#94A3B8]" />}
        </button>
        <button
          onClick={onPause}
          onMouseDown={(e) => e.preventDefault()}
          className="w-12 h-12 rounded-lg bg-white/5 border border-white/10 backdrop-blur flex items-center justify-center hover:bg-white/10 active:scale-95 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00F5FF]/50"
          aria-label="Pause"
        >
          <Pause size={16} className="text-[#F8FAFC]" />
        </button>
      </div>

      {/* bottom energy */}
      <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 flex items-center gap-2">
        <span className="text-[#FFD166] font-display font-bold text-lg tabular-nums" style={{ textShadow: "0 0 10px rgba(255,209,102,0.6)" }}>
          {hud.energy}
        </span>
        <span className="text-xs sm:text-xs text-[#94A3B8] uppercase tracking-widest">energy</span>
      </div>

      {/* in-run objective (Run Director) */}
      {hud.objective && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 sm:bottom-4 w-[min(72vw,320px)] text-center">
          <div className="text-xs uppercase tracking-widest text-[#FFD166] mb-1 flex items-center justify-center gap-1.5">
            <Target size={11} /> {hud.objective.name}
          </div>
          <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${(hud.objective.progress / hud.objective.target) * 100}%`, background: "linear-gradient(90deg,#FFD166,#FF8A3D)" }} />
          </div>
        </div>
      )}

      {/* active modifiers */}
      <div className="absolute top-16 left-1/2 -translate-x-1/2 flex gap-2">
        {hud.bonusMult > 1 && <span className="px-2 py-0.5 rounded-full text-xs font-display font-bold tracking-wider text-[#05060D]" style={{ background: "linear-gradient(90deg,#34D399,#FFD166)" }}>x{hud.bonusMult} BONUS</span>}
        {hud.gravity && <span className="px-2 py-0.5 rounded-full text-xs font-display font-bold tracking-wider text-[#22D3EE] bg-[#22D3EE]/15 border border-[#22D3EE]/30">GRAVITY</span>}
        {hud.modifiers && hud.modifiers.length > 0 && (
          <span className="px-2 py-0.5 rounded-full text-xs font-display font-bold tracking-wider text-[#05060D]" style={{ background: "linear-gradient(90deg,#FF2E93,#A855F7)" }}>
            MODS x{hud.modMult.toFixed(1)}
          </span>
        )}
      </div>
    </div>
  );
}