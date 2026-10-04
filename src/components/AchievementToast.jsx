import React from "react";
import { Award } from "lucide-react";

export default function AchievementToast({ toasts }) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="flex items-center gap-3 rounded-xl border bg-[#0B1020]/95 backdrop-blur px-4 py-3 shadow-lg min-w-[220px]"
          style={{ borderColor: `${t.color}55`, boxShadow: `0 0 20px ${t.color}33`, animation: "nr-toast 0.4s ease-out" }}
        >
          <Award size={20} style={{ color: t.color }} />
          <div>
            <div className="text-xs uppercase tracking-widest text-[#94A3B8]">{t.title}</div>
            <div className="font-display font-bold text-sm" style={{ color: t.color }}>{t.body}</div>
          </div>
        </div>
      ))}
    </div>
  );
}