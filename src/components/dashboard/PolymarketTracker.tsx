"use client";

import { useState } from "react";

interface PredictionMarket {
  id: string;
  category: "GEO" | "FED" | "COMMODITY" | "DEFENSE";
  title: string;
  probability: number;
  change24h: number;
  volume: string;
  resolution: string;
  impactAsset: string;
  impactVerdict: string;
}

const MARKETS: PredictionMarket[] = [
  {
    id: "poly-1",
    category: "GEO",
    title: "Israel / Iran Direct Military Engagement in 2026",
    probability: 72,
    change24h: +14.2,
    volume: "$6.8M",
    resolution: "Dec 31, 2026",
    impactAsset: "OIL / GOLD",
    impactVerdict: "Energy Risk Premium Bullish (+18%)",
  },
  {
    id: "poly-2",
    category: "DEFENSE",
    title: "Taiwan Strait Maritime Quarantine / ADIZ Breach",
    probability: 38,
    change24h: +5.4,
    volume: "$3.4M",
    resolution: "Q4 2026",
    impactAsset: "NVDA / TSM",
    impactVerdict: "Semiconductor Supply Chain Squeeze",
  },
  {
    id: "poly-3",
    category: "FED",
    title: "Federal Reserve 50bps Benchmark Rate Cut in next FOMC",
    probability: 64,
    change24h: -4.1,
    volume: "$18.2M",
    resolution: "Next FOMC",
    impactAsset: "BTC / SPY",
    impactVerdict: "High Liquidity Surge Bullish",
  },
  {
    id: "poly-4",
    category: "COMMODITY",
    title: "Brent Crude Oil Surges Above $95/bbl Before Winter",
    probability: 78,
    change24h: +18.9,
    volume: "$4.1M",
    resolution: "Nov 30, 2026",
    impactAsset: "XOM / CVX",
    impactVerdict: "Refining Margin & Inflation Spike",
  },
  {
    id: "poly-5",
    category: "DEFENSE",
    title: "Red Sea Commercial Shipping Normalization in 2026",
    probability: 16,
    change24h: -7.5,
    volume: "$2.1M",
    resolution: "Dec 31, 2026",
    impactAsset: "ZIM / MAERSK",
    impactVerdict: "Freight Rates Sustained Elevated",
  },
];

export default function PolymarketTracker() {
  const [filter, setFilter] = useState<string>("ALL");

  const filtered = filter === "ALL" ? MARKETS : MARKETS.filter((m) => m.category === filter);

  return (
    <div className="glass-panel p-4 flex flex-col h-full font-mono text-xs shadow-xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-border/40">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-400 signal-pulse" />
          <span className="text-purple-300 font-bold text-sm tracking-wider">POLYMARKET CRISIS ORACLE</span>
          <span className="text-[10px] text-muted hidden sm:inline">· LIVE PROBABILITY DECRYPT</span>
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-1">
          {["ALL", "GEO", "DEFENSE", "FED", "COMMODITY"].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-2 py-0.5 rounded text-[9px] transition font-bold ${
                filter === cat
                  ? "bg-purple-500/20 border border-purple-400/50 text-purple-300 shadow-sm"
                  : "bg-surface border border-border/40 text-muted hover:text-fg"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Probability Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 overflow-y-auto flex-1 pr-1">
        {filtered.map((item) => {
          const isUp = item.change24h >= 0;
          const probColor =
            item.probability >= 70
              ? "text-red-400 border-red-500/40 bg-red-500/10"
              : item.probability >= 40
              ? "text-yellow-300 border-yellow-500/40 bg-yellow-500/10"
              : "text-green-400 border-green-500/40 bg-green-500/10";

          const barColor =
            item.probability >= 70
              ? "bg-gradient-to-r from-yellow-500 to-red-500"
              : item.probability >= 40
              ? "bg-gradient-to-r from-cyan-500 to-yellow-400"
              : "bg-gradient-to-r from-emerald-500 to-cyan-400";

          return (
            <div
              key={item.id}
              className="p-3 rounded-xl bg-surface/70 border border-border/50 hover:border-purple-400/40 transition shadow-md flex flex-col justify-between space-y-2.5 backdrop-blur-md"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[9px] text-muted">
                  <span className="px-1.5 py-0.5 rounded bg-bg border border-border/60 text-purple-300 font-bold">
                    {item.category}
                  </span>
                  <span>VOL: {item.volume}</span>
                </div>

                <h4 className="text-xs font-bold text-fg/95 leading-snug">
                  {item.title}
                </h4>
              </div>

              {/* Probability Meter */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className={`px-2 py-0.5 rounded border text-[11px] font-mono ${probColor}`}>
                    {item.probability}% CHANCE
                  </span>
                  <span className={`text-[10px] font-mono ${isUp ? "text-red-400" : "text-green-400"}`}>
                    {isUp ? "▲ +" : "▼ "}{item.change24h}% (24h)
                  </span>
                </div>

                <div className="w-full h-1.5 rounded-full bg-bg/80 overflow-hidden border border-border/40">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${barColor}`}
                    style={{ width: `${item.probability}%` }}
                  />
                </div>
              </div>

              {/* Asset Impact Footnote */}
              <div className="pt-2 border-t border-border/30 flex items-center justify-between text-[9px] text-muted">
                <span>IMPACT: <strong className="text-accent">{item.impactAsset}</strong></span>
                <span className="text-[8.5px] text-fg/80 truncate max-w-[150px]">{item.impactVerdict}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
