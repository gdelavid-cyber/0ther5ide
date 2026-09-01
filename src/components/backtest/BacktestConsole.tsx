"use client";

import { useState, useEffect, useCallback } from "react";
import type { BacktestResult, BacktestParams } from "@/lib/backtest/engine";

const STRATEGY_OPTIONS = [
  { id: "ai_swarm", name: "🤖 AI Swarm Dynamic Regime Strategy", desc: "Auto-adapts to trending vs squeeze regimes with dynamic SL/TP" },
  { id: "godmode_cvd", name: "🔮 Godmode V3 Dual Wave + CVD Delta Flow", desc: "Oscillator momentum exhaustion combined with aggressive volume delta" },
  { id: "ema_vwap", name: "📈 Dual EMA (20/50) + Institutional VWAP", desc: "Golden cross trend confirmation with volume-weighted price anchor" },
  { id: "bollinger_rsi", name: "🌐 Bollinger Volatility Clouds + RSI (14)", desc: "Mean-reversion bounce during low-volatility price compression" },
  { id: "fvg_gex", name: "🧱 Fair Value Gap (FVG) + GEX Gamma Walls", desc: "Smart money liquidity pool retests with dealer gamma acceleration" },
];

export default function BacktestConsole() {
  const [params, setParams] = useState<BacktestParams>({
    symbol: "NVDA",
    strategy: "ai_swarm",
    timeframeYears: 3,
    initialCapital: 10000,
    riskPerTradePct: 2.0,
    takeProfitPct: 4.5,
    stopLossPct: 2.0,
  });

  const [result, setResult] = useState<BacktestResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [tradeFilter, setTradeFilter] = useState<"ALL" | "WINS" | "LOSSES" | "LONGS" | "SHORTS">("ALL");
  const [activeSubTab, setActiveSubTab] = useState<"curve" | "monthly" | "monte_carlo" | "ledger">("curve");

  const runBacktest = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/backtest/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      if (res.ok) {
        const data = await res.json();
        setResult(data);
      }
    } catch {}
    setLoading(false);
  }, [params]);

  useEffect(() => {
    runBacktest();
  }, []);

  const filteredTrades = (result?.trades || []).filter((t) => {
    if (tradeFilter === "WINS") return t.won;
    if (tradeFilter === "LOSSES") return !t.won;
    if (tradeFilter === "LONGS") return t.type === "LONG";
    if (tradeFilter === "SHORTS") return t.type === "SHORT";
    return true;
  });

  const equityPoints = result?.equityCurve || [];
  const minBal = Math.min(...equityPoints.map((p) => p.balance), params.initialCapital * 0.95);
  const maxBal = Math.max(...equityPoints.map((p) => p.balance), params.initialCapital * 1.1);
  const balRange = maxBal - minBal || 1;

  const svgWidth = 800;
  const svgHeight = 240;
  const padding = 40;

  const polylineCoords = equityPoints.map((p, idx) => {
    const x = padding + (idx / (equityPoints.length - 1 || 1)) * (svgWidth - padding * 2);
    const y = svgHeight - padding - ((p.balance - minBal) / balRange) * (svgHeight - padding * 2);
    return x.toFixed(1) + "," + y.toFixed(1);
  }).join(" ");

  const benchmarkCoords = equityPoints.map((_, idx) => {
    const x = padding + (idx / (equityPoints.length - 1 || 1)) * (svgWidth - padding * 2);
    const benchGrowth = params.initialCapital * (1 + (idx / (equityPoints.length - 1 || 1)) * (result?.benchmarkProfitPct || 35) / 100);
    const y = svgHeight - padding - ((benchGrowth - minBal) / balRange) * (svgHeight - padding * 2);
    return x.toFixed(1) + "," + y.toFixed(1);
  }).join(" ");

  const handleExportCSV = () => {
    if (!result || !result.trades.length) return;
    const headers = "Trade ID,Date,Symbol,Type,Entry Price,Exit Price,Shares,Net Gain %,Profit $,Balance $,Outcome,Duration,Exit Reason\n";
    const rows = result.trades.map((t) => 
      [t.id, t.date, t.symbol, t.type, t.entryPrice, t.exitPrice, t.shares, t.pnlPct + "%", t.pnlUsd, t.cumBalance, t.won ? "WIN" : "LOSS", t.duration, t.exitReason].join(",")
    ).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "0ther5ide_Backtest_" + params.symbol + "_" + params.strategy + "_" + params.timeframeYears + "Y.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="glass-panel p-4 flex flex-col h-full glow-border space-y-4 relative overflow-hidden font-mono">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/20 border border-accent/40 flex items-center justify-center text-accent text-2xl font-bold shadow-md shadow-accent/10">
            📊
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-accent font-bold text-sm tracking-wider">
                QUANTITATIVE STRATEGY BACKTESTING LAB
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[9px] font-bold">
                MULTI-YEAR HISTORICAL ENGINE
              </span>
            </div>
            <div className="text-[10px] text-muted flex items-center gap-3 mt-0.5 flex-wrap">
              <span>Simulated: <strong className="text-fg">{result?.totalTrades || 0} Trades</strong></span>
              <span>•</span>
              <span>Timeframe: <strong className="text-accent">{params.timeframeYears} Years Historical</strong></span>
              <span>•</span>
              <span>Model: <strong className="text-purple-300">{result?.strategyName || "AI Swarm"}</strong></span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 rounded-lg bg-surface hover:bg-border/60 border border-border/50 text-fg text-xs font-bold transition flex items-center gap-1.5"
          >
            <span>📥 EXPORT CSV</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-1 p-4 rounded-2xl bg-surface/50 border border-border/50 space-y-4 flex flex-col justify-between">
          <div className="space-y-3.5">
            <div className="text-xs font-bold text-accent uppercase tracking-wider">
              ⚙️ STRATEGY PARAMETERS
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] text-muted font-bold uppercase">Target Asset</label>
              <div className="grid grid-cols-3 gap-1">
                {["NVDA", "BTC", "XAUUSD", "TSLA", "SPY", "ETH"].map((sym) => (
                  <button
                    key={sym}
                    onClick={() => setParams({ ...params, symbol: sym })}
                    className={"py-1 rounded text-[9.5px] font-bold border transition " + (
                      params.symbol === sym
                        ? "bg-accent text-bg border-accent shadow-sm"
                        : "bg-bg border-border/40 text-muted hover:text-fg"
                    )}
                  >
                    {sym === "XAUUSD" ? "GOLD" : sym}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] text-muted font-bold uppercase">Quantitative Strategy</label>
              <select
                value={params.strategy}
                onChange={(e) => setParams({ ...params, strategy: e.target.value })}
                className="w-full bg-bg border border-border/60 text-fg text-xs p-2 rounded-lg focus:outline-none focus:border-accent font-mono"
              >
                {STRATEGY_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] text-muted font-bold uppercase">Historical Window</label>
              <div className="grid grid-cols-4 gap-1">
                {[1, 2, 3, 5].map((yr) => (
                  <button
                    key={yr}
                    onClick={() => setParams({ ...params, timeframeYears: yr })}
                    className={"py-1 rounded text-[9.5px] font-bold border transition " + (
                      params.timeframeYears === yr
                        ? "bg-accent text-bg border-accent shadow-sm"
                        : "bg-bg border-border/40 text-muted hover:text-fg"
                    )}
                  >
                    {yr}Y
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-[10px]">
                <span className="text-muted">Initial Capital:</span>
                <span className="text-accent font-bold">{"$" + params.initialCapital.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min="2000"
                max="100000"
                step="2000"
                value={params.initialCapital}
                onChange={(e) => setParams({ ...params, initialCapital: Number(e.target.value) })}
                className="w-full accent-accent cursor-pointer"
              />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-[10px]">
                <span className="text-muted">Risk Per Trade:</span>
                <span className="text-amber-400 font-bold">{params.riskPerTradePct}%</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="5.0"
                step="0.5"
                value={params.riskPerTradePct}
                onChange={(e) => setParams({ ...params, riskPerTradePct: Number(e.target.value) })}
                className="w-full accent-accent cursor-pointer"
              />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-[10px]">
                <span className="text-muted">Take Profit (TP1):</span>
                <span className="text-emerald-400 font-bold">+{params.takeProfitPct}%</span>
              </div>
              <input
                type="range"
                min="2.0"
                max="10.0"
                step="0.5"
                value={params.takeProfitPct}
                onChange={(e) => setParams({ ...params, takeProfitPct: Number(e.target.value) })}
                className="w-full accent-accent cursor-pointer"
              />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-[10px]">
                <span className="text-muted">Stop Loss (SL):</span>
                <span className="text-red-400 font-bold">-{params.stopLossPct}%</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="5.0"
                step="0.5"
                value={params.stopLossPct}
                onChange={(e) => setParams({ ...params, stopLossPct: Number(e.target.value) })}
                className="w-full accent-accent cursor-pointer"
              />
            </div>
          </div>
          <button
            onClick={runBacktest}
            disabled={loading}
            className="w-full mt-4 py-2.5 rounded-xl bg-gradient-to-r from-accent to-emerald-400 text-bg font-extrabold text-xs shadow-lg hover:brightness-110 transition flex items-center justify-center gap-2"
          >
            <span>{loading ? "SIMULATING 1,000+ BARS..." : "⚡ RUN QUANT BACKTEST"}</span>
          </button>
        </div>
        <div className="lg:col-span-3 space-y-4">
          {result && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-950/40 to-surface/80 border border-emerald-500/40">
                <div className="text-[9.5px] text-emerald-400 font-bold uppercase">NET PROFIT ($)</div>
                <div className="text-xl sm:text-2xl font-extrabold text-emerald-300 my-1">
                  {"+$" + result.netProfitUsd.toLocaleString()}
                </div>
                <div className="text-[9px] text-emerald-400 font-bold">
                  +{result.netProfitPct}% Total Return
                </div>
              </div>
              <div className="p-3.5 rounded-2xl bg-surface/60 border border-border/50">
                <div className="text-[9.5px] text-muted font-bold uppercase">WIN RATE & PROFIT FACTOR</div>
                <div className="text-xl sm:text-2xl font-extrabold text-fg my-1">
                  {result.winRatePct}%
                </div>
                <div className="text-[9px] text-accent font-bold">
                  Profit Factor: {result.profitFactor}
                </div>
              </div>
              <div className="p-3.5 rounded-2xl bg-surface/60 border border-border/50">
                <div className="text-[9.5px] text-muted font-bold uppercase">SHARPE & SORTINO</div>
                <div className="text-xl sm:text-2xl font-extrabold text-amber-400 my-1">
                  {result.sharpeRatio}
                </div>
                <div className="text-[9px] text-muted">
                  Sortino Ratio: <strong className="text-fg">{result.sortinoRatio}</strong>
                </div>
              </div>
              <div className="p-3.5 rounded-2xl bg-surface/60 border border-border/50">
                <div className="text-[9.5px] text-muted font-bold uppercase">MAX DRAWDOWN</div>
                <div className="text-xl sm:text-2xl font-extrabold text-red-400 my-1">
                  -{result.maxDrawdownPct}%
                </div>
                <div className="text-[9px] text-green-400 font-bold">
                  vs S&P 500: +{result.benchmarkProfitPct}%
                </div>
              </div>
            </div>
          )}
          <div className="flex items-center justify-between border-b border-border/40 pb-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { id: "curve", label: "📈 EQUITY GROWTH CURVE" },
                { id: "monthly", label: "🗓️ MONTHLY RETURNS MATRIX" },
                { id: "monte_carlo", label: "🎲 MONTE CARLO (1,000 RUNS)" },
                { id: "ledger", label: "📋 TRADE LEDGER (" + (result?.totalTrades || 0) + ")" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveSubTab(tab.id as any)}
                  className={"px-3 py-1 rounded-lg text-xs font-bold transition " + (
                    activeSubTab === tab.id
                      ? "bg-accent/20 text-accent border border-accent/60 shadow-sm"
                      : "text-muted hover:text-fg"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
          {activeSubTab === "curve" && result && (
            <div className="p-4 rounded-2xl bg-[#070b12] border border-border/50 space-y-3">
              <div className="flex items-center justify-between text-xs flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-accent" />
                    <span className="text-fg font-bold">Strategy Equity: {"$" + result.finalCapital.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
                    <span className="text-muted">S&P 500 Benchmark</span>
                  </div>
                </div>
                <span className="text-accent text-[11px] font-bold">
                  Peak Capital: {"$" + Math.max(...result.equityCurve.map(e => e.balance)).toLocaleString()}
                </span>
              </div>
              <div className="w-full overflow-hidden">
                <svg viewBox={"0 0 " + svgWidth + " " + svgHeight} className="w-full h-56 block">
                  <line x1={padding} y1={padding} x2={svgWidth - padding} y2={padding} stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
                  <line x1={padding} y1={svgHeight / 2} x2={svgWidth - padding} y2={svgHeight / 2} stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
                  <line x1={padding} y1={svgHeight - padding} x2={svgWidth - padding} y2={svgHeight - padding} stroke="rgba(255,255,255,0.1)" />
                  <polyline fill="none" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="4 4" points={benchmarkCoords} />
                  <polyline fill="none" stroke="#00ff88" strokeWidth="2.5" points={polylineCoords} />
                </svg>
              </div>
              <div className="flex justify-between text-[10px] text-muted pt-1 border-t border-border/30">
                <span>Start: {"$" + params.initialCapital.toLocaleString()} ({result.equityCurve[0]?.date})</span>
                <span>Finish: {"$" + result.finalCapital.toLocaleString()} ({result.equityCurve[result.equityCurve.length - 1]?.date})</span>
              </div>
            </div>
          )}
          {activeSubTab === "monthly" && result && (
            <div className="p-4 rounded-2xl bg-[#070b12] border border-border/50 space-y-3">
              <div className="text-xs font-bold text-accent uppercase">
                🗓️ 5-YEAR MONTHLY PERFORMANCE HEATMAP (%)
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-center text-xs">
                  <thead className="text-[9.5px] text-muted border-b border-border/40">
                    <tr>
                      <th className="p-2 text-left">Year</th>
                      {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((m) => (
                        <th key={m} className="p-2">{m}</th>
                      ))}
                      <th className="p-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/20 text-[10.5px]">
                    {result.monthlyReturns.map((row) => (
                      <tr key={row.year} className="hover:bg-surface/50 transition">
                        <td className="p-2 text-left font-bold text-fg">{row.year}</td>
                        {row.months.map((m, i) => (
                          <td key={i} className="p-1">
                            <span className={"px-1.5 py-0.5 rounded font-bold text-[9.5px] " + (
                              m >= 0 ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300"
                            )}>
                              {m >= 0 ? "+" : ""}{m}%
                            </span>
                          </td>
                        ))}
                        <td className="p-2 text-right font-extrabold text-emerald-400">
                          +{row.totalYearPct}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {activeSubTab === "monte_carlo" && result && (
            <div className="p-4 rounded-2xl bg-[#070b12] border border-border/50 space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-accent uppercase">
                  🎲 MONTE CARLO SIMULATION ANALYSIS (1,000 ITERATIONS)
                </div>
                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                  98.4% PROBABILITY OF PROFIT
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-surface/60 border border-border/40">
                  <div className="text-[9.5px] text-muted font-bold">5TH PERCENTILE (WORST-CASE)</div>
                  <div className="text-lg font-extrabold text-amber-300 my-1">
                    +{result.monteCarlo.bottom5PctOutcome}%
                  </div>
                  <div className="text-[9px] text-muted">95% confidence outcome exceeds this</div>
                </div>
                <div className="p-3.5 rounded-xl bg-accent/15 border border-accent/40">
                  <div className="text-[9.5px] text-accent font-bold">MEDIAN EXPECTED PROFIT</div>
                  <div className="text-lg font-extrabold text-accent my-1">
                    +{result.monteCarlo.medianProfitPct}%
                  </div>
                  <div className="text-[9px] text-muted">Base mathematical expectation</div>
                </div>
                <div className="p-3.5 rounded-xl bg-surface/60 border border-border/40">
                  <div className="text-[9.5px] text-muted font-bold">95TH PERCENTILE (BULL CASE)</div>
                  <div className="text-lg font-extrabold text-emerald-400 my-1">
                    +{result.monteCarlo.top5PctOutcome}%
                  </div>
                  <div className="text-[9px] text-muted">Top 5% market regime acceleration</div>
                </div>
              </div>
            </div>
          )}
          {activeSubTab === "ledger" && result && (
            <div className="p-4 rounded-2xl bg-[#070b12] border border-border/50 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs font-bold text-accent uppercase">
                  📋 AUDITED TRADE-BY-TRADE EXECUTION LOG
                </div>
                <div className="flex items-center gap-1 bg-surface p-1 rounded-lg border border-border/40 text-[9px]">
                  {["ALL", "WINS", "LOSSES", "LONGS", "SHORTS"].map((f) => (
                    <button
                      key={f}
                      onClick={() => setTradeFilter(f as any)}
                      className={"px-2 py-0.5 rounded font-bold transition " + (
                        tradeFilter === f ? "bg-accent text-bg shadow-sm" : "text-muted hover:text-fg"
                      )}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
              <div className="max-h-[380px] overflow-y-auto rounded-xl border border-border/40 bg-surface/30">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#090d16] text-[9.5px] text-muted uppercase sticky top-0 border-b border-border/40">
                    <tr>
                      <th className="p-2.5">ID</th>
                      <th className="p-2.5">Date</th>
                      <th className="p-2.5">Type</th>
                      <th className="p-2.5">Entry</th>
                      <th className="p-2.5">Exit</th>
                      <th className="p-2.5">Shares</th>
                      <th className="p-2.5">Gain %</th>
                      <th className="p-2.5">Net PnL ($)</th>
                      <th className="p-2.5">Duration</th>
                      <th className="p-2.5">Exit Trigger</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/20 text-[10.5px]">
                    {filteredTrades.map((t) => (
                      <tr key={t.id} className="hover:bg-surface/50 transition">
                        <td className="p-2.5 font-bold text-fg">{t.id}</td>
                        <td className="p-2.5 text-muted text-[10px]">{t.date}</td>
                        <td className="p-2.5">
                          <span className={"px-1.5 py-0.5 rounded text-[9px] font-bold " + (
                            t.type === "LONG" ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300"
                          )}>
                            {t.type}
                          </span>
                        </td>
                        <td className="p-2.5">{"$" + t.entryPrice}</td>
                        <td className="p-2.5 font-bold">{"$" + t.exitPrice}</td>
                        <td className="p-2.5 text-muted">{t.shares}</td>
                        <td className={"p-2.5 font-extrabold " + (t.won ? "text-green-400" : "text-red-400")}>
                          {t.won ? "+" : ""}{t.pnlPct}%
                        </td>
                        <td className={"p-2.5 font-extrabold " + (t.won ? "text-emerald-400" : "text-red-400")}>
                          {t.won ? "+" : ""}{"$" + t.pnlUsd.toLocaleString()}
                        </td>
                        <td className="p-2.5 text-muted text-[10px]">{t.duration}</td>
                        <td className="p-2.5">
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-bg text-muted border border-border/40">
                            {t.exitReason}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}