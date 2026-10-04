import React from "react";
import { ArrowLeft, Move, Zap, Shield, Hourglass, Target, Sparkles, Trophy } from "lucide-react";
import NeonBackground from "@/components/ui/NeonBackground";

export default function HowToPlay({ onBack }) {
  return (
    <div className="relative h-screen w-full bg-[#05060D] text-[#F8FAFC] overflow-y-auto">
      <NeonBackground />
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 sm:px-6 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-3">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-[#94A3B8] hover:text-[#F8FAFC] transition">
          <ArrowLeft size={18} /> Back
        </button>
      </div>
      <div className="relative z-10 max-w-2xl mx-auto px-5 pt-20 pb-12">
        <h1 className="font-display font-black text-4xl tracking-wider text-center" style={{ background: "linear-gradient(90deg,#00F5FF,#8B5CF6)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>
          HOW TO PLAY
        </h1>
        <p className="mt-3 text-center text-[#94A3B8] text-sm">Survive the neon arena. The longer you live, the faster it gets.</p>

        <Section icon={Move} color="#00F5FF" title="Movement">
          <p><b>Desktop:</b> WASD or Arrow keys to fly. <b>Space</b> to Dash. <b>Q</b> Shield, <b>E</b> Slow Time (once unlocked). <b>Esc/P</b> to pause.</p>
          <p><b>Mobile:</b> Drag anywhere on the arena to steer with a virtual joystick. Tap the ability buttons (bottom-right) to activate.</p>
        </Section>

        <Section icon={Target} color="#FF2E93" title="Near-Miss Combo System">
          <p>Sweep past obstacles without touching them to trigger a <b>Near Miss</b>. Each one builds your combo multiplier: <span className="text-[#00F5FF]">x2</span>, <span className="text-[#8B5CF6]">x3</span>, <span className="text-[#FF2E93]">x5</span>, <span className="text-[#FF2E93]">x8</span>.</p>
          <p>The combo meter decays over time — keep chaining near misses to hold the multiplier. A collision resets it instantly.</p>
        </Section>

        <Section icon={Sparkles} color="#FFD166" title="Energy Orbs">
          <p><span className="text-[#00F5FF]">Cyan</span> = standard energy. <span className="text-[#8B5CF6]">Purple</span> = bonus. <span className="text-[#FFD166]">Gold</span> = rare high-value. Energy is banked at the end of every run and spent in the Hangar on ship skins.</p>
        </Section>

        <Section icon={Zap} color="#00F5FF" title="Abilities">
          <p><b>Dash</b> — burst of speed + brief immunity (8s cooldown). Available from the start.</p>
          <p><b>Shield</b> — absorbs one hit (unlocked via progression).</p>
          <p><b>Slow Time</b> — slows all hazards without slowing you (unlocked via progression).</p>
        </Section>

        <Section icon={Trophy} color="#FFD166" title="Scoring">
          <p>Earn points for survival time, collecting orbs, near misses (multiplied by your combo), and clearing waves. Beat your personal best and climb the leaderboard.</p>
        </Section>

        <div className="mt-8 grid grid-cols-3 gap-3 text-center">
          <div className="rounded-xl border border-[#FF3B5C]/30 bg-[#FF3B5C]/5 p-3">
            <div className="flex justify-center gap-1 mb-1"><span className="w-2.5 h-2.5 rounded-sm bg-[#FF3B5C]" style={{ boxShadow: "0 0 6px #FF3B5C" }} /></div>
            <div className="text-xs text-[#94A3B8]">3 health. One hit = -1.</div>
          </div>
          <div className="rounded-xl border border-[#00F5FF]/30 bg-[#00F5FF]/5 p-3">
            <Shield size={16} className="mx-auto text-[#00F5FF] mb-1" />
            <div className="text-xs text-[#94A3B8]">Brief invuln after a hit.</div>
          </div>
          <div className="rounded-xl border border-[#8B5CF6]/30 bg-[#8B5CF6]/5 p-3">
            <Hourglass size={16} className="mx-auto text-[#8B5CF6] mb-1" />
            <div className="text-xs text-[#94A3B8]">Waves get faster over time.</div>
          </div>
        </div>

        <button onClick={onBack} className="mt-8 w-full py-3 rounded-xl font-display font-bold tracking-wider text-[#05060D]" style={{ background: "linear-gradient(90deg,#00F5FF,#8B5CF6)" }}>
          GOT IT
        </button>
      </div>
    </div>
  );
}

function Section({ icon: Icon, color, title, children }) {
  return (
    <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="flex items-center gap-2 mb-3">
        <Icon size={18} style={{ color }} />
        <h3 className="font-display font-bold tracking-wider text-lg" style={{ color }}>{title}</h3>
      </div>
      <div className="space-y-2 text-sm text-[#CBD5E1] leading-relaxed">{children}</div>
    </div>
  );
}