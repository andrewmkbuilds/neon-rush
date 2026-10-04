import React, { useState } from "react";
import { Play, RotateCcw, Home, ArrowLeft } from "lucide-react";

export default function PauseMenu({ onResume, onRestart, onMenu }) {
  const [confirm, setConfirm] = useState(false);
  const btn =
    "w-full py-3 rounded-xl font-display font-bold tracking-wider flex items-center justify-center gap-2 active:scale-95 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00F5FF]/50";
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#05060D]/85 backdrop-blur-md">
      <div className="w-[min(90vw,360px)] rounded-2xl border border-[#00F5FF]/30 bg-[#0B1020]/95 p-6 shadow-[0_0_40px_rgba(0,245,255,0.15)]">
        <h2
          className="font-display text-3xl font-bold text-center tracking-widest text-[#00F5FF]"
          style={{ textShadow: "0 0 16px rgba(0,245,255,0.6)" }}
        >
          {confirm ? "QUIT RUN?" : "PAUSED"}
        </h2>
        <div className="mt-6 space-y-3">
          {confirm ? (
            <>
              <p className="text-center text-sm text-[#94A3B8] -mt-1 mb-1">Your current run will be lost.</p>
              <button
                onClick={() => setConfirm(false)}
                onMouseDown={(e) => e.preventDefault()}
                className={`${btn} border border-white/15 bg-white/5 text-[#F8FAFC] hover:bg-white/10`}
              >
                <ArrowLeft size={18} /> CANCEL
              </button>
              <button
                onClick={onMenu}
                onMouseDown={(e) => e.preventDefault()}
                className={`${btn} bg-[#FF3B5C] text-white hover:brightness-110`}
              >
                <Home size={18} /> QUIT TO MENU
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onResume}
                onMouseDown={(e) => e.preventDefault()}
                className={`${btn} bg-[#00F5FF] text-[#05060D] hover:brightness-110`}
              >
                <Play size={18} /> RESUME
              </button>
              <button
                onClick={onRestart}
                onMouseDown={(e) => e.preventDefault()}
                className={`${btn} border border-white/15 bg-white/5 text-[#F8FAFC] hover:bg-white/10`}
              >
                <RotateCcw size={18} /> RESTART
              </button>
              <button
                onClick={() => setConfirm(true)}
                onMouseDown={(e) => e.preventDefault()}
                className={`${btn} border border-white/10 bg-transparent text-[#94A3B8] hover:text-[#F8FAFC]`}
              >
                <Home size={18} /> MAIN MENU
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}