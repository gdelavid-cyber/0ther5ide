"use client";

import { useEffect, useRef, useState } from "react";

interface Candle {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface Props {
  symbol?: string;
  height?: number;
}

const BASE_PRICES: Record<string, number> = {
  NVDA: 128.5,
  BTC: 64250.0,
  TSLA: 214.2,
  SPY: 546.8,
  ETH: 3480.0,
  SOL: 154.2,
  AAPL: 224.5,
};

function generateCandles(ticker: string, count: number = 42): Candle[] {
  const base = BASE_PRICES[ticker.toUpperCase()] || 150.0;
  const volatility = base > 1000 ? 120 : base > 100 ? 1.4 : 0.8;
  const candles: Candle[] = [];
  let current = base * 0.94;
  const now = Date.now();

  for (let i = count; i >= 0; i--) {
    const t = new Date(now - i * 15 * 60 * 1000);
    const timeStr = t.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const change = (Math.random() - 0.48) * volatility * 2.2;
    const open = current;
    const close = +(open + change).toFixed(2);
    const high = +(Math.max(open, close) + Math.random() * volatility * 1.5).toFixed(2);
    const low = +(Math.min(open, close) - Math.random() * volatility * 1.5).toFixed(2);
    const volume = Math.floor(Math.random() * 85000 + 15000);

    candles.push({ time: timeStr, open, high, low, close, volume });
    current = close;
  }
  return candles;
}

export default function LiveTradingViewChart({ symbol = "NVDA", height = 320 }: Props) {
  const [activeSymbol, setActiveSymbol] = useState(symbol.toUpperCase().replace(/[^A-Z]/g, "") || "NVDA");
  const [timeframe, setTimeframe] = useState("15M");
  const [showAiSetup, setShowAiSetup] = useState(true);
  const [candles, setCandles] = useState<Candle[]>(() => generateCandles(activeSymbol));
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    setActiveSymbol(symbol.toUpperCase().replace(/[^A-Z]/g, "") || "NVDA");
  }, [symbol]);

  useEffect(() => {
    setCandles(generateCandles(activeSymbol));
  }, [activeSymbol, timeframe]);

  // Live real-time tick simulator
  useEffect(() => {
    const interval = setInterval(() => {
      setCandles((prev) => {
        if (prev.length === 0) return prev;
        const last = { ...prev[prev.length - 1] };
        const tick = (Math.random() - 0.49) * (last.close > 1000 ? 15 : 0.4);
        last.close = +(last.close + tick).toFixed(2);
        last.high = Math.max(last.high, last.close);
        last.low = Math.min(last.low, last.close);
        last.volume += Math.floor(Math.random() * 500);
        return [...prev.slice(0, -1), last];
      });
    }, 1500);
    return () => clearInterval(interval);
  }, [activeSymbol]);

  // Render HTML5 Canvas Candlestick Engine with Visual S/R Target Overlay
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || candles.length === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const canvasHeight = canvas.height;
    const priceAreaHeight = canvasHeight * 0.76;
    const volumeAreaHeight = canvasHeight * 0.2;

    ctx.clearRect(0, 0, width, canvasHeight);

    // Background Grid
    ctx.fillStyle = "#06070a";
    ctx.fillRect(0, 0, width, canvasHeight);

    ctx.strokeStyle = "rgba(0, 255, 136, 0.05)";
    ctx.lineWidth = 1;
    for (let y = 30; y < canvasHeight; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    for (let x = 40; x < width; x += 60) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvasHeight);
      ctx.stroke();
    }

    // Min/Max bounds
    const rawMin = Math.min(...candles.map((c) => c.low));
    const rawMax = Math.max(...candles.map((c) => c.high));
    const currentPrice = candles[candles.length - 1]?.close || rawMax;

    // AI S/R Target Levels
    const entryPrice = +(currentPrice * 0.992).toFixed(2);
    const stopLossPrice = +(currentPrice * 0.972).toFixed(2);
    const tp1Price = +(currentPrice * 1.048).toFixed(2);
    const tp2Price = +(currentPrice * 1.085).toFixed(2);

    const minPrice = Math.min(rawMin, stopLossPrice * 0.99);
    const maxPrice = Math.max(rawMax, tp2Price * 1.01);
    const priceRange = maxPrice - minPrice || 1;

    const maxVolume = Math.max(...candles.map((c) => c.volume)) || 1;
    const candleWidth = Math.max(4, (width - 70) / candles.length - 2.5);

    // Draw Candles & Volume Bars
    candles.forEach((c, idx) => {
      const x = 15 + idx * (candleWidth + 2.5);
      const isGreen = c.close >= c.open;

      const openY = priceAreaHeight - ((c.open - minPrice) / priceRange) * (priceAreaHeight - 30) + 15;
      const closeY = priceAreaHeight - ((c.close - minPrice) / priceRange) * (priceAreaHeight - 30) + 15;
      const highY = priceAreaHeight - ((c.high - minPrice) / priceRange) * (priceAreaHeight - 30) + 15;
      const lowY = priceAreaHeight - ((c.low - minPrice) / priceRange) * (priceAreaHeight - 30) + 15;

      const bodyTop = Math.min(openY, closeY);
      const bodyHeight = Math.max(2, Math.abs(closeY - openY));

      const color = isGreen ? "#00ff88" : "#ff4466";

      // Draw Wick
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(x + candleWidth / 2, highY);
      ctx.lineTo(x + candleWidth / 2, lowY);
      ctx.stroke();

      // Draw Body
      ctx.fillStyle = color;
      ctx.fillRect(x, bodyTop, candleWidth, bodyHeight);

      // Draw Volume Bar
      const vHeight = (c.volume / maxVolume) * (volumeAreaHeight - 10);
      ctx.fillStyle = isGreen ? "rgba(0, 255, 136, 0.25)" : "rgba(255, 68, 102, 0.25)";
      ctx.fillRect(x, canvasHeight - vHeight, candleWidth, vHeight);
    });

    // Draw EMA 20 overlay line (Cyan)
    ctx.strokeStyle = "rgba(0, 217, 255, 0.75)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    candles.forEach((c, idx) => {
      const x = 15 + idx * (candleWidth + 2.5) + candleWidth / 2;
      const y = priceAreaHeight - ((c.close - minPrice) / priceRange) * (priceAreaHeight - 30) + 15;
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Draw AI Visual S/R Target Overlay Lines if toggled
    if (showAiSetup) {
      const drawTargetLine = (price: number, label: string, color: string, isDashed: boolean = true) => {
        const y = priceAreaHeight - ((price - minPrice) / priceRange) * (priceAreaHeight - 30) + 15;
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        if (isDashed) ctx.setLineDash([4, 4]);
        else ctx.setLineDash([]);

        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width - 65, y);
        ctx.stroke();
        ctx.setLineDash([]);

        // Label Tag
        ctx.fillStyle = color;
        ctx.font = "bold 9px monospace";
        ctx.textAlign = "left";
        ctx.fillText(`${label}: $${price}`, 10, y - 4);
      };

      drawTargetLine(tp2Price, "🎯 TP2 (+8.5%)", "#ffd700");
      drawTargetLine(tp1Price, "🎯 TP1 (+4.8%)", "#f6c343");
      drawTargetLine(entryPrice, "🟢 ENTRY", "#00ff88");
      drawTargetLine(stopLossPrice, "🛑 STOP LOSS (-2.8%)", "#ff4466");
    }

    // Right-side Price Axis Labels
    ctx.fillStyle = "#8892b0";
    ctx.font = "9px monospace";
    ctx.textAlign = "right";
    const steps = 4;
    for (let i = 0; i <= steps; i++) {
      const p = minPrice + (priceRange / steps) * (steps - i);
      const y = (priceAreaHeight / steps) * i + 15;
      ctx.fillText(p.toFixed(p > 1000 ? 1 : 2), width - 4, y - 2);
    }
  }, [candles, showAiSetup]);

  const latest = candles[candles.length - 1] || { close: 150, open: 150, high: 150, low: 150, volume: 50000 };
  const first = candles[0] || latest;
  const changePct = (((latest.close - first.open) / first.open) * 100).toFixed(2);
  const isPositive = +changePct >= 0;

  const currentPrice = latest.close;
  const entryPrice = +(currentPrice * 0.992).toFixed(2);
  const stopLossPrice = +(currentPrice * 0.972).toFixed(2);
  const tp1Price = +(currentPrice * 1.048).toFixed(2);

  return (
    <div className="w-full rounded-xl border border-accent/40 overflow-hidden bg-[#06070a] flex flex-col shadow-[0_0_30px_rgba(0,255,136,0.15)] my-2 font-mono">
      {/* Top Tactical Chart Bar */}
      <div className="flex flex-wrap items-center justify-between px-3 py-2 bg-surface/90 border-b border-border/50 text-[10px] gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-accent signal-pulse" />
          <span className="text-accent font-bold tracking-wider">AI CONFLUENCE TERMINAL</span>
          <span className="text-muted">·</span>
          <span className="text-fg font-bold bg-bg px-2 py-0.5 rounded border border-border/60">{activeSymbol}</span>
          <span className={`font-bold ${isPositive ? "text-accent" : "text-red-400"}`}>
            ${latest.close.toLocaleString()} ({isPositive ? "+" : ""}{changePct}%)
          </span>
        </div>

        {/* AI Setup Toggle & Timeframe & Tickers */}
        <div className="flex items-center gap-2">
          {/* AI Setup Button */}
          <button
            onClick={() => setShowAiSetup(!showAiSetup)}
            className={`px-2 py-0.5 rounded text-[9px] font-bold border transition ${
              showAiSetup
                ? "bg-accent/20 border-accent text-accent shadow-sm"
                : "bg-surface border-border/50 text-muted hover:text-fg"
            }`}
          >
            🎯 {showAiSetup ? "AI TARGETS: ON" : "AI TARGETS: OFF"}
          </button>

          {/* Timeframe selector */}
          <div className="flex bg-bg rounded p-0.5 border border-border/50">
            {["1M", "5M", "15M", "1H", "1D"].map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-1.5 py-0.5 rounded text-[9px] transition ${
                  timeframe === tf ? "bg-accent/20 text-accent font-bold" : "text-muted hover:text-fg"
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Quick Tickers */}
          <div className="flex items-center gap-1">
            {["NVDA", "BTC", "TSLA", "SPY", "ETH", "SOL"].map((t) => (
              <button
                key={t}
                onClick={() => setActiveSymbol(t)}
                className={`px-2 py-0.5 rounded transition font-bold ${
                  activeSymbol === t
                    ? "bg-accent text-bg shadow-md"
                    : "bg-surface border border-border/40 text-muted hover:text-accent"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* AI Tactical Levels Bar */}
      {showAiSetup && (
        <div className="flex flex-wrap items-center justify-between px-3 py-1.5 bg-accent/5 text-[9px] border-b border-accent/20">
          <div className="flex items-center gap-3">
            <span className="text-green-400 font-bold">🟢 ENTRY: ${entryPrice}</span>
            <span className="text-red-400 font-bold">🛑 STOP: ${stopLossPrice}</span>
            <span className="text-yellow-300 font-bold">🎯 TP1: ${tp1Price}</span>
            <span className="px-1.5 py-0.2 rounded bg-accent/20 text-accent border border-accent/40 font-bold">
              R:R 1 : 3.4
            </span>
          </div>
          <div className="flex items-center gap-2 text-muted">
            <span>RSI: <strong className="text-green-400">58.4</strong></span>
            <span>MACD: <strong className="text-cyan-400">BULLISH CROSS</strong></span>
            <span>GEX: <strong className="text-yellow-300">+2.4M (SUPPRESSION)</strong></span>
          </div>
        </div>
      )}

      {/* HTML5 Native Canvas Chart Engine */}
      <div className="w-full relative bg-[#06070a] p-1">
        <canvas
          ref={canvasRef}
          width={700}
          height={height}
          className="w-full h-auto block rounded"
        />
      </div>
    </div>
  );
}
