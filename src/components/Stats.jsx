import React, { useMemo } from "react";
import { ArrowLeft, TrendingUp, TrendingDown, Minus, Activity, Trophy, Waves, BarChart3, Gauge, Clock, Zap, Download } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";
import { loadLeaderboard, exportRunsCSV } from "@/game/storage";

function Card({ icon: Icon, label, value, color, sub }) {
  return (
    <div className="rounded-xl border border-white/15 bg-white/[0.07] p-3">
      <div className="flex items-center gap-1.5 text-xs uppercase tracking-widest text-[#94A3B8]">
        <Icon size={12} style={{ color }} /> {label}
      </div>
      <div className="font-display font-bold text-lg tabular-nums mt-0.5" style={{ color }}>{value}</div>
      {sub && <div className="text-xs text-[#94A3B8] mt-0.5">{sub}</div>}
    </div>
  );
}

// 5-run rolling average to smooth noise and reveal the trajectory
function movingAvg(arr, key, win = 5) {
  return arr.map((_, i) => {
    const start = Math.max(0, i - win + 1);
    const slice = arr.slice(start, i + 1);
    return Math.round(slice.reduce((a, r) => a + (Number(r[key]) || 0), 0) / slice.length);
  });
}

// compare recent half vs earlier half of the run history
function improvement(runs, key) {
  if (runs.length < 4) return null;
  const mid = Math.floor(runs.length / 2);
  const early = runs.slice(0, mid);
  const recent = runs.slice(mid);
  const ea = early.reduce((a, r) => a + (Number(r[key]) || 0), 0) / early.length;
  const ra = recent.reduce((a, r) => a + (Number(r[key]) || 0), 0) / recent.length;
  if (ea === 0) return ra > 0 ? { pct: 100, dir: "up", ea: 0, ra: Math.round(ra) } : { pct: 0, dir: "flat", ea: 0, ra: 0 };
  const pct = Math.round(((ra - ea) / ea) * 100);
  return { pct, dir: pct > 1 ? "up" : pct < -1 ? "down" : "flat", ea: Math.round(ea), ra: Math.round(ra) };
}

export default function Stats({ profile, onBack }) {
  const runs = useMemo(() => {
    const lb = loadLeaderboard();
    return [...lb].sort((a, b) => a.date - b.date).slice(-30);
  }, []);

  const summary = useMemo(() => {
    if (!runs.length) return { count: 0, avgScore: 0, avgWave: 0, best: 0, bestWave: 0, bestSurvival: 0, avgSurvival: 0, avgEnergy: 0, scoreImp: null, waveImp: null, timeImp: null, energyImp: null };
    const s = runs.reduce((a, r) => a + r.score, 0);
    const w = runs.reduce((a, r) => a + r.wave, 0);
    const e = runs.reduce((a, r) => a + (Number(r.energy) || 0), 0);
    const t = runs.reduce((a, r) => a + (Number(r.time) || 0), 0);
    return {
      count: runs.length,
      avgScore: Math.round(s / runs.length),
      avgWave: +(w / runs.length).toFixed(1),
      best: Math.max(...runs.map((r) => r.score)),
      bestWave: Math.max(...runs.map((r) => r.wave)),
      bestSurvival: Math.max(...runs.map((r) => Number(r.time) || 0)),
      avgSurvival: Math.round(t / runs.length),
      avgEnergy: Math.round(e / runs.length),
      scoreImp: improvement(runs, "score"),
      waveImp: improvement(runs, "wave"),
      timeImp: improvement(runs, "time"),
      energyImp: improvement(runs, "energy"),
    };
  }, [runs]);

  const chartData = useMemo(() => {
    const scoreMa = movingAvg(runs, "score", 5);
    const timeMa = movingAvg(runs, "time", 5);
    const energyMa = movingAvg(runs, "energy", 5);
    return runs.map((r, i) => ({
      run: i + 1,
      score: r.score,
      avg: scoreMa[i],
      wave: r.wave,
      time: Number(r.time) || 0,
      timeAvg: timeMa[i],
      energy: Number(r.energy) || 0,
      energyAvg: energyMa[i],
    }));
  }, [runs]);

  const weeklyData = useMemo(() => {
    if (!runs.length) return [];
    const days = 21;
    const now = Date.now();
    const buckets = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now - i * 86400000);
      const key = d.toISOString().slice(0, 10);
      buckets.push({ key, label: `${d.getMonth() + 1}/${d.getDate()}`, survival: 0, energy: 0, runs: 0 });
    }
    const map = new Map(buckets.map((b) => [b.key, b]));
    for (const r of runs) {
      const key = new Date(r.date).toISOString().slice(0, 10);
      const b = map.get(key);
      if (!b) continue;
      b.survival += Number(r.time) || 0;
      b.energy += Number(r.energy) || 0;
      b.runs += 1;
    }
    return buckets.map((b) => ({
      label: b.label,
      survival: b.runs ? Math.round(b.survival / b.runs) : null,
      energy: b.runs ? Math.round(b.energy / b.runs) : null,
      runs: b.runs,
    }));
  }, [runs]);

  const tipStyle = { background: "#0B1020", border: "1px solid rgba(0,245,255,0.3)", borderRadius: 8, fontSize: 12 };

  const ImpLabel = ({ imp }) => {
    if (!imp) return <span className="text-[#64748B]">—</span>;
    const Icon = imp.dir === "up" ? TrendingUp : imp.dir === "down" ? TrendingDown : Minus;
    const color = imp.dir === "up" ? "#22C55E" : imp.dir === "down" ? "#FF3B5C" : "#94A3B8";
    return (
      <span className="inline-flex items-center gap-1" style={{ color }}>
        <Icon size={15} /> {imp.dir === "up" ? "+" : ""}{imp.pct}%
      </span>
    );
  };

  const dirColor = (d) => (d === "up" ? "#22C55E" : d === "down" ? "#FF3B5C" : "#94A3B8");

  return (
    <div className="relative h-screen w-full bg-[#05060D] text-[#F8FAFC] overflow-y-auto">
      <div className="sticky top-0 z-20 flex items-center justify-between px-4 sm:px-6 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-3 bg-[#05060D]/90 backdrop-blur border-b border-white/5">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-[#94A3B8] hover:text-[#F8FAFC] transition">
          <ArrowLeft size={18} /> Back
        </button>
        <h1 className="font-display font-black tracking-wider text-lg" style={{ background: "linear-gradient(90deg,#00F5FF,#8B5CF6)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>
          DASHBOARD
        </h1>
        <div className="w-16" />
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between gap-3 mb-4">
          <p className="text-sm text-[#94A3B8]">Track your growth across the last {runs.length || 0} runs on this device.</p>
          <button
            onClick={exportRunsCSV}
            disabled={runs.length === 0}
            onMouseDown={(e) => e.preventDefault()}
            className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#00F5FF]/40 bg-[#00F5FF]/10 text-[#00F5FF] text-xs font-display font-bold tracking-wider hover:bg-[#00F5FF]/20 active:scale-95 transition disabled:opacity-40"
          >
            <Download size={14} /> EXPORT CSV
          </button>
        </div>

        {/* summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          <Card icon={BarChart3} label="Runs" value={summary.count} color="#00F5FF" />
          <Card icon={Trophy} label="Best Score" value={summary.best.toLocaleString()} color="#FFD166" />
          <Card icon={TrendingUp} label="Avg Score" value={summary.avgScore.toLocaleString()} color="#00F5FF" />
          <Card icon={Waves} label="Best Wave" value={summary.bestWave} color="#FFD166" />
          <Card icon={Activity} label="Avg Wave" value={summary.avgWave} color="#8B5CF6" />
          <Card
            icon={Gauge}
            label="Score Growth"
            value={summary.scoreImp ? `${summary.scoreImp.dir === "up" ? "+" : ""}${summary.scoreImp.pct}%` : "—"}
            color={dirColor(summary.scoreImp?.dir)}
            sub="recent vs earlier"
          />
          <Card icon={Clock} label="Best Survival" value={`${summary.bestSurvival}s`} color="#22D3EE" sub={`avg ${summary.avgSurvival}s`} />
          <Card icon={Zap} label="Avg Energy" value={summary.avgEnergy} color="#FFD166" sub="per run" />
          <Card
            icon={Gauge}
            label="Energy Growth"
            value={summary.energyImp ? `${summary.energyImp.dir === "up" ? "+" : ""}${summary.energyImp.pct}%` : "—"}
            color={dirColor(summary.energyImp?.dir)}
            sub="recent vs earlier"
          />
        </div>

        {runs.length === 0 ? (
          <div className="mt-8 text-center text-[#94A3B8] text-sm py-12 rounded-2xl border border-white/15 bg-white/[0.07]">
            No runs yet — play a game to start tracking your stats.
          </div>
        ) : (
          <>
            {/* score trend + moving average */}
            <div className="mt-6 rounded-2xl border border-white/15 bg-white/[0.07] p-4">
              <div className="flex items-center justify-between mb-3 gap-2">
                <div className="flex items-center gap-2 shrink-0">
                  <TrendingUp size={16} className="text-[#00F5FF]" />
                  <span className="font-display font-bold tracking-wider text-[#00F5FF] text-sm uppercase">Score Trend</span>
                </div>
                {summary.scoreImp && (
                  <span className="text-xs text-[#94A3B8] text-right">
                    recent <b style={{ color: dirColor(summary.scoreImp.dir) }}>{summary.scoreImp.ra}</b> · earlier <b className="text-[#94A3B8]">{summary.scoreImp.ea}</b>
                  </span>
                )}
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="run" stroke="#64748B" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748B" fontSize={11} tickLine={false} width={44} />
                  <Tooltip contentStyle={tipStyle} labelStyle={{ color: "#94A3B8" }} labelFormatter={(v) => `Run ${v}`} />
                  <Line type="monotone" dataKey="score" stroke="#00F5FF" strokeWidth={2} dot={false} name="Score" />
                  <Line type="monotone" dataKey="avg" stroke="#8B5CF6" strokeWidth={2} strokeDasharray="5 4" dot={false} name="5-run avg" />
                </LineChart>
              </ResponsiveContainer>
              <div className="flex items-center gap-4 mt-2 text-xs text-[#94A3B8]">
                <span className="inline-flex items-center gap-1"><span className="w-3 h-0.5 bg-[#00F5FF]" /> Score</span>
                <span className="inline-flex items-center gap-1"><span className="w-3 border-t border-dashed border-[#8B5CF6]" /> 5-run avg</span>
              </div>
            </div>

            {/* wave progression */}
            <div className="mt-4 rounded-2xl border border-white/15 bg-white/[0.07] p-4">
              <div className="flex items-center justify-between mb-3 gap-2">
                <div className="flex items-center gap-2 shrink-0">
                  <Waves size={16} className="text-[#8B5CF6]" />
                  <span className="font-display font-bold tracking-wider text-[#8B5CF6] text-sm uppercase">Wave Progression</span>
                </div>
                {summary.waveImp && (
                  <span className="text-xs text-[#94A3B8] text-right">
                    recent <b style={{ color: dirColor(summary.waveImp.dir) }}>{summary.waveImp.ra}</b> · earlier <b className="text-[#94A3B8]">{summary.waveImp.ea}</b>
                  </span>
                )}
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="run" stroke="#64748B" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748B" fontSize={11} tickLine={false} width={28} />
                  <Tooltip contentStyle={tipStyle} labelStyle={{ color: "#94A3B8" }} labelFormatter={(v) => `Run ${v}`} />
                  <Line type="monotone" dataKey="wave" stroke="#8B5CF6" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* survival time trend */}
            <div className="mt-4 rounded-2xl border border-white/15 bg-white/[0.07] p-4">
              <div className="flex items-center justify-between mb-3 gap-2">
                <div className="flex items-center gap-2 shrink-0">
                  <Clock size={16} className="text-[#22D3EE]" />
                  <span className="font-display font-bold tracking-wider text-[#22D3EE] text-sm uppercase">Survival Time</span>
                </div>
                {summary.timeImp && (
                  <span className="text-xs text-[#94A3B8] text-right">
                    recent <b style={{ color: dirColor(summary.timeImp.dir) }}>{summary.timeImp.ra}s</b> · earlier <b className="text-[#94A3B8]">{summary.timeImp.ea}s</b>
                  </span>
                )}
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="run" stroke="#64748B" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748B" fontSize={11} tickLine={false} width={32} unit="s" />
                  <Tooltip contentStyle={tipStyle} labelStyle={{ color: "#94A3B8" }} labelFormatter={(v) => `Run ${v}`} />
                  <Line type="monotone" dataKey="time" stroke="#22D3EE" strokeWidth={2} dot={false} name="Survival" />
                  <Line type="monotone" dataKey="timeAvg" stroke="#34D399" strokeWidth={2} strokeDasharray="5 4" dot={false} name="5-run avg" />
                </LineChart>
              </ResponsiveContainer>
              <div className="flex items-center gap-4 mt-2 text-xs text-[#94A3B8]">
                <span className="inline-flex items-center gap-1"><span className="w-3 h-0.5 bg-[#22D3EE]" /> Survival</span>
                <span className="inline-flex items-center gap-1"><span className="w-3 border-t border-dashed border-[#34D399]" /> 5-run avg</span>
              </div>
            </div>

            {/* energy collection trend */}
            <div className="mt-4 rounded-2xl border border-white/15 bg-white/[0.07] p-4">
              <div className="flex items-center justify-between mb-3 gap-2">
                <div className="flex items-center gap-2 shrink-0">
                  <Zap size={16} className="text-[#FFD166]" />
                  <span className="font-display font-bold tracking-wider text-[#FFD166] text-sm uppercase">Energy Collection</span>
                </div>
                {summary.energyImp && (
                  <span className="text-xs text-[#94A3B8] text-right">
                    recent <b style={{ color: dirColor(summary.energyImp.dir) }}>{summary.energyImp.ra}</b> · earlier <b className="text-[#94A3B8]">{summary.energyImp.ea}</b>
                  </span>
                )}
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="run" stroke="#64748B" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748B" fontSize={11} tickLine={false} width={28} />
                  <Tooltip contentStyle={tipStyle} labelStyle={{ color: "#94A3B8" }} labelFormatter={(v) => `Run ${v}`} />
                  <Line type="monotone" dataKey="energy" stroke="#FFD166" strokeWidth={2} dot={false} name="Energy" />
                  <Line type="monotone" dataKey="energyAvg" stroke="#FF8A3D" strokeWidth={2} strokeDasharray="5 4" dot={false} name="5-run avg" />
                </LineChart>
              </ResponsiveContainer>
              <div className="flex items-center gap-4 mt-2 text-xs text-[#94A3B8]">
                <span className="inline-flex items-center gap-1"><span className="w-3 h-0.5 bg-[#FFD166]" /> Energy</span>
                <span className="inline-flex items-center gap-1"><span className="w-3 border-t border-dashed border-[#FF8A3D]" /> 5-run avg</span>
              </div>
            </div>

            {/* last few weeks — daily trends */}
            <div className="mt-4 rounded-2xl border border-white/15 bg-white/[0.07] p-4">
              <div className="flex items-center gap-2 mb-3">
                <Activity size={16} className="text-[#8B5CF6]" />
                <span className="font-display font-bold tracking-wider text-[#8B5CF6] text-sm uppercase">Last Few Weeks</span>
                <span className="text-xs text-[#94A3B8] ml-auto">daily avg · 21 days</span>
              </div>
              {weeklyData.some((d) => d.runs > 0) ? (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={weeklyData} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="label" stroke="#64748B" fontSize={10} tickLine={false} interval={3} />
                    <YAxis yAxisId="s" stroke="#22D3EE" fontSize={10} tickLine={false} width={32} unit="s" />
                    <YAxis yAxisId="e" orientation="right" stroke="#FFD166" fontSize={10} tickLine={false} width={28} />
                    <Tooltip contentStyle={tipStyle} labelStyle={{ color: "#94A3B8" }} />
                    <Line yAxisId="s" type="monotone" dataKey="survival" stroke="#22D3EE" strokeWidth={2} dot={false} connectNulls name="Avg Survival (s)" />
                    <Line yAxisId="e" type="monotone" dataKey="energy" stroke="#FFD166" strokeWidth={2} dot={false} connectNulls name="Avg Energy" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-xs text-[#94A3B8] py-6 text-center">Play runs across a few days to see your weekly trend fill in.</p>
              )}
              <div className="flex items-center gap-4 mt-2 text-xs text-[#94A3B8]">
                <span className="inline-flex items-center gap-1"><span className="w-3 h-0.5 bg-[#22D3EE]" /> Avg Survival</span>
                <span className="inline-flex items-center gap-1"><span className="w-3 h-0.5 bg-[#FFD166]" /> Avg Energy</span>
              </div>
            </div>

            {/* performance improvement */}
            {(summary.scoreImp || summary.waveImp || summary.timeImp || summary.energyImp) && (
              <div className="mt-4 rounded-2xl border border-[#FFD166]/25 bg-[#FFD166]/5 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Gauge size={16} className="text-[#FFD166]" />
                  <span className="font-display font-bold tracking-wider text-[#FFD166] text-sm uppercase">Performance Improvement</span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl bg-white/5 p-3">
                    <div className="text-xs uppercase tracking-widest text-[#94A3B8] mb-1">Score (recent vs earlier)</div>
                    <div className="font-display font-bold text-lg"><ImpLabel imp={summary.scoreImp} /></div>
                  </div>
                  <div className="rounded-xl bg-white/5 p-3">
                    <div className="text-xs uppercase tracking-widest text-[#94A3B8] mb-1">Wave (recent vs earlier)</div>
                    <div className="font-display font-bold text-lg"><ImpLabel imp={summary.waveImp} /></div>
                  </div>
                  <div className="rounded-xl bg-white/5 p-3">
                    <div className="text-xs uppercase tracking-widest text-[#94A3B8] mb-1">Survival (recent vs earlier)</div>
                    <div className="font-display font-bold text-lg"><ImpLabel imp={summary.timeImp} /></div>
                  </div>
                  <div className="rounded-xl bg-white/5 p-3">
                    <div className="text-xs uppercase tracking-widest text-[#94A3B8] mb-1">Energy (recent vs earlier)</div>
                    <div className="font-display font-bold text-lg"><ImpLabel imp={summary.energyImp} /></div>
                  </div>
                </div>
                <p className="text-xs text-[#94A3B8] mt-3">
                  {summary.timeImp?.dir === "up" && summary.energyImp?.dir === "up"
                    ? "Survival and energy collection are both climbing — you're flying longer and smarter."
                    : summary.scoreImp?.dir === "down" || summary.timeImp?.dir === "down"
                    ? "Recent runs dipped slightly — try a calmer line and focus on near-miss combos."
                    : "Holding steady. Push into later waves and grab more energy orbs to break your plateau."}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}