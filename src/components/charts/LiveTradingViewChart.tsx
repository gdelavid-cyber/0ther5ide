"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  symbol?: string;
  height?: number;
}

function resolveSymbol(raw: string): string {
  const clean = (raw || "NVDA").toUpperCase().trim().replace(/[^A-Z0-9]/g, "");
  if (clean === "BTC" || clean === "BITCOIN") return "BINANCE:BTCUSDT";
  if (clean === "ETH" || clean === "ETHEREUM") return "BINANCE:ETHUSDT";
  if (clean === "SOL" || clean === "SOLANA") return "BINANCE:SOLUSDT";
  if (clean === "GOLD") return "TVC:GOLD";
  if (clean === "OIL") return "NYMEX:CL1!";
  if (clean === "SPY" || clean === "SPX") return "AMEX:SPY";
  if (clean === "QQQ") return "NASDAQ:QQQ";
  return `NASDAQ:${clean}`;
}

export default function LiveTradingViewChart({ symbol = "NVDA", height = 320 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const resolved = resolveSymbol(symbol);
  const [activeSymbol, setActiveSymbol] = useState(resolved);

  useEffect(() => {
    setActiveSymbol(resolveSymbol(symbol));
  }, [symbol]);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = "";

    const widgetContainer = document.createElement("div");
    widgetContainer.className = "tradingview-widget-container__widget";
    widgetContainer.style.height = "100%";
    widgetContainer.style.width = "100%";
    containerRef.current.appendChild(widgetContainer);

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: activeSymbol,
      interval: "15",
      timezone: "Etc/UTC",
      theme: "dark",
      style: "1",
      locale: "en",
      enable_publishing: false,
      allow_symbol_change: true,
      calendar: false,
      support_host: "https://www.tradingview.com",
      backgroundColor: "#06070a",
      gridColor: "rgba(0, 255, 136, 0.04)",
      hide_side_toolbar: false,
      save_image: false,
      toolbar_bg: "#06070a",
    });

    containerRef.current.appendChild(script);
  }, [activeSymbol]);

  return (
    <div className="w-full rounded-xl border border-border/60 overflow-hidden bg-[#06070a] flex flex-col shadow-2xl">
      {/* Top Chart Header */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-surface/80 border-b border-border/40 font-mono text-[10px]">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-accent signal-pulse" />
          <span className="text-accent font-bold tracking-wider">LIVE CANDLESTICK FEED</span>
          <span className="text-muted">·</span>
          <span className="text-fg font-bold">{activeSymbol}</span>
        </div>
        <div className="flex items-center gap-1.5 text-muted">
          <button
            onClick={() => setActiveSymbol("NASDAQ:NVDA")}
            className={"px-1.5 py-0.5 rounded transition " + (activeSymbol.includes("NVDA") ? "bg-accent/20 text-accent" : "hover:text-fg")}
          >
            NVDA
          </button>
          <button
            onClick={() => setActiveSymbol("BINANCE:BTCUSDT")}
            className={"px-1.5 py-0.5 rounded transition " + (activeSymbol.includes("BTC") ? "bg-accent/20 text-accent" : "hover:text-fg")}
          >
            BTC
          </button>
          <button
            onClick={() => setActiveSymbol("NASDAQ:TSLA")}
            className={"px-1.5 py-0.5 rounded transition " + (activeSymbol.includes("TSLA") ? "bg-accent/20 text-accent" : "hover:text-fg")}
          >
            TSLA
          </button>
          <button
            onClick={() => setActiveSymbol("AMEX:SPY")}
            className={"px-1.5 py-0.5 rounded transition " + (activeSymbol.includes("SPY") ? "bg-accent/20 text-accent" : "hover:text-fg")}
          >
            SPY
          </button>
        </div>
      </div>

      {/* Chart Canvas Area */}
      <div
        ref={containerRef}
        className="w-full"
        style={{ height: `${height}px` }}
      />
    </div>
  );
}
