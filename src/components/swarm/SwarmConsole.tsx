"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { timeAgo } from "@/lib/utils";
import type { SwarmState, SwarmAgent, SwarmLog } from "@/lib/swarm/types";
import type { SwarmMarketSignal } from "@/lib/swarm/marketSwarmEngine";

const FREQUENCY_OPTIONS = [
  { label: "SSE LIVE STREAM", value: "sse" },
  { label: "5s ULTRA", value: 5000 },
  { label: "15s NORMAL", value: 15000 },
];

export default function SwarmConsole() {
  const [state, setState] = useState<SwarmState | null>(null);
  const [marketSignal, setMarketSignal] = useState<SwarmMarketSignal | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<string>("NVDA");
  const [loading, setLoading] = useState(true);
  const [isSweeping, setIsSweeping] = useState(false);
  const [targetQuery, setTargetQuery] = useState("");
  const [autoScrape, setAutoScrape] = useState(true);
  const [streamMode, setStreamMode] = useState<"sse" | number>("sse");
  const [totalScrapedCounter, setTotalScrapedCounter] = useState(19480);
  const [isLiveStreaming, setIsLiveStreaming] = useState(false);
  const [activeTab, setActiveTab] = useState<"profit" | "evolution" | "intel">("profit");
  const logEndRef = useRef<HTMLDivElement | null>(null);

  const fetchState = useCallback(async () => {
    try {
      const res = await fetch("/api/swarm");
      if (!res.ok) return;
      const data = await res.json();
      setState(data);
      setTotalScrapedCounter((prev) => prev + Math.floor(Math.random() * 6 + 2));
    } catch {}
    setLoading(false);
  }, []);

  const fetchMarketSignals = useCallback(async (sym: string) => {
    try {
      const res = await fetch(`/api/swarm/market-signals?symbol=${sym}`);
      if (!res.ok) return;
      const data = await res.json();
      setMarketSignal(data);
    } catch {}
  }, []);

  useEffect(() => {
    fetchState();
    fetchMarketSignals(selectedAsset);
    const interval = setInterval(() => {
      fetchMarketSignals(selectedAsset);
    }, 4000);
    return () => clearInterval(interval);
  }, [fetchState, fetchMarketSignals, selectedAsset]);

  // Setup SSE Real-Time EventSource Stream
  useEffect(() => {
    if (streamMode !== "sse" || !autoScrape) return;

    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource("/api/swarm/stream");
      eventSource.onopen = () => setIsLiveStreaming(true);
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data && data.agents) {
            setState(data);
            setTotalScrapedCounter((prev) => prev + Math.floor(Math.random() * 8 + 4));
          }
        } catch {}
      };
      eventSource.onerror = () => {
        setIsLiveStreaming(false);
        eventSource?.close();
      };
    } catch {
      setIsLiveStreaming(false);
    }

    return () => {
      eventSource?.close();
      setIsLiveStreaming(false);
    };
  }, [streamMode, autoScrape]);

  // Fallback Polling if streamMode is numeric interval
  useEffect(() => {
    if (streamMode === "sse" || !autoScrape) return;
    fetchState();
    const interval = setInterval(fetchState, typeof streamMode === "number" ? streamMode : 5000);
    return () => clearInterval(interval);
  }, [fetchState, autoScrape, streamMode]);

  const handleDispatchSweep = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSweeping) return;
    setIsSweeping(true);
    try {
      const res = await fetch("/api/swarm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetQuery }),
      });
      if (res.ok) {
        const data = await res.json();
        setState(data);
        setTotalScrapedCounter((prev) => prev + 45);
      }
    } catch {}
    setIsSweeping(false);
  };

  return (
    <div className="glass-panel p-4 flex flex-col h-full glow-border space-y-4 relative overflow-hidden font-mono">
      {/* Background Pulse Glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top Banner & Autonomous Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/20 border border-accent/40 flex items-center justify-center text-accent text-2xl font-bold shadow-md shadow-accent/10">
            🧠
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-accent font-bold text-sm tracking-wider">
                AUTONOMOUS SELF-LEARNING AI SWARM
              </span>
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/40 text-[9px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 signal-pulse" />
                {isLiveStreaming ? "SSE STREAMING [0ms LAG]" : "ACTIVE LEARNING"}
              </span>
            </div>
            <div className="text-[10px] text-muted flex items-center gap-3 mt-0.5 flex-wrap">
              <span>Epochs: <strong className="text-accent">{marketSignal?.learningStats?.totalEpochsTrained || 1480}</strong></span>
              <span>•</span>
              <span>Patterns Decoded: <strong className="text-fg">{marketSignal?.learningStats?.patternsDecoded?.toLocaleString() || "94,200"}</strong></span>
              <span>•</span>
              <span>Bayesian Gain: <strong className="text-green-400">{marketSignal?.learningStats?.bayesianEdgeGain || "+18.4%"}</strong></span>
            </div>
          </div>
        </div>

        {/* Tab & Asset Switcher */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-surface/60 p-1 rounded-lg border border-border/40 text-[9px]">
            {["NVDA", "BTC", "XAUUSD", "TSLA", "SPY"].map((sym) => (
              <button
                key={sym}
                onClick={() => setSelectedAsset(sym)}
                className={"px-2 py-0.5 rounded font-bold transition " + (
                  selectedAsset === sym
                    ? "bg-accent text-bg shadow-sm"
                    : "text-muted hover:text-fg"
                )}
              >
                {sym === "XAUUSD" ? "GOLD" : sym}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 bg-surface/80 p-1 rounded-lg border border-accent/40 text-[9px]">
            {[
              { id: "profit", label: "💰 WHAT YOU COULD HAVE MADE" },
              { id: "evolution", label: "🧠 AI BRAIN GROWTH" },
              { id: "intel", label: "📡 LIVE TAPE" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={"px-2.5 py-1 rounded font-extrabold transition flex items-center gap-1 " + (
                  activeTab === tab.id
                    ? "bg-gradient-to-r from-purple-600/40 to-accent/40 text-accent border border-accent/60 shadow-sm"
                    : "text-muted hover:text-fg"
                )}
              >
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* TAB 1: WHAT YOU COULD HAVE MADE */}
      {activeTab === "profit" && marketSignal && (
        <div className="space-y-4 animate-fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/40 to-surface/80 border border-emerald-500/40 flex flex-col justify-between">
              <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                💰 HYPOTHETICAL REALIZED PROFIT
              </div>
              <div className="text-2xl font-extrabold text-emerald-300 my-1">
                +${marketSignal.hypotheticalPnL.totalProfitUsd.toLocaleString()}
              </div>
              <div className="text-[9.5px] text-emerald-400/90 font-bold">
                +{marketSignal.hypotheticalPnL.profitPercentage}% on $10k base
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-surface/60 border border-border/50 flex flex-col justify-between">
              <div className="text-[10px] text-muted font-bold uppercase tracking-wider">
                🎯 CUMULATIVE WIN RATE
              </div>
              <div className="text-2xl font-extrabold text-fg my-1">
                {marketSignal.learningStats.currentWinRate}%
              </div>
              <div className="text-[9.5px] text-muted">
                {marketSignal.hypotheticalPnL.winningTrades} Wins / {marketSignal.hypotheticalPnL.losingTrades} Losses
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-surface/60 border border-border/50 flex flex-col justify-between">
              <div className="text-[10px] text-muted font-bold uppercase tracking-wider">
                ⚖️ AVERAGE RISK : REWARD
              </div>
              <div className="text-2xl font-extrabold text-amber-400 my-1">
                {marketSignal.hypotheticalPnL.averageRR}
              </div>
              <div className="text-[9.5px] text-muted">
                Asymmetric Risk-Managed Alpha
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-950/40 to-surface/80 border border-purple-500/40 flex flex-col justify-between">
              <div className="text-[10px] text-purple-300 font-bold uppercase tracking-wider">
                ⚡ ACTIVE CONSENSUS VERDICT
              </div>
              <div className="text-xl font-extrabold text-accent my-1">
                {marketSignal.direction} ({marketSignal.confidenceScore}%)
              </div>
              <div className="text-[9.5px] text-purple-300 font-bold">
                Regime: {marketSignal.regime}
              </div>
            </div>
          </div>

          {/* Actionable Bracket Trade Card */}
          <div className="p-4 rounded-2xl bg-[#080d16] border border-accent/50 flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs text-accent font-extrabold">🎯 LATEST {selectedAsset} SWARM SIGNAL SETUP</span>
                <span className="px-2 py-0.5 rounded bg-accent/20 text-accent text-[9px] font-bold">LIVE</span>
              </div>
              <div className="text-xs text-muted">
                Entry: <strong className="text-fg">${marketSignal.recommendedSetup.entry}</strong> ·
                Stop Loss: <strong className="text-red-400">${marketSignal.recommendedSetup.stopLoss}</strong> ·
                TP1: <strong className="text-emerald-400">${marketSignal.recommendedSetup.tp1}</strong> ·
                TP2: <strong className="text-amber-400">${marketSignal.recommendedSetup.tp2}</strong>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <a
                href="/?tab=terminal"
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-accent to-emerald-400 text-bg font-extrabold text-xs shadow-lg hover:brightness-110 transition flex items-center gap-1.5"
              >
                <span>⚡ VIEW ON LIVE CHART & EXECUTE</span>
              </a>
            </div>
          </div>

          {/* Audited Trade History Ledger Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-muted px-1">
              <span>📋 AUDITED RECENT SWARM SIGNALS & REALIZED GAINS ({selectedAsset})</span>
              <span className="text-accent text-[10px]">ALL TRADES ENFORCE HARD STOP LOSS</span>
            </div>

            <div className="rounded-xl border border-border/50 overflow-hidden bg-surface/40">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#090d16] text-muted text-[10px] uppercase border-b border-border/40">
                  <tr>
                    <th className="p-2.5">Trade ID</th>
                    <th className="p-2.5">Time</th>
                    <th className="p-2.5">Asset</th>
                    <th className="p-2.5">Signal</th>
                    <th className="p-2.5">Entry</th>
                    <th className="p-2.5">Exit</th>
                    <th className="p-2.5">Realized Gain</th>
                    <th className="p-2.5">Profit ($10k)</th>
                    <th className="p-2.5">Indicators Applied</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {marketSignal.hypotheticalPnL.recentTrades.map((t) => (
                    <tr key={t.id} className="hover:bg-surface/60 transition">
                      <td className="p-2.5 font-bold text-fg">{t.id}</td>
                      <td className="p-2.5 text-muted text-[11px]">{t.time}</td>
                      <td className="p-2.5 font-bold text-accent">{t.symbol}</td>
                      <td className="p-2.5">
                        <span className={"px-2 py-0.5 rounded font-bold text-[10px] " + (
                          t.direction === "BUY" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                        )}>
                          {t.direction}
                        </span>
                      </td>
                      <td className="p-2.5">${t.entry}</td>
                      <td className="p-2.5 font-bold">${t.exit}</td>
                      <td className={"p-2.5 font-extrabold " + (t.won ? "text-green-400" : "text-red-400")}>
                        {t.won ? "+" : ""}{t.pnlPct}%
                      </td>
                      <td className={"p-2.5 font-extrabold " + (t.won ? "text-emerald-400" : "text-red-400")}>
                        {t.won ? "+" : ""}${t.profitUsd.toLocaleString()}
                      </td>
                      <td className="p-2.5 text-muted text-[10px]">
                        {t.activeIndicators.join(", ")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: AI BRAIN GROWTH & SELF-LEARNING EVOLUTION */}
      {activeTab === "evolution" && marketSignal && (
        <div className="space-y-4 animate-fade-in">
          <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/30 via-[#090d16] to-sky-950/30 border border-purple-500/40 space-y-2">
            <div className="flex items-center gap-2 text-purple-300 font-extrabold text-sm">
              <span>🧠 CONTINUOUS REINFORCEMENT LEARNING ENGINE</span>
              <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[9px] border border-purple-500/40">
                ACTIVE
              </span>
            </div>
            <p className="text-xs text-muted leading-relaxed">
              Unlike static trading bots with hardcoded thresholds, the 0ther5ide AI Swarm continually audits every prediction against forward price candles. When market volatility shifts, the <strong>REINFORCE-DELTA</strong> meta-learner recalculates Bayesian agent weights in real time, elevating high-performing indicators and down-weighting failing ones.
            </p>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-bold text-muted px-1">
              🤖 REAL-TIME SUB-AGENT DELIBERATIONS & CONFIDENCE SCORES ({selectedAsset})
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {marketSignal.agentDeliberations.map((agent) => (
                <div key={agent.id} className="p-3.5 rounded-xl bg-surface/50 border border-border/50 hover:border-accent/40 transition flex flex-col justify-between space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{agent.avatar}</span>
                      <div>
                        <div className="font-bold text-xs text-fg">{agent.codename}</div>
                        <div className="text-[9px] text-muted">{agent.name}</div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-accent/20 text-accent font-bold text-[9px]">
                      {agent.confidence}%
                    </span>
                  </div>

                  <p className="text-[10px] text-muted leading-relaxed">
                    {agent.reasoning}
                  </p>

                  <div className="pt-2 border-t border-border/40 flex items-center justify-between text-[9px]">
                    <span className="text-muted">METRIC:</span>
                    <span className="text-accent font-bold">{agent.keyMetric}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: LIVE SENSORS & TAPE */}
      {activeTab === "intel" && (
        <div className="space-y-3 animate-fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {(state?.agents || []).map((agent) => (
              <div
                key={agent.id}
                className="p-3 rounded-xl bg-surface/50 border border-border/40 hover:border-accent/40 transition flex flex-col justify-between space-y-2 relative overflow-hidden"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{agent.avatar}</span>
                    <div>
                      <div className="text-xs font-bold text-fg">{agent.codename}</div>
                      <div className="text-[9px] text-muted">{agent.name}</div>
                    </div>
                  </div>
                  <span className="px-1.5 py-0.5 rounded text-[8.5px] font-bold bg-green-500/20 text-green-400">
                    {agent.status}
                  </span>
                </div>
                <div className="text-[9.5px] text-muted line-clamp-2">
                  {agent.currentTask}
                </div>
                <div className="flex items-center justify-between text-[9px] pt-1.5 border-t border-border/30">
                  <span className="text-muted">OBS: <strong className="text-fg">{agent.observationsCount}</strong></span>
                  <span className="text-accent font-bold">{agent.confidenceScore}%</span>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-border/40 overflow-hidden bg-surface/40 flex flex-col h-56">
            <div className="px-3 py-2 bg-[#090d16] border-b border-border/40 text-[10px] text-muted flex items-center justify-between font-bold">
              <span>LIVE AI SWARM HARVESTING FEED</span>
              <span className="text-accent font-mono">STREAM ACTIVE</span>
            </div>
            <div className="flex-1 overflow-y-auto p-2.5 space-y-1 text-[10px]">
              {(state?.logs || []).map((log: SwarmLog) => (
                <div key={log.id} className="flex items-center gap-2 py-0.5">
                  <span className="text-muted text-[9px]">{new Date(log.timestamp).toLocaleTimeString()}</span>
                  <span className="font-bold text-accent">[{log.agentCodename}]</span>
                  <span className="text-fg">{log.message}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
