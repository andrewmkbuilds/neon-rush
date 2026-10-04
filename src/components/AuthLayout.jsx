import React from "react";

export default function AuthLayout({ icon: Icon, title, subtitle, footer, children }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#05060D] px-4 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4" style={{ background: "linear-gradient(135deg,#00F5FF,#8B5CF6)", boxShadow: "0 0 20px rgba(0,245,255,0.4)" }}>
            <Icon className="w-7 h-7 text-[#05060D]" aria-hidden="true" />
          </div>
          <h1 className="text-3xl font-display font-bold tracking-tight text-[#F8FAFC]">{title}</h1>
          {subtitle && <p className="text-[#94A3B8] mt-2">{subtitle}</p>}
        </div>
        <div className="bg-[#0B1020] rounded-2xl shadow-lg border border-[#00F5FF]/25 p-8" style={{ boxShadow: "0 0 30px rgba(0,245,255,0.08)" }}>
          {children}
        </div>
        {footer && (
          <p className="text-center text-sm text-[#94A3B8] mt-6">{footer}</p>
        )}
      </div>
    </div>
  );
}