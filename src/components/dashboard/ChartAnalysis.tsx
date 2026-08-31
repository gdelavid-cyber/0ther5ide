"use client";

import LiveTradingViewChart from "@/components/charts/LiveTradingViewChart";

export default function ChartAnalysis() {
  return (
    <div className="glass-panel p-4 flex flex-col h-full">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-accent font-bold text-sm font-mono">LIVE MARKET TERMINAL</span>
          <span className="w-2 h-2 rounded-full bg-accent signal-pulse" />
        </div>
        <span className="text-[10px] text-muted font-mono">KRAKEN & NASDAQ DIRECT EXCHANGE FEED</span>
      </div>

      <div className="flex-1 min-h-[300px]">
        <LiveTradingViewChart symbol="NVDA" height={320} />
      </div>
    </div>
  );
}
