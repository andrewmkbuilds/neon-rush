import React, { useState, useCallback } from "react";

export default function NeonButton({
  children,
  onClick,
  onPointerDown,
  color = "#00F5FF",
  variant = "primary",
  size = "md",
  className = "",
  style = {},
  disabled = false,
  pulse = false,
  ...rest
}) {
  const [ripples, setRipples] = useState([]);

  const handlePointerDown = useCallback(
    (e) => {
      if (disabled) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const id = Date.now() + Math.random();
      setRipples((r) => [...r, { id, x, y }]);
      setTimeout(() => setRipples((r) => r.filter((rip) => rip.id !== id)), 600);
      if (onPointerDown) onPointerDown(e);
    },
    [disabled, onPointerDown]
  );

  const sizeClasses = {
    sm: "px-3 py-2 text-xs",
    md: "px-4 py-3 text-sm",
    lg: "px-6 py-4 text-base",
  };

  const variantStyles = {
    primary: {
      background: `linear-gradient(90deg, ${color}, ${color}cc)`,
      color: "#05060D",
      boxShadow: `0 0 24px ${color}55`,
      border: "none",
    },
    secondary: {
      background: "rgba(255,255,255,0.06)",
      color: "#F8FAFC",
      border: `1px solid ${color}55`,
    },
    ghost: {
      background: "transparent",
      color: color,
      border: `1px solid ${color}33`,
    },
  };

  return (
    <button
      onPointerDown={handlePointerDown}
      onClick={onClick}
      disabled={disabled}
      className={`relative overflow-hidden font-display font-bold tracking-wider rounded-xl active:scale-95 transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 touch-none select-none ${sizeClasses[size]} ${className}`}
      style={{
        ...variantStyles[variant],
        ...style,
        animation: pulse ? "nr-glow-pulse 2s ease-in-out infinite" : undefined,
        "--glow-color": color,
      }}
      {...rest}
    >
      {ripples.map((r) => (
        <span
          key={r.id}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: r.x,
            top: r.y,
            width: 24,
            height: 24,
            marginLeft: -12,
            marginTop: -12,
            background: variant === "primary" ? "rgba(255,255,255,0.5)" : `${color}55`,
            animation: "nr-ripple 0.6s ease-out forwards",
          }}
        />
      ))}
      <span className="relative z-10 flex items-center justify-center gap-2">{children}</span>
    </button>
  );
}