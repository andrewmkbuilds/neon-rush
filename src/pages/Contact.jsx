import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Send, Loader2, CheckCircle2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!name.trim() || !email.trim() || !message.trim()) {
      setError("Please fill in your name, email, and message.");
      return;
    }
    setStatus("sending");
    try {
      await base44.entities.ContactMessage.create({
        name: name.trim().slice(0, 80),
        email: email.trim().slice(0, 120),
        message: message.trim().slice(0, 2000),
      });
      setStatus("sent");
      setName(""); setEmail(""); setMessage("");
    } catch (err) {
      setStatus("error");
      setError(err?.message || "Could not send your message. Please try again.");
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-[#05060D] text-[#F8FAFC] overflow-y-auto">
      <div className="sticky top-0 z-20 flex items-center justify-between px-4 sm:px-6 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-3 bg-[#05060D]/90 backdrop-blur border-b border-white/5">
        <Link to="/" className="flex items-center gap-2 text-sm text-[#94A3B8] hover:text-[#F8FAFC] transition">
          <ArrowLeft size={18} /> Back to game
        </Link>
        <span className="font-display font-black tracking-wider text-lg" style={{ background: "linear-gradient(90deg,#00F5FF,#FF2E93)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>
          CONTACT
        </span>
        <div className="w-20" />
      </div>

      <div className="max-w-xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="font-display font-black tracking-wider text-3xl sm:text-4xl mb-2" style={{ background: "linear-gradient(180deg,#00F5FF,#FF2E93)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>
          Get in touch
        </h1>
        <p className="text-[#94A3B8] mb-6">
          Questions, feedback, bug reports, or partnership ideas? Drop a message below and the NEON RUSH
          team will get back to you.
        </p>

        {status === "sent" ? (
          <div className="rounded-2xl border border-[#34D399]/30 bg-[#34D399]/5 p-6 text-center">
            <CheckCircle2 size={36} className="mx-auto text-[#34D399] mb-2" />
            <div className="font-display font-bold text-lg text-[#34D399]">Message sent</div>
            <p className="text-sm text-[#94A3B8] mt-1">Thanks for reaching out — we'll reply soon.</p>
            <button
              onClick={() => setStatus("idle")}
              className="mt-4 px-4 py-2 rounded-lg border border-white/15 bg-white/5 text-sm font-display font-bold tracking-wider hover:bg-white/10 transition"
            >
              Send another
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-widest text-[#94A3B8] mb-1.5">Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={80}
                className="w-full bg-[#0B1020] border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#00F5FF]/50"
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-[#94A3B8] mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                maxLength={120}
                className="w-full bg-[#0B1020] border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#00F5FF]/50"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-[#94A3B8] mb-1.5">Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={2000}
                rows={5}
                className="w-full bg-[#0B1020] border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#00F5FF]/50 resize-none"
                placeholder="Tell us what's on your mind…"
              />
            </div>

            {error && <div className="text-sm text-[#FF3B5C]">{error}</div>}

            <button
              type="submit"
              disabled={status === "sending"}
              className="w-full px-5 py-3 rounded-xl font-display font-bold tracking-wider text-[#05060D] flex items-center justify-center gap-2 disabled:opacity-60"
              style={{ background: "linear-gradient(90deg,#00F5FF,#8B5CF6)" }}
            >
              {status === "sending" ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              {status === "sending" ? "SENDING…" : "SEND MESSAGE"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}