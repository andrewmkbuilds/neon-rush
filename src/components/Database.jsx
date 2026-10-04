import React, { useState } from "react";
import { ArrowLeft, Lock } from "lucide-react";
import { DATABASE, isEntryUnlocked } from "@/game/database";
import NeonBackground from "@/components/ui/NeonBackground";

const CATS = [
  { id: "characters", label: "Characters", color: "#00F5FF" },
  { id: "enemies", label: "Enemies", color: "#FF3B5C" },
  { id: "locations", label: "Locations", color: "#8B5CF6" },
];

export default function Database({ profile, onBack }) {
  const [cat, setCat] = useState("characters");
  const entries = DATABASE[cat];

  return (
    <div className="relative h-screen w-full bg-[#05060D] text-[#F8FAFC] overflow-y-auto">
      <NeonBackground />
      <div className="sticky top-0 z-20 flex items-center justify-between px-4 sm:px-6 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-3 bg-[#05060D]/90 backdrop-blur border-b border-white/5">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-[#94A3B8] hover:text-[#F8FAFC] transition"><ArrowLeft size={18} /> Back</button>
        <h1 className="font-display font-black tracking-wider text-lg" style={{ background: "linear-gradient(90deg,#00F5FF,#8B5CF6)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>DATABASE</h1>
        <div className="w-16" />
      </div>

      <div className="max-w-xl mx-auto px-4 py-6">
        <div className="flex gap-2 mb-4">
          {CATS.map((c) => (
            <button key={c.id} onClick={() => setCat(c.id)} className={`flex-1 py-2 rounded-xl text-xs font-display font-bold tracking-wider transition ${cat === c.id ? "bg-white/10 border border-white/25 text-[#F8FAFC]" : "border border-white/10 bg-white/5 text-[#94A3B8]"}`}>{c.label}</button>
          ))}
        </div>
        <div className="space-y-2.5">
          {entries.map((e) => {
            const unlocked = isEntryUnlocked(profile, e);
            return (
              <div key={e.id} className={`rounded-2xl border p-3.5 ${unlocked ? "border-white/10 bg-white/5" : "border-white/5 bg-white/[0.02]"}`}>
                <div className="flex items-center gap-2">
                  {unlocked ? (
                    <span className="font-display font-bold text-sm" style={{ color: CATS.find((c) => c.id === cat).color }}>{e.name}</span>
                  ) : (
                    <span className="font-display font-bold text-sm text-[#64748B] flex items-center gap-1.5"><Lock size={13} /> ???</span>
                  )}
                </div>
                {unlocked ? (
                  <p className="text-xs text-[#94A3B8] mt-1.5">{e.desc}</p>
                ) : (
                  <p className="text-xs text-[#64748B] mt-1">{e.unlockChapter ? `Decode by reaching Story Chapter ${e.unlockChapter}.` : "Unlock through a side quest."}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}