"use client";

import { useState, useEffect, useCallback } from "react";
import { formatMoney, timeAgo } from "@/lib/utils";
import type { OrderFlowData } from "@/lib/types";

export default function OrderFlowPanel() {
  const [data, setData] = useState<OrderFlowData | null>(null);
  const [selectedTicker, setSelectedTicker] = useState("NVDA");
  const [activeSubTab, setActiveSubTab] = useState<"options" | "darkpool" | "dom" | "decomposition">("options");
  const [flowFilter, setFlowFilter] = useState<"all" | "sweeps" | "bullish" | "bearish">("all");
  const [loading, setLoading] = useState(true);

  const fetchFlow = useCallback(async (ticker: string) => {
    try {
      const res = await fetch("/api/orderflow?ticker=" + ticker);
      if (!res.ok) return;
      setData(await res.json());
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchFlow(selectedTicker);
    const interval = setInterval(() => fetchFlow(selectedTicker), 30000);
    return () => clearInterval(interval);
  }, [selectedTicker, fetchFlow]);

  const filteredOptions = (data?.optionsFlow || []).filter((f) => {
    if (flowFilter === "sweeps") return f.type === "SWEEP" || f.type === "GOLDEN_SWEEP";
    if (flowFilter === "bullish") return f.sentiment === "BULLISH";
    if (flowFilter === "bearish") return f.sentiment === "BEARISH";
    return true;
  });

  return (
    <div className="glass-panel p-4 flex flex-col h-full glow-border">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2 border-b border-border/30">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-accent signal-pulse" />
          <span className="text-accent font-bold text-sm tracking-wider">INSTITUTIONAL ORDER FLOW</span>
          <span className="text-[9px] text-muted bg-surface px-1.5 py-0.5 rounded border border-border/50">
            LEVEL 3 + TOTALVIEW
          </span>
        </div>

        {/* Ticker Selector */}
        <div className="flex items-center gap-1 overflow-x-auto">
          {["NVDA", "PLTR", "TSLA", "AAPL", "SPY", "LMT"].map((t) => (
            <button
              key={t}
              onClick={() => setSelectedTicker(t)}
              className={"px-2 py-0.5 text-[10px] font-mono rounded transition " + (
                selectedTicker === t
                  ? "bg-accent text-bg font-bold shadow-sm shadow-accent/20"
                  : "bg-surface/60 text-muted hover:text-fg"
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Metric Highlights Banner */}
      {data && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3 text-xs">
          <div className="bg-surface/50 p-2 rounded border border-border/40">
            <div className="text-[10px] text-muted">Institutional Dominance</div>
            <div className="text-sm font-bold text-accent">
              {data.decomposition.institutionalDominance}%
            </div>
            <div className="text-[9px] text-muted">BMLL XTech decoded</div>
          </div>
          <div className="bg-surface/50 p-2 rounded border border-border/40">
            <div className="text-[10px] text-muted">Options Sweep Vol</div>
            <div className="text-sm font-bold text-fg">
              {formatMoney(data.summary.totalSweepVolume)}
            </div>
            <div className={"text-[9px] font-bold " + (data.summary.bullishFlowPercent > 50 ? "text-low" : "text-warn")}>
              {data.summary.bullishFlowPercent}% Bullish Flow
            </div>
          </div>
          <div className="bg-surface/50 p-2 rounded border border-border/40">
            <div className="text-[10px] text-muted">Dark Pool Volume</div>
            <div className="text-sm font-bold text-fg">
              {formatMoney(data.summary.darkPoolTotalValue)}
            </div>
            <div className="text-[9px] text-muted">{data.decomposition.darkPoolVolumeRatio}% off-exchange</div>
          </div>
          <div className="bg-surface/50 p-2 rounded border border-border/40">
            <div className="text-[10px] text-muted">Book Imbalance (L2)</div>
            <div className={"text-sm font-bold " + (data.orderBook.imbalanceRatio > 1 ? "text-low" : "text-warn")}>
              {data.orderBook.imbalanceRatio}x Bid/Ask
            </div>
            <div className="text-[9px] text-muted">Nasdaq TotalView depth</div>
          </div>
        </div>
      )}

      {/* Sub-Tab Navigation */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1">
          {[
            { id: "options", label: "OPTIONS FLOW & SWEEPS" },
            { id: "darkpool", label: "DARK POOL PRINTS" },
            { id: "dom", label: "L2 ORDER BOOK" },
            { id: "decomposition", label: "DECOMPOSITION" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={"px-2.5 py-1 text-[10px] uppercase tracking-wider rounded transition " + (
                activeSubTab === tab.id
                  ? "bg-accent/20 text-accent font-bold border border-accent/40"
                  : "text-muted hover:text-fg/80"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeSubTab === "options" && (
          <div className="flex items-center gap-1">
            {[
              { id: "all", label: "ALL" },
              { id: "sweeps", label: "SWEEPS" },
              { id: "bullish", label: "CALLS" },
              { id: "bearish", label: "PUTS" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFlowFilter(f.id as any)}
                className={"px-1.5 py-0.5 text-[9px] rounded font-mono " + (
                  flowFilter === f.id ? "bg-border text-fg font-bold" : "text-muted hover:text-fg"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tab 1: Options Flow */}
      {activeSubTab === "options" && (
        <div className="flex-1 overflow-y-auto space-y-1.5 min-h-0">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-14 bg-border/20 rounded animate-pulse" />
            ))
          ) : (
            filteredOptions.map((item) => (
              <div
                key={item.id}
                className={"p-2 rounded border transition " + (
                  item.sentiment === "BULLISH"
                    ? "bg-green-500/5 border-green-500/30 hover:border-green-500/60"
                    : "bg-red-500/5 border-red-500/30 hover:border-red-500/60"
                )}
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className={"px-1.5 py-0.5 text-[9px] font-bold rounded " + (
                        item.type === "GOLDEN_SWEEP"
                          ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/50"
                          : item.type === "SWEEP"
                          ? "bg-accent/20 text-accent border border-accent/40"
                          : "bg-surface text-muted border border-border/50"
                      )}
                    >
                      {item.type}
                    </span>
                    <span className="font-bold text-fg">{item.ticker}</span>
                    <span className="text-muted font-mono">
                      {"$" + item.strike + " " + item.contractType + " · " + item.expiry}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted font-mono">{timeAgo(item.timestamp)}</span>
                </div>

                <div className="flex items-center justify-between mt-1 text-[11px]">
                  <div className="flex items-center gap-3">
                    <span className="text-muted">
                      Prem: <strong className={item.sentiment === "BULLISH" ? "text-low" : "text-warn"}>
                        {formatMoney(item.premium)}
                      </strong>
                    </span>
                    <span className="text-muted">Qty: <strong className="text-fg">{item.size.toLocaleString()}</strong></span>
                    <span className="text-muted">
                      Vol/OI: <strong className={item.volOiRatio > 3 ? "text-yellow-400 font-bold" : "text-fg"}>
                        {item.volOiRatio}x
                      </strong>
                    </span>
                  </div>
                  <span className="text-[9px] text-muted truncate max-w-[180px]">{item.venue}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 2: Dark Pool Prints */}
      {activeSubTab === "darkpool" && (
        <div className="flex-1 overflow-y-auto space-y-1.5 min-h-0">
          {(data?.darkPoolPrints || []).map((dp) => (
            <div key={dp.id} className="p-2 rounded bg-surface/50 border border-border/40 hover:border-accent/40 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-accent">{dp.ticker}</span>
                  <span className="font-mono text-fg">{"$" + dp.price.toFixed(2)}</span>
                  <span className={"text-[9px] font-bold px-1 py-0.5 rounded " + (
                    dp.side === "ABOVE_ASK" ? "bg-green-500/20 text-low" : dp.side === "BELOW_BID" ? "bg-red-500/20 text-warn" : "bg-surface text-muted"
                  )}>
                    {dp.side}
                  </span>
                </div>
                <span className="text-[10px] text-muted">{timeAgo(dp.timestamp)}</span>
              </div>
              <div className="flex items-center justify-between mt-1 text-[11px]">
                <span className="text-muted">Size: <strong className="text-fg">{dp.size.toLocaleString()} shares</strong></span>
                <span className="text-muted">Total: <strong className="text-accent">{formatMoney(dp.premium)}</strong></span>
                <span className="text-[9px] text-muted">{dp.exchange}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: Level 2 DOM Ladder */}
      {activeSubTab === "dom" && (
        <div className="flex-1 overflow-y-auto min-h-0 font-mono text-xs">
          <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-muted pb-1 border-b border-border/30">
            <div>BIDS (BUY LIQUIDITY)</div>
            <div className="text-right">ASKS (SELL LIQUIDITY)</div>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-1">
            {/* Bids */}
            <div className="space-y-0.5">
              {(data?.orderBook.bids || []).map((b, i) => (
                <div key={i} className={"flex items-center justify-between p-1 rounded " + (b.isImbalance ? "bg-green-500/20 border border-green-500/50" : "bg-surface/30")}>
                  <span className="text-low font-bold">{"$" + b.price.toFixed(2)}</span>
                  <span className="text-muted">{b.size.toLocaleString()}</span>
                </div>
              ))}
            </div>
            {/* Asks */}
            <div className="space-y-0.5">
              {(data?.orderBook.asks || []).map((a, i) => (
                <div key={i} className={"flex items-center justify-between p-1 rounded " + (a.isImbalance ? "bg-red-500/20 border border-red-500/50" : "bg-surface/30")}>
                  <span className="text-muted">{a.size.toLocaleString()}</span>
                  <span className="text-warn font-bold">{"$" + a.price.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: BMLL Decomposition */}
      {activeSubTab === "decomposition" && data && (
        <div className="flex-1 overflow-y-auto space-y-3 min-h-0 text-xs">
          <div className="p-3 rounded bg-surface/60 border border-border/50">
            <div className="text-accent font-bold text-sm mb-1">
              BMLL XTECH FLOW DECOMPOSITION — {data.decomposition.ticker}
            </div>
            <p className="text-muted text-[11px]">
              Decodes order-book and off-exchange prints into institutional vs retail market participants.
            </p>
          </div>

          <div className="space-y-2">
            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span>Institutional Market Flow</span>
                <span className="font-bold text-accent">{data.decomposition.institutionalDominance}%</span>
              </div>
              <div className="h-2 bg-surface rounded-full overflow-hidden">
                <div className="h-full bg-accent rounded-full" style={{ width: data.decomposition.institutionalDominance + "%" }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span>Retail Trader Activity</span>
                <span className="text-muted">{data.decomposition.retailShare}%</span>
              </div>
              <div className="h-2 bg-surface rounded-full overflow-hidden">
                <div className="h-full bg-yellow-500 rounded-full" style={{ width: data.decomposition.retailShare + "%" }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span>HFT & Market Maker Arbitrage</span>
                <span className="text-muted">{data.decomposition.hftShare}%</span>
              </div>
              <div className="h-2 bg-surface rounded-full overflow-hidden">
                <div className="h-full bg-purple-500 rounded-full" style={{ width: data.decomposition.hftShare + "%" }} />
              </div>
            </div>
          </div>

          <div className="p-2.5 rounded bg-accent/10 border border-accent/30 text-[11px]">
            <div className="font-bold text-accent">DECODED VERDICT: {data.decomposition.verdict}</div>
            <div className="text-muted mt-0.5">
              Net Institutional Delta: +{data.decomposition.institutionalNetDelta.toLocaleString()} shares absorbed · Gamma Regime: {data.decomposition.gammaExposureGEX}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-[10px] text-muted mt-2 pt-2 border-t border-border/30 flex items-center justify-between">
        <span>Nasdaq TotalView · Blue Ocean · Flowasis · BMLL Stack</span>
        <span className="text-accent">STREAM ACTIVE</span>
      </div>
    </div>
  );
}
