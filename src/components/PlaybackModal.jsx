import React, { useEffect, useRef, useState } from "react";
import { X, Play } from "lucide-react";
import { getSkin } from "@/game/skins";

const PLAYBACK_MS = 14000;

export default function PlaybackModal({ entry, onClose }) {
  const canvasRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const rafRef = useRef(null);
  const startRef = useRef(0);

  const skin = getSkin(entry.skin || "default");
  const path = Array.isArray(entry.path) ? entry.path : [];
  const numPoints = Math.floor(path.length / 2);

  function draw(ctx, canvas, t) {
    const W = canvas.clientWidth || 1;
    const H = canvas.clientHeight || 1;
    ctx.fillStyle = "#05060D";
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "rgba(0,245,255,0.06)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x <= W; x += 40) { ctx.moveTo(x, 0); ctx.lineTo(x, H); }
    for (let y = 0; y <= H; y += 40) { ctx.moveTo(0, y); ctx.lineTo(W, y); }
    ctx.stroke();
    ctx.strokeStyle = "rgba(0,245,255,0.4)";
    ctx.lineWidth = 2;
    ctx.strokeRect(4, 4, W - 8, H - 8);

    if (numPoints < 2) {
      ctx.fillStyle = "#94A3B8";
      ctx.font = "14px Rajdhani, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("No path recorded for this run", W / 2, H / 2);
      return;
    }
    const curIdx = Math.min(numPoints - 1, Math.floor(t * (numPoints - 1)));
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = skin.color;
    ctx.lineWidth = 2.5;
    ctx.shadowColor = skin.glow;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    for (let i = 0; i <= curIdx; i++) {
      const x = path[i * 2] * W;
      const y = path[i * 2 + 1] * H;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = "source-over";
    const sx = path[curIdx * 2] * W;
    const sy = path[curIdx * 2 + 1] * H;
    ctx.fillStyle = skin.core;
    ctx.shadowColor = skin.core;
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.arc(sx, sy, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  const startPlay = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    setDone(false);
    setProgress(0);
    startRef.current = performance.now();
    const render = (now) => {
      const t = Math.min(1, (now - startRef.current) / PLAYBACK_MS);
      setProgress(t);
      draw(ctx, canvas, t);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(render);
      } else {
        setDone(true);
      }
    };
    rafRef.current = requestAnimationFrame(render);
  };

  useEffect(() => {
    startPlay();
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#05060D]/85 backdrop-blur-md p-4">
      <div className="w-[min(92vw,560px)] rounded-2xl border border-[#00F5FF]/30 bg-[#0B1020]/95 p-5 shadow-[0_0_40px_rgba(0,245,255,0.2)]">
        <div className="flex items-center justify-between mb-3">
          <div className="min-w-0">
            <div className="font-display font-bold text-lg truncate" style={{ color: skin.color }}>
              {entry.player_name}
            </div>
            <div className="text-xs text-[#94A3B8] tabular-nums">
              {Number(entry.score).toLocaleString()} pts · Wave {entry.wave} · {entry.duration}s
            </div>
          </div>
          <button
            onClick={onClose}
            onMouseDown={(e) => e.preventDefault()}
            className="shrink-0 w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 active:scale-95 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00F5FF]/50"
            aria-label="Close playback"
          >
            <X size={18} />
          </button>
        </div>
        <div className="relative aspect-video rounded-xl overflow-hidden bg-[#05060D] border border-white/10">
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
          {done && (
            <button
              onClick={startPlay}
              onMouseDown={(e) => e.preventDefault()}
              className="absolute inset-0 flex items-center justify-center bg-[#05060D]/40 hover:bg-[#05060D]/30 transition"
              aria-label="Replay run"
            >
              <span className="px-5 py-2.5 rounded-xl bg-[#00F5FF] text-[#05060D] font-display font-bold tracking-wider flex items-center gap-2">
                <Play size={16} /> REPLAY
              </span>
            </button>
          )}
        </div>
        <div className="mt-3 h-1.5 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{ width: `${progress * 100}%`, background: skin.color, boxShadow: `0 0 8px ${skin.glow}` }}
          />
        </div>
        <p className="mt-2 text-xs text-[#94A3B8] text-center">Run playback · {numPoints} path points</p>
      </div>
    </div>
  );
}