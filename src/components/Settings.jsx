import React from "react";
import { ArrowLeft, Music, Zap, Info, Bell } from "lucide-react";
import NeonBackground from "@/components/ui/NeonBackground";

function Toggle({ on, onClick, label, icon: Icon, color }) {
  return (
    <button
      onClick={onClick}
      onMouseDown={(e) => e.preventDefault()}
      className="w-full flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 active:scale-[0.99] transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00F5FF]/50"
    >
      <Icon size={18} style={{ color }} />
      <span className="flex-1 text-left font-medium">{label}</span>
      <span className={`relative w-11 h-6 rounded-full transition-colors ${on ? "" : "bg-white/15"}`} style={on ? { background: color } : {}}>
        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${on ? "left-[22px]" : "left-0.5"}`} />
      </span>
    </button>
  );
}

function Slider({ value, onChange, label, color }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-sm">{label}</span>
        <span className="text-xs text-[#94A3B8] tabular-nums">{Math.round(value * 100)}%</span>
      </div>
      <input
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full cursor-pointer"
        style={{ accentColor: color }}
      />
    </div>
  );
}

export default function Settings({ profile, onBack, onToggleMusic, onToggleSfx, onMusicVolume, onSfxVolume, onSetDiscordWebhook }) {
  const s = profile.settings;
  return (
    <div className="relative h-screen w-full bg-[#05060D] text-[#F8FAFC] overflow-y-auto">
      <NeonBackground />
      <div className="sticky top-0 z-20 flex items-center justify-between px-4 sm:px-6 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-3 bg-[#05060D]/90 backdrop-blur border-b border-white/5">
        <button
          onClick={onBack}
          onMouseDown={(e) => e.preventDefault()}
          className="flex items-center gap-2 text-sm text-[#94A3B8] hover:text-[#F8FAFC] transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00F5FF]/50 rounded-lg"
        >
          <ArrowLeft size={18} /> Back
        </button>
        <h1
          className="font-display font-black tracking-wider text-lg"
          style={{ background: "linear-gradient(90deg,#00F5FF,#8B5CF6)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}
        >
          SETTINGS
        </h1>
        <div className="w-16" />
      </div>

      <div className="max-w-md mx-auto px-4 py-6">
        <p className="text-xs text-[#94A3B8] uppercase tracking-widest mb-2">Audio</p>
        <div className="space-y-3">
          <Toggle on={s.musicOn} onClick={onToggleMusic} label="Music" icon={Music} color="#00F5FF" />
          <Toggle on={s.sfxOn} onClick={onToggleSfx} label="Sound Effects" icon={Zap} color="#FF2E93" />
          <Slider value={s.musicVolume} onChange={onMusicVolume} label="Music Volume" color="#00F5FF" />
          <Slider value={s.sfxVolume} onChange={onSfxVolume} label="Effects Volume" color="#FF2E93" />
        </div>

        <p className="text-xs text-[#94A3B8] uppercase tracking-widest mt-6 mb-2">Discord</p>
        <div className="rounded-xl border border-white/15 bg-white/[0.07] p-4">
          <div className="flex items-center gap-2 mb-2">
            <Bell size={16} className="text-[#FF2E93]" />
            <span className="font-medium text-sm">High-Score Notifications</span>
          </div>
          <p className="text-xs text-[#94A3B8] leading-relaxed mb-3">Paste a Discord channel webhook URL to auto-post whenever you set a new personal best. Leave blank to disable.</p>
          <input
            type="url"
            value={profile.settings.discordWebhook || ""}
            onChange={(e) => onSetDiscordWebhook(e.target.value)}
            placeholder="https://discord.com/api/webhooks/..."
            className="w-full rounded-lg bg-[#05060D] border border-white/20 px-3 py-2 text-sm text-[#F8FAFC] placeholder:text-[#475569] focus:outline-none focus:border-[#FF2E93]/60"
          />
        </div>

        <div className="mt-6 flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-4 text-xs text-[#94A3B8] leading-relaxed">
          <Info size={16} className="text-[#00F5FF] mt-0.5 shrink-0" />
          <div>
            <p className="text-[#F8FAFC] font-medium mb-1">Controls</p>
            <p><b className="text-[#F8FAFC]">Desktop:</b> WASD / Arrow keys to move, Space to Dash, P or Esc to pause.</p>
            <p className="mt-1"><b className="text-[#F8FAFC]">Mobile:</b> Drag the left side to steer, tap the ability buttons on the right to Dash / Shield / Slow.</p>
          </div>
        </div>
      </div>
    </div>
  );
}