// NEON RUSH game engine — framework-agnostic canvas arcade engine.
import { getSkin } from "./skins";
import { getDifficulty } from "./difficulties";
import { ObstacleManager } from "./obstacles";
import { MILESTONES } from "./challenges";
import { RunDirector } from "./director";
import { modBonus } from "./modifiers";

const TAU = Math.PI * 2;
const rand = (a, b) => a + Math.random() * (b - a);
const randInt = (a, b) => Math.floor(rand(a, b + 1));
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const dist = (x1, y1, x2, y2) => Math.hypot(x1 - x2, y1 - y2);

export const PLAYER_RADIUS = 16;
const NEAR_MISS_RADIUS = 32;
const COMBO_MAX_TIME = 4.0;

function multForCombo(c) {
  if (c >= 8) return 8;
  if (c >= 5) return 5;
  if (c >= 3) return 3;
  if (c >= 2) return 2;
  return 1;
}

// distance from point to segment
function segDist(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1;
  const len2 = dx * dx + dy * dy || 1;
  let t = ((px - x1) * dx + (py - y1) * dy) / len2;
  t = clamp(t, 0, 1);
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

// ---------- Particles ----------
class Particle {
  constructor() { this.active = false; }
  spawn(x, y, vx, vy, life, size, color) {
    this.x = x; this.y = y; this.vx = vx; this.vy = vy;
    this.life = life; this.maxLife = life; this.size = size; this.color = color;
    this.active = true;
  }
  update(dt) {
    if (!this.active) return;
    this.x += this.vx * dt; this.y += this.vy * dt;
    this.vx *= 0.94; this.vy *= 0.94;
    this.life -= dt;
    if (this.life <= 0) this.active = false;
  }
  draw(ctx) {
    if (!this.active) return;
    const a = clamp(this.life / this.maxLife, 0, 1);
    ctx.globalAlpha = a;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, Math.max(0.5, this.size * a), 0, TAU);
    ctx.fill();
  }
}

class ParticleSystem {
  constructor(n = 500) {
    this.pool = Array.from({ length: n }, () => new Particle());
    this.i = 0;
  }
  emit(x, y, vx, vy, life, size, color) {
    for (let k = 0; k < this.pool.length; k++) {
      const p = this.pool[(this.i + k) % this.pool.length];
      if (!p.active) {
        p.spawn(x, y, vx, vy, life, size, color);
        this.i = (this.i + k + 1) % this.pool.length;
        return;
      }
    }
  }
  burst(x, y, count, speed, color, life = 0.6, size = 3) {
    for (let i = 0; i < count; i++) {
      const a = rand(0, TAU);
      const s = rand(speed * 0.3, speed);
      this.emit(x, y, Math.cos(a) * s, Math.sin(a) * s, rand(life * 0.5, life), rand(size * 0.5, size), color);
    }
  }
  // even expanding ring — reads as a shockwave/impact pop
  ring(x, y, count, speed, color, life = 0.5, size = 3) {
    for (let i = 0; i < count; i++) {
      const a = (i / count) * TAU;
      const s = speed * (0.92 + Math.random() * 0.16);
      this.emit(x, y, Math.cos(a) * s, Math.sin(a) * s, life, size, color);
    }
  }
  update(dt) { for (const p of this.pool) p.update(dt); }
  draw(ctx) { for (const p of this.pool) p.draw(ctx); }
}

// ---------- Collectible ----------
class Collectible {
  constructor(x, y, kind) {
    this.x = x; this.y = y; this.kind = kind; // cyan/purple/gold
    this.r = kind === "gold" ? 11 : kind === "purple" ? 9 : 8;
    this.dead = false;
    this.phase = Math.random() * TAU;
    this.life = 14; // seconds before despawn
  }
}

export class GameEngine {
  constructor(canvas, opts = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.opts = opts;
    this.onHud = opts.onHud || (() => {});
    this.onState = opts.onState || (() => {});
    this.onGameOver = opts.onGameOver || (() => {});
    this.onEvent = opts.onEvent || (() => {});
    this.audio = opts.audio;
    this.skinId = opts.skinId || "default";
    this.unlocked = { dash: true, shield: false, slow: false, ...(opts.unlockedAbilities || {}) };
    this.difficulty = opts.difficulty || "normal";
    this.tutorial = !!opts.tutorial;
    this.onTutorialComplete = opts.onTutorialComplete || (() => {});
    this.ghostPath = Array.isArray(opts.ghostPath) ? opts.ghostPath : null;
    this.constraints = opts.constraints || {};
    this.startEnergy = opts.startEnergy || 0;
    this.modifiers = opts.modifiers || {};

    this.state = "idle"; // idle | ready | playing | paused | gameover
    this.last = 0;
    this.raf = null;
    this.dpr = 1;
    this.W = 800; this.H = 600;

    this.keys = new Set();
    this.joy = { active: false, pointerId: null, bx: 0, by: 0, x: 0, y: 0 };
    this.joyRadius = 80; // configurable max joystick radius
    this.mouse = { x: 0, y: 0, active: false };
    this.lastDir = { x: 1, y: 0 };
    this.touch = typeof window !== "undefined" && window.matchMedia ? window.matchMedia("(pointer: coarse)").matches : false;

    this._hudAcc = 0;
    this._bound = {
      kd: this.onKeyDown.bind(this),
      ku: this.onKeyUp.bind(this),
      blur: this.onBlur.bind(this),
      vis: this.onVis.bind(this),
      pd: this.onPointerDown.bind(this),
      pm: this.onPointerMove.bind(this),
      pu: this.onPointerUp.bind(this),
      mm: this.onMouseMove.bind(this),
      ml: this.onMouseLeave.bind(this),
    };
    this.resize();
    this.reset();
    this.attach();
  }

  attach() {
    window.addEventListener("keydown", this._bound.kd);
    window.addEventListener("keyup", this._bound.ku);
    window.addEventListener("blur", this._bound.blur);
    document.addEventListener("visibilitychange", this._bound.vis);
    this.canvas.addEventListener("pointerdown", this._bound.pd);
    window.addEventListener("pointermove", this._bound.pm);
    window.addEventListener("pointerup", this._bound.pu);
    window.addEventListener("pointercancel", this._bound.pu);
    this.canvas.addEventListener("mousemove", this._bound.mm);
    this.canvas.addEventListener("mouseleave", this._bound.ml);
  }

  destroy() {
    this.stop();
    window.removeEventListener("keydown", this._bound.kd);
    window.removeEventListener("keyup", this._bound.ku);
    window.removeEventListener("blur", this._bound.blur);
    document.removeEventListener("visibilitychange", this._bound.vis);
    this.canvas.removeEventListener("pointerdown", this._bound.pd);
    window.removeEventListener("pointermove", this._bound.pm);
    window.removeEventListener("pointerup", this._bound.pu);
    window.removeEventListener("pointercancel", this._bound.pu);
    this.canvas.removeEventListener("mousemove", this._bound.mm);
    this.canvas.removeEventListener("mouseleave", this._bound.ml);
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.W = Math.max(320, rect.width);
    this.H = Math.max(320, rect.height);
    this.canvas.width = Math.floor(this.W * this.dpr);
    this.canvas.height = Math.floor(this.H * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    if (this.stars) this.initStars();
  }

  onBlur() { this.keys.clear(); this.mouse.active = false; this.joy.active = false; this.joy.pointerId = null; if (this.state === "playing") this.pause(); }
  onVis() { if (document.hidden && this.state === "playing") this.pause(); }

  onKeyDown(e) {
    const tag = e.target && e.target.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
    const k = e.key.toLowerCase();
    if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(k)) e.preventDefault();
    this.keys.add(k);
    if (this.state === "playing") {
      if ((k === " " || k === "spacebar") && !e.repeat) this.activateDash();
      if (k === "q") this.activateShield();
      if (k === "e") this.activateSlow();
      if (k === "p" || k === "escape") this.pause();
    } else if (this.state === "ready" && (k === " " || k === "spacebar") && !e.repeat) {
      // buffer dash pressed during the countdown so the first tap fires the instant play starts
      this._dashQueuedAt = performance.now();
    } else if (this.state === "paused" && (k === "p" || k === "escape")) {
      this.resume();
    }
  }
  onKeyUp(e) { this.keys.delete(e.key.toLowerCase()); }

  onPointerDown(e) {
    if (e.pointerType !== "touch") return;
    if (this.state !== "playing" && this.state !== "ready") return;
    if (this.joy.active) return; // one movement finger at a time
    // spawn a floating joystick exactly where the player touched, clamped on-screen
    const r = this.joyRadius;
    this.joy.pointerId = e.pointerId;
    this.joy.bx = clamp(e.clientX, r, this.W - r);
    this.joy.by = clamp(e.clientY, r, this.H - r);
    this.joy.x = e.clientX;
    this.joy.y = e.clientY;
    this.joy.active = true;
    // capture so we keep receiving move/up even if the finger drifts over UI
    try { this.canvas.setPointerCapture(e.pointerId); } catch (_) {}
  }
  onPointerMove(e) {
    if (!this.joy.active || e.pointerId !== this.joy.pointerId) return;
    this.joy.x = e.clientX; this.joy.y = e.clientY;
  }
  onPointerUp(e) {
    if (e.pointerId !== this.joy.pointerId) return;
    this.joy.active = false;
    this.joy.pointerId = null;
  }

  // centralized input → normalized movement vector (keyboard + touch joystick)
  inputVector() {
    let ix = 0, iy = 0;
    if (this.keys.has("arrowleft") || this.keys.has("a")) ix -= 1;
    if (this.keys.has("arrowright") || this.keys.has("d")) ix += 1;
    if (this.keys.has("arrowup") || this.keys.has("w")) iy -= 1;
    if (this.keys.has("arrowdown") || this.keys.has("s")) iy += 1;
    const kbd = ix !== 0 || iy !== 0;
    let joy = false;
    if (this.joy.active) {
      const dx = this.joy.x - this.joy.bx, dy = this.joy.y - this.joy.by;
      const mag = Math.hypot(dx, dy);
      if (mag > 4) {
        const m = Math.min(1, mag / this.joyRadius);
        ix += (dx / mag) * m;
        iy += (dy / mag) * m;
        joy = true;
      }
    }
    if (kbd && !joy) { const m = Math.hypot(ix, iy); if (m > 0) { ix /= m; iy /= m; } }
    const m = Math.hypot(ix, iy);
    if (m > 1) { ix /= m; iy /= m; }
    return { ix, iy, hasInput: Math.abs(ix) > 0.01 || Math.abs(iy) > 0.01 };
  }

  // arena bounds — clamp by radius, stop cleanly (no bounce, no stuck)
  clampBounds(p) {
    const m = p.r + 4;
    if (p.x < m) { p.x = m; p.vx = 0; if (p.dash.active > 0) p.dash.dir.x = 0; }
    if (p.x > this.W - m) { p.x = this.W - m; p.vx = 0; if (p.dash.active > 0) p.dash.dir.x = 0; }
    if (p.y < m) { p.y = m; p.vy = 0; if (p.dash.active > 0) p.dash.dir.y = 0; }
    if (p.y > this.H - m) { p.y = this.H - m; p.vy = 0; if (p.dash.active > 0) p.dash.dir.y = 0; }
  }

  // mouse → game-world coords (accounts for canvas rect + CSS/internal scaling)
  onMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const sx = this.W / rect.width, sy = this.H / rect.height;
    const x = (e.clientX - rect.left) * sx;
    const y = (e.clientY - rect.top) * sy;
    this.mouse.x = x;
    this.mouse.y = y;
    this.mouse.active = x >= 0 && x <= this.W && y >= 0 && y <= this.H;
  }
  onMouseLeave() { this.mouse.active = false; }

  // ---------- lifecycle ----------
  reset() {
    const D = getDifficulty(this.difficulty);
    this.modMult = modBonus(this.modifiers);
    this.diffMult = D.diffMult * (this.modifiers.fasterProjectiles ? 1.25 : 1);
    this.scoreMult = D.scoreMult + this.modMult;
    this.waveGapBase = D.waveGap;
    this.dashCdMax = (D.dashCd || 8) * (this.modifiers.longDashCd ? 2 : 1);
    this.densityBonus = this.modifiers.denseWaves ? 2 : 0;
    const startHealth = Math.max(1, D.health - (this.modifiers.fragile ? 1 : 0));
    this.player = {
      x: this.W / 2, y: this.H / 2, vx: 0, vy: 0,
      r: PLAYER_RADIUS, rot: 0, health: startHealth, invuln: 0,
      dash: { cd: 0, active: 0 },
      shield: { cd: 0, active: 0, charges: 0 },
      slow: { cd: 0, active: 0 },
    };
    this.obstacles = new ObstacleManager(this);
    this.collectibles = [];
    this.particles = new ParticleSystem(this.touch ? 350 : 500);
    this.score = 0;
    this.energy = this.startEnergy;
    this.orbsCollected = 0;
    this.nearMisses = 0;
    this.combo = 0;
    this.comboTimer = 0;
    this.maxCombo = 0;
    this.time = 0;
    this.wave = 1;
    this.lastWaveTime = 0;
    this.waveSpawnTimer = 2.5;
    this.orbTimer = 2;
    this.shake = 0;
    this.slowmo = 0;
    this.damageTaken = 0;
    this.dashUsed = false;
    this._dashQueuedAt = 0;
    this.readyCountdown = this.tutorial ? 1 : 3.5;
    this.flashAlpha = 0;
    this.path = [];
    this._pathTimer = 0;
    this.lastDir = { x: 1, y: 0 };
    this.claimedMilestones = new Set();
    this.cleanWaveStreak = 0;
    this.damageSinceWave = false;
    this._milestoneAcc = 0;
    this.tutorialStep = 0;
    this.tutorialDist = 0;
    this.tutorialOrbSpawned = false;
    this.tutorialDoneTimer = 0;
    if (this.tutorial) this.unlocked.dash = true;
    // skill-challenge constraints: disable dash for "no dash" trials
    if (this.constraints.noDash) this.unlocked.dash = false;
    // Run Director state — wave themes, in-run objectives, event modifiers
    this.director = new RunDirector();
    this.waveTheme = null;
    this.waveBanner = null;
    this.bonusMult = 1;
    this.gravity = { active: 0, dir: 0 };
    this.objective = null;
    this.objectiveTimer = 6;
    this.objectivesCompleted = 0;
    this.eventsSurvived = 0;
    this.dashCount = 0;
    this.goldCollected = 0;
    this.comboKinds = new Set();
    this.initStars();
  }

  initStars() {
    this.stars = [];
    for (let i = 0; i < (this.touch ? 60 : 90); i++) {
      this.stars.push({
        x: rand(0, this.W), y: rand(0, this.H),
        z: rand(0.2, 1), s: rand(0.4, 1.6),
      });
    }
  }

  setSkin(id) { this.skinId = id; }
  setUnlocked(u) { this.unlocked = { ...this.unlocked, ...u }; }
  vibrate(pattern) { if (this.touch && typeof navigator !== "undefined" && navigator.vibrate) { try { navigator.vibrate(pattern); } catch {} } }

  start() {
    this.stop();
    this.reset();
    this.setState("ready");
    this.last = performance.now();
    this.loop(this.last);
  }

  restart() { this.start(); }

  pause() {
    if (this.state !== "playing") return;
    this.joy.active = false;
    this.joy.pointerId = null;
    this.setState("paused");
    this.audio && this.audio.startMusic && this.audio.startMusic("menu");
  }
  resume() {
    if (this.state !== "paused") return;
    this.setState("playing");
    this.last = performance.now();
    this.audio && this.audio.currentTrack !== "game" && this.audio.startMusic("game");
  }

  setState(s) {
    this.state = s;
    this.onState(s);
    if (s === "playing") this.audio && this.audio.startMusic("game");
    if (s === "gameover") this.audio && this.audio.startMusic("menu");
  }

  stop() {
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = null;
  }

  // ---------- abilities ----------
  activateDash() {
    const p = this.player;
    if (!this.unlocked.dash) return;
    if (p.dash.cd > 0 || p.dash.active > 0) {
      // clear feedback when dash is unavailable due to cooldown
      if (p.dash.cd > 0.3) this.audio && this.audio.beep && this.audio.beep(150, 0.04, "square", 0.08);
      return;
    }
    // direction: keyboard input first, else toward mouse, else last movement dir
    const inp = this.inputVector();
    let dir;
    if (inp.hasInput) {
      const m = Math.hypot(inp.ix, inp.iy) || 1;
      dir = { x: inp.ix / m, y: inp.iy / m };
    } else if (this.mouse.active) {
      const dx = this.mouse.x - p.x, dy = this.mouse.y - p.y;
      const d = Math.hypot(dx, dy);
      if (d > 5) dir = { x: dx / d, y: dy / d };
    }
    if (!dir) dir = this.lastDir || { x: 1, y: 0 };
    // locked dash burst — direction never changes mid-dash
    p.dash.dir = dir;
    p.dash.speed = 920;
    p.dash.active = 0.18;
    p.dash.cd = this.dashCdMax;
    p.invuln = Math.max(p.invuln, p.dash.active + 0.06); // immunity for exactly the dash
    this.dashCount++;
    this.dashUsed = true;
    this.audio && this.audio.dash();
    p.vx = dir.x * p.dash.speed;
    p.vy = dir.y * p.dash.speed;
    // immediate visual feedback at the exact same instant
    const skin = getSkin(this.skinId);
    this.particles.burst(p.x, p.y, 22, 380, skin.trail, 0.5, 4);
    this.shake = Math.max(this.shake, 0.18);
  }
  activateShield() {
    const p = this.player;
    if (!this.unlocked.shield || p.shield.cd > 0 || p.shield.active > 0) return;
    p.shield.active = 10;
    p.shield.charges = 1;
    p.shield.cd = 22;
    this.audio && this.audio.shield();
  }
  activateSlow() {
    const p = this.player;
    if (!this.unlocked.slow || p.slow.cd > 0 || p.slow.active > 0) return;
    p.slow.active = 4;
    p.slow.cd = 26;
    this.audio && this.audio.slow();
  }

  // ---------- main loop ----------
  loop(now) {
    this.raf = requestAnimationFrame((t) => this.loop(t));
    let dt = (now - this.last) / 1000;
    this.last = now;
    dt = Math.min(dt, 0.05); // clamp to avoid jumps
    if (this.state === "paused" || this.state === "gameover" || this.state === "idle") {
      this.render();
      return;
    }
    if (this.state === "ready") {
      this.readyCountdown -= dt;
      this.updatePlayer(dt, true);
      this.particles.update(dt);
      this.updateStars(dt);
      if (this.readyCountdown <= 0) {
        this.setState("playing");
        // fire a dash buffered during the countdown (only if pressed within the last 400ms)
        if (this._dashQueuedAt && performance.now() - this._dashQueuedAt < 400) {
          this.activateDash();
        }
        this._dashQueuedAt = 0;
      }
      this.render();
      this.pushHud(dt);
      return;
    }
    // playing
    const slowF = this.player.slow.active > 0 ? 0.4 : 1;
    this.update(dt, slowF);
    this.render();
    this.pushHud(dt);
  }

  pushHud(dt) {
    this._hudAcc += dt;
    if (this._hudAcc < 0.05) return;
    this._hudAcc = 0;
    const p = this.player;
    this.onHud({
      score: Math.floor(this.score),
      time: this.time,
      wave: this.wave,
      health: p.health,
      energy: this.energy,
      combo: this.combo,
      multiplier: multForCombo(this.combo),
      comboPct: clamp(this.comboTimer / COMBO_MAX_TIME, 0, 1),
      dashCd: p.dash.cd,
      dashActive: p.dash.active > 0,
      dashReady: this.unlocked.dash && p.dash.cd <= 0,
      dashMaxCd: this.dashCdMax,
      shieldCd: p.shield.cd,
      shieldActive: p.shield.active > 0,
      shieldReady: this.unlocked.shield && p.shield.cd <= 0 && p.shield.active <= 0,
      slowCd: p.slow.cd,
      slowActive: p.slow.active > 0,
      slowReady: this.unlocked.slow && p.slow.cd <= 0 && p.slow.active <= 0,
      unlocked: this.unlocked,
      ready: this.state === "ready" ? Math.ceil(this.readyCountdown) : 0,
      difficultyPct: clamp(this.time / 120, 0, 1),
      objective: this.objective ? { name: this.objective.name, progress: Math.min(this.objective.target, Math.max(0, this.objective.progress)), target: this.objective.target, kind: this.objective.kind } : null,
      bonusMult: this.bonusMult,
      gravity: this.gravity.active > 0,
      waveBanner: this.waveBanner ? this.waveBanner.name : null,
      modMult: this.scoreMult,
      modifiers: Object.keys(this.modifiers),
      tutorial: this.tutorial,
      tutorialStep: this.tutorial ? this.tutorialStep : null,
    });
  }

  update(dt, slowF) {
    if (this.tutorial) return this.tutorialUpdate(dt);
    this.time += dt;
    const p = this.player;

    // dynamic difficulty: gentle continuous ramp — no sudden spikes
    // difficulty: continuous ramp + a discrete +0.14 speed step every 30s of survival
    const diff = (1.12 + Math.floor(this.time / 30) * 0.14 + this.time * 0.004) * this.diffMult;

    // wave-batch spawner: each wave is a small, fair batch with a 20s lifetime.
    // waves can overlap; every obstacle carries its own 20s expiry (independent timers).
    this.waveSpawnTimer -= dt * slowF;
    if (this.waveSpawnTimer <= 0) {
      const theme = this.director.pickTheme(this.time);
      this.waveTheme = theme;
      this.score += 100 * this.scoreMult;
      this.audio && this.audio.wave();
      this.onEvent("wave", this.wave);
      this.waveBanner = { name: theme.name, color: theme.color, timer: 2.4 };
      if (theme.id !== "standard") this.eventsSurvived++;
      this.applyWaveTheme(theme, diff);
      // track consecutive clean waves (no damage since last wave)
      if (!this.damageSinceWave) this.cleanWaveStreak++;
      else this.cleanWaveStreak = 0;
      this.damageSinceWave = false;
      this.wave++;
      this.lastWaveTime = this.time;
      // gap between wave starts: generous early, shrinks slowly, floor 6s.
      let gap = Math.max(5, this.waveGapBase - this.time * 0.018);
      this.waveSpawnTimer = gap * (this.player.slow.active > 0 ? 1.3 : 1);
    }

    // Run Director: wave banner decay, gravity modifier, in-run objectives
    if (this.waveBanner) { this.waveBanner.timer -= dt; if (this.waveBanner.timer <= 0) this.waveBanner = null; }
    if (this.gravity.active > 0) { this.gravity.active -= dt; this.gravity.dir += dt * 0.5; }
    this.updateObjective(dt);

    // milestone checks (throttled) — emit onEvent for toast + Neon Credit reward
    this._milestoneAcc += dt;
    if (this._milestoneAcc >= 0.25) {
      this._milestoneAcc = 0;
      const ms = {
        orbsCollected: this.orbsCollected,
        nearMisses: this.nearMisses,
        time: this.time,
        cleanWaves: this.cleanWaveStreak,
      };
      for (const m of MILESTONES) {
        if (!this.claimedMilestones.has(m.id) && m.check(ms)) {
          this.claimedMilestones.add(m.id);
          this.onEvent("milestone", { id: m.id, name: m.name, desc: m.desc, reward: m.reward });
        }
      }
    }

    this.orbTimer -= dt;
    if (this.orbTimer <= 0 && this.collectibles.length < 6) {
      this.spawnOrb();
      this.orbTimer = rand(2.2, 3.6);
    }

    this.updatePlayer(dt, false);
    this.obstacles.update(dt * slowF);
    this.obstacles.checkCollisions();
    this.updateCollectibles(dt);
    this.particles.update(dt);

    // combo decay
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) { this.combo = 0; this.comboKinds.clear(); }
    }

    // timers
    p.dash.cd = Math.max(0, p.dash.cd - dt);
    p.dash.active = Math.max(0, p.dash.active - dt);
    p.shield.cd = Math.max(0, p.shield.cd - dt);
    p.shield.active = Math.max(0, p.shield.active - dt);
    p.slow.cd = Math.max(0, p.slow.cd - dt);
    p.slow.active = Math.max(0, p.slow.active - dt);
    p.invuln = Math.max(0, p.invuln - dt);

    // survival score
    this.score += dt * 12 * (1 + this.wave * 0.05) * this.scoreMult * this.bonusMult;

    this.shake = Math.max(0, this.shake - dt * 4);
    this.flashAlpha = Math.max(0, this.flashAlpha - dt * 2);
    this.slowmo = Math.max(0, this.slowmo - dt);

    this.updateStars(dt * (this.player.slow.active > 0 ? 0.4 : 1));

    // record normalized player path for run playback (10Hz)
    this._pathTimer += dt;
    if (this._pathTimer >= 0.1) {
      this._pathTimer -= 0.1;
      this.path.push(this.player.x / this.W, this.player.y / this.H);
    }

    if (p.health <= 0) this.endRun();
  }

  tutorialUpdate(dt) {
    this.time += dt;
    const p = this.player;
    this.updatePlayer(dt, false);
    this.particles.update(dt);
    this.updateStars(dt);

    // step 0: move your ship
    if (this.tutorialStep === 0) {
      this.tutorialDist += Math.hypot(p.vx, p.vy) * dt;
      if (this.tutorialDist > 140) this.tutorialStep = 1;
    }
    // step 1: collect the energy orb
    if (this.tutorialStep === 1 && !this.tutorialOrbSpawned) {
      this.collectibles.push(new Collectible(this.W * 0.72, this.H * 0.5, "cyan"));
      this.tutorialOrbSpawned = true;
    }
    this.updateCollectibles(dt);
    if (this.tutorialStep === 1 && this.tutorialOrbSpawned && this.collectibles.length === 0) {
      this.tutorialStep = 2;
    }
    // step 2: dash
    if (this.tutorialStep === 2 && (p.dash.active > 0 || this.dashUsed)) {
      this.tutorialStep = 3;
      this.tutorialDoneTimer = 0;
    }
    // step 3: ready for the arena
    if (this.tutorialStep === 3) {
      this.tutorialDoneTimer += dt;
      if (this.tutorialDoneTimer >= 2) {
        this.setState("gameover");
        this.onTutorialComplete();
        return;
      }
    }
    p.dash.cd = Math.max(0, p.dash.cd - dt);
    p.dash.active = Math.max(0, p.dash.active - dt);
    p.invuln = Math.max(0, p.invuln - dt);
  }

  updatePlayer(dt, ready) {
    const p = this.player;

    // ---- DASH: locked burst, overrides all other movement ----
    if (p.dash.active > 0) {
      p.vx = p.dash.dir.x * p.dash.speed;
      p.vy = p.dash.dir.y * p.dash.speed;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      this.clampBounds(p);
      p.rot = Math.atan2(p.dash.dir.y, p.dash.dir.x);
      const skin = getSkin(this.skinId);
      this.particles.emit(p.x, p.y, -p.vx * 0.05 + rand(-30, 30), -p.vy * 0.05 + rand(-30, 30), 0.3, rand(3, 5), skin.trail);
      return;
    }

    // ---- target velocity: keyboard takes priority over mouse ----
    const inp = this.inputVector();
    const maxSpeed = 360;
    let tx = 0, ty = 0;
    if (inp.hasInput) {
      tx = inp.ix * maxSpeed;
      ty = inp.iy * maxSpeed;
      const dm = Math.hypot(inp.ix, inp.iy) || 1;
      this.lastDir = { x: inp.ix / dm, y: inp.iy / dm };
    } else if (this.mouse.active && !this.touch) {
      const dx = this.mouse.x - p.x, dy = this.mouse.y - p.y;
      const d = Math.hypot(dx, dy);
      const dead = 14; // micro-deadzone stops jitter on top of the cursor
      if (d > dead) {
        const f = Math.min(1, (d - dead) / 70); // ease toward cursor, no overshoot
        tx = (dx / d) * maxSpeed * f;
        ty = (dy / d) * maxSpeed * f;
        this.lastDir = { x: dx / d, y: dy / d };
      }
    }

    // responsive, frame-rate-independent approach to target velocity
    const k = 1 - Math.exp(-22 * dt);
    p.vx += (tx - p.vx) * k;
    p.vy += (ty - p.vy) * k;
    // gravity shift event: mild, clearly-bounded drift the player can counter
    if (this.gravity.active > 0) {
      p.vx += Math.cos(this.gravity.dir) * 55 * dt;
      p.vy += Math.sin(this.gravity.dir) * 55 * dt;
    }

    p.x += p.vx * dt;
    p.y += p.vy * dt;
    this.clampBounds(p);

    // rotation toward velocity
    const sp = Math.hypot(p.vx, p.vy);
    if (sp > 20) {
      const target = Math.atan2(p.vy, p.vx);
      let dd = target - p.rot;
      while (dd > Math.PI) dd -= TAU;
      while (dd < -Math.PI) dd += TAU;
      p.rot += dd * Math.min(1, dt * 12);
    }

    // trail
    if (sp > 30) {
      const skin = getSkin(this.skinId);
      this.particles.emit(p.x - Math.cos(p.rot) * 10, p.y - Math.sin(p.rot) * 10,
        -p.vx * 0.1 + rand(-20, 20), -p.vy * 0.1 + rand(-20, 20),
        0.4, rand(2, 4), skin.trail);
    }
  }

  // ---------- obstacle collision callbacks (delegated to ObstacleManager) ----------
  onObstacleHit(o) {
    const p = this.player;
    if (p.invuln > 0 || p.dash.active > 0) return;
    if (p.shield.active > 0 && p.shield.charges > 0) {
      p.shield.charges = 0;
      p.shield.active = 0;
      p.invuln = 0.8;
      this.shake = 0.6;
      this.flashAlpha = 0.4;
      this.particles.burst(p.x, p.y, 24, 300, "#8B5CF6", 0.6, 4);
      this.audio && this.audio.shield();
      this.onEvent("shieldbreak");
      return;
    }
    this.damage(p, o);
  }

  onObstacleNearMiss(o) {
    this.registerNearMiss(o);
  }

  registerNearMiss(o) {
    this.nearMisses++;
    this.combo++;
    this.maxCombo = Math.max(this.maxCombo, this.combo);
    this.comboTimer = COMBO_MAX_TIME;
    const mult = multForCombo(this.combo);
    let pts = 25 * mult * this.scoreMult * this.bonusMult;
    // variety bonus: reward near-missing different attack types in one streak
    if (!this.comboKinds.has(o.kind)) { this.comboKinds.add(o.kind); pts += 10 * mult * this.scoreMult; }
    this.score += pts;
    // Elite enemies: bonus score + Neon Credit reward for threading the needle
    if (o.kind === "elite") {
      this.score += 60 * mult * this.scoreMult * this.bonusMult;
      this.onEvent("elite", { reward: 5 });
    }
    this.audio && this.audio.nearMiss();
    if (mult >= 2) this.audio && this.audio.combo(mult);
    const p = this.player;
    this.particles.burst(p.x, p.y, 8, 180, mult >= 5 ? "#FF2E93" : "#00F5FF", 0.4, 3);
    if (mult >= 5) { this.slowmo = 0.25; this.shake = 0.2; }
    this.onEvent("nearmiss", { combo: this.combo, mult });
  }

  damage(p, o) {
    p.health -= 1;
    p.invuln = 1.2;
    this.damageTaken++;
    // forgiving combo: a single hit halves the streak instead of erasing it
    this.combo = Math.floor(this.combo / 2);
    this.comboTimer = this.combo > 0 ? 1.5 : 0;
    if (this.combo === 0) this.comboKinds.clear();
    this.damageSinceWave = true;
    // dramatic impact: heavy shake, near-full red flash, brief slow-mo
    this.shake = 2.4;
    this.flashAlpha = 0.95;
    this.slowmo = Math.max(this.slowmo, 0.5);
    this.audio && this.audio.hit();
    this.vibrate(140);
    // heavy impact: dual shockwave rings + large burst + white spark flash
    this.particles.burst(p.x, p.y, 44, 380, "#FF3B5C", 0.8, 5);
    this.particles.ring(p.x, p.y, 30, 460, "#FF2E93", 0.5, 3.5);
    this.particles.ring(p.x, p.y, 18, 240, "#FFFFFF", 0.35, 3);
    this.particles.burst(p.x, p.y, 18, 200, "#FFFFFF", 0.4, 3);
    // knockback
    const ang = Math.atan2(p.y - (o.y || p.y), p.x - (o.x || p.x));
    p.vx += Math.cos(ang) * 420;
    p.vy += Math.sin(ang) * 420;
    this.onEvent("hit");
  }

  // ---------- collectibles ----------
  spawnOrb() {
    let x, y, tries = 0;
    do {
      x = rand(60, this.W - 60);
      y = rand(60, this.H - 60);
      tries++;
    } while (dist(x, y, this.player.x, this.player.y) < 90 && tries < 8);
    const r = Math.random();
    const kind = r < 0.7 ? "cyan" : r < 0.93 ? "purple" : "gold";
    this.collectibles.push(new Collectible(x, y, kind));
  }

  spawnGoldOrb() {
    let x, y, tries = 0;
    do {
      x = rand(60, this.W - 60);
      y = rand(60, this.H - 60);
      tries++;
    } while (dist(x, y, this.player.x, this.player.y) < 90 && tries < 8);
    const c = new Collectible(x, y, "gold");
    c.life = 16;
    this.collectibles.push(c);
  }

  // ---------- Run Director: wave themes + in-run objectives ----------
  applyWaveTheme(theme, diff) {
    const om = this.obstacles;
    this.bonusMult = 1;
    switch (theme.id) {
      case "energy_storm":
        om.spawnWave(diff, this.wave, 1);
        for (let i = 0; i < 5; i++) this.spawnOrb();
        break;
      case "laser_carnage": {
        om.spawnWave(diff, this.wave, 1);
        const lasers = om.list.filter((o) => o.kind === "laser" && !o.dead).length;
        om.spawnKind("laser", om.tierFor(), diff);
        if (this.time > 80 && lasers < 1) om.spawnKind("laser", om.tierFor(), diff);
        break;
      }
      case "hunter_wave": {
        om.spawnWave(diff, this.wave, 1);
        om.spawnKind("homing", om.tierFor(), diff);
        const homing = om.list.filter((o) => o.kind === "homing" && !o.dead).length;
        if (this.time > 60 && homing < 2) om.spawnKind("homing", om.tierFor(), diff);
        break;
      }
      case "bonus_round":
        om.spawnWave(diff, this.wave, 1);
        for (let i = 0; i < 3; i++) this.spawnGoldOrb();
        this.bonusMult = 2;
        break;
      case "gravity_shift":
        om.spawnWave(diff, this.wave, 2);
        this.startGravity();
        break;
      case "gauntlet":
        om.spawnWave(diff, this.wave, 3);
        om.spawnKind("homing", om.tierFor(), diff);
        if (this.time > 100) om.spawnKind("laser", om.tierFor(), diff);
        this.bonusMult = 1.5;
        break;
      default:
        om.spawnWave(diff, this.wave, Math.min(3, 1 + Math.floor(this.time / 50)));
    }
  }

  startGravity() {
    this.gravity.active = 12;
    this.gravity.dir = Math.random() * TAU;
  }

  updateObjective(dt) {
    const o = this.objective;
    if (!o) {
      this.objectiveTimer -= dt;
      if (this.objectiveTimer <= 0 && this.time > 8) this.pickObjective();
      return;
    }
    o.timer -= dt;
    if (o.kind === "orbs") o.progress = this.orbsCollected - o.startOrbs;
    else if (o.kind === "nearmiss") o.progress = this.nearMisses - o.startNear;
    else if (o.kind === "gold") o.progress = (this.goldCollected || 0) - o.startGold;
    else if (o.kind === "combo") o.progress = this.maxCombo - o.startCombo;
    else if (o.kind === "clean") {
      if (this.damageTaken > o.startDamage) { this.objective = null; this.objectiveTimer = 8; return; }
      o.progress = this.time - o.startTime;
    } else if (o.kind === "nodash") {
      if (this.dashCount - o.startDash > 1) { this.objective = null; this.objectiveTimer = 8; return; }
      o.progress = this.time - o.startTime;
    }
    if (o.progress >= o.target) {
      this.score += o.reward * this.scoreMult;
      this.objectivesCompleted++;
      this.audio && this.audio.achievement();
      this.particles.burst(this.player.x, this.player.y, 22, 280, "#FFD166", 0.6, 3.5);
      this.onEvent("objective", { name: o.name, reward: o.reward });
      this.objective = null;
      this.objectiveTimer = 10;
      return;
    }
    if (o.timer <= 0) { this.objective = null; this.objectiveTimer = 10; }
  }

  pickObjective() {
    const def = this.director.pickObjective();
    const o = { ...def, progress: 0, timer: def.time };
    o.startOrbs = this.orbsCollected;
    o.startNear = this.nearMisses;
    o.startGold = this.goldCollected || 0;
    o.startCombo = this.maxCombo;
    o.startDamage = this.damageTaken;
    o.startDash = this.dashCount;
    o.startTime = this.time;
    this.objective = o;
  }

  updateCollectibles(dt) {
    const p = this.player;
    for (const c of this.collectibles) {
      c.phase += dt * 3;
      c.life -= dt;
      if (dist(p.x, p.y, c.x, c.y) < p.r + c.r + 4) {
        this.collectOrb(c);
      }
      if (c.life <= 0) c.dead = true;
    }
    this.collectibles = this.collectibles.filter((c) => !c.dead);
  }

  collectOrb(c) {
    c.dead = true;
    this.orbsCollected++;
    const mult = multForCombo(this.combo);
    let pts, en, color;
    if (c.kind === "gold") { pts = 300; en = 8; color = "#FFD166"; this.goldCollected++; this.audio && this.audio.collectGold(); }
    else if (c.kind === "purple") { pts = 120; en = 3; color = "#8B5CF6"; this.audio && this.audio.collect(); }
    else { pts = 50; en = 1; color = "#00F5FF"; this.audio && this.audio.collect(); }
    this.vibrate(c.kind === "gold" ? 60 : 25);
    this.score += pts * mult * this.scoreMult * this.bonusMult;
    this.energy += en;
    // tactile pickup pop: burst + shockwave ring + white sparkle
    this.particles.burst(c.x, c.y, 22, 260, color, 0.6, 3.5);
    this.particles.ring(c.x, c.y, 18, 300, color, 0.4, 2.5);
    this.particles.burst(c.x, c.y, 8, 140, "#FFFFFF", 0.3, 2.5);
    if (c.kind === "gold") {
      this.shake = Math.max(this.shake, 0.25);
      this.particles.ring(c.x, c.y, 14, 360, "#FFD166", 0.5, 3);
    }
    this.onEvent("collect", { kind: c.kind, energy: en });
  }

  // ---------- stars ----------
  updateStars(dt) {
    for (const s of this.stars) {
      s.y += s.z * 30 * dt;
      if (s.y > this.H) { s.y = 0; s.x = rand(0, this.W); }
    }
  }

  // ---------- end ----------
  endRun() {
    this.setState("gameover");
    this.audio && this.audio.gameOver();
    // downsample recorded path to <= 200 points for playback storage
    let path = this.path || [];
    const numPoints = path.length / 2;
    if (numPoints > 200) {
      const stride = Math.ceil(numPoints / 200);
      const ds = [];
      for (let i = 0; i < path.length; i += stride * 2) ds.push(path[i], path[i + 1]);
      path = ds;
    }
    const summary = {
      score: Math.floor(this.score),
      time: Math.floor(this.time),
      wave: this.wave,
      energy: this.energy,
      orbsCollected: this.orbsCollected,
      nearMisses: this.nearMisses,
      maxCombo: this.maxCombo,
      damageTaken: this.damageTaken,
      dashUsed: this.dashUsed,
      difficulty: this.difficulty,
      objectivesCompleted: this.objectivesCompleted,
      eventsSurvived: this.eventsSurvived,
      cleanWaves: this.cleanWaveStreak,
      path,
    };
    this.onGameOver(summary);
  }

  // ---------- render ----------
  render() {
    const ctx = this.ctx;
    const W = this.W, H = this.H;
    ctx.save();
    // shake
    if (this.shake > 0) {
      ctx.translate(rand(-this.shake * 8, this.shake * 8), rand(-this.shake * 8, this.shake * 8));
    }
    // bg
    ctx.fillStyle = "#05060D";
    ctx.fillRect(0, 0, W, H);

    // stars
    ctx.globalCompositeOperation = "lighter";
    for (const s of this.stars) {
      ctx.globalAlpha = 0.3 + s.z * 0.5;
      ctx.fillStyle = "#7DD3FC";
      ctx.fillRect(s.x, s.y, s.s, s.s);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";

    // grid
    this.drawGrid(ctx);

    // arena border
    ctx.strokeStyle = "rgba(0,245,255,0.5)";
    ctx.lineWidth = 2;
    ctx.shadowColor = "#00F5FF";
    ctx.shadowBlur = 12;
    ctx.strokeRect(6, 6, W - 12, H - 12);
    ctx.shadowBlur = 0;

    // ghost trail (player's best run path) for practice
    this.drawGhost(ctx);

    // slow-time distortion tint
    if (this.player.slow.active > 0) {
      ctx.fillStyle = "rgba(139,92,246,0.08)";
      ctx.fillRect(0, 0, W, H);
    }
    // gravity shift event tint
    if (this.gravity.active > 0) {
      ctx.fillStyle = "rgba(34,211,238,0.06)";
      ctx.fillRect(0, 0, W, H);
    }

    // collectibles
    ctx.globalCompositeOperation = "lighter";
    for (const c of this.collectibles) this.drawOrb(ctx, c);
    ctx.globalCompositeOperation = "source-over";

    // obstacles
    this.obstacles.render(ctx);

    // particles
    ctx.globalCompositeOperation = "lighter";
    this.particles.draw(ctx);
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;

    // player
    this.drawPlayer(ctx);

    // dynamic floating joystick — only visible while the player holds the screen
    if (this.joy.active) this.drawJoystick(ctx);

    // flash
    if (this.flashAlpha > 0) {
      ctx.fillStyle = `rgba(255,59,92,${this.flashAlpha})`;
      ctx.fillRect(0, 0, W, H);
    }

    // ready countdown
    if (this.state === "ready") {
      ctx.fillStyle = "rgba(5,6,13,0.55)";
      ctx.fillRect(0, 0, W, H);
      const n = Math.ceil(this.readyCountdown);
      const txt = n > 0 ? String(n) : "GO";
      ctx.fillStyle = n > 0 ? "#00F5FF" : "#FF2E93";
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 30;
      ctx.font = "bold 96px Orbitron, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(txt, W / 2, H / 2);
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#94A3B8";
      ctx.font = "16px Rajdhani, sans-serif";
      ctx.fillText(this.touch ? "DRAG LEFT TO MOVE   •   DASH BUTTON →" : "MOVE: WASD / DRAG   •   DASH: SPACE / BUTTON", W / 2, H / 2 + 80);
    }

    // wave theme banner (Run Director)
    if (this.waveBanner && this.state === "playing") {
      const a = clamp(this.waveBanner.timer / 0.6, 0, 1);
      ctx.globalAlpha = a;
      ctx.fillStyle = this.waveBanner.color;
      ctx.shadowColor = this.waveBanner.color; ctx.shadowBlur = 20;
      ctx.font = "bold 24px Orbitron, sans-serif";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(this.waveBanner.name, W / 2, 60);
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    }

    ctx.restore();
  }

  drawGrid(ctx) {
    const W = this.W, H = this.H;
    const step = 50;
    const off = (this.time * 18) % step;
    ctx.strokeStyle = "rgba(0,245,255,0.06)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = -off; x < W; x += step) { ctx.moveTo(x, 0); ctx.lineTo(x, H); }
    for (let y = -off; y < H; y += step) { ctx.moveTo(0, y); ctx.lineTo(W, y); }
    ctx.stroke();
  }

  drawGhost(ctx) {
    const p = this.ghostPath;
    if (!p || p.length < 4) return;
    const n = Math.floor(p.length / 2);
    ctx.save();
    // full path — semi-transparent trail to follow
    ctx.globalAlpha = 0.18;
    ctx.strokeStyle = "#00F5FF";
    ctx.lineWidth = 2;
    ctx.shadowColor = "#00F5FF";
    ctx.shadowBlur = 8;
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const x = p[i * 2] * this.W, y = p[i * 2 + 1] * this.H;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;
    // moving ghost marker — a faint ship outline synced to run time
    const idx = Math.min(n - 2, Math.max(0, Math.floor(this.time / 0.1)));
    const gx = p[idx * 2] * this.W, gy = p[idx * 2 + 1] * this.H;
    const nx = p[(idx + 1) * 2] * this.W, ny = p[(idx + 1) * 2 + 1] * this.H;
    const gang = Math.atan2(ny - gy, nx - gx);
    ctx.globalAlpha = 0.5;
    ctx.save();
    ctx.translate(gx, gy);
    ctx.rotate(gang);
    ctx.strokeStyle = "#00F5FF";
    ctx.fillStyle = "rgba(0,245,255,0.12)";
    ctx.lineWidth = 1.5;
    ctx.shadowColor = "#00F5FF";
    ctx.shadowBlur = 10;
    const gr = PLAYER_RADIUS;
    ctx.beginPath();
    ctx.moveTo(gr + 4, 0);
    ctx.lineTo(-gr, -gr * 0.8);
    ctx.lineTo(-gr * 0.5, 0);
    ctx.lineTo(-gr, gr * 0.8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.restore();
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  drawOrb(ctx, c) {
    const colors = { cyan: "#00F5FF", purple: "#8B5CF6", gold: "#FFD166" };
    const col = colors[c.kind];
    const pulse = 1 + Math.sin(c.phase) * 0.18;
    const r = c.r * pulse;
    ctx.globalAlpha = clamp(c.life > 2 ? 1 : c.life / 2, 0, 1);
    ctx.shadowColor = col;
    ctx.shadowBlur = 16;
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(c.x, c.y, r, 0, TAU);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.beginPath();
    ctx.arc(c.x, c.y, r * 0.4, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  drawPlayer(ctx) {
    const p = this.player;
    const skin = getSkin(this.skinId);
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);

    // shield ring
    if (p.shield.active > 0) {
      ctx.strokeStyle = `rgba(139,92,246,${0.6 + Math.sin(this.time * 8) * 0.3})`;
      ctx.lineWidth = 3;
      ctx.shadowColor = "#8B5CF6"; ctx.shadowBlur = 16;
      ctx.beginPath(); ctx.arc(0, 0, p.r + 10, 0, TAU); ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // hit glow pulse — pulsing red ring during invulnerability after a collision
    if (p.invuln > 0 && p.shield.active <= 0) {
      const pulse = 0.5 + Math.sin(this.time * 14) * 0.3;
      ctx.strokeStyle = `rgba(255,59,92,${pulse})`;
      ctx.lineWidth = 3;
      ctx.shadowColor = "#FF3B5C"; ctx.shadowBlur = 20 + pulse * 12;
      ctx.beginPath(); ctx.arc(0, 0, p.r + 8 + pulse * 4, 0, TAU); ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // dash trail glow
    if (p.dash.active > 0) {
      ctx.shadowColor = skin.glow; ctx.shadowBlur = 24;
    }

    // ship body (arrow) — drawn at a larger visual scale; collision stays at p.r
    const dr = p.r * 1.3;
    const blink = p.invuln > 0 && Math.floor(this.time * 20) % 2 === 0;
    ctx.globalAlpha = blink ? 0.4 : 1;
    ctx.strokeStyle = skin.color;
    ctx.lineWidth = 2.5;
    ctx.shadowColor = skin.glow;
    ctx.shadowBlur = 18;
    ctx.fillStyle = "rgba(5,6,13,0.85)";
    ctx.beginPath();
    ctx.moveTo(dr + 4, 0);
    ctx.lineTo(-dr, -dr * 0.8);
    ctx.lineTo(-dr * 0.5, 0);
    ctx.lineTo(-dr, dr * 0.8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;

    // core
    ctx.fillStyle = skin.core;
    ctx.shadowColor = skin.core; ctx.shadowBlur = 14;
    ctx.beginPath(); ctx.arc(0, 0, 6, 0, TAU); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  drawJoystick(ctx) {
    if (!this.joy.active) return;
    const { bx, by } = this.joy;
    const r = this.joyRadius;
    // outer ring — translucent neon so obstacles stay visible underneath
    ctx.strokeStyle = "rgba(0,245,255,0.65)";
    ctx.lineWidth = 2;
    ctx.shadowColor = "#00F5FF"; ctx.shadowBlur = 14;
    ctx.beginPath(); ctx.arc(bx, by, r, 0, TAU); ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(0,245,255,0.06)";
    ctx.beginPath(); ctx.arc(bx, by, r, 0, TAU); ctx.fill();
    // inner knob — follows the finger, clamped within the outer circle
    const dx = this.joy.x - bx, dy = this.joy.y - by;
    const mag = Math.min(r, Math.hypot(dx, dy));
    const ang = Math.atan2(dy, dx);
    const kx = bx + Math.cos(ang) * mag;
    const ky = by + Math.sin(ang) * mag;
    ctx.fillStyle = "rgba(0,245,255,0.85)";
    ctx.shadowColor = "#00F5FF"; ctx.shadowBlur = 20;
    ctx.beginPath(); ctx.arc(kx, ky, 28, 0, TAU); ctx.fill();
    ctx.shadowBlur = 0;
  }
}