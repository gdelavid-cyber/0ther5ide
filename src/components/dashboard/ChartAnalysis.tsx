"use client";

import LiveTradingViewChart from "@/components/charts/LiveTradingViewChart";

export default function ChartAnalysis() {
  return (
    <div className="glass-panel p-3.5 flex flex-col h-full glow-border">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-accent font-bold text-xs font-mono tracking-wider">LIVE INSTITUTIONAL TRADING TERMINAL</span>
          <span className="w-2 h-2 rounded-full bg-accent signal-pulse" />
        </div>
        <span className="text-[10px] text-muted font-mono">NASDAQ · NYSE · KRAKEN L3 DIRECT</span>
      </div>

      <div className="flex-1 w-full min-h-[420px]">
        <LiveTradingViewChart symbol="NVDA" height={420} />
      </div>
    </div>
  );
}
