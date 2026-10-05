import React, { useState } from "react";
import { ChevronLeft, LifeBuoy, TrendingUp, Gamepad2, ChevronRight } from "lucide-react";
import NeonBackground from "@/components/ui/NeonBackground";
import AgentChat from "@/components/agents/AgentChat";

const AGENTS = [
  {
    name: "support_assistant",
    title: "Support",
    subtitle: "Report a bug or get help",
    description: "Draft and submit a detailed support ticket. The assistant asks the right questions and files it for you.",
    color: "#00F5FF",
    icon: LifeBuoy,
  },
  {
    name: "score_coach",
    title: "Score Coach",
    subtitle: "Analyze your runs",
    description: "Reads your run history, finds weak spots, and gives concrete tips to push your score higher.",
    color: "#FFD166",
    icon: TrendingUp,
  },
  {
    name: "gameplay_mentor",
    title: "Gameplay Mentor",
    subtitle: "Tips & mode guides",
    description: "Expert survival tips and clear explanations of every difficulty mode and how it plays.",
    color: "#FF2E93",
    icon: Gamepad2,
  },
];

export default function Assistants({ onBack }) {
  const [active, setActive] = useState(null);

  if (active) {
    const a = AGENTS.find((x) => x.name === active);
    return <AgentChat agentName={a.name} title={a.title} accentColor={a.color} onBack={() => setActive(null)} />;
  }

  return (
    <div className="relative h-screen w-full overflow-y-auto bg-[#05060D] text-[#F8FAFC]">
      <NeonBackground />
      <header className="relative z-20 flex items-center gap-2 px-4 sm:px-6 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-3">
        <button onClick={onBack} onMouseDown={(e) => e.preventDefault()} className="w-11 h-11 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/10 active:scale-95 transition" aria-label="Back">
          <ChevronLeft size={20} className="text-[#F8FAFC]" />
        </button>
        <div>
          <div className="text-xs uppercase tracking-[0.35em] text-[#00F5FF]">AI Assistants</div>
          <h1 className="font-display font-black tracking-[0.12em] text-xl">NEXUS ADVISORS</h1>
        </div>
      </header>

      <div className="relative z-10 px-4 pb-12 max-w-2xl mx-auto space-y-3 pt-2">
        {AGENTS.map((a) => {
          const Icon = a.icon;
          return (
            <button
              key={a.name}
              onClick={() => setActive(a.name)}
              onMouseDown={(e) => e.preventDefault()}
              className="group w-full text-left rounded-2xl border border-white/15 bg-white/[0.05] p-4 hover:bg-white/[0.1] hover:border-white/30 active:scale-[0.98] transition"
            >
              <div className="flex items-center gap-3">
                <div className="shrink-0 w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${a.color}1a`, boxShadow: `0 0 14px ${a.color}44` }}>
                  <Icon size={24} style={{ color: a.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-display font-bold tracking-wider text-sm" style={{ color: a.color }}>{a.title}</div>
                  <div className="text-xs text-[#94A3B8]">{a.subtitle}</div>
                  <div className="text-xs text-[#64748B] mt-1 leading-relaxed">{a.description}</div>
                </div>
                <ChevronRight size={18} className="text-[#64748B] group-hover:text-[#F8FAFC] transition shrink-0" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}