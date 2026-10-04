import React, { useState } from "react";
import { ArrowLeft, Check, Lock, Gem } from "lucide-react";
import { SHIP_SKINS, getSkin } from "@/game/skins";
import NeonBackground from "@/components/ui/NeonBackground";

function ShipPreview({ skin, size = 90 }) {
  return (
    <svg width={size} height={size * 0.6} viewBox="-50 -30 100 60" className="mx-auto">
      <polygon
        points="38,0 -28,-22 -14,0 -28,22"
        fill="rgba(5,6,13,0.85)"
        stroke={skin.color}
        strokeWidth="2.5"
        style={{ filter: `drop-shadow(0 0 8px ${skin.glow})` }}
      />
      <circle cx="0" cy="0" r="5" fill={skin.core} style={{ filter: `drop-shadow(0 0 8px ${skin.core})` }} />
    </svg>
  );
}

function currencyOf(skin) {
  if (skin.currency === "credits") return "credits";
  if (skin.currency === "story") return "story";
  if (skin.currency === "achievement") return "achievement";
  return "energy";
}
function priceOf(skin) {
  return skin.currency === "credits" ? skin.creditPrice : skin.price;
}

export default function Hangar({ profile, onBack, onPurchase, onPurchaseCredits, onEquip }) {
  const [selected, setSelected] = useState(profile.equippedSkin);
  const [confirm, setConfirm] = useState(null);
  const skin = getSkin(selected);
  const owned = profile.ownedSkins.includes(selected);
  const equipped = profile.equippedSkin === selected;
  const currency = currencyOf(skin);
  const price = priceOf(skin);
  const balance = currency === "credits" ? profile.neonCredits ?? 0 : profile.totalEnergy;
  const canAfford = balance >= price;

  const doBuy = () => {
    if (currency === "credits") onPurchaseCredits(confirm);
    else onPurchase(confirm);
    setConfirm(null);
  };

  return (
    <div className="relative h-screen w-full bg-[#05060D] text-[#F8FAFC] overflow-y-auto">
      <NeonBackground />
      <div className="sticky top-0 z-20 flex items-center justify-between px-4 sm:px-6 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-3 bg-[#05060D]/90 backdrop-blur border-b border-white/5">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-[#94A3B8] hover:text-[#F8FAFC] transition">
          <ArrowLeft size={18} /> Back
        </button>
        <h1 className="font-display font-black tracking-wider text-lg" style={{ background: "linear-gradient(90deg,#8B5CF6,#00F5FF)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>
          HANGAR
        </h1>
        <div className="flex items-center gap-2">
          <div className="px-2.5 py-1.5 rounded-lg bg-[#FFD166]/10 border border-[#FFD166]/30 text-xs font-bold text-[#FFD166] tabular-nums flex items-center gap-1">
            {profile.totalEnergy} ⚡
          </div>
          <div className="px-2.5 py-1.5 rounded-lg bg-[#00F5FF]/10 border border-[#00F5FF]/30 text-xs font-bold text-[#00F5FF] tabular-nums flex items-center gap-1">
            <Gem size={12} /> {profile.neonCredits ?? 0}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 grid md:grid-cols-2 gap-5">
        {/* preview */}
        <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-transparent p-6 flex flex-col items-center justify-center min-h-[260px]">
          <div className="relative w-full flex-1 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full blur-3xl opacity-30" style={{ background: `radial-gradient(circle,${skin.glow},transparent 70%)` }} />
            <div className="relative animate-pulse"><ShipPreview skin={skin} size={140} /></div>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <h2 className="font-display font-bold text-xl" style={{ color: skin.color }}>{skin.name}</h2>
            {skin.currency === "credits" && (
              <span className="px-2 py-0.5 rounded-full text-xs font-display font-bold tracking-wider text-[#05060D]" style={{ background: "linear-gradient(90deg,#00F5FF,#FF2E93)" }}>
                PREMIUM
              </span>
            )}
          </div>
          <p className="text-sm text-[#94A3B8] text-center mt-1 max-w-xs">{skin.description}</p>
          <div className="mt-4 w-full">
            {owned ? (
              equipped ? (
                <div className="w-full py-3 rounded-xl bg-[#00F5FF]/15 border border-[#00F5FF]/40 text-[#00F5FF] font-display font-bold tracking-wider flex items-center justify-center gap-2">
                  <Check size={18} /> EQUIPPED
                </div>
              ) : (
                <button onClick={() => onEquip(selected)} className="w-full py-3 rounded-xl bg-[#00F5FF] text-[#05060D] font-display font-bold tracking-wider active:scale-95 transition">
                  EQUIP
                </button>
              )
            ) : currency === "story" ? (
              <div className="w-full py-3 rounded-xl border border-white/10 bg-white/5 text-[#94A3B8] font-display font-bold tracking-wider flex items-center justify-center gap-2 text-sm">
                <Lock size={16} /> STORY REWARD
              </div>
            ) : currency === "achievement" ? (
              <div className="w-full py-3 rounded-xl border border-white/10 bg-white/5 text-[#94A3B8] font-display font-bold tracking-wider flex items-center justify-center gap-2 text-sm">
                <Lock size={16} /> ACHIEVEMENT REWARD
              </div>
            ) : (
              <button
                onClick={() => setConfirm(selected)}
                disabled={!canAfford}
                className="w-full py-3 rounded-xl font-display font-bold tracking-wider flex items-center justify-center gap-2 active:scale-95 transition disabled:opacity-40"
                style={canAfford ? { background: `linear-gradient(90deg,${skin.color},#8B5CF6)`, color: "#05060D" } : { background: "rgba(255,255,255,0.05)", color: "#64748B" }}
              >
                {canAfford ? (
                  <>BUY — {price} {currency === "credits" ? <Gem size={14} /> : "⚡"}</>
                ) : (
                  <><Lock size={16} /> NEED {price} {currency === "credits" ? <Gem size={12} /> : "⚡"}</>
                )}
              </button>
            )}
          </div>
        </div>

        {/* list */}
        <div className="space-y-2.5">
          {SHIP_SKINS.map((s) => {
            const isOwned = profile.ownedSkins.includes(s.id);
            const isEquipped = profile.equippedSkin === s.id;
            const sCur = currencyOf(s);
            const sPrice = priceOf(s);
            return (
              <button
                key={s.id}
                onClick={() => setSelected(s.id)}
                className={`w-full flex items-center gap-3 rounded-xl p-3 border transition text-left ${selected === s.id ? "border-[#00F5FF]/50 bg-[#00F5FF]/5" : "border-white/10 bg-white/5 hover:bg-white/10"}`}
              >
                <div className="shrink-0"><ShipPreview skin={s} size={56} /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-display font-bold text-sm" style={{ color: s.color }}>{s.name}</span>
                    {s.currency === "credits" && <Gem size={11} className="text-[#00F5FF]" />}
                  </div>
                  <div className="text-xs text-[#94A3B8] truncate">{s.description}</div>
                </div>
                <div className="shrink-0 text-right">
                  {isEquipped ? (
                    <span className="text-xs font-bold text-[#00F5FF]">EQUIPPED</span>
                  ) : isOwned ? (
                    <span className="text-xs text-[#94A3B8]">Owned</span>
                  ) : sCur === "story" ? (
                    <span className="text-xs font-bold text-[#94A3B8] flex items-center gap-1"><Lock size={11} /> Story</span>
                  ) : sCur === "achievement" ? (
                    <span className="text-xs font-bold text-[#94A3B8] flex items-center gap-1"><Lock size={11} /> Achievement</span>
                  ) : (
                    <span className={`text-xs font-bold flex items-center gap-1 ${sCur === "credits" ? "text-[#00F5FF]" : "text-[#FFD166]"}`}>
                      {sPrice} {sCur === "credits" ? <Gem size={11} /> : "⚡"}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* confirm modal */}
      {confirm && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-[#05060D]/80 backdrop-blur p-4">
          <div className="w-[min(90vw,340px)] rounded-2xl border border-white/15 bg-[#0B1020] p-5">
            <h3 className="font-display font-bold text-lg text-center">Confirm Purchase</h3>
            <p className="text-sm text-[#94A3B8] text-center mt-2">
              Buy <span style={{ color: skin.color }} className="font-bold">{skin.name}</span> for{" "}
              <span className={currency === "credits" ? "text-[#00F5FF] font-bold" : "text-[#FFD166] font-bold"}>
                {price} {currency === "credits" ? "Neon Credits" : "energy"}
              </span>?
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button onClick={() => setConfirm(null)} className="py-2.5 rounded-xl border border-white/15 bg-white/5 text-sm font-bold hover:bg-white/10 transition">Cancel</button>
              <button
                onClick={doBuy}
                className="py-2.5 rounded-xl text-[#05060D] font-bold text-sm"
                style={{ background: skin.color }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}