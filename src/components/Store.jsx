import React, { useState } from "react";
import { ArrowLeft, Gem, Sparkles, ShieldCheck, Loader2, CheckCircle2, Zap, Plane, Check, ChevronRight } from "lucide-react";
import { getUpgradeView } from "@/game/upgrades";
import NeonBackground from "@/components/ui/NeonBackground";

const PACKS = [
  { id: "starter", credits: 50, label: "Starter Pack", blurb: "Dip your wings in the neon.", tag: "" },
  { id: "pilot", credits: 120, label: "Pilot Pack", blurb: "Best value for rising pilots.", tag: "BEST VALUE" },
  { id: "ace", credits: 300, label: "Ace Pack", blurb: "Outfit a full hangar.", tag: "" },
  { id: "legend", credits: 700, label: "Legend Pack", blurb: "Own every premium skin.", tag: "LEGEND" },
];

export default function Store({ profile, onBack, onBuyCredits, onBuyUpgrade, onGoHangar }) {
  const [checkout, setCheckout] = useState(null); // pack object
  const [stage, setStage] = useState("form"); // form | processing | done
  const upgrades = getUpgradeView(profile);

  const close = () => {
    setCheckout(null);
    setStage("form");
  };

  const handlePay = () => {
    setStage("processing");
    setTimeout(() => {
      onBuyCredits(checkout);
      setStage("done");
    }, 1400);
  };

  return (
    <div className="relative h-screen w-full bg-[#05060D] text-[#F8FAFC] overflow-y-auto">
      <NeonBackground />
      <div className="sticky top-0 z-20 flex items-center justify-between px-4 sm:px-6 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-3 bg-[#05060D]/90 backdrop-blur border-b border-white/5">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-[#94A3B8] hover:text-[#F8FAFC] transition">
          <ArrowLeft size={18} /> Back
        </button>
        <h1 className="font-display font-black tracking-wider text-lg" style={{ background: "linear-gradient(90deg,#00F5FF,#FF2E93)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>
          NEON STORE
        </h1>
        <div className="px-3 py-1.5 rounded-lg bg-[#00F5FF]/10 border border-[#00F5FF]/30 text-sm font-bold text-[#00F5FF] tabular-nums flex items-center gap-1.5">
          <Gem size={14} /> {profile.neonCredits ?? 0}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="rounded-2xl border border-[#00F5FF]/20 bg-[#00F5FF]/5 p-4 mb-5 flex items-start gap-3">
          <Sparkles size={18} className="text-[#00F5FF] mt-0.5 shrink-0" />
          <div>
            <p className="text-sm text-[#F8FAFC] font-medium">Spend Neon Credits on ship skins & permanent upgrades</p>
            <p className="text-xs text-[#94A3B8] mt-1 leading-relaxed">
              Neon Credits are the game's premium currency. Grab premium ship skins in the Hangar or buy permanent run upgrades below.
            </p>
          </div>
        </div>

        <button
          onClick={onGoHangar}
          onMouseDown={(e) => e.preventDefault()}
          className="w-full mb-5 rounded-2xl border border-[#A78BFA]/25 bg-[#A78BFA]/5 p-4 flex items-center gap-3 hover:bg-[#A78BFA]/10 active:scale-[0.99] transition text-left"
        >
          <div className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#A78BFA1a", boxShadow: "0 0 12px #A78BFA33" }}>
            <Plane size={20} className="text-[#A78BFA]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-display font-bold tracking-wider text-sm text-[#A78BFA]">SHIP SKINS — HANGAR</div>
            <div className="text-xs text-[#94A3B8]">Unlock premium hulls with Neon Credits or earned energy.</div>
          </div>
          <ChevronRight size={16} className="text-[#94A3B8]" />
        </button>

        <h2 className="font-display font-bold tracking-wider text-sm text-[#94A3B8] uppercase mb-3">Credit Packs</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {PACKS.map((p) => (
            <div key={p.id} className="relative rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-transparent p-4 flex flex-col">
              {p.tag && (
                <span className="absolute -top-2 right-3 px-2 py-0.5 rounded-full text-xs font-display font-bold tracking-wider text-[#05060D]" style={{ background: "linear-gradient(90deg,#00F5FF,#FF2E93)" }}>
                  {p.tag}
                </span>
              )}
              <div className="flex items-center gap-2 mb-1">
                <Gem size={18} className="text-[#00F5FF]" />
                <span className="font-display font-bold text-lg">{p.credits}</span>
                <span className="text-xs text-[#94A3B8]">credits</span>
              </div>
              <div className="font-display font-bold text-sm" style={{ color: "#00F5FF" }}>{p.label}</div>
              <p className="text-xs text-[#94A3B8] mt-1 flex-1">{p.blurb}</p>
              <button
                onClick={() => { setCheckout(p); setStage("form"); }}
                className="mt-3 w-full py-2.5 rounded-xl font-display font-bold tracking-wider text-[#05060D] active:scale-95 transition"
                style={{ background: "linear-gradient(90deg,#00F5FF,#8B5CF6)" }}
              >
                GET FREE
              </button>
            </div>
          ))}
        </div>

        <h2 className="font-display font-bold tracking-wider text-sm text-[#94A3B8] uppercase mt-6 mb-3">Permanent Upgrades</h2>
        <div className="space-y-3">
          {upgrades.map((u) => {
            const canAfford = (profile.neonCredits ?? 0) >= u.cost;
            return (
              <div key={u.id} className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-transparent p-4">
                <div className="flex items-center gap-2.5">
                  <div className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#FFD1661a", boxShadow: "0 0 12px #FFD16633" }}>
                    <Zap size={18} className="text-[#FFD166]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-display font-bold text-sm">{u.name}</div>
                    <div className="text-xs text-[#94A3B8]">{u.desc}</div>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1.5">
                  {Array.from({ length: u.maxTier }).map((_, i) => (
                    <span key={i} className="flex-1 h-1.5 rounded-full" style={{ background: i < u.tier ? "#FFD166" : "rgba(255,255,255,0.1)", boxShadow: i < u.tier ? "0 0 6px #FFD166" : "none" }} />
                  ))}
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-[#94A3B8]">Tier {u.tier}/{u.maxTier} · +{u.tier * u.per} {u.unit} at run start</span>
                  {u.maxed ? (
                    <span className="flex items-center gap-1 text-xs font-display font-bold tracking-wider text-[#34D399]"><Check size={14} /> MAXED</span>
                  ) : (
                    <button
                      onClick={() => onBuyUpgrade(u)}
                      disabled={!canAfford}
                      onMouseDown={(e) => e.preventDefault()}
                      className="px-3 py-2 rounded-xl font-display font-bold tracking-wider text-xs flex items-center gap-1.5 active:scale-95 transition disabled:opacity-40"
                      style={canAfford ? { background: "linear-gradient(90deg,#FFD166,#FF8A3D)", color: "#05060D" } : { background: "rgba(255,255,255,0.05)", color: "#64748B" }}
                    >
                      {canAfford ? <>BUY · {u.cost} <Gem size={12} /></> : <>NEED {u.cost} <Gem size={11} /></>}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 flex items-center gap-3">
          <ShieldCheck size={18} className="text-[#34D399] shrink-0" />
          <p className="text-xs text-[#94A3B8] leading-relaxed">
            Credits are granted instantly to your wallet — no payment details are ever collected.
          </p>
        </div>
      </div>

      {checkout && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-[#05060D]/80 backdrop-blur p-4">
          <div className="w-[min(92vw,380px)] rounded-2xl border border-white/15 bg-[#0B1020] p-5">
            {stage === "form" && (
              <>
                <h3 className="font-display font-bold text-lg text-center">Checkout</h3>
                <p className="text-sm text-[#94A3B8] text-center mt-1">
                  <span className="text-[#00F5FF] font-bold">{checkout.credits}</span> Neon Credits · <span className="text-[#34D399] font-bold">$0.00</span>
                </p>
                <p className="mt-4 text-sm text-[#94A3B8] text-center leading-relaxed">
                  Credits are granted instantly to your wallet — no payment details required.
                </p>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <button onClick={close} className="py-2.5 rounded-xl border border-white/15 bg-white/5 text-sm font-bold hover:bg-white/10 transition">Cancel</button>
                  <button
                    onClick={handlePay}
                    onMouseDown={(e) => e.preventDefault()}
                    className="py-2.5 rounded-xl text-[#05060D] font-bold text-sm active:scale-95 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00F5FF]/50"
                    style={{ background: "linear-gradient(90deg,#00F5FF,#8B5CF6)" }}
                  >
                    Claim Credits
                  </button>
                </div>
              </>
            )}
            {stage === "processing" && (
              <div className="py-8 flex flex-col items-center gap-3">
                <Loader2 size={32} className="animate-spin text-[#00F5FF]" />
                <p className="text-sm text-[#94A3B8]">Granting credits…</p>
              </div>
            )}
            {stage === "done" && (
              <div className="py-8 flex flex-col items-center gap-3 text-center">
                <CheckCircle2 size={40} className="text-[#34D399]" />
                <h3 className="font-display font-bold text-lg">Credits Granted</h3>
                <p className="text-sm text-[#94A3B8]"><span className="text-[#00F5FF] font-bold">+{checkout.credits}</span> Neon Credits added to your wallet.</p>
                <button onClick={close} className="mt-2 px-6 py-2.5 rounded-xl text-[#05060D] font-bold text-sm" style={{ background: "linear-gradient(90deg,#00F5FF,#8B5CF6)" }}>
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}