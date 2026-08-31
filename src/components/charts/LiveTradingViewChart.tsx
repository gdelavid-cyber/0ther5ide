"use client";

import { useState } from "react";

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
  return "NASDAQ:" + clean;
}

export default function LiveTradingViewChart({ symbol = "NVDA", height = 340 }: Props) {
  const [activeSymbol, setActiveSymbol] = useState(resolveSymbol(symbol));
  const [interval, setInterval] = useState("15");

  const iframeSrc = "https://s.tradingview.com/widgetembed/?frameElementId=tradingview_widget&symbol=" +
    encodeURIComponent(activeSymbol) +
    "&interval=" + interval +
    "&hidesidetoolbar=0&symboledit=1&saveimage=0&toolbarbg=06070a&studies=%5B%5D&theme=dark&style=1&timezone=Etc%2FUTC&studies_overrides=%7B%7D&overrides=%7B%22mainSeriesProperties.style%22%3A1%7D&enabled_features=%5B%5D&disabled_features=%5B%5D&locale=en&utm_source=0ther5ide.vercel.app&utm_medium=widget&utm_campaign=chart&utm_term=" +
    encodeURIComponent(activeSymbol);

  return (
    <div className="w-full rounded-xl border border-accent/40 overflow-hidden bg-[#06070a] flex flex-col shadow-[0_0_30px_rgba(0,255,136,0.15)] my-2">
      <div className="flex flex-wrap items-center justify-between px-3 py-2 bg-surface/90 border-b border-border/50 font-mono text-[10px] gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-accent signal-pulse" />
          <span className="text-accent font-bold tracking-wider">LIVE CANDLESTICK STREAM</span>
          <span className="text-muted">·</span>
          <span className="text-fg font-bold bg-bg px-2 py-0.5 rounded border border-border/60">{activeSymbol}</span>
        </div>

        <div className="flex items-center gap-1.5 font-mono text-[10px]">
          {["NVDA", "BTC", "TSLA", "SPY", "ETH", "SOL"].map((t) => {
            const sym = resolveSymbol(t);
            const isActive = activeSymbol === sym;
            return (
              <button
                key={t}
                onClick={() => setActiveSymbol(sym)}
                className={"px-2 py-0.5 rounded transition font-bold " + (
                  isActive
                    ? "bg-accent text-bg shadow-md"
                    : "bg-surface border border-border/40 text-muted hover:text-accent hover:border-accent/40"
                )}
              >
                {t}
              </button>
            );
          })}
        </div>
      </div>

      <div className="w-full relative bg-[#06070a]" style={{ height: height + "px" }}>
        <iframe
          key={activeSymbol + "-" + interval}
          src={iframeSrc}
          className="w-full h-full border-0"
          allow="fullscreen"
          title={"TradingView Chart " + activeSymbol}
        />
      </div>
    </div>
  );
}
