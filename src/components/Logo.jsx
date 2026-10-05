import React from "react";
import { Image } from "@/components/ui/image";

const LOGO_URL = "https://media.base44.com/images/public/6abc076309d8e4feed4a19f2/da8d6d4f5_d3ccb381d_logo.png";

export default function Logo({ size = 48, rounded = "rounded-xl", className = "" }) {
  return (
    <div
      className={`shrink-0 overflow-hidden ${rounded} ${className}`}
      style={{
        width: size,
        height: size,
        boxShadow: "0 0 14px rgba(0,229,255,0.35), 0 0 6px rgba(245,29,92,0.2)",
      }}
    >
      <Image
        src={LOGO_URL}
        alt="NEON RUSH"
        className="w-full h-full"
        fittingType="fill"
      />
    </div>
  );
}