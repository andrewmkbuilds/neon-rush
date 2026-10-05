import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function Terms() {
  return (
    <div className="relative min-h-screen w-full bg-[#05060D] text-[#F8FAFC] overflow-y-auto">
      <div className="sticky top-0 z-20 flex items-center justify-between px-4 sm:px-6 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-3 bg-[#05060D]/90 backdrop-blur border-b border-white/5">
        <Link to="/" className="flex items-center gap-2 text-sm text-[#94A3B8] hover:text-[#F8FAFC] transition">
          <ArrowLeft size={18} /> Back to game
        </Link>
        <span className="font-display font-black tracking-wider text-lg" style={{ background: "linear-gradient(90deg,#00F5FF,#FF2E93)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>
          TERMS
        </span>
        <div className="w-20" />
      </div>

      <article className="max-w-2xl mx-auto px-4 sm:px-6 py-8 leading-relaxed text-[#CBD5E1]">
        <h1 className="font-display font-black tracking-wider text-3xl sm:text-4xl mb-2" style={{ background: "linear-gradient(180deg,#00F5FF,#FF2E93)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>
          Terms of Service
        </h1>
        <p className="text-sm text-[#64748B] mb-6">Last updated: October 1, 2026</p>

        <p className="mb-4">
          These terms govern your use of NEON RUSH, a free-to-play browser arcade survival game. By
          playing the game or creating an account, you agree to these terms. If you do not agree, do not
          play.
        </p>

        <h2 className="font-display font-bold tracking-wider text-xl text-[#00F5FF] mt-6 mb-2">Your account</h2>
        <p className="mb-4">
          You may play as a guest or create an account to save progress and rank on the global
          leaderboard. You are responsible for keeping your account credentials secure and for activity
          on your account. Provide accurate information when registering and when using the contact form.
        </p>

        <h2 className="font-display font-bold tracking-wider text-xl text-[#00F5FF] mt-6 mb-2">Acceptable play</h2>
        <p className="mb-4">
          Play fairly. Do not cheat, automate, exploit bugs, or submit fake scores to the leaderboard. We
          may remove scores, suspend accounts, or block access for anyone who abuses the game, harasses
          other players, or attempts to disrupt the service.
        </p>

        <h2 className="font-display font-bold tracking-wider text-xl text-[#00F5FF] mt-6 mb-2">Content &amp; leaderboards</h2>
        <p className="mb-4">
          Your pilot name and any content you submit appear publicly on leaderboards and profiles. Keep
          names and messages respectful and free of infringing or unlawful material. We may remove
          content that violates these terms.
        </p>

        <h2 className="font-display font-bold tracking-wider text-xl text-[#00F5FF] mt-6 mb-2">The service</h2>
        <p className="mb-4">
          NEON RUSH is provided for entertainment "as is" without warranties of any kind. We may change,
          suspend, or discontinue features at any time. Gameplay currency, skins, and credits have no
          real-world monetary value and cannot be exchanged for cash.
        </p>

        <h2 className="font-display font-bold tracking-wider text-xl text-[#00F5FF] mt-6 mb-2">Liability</h2>
        <p className="mb-4">
          To the fullest extent permitted by law, we are not liable for any indirect, incidental, or
          consequential damages arising from your use of the game. Our total liability is limited to the
          amount you paid us to use the service — which, for a free game, is zero.
        </p>

        <h2 className="font-display font-bold tracking-wider text-xl text-[#00F5FF] mt-6 mb-2">Changes</h2>
        <p className="mb-4">
          We may update these terms as the game evolves. Continued use after changes means you accept the
          updated terms. Questions? Reach us through the <Link to="/contact" className="text-[#00F5FF] hover:underline">Contact page</Link>.
        </p>
      </article>
    </div>
  );
}