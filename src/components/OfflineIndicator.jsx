import React from "react";
import { WifiOff } from "lucide-react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

// Small, unobtrusive offline badge. Pointer-events-none so it never blocks
// gameplay or menus, and it never interrupts an active run.
export default function OfflineIndicator() {
  const online = useOnlineStatus();
  if (online) return null;
  return (
    <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
      <div className="flex items-center gap-1.5 rounded-full border border-[#FF3B5C]/40 bg-[#0A0B14]/90 backdrop-blur px-3 py-1.5 shadow-lg">
        <WifiOff size={13} className="text-[#FF3B5C]" />
        <span className="text-xs font-display font-bold tracking-wider text-[#FF3B5C] uppercase">Offline</span>
      </div>
    </div>
  );
}