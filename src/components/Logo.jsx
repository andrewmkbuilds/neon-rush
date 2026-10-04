import React from "react";

export default function Logo({ size = 48, rounded = "rounded-xl", className = "" }) {
  return (
    <div
      className={`shrink-0 overflow-hidden ${rounded} ${className}`}
      style={{
        width: size,
        height: size,
        boxShadow: "0 0 14px rgba(0,229,255,0.35), 0 0 6px rgba(245,0,87,0.2)",
      }}
    >
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <rect width="100" height="100" rx="22" fill="#0B1020" />
        <polygon points="42,45 36,52 52,52 18,92" fill="#F50057" />
        <polygon points="28,45 42,45 52,52 36,52" fill="#7F26C6" />
        <polygon points="58,8 28,45 42,45 36,52" fill="#00E5FF" />
      </svg>
    </div>
  );
}