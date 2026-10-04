import React from "react";
import { ArrowLeft, Shield, Zap, Flame, GraduationCap, ChevronRight, Ghost, Sliders } from "lucide-react";
import { DIFFICULTIES } from "@/game/difficulties";
import NeonBackground from "@/components/ui/NeonBackground";

const ICONS = { easy: Shield, normal: Zap, hard: Flame };

export default function DifficultySelect({ onBack, onSelect, onTutorial, ghostPath, ghostOn, onToggleGhost, onOpenModifiers }) {
  return (
    <div className="relative h-screen w-full bg-[#05060D] text-[#F8FAFC] overflow-y-auto">
      <NeonBackground />
      <div className="sticky top-0 z-20 flex items-center justify-between px-4 sm:px-6 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-3 bg-[#05060D]/90 backdrop-blur border-b border-white/5">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-[#94A3B8] hover:text-[#F8FAFC] transition">
          <ArrowLeft size={18} /> Back
        </button>
        <h1 className="font-display font-black tracking-wider text-lg" style={{ background: "linear-gradient(90deg,#00F5FF,#FF2E93)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>
          SELECT MODE
        </h1>
        <div className="w-16" />
      </div>

      <div className="max-w-xl mx-auto px-4 pt-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
        <p className="text-sm text-[#94A3B8] mb-4">Choose your challenge. Higher risk earns a higher score multiplier.</p>

        {/* Tutorial */}
        <button
          onClick={onTutorial}
          onMouseDown={(e) => e.preventDefault()}
          className="w-full mb-4 rounded-2xl border border-[#8B5CF6]/30 bg-[#8B5CF6]/10 p-4 flex items-center gap-4 hover:bg-[#8B5CF6]/15 active:scale-[0.99] transition text-left"
        >
          <div className="shrink-0 w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "rgba(139,92,246,0.2)", boxShadow: "0 0 16px rgba(139,92,246,0.35)" }}>
            <GraduationCap size={24} className="text-[#A78BFA]" />
          </div>
          <div className="flex-1">
            <div className="font-display font-bold tracking-wider text-[#A78BFA] text-sm uppercase">Tutorial</div>
            <div className="text-xs text-[#94A3B8]">New here? A quick guided practice: move, collect, dash.</div>
          </div>
          <ChevronRight size={18} className="text-[#94A3B8]" />
        </button>

        {/* Ghost toggle */}
        {ghostPath && (
          <button
            onClick={onToggleGhost}
            onMouseDown={(e) => e.preventDefault()}
            className={`w-full mb-4 rounded-2xl border p-4 flex items-center gap-4 transition text-left ${ghostOn ? "border-[#00F5FF]/50 bg-[#00F5FF]/10" : "border-[#00F5FF]/25 bg-[#00F5FF]/[0.04] hover:bg-[#00F5FF]/[0.08]"}`}
          >
            <div className="shrink-0 w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "rgba(0,245,255,0.15)", boxShadow: "0 0 16px rgba(0,245,255,0.3)" }}>
              <Ghost size={24} className="text-[#00F5FF]" />
            </div>
            <div className="flex-1">
              <div className="font-display font-bold tracking-wider text-[#00F5FF] text-sm uppercase">Race Your Ghost</div>
              <div className="text-xs text-[#94A3B8]">Overlay your best run's path as a semi-transparent trail to practice against.</div>
            </div>
            <span className={`shrink-0 px-2 py-0.5 rounded text-xs font-display font-bold tracking-widest ${ghostOn ? "bg-[#00F5FF] text-[#05060D]" : "border border-[#00F5FF]/40 text-[#00F5FF]"}`}>
              {ghostOn ? "ON" : "OFF"}
            </span>
          </button>
        )}

        {/* Run modifiers */}
        {onOpenModifiers && (
          <button
            onClick={onOpenModifiers}
            onMouseDown={(e) => e.preventDefault()}
            className="w-full mb-4 rounded-2xl border border-[#FF2E93]/30 bg-[#FF2E93]/[0.06] p-4 flex items-center gap-4 hover:bg-[#FF2E93]/[0.1] active:scale-[0.99] transition text-left"
          >
            <div className="shrink-0 w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,46,147,0.18)", boxShadow: "0 0 16px rgba(255,46,147,0.3)" }}>
              <Sliders size={24} className="text-[#FF2E93]" />
            </div>
            <div className="flex-1">
              <div className="font-display font-bold tracking-wider text-[#FF2E93] text-sm uppercase">Run Modifiers</div>
              <div className="text-xs text-[#94A3B8]">Stack score multipliers — faster threats, denser waves, fragile hull. Much harder, much higher scores.</div>
            </div>
            <ChevronRight size={18} className="text-[#94A3B8]" />
          </button>
        )}

        {/* Difficulty cards */}
        <div className="space-y-3">
          {DIFFICULTIES.map((d) => {
            const Icon = ICONS[d.id];
            return (
              <button
                key={d.id}
                onClick={() => onSelect(d.id)}
                onMouseDown={(e) => e.preventDefault()}
                className="w-full rounded-2xl border p-4 flex items-center gap-4 hover:bg-white/[0.07] active:scale-[0.99] transition text-left focus:outline-none focus-visible:ring-2"
                style={{ borderColor: `${d.color}40`, background: `${d.color}0d`, boxShadow: `inset 0 0 0 1px ${d.color}10` }}
              >
                <div className="shrink-0 w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${d.color}1f`, boxShadow: `0 0 16px ${d.color}40` }}>
                  <Icon size={24} style={{ color: d.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-display font-black tracking-wider text-lg" style={{ color: d.color }}>{d.name}</span>
                    <span className="px-1.5 py-0.5 rounded text-xs font-display font-bold tracking-widest" style={{ color: d.color, border: `1px solid ${d.color}50` }}>{d.tag}</span>
                  </div>
                  <div className="text-xs text-[#94A3B8] mt-0.5">{d.desc}</div>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5 text-xs text-[#94A3B8]">
                    <span><b style={{ color: d.color }}>{d.health}</b> hull</span>
                    <span><b style={{ color: d.color }}>x{d.scoreMult}</b> score</span>
                    <span><b style={{ color: d.color }}>{d.diffMult < 1 ? "slow" : d.diffMult > 1 ? "fast" : "base"}</b> threats</span>
                  </div>
                </div>
                <ChevronRight size={18} style={{ color: d.color }} />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}