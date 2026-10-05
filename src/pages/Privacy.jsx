import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function Privacy() {
  return (
    <div className="relative min-h-screen w-full bg-[#05060D] text-[#F8FAFC] overflow-y-auto">
      <div className="sticky top-0 z-20 flex items-center justify-between px-4 sm:px-6 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-3 bg-[#05060D]/90 backdrop-blur border-b border-white/5">
        <Link to="/" className="flex items-center gap-2 text-sm text-[#94A3B8] hover:text-[#F8FAFC] transition">
          <ArrowLeft size={18} /> Back to game
        </Link>
        <span className="font-display font-black tracking-wider text-lg" style={{ background: "linear-gradient(90deg,#00F5FF,#8B5CF6)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>
          PRIVACY
        </span>
        <div className="w-20" />
      </div>

      <article className="max-w-2xl mx-auto px-4 sm:px-6 py-8 leading-relaxed text-[#CBD5E1]">
        <h1 className="font-display font-black tracking-wider text-3xl sm:text-4xl mb-2" style={{ background: "linear-gradient(180deg,#00F5FF,#8B5CF6)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>
          Privacy Policy
        </h1>
        <p className="text-sm text-[#64748B] mb-6">Last updated: October 1, 2026</p>

        <p className="mb-4">
          NEON RUSH is a free-to-play browser arcade game. This policy explains what information we collect,
          how we use it, and the choices you have. By playing the game, you accept the practices described
          here.
        </p>

        <h2 className="font-display font-bold tracking-wider text-xl text-[#00F5FF] mt-6 mb-2">Information we collect</h2>
        <p className="mb-4">
          When you play as a guest, we store your progress — such as your pilot name, best score, run
          history, unlocked skins, and settings — in your browser's local storage. This data never leaves
          your device unless you choose to submit a score to the global leaderboard. If you create an
          account, we store your email address and the scores, replays, and badges you submit so they can
          be ranked and shown on your profile. When you use the contact form, we store the name, email,
          and message you provide so we can reply.
        </p>

        <h2 className="font-display font-bold tracking-wider text-xl text-[#00F5FF] mt-6 mb-2">How we use information</h2>
        <p className="mb-4">
          We use the information above to run the game, rank leaderboards, personalize your profile,
          respond to messages you send us, and understand aggregate gameplay trends so we can improve the
          experience. We do not sell your data, and we do not use it to build advertising profiles.
        </p>

        <h2 className="font-display font-bold tracking-wider text-xl text-[#00F5FF] mt-6 mb-2">Analytics</h2>
        <p className="mb-4">
          We use privacy-conscious analytics to count starts, completed runs, and new sign-ups so we can
          measure reach and retention. These are aggregate counts and are not tied to your identity.
        </p>

        <h2 className="font-display font-bold tracking-wider text-xl text-[#00F5FF] mt-6 mb-2">Your choices</h2>
        <p className="mb-4">
          You can play as a guest without creating an account. You can clear your local progress at any
          time by clearing your browser storage. If you have an account and want your data removed,
          contact us through the Contact page and we will delete your profile and submitted scores.
        </p>

        <h2 className="font-display font-bold tracking-wider text-xl text-[#00F5FF] mt-6 mb-2">Children</h2>
        <p className="mb-4">
          NEON RUSH is not directed at children under 13, and we do not knowingly collect personal
          information from them. If you believe a child has registered an account, contact us and we
          will remove it.
        </p>

        <h2 className="font-display font-bold tracking-wider text-xl text-[#00F5FF] mt-6 mb-2">Contact</h2>
        <p className="mb-4">
          Questions about this policy? Reach us through the <Link to="/contact" className="text-[#00F5FF] hover:underline">Contact page</Link>.
        </p>
      </article>
    </div>
  );
}