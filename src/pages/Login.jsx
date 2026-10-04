import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Mail, Lock, Loader2, ArrowLeft } from "lucide-react";
import GoogleIcon from "@/components/GoogleIcon";
import Logo from "@/components/Logo";
import { safeReturnTo } from "@/lib/authReturnTo";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  // Post-login destination (e.g. the MCP OAuth consent page sends users here
  // with returnTo so the grant flow can resume). Same-origin paths only.
  const returnTo = safeReturnTo();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await base44.auth.loginViaEmailPassword(email, password);
      navigate(returnTo);
    } catch (err) {
      setError(err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = () => {
    base44.auth.loginWithProvider("google", returnTo);
  };

  const registerTo = "/register" + (returnTo !== "/" ? "?returnTo=" + encodeURIComponent(returnTo) : "");

  return (
    <div className="relative min-h-screen w-full bg-[#05060D] text-[#F8FAFC] overflow-y-auto flex flex-col">
      {/* ambient grid */}
      <div className="pointer-events-none absolute inset-0 opacity-30" style={{ backgroundImage: "linear-gradient(rgba(0,245,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0,245,255,0.06) 1px, transparent 1px)", backgroundSize: "44px 44px" }} />

      <div className="relative z-10 flex items-center justify-between px-4 sm:px-6 py-3 border-b border-white/5">
        <Link to="/" className="flex items-center gap-2 text-sm text-[#94A3B8] hover:text-[#F8FAFC] transition">
          <ArrowLeft size={18} /> Back to game
        </Link>
        <span className="flex items-center gap-1.5">
          <Logo size={20} rounded="rounded-md" />
          <span className="font-display font-black tracking-widest text-sm" style={{ background: "linear-gradient(90deg,#00F5FF,#FF2E93)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>
            NEON RUSH
          </span>
        </span>
        <div className="w-20" />
      </div>

      <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Logo size={64} rounded="rounded-2xl" className="mx-auto mb-4" />
            <h1 className="font-display font-black tracking-widest text-3xl" style={{ background: "linear-gradient(90deg,#00F5FF,#8B5CF6)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>
              PILOT LOGIN
            </h1>
            <p className="text-sm text-[#94A3B8] mt-2">Sign in to save progress and rank on the global leaderboard.</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0B1020]/80 backdrop-blur p-6 shadow-[0_0_40px_rgba(0,245,255,0.08)]">
            <button
              onClick={handleGoogle}
              className="w-full h-12 rounded-xl border border-white/15 bg-white/5 text-sm font-medium flex items-center justify-center gap-2 hover:bg-white/10 active:scale-[0.99] transition"
            >
              <GoogleIcon className="w-5 h-5" />
              Continue with Google
            </button>

            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10" /></div>
              <div className="relative flex justify-center text-xs uppercase tracking-widest">
                <span className="bg-[#0B1020] px-3 text-[#64748B]">or</span>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-[#FF3B5C]/10 border border-[#FF3B5C]/30 text-[#FF3B5C] text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-xs uppercase tracking-widest text-[#94A3B8]">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" aria-hidden="true" />
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    autoFocus
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-12 pl-10 pr-3 rounded-xl bg-[#05060D] border border-white/10 text-sm outline-none focus:border-[#00F5FF]/50 focus:ring-1 focus:ring-[#00F5FF]/30 transition"
                    required
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="block text-xs uppercase tracking-widest text-[#94A3B8]">Password</label>
                  <Link to="/forgot-password" className="text-xs text-[#00F5FF] hover:underline">Forgot?</Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" aria-hidden="true" />
                  <input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-12 pl-10 pr-3 rounded-xl bg-[#05060D] border border-white/10 text-sm outline-none focus:border-[#00F5FF]/50 focus:ring-1 focus:ring-[#00F5FF]/30 transition"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-xl font-display font-bold tracking-widest text-[#05060D] flex items-center justify-center gap-2 disabled:opacity-60 active:scale-[0.99] transition"
                style={{ background: "linear-gradient(90deg,#00F5FF,#8B5CF6)" }}
              >
                {loading ? <><Loader2 size={18} className="animate-spin" /> AUTHENTICATING…</> : <>LOG IN</>}
              </button>
            </form>
          </div>

          <p className="text-center text-sm text-[#94A3B8] mt-6">
            New pilot?{" "}
            <Link to={registerTo} className="text-[#00F5FF] font-medium hover:underline">Create an account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}