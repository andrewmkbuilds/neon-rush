import React, { useEffect, useRef, useState, useCallback } from "react";
import { ArrowLeft, Play, Pause, RotateCcw, Trophy } from "lucide-react";
import { getSkin } from "@/game/skins";

// LASER DODGE — a compact, self-contained arcade mini-game. Dodge telegraphed
// laser beams in a small arena. Score is survival time. Works fully offline.
const ARENA_PAD = 10;

export default function LaserDodge({ skinId, onExit, onResult }) {
  const canvasRef = useRef(null);
  const gameRef = useRef(null);
  const rafRef = useRef(null);
  const [screen, setScreen] = useState("ready"); // ready | playing | paused | over
  const [hud, setHud] = useState({ time: 0, dodged: 0 });
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const screenRef = useRef("ready");

  useEffect(() => { screenRef.current = screen; }, [screen]);

  const skin = getSkin(skinId);

  const buildGame = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    return {
      ctx, W, H,
      player: { x: W / 2, y: H / 2, r: 11, vx: 0, vy: 0 },
      lasers: [],
      spawnTimer: 1.2,
      time: 0,
      dodged: 0,
      hudAcc: 0,
      keys: {},
      pointer: null,
      last: 0,
      over: false,
    };
  }, []);

  const resize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    const g = gameRef.current;
    if (g) { g.W = canvas.width; g.H = canvas.height; }
  }, []);

  // input
  useEffect(() => {
    const kd = (e) => {
      const g = gameRef.current;
      if (!g) return;
      const k = e.key.toLowerCase();
      g.keys[k] = true;
      if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(k)) e.preventDefault();
    };
    const ku = (e) => { const g = gameRef.current; if (g) g.keys[e.key.toLowerCase()] = false; };
    window.addEventListener("keydown", kd);
    window.addEventListener("keyup", ku);
    return () => { window.removeEventListener("keydown", kd); window.removeEventListener("keyup", ku); };
  }, []);

  useEffect(() => {
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [resize]);

  const start = useCallback(() => {
    gameRef.current = buildGame();
    setHud({ time: 0, dodged: 0 });
    setScreen("playing");
    screenRef.current = "playing";
    const g = gameRef.current;
    g.last = performance.now();
    const loop = (now) => {
      if (!gameRef.current) return;
      const dt = Math.min(0.05, (now - g.last) / 1000);
      g.last = now;
      if (screenRef.current === "playing") {
        update(g, dt);
        g.hudAcc += dt;
        if (g.hudAcc >= 0.1) { g.hudAcc = 0; setHud({ time: g.time, dodged: g.dodged }); }
      }
      render(g, skin);
      if (screenRef.current === "playing" && !g.over) {
        rafRef.current = requestAnimationFrame(loop);
      } else if (screenRef.current === "paused") {
        // keep rendering static frame, wait for resume
        rafRef.current = requestAnimationFrame(loop);
      } else if (g.over) {
        finish(g);
      }
    };
    rafRef.current = requestAnimationFrame(loop);
  }, [buildGame, skin]);

  const finish = useCallback((g) => {
    const s = Math.floor(g.time * 100);
    setScore(s);
    setBest((b) => Math.max(b, s));
    setScreen("over");
    screenRef.current = "over";
    onResult && onResult({ score: s, time: Math.floor(g.time), dodged: g.dodged });
  }, [onResult]);

  const pause = useCallback(() => {
    if (screenRef.current !== "playing") return;
    setScreen("paused");
    screenRef.current = "paused";
  }, []);
  const resume = useCallback(() => {
    if (screenRef.current !== "paused") return;
    const g = gameRef.current;
    if (g) g.last = performance.now();
    setScreen("playing");
    screenRef.current = "playing";
  }, []);

  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); gameRef.current = null; }, []);

  // pointer drag
  const onPointer = (e) => {
    const g = gameRef.current;
    if (!g || screenRef.current !== "playing") return;
    const rect = canvasRef.current.getBoundingClientRect();
    const dpr = canvasRef.current.width / rect.width;
    g.pointer = { x: (e.clientX - rect.left) * dpr, y: (e.clientY - rect.top) * dpr };
  };
  const endPointer = () => { const g = gameRef.current; if (g) g.pointer = null; };

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#05060D] select-none touch-none">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full touch-none"
        style={{ touchAction: "none" }}
        onPointerDown={onPointer}
        onPointerMove={onPointer}
        onPointerUp={endPointer}
        onPointerLeave={endPointer}
      />

      {/* top bar */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-2">
        <button onClick={onExit} className="flex items-center gap-2 text-sm text-[#94A3B8] hover:text-[#F8FAFC] transition"><ArrowLeft size={18} /> Exit</button>
        <div className="font-display font-black tracking-wider text-sm" style={{ color: "#00F5FF" }}>LASER DODGE</div>
        {screen === "playing" ? (
          <button onClick={pause} className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center active:scale-95 transition"><Pause size={16} className="text-[#F8FAFC]" /></button>
        ) : <div className="w-9" />}
      </div>

      {/* HUD */}
      {screen === "playing" && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-10 flex items-center gap-4 px-4 py-1.5 rounded-full bg-[#0A0B14]/80 backdrop-blur border border-white/10">
          <span className="font-display font-bold tabular-nums text-[#00F5FF] text-sm">{hud.time.toFixed(1)}s</span>
          <span className="text-[#334155]">·</span>
          <span className="font-display font-bold tabular-nums text-[#FFD166] text-sm">{hud.dodged} dodged</span>
        </div>
      )}

      {/* ready */}
      {screen === "ready" && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#05060D]/70 backdrop-blur-sm px-6 text-center">
          <h2 className="font-display font-black tracking-wider text-3xl" style={{ background: "linear-gradient(90deg,#00F5FF,#8B5CF6)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>LASER DODGE</h2>
          <p className="text-sm text-[#94A3B8] mt-2 max-w-xs">Dodge the telegraphed laser beams. Beams flash before they fire — read the lines and move early.</p>
          <p className="text-xs text-[#64748B] mt-3">MOVE: WASD / Arrows / Drag</p>
          <button onClick={start} onMouseDown={(e) => e.preventDefault()} className="mt-6 px-10 py-3.5 rounded-2xl font-display font-black tracking-[0.15em] text-[#05060D] active:scale-95 transition" style={{ background: "linear-gradient(90deg,#00F5FF,#8B5CF6)", boxShadow: "0 0 20px rgba(0,245,255,0.4)" }}>
            <span className="flex items-center gap-2"><Play size={18} fill="#05060D" /> START</span>
          </button>
        </div>
      )}

      {/* paused */}
      {screen === "paused" && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#05060D]/80 backdrop-blur px-6 text-center">
          <h2 className="font-display font-black tracking-wider text-2xl text-[#F8FAFC]">PAUSED</h2>
          <div className="mt-5 flex gap-3">
            <button onClick={resume} className="px-6 py-2.5 rounded-xl font-display font-bold tracking-wider text-[#05060D] active:scale-95 transition" style={{ background: "linear-gradient(90deg,#00F5FF,#8B5CF6)" }}>RESUME</button>
            <button onClick={onExit} className="px-6 py-2.5 rounded-xl border border-white/15 bg-white/5 font-display font-bold tracking-wider active:scale-95 transition">EXIT</button>
          </div>
        </div>
      )}

      {/* over */}
      {screen === "over" && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#05060D]/85 backdrop-blur px-6 text-center">
          <h2 className="font-display font-black tracking-wider text-2xl text-[#FF3B5C]">SYSTEM FAILURE</h2>
          <div className="mt-4 flex items-center gap-2 text-[#FFD166]"><Trophy size={18} /><span className="font-display font-black text-3xl tabular-nums">{score.toLocaleString()}</span></div>
          <div className="text-xs text-[#94A3B8] mt-1">Best: {Math.max(best, score).toLocaleString()}</div>
          <div className="mt-6 flex gap-3">
            <button onClick={start} className="px-6 py-2.5 rounded-xl font-display font-bold tracking-wider text-[#05060D] active:scale-95 transition flex items-center gap-2" style={{ background: "linear-gradient(90deg,#00F5FF,#8B5CF6)" }}><RotateCcw size={16} /> RETRY</button>
            <button onClick={onExit} className="px-6 py-2.5 rounded-xl border border-white/15 bg-white/5 font-display font-bold tracking-wider active:scale-95 transition">EXIT</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---- update / render (module-scope, no React) ----
function update(g, dt) {
  g.time += dt;
  const p = g.player;
  const speed = 320;
  // keyboard
  let kx = 0, ky = 0;
  if (g.keys["a"] || g.keys["arrowleft"]) kx -= 1;
  if (g.keys["d"] || g.keys["arrowright"]) kx += 1;
  if (g.keys["w"] || g.keys["arrowup"]) ky -= 1;
  if (g.keys["s"] || g.keys["arrowdown"]) ky += 1;
  if (kx || ky) {
    const m = Math.hypot(kx, ky);
    p.x += (kx / m) * speed * dt;
    p.y += (ky / m) * speed * dt;
  } else if (g.pointer) {
    const dx = g.pointer.x - p.x, dy = g.pointer.y - p.y;
    const d = Math.hypot(dx, dy);
    if (d > 4) { const f = Math.min(1, d / 60); p.x += (dx / d) * speed * f * dt; p.y += (dy / d) * speed * f * dt; }
  }
  p.x = Math.max(ARENA_PAD + p.r, Math.min(g.W - ARENA_PAD - p.r, p.x));
  p.y = Math.max(ARENA_PAD + p.r, Math.min(g.H - ARENA_PAD - p.r, p.y));

  // spawn lasers — ramping difficulty, capped to keep it fair
  g.spawnTimer -= dt;
  const interval = Math.max(0.45, 1.3 - g.time * 0.012);
  if (g.spawnTimer <= 0) {
    g.spawnTimer = interval;
    const horizontal = Math.random() < 0.5;
    const beam = {
      h: horizontal,
      pos: horizontal ? rand(40, g.H - 40) : rand(40, g.W - 40),
      phase: "warn",
      t: 0,
      warned: false,
    };
    const warnTime = Math.max(0.45, 0.85 - g.time * 0.004);
    const fireTime = 0.4;
    beam.warnTime = warnTime;
    beam.fireTime = fireTime;
    g.lasers.push(beam);
  }

  // update lasers + collision
  for (const l of g.lasers) {
    l.t += dt;
    if (l.phase === "warn" && l.t >= l.warnTime) { l.phase = "fire"; l.t = 0; }
    else if (l.phase === "fire") {
      if (!l.warned) { l.warned = true; }
      if (l.t >= l.fireTime) { l.phase = "done"; g.dodged++; }
      else {
        // collision: distance from player to beam line
        const thickness = 12;
        const dist = l.h ? Math.abs(p.y - l.pos) : Math.abs(p.x - l.pos);
        if (dist < thickness + p.r) { g.over = true; }
      }
    }
  }
  g.lasers = g.lasers.filter((l) => l.phase !== "done");
}

function render(g, skin) {
  const ctx = g.ctx, W = g.W, H = g.H;
  ctx.fillStyle = "#05060D";
  ctx.fillRect(0, 0, W, H);

  // grid
  ctx.strokeStyle = "rgba(0,245,255,0.06)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  const step = 50;
  for (let x = 0; x < W; x += step) { ctx.moveTo(x, 0); ctx.lineTo(x, H); }
  for (let y = 0; y < H; y += step) { ctx.moveTo(0, y); ctx.lineTo(W, y); }
  ctx.stroke();

  // border
  ctx.strokeStyle = "rgba(0,245,255,0.4)";
  ctx.lineWidth = 2;
  ctx.shadowColor = "#00F5FF"; ctx.shadowBlur = 10;
  ctx.strokeRect(ARENA_PAD, ARENA_PAD, W - ARENA_PAD * 2, H - ARENA_PAD * 2);
  ctx.shadowBlur = 0;

  // lasers
  for (const l of g.lasers) {
    if (l.phase === "warn") {
      const a = 0.25 + Math.sin(l.t * 30) * 0.2;
      ctx.strokeStyle = `rgba(255,59,92,${a})`;
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 8]);
      ctx.beginPath();
      if (l.h) { ctx.moveTo(ARENA_PAD, l.pos); ctx.lineTo(W - ARENA_PAD, l.pos); }
      else { ctx.moveTo(l.pos, ARENA_PAD); ctx.lineTo(l.pos, H - ARENA_PAD); }
      ctx.stroke();
      ctx.setLineDash([]);
    } else if (l.phase === "fire") {
      const thickness = 12;
      ctx.shadowColor = "#FF3B5C"; ctx.shadowBlur = 20;
      ctx.fillStyle = "#FF3B5C";
      if (l.h) ctx.fillRect(ARENA_PAD, l.pos - thickness / 2, W - ARENA_PAD * 2, thickness);
      else ctx.fillRect(l.pos - thickness / 2, ARENA_PAD, thickness, H - ARENA_PAD * 2);
      ctx.shadowBlur = 0;
      // bright core
      ctx.fillStyle = "#FFFFFF";
      if (l.h) ctx.fillRect(ARENA_PAD, l.pos - 1.5, W - ARENA_PAD * 2, 3);
      else ctx.fillRect(l.pos - 1.5, ARENA_PAD, 3, H - ARENA_PAD * 2);
    }
  }

  // player
  const p = g.player;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.strokeStyle = skin.color;
  ctx.lineWidth = 2.5;
  ctx.shadowColor = skin.glow; ctx.shadowBlur = 14;
  ctx.fillStyle = "rgba(5,6,13,0.85)";
  ctx.beginPath();
  ctx.moveTo(p.r + 3, 0); ctx.lineTo(-p.r, -p.r * 0.8); ctx.lineTo(-p.r * 0.5, 0); ctx.lineTo(-p.r, p.r * 0.8); ctx.closePath();
  ctx.fill(); ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.fillStyle = skin.core;
  ctx.beginPath(); ctx.arc(0, 0, 3.5, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function rand(a, b) { return a + Math.random() * (b - a); }