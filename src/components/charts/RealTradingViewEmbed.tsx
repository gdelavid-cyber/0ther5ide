"use client";

import { useEffect, useRef, memo } from "react";

interface Props {
  symbol: string;
  timeframe?: string;
  height?: number | string;
}

const SYMBOL_MAP: Record<string, string> = {
  NVDA: "NASDAQ:NVDA",
  TSLA: "NASDAQ:TSLA",
  SPY: "AMEX:SPY",
  BTC: "BINANCE:BTCUSDT",
  ETH: "BINANCE:ETHUSDT",
  SOL: "BINANCE:SOLUSDT",
  XAUUSD: "OANDA:XAUUSD",
  GOLD: "OANDA:XAUUSD",
  XAU: "OANDA:XAUUSD",
};

const INTERVAL_MAP: Record<string, string> = {
  "1M": "1",
  "5M": "5",
  "15M": "15",
  "1H": "60",
  "4H": "240",
  "1D": "D",
};

function RealTradingViewEmbedComponent({ symbol = "NVDA", timeframe = "15M", height = "100%" }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetContainerId = useRef(`tradingview_${Math.random().toString(36).substring(7)}`);

  const cleanSym = symbol.toUpperCase().replace(/[^A-Z]/g, "") || "NVDA";
  const mappedSymbol = SYMBOL_MAP[cleanSym] || `NASDAQ:${cleanSym}`;
  const mappedInterval = INTERVAL_MAP[timeframe] || "15";

  useEffect(() => {
    const currentContainer = containerRef.current;
    if (!currentContainer) return;

    currentContainer.innerHTML = "";

    const widgetDiv = document.createElement("div");
    widgetDiv.id = widgetContainerId.current;
    widgetDiv.style.width = "100%";
    widgetDiv.style.height = "100%";
    currentContainer.appendChild(widgetDiv);

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/tv.js";
    script.type = "text/javascript";
    script.async = true;

    script.onload = () => {
      if (typeof (window as any).TradingView !== "undefined" && document.getElementById(widgetContainerId.current)) {
        try {
          new (window as any).TradingView.widget({
            autosize: true,
            symbol: mappedSymbol,
            interval: mappedInterval,
            timezone: "America/New_York",
            theme: "dark",
            style: "1",
            locale: "en",
            toolbar_bg: "#06090e",
            enable_publishing: false,
            allow_symbol_change: true,
            container_id: widgetContainerId.current,
            hide_side_toolbar: false,
            withdateranges: true,
            details: true,
            hotlist: false,
            calendar: false,
            studies: [
              "MASimple@tv-basicstudies",
              "RSI@tv-basicstudies",
              "BollingerBands@tv-basicstudies",
            ],
            loading_screen: { backgroundColor: "#06090e", foregroundColor: "#00ff88" },
            overrides: {
              "paneProperties.background": "#06090e",
              "paneProperties.vertGridProperties.color": "rgba(255, 255, 255, 0.05)",
              "paneProperties.horzGridProperties.color": "rgba(255, 255, 255, 0.05)",
              "symbolWatermarkProperties.transparency": 90,
              "scalesProperties.textColor": "#8892b0",
              "mainSeriesProperties.candleStyle.upColor": "#00ff88",
              "mainSeriesProperties.candleStyle.downColor": "#ff3b5c",
              "mainSeriesProperties.candleStyle.drawWick": true,
              "mainSeriesProperties.candleStyle.drawBorder": true,
              "mainSeriesProperties.candleStyle.borderColor": "#00ff88",
              "mainSeriesProperties.candleStyle.borderUpColor": "#00ff88",
              "mainSeriesProperties.candleStyle.borderDownColor": "#ff3b5c",
              "mainSeriesProperties.candleStyle.wickUpColor": "#00ff88",
              "mainSeriesProperties.candleStyle.wickDownColor": "#ff3b5c",
            },
          });
        } catch (err) {
          console.error("TradingView widget initialization error:", err);
        }
      }
    };

    document.head.appendChild(script);

    return () => {
      if (currentContainer) {
        currentContainer.innerHTML = "";
      }
    };
  }, [mappedSymbol, mappedInterval]);

  return (
    <div
      ref={containerRef}
      style={{ height: typeof height === "number" ? `${height}px` : height }}
      className="w-full flex-1 relative bg-[#06090e] rounded-xl overflow-hidden min-h-[380px]"
    />
  );
}

export default memo(RealTradingViewEmbedComponent);
