// NEON RUSH — ObstacleManager: 9 obstacle archetypes, 4 difficulty tiers,
// per-obstacle lifetimes, readable warnings, fair spawning, and performance caps.
const TAU = Math.PI * 2;
const rand = (a, b) => a + Math.random() * (b - a);
const randInt = (a, b) => Math.floor(rand(a, b + 1));
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const dist = (x1, y1, x2, y2) => Math.hypot(x1 - x2, y1 - y2);
const pick = (arr) => arr[randInt(0, arr.length - 1)];

const NEAR_MISS = 30;
export const MAX_OBSTACLES = 24;

// distance from point to an infinite line through (px,py) at angle ang
function lineDist(px, py, lx, ly, ang) {
  return Math.abs((py - ly) * Math.cos(ang) - (px - lx) * Math.sin(ang));
}
// distance from point to segment
function segDist(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1;
  const len2 = dx * dx + dy * dy || 1;
  let t = ((px - x1) * dx + (py - y1) * dy) / len2;
  t = clamp(t, 0, 1);
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

// regular polygon path (sides vertices at radius r, first vertex at angle rot)
function polyPath(ctx, cx, cy, r, sides, rot) {
  ctx.beginPath();
  for (let i = 0; i < sides; i++) {
    const a = rot + (i / sides) * TAU;
    const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
}
// star/spike path (points outer spikes, inner valleys)
function starPath(ctx, cx, cy, rOut, rIn, points, rot) {
  ctx.beginPath();
  const n = points * 2;
  for (let i = 0; i < n; i++) {
    const r = i % 2 === 0 ? rOut : rIn;
    const a = rot + (i / n) * TAU;
    const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

export class ObstacleManager {
  constructor(host) {
    this.host = host;
    this.list = [];
    this.recent = []; // recent kinds, for variety
  }

  get W() { return this.host.W; }
  get H() { return this.host.H; }
  get player() { return this.host.player; }
  get particles() { return this.host.particles; }
  get audio() { return this.host.audio; }
  get time() { return this.host.time; }
  get wave() { return this.host.wave; }
  get count() { return this.list.length; }

  clear() { this.list.length = 0; this.recent.length = 0; }

  // ---------- difficulty ----------
  tierFor() {
    const t = this.time;
    const r = Math.random();
    if (t < 35) return "easy";
    if (t < 80) return r < 0.72 ? "easy" : "medium";
    if (t < 140) return r < 0.5 ? "easy" : "medium";
    if (t < 200) return r < 0.6 ? "medium" : "hard";
    return r < 0.4 ? "medium" : "hard";
  }
  isExtreme() { return this.time > 150; }

  availableKinds() {
    const t = this.time;
    const k = ["path"];
    if (t >= 15) k.push("homing");
    if (t >= 30) k.push("rotator", "barrier");
    if (t >= 50) k.push("dashing", "mine");
    if (t >= 75) k.push("laser");
    if (t >= 100) k.push("teleporter", "split");
    if (t >= 55) k.push("elite");
    return k;
  }

  // ---------- spawn ----------
  spawn(diff) {
    if (this.list.length >= MAX_OBSTACLES) return;
    let kinds = this.availableKinds();
    // avoid lasers if one is already warning/active (max 2)
    const lasersActive = this.list.filter((o) => o.kind === "laser" && !o.dead).length;
    if (lasersActive >= 2) kinds = kinds.filter((k) => k !== "laser");
    const elitesActive = this.list.filter((o) => o.kind === "elite" && !o.dead).length;
    if (elitesActive >= 2) kinds = kinds.filter((k) => k !== "elite");
    // variety: prefer kinds not in the last 3 spawns
    const fresh = kinds.filter((k) => !this.recent.includes(k));
    const pool = fresh.length ? fresh : kinds;
    const kind = pick(pool);
    const tier = this.tierFor();
    this.spawnKind(kind, tier, diff);
    this.recent.push(kind);
    if (this.recent.length > 3) this.recent.shift();

    // extreme: occasionally combine a second, different threat
    if (this.isExtreme() && Math.random() < 0.32 && this.list.length < MAX_OBSTACLES - 1) {
      const others = kinds.filter((k) => k !== kind);
      if (others.length) {
        const k2 = pick(others);
        this.spawnKind(k2, this.tierFor(), diff);
        this.recent.push(k2);
        if (this.recent.length > 3) this.recent.shift();
      }
    }
  }

  // spawn a fair wave batch: at most one spicy (hard/med) threat, rest easy.
  // guarantees gaps between attacks and avoids unavoidable multi-threat combos.
  spawnWave(diff, waveNum, batchSize) {
    if (this.list.length >= MAX_OBSTACLES) return;
    const avail = this.availableKinds();
    const easy = avail.filter((k) => k === "path" || k === "teleporter" || k === "split" || k === "barrier");
    const med = avail.filter((k) => k === "homing" || k === "rotator");
    const hard = avail.filter((k) => k === "dashing" || k === "laser" || k === "mine" || k === "elite");
    const chosen = [];
    // at most one spicy threat per wave batch
    if (hard.length && waveNum >= 4 && Math.random() < 0.5) chosen.push(pick(hard));
    else if (med.length && waveNum >= 2 && Math.random() < 0.55) chosen.push(pick(med));
    // fill remaining slots with easy kinds only (density modifier adds extra threats)
    const total = batchSize + (this.host.densityBonus || 0);
    while (chosen.length < total && easy.length) {
      const pool = easy.filter((k) => !chosen.includes(k));
      chosen.push(pick(pool.length ? pool : easy));
    }
    for (const kind of chosen) {
      if (this.list.length >= MAX_OBSTACLES) break;
      this.recent.push(kind);
      if (this.recent.length > 3) this.recent.shift();
      this.spawnKind(kind, this.tierFor(), diff);
    }
  }

  edgeSpawn(m = 44) {
    const e = randInt(0, 3);
    if (e === 0) return { x: rand(0, this.W), y: -m };
    if (e === 1) return { x: rand(0, this.W), y: this.H + m };
    if (e === 2) return { x: -m, y: rand(0, this.H) };
    return { x: this.W + m, y: rand(0, this.H) };
  }
  interiorSpawn(minD = 150) {
    let x, y, i = 0;
    do {
      x = rand(70, this.W - 70);
      y = rand(70, this.H - 70);
      i++;
    } while (dist(x, y, this.player.x, this.player.y) < minD && i < 10);
    return { x, y };
  }

  base() {
    return {
      age: 0, life: 10, dead: false, dangerous: true, nearMissed: false,
      vx: 0, vy: 0, r: 12, cR: 12, color: "#00F5FF", glow: "#00F5FF",
      waveExpire: this.time + 20, // hard 20s lifetime cap — every wave disappears after 20s
    };
  }

  spawnKind(kind, tier, diff) {
    const o = this.base();
    o.kind = kind;
    o.tier = tier;
    const D = diff; // global speed scalar
    if (kind === "homing") this.initHoming(o, tier, D);
    else if (kind === "path") this.initPath(o, tier, D);
    else if (kind === "dashing") this.initDashing(o, tier, D);
    else if (kind === "laser") this.initLaser(o, tier, D);
    else if (kind === "rotator") this.initRotator(o, tier, D);
    else if (kind === "mine") this.initMine(o, tier, D);
    else if (kind === "teleporter") this.initTeleporter(o, tier, D);
    else if (kind === "split") this.initSplit(o, tier, D);
    else if (kind === "barrier") this.initBarrier(o, tier, D);
    else if (kind === "elite") this.initElite(o, tier, D);
    this.list.push(o);
  }

  initHoming(o, tier, D) {
    const s = this.edgeSpawn();
    o.x = s.x; o.y = s.y;
    const t = {
      easy: { r: 16, speed: 52, turn: 0.9, lead: 0 },
      medium: { r: 14, speed: 82, turn: 1.6, lead: 0 },
      hard: { r: 12, speed: 118, turn: 2.4, lead: 0.2 },
    }[tier];
    o.r = t.r; o.cR = o.r * 0.78; o.speed = t.speed * Math.min(2.2, D); o.turn = t.turn; o.lead = t.lead;
    o.life = 15; o.maxLife = 15; o.color = "#FF2E93"; o.glow = "#FF2E93";
  }
  initPath(o, tier, D) {
    const patterns = {
      easy: ["horizontal", "vertical", "diagonal", "sine"],
      medium: ["horizontal", "diagonal", "sine", "zigzag", "circular"],
      hard: ["sine", "zigzag", "circular", "figure8", "random"],
    }[tier];
    o.pattern = pick(patterns);
    o.tier = tier;
    const speed = { easy: 72, medium: 102, hard: 138 }[tier] * Math.min(2.0, D);
    o.r = tier === "hard" ? 11 : 13; o.cR = o.r * 0.9;
    o.color = "#38BDF8"; o.glow = "#0EA5E9";
    o.life = { easy: 13, medium: 15, hard: 17 }[tier] + rand(0, 2);
    o.amp = rand(40, 90); o.freq = rand(1.6, 3.2); o.phase = rand(0, TAU);
    if (["circular", "figure8"].includes(o.pattern)) {
      const c = this.interiorSpawn(160);
      o.cx = c.x; o.cy = c.y; o.R = rand(60, Math.min(120, Math.min(this.W, this.H) * 0.18));
      o.x = c.x; o.y = c.y;
    } else {
      const s = this.edgeSpawn();
      o.x = s.x; o.y = s.y;
      const ang = Math.atan2(this.H / 2 - s.y, this.W / 2 - s.x) + rand(-0.5, 0.5);
      o.vx = Math.cos(ang) * speed; o.vy = Math.sin(ang) * speed;
      o.baseY = clamp(s.y, 60, this.H - 60); o.baseX = clamp(s.x, 60, this.W - 60);
    }
    o.dirChange = rand(0.6, 1.4); o.dirTimer = o.dirChange;
  }
  initDashing(o, tier, D) {
    const s = this.edgeSpawn();
    o.x = s.x; o.y = s.y;
    const t = {
      easy: { r: 14, slow: 38, warn: 1.5, dash: 330, dashDur: 0.45, cycle: 3.6 },
      medium: { r: 13, slow: 52, warn: 1.2, dash: 430, dashDur: 0.4, cycle: 3.0 },
      hard: { r: 12, slow: 65, warn: 0.9, dash: 540, dashDur: 0.35, cycle: 2.6 },
    }[tier];
    o.r = t.r; o.cR = o.r * 0.78; o.slowSpeed = t.slow; o.warnTime = t.warn; o.dashSpeed = t.dash * Math.min(1.9, D);
    o.dashDur = t.dashDur; o.cycle = t.cycle; o.cycleTimer = rand(t.cycle * 0.5, t.cycle);
    o.phase = "track"; o.life = { easy: 12, medium: 13, hard: 14 }[tier] + rand(0, 2);
    o.color = "#FF4D6D"; o.glow = "#FF2E93";
  }
  initLaser(o, tier, D) {
    const t = {
      easy: { warn: 1.7, active: 0.75, thick: 12, angles: [0, Math.PI / 2], n: 1 },
      medium: { warn: 1.3, active: 0.7, thick: 16, angles: [0, Math.PI / 2, Math.PI / 4, -Math.PI / 4], n: 1 },
      hard: { warn: 1.0, active: 0.65, thick: 14, angles: null, n: 1 },
    }[tier];
    const c = this.interiorSpawn(150);
    o.px = c.x; o.py = c.y; o.x = c.x; o.y = c.y;
    o.ang = t.angles ? pick(t.angles) : rand(0, Math.PI);
    o.warn = t.warn; o.active = 0; o.activeTime = t.active; o.thick = t.thick;
    o.life = o.warn + o.activeTime; o.dangerous = false;
    o.color = tier === "hard" ? "#A855F7" : "#FF3B5C"; o.glow = o.color;
    o.count = t.n;
  }
  initRotator(o, tier, D) {
    const c = this.interiorSpawn(170);
    o.cx = c.x; o.cy = c.y; o.x = c.x; o.y = c.y;
    const t = {
      easy: { R: 88, thick: 11, N: 3, spin: 0.7, fill: 0.45, move: 0, osc: 0 },
      medium: { R: 108, thick: 10, N: 3, spin: 1.3, fill: 0.5, move: 24, osc: 0 },
      hard: { R: 128, thick: 9, N: 4, spin: 1.9, fill: 0.58, move: 44, osc: 20 },
    }[tier];
    o.R = t.R; o.thick = t.thick; o.N = t.N; o.spin = t.spin * (Math.random() < 0.5 ? 1 : -1);
    o.fill = t.fill; o.moveSpeed = t.move; o.osc = t.osc; o.baseR = t.R;
    o.ang = rand(0, TAU); o.life = { easy: 11, medium: 12, hard: 13 }[tier] + rand(0, 2);
    o.color = "#A855F7"; o.glow = "#7C3AED";
    if (t.move) { const a = rand(0, TAU); o.vx = Math.cos(a) * t.move; o.vy = Math.sin(a) * t.move; }
  }
  initMine(o, tier, D) {
    const c = this.interiorSpawn(170);
    o.x = c.x; o.y = c.y;
    const t = {
      easy: { r: 12, trig: 80, blast: 60, fuse: 1.8, drift: 10 },
      medium: { r: 11, trig: 90, blast: 70, fuse: 1.4, drift: 16 },
      hard: { r: 10, trig: 100, blast: 82, fuse: 1.1, drift: 22 },
    }[tier];
    o.r = t.r; o.cR = o.r * 0.72; o.trigR = t.trig; o.blastR = t.blast; o.fuse = t.fuse;
    o.life = 10; o.phase = "idle"; o.fuseTimer = 0; o.blastT = 0;
    o.color = "#FB923C"; o.glow = "#F97316";
    const a = rand(0, TAU); o.vx = Math.cos(a) * t.drift; o.vy = Math.sin(a) * t.drift;
  }
  initTeleporter(o, tier, D) {
    const c = this.interiorSpawn(150);
    o.x = c.x; o.y = c.y;
    const t = {
      easy: { r: 13, vis: 3.5, flash: 0.9, speed: 48 },
      medium: { r: 12, vis: 3.0, flash: 0.7, speed: 72 },
      hard: { r: 11, vis: 2.5, flash: 0.55, speed: 98 },
    }[tier];
    o.r = t.r; o.cR = o.r * 0.88; o.visTime = t.vis; o.flashTime = t.flash; o.speed = t.speed * Math.min(2.0, D);
    o.life = { easy: 14, medium: 17, hard: 20 }[tier] + rand(0, 2);
    o.phase = "visible"; o.phaseTimer = o.visTime;
    const a = rand(0, TAU); o.vx = Math.cos(a) * o.speed; o.vy = Math.sin(a) * o.speed;
    o.color = "#E0F2FE"; o.glow = "#22D3EE";
  }
  initSplit(o, tier, D) {
    const s = this.edgeSpawn();
    o.x = s.x; o.y = s.y;
    o.gen = 0;
    const a = Math.atan2(this.H / 2 - s.y, this.W / 2 - s.x) + rand(-0.6, 0.6);
    o.speed = 42 * Math.min(2.0, D);
    o.vx = Math.cos(a) * o.speed; o.vy = Math.sin(a) * o.speed;
    o.splitTime = tier === "hard" ? 3.5 : tier === "medium" ? 4.5 : 5.5;
    o.life = o.splitTime; o.r = 22; o.cR = o.r * 0.88;
    o.color = "#F472B6"; o.glow = "#EC4899";
  }
  initBarrier(o, tier, D) {
    const t = {
      easy: { thick: 16, gap: 175, speed: 72, life: 9, moveGap: false },
      medium: { thick: 18, gap: 145, speed: 100, life: 10, moveGap: true },
      hard: { thick: 20, gap: 120, speed: 132, life: 11, moveGap: true },
    }[tier];
    o.vertical = Math.random() < 0.5;
    o.thick = t.thick; o.gap = t.gap; o.gapSpeed = t.speed * Math.min(2.0, D);
    o.moveGap = t.moveGap; o.gapDir = Math.random() < 0.5 ? 1 : -1;
    o.life = t.life + rand(0, 2);
    if (o.vertical) {
      o.x = -60; o.y = 0;
      o.gapCenter = rand(this.H * 0.3, this.H * 0.7);
    } else {
      o.x = 0; o.y = -60;
      o.gapCenter = rand(this.W * 0.3, this.W * 0.7);
    }
    o.color = "#00F5FF"; o.glow = "#22D3EE";
  }

  initElite(o, tier, D) {
    const s = this.edgeSpawn(60);
    o.x = s.x; o.y = s.y;
    o.r = 20; o.cR = 16;
    o.speed = 70 * Math.min(1.8, D);
    o.chargeSpeed = 360 * Math.min(1.6, D);
    o.lockTime = 1.0; o.dashDur = 0.45;
    o.phase = "stalk"; o.phaseTimer = rand(2.5, 3.5);
    o.life = 16; o.maxLife = 16;
    o.color = "#F0ABFC"; o.glow = "#E879F9";
    o.ang = 0; o.vx = 0; o.vy = 0;
  }

  // ---------- update ----------
  update(dt) {
    const p = this.player;
    for (const o of this.list) {
      o.age += dt;
      o.life -= dt;
      // hard wave-lifetime cap: every wave disappears after 20s, no damage after expiry
      if (o.waveExpire && this.time >= o.waveExpire) { o.dangerous = false; this.expire(o); continue; }
      if (o.life <= 0 && o.kind !== "mine") { this.expire(o); continue; }
      switch (o.kind) {
        case "homing": this.updHoming(o, dt); break;
        case "path": this.updPath(o, dt); break;
        case "dashing": this.updDashing(o, dt); break;
        case "laser": this.updLaser(o, dt); break;
        case "rotator": this.updRotator(o, dt); break;
        case "mine": this.updMine(o, dt); break;
        case "teleporter": this.updTeleporter(o, dt); break;
        case "split": this.updSplit(o, dt); break;
        case "barrier": this.updBarrier(o, dt); break;
        case "elite": this.updElite(o, dt); break;
      }
      // generic cull for moving edge-spawned types
      if (["homing", "path", "dashing", "split", "teleporter"].includes(o.kind)) {
        if (o.x < -160 || o.x > this.W + 160 || o.y < -160 || o.y > this.H + 160) o.dead = true;
      }
    }
    this.list = this.list.filter((o) => !o.dead);
  }

  expire(o) {
    o.dead = true;
    this.particles.burst(o.x, o.y, 8, 90, o.color, 0.4, 2.5);
  }

  updHoming(o, dt) {
    const p = this.player;
    let tx = p.x, ty = p.y;
    if (o.lead > 0) { tx += p.vx * o.lead; ty += p.vy * o.lead; }
    const ang = Math.atan2(ty - o.y, tx - o.x);
    o.vx = lerp(o.vx, Math.cos(ang) * o.speed, Math.min(1, dt * o.turn));
    o.vy = lerp(o.vy, Math.sin(ang) * o.speed, Math.min(1, dt * o.turn));
    o.x += o.vx * dt; o.y += o.vy * dt;
    if (Math.random() < 0.4) this.particles.emit(o.x, o.y, rand(-20, 20), rand(-20, 20), 0.3, 2, o.glow);
  }

  updPath(o, dt) {
    const a = o.age;
    switch (o.pattern) {
      case "horizontal": o.x += o.vx * dt; o.y += o.vy * dt * 0.1; break;
      case "vertical": o.y += o.vy * dt; o.x += o.vx * dt * 0.1; break;
      case "diagonal": o.x += o.vx * dt; o.y += o.vy * dt; break;
      case "sine": o.x += o.vx * dt; o.y = o.baseY + Math.sin(a * o.freq + o.phase) * o.amp; break;
      case "zigzag": o.x += o.vx * dt; o.y = o.baseY + tri(a * o.freq + o.phase) * o.amp; break;
      case "circular": o.x = o.cx + Math.cos(a * o.freq + o.phase) * o.R; o.y = o.cy + Math.sin(a * o.freq + o.phase) * o.R; break;
      case "figure8": o.x = o.cx + Math.sin(a * o.freq) * o.R; o.y = o.cy + Math.sin(a * o.freq * 2) * o.R * 0.6; break;
      case "random": {
        o.dirTimer -= dt;
        if (o.dirTimer <= 0) { o.dirTimer = o.dirChange; const ang = rand(0, TAU); o.vx = Math.cos(ang) * Math.hypot(o.vx, o.vy || 100); o.vy = Math.sin(ang) * Math.hypot(o.vx, o.vy || 100); }
        o.x += o.vx * dt; o.y += o.vy * dt;
        // bounce off walls so random stays in play
        if (o.x < 40 || o.x > this.W - 40) o.vx *= -1;
        if (o.y < 40 || o.y > this.H - 40) o.vy *= -1;
        break;
      }
    }
  }

  updDashing(o, dt) {
    const p = this.player;
    if (o.phase === "track") {
      const ang = Math.atan2(p.y - o.y, p.x - o.x);
      o.vx = lerp(o.vx, Math.cos(ang) * o.slowSpeed, Math.min(1, dt * 1.5));
      o.vy = lerp(o.vy, Math.sin(ang) * o.slowSpeed, Math.min(1, dt * 1.5));
      o.x += o.vx * dt; o.y += o.vy * dt;
      o.cycleTimer -= dt;
      if (o.cycleTimer <= 0) { o.phase = "charge"; o.chargeT = o.warnTime; o.tx = p.x; o.ty = p.y; }
    } else if (o.phase === "charge") {
      o.x += o.vx * dt * 0.2; o.y += o.vy * dt * 0.2;
      o.chargeT -= dt;
      if (Math.random() < 0.6) this.particles.emit(o.x, o.y, rand(-30, 30), rand(-30, 30), 0.3, 2.5, o.glow);
      if (o.chargeT <= 0) {
        o.phase = "dash"; o.dashT = o.dashDur;
        const ang = Math.atan2(o.ty - o.y, o.tx - o.x);
        o.vx = Math.cos(ang) * o.dashSpeed; o.vy = Math.sin(ang) * o.dashSpeed;
        this.audio && this.audio.beep && this.audio.beep(180, 0.12, "sawtooth", 0.18);
      }
    } else if (o.phase === "dash") {
      o.x += o.vx * dt; o.y += o.vy * dt;
      this.particles.emit(o.x, o.y, 0, 0, 0.25, 3, o.glow);
      o.dashT -= dt;
      if (o.dashT <= 0) { o.phase = "track"; o.cycleTimer = rand(o.cycle * 0.7, o.cycle); o.vx *= 0.3; o.vy *= 0.3; }
    }
  }

  updLaser(o, dt) {
    if (o.warn > 0) {
      o.warn -= dt;
      o.dangerous = false;
      if (o.warn <= 0) { o.active = o.activeTime; o.dangerous = true; this.audio && this.audio.beep && this.audio.beep(110, 0.25, "sawtooth", 0.28); this.host.shake = Math.max(this.host.shake, 0.25); }
    } else if (o.active > 0) {
      o.active -= dt; o.dangerous = true;
      if (o.active <= 0) o.dead = true;
    }
  }

  updRotator(o, dt) {
    o.ang += o.spin * dt;
    if (o.moveSpeed) {
      o.cx += o.vx * dt; o.cy += o.vy * dt;
      if (o.cx < o.R + 20 || o.cx > this.W - o.R - 20) o.vx *= -1;
      if (o.cy < o.R + 20 || o.cy > this.H - o.R - 20) o.vy *= -1;
      o.x = o.cx; o.y = o.cy;
    }
    if (o.osc) o.R = o.baseR + Math.sin(o.age * 1.8) * o.osc;
  }

  updMine(o, dt) {
    if (o.phase === "idle") {
      o.x += o.vx * dt; o.y += o.vy * dt;
      if (o.x < 30 || o.x > this.W - 30) o.vx *= -1;
      if (o.y < 30 || o.y > this.H - 30) o.vy *= -1;
      if (dist(o.x, o.y, this.player.x, this.player.y) < o.trigR) {
        o.phase = "armed"; o.fuseTimer = o.fuse;
        this.audio && this.audio.beep && this.audio.beep(220, 0.08, "square", 0.12);
      }
      if (o.life <= 0) this.expire(o);
    } else if (o.phase === "armed") {
      o.fuseTimer -= dt;
      if (o.fuseTimer <= 0) {
        o.phase = "blast"; o.blastT = 0.28; o.dangerous = true;
        this.particles.burst(o.x, o.y, 26, 260, o.glow, 0.6, 4);
        this.audio && this.audio.beep && this.audio.beep(90, 0.3, "sawtooth", 0.3);
        this.host.shake = Math.max(this.host.shake, 0.4);
      }
    } else if (o.phase === "blast") {
      o.blastT -= dt;
      if (o.blastT <= 0) o.dead = true;
    }
  }

  updTeleporter(o, dt) {
    if (o.phase === "visible") {
      o.x += o.vx * dt; o.y += o.vy * dt;
      if (o.x < 40 || o.x > this.W - 40) o.vx *= -1;
      if (o.y < 40 || o.y > this.H - 40) o.vy *= -1;
      o.phaseTimer -= dt;
      if (o.phaseTimer <= 0) { o.phase = "flash"; o.flashT = o.flashTime; o.dangerous = false; }
    } else if (o.phase === "flash") {
      o.flashT -= dt;
      if (o.flashT <= 0) {
        // relocate to a safe spot, never on player
        const c = this.interiorSpawn(160);
        o.x = c.x; o.y = c.y;
        const a = rand(0, TAU); o.vx = Math.cos(a) * o.speed; o.vy = Math.sin(a) * o.speed;
        o.phase = "visible"; o.phaseTimer = o.visTime; o.dangerous = true;
        this.particles.burst(o.x, o.y, 12, 160, o.glow, 0.4, 3);
      }
    }
  }

  updSplit(o, dt) {
    o.x += o.vx * dt; o.y += o.vy * dt;
    if (o.gen === 0) {
      // slow drift, no tracking
    } else if (o.gen === 1) {
      // mild homing
      const ang = Math.atan2(this.player.y - o.y, this.player.x - o.x);
      o.vx = lerp(o.vx, Math.cos(ang) * o.speed, Math.min(1, dt * 1.2));
      o.vy = lerp(o.vy, Math.sin(ang) * o.speed, Math.min(1, dt * 1.2));
    } else {
      // small fast random, bounce
      if (o.x < 30 || o.x > this.W - 30) o.vx *= -1;
      if (o.y < 30 || o.y > this.H - 30) o.vy *= -1;
    }
    if (o.life <= 0 && o.gen < 2 && this.list.length < MAX_OBSTACLES - 1) {
      // split into 2 of next gen
      for (let i = 0; i < 2; i++) {
        const child = this.base();
        child.kind = "split"; child.tier = o.tier; child.gen = o.gen + 1;
        child.x = o.x; child.y = o.y;
        const a = rand(0, TAU);
        const sp = o.gen === 0 ? 95 : 150;
        child.vx = Math.cos(a) * sp; child.vy = Math.sin(a) * sp;
        child.speed = sp; child.r = o.gen === 0 ? 14 : 8; child.cR = child.r * 0.88;
        child.splitTime = o.gen === 0 ? 4.5 : 3.5;
        child.life = child.splitTime;
        child.color = o.gen === 0 ? "#F472B6" : "#FB7185"; child.glow = "#EC4899";
        this.list.push(child);
      }
      this.particles.burst(o.x, o.y, 14, 180, o.glow, 0.4, 3);
      o.dead = true;
    } else if (o.life <= 0) {
      this.expire(o);
    }
  }

  updBarrier(o, dt) {
    if (o.vertical) {
      o.x += o.gapSpeed * dt;
      if (o.moveGap) {
        o.gapCenter += o.gapDir * 50 * dt;
        if (o.gapCenter < o.gap / 2 + 30 || o.gapCenter > this.H - o.gap / 2 - 30) o.gapDir *= -1;
      }
      if (o.x > this.W + 80) o.dead = true;
    } else {
      o.y += o.gapSpeed * dt;
      if (o.moveGap) {
        o.gapCenter += o.gapDir * 50 * dt;
        if (o.gapCenter < o.gap / 2 + 30 || o.gapCenter > this.W - o.gap / 2 - 30) o.gapDir *= -1;
      }
      if (o.y > this.H + 80) o.dead = true;
    }
  }

  updElite(o, dt) {
    const p = this.player;
    if (o.phase === "stalk") {
      const ang = Math.atan2(p.y - o.y, p.x - o.x);
      o.ang = ang;
      o.vx = lerp(o.vx, Math.cos(ang) * o.speed, Math.min(1, dt * 1.2));
      o.vy = lerp(o.vy, Math.sin(ang) * o.speed, Math.min(1, dt * 1.2));
      o.x += o.vx * dt; o.y += o.vy * dt;
      o.phaseTimer -= dt;
      if (o.phaseTimer <= 0) { o.phase = "lock"; o.phaseTimer = o.lockTime; o.tx = p.x; o.ty = p.y; o.ang = Math.atan2(o.ty - o.y, o.tx - o.x); }
    } else if (o.phase === "lock") {
      o.vx *= 0.88; o.vy *= 0.88;
      o.x += o.vx * dt; o.y += o.vy * dt;
      o.phaseTimer -= dt;
      if (Math.random() < 0.5) this.particles.emit(o.x, o.y, rand(-20, 20), rand(-20, 20), 0.3, 2.5, o.glow);
      if (o.phaseTimer <= 0) {
        o.phase = "charge"; o.phaseTimer = o.dashDur;
        o.vx = Math.cos(o.ang) * o.chargeSpeed; o.vy = Math.sin(o.ang) * o.chargeSpeed;
        this.audio && this.audio.beep && this.audio.beep(200, 0.14, "sawtooth", 0.2);
      }
    } else if (o.phase === "charge") {
      o.x += o.vx * dt; o.y += o.vy * dt;
      this.particles.emit(o.x, o.y, 0, 0, 0.25, 3, o.glow);
      o.phaseTimer -= dt;
      if (o.phaseTimer <= 0) { o.phase = "stalk"; o.phaseTimer = rand(2.5, 3.5); o.vx *= 0.3; o.vy *= 0.3; }
    }
  }

  // ---------- collision ----------
  checkCollisions() {
    const p = this.player;
    for (const o of this.list) {
      if (o.dead || !o.dangerous) continue;
      if (this.hitTest(o, p)) { this.host.onObstacleHit(o); continue; }
      const nd = this.nearMissDist(o, p);
      if (nd >= 0 && nd < NEAR_MISS && !o.nearMissed) {
        o.nearMissed = true;
        this.host.onObstacleNearMiss(o);
      }
    }
  }

  hitTest(o, p) {
    switch (o.kind) {
      case "homing": case "path": case "dashing": case "teleporter": case "split": case "elite":
        return dist(p.x, p.y, o.x, o.y) < p.r + o.cR;
      case "mine":
        if (o.phase === "blast") return dist(p.x, p.y, o.x, o.y) < o.blastR + p.r;
        return dist(p.x, p.y, o.x, o.y) < p.r + o.cR;
      case "laser":
        return lineDist(p.x, p.y, o.px, o.py, o.ang) < o.thick / 2 + p.r;
      case "rotator": {
        const d = dist(p.x, p.y, o.cx, o.cy);
        if (Math.abs(d - o.R) > o.thick / 2 + p.r) return false;
        let rel = Math.atan2(p.y - o.cy, p.x - o.cx) - o.ang;
        rel = ((rel % TAU) + TAU) % TAU;
        const spacing = TAU / o.N;
        const inBlade = (rel % spacing) < o.fill * spacing;
        return inBlade;
      }
      case "barrier": {
        if (o.vertical) {
          if (Math.abs(p.x - o.x) > o.thick / 2 + p.r) return false;
          const g1 = o.gapCenter - o.gap / 2, g2 = o.gapCenter + o.gap / 2;
          return p.y < g1 - p.r || p.y > g2 + p.r;
        }
        if (Math.abs(p.y - o.y) > o.thick / 2 + p.r) return false;
        const g1 = o.gapCenter - o.gap / 2, g2 = o.gapCenter + o.gap / 2;
        return p.x < g1 - p.r || p.x > g2 + p.r;
      }
    }
    return false;
  }

  nearMissDist(o, p) {
    switch (o.kind) {
      case "homing": case "path": case "dashing": case "teleporter": case "split": case "elite":
      case "mine":
        return dist(p.x, p.y, o.x, o.y) - p.r - o.cR;
      case "laser":
        return lineDist(p.x, p.y, o.px, o.py, o.ang) - o.thick / 2 - p.r;
      case "barrier": {
        // distance to the solid wall segments (near miss when squeezing through gap)
        if (o.vertical) {
          if (Math.abs(p.x - o.x) > o.thick / 2 + p.r + NEAR_MISS) return 9999;
          const g1 = o.gapCenter - o.gap / 2, g2 = o.gapCenter + o.gap / 2;
          const d1 = segDist(p.x, p.y, o.x, 0, o.x, g1);
          const d2 = segDist(p.x, p.y, o.x, g2, o.x, this.H);
          return Math.min(d1, d2) - p.r;
        }
        if (Math.abs(p.y - o.y) > o.thick / 2 + p.r + NEAR_MISS) return 9999;
        const g1 = o.gapCenter - o.gap / 2, g2 = o.gapCenter + o.gap / 2;
        const d1 = segDist(p.x, p.y, 0, o.y, g1, o.y);
        const d2 = segDist(p.x, p.y, g2, o.y, this.W, o.y);
        return Math.min(d1, d2) - p.r;
      }
      case "rotator": {
        const d = dist(p.x, p.y, o.cx, o.cy);
        const ringProx = Math.abs(d - o.R) - o.thick / 2 - p.r;
        if (ringProx > NEAR_MISS) return 9999;
        let rel = Math.atan2(p.y - o.cy, p.x - o.cx) - o.ang;
        rel = ((rel % TAU) + TAU) % TAU;
        const spacing = TAU / o.N;
        const inBlade = (rel % spacing) < o.fill * spacing;
        if (inBlade) return 9999; // would be a hit, not a near miss
        const edge = Math.min(rel % spacing, spacing - (rel % spacing));
        return Math.max(ringProx, edge * o.R * 0.3);
      }
    }
    return 9999;
  }

  // ---------- render ----------
  render(ctx) {
    for (const o of this.list) this.draw(ctx, o);
  }

  draw(ctx, o) {
    ctx.save();
    switch (o.kind) {
      case "homing": this.drawHoming(ctx, o); break;
      case "path": this.drawSquare(ctx, o); break;
      case "dashing": this.drawDashing(ctx, o); break;
      case "laser": this.drawLaser(ctx, o); break;
      case "rotator": this.drawRotator(ctx, o); break;
      case "mine": this.drawMine(ctx, o); break;
      case "teleporter": this.drawTeleporter(ctx, o); break;
      case "split": this.drawSplit(ctx, o); break;
      case "barrier": this.drawBarrier(ctx, o); break;
      case "elite": this.drawElite(ctx, o); break;
    }
    ctx.restore();
  }

  // TRIANGLE — aggressive homing tracker (pink). Apex points at the player.
  drawHoming(ctx, o) {
    const rem = o.life;
    const finalPhase = rem < 3;
    const fadePhase = rem < 0.4;
    let alpha = 1, rr = o.r;
    if (fadePhase) { alpha = Math.max(0, rem / 0.4); rr = o.r * (0.6 + 0.4 * alpha); }
    ctx.globalAlpha = alpha;
    const pulse = finalPhase ? 1 + Math.sin(o.age * 16) * 0.18 : 1;
    if (finalPhase && !fadePhase) {
      const pa = 0.3 + Math.sin(o.age * 14) * 0.25;
      ctx.strokeStyle = `rgba(255,46,147,${pa})`;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(o.x, o.y, o.r + 6 + Math.sin(o.age * 12) * 3, 0, TAU); ctx.stroke();
    }
    const ang = Math.atan2(o.vy, o.vx) || 0;
    ctx.translate(o.x, o.y); ctx.rotate(ang);
    ctx.shadowColor = o.glow;
    ctx.shadowBlur = finalPhase ? 22 + Math.sin(o.age * 16) * 6 : 16;
    ctx.fillStyle = o.color;
    polyPath(ctx, 0, 0, rr * pulse, 3, 0);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(5,6,13,0.7)";
    polyPath(ctx, 0, 0, rr * 0.5, 3, 0);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  // SQUARE — predictable pather (cyan). Gentle rotation for life.
  drawSquare(ctx, o) {
    const rot = (o.pattern === "circular" || o.pattern === "figure8") ? o.age * 1.6 : o.age * 0.7;
    ctx.translate(o.x, o.y); ctx.rotate(rot);
    ctx.shadowColor = o.glow; ctx.shadowBlur = 12;
    ctx.fillStyle = o.color;
    ctx.fillRect(-o.r, -o.r, o.r * 2, o.r * 2);
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "rgba(5,6,13,0.6)"; ctx.lineWidth = 2;
    ctx.strokeRect(-o.r, -o.r, o.r * 2, o.r * 2);
    ctx.strokeStyle = "rgba(255,255,255,0.45)"; ctx.lineWidth = 1.5;
    ctx.strokeRect(-o.r * 0.5, -o.r * 0.5, o.r, o.r);
  }

  // DIAMOND — fast dasher (red). Points along its dash direction.
  drawDashing(ctx, o) {
    if (o.phase === "charge") {
      const blink = Math.sin(o.age * 30) > 0;
      ctx.strokeStyle = blink ? "rgba(255,77,109,0.9)" : "rgba(255,77,109,0.25)";
      ctx.lineWidth = 2; ctx.setLineDash([6, 8]);
      ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(o.tx, o.ty); ctx.stroke();
      ctx.setLineDash([]);
      ctx.strokeStyle = "rgba(255,77,109,0.8)"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(o.x, o.y, o.r + 6 + Math.sin(o.age * 20) * 3, 0, TAU); ctx.stroke();
    }
    const ang = Math.atan2(o.vy, o.vx) || 0;
    ctx.translate(o.x, o.y); ctx.rotate(ang);
    ctx.shadowColor = o.glow; ctx.shadowBlur = o.phase === "dash" ? 22 : 12;
    ctx.fillStyle = o.color;
    polyPath(ctx, 0, 0, o.r, 4, 0);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.beginPath(); ctx.arc(0, 0, o.r * 0.3, 0, TAU); ctx.fill();
  }

  // LASER — thin instant beam (red/purple). Dashed warning line before firing.
  drawLaser(ctx, o) {
    const len = Math.hypot(this.W, this.H) * 1.5;
    const dx = Math.cos(o.ang) * len, dy = Math.sin(o.ang) * len;
    const x1 = o.px - dx, y1 = o.py - dy, x2 = o.px + dx, y2 = o.py + dy;
    if (o.warn > 0) {
      const blink = Math.sin(o.age * 30) > 0;
      ctx.strokeStyle = blink ? "rgba(255,59,92,0.9)" : "rgba(255,59,92,0.25)";
      ctx.lineWidth = 2; ctx.setLineDash([10, 10]);
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      ctx.setLineDash([]);
    } else if (o.active > 0) {
      ctx.shadowColor = o.color; ctx.shadowBlur = 22;
      ctx.strokeStyle = o.color; ctx.lineWidth = o.thick; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = "rgba(255,255,255,0.85)"; ctx.lineWidth = Math.max(2, o.thick * 0.25);
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    }
  }

  // ROTATOR — rotating bars (purple). N blades sweep a ring around a hex hub.
  drawRotator(ctx, o) {
    const spacing = TAU / o.N;
    const bladeArc = o.fill * spacing;
    ctx.shadowColor = o.glow; ctx.shadowBlur = 14;
    ctx.strokeStyle = o.color; ctx.lineWidth = o.thick; ctx.lineCap = "round";
    for (let i = 0; i < o.N; i++) {
      const a0 = o.ang + i * spacing;
      const a1 = a0 + bladeArc;
      const x1 = o.cx + Math.cos(a0) * o.R, y1 = o.cy + Math.sin(a0) * o.R;
      const x2 = o.cx + Math.cos(a1) * o.R, y2 = o.cy + Math.sin(a1) * o.R;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    }
    ctx.shadowBlur = 0;
    ctx.fillStyle = o.color;
    polyPath(ctx, o.cx, o.cy, 7, 6, o.ang); ctx.fill();
    ctx.strokeStyle = "rgba(168,85,247,0.12)"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(o.cx, o.cy, o.R, 0, TAU); ctx.stroke();
  }

  // MINE — spiky star (orange). Proximity fuse, then blast shockwave.
  drawMine(ctx, o) {
    if (o.phase === "blast") {
      const a = clamp(o.blastT / 0.28, 0, 1);
      const br = o.blastR * (1.1 - a * 0.3);
      ctx.shadowColor = o.glow; ctx.shadowBlur = 30;
      ctx.fillStyle = `rgba(251,146,60,${a * 0.45})`;
      ctx.beginPath(); ctx.arc(o.x, o.y, br, 0, TAU); ctx.fill();
      ctx.strokeStyle = `rgba(251,146,60,${a})`; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(o.x, o.y, br, 0, TAU); ctx.stroke();
      ctx.shadowBlur = 0;
      return;
    }
    if (o.phase === "armed") {
      const prog = 1 - clamp(o.fuseTimer / o.fuse, 0, 1);
      const blink = Math.sin(o.age * 24) > 0;
      ctx.strokeStyle = blink ? "rgba(251,146,60,0.9)" : "rgba(251,146,60,0.3)";
      ctx.lineWidth = 2; ctx.setLineDash([6, 6]);
      ctx.beginPath(); ctx.arc(o.x, o.y, o.blastR * prog, 0, TAU); ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.translate(o.x, o.y); ctx.rotate(o.age * 1.5);
    ctx.shadowColor = o.glow; ctx.shadowBlur = 14;
    ctx.fillStyle = o.color;
    starPath(ctx, 0, 0, o.r, o.r * 0.45, 4, 0);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(5,6,13,0.65)";
    starPath(ctx, 0, 0, o.r * 0.5, o.r * 0.22, 4, 0); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.beginPath(); ctx.arc(0, 0, o.r * 0.22, 0, TAU); ctx.fill();
  }

  // HEXAGON — teleporter (cyan). Special: blinks out and reappears elsewhere.
  drawTeleporter(ctx, o) {
    if (o.phase === "flash") {
      const a = Math.sin(o.age * 30) * 0.5 + 0.5;
      ctx.strokeStyle = `rgba(34,211,238,${a})`; ctx.lineWidth = 2;
      for (let k = 0; k < 3; k++) {
        ctx.beginPath(); ctx.arc(o.x, o.y, o.r + 4 + k * 6 + Math.sin(o.age * 20) * 3, 0, TAU); ctx.stroke();
      }
      return;
    }
    ctx.translate(o.x, o.y); ctx.rotate(o.age * 1.2);
    ctx.shadowColor = o.glow; ctx.shadowBlur = 16;
    ctx.fillStyle = o.color;
    polyPath(ctx, 0, 0, o.r, 6, 0); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "rgba(34,211,238,0.5)"; ctx.lineWidth = 1.5;
    for (let k = 0; k < 2; k++) {
      ctx.beginPath(); ctx.arc(0, 0, o.r + 4 + k * 5 + Math.sin(o.age * 6 + k) * 2, 0, TAU); ctx.stroke();
    }
    ctx.fillStyle = "rgba(5,6,13,0.6)";
    polyPath(ctx, 0, 0, o.r * 0.5, 6, 0); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.beginPath(); ctx.arc(0, 0, o.r * 0.22, 0, TAU); ctx.fill();
  }

  // HEXAGON — splitter (pink). Special: splits into smaller hexagons.
  drawSplit(ctx, o) {
    ctx.translate(o.x, o.y); ctx.rotate(o.age * 2);
    ctx.shadowColor = o.glow; ctx.shadowBlur = 14;
    ctx.fillStyle = o.color;
    polyPath(ctx, 0, 0, o.r, 6, 0); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(5,6,13,0.55)";
    polyPath(ctx, 0, 0, o.r * 0.5, 6, 0); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.beginPath(); ctx.arc(0, 0, o.r * 0.25, 0, TAU); ctx.fill();
  }

  // RECTANGLE — barrier wall (cyan) with a navigable gap.
  drawBarrier(ctx, o) {
    ctx.shadowColor = o.glow; ctx.shadowBlur = 14;
    ctx.fillStyle = o.color;
    if (o.vertical) {
      const g1 = o.gapCenter - o.gap / 2, g2 = o.gapCenter + o.gap / 2;
      ctx.fillRect(o.x - o.thick / 2, 0, o.thick, g1);
      ctx.fillRect(o.x - o.thick / 2, g2, o.thick, this.H - g2);
      ctx.shadowBlur = 0;
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.fillRect(o.x - o.thick / 2, g1 - 3, o.thick, 3);
      ctx.fillRect(o.x - o.thick / 2, g2, o.thick, 3);
    } else {
      const g1 = o.gapCenter - o.gap / 2, g2 = o.gapCenter + o.gap / 2;
      ctx.fillRect(0, o.y - o.thick / 2, g1, o.thick);
      ctx.fillRect(g2, o.y - o.thick / 2, this.W - g2, o.thick);
      ctx.shadowBlur = 0;
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.fillRect(g1 - 3, o.y - o.thick / 2, 3, o.thick);
      ctx.fillRect(g2, o.y - o.thick / 2, 3, o.thick);
    }
  }

  // ELITE — large hexagram (magenta). Stalks, locks on with a telegraph, then charges.
  drawElite(ctx, o) {
    if (o.phase === "lock") {
      const blink = Math.sin(o.age * 30) > 0;
      ctx.strokeStyle = blink ? "rgba(232,121,249,0.9)" : "rgba(232,121,249,0.25)";
      ctx.lineWidth = 2; ctx.setLineDash([8, 8]);
      ctx.beginPath();
      ctx.moveTo(o.x, o.y);
      ctx.lineTo(o.x + Math.cos(o.ang) * 700, o.y + Math.sin(o.ang) * 700);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.strokeStyle = "rgba(232,121,249,0.8)"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(o.x, o.y, o.r + 6 + Math.sin(o.age * 20) * 3, 0, TAU); ctx.stroke();
    }
    ctx.translate(o.x, o.y); ctx.rotate(o.age * 1.2);
    ctx.shadowColor = o.glow; ctx.shadowBlur = o.phase === "charge" ? 26 : 18;
    ctx.fillStyle = o.color;
    starPath(ctx, 0, 0, o.r, o.r * 0.5, 6, 0); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "rgba(255,255,255,0.7)"; ctx.lineWidth = 2;
    starPath(ctx, 0, 0, o.r * 0.7, o.r * 0.35, 6, 0); ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,0.95)";
    ctx.beginPath(); ctx.arc(0, 0, o.r * 0.25, 0, TAU); ctx.fill();
  }
}

function tri(x) {
  // triangle wave in [-1,1]
  const p = (x / TAU) % 1;
  const v = p < 0.5 ? p * 4 - 1 : 3 - p * 4;
  return v;
}