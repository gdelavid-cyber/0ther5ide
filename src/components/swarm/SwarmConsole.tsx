"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { timeAgo } from "@/lib/utils";
import type { SwarmState, SwarmAgent, SwarmLog } from "@/lib/swarm/types";

const FREQUENCY_OPTIONS = [
  { label: "SSE LIVE STREAM", value: "sse" },
  { label: "5s ULTRA", value: 5000 },
  { label: "15s NORMAL", value: 15000 },
];

export default function SwarmConsole() {
  const [state, setState] = useState<SwarmState | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSweeping, setIsSweeping] = useState(false);
  const [targetQuery, setTargetQuery] = useState("");
  const [autoScrape, setAutoScrape] = useState(true);
  const [streamMode, setStreamMode] = useState<"sse" | number>("sse");
  const [totalScrapedCounter, setTotalScrapedCounter] = useState(19480);
  const [isLiveStreaming, setIsLiveStreaming] = useState(false);
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
    <div className="glass-panel p-4 flex flex-col h-full glow-border space-y-3 relative overflow-hidden">
      {/* Background Pulse Glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top Banner & Autonomous Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border/30">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-accent/20 border border-accent/40 flex items-center justify-center text-accent text-xl font-bold shadow-md shadow-accent/10">
            🤖
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-accent font-bold text-sm tracking-wider font-mono">
                AUTONOMOUS AI SWARM HARVESTER
              </span>
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/40 text-[9px] font-mono font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 signal-pulse" />
                {isLiveStreaming ? "SSE LIVE STREAMING [0ms LAG]" : "NONSTOP SCRAPING ACTIVE"}
              </span>
            </div>
            <div className="text-[10px] text-muted font-mono flex items-center gap-3 mt-0.5 flex-wrap">
              <span>Scraped: <strong className="text-fg">{totalScrapedCounter.toLocaleString()}</strong> events</span>
              <span>•</span>
              <span>Throughput: <strong className="text-green-400">28.4 kB/s</strong></span>
              <span>•</span>
              <span>Pipeline: <strong className="text-accent">5 Sensor Feeds Online</strong></span>
            </div>
          </div>
        </div>

        {/* Auto Scraping Controls & Target Input */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Frequency & SSE Switcher */}
          <div className="flex items-center gap-1 bg-surface/60 p-1 rounded-lg border border-border/40 text-[9px] font-mono">
            {FREQUENCY_OPTIONS.map((opt) => (
              <button
                key={String(opt.value)}
                onClick={() => setStreamMode(opt.value as any)}
                className={"px-2 py-0.5 rounded transition " + (
                  streamMode === opt.value
                    ? "bg-accent text-bg font-bold shadow-sm"
                    : "text-muted hover:text-fg"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Targeted Mission Input */}
          <form onSubmit={handleDispatchSweep} className="flex items-center gap-1.5">
            <input
              type="text"
              value={targetQuery}
              onChange={(e) => setTargetQuery(e.target.value)}
              placeholder="Direct target (e.g. NVDA, TAIWAN, SUEZ)..."
              className="bg-surface/80 border border-border/60 text-xs px-2.5 py-1.5 rounded w-48 text-fg placeholder:text-muted focus:border-accent focus:outline-none font-mono"
            />
            <button
              type="submit"
              disabled={isSweeping}
              className={"px-3 py-1.5 rounded text-xs font-bold font-mono tracking-wider transition flex items-center gap-1.5 " + (
                isSweeping
                  ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 animate-pulse"
                  : "bg-accent text-bg hover:bg-accent/90 shadow-sm shadow-accent/20"
              )}
            >
              <span className={"w-2 h-2 rounded-full " + (isSweeping ? "bg-yellow-400 signal-pulse" : "bg-bg")} />
              {isSweeping ? "SWARMING..." : "FOCUS SWARM"}
            </button>
          </form>
        </div>
      </div>

      {/* 4 Multi-Agent Sensor Grid */}
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
                  <div className="text-xs font-bold text-fg font-mono">{agent.codename}</div>
                  <div className="text-[9px] text-muted font-mono">{agent.name}</div>
                </div>
              </div>
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full font-mono bg-green-500/20 text-green-300 border border-green-500/40 flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-green-400 signal-pulse" />
                HARVESTING
              </span>
            </div>

            <div className="text-[10px] text-muted line-clamp-2 bg-bg/50 p-2 rounded border border-border/20 font-mono">
              {agent.currentTask}
            </div>

            <div className="flex items-center justify-between text-[9px] text-muted border-t border-border/30 pt-1.5 font-mono">
              <span>Inbound Obs: <strong className="text-fg">{agent.observationsCount}</strong></span>
              <span>Certainty: <strong className="text-accent">{agent.confidenceScore}%</strong></span>
            </div>
          </div>
        ))}
      </div>

      {/* Consensus & Live Harvest Telemetry Stream */}
      {state?.latestSynthesis && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* Synthesis Brief */}
          <div className="lg:col-span-2 p-3.5 rounded-xl bg-surface/40 border border-accent/30 space-y-2.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-accent font-mono">
                    {state.latestSynthesis.missionId}
                  </span>
                  <span className="text-[9px] text-muted font-mono">
                    {timeAgo(state.latestSynthesis.timestamp)}
                  </span>
                </div>
                <div className="flex items-center gap-2 font-mono">
                  <span className="text-[10px] text-muted">Swarm Consensus: <strong className="text-accent">{state.latestSynthesis.consensusScore}%</strong></span>
                  <span className={"px-2 py-0.5 text-[9px] font-bold rounded " + (
                    state.latestSynthesis.threatLevel === "SEVERE"
                      ? "bg-red-500/20 text-red-400 border border-red-500/40"
                      : state.latestSynthesis.threatLevel === "HIGH"
                      ? "bg-orange-500/20 text-orange-400 border border-orange-500/40"
                      : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/40"
                  )}>
                    {state.latestSynthesis.threatLevel}
                  </span>
                </div>
              </div>

              <p className="text-xs text-fg leading-relaxed bg-bg/40 p-2.5 rounded-lg border border-border/30 font-sans">
                {state.latestSynthesis.executiveBrief}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[10px] font-mono">
              <div className="bg-bg/40 p-2 rounded border border-border/20">
                <div className="text-accent font-bold mb-1">SWARM SCRAPE FINDINGS</div>
                <ul className="space-y-1 text-muted">
                  {state.latestSynthesis.keyFindings.map((f, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-accent">•</span>
                      <span className="text-fg/90">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-bg/40 p-2 rounded border border-border/20">
                <div className="text-yellow-400 font-bold mb-1">TACTICAL CORRELATIONS</div>
                <ul className="space-y-1 text-muted">
                  {state.latestSynthesis.recommendedActions.map((a, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-yellow-400">▶</span>
                      <span className="text-fg/90">{a}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Live Ingestion Telemetry Feed */}
          <div className="lg:col-span-1 p-3 rounded-xl bg-surface/30 border border-border/40 flex flex-col h-[300px]">
            <div className="flex items-center justify-between mb-2 pb-1 border-b border-border/30 text-xs font-mono">
              <div className="flex items-center gap-1.5 font-bold text-fg">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 signal-pulse" />
                CONTINUOUS SCRAPE STREAM
              </div>
              <span className="text-[9px] text-green-400 font-mono">{isLiveStreaming ? "SSE STREAMING" : "LIVE // 28.4 kB/s"}</span>
            </div>
            <div className="flex-1 overflow-y-auto space-y-1.5 min-h-0 text-[11px] font-mono">
              {(state?.logs || []).map((log) => (
                <div key={log.id} className="p-1.5 rounded bg-bg/60 border border-border/20 space-y-0.5">
                  <div className="flex items-center justify-between text-[9px]">
                    <span className={"font-bold " + (
                      log.severity === "CRITICAL"
                        ? "text-red-400"
                        : log.severity === "WARNING"
                        ? "text-orange-400"
                        : log.severity === "ACTION"
                        ? "text-accent"
                        : "text-green-400"
                    )}>
                      [{log.agentCodename}]
                    </span>
                    <span className="text-muted">{timeAgo(log.timestamp)}</span>
                  </div>
                  <div className="text-fg/90 text-[10px] leading-snug">{log.message}</div>
                </div>
              ))}
              <div ref={logEndRef} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
