import React from "react";
import { Zap, Shield, Hourglass } from "lucide-react";

function AbilityButton({ icon: Icon, label, ready, cd, active, color, onActivate, disabled, maxCd = 8 }) {
  const pct = cd > 0 ? Math.max(0, Math.min(1, 1 - cd / maxCd)) : 1;
  return (
    <button
      onPointerDown={(e) => { e.preventDefault(); onActivate(); }}
      disabled={disabled || !ready}
      className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border backdrop-blur flex flex-col items-center justify-center transition-all active:scale-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 touch-none"
      style={{
        borderColor: ready ? color : "rgba(255,255,255,0.1)",
        background: active ? `${color}33` : "rgba(255,255,255,0.05)",
        boxShadow: ready ? `0 0 16px ${color}55` : "none",
        opacity: disabled ? 0.3 : 1,
      }}
      aria-label={label}
    >
      <Icon size={28} style={{ color: ready ? color : "#64748B" }} />
      <span className="text-xs mt-0.5 uppercase tracking-wider" style={{ color: ready ? "#F8FAFC" : "#64748B" }}>
        {label}
      </span>
      {cd > 0 && (
        <span className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
          <span
            className="absolute bottom-0 left-0 right-0 bg-white/10"
            style={{ height: `${pct * 100}%` }}
          />
          <span className="absolute inset-0 flex items-center justify-center text-xs font-bold tabular-nums text-white/80">
            {Math.ceil(cd)}
          </span>
        </span>
      )}
    </button>
  );
}

export default function TouchControls({ hud, onDash, onShield, onSlow }) {
  return (
    <div className="absolute bottom-[calc(0.75rem+env(safe-area-inset-bottom))] right-[calc(0.75rem+env(safe-area-inset-right))] sm:bottom-4 sm:right-4 z-10 flex gap-4 sm:gap-5 touch-none">
      {hud.unlocked.slow && (
        <AbilityButton
          icon={Hourglass}
          label="Slow"
          color="#8B5CF6"
          ready={hud.slowReady}
          cd={hud.slowCd}
          active={hud.slowActive > 0}
          onActivate={onSlow}
          maxCd={26}
        />
      )}
      {hud.unlocked.shield && (
        <AbilityButton
          icon={Shield}
          label="Shield"
          color="#8B5CF6"
          ready={hud.shieldReady}
          cd={hud.shieldCd}
          active={hud.shieldActive > 0}
          onActivate={onShield}
          maxCd={22}
        />
      )}
      {hud.unlocked.dash && (
        <AbilityButton
          icon={Zap}
          label="Dash"
          color="#00F5FF"
          ready={hud.dashReady}
          cd={hud.dashCd}
          active={hud.dashActive > 0}
          onActivate={onDash}
          maxCd={hud.dashMaxCd || 8}
        />
      )}
    </div>
  );
}