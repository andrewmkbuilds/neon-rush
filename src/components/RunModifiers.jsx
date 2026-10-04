import React, { useState } from "react";
import { ArrowLeft, Zap, Layers, Timer, Heart, Ghost } from "lucide-react";
import { DIFFICULTIES } from "@/game/difficulties";
import { MODIFIERS, modBonus } from "@/game/modifiers";
import NeonBackground from "@/components/ui/NeonBackground";

const ICONS = { fasterProjectiles: Zap, denseWaves: Layers, longDashCd: Timer, fragile: Heart };

export default function RunModifiers({ onBack, onLaunch, ghostPath, ghostOn, onToggleGhost }) {
  const [mods, setMods] = useState({});
  const [diff, setDiff] = useState("normal");
  const toggle = (id) => setMods((m) => ({ ...m, [id]: !m[id] }));
  const bonus = modBonus(mods);
  const base = DIFFICULTIES.find((d) => d.id === diff).scoreMult;
  const total = base + bonus;
  const activeCount = Object.values(mods).filter(Boolean).length;

  return (
    <div className="relative h-screen w-full bg-[#05060D] text-[#F8FAFC] overflow-y-auto">
      <NeonBackground />
      <div className="sticky top-0 z-20 flex items-center justify-between px-4 sm:px-6 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-3 bg-[#05060D]/90 backdrop-blur border-b border-white/5">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-[#94A3B8] hover:text-[#F8FAFC] transition">
          <ArrowLeft size={18} /> Back
        </button>
        <h1 className="font-display font-black tracking-wider text-lg" style={{ background: "linear-gradient(90deg,#FF2E93,#A855F7)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>
          RUN MODIFIERS
        </h1>
        <div className="w-16" />
      </div>

      <div className="max-w-xl mx-auto px-4 pt-6 pb-24">
        <p className="text-sm text-[#94A3B8] mb-4">Toggle modifiers to raise the challenge. Each one adds to your score multiplier but makes the run significantly harder to survive.</p>

        <p className="text-xs text-[#94A3B8] uppercase tracking-widest mb-2">Difficulty</p>
        <div className="grid grid-cols-3 gap-2 mb-5">
          {DIFFICULTIES.map((d) => (
            <button
              key={d.id}
              onClick={() => setDiff(d.id)}
              onMouseDown={(e) => e.preventDefault()}
              className={`py-2.5 rounded-xl text-xs font-display font-bold tracking-wider transition ${diff === d.id ? "text-[#05060D]" : "border border-white/10 bg-white/5 text-[#94A3B8]"}`}
              style={diff === d.id ? { background: d.color, boxShadow: `0 0 14px ${d.color}66` } : {}}
            >
              {d.name}
            </button>
          ))}
        </div>

        {ghostPath && (
          <button
            onClick={onToggleGhost}
            onMouseDown={(e) => e.preventDefault()}
            className={`w-full mb-5 rounded-xl border p-3 flex items-center gap-3 transition text-left ${ghostOn ? "border-[#00F5FF]/50 bg-[#00F5FF]/10" : "border-[#00F5FF]/20 bg-[#00F5FF]/[0.04]"}`}
          >
            <Ghost size={18} className="text-[#00F5FF]" />
            <span className="flex-1 text-sm">Race your ghost (best-run outline)</span>
            <span className={`px-2 py-0.5 rounded text-xs font-display font-bold tracking-widest ${ghostOn ? "bg-[#00F5FF] text-[#05060D]" : "border border-[#00F5FF]/40 text-[#00F5FF]"}`}>{ghostOn ? "ON" : "OFF"}</span>
          </button>
        )}

        <p className="text-xs text-[#94A3B8] uppercase tracking-widest mb-2">Modifiers {activeCount > 0 && <span className="text-[#FF2E93]">· {activeCount} active</span>}</p>
        <div className="space-y-2.5">
          {MODIFIERS.map((m) => {
            const Icon = ICONS[m.id];
            const on = !!mods[m.id];
            return (
              <button
                key={m.id}
                onClick={() => toggle(m.id)}
                onMouseDown={(e) => e.preventDefault()}
                className="w-full rounded-xl border p-4 flex items-center gap-3 transition text-left"
                style={on ? { borderColor: `${m.color}66`, background: `${m.color}14` } : { borderColor: "rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)" }}
              >
                <div className="shrink-0 w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${m.color}1f` }}>
                  <Icon size={18} style={{ color: m.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-display font-bold tracking-wider text-sm" style={{ color: on ? m.color : "#F8FAFC" }}>{m.name}</span>
                    <span className="px-1.5 py-0.5 rounded text-xs font-display font-bold tracking-widest" style={{ color: m.color, border: `1px solid ${m.color}55` }}>+{m.mult}x</span>
                  </div>
                  <div className="text-xs text-[#94A3B8] mt-0.5">{m.desc}</div>
                </div>
                <span className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${on ? "" : "bg-white/15"}`} style={on ? { background: m.color } : {}}>
                  <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${on ? "left-[22px]" : "left-0.5"}`} />
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-10 bg-[#05060D]/95 backdrop-blur border-t border-white/10">
        <div className="max-w-xl mx-auto px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-[#94A3B8] uppercase tracking-widest">Score Multiplier</span>
            <span className="font-display font-black text-2xl tabular-nums" style={{ color: "#FFD166", textShadow: "0 0 12px rgba(255,209,102,0.5)" }}>x{total.toFixed(1)}</span>
          </div>
          <button
            onClick={() => onLaunch(diff, mods)}
            onMouseDown={(e) => e.preventDefault()}
            className="w-full py-3.5 rounded-xl font-display font-black tracking-widest text-[#05060D] text-sm active:scale-[0.99] transition"
            style={{ background: "linear-gradient(90deg,#FF2E93,#A855F7)", boxShadow: "0 0 20px rgba(255,46,147,0.4)" }}
          >
            LAUNCH RUN
          </button>
        </div>
      </div>
    </div>
  );
}