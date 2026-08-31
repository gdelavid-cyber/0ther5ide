"use client";

import { useState, useEffect } from "react";

const DISPATCH_NOTIFICATIONS = [
  { id: "d1", tag: "FININT", color: "text-accent", border: "border-accent/40", text: "⚡ AI ALERT: $16.0M NVDA Insider buy cluster flagged (Jensen Huang — Form 4)" },
  { id: "d2", tag: "GEOINT", color: "text-red-400", border: "border-red-500/40", text: "🛰️ THERMAL ANOMALY: 4 VIIRS 375m fire pixels detected in Bab-el-Mandeb / Red Sea" },
  { id: "d3", tag: "SIGINT", color: "text-yellow-400", border: "border-yellow-500/40", text: "🌐 SIGINT INTERCEPT: GDELT escalation index spiked +18.4% in Eastern Mediterranean corridor" },
  { id: "d4", tag: "DARK POOL", color: "text-blue-400", border: "border-blue-500/40", text: "🐋 LIQUIDITY: 62.4% Off-exchange block accumulation detected in TSLA / SPY ADF prints" },
  { id: "d5", tag: "AERIAL", color: "text-purple-400", border: "border-purple-500/40", text: "✈️ RADAR VECTOR: OpenSky transponder dark-zone cluster observed in Taiwan Strait ADIZ" },
];

export default function AINotificationBar() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % DISPATCH_NOTIFICATIONS.length);
    }, 7000);
    return () => clearInterval(timer);
  }, []);

  const active = DISPATCH_NOTIFICATIONS[index];

  return (
    <div className="w-full bg-surface/90 backdrop-blur-md border border-border/60 rounded-xl px-3.5 py-2 flex items-center justify-between gap-3 font-mono text-xs shadow-lg overflow-hidden transition-all">
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <span className="w-2 h-2 rounded-full bg-accent signal-pulse flex-shrink-0" />
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border bg-bg/80 ${active.color} ${active.border} flex-shrink-0`}>
          {active.tag}
        </span>
        <span className="text-fg/90 truncate text-[11px] animate-fade-in font-medium">
          {active.text}
        </span>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-[10px] text-muted hidden md:inline">AUTO-SCAN 24/7</span>
        <div className="flex gap-1">
          {DISPATCH_NOTIFICATIONS.map((_, i) => (
            <span
              key={i}
              className={`w-1.5 h-1.5 rounded-full transition-all ${
                i === index ? "bg-accent w-3.5" : "bg-border/60"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
