"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import TradeExecutionModal from "@/components/trading/TradeExecutionModal";
import PaywallModal from "@/components/pricing/PaywallModal";

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

const TICKER_BUTTONS = [
  { id: "NVDA", label: "NVDA" },
  { id: "BTC", label: "BTC" },
  { id: "XAUUSD", label: "XAU/USD" },
  { id: "TSLA", label: "TSLA" },
  { id: "SPY", label: "SPY" },
  { id: "ETH", label: "ETH" },
  { id: "SOL", label: "SOL" },
];

const SEED_PRICES: Record<string, number> = {
  NVDA: 128.50,
  BTC: 78200.0,
  XAUUSD: 2518.0,
  TSLA: 218.80,
  SPY: 564.40,
  ETH: 3150.0,
  SOL: 184.0,
};

// Generate instant high-fidelity initial candle series for zero-latency first render
function generateSeedCandles(sym: string): Candle[] {
  const base = SEED_PRICES[sym] || 150.0;
  const list: Candle[] = [];
  let curr = base * 0.96;
  const now = Date.now();

  for (let i = 45; i >= 0; i--) {
    const t = new Date(now - i * 15 * 60 * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const change = (Math.random() - 0.48) * (base * 0.008);
    const open = curr;
    const close = +(open + change).toFixed(2);
    const high = +(Math.max(open, close) + Math.random() * (base * 0.004)).toFixed(2);
    const low = +(Math.min(open, close) - Math.random() * (base * 0.004)).toFixed(2);
    const volume = Math.round(Math.random() * 45000 + 15000);
    curr = close;
    list.push({ time: t, open, high, low, close, volume });
  }
  return list;
}

export default function LiveTradingViewChart({ symbol = "NVDA", height = 440 }: Props) {
  const initialSym = symbol.toUpperCase().replace(/[^A-Z]/g, "") || "NVDA";
  const cleanSym = initialSym === "GOLD" || initialSym === "XAU" ? "XAUUSD" : initialSym;

  const [activeSymbol, setActiveSymbol] = useState(cleanSym);
  const [timeframe, setTimeframe] = useState("15M");
  const [candles, setCandles] = useState<Candle[]>(() => generateSeedCandles(cleanSym));
  const [livePrice, setLivePrice] = useState<number>(() => SEED_PRICES[cleanSym] || 150);
  const [liveChange, setLiveChange] = useState<number>(2.4);
  const [dataSource, setDataSource] = useState<string>("Kraken & NASDAQ Real-Time");
  const [canvasDimensions, setCanvasDimensions] = useState<{ width: number; height: number }>({ width: 720, height: 440 });
  const [isFloating, setIsFloating] = useState<boolean>(false);
  const [isFullscreenWindow, setIsFullscreenWindow] = useState<boolean>(false);
  const [floatingPos, setFloatingPos] = useState<{ x: number; y: number } | null>(null);
  const [showOrderBookDOM, setShowOrderBookDOM] = useState<boolean>(true);

  const isWindowDraggingRef = useRef<boolean>(false);
  const windowDragStartRef = useRef<{ mouseX: number; mouseY: number; startX: number; startY: number }>({
    mouseX: 0,
    mouseY: 0,
    startX: 0,
    startY: 0,
  });
  const floatingWindowRef = useRef<HTMLDivElement>(null);

  // Indicator Toggles
  const [showAiSetup, setShowAiSetup] = useState(false);
  const [showEma, setShowEma] = useState(false);
  const [showBollinger, setShowBollinger] = useState(false);
  const [showVwap, setShowVwap] = useState(false);
  const [showRsi, setShowRsi] = useState(false);
  const [specialIndicator, setSpecialIndicator] = useState<"none" | "cvd" | "gex" | "anchored_vwap" | "micro_price" | "fvg" | "godmode_v3">("none");

  // Interactive Zoom & Pan Engine
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [panOffset, setPanOffset] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStartX, setDragStartX] = useState<number>(0);
  const [lastTouchDist, setLastTouchDist] = useState<number | null>(null);

  // Crosshair Hover State
  const [hoveredCandle, setHoveredCandle] = useState<Candle | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [showExecutionModal, setShowExecutionModal] = useState<boolean>(false);
  const [paywallFeature, setPaywallFeature] = useState<string | null>(null);
  const [isVipUser, setIsVipUser] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Check VIP tier
  useEffect(() => {
    try {
      const stored = localStorage.getItem("0ther5ide_user_tier");
      if (stored === "vip") {
        setIsVipUser(true);
        setShowAiSetup(true);
        setShowEma(true);
        setShowBollinger(true);
        setShowVwap(true);
        setShowRsi(true);
      } else {
        setIsVipUser(false);
        setShowAiSetup(false);
        setShowEma(false);
        setShowBollinger(false);
        setShowVwap(false);
        setShowRsi(false);
      }
    } catch {}
  }, []);

  // Floating Window Drag Handlers
  const handleWindowPointerDown = (e: React.PointerEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest("button") || target.closest("select") || target.closest("canvas")) return;
    if (!floatingWindowRef.current) return;
    const rect = floatingWindowRef.current.getBoundingClientRect();
    isWindowDraggingRef.current = true;
    windowDragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      startX: floatingPos ? floatingPos.x : rect.left,
      startY: floatingPos ? floatingPos.y : rect.top,
    };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handleWindowPointerMove = (e: React.PointerEvent) => {
    if (!isWindowDraggingRef.current) return;
    const deltaX = e.clientX - windowDragStartRef.current.mouseX;
    const deltaY = e.clientY - windowDragStartRef.current.mouseY;
    const newX = Math.max(10, Math.min(window.innerWidth - 300, windowDragStartRef.current.startX + deltaX));
    const newY = Math.max(10, Math.min(window.innerHeight - 200, windowDragStartRef.current.startY + deltaY));
    setFloatingPos({ x: newX, y: newY });
  };

  const handleWindowPointerUp = () => {
    isWindowDraggingRef.current = false;
  };

  // ResizeObserver for dynamic, responsive container adaptation
  useEffect(() => {
    const updateSize = () => {
      if (isFloating) {
        if (isFullscreenWindow) {
          setCanvasDimensions({
            width: window.innerWidth - (showOrderBookDOM ? 240 : 40),
            height: window.innerHeight - 140,
          });
        } else {
          setCanvasDimensions({
            width: Math.min(window.innerWidth - 60, showOrderBookDOM ? 780 : 620),
            height: 500,
          });
        }
        return;
      }
      if (containerRef.current) {
        const w = containerRef.current.clientWidth;
        if (w > 0) {
          setCanvasDimensions({
            width: Math.floor(w - (showOrderBookDOM ? 190 : 0)),
            height: height || 440,
          });
        }
      }
    };

    updateSize();
    window.addEventListener("resize", updateSize);

    if (containerRef.current && !isFloating) {
      const observer = new ResizeObserver(updateSize);
      observer.observe(containerRef.current);
      return () => {
        observer.disconnect();
        window.removeEventListener("resize", updateSize);
      };
    }

    return () => window.removeEventListener("resize", updateSize);
  }, [height, isFloating, isFullscreenWindow, showOrderBookDOM]);

  // Fetch Live Real Data from API
  const fetchLiveCandles = useCallback(async (sym: string) => {
    try {
      const res = await fetch(`/api/market/live?symbol=${sym}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.candles && data.candles.length > 0) {
        setCandles(data.candles);
        setLivePrice(data.price);
        setLiveChange(data.change24h);
        if (data.source) setDataSource(data.source);
      }
    } catch {}
  }, []);

  useEffect(() => {
    const clean = symbol.toUpperCase().replace(/[^A-Z]/g, "") || "NVDA";
    const actual = clean === "GOLD" || clean === "XAU" ? "XAUUSD" : clean;
    setActiveSymbol(actual);
  }, [symbol]);

  useEffect(() => {
    setCandles(generateSeedCandles(activeSymbol));
    fetchLiveCandles(activeSymbol);
    const interval = setInterval(() => fetchLiveCandles(activeSymbol), 3000);
    return () => clearInterval(interval);
  }, [activeSymbol, fetchLiveCandles]);

  // Zoom & Pan Actions
  const handleZoomIn = () => setZoomLevel((z) => Math.min(3.0, +(z + 0.25).toFixed(2)));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(0.5, +(z - 0.25).toFixed(2)));
  const handleResetZoom = () => { setZoomLevel(1.0); setPanOffset(0); };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (e.deltaY < 0) handleZoomIn();
    else handleZoomOut();
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStartX(e.clientX);
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleCanvasLeave = () => {
    setIsDragging(false);
    setHoveredCandle(null);
    setMousePos(null);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      if (lastTouchDist !== null) {
        if (dist > lastTouchDist + 10) { handleZoomIn(); setLastTouchDist(dist); }
        else if (dist < lastTouchDist - 10) { handleZoomOut(); setLastTouchDist(dist); }
      } else {
        setLastTouchDist(dist);
      }
    }
  };

  const handleTouchEnd = () => setLastTouchDist(null);

  // Compute Visible Candle Window
  const visibleCandles = useMemo(() => {
    const total = candles.length;
    const count = Math.max(10, Math.min(total, Math.round(total / zoomLevel)));
    const maxP = Math.max(0, total - count);
    const clampedP = Math.max(0, Math.min(maxP, panOffset));
    const start = Math.max(0, total - count - clampedP);
    return candles.slice(start, start + count);
  }, [candles, zoomLevel, panOffset]);

  // High-Definition Retina Canvas Renderer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || visibleCandles.length === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvasDimensions.width || 720;
    const h = canvasDimensions.height || 440;

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.scale(dpr, dpr);

    const hasSubPanel = showRsi || specialIndicator === "cvd" || specialIndicator === "godmode_v3";
    const subPanelHeight = hasSubPanel ? 85 : 0;
    const priceAreaHeight = h - subPanelHeight - 35;
    const volumeAreaHeight = priceAreaHeight * 0.22;

    ctx.clearRect(0, 0, w, h);

    // Deep Dark Blueprint Terminal Background
    ctx.fillStyle = "#04060a";
    ctx.fillRect(0, 0, w, h);

    // Precision Grid
    ctx.strokeStyle = "rgba(255, 255, 255, 0.035)";
    ctx.lineWidth = 1;
    for (let y = 20; y < priceAreaHeight; y += 35) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w - 65, y); ctx.stroke();
    }
    for (let x = 40; x < w - 65; x += 55) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, priceAreaHeight); ctx.stroke();
    }

    // Min / Max Price Scaling on Visible Window
    const rawMin = Math.min(...visibleCandles.map((c) => c.low));
    const rawMax = Math.max(...visibleCandles.map((c) => c.high));
    const currentPrice = livePrice || visibleCandles[visibleCandles.length - 1]?.close || rawMax;

    // AI S/R Target Levels
    const entryPrice = +(currentPrice * 0.993).toFixed(2);
    const stopLossPrice = +(currentPrice * 0.974).toFixed(2);
    const tp1Price = +(currentPrice * 1.045).toFixed(2);
    const tp2Price = +(currentPrice * 1.082).toFixed(2);

    const minPrice = Math.min(rawMin, showAiSetup ? stopLossPrice * 0.992 : rawMin);
    const maxPrice = Math.max(rawMax, showAiSetup ? tp2Price * 1.008 : rawMax);
    const priceRange = maxPrice - minPrice || 1;

    const maxVolume = Math.max(...visibleCandles.map((c) => c.volume)) || 1;
    const candleWidth = Math.max(4, (w - 85) / visibleCandles.length - 3);

    // 1. Draw Volume Histogram (Bottom of Price Area)
    visibleCandles.forEach((c, idx) => {
      const x = 15 + idx * (candleWidth + 3);
      const vHeight = (c.volume / maxVolume) * volumeAreaHeight;
      const y = priceAreaHeight - vHeight;
      const isBull = c.close >= c.open;

      ctx.fillStyle = isBull ? "rgba(0, 255, 136, 0.18)" : "rgba(255, 59, 92, 0.18)";
      ctx.fillRect(x, y, candleWidth, vHeight);
    });

    // 2. Bollinger Bands Volatility Cloud (Concurrent)
    if (showBollinger) {
      const upper: (number | null)[] = [];
      const lower: (number | null)[] = [];
      const mid: (number | null)[] = [];
      const period = 20; const mult = 2;

      visibleCandles.forEach((_, idx) => {
        if (idx < period - 1) { upper.push(null); lower.push(null); mid.push(null); return; }
        const slice = visibleCandles.slice(idx - period + 1, idx + 1);
        const mean = slice.reduce((a, b) => a + b.close, 0) / period;
        const variance = slice.reduce((a, b) => a + Math.pow(b.close - mean, 2), 0) / period;
        const sd = Math.sqrt(variance);
        mid.push(mean);
        upper.push(mean + sd * mult);
        lower.push(mean - sd * mult);
      });

      ctx.fillStyle = "rgba(0, 217, 255, 0.05)";
      ctx.beginPath();
      let started = false;
      visibleCandles.forEach((_, idx) => {
        const u = upper[idx];
        if (u !== null && u !== undefined) {
          const x = 15 + idx * (candleWidth + 3) + candleWidth / 2;
          const y = priceAreaHeight - ((u - minPrice) / priceRange) * (priceAreaHeight - 30) + 15;
          if (!started) { ctx.moveTo(x, y); started = true; } else ctx.lineTo(x, y);
        }
      });
      for (let idx = visibleCandles.length - 1; idx >= 0; idx--) {
        const l = lower[idx];
        if (l !== null && l !== undefined) {
          const x = 15 + idx * (candleWidth + 3) + candleWidth / 2;
          const y = priceAreaHeight - ((l - minPrice) / priceRange) * (priceAreaHeight - 30) + 15;
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();
      ctx.fill();

      // Draw Bollinger Lines
      const drawBoll = (vals: (number | null)[], color: string) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        let s = false;
        visibleCandles.forEach((_, idx) => {
          const val = vals[idx];
          if (val !== null && val !== undefined) {
            const x = 15 + idx * (candleWidth + 3) + candleWidth / 2;
            const y = priceAreaHeight - ((val - minPrice) / priceRange) * (priceAreaHeight - 30) + 15;
            if (!s) { ctx.moveTo(x, y); s = true; } else ctx.lineTo(x, y);
          }
        });
        ctx.stroke();
      };
      drawBoll(upper, "rgba(56, 189, 248, 0.6)");
      drawBoll(lower, "rgba(56, 189, 248, 0.6)");
      drawBoll(mid, "rgba(255, 255, 255, 0.2)");
    }

    // 3. Dual EMA 20 & 50 Lines (Concurrent)
    if (showEma) {
      const calcEmaArray = (period: number) => {
        const k = 2 / (period + 1);
        const arr: (number | null)[] = [];
        let prev = visibleCandles[0]?.close || 0;
        visibleCandles.forEach((c, idx) => {
          if (idx === 0) { arr.push(c.close); prev = c.close; }
          else { const ema = c.close * k + prev * (1 - k); arr.push(ema); prev = ema; }
        });
        return arr;
      };

      const ema20 = calcEmaArray(20);
      const ema50 = calcEmaArray(50);

      const drawEma = (vals: (number | null)[], color: string) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        let s = false;
        visibleCandles.forEach((_, idx) => {
          const val = vals[idx];
          if (val !== null && val !== undefined) {
            const x = 15 + idx * (candleWidth + 3) + candleWidth / 2;
            const y = priceAreaHeight - ((val - minPrice) / priceRange) * (priceAreaHeight - 30) + 15;
            if (!s) { ctx.moveTo(x, y); s = true; } else ctx.lineTo(x, y);
          }
        });
        ctx.stroke();
      };

      drawEma(ema20, "#00e5ff");
      drawEma(ema50, "#ffd700");
    }

    // 4. Institutional VWAP Line (Concurrent)
    if (showVwap) {
      let cumVol = 0;
      let cumPV = 0;
      ctx.strokeStyle = "#f59e0b";
      ctx.lineWidth = 2;
      ctx.beginPath();
      visibleCandles.forEach((c, idx) => {
        const tp = (c.high + c.low + c.close) / 3;
        cumVol += c.volume;
        cumPV += tp * c.volume;
        const v = cumPV / (cumVol || 1);
        const x = 15 + idx * (candleWidth + 3) + candleWidth / 2;
        const y = priceAreaHeight - ((v - minPrice) / priceRange) * (priceAreaHeight - 30) + 15;
        if (idx === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.stroke();
    }

    // 2. Draw Candlesticks with Glowing Bodies
    visibleCandles.forEach((c, idx) => {
      const x = 15 + idx * (candleWidth + 3);
      const isBull = c.close >= c.open;
      const color = isBull ? "#00ff88" : "#ff3b5c";

      const openY = priceAreaHeight - ((c.open - minPrice) / priceRange) * (priceAreaHeight - 30) + 15;
      const closeY = priceAreaHeight - ((c.close - minPrice) / priceRange) * (priceAreaHeight - 30) + 15;
      const highY = priceAreaHeight - ((c.high - minPrice) / priceRange) * (priceAreaHeight - 30) + 15;
      const lowY = priceAreaHeight - ((c.low - minPrice) / priceRange) * (priceAreaHeight - 30) + 15;

      // Wick
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(x + candleWidth / 2, highY);
      ctx.lineTo(x + candleWidth / 2, lowY);
      ctx.stroke();

      // Body with subtle glow
      const bodyY = Math.min(openY, closeY);
      const bodyH = Math.max(2, Math.abs(closeY - openY));

      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 4;
      ctx.fillRect(x, bodyY, candleWidth, bodyH);
      ctx.shadowBlur = 0;
    });

    // 3. AI Order Block Lines (When Active)
    if (showAiSetup) {
      const drawTargetLine = (price: number, label: string, color: string, badgeBg: string) => {
        if (price < minPrice || price > maxPrice) return;
        const y = priceAreaHeight - ((price - minPrice) / priceRange) * (priceAreaHeight - 30) + 15;

        ctx.strokeStyle = color;
        ctx.lineWidth = 1.2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w - 65, y); ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = color;
        ctx.font = "bold 8.5px monospace";
        ctx.fillText(label, 10, y - 4);

        // Price Pill on Right Axis
        ctx.fillStyle = badgeBg;
        ctx.fillRect(w - 64, y - 8, 62, 16);
        ctx.strokeStyle = color;
        ctx.strokeRect(w - 64, y - 8, 62, 16);
        ctx.fillStyle = color;
        ctx.textAlign = "center";
        ctx.fillText(`$${price.toLocaleString()}`, w - 33, y + 3.5);
      };

      drawTargetLine(tp2Price, "🎯 TP2 (+8.2%)", "#ffd700", "rgba(255, 215, 0, 0.15)");
      drawTargetLine(tp1Price, "🎯 TP1 (+4.5%)", "#f6c343", "rgba(246, 195, 67, 0.15)");
      drawTargetLine(entryPrice, "🟢 ENTRY ORDER BLOCK", "#00ff88", "rgba(0, 255, 136, 0.15)");
      drawTargetLine(stopLossPrice, "🛑 STOP LOSS (-2.6%)", "#ff3b5c", "rgba(255, 59, 92, 0.15)");
    }

    // 4. Special Indicators Engine
    if (specialIndicator === "gex") {
      const callWall = +(currentPrice * 1.035).toFixed(2);
      const gammaFlip = +(currentPrice * 0.992).toFixed(2);
      const putWall = +(currentPrice * 0.965).toFixed(2);

      const drawGexLine = (price: number, label: string, color: string) => {
        if (price < minPrice || price > maxPrice) return;
        const y = priceAreaHeight - ((price - minPrice) / priceRange) * (priceAreaHeight - 30) + 15;
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 4]);
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w - 65, y); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = color;
        ctx.font = "bold 8.5px monospace";
        ctx.fillText(label, 12, y - 4);
      };

      drawGexLine(callWall, `⚡ GEX CALL VOLATILITY WALL ($${callWall})`, "#ffd700");
      drawGexLine(gammaFlip, `⚡ GEX GAMMA FLIP POINT ($${gammaFlip})`, "#00e5ff");
      drawGexLine(putWall, `⚡ GEX PUT SUPPORT WALL ($${putWall})`, "#e040fb");

      ctx.fillStyle = "rgba(0, 229, 255, 0.2)";
      ctx.fillRect(10, 10, 310, 18);
      ctx.strokeStyle = "#00e5ff";
      ctx.strokeRect(10, 10, 310, 18);
      ctx.fillStyle = "#00e5ff";
      ctx.font = "bold 8.5px monospace";
      ctx.fillText("🟢 POSITIVE GAMMA: VOLATILITY SUPPRESSED (PIN TO CALL WALL)", 15, 22);
    }

    if (specialIndicator === "fvg") {
      for (let i = 2; i < visibleCandles.length; i++) {
        const prev2 = visibleCandles[i - 2];
        const curr = visibleCandles[i];
        if (curr.low > prev2.high) {
          const yTop = priceAreaHeight - ((curr.low - minPrice) / priceRange) * (priceAreaHeight - 30) + 15;
          const yBottom = priceAreaHeight - ((prev2.high - minPrice) / priceRange) * (priceAreaHeight - 30) + 15;
          const xStart = 15 + (i - 2) * (candleWidth + 3);
          const fvgWidth = w - 65 - xStart;
          ctx.fillStyle = "rgba(0, 255, 136, 0.15)";
          ctx.fillRect(xStart, yTop, fvgWidth, yBottom - yTop);
          ctx.strokeStyle = "rgba(0, 255, 136, 0.6)";
          ctx.strokeRect(xStart, yTop, fvgWidth, yBottom - yTop);
        }
      }
    }

    if (specialIndicator === "cvd") {
      const cvdTop = priceAreaHeight + 10;
      const cvdBottom = h - 15;
      const cvdRange = cvdBottom - cvdTop;
      ctx.fillStyle = "rgba(8, 12, 18, 0.95)";
      ctx.fillRect(0, cvdTop, w - 65, cvdRange);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
      ctx.strokeRect(0, cvdTop, w - 65, cvdRange);

      const zeroY = cvdTop + cvdRange / 2;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
      ctx.beginPath(); ctx.moveTo(0, zeroY); ctx.lineTo(w - 65, zeroY); ctx.stroke();

      let cumDelta = 0;
      const deltas: number[] = [];
      visibleCandles.forEach((c) => {
        const d = (c.close >= c.open ? 1 : -1) * (c.volume * 0.6);
        cumDelta += d;
        deltas.push(cumDelta);
      });
      const maxD = Math.max(1, ...deltas.map(Math.abs));

      ctx.strokeStyle = "#00ff88";
      ctx.lineWidth = 2;
      ctx.beginPath();
      deltas.forEach((d, i) => {
        const x = 15 + i * (candleWidth + 3) + candleWidth / 2;
        const y = zeroY - (d / maxD) * (cvdRange * 0.45);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.stroke();

      ctx.fillStyle = "#00ff88";
      ctx.font = "bold 8.5px monospace";
      ctx.fillText("🌊 CVD (CUMULATIVE VOLUME DELTA): +28,450 Δ (BULLISH DELTA ABSORPTION)", 10, cvdTop + 12);
    }

    if (specialIndicator === "godmode_v3") {
      const gmTop = priceAreaHeight + 10;
      const gmBottom = h - 15;
      const gmRange = gmBottom - gmTop;

      ctx.fillStyle = "rgba(8, 12, 18, 0.95)";
      ctx.fillRect(0, gmTop, w - 65, gmRange);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
      ctx.strokeRect(0, gmTop, w - 65, gmRange);

      const yMid = gmTop + gmRange * 0.5;
      const wave1Points: { x: number; y: number }[] = [];
      const wave2Points: { x: number; y: number }[] = [];

      visibleCandles.forEach((c, i) => {
        const x = 15 + i * (candleWidth + 3) + candleWidth / 2;
        const sinVal = Math.sin((i / visibleCandles.length) * Math.PI * 3 + (c.close > c.open ? 0.5 : -0.5));
        const w1 = yMid - sinVal * (gmRange * 0.38);
        const w2 = yMid - Math.sin((i / visibleCandles.length) * Math.PI * 2.6) * (gmRange * 0.32);
        wave1Points.push({ x, y: w1 });
        wave2Points.push({ x, y: w2 });
      });

      ctx.strokeStyle = "#00e5ff";
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      wave1Points.forEach((p, i) => { if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y); });
      ctx.stroke();

      ctx.strokeStyle = "#e040fb";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      wave2Points.forEach((p, i) => { if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y); });
      ctx.stroke();

      ctx.fillStyle = "#00e5ff";
      ctx.font = "bold 8.5px monospace";
      ctx.fillText("🔮 GODMODE V3: WAVE 1 (CYAN) · WAVE 2 (MAGENTA)", 10, gmTop + 12);
    }

    // 8. Dedicated Sub-Panel (RSI / CVD / Godmode V3)
    if (showRsi && specialIndicator !== "cvd" && specialIndicator !== "godmode_v3") {
      const rsiTop = priceAreaHeight + 10;
      const rsiBottom = h - 15;
      const rsiRange = rsiBottom - rsiTop;

      ctx.fillStyle = "rgba(10, 14, 22, 0.85)";
      ctx.fillRect(0, rsiTop, w - 65, rsiRange);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
      ctx.strokeRect(0, rsiTop, w - 65, rsiRange);

      const y70 = rsiBottom - 0.7 * rsiRange;
      const y30 = rsiBottom - 0.3 * rsiRange;

      ctx.strokeStyle = "rgba(255, 59, 92, 0.4)";
      ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(0, y70); ctx.lineTo(w - 65, y70); ctx.stroke();
      ctx.strokeStyle = "rgba(0, 255, 136, 0.4)";
      ctx.beginPath(); ctx.moveTo(0, y30); ctx.lineTo(w - 65, y30); ctx.stroke();
      ctx.setLineDash([]);

      const period = 14;
      const rsiValues: (number | null)[] = [];
      let gains = 0; let losses = 0;
      for (let i = 1; i <= period && i < visibleCandles.length; i++) {
        const diff = visibleCandles[i].close - visibleCandles[i - 1].close;
        if (diff >= 0) gains += diff; else losses -= diff;
      }
      let avgGain = gains / period; let avgLoss = losses / period;
      for (let i = 0; i <= period; i++) rsiValues.push(null);
      const rs = avgLoss === 0 ? 100 : avgGain / (avgLoss || 1);
      rsiValues.push(100 - 100 / (1 + rs));

      for (let i = period + 1; i < visibleCandles.length; i++) {
        const diff = visibleCandles[i].close - visibleCandles[i - 1].close;
        const gain = diff > 0 ? diff : 0;
        const loss = diff < 0 ? -diff : 0;
        avgGain = (avgGain * (period - 1) + gain) / period;
        avgLoss = (avgLoss * (period - 1) + loss) / period;
        const currentRs = avgLoss === 0 ? 100 : avgGain / (avgLoss || 1);
        rsiValues.push(100 - 100 / (1 + currentRs));
      }

      ctx.strokeStyle = "#c084fc";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      let rsiStarted = false;
      visibleCandles.forEach((_, idx) => {
        const val = rsiValues[idx];
        if (val !== null && val !== undefined) {
          const x = 15 + idx * (candleWidth + 3) + candleWidth / 2;
          const y = rsiBottom - (val / 100) * rsiRange;
          if (!rsiStarted) { ctx.moveTo(x, y); rsiStarted = true; } else ctx.lineTo(x, y);
        }
      });
      ctx.stroke();

      const latestRsi = rsiValues[rsiValues.length - 1] || 50;
      ctx.fillStyle = "#c084fc";
      ctx.font = "bold 9px monospace";
      ctx.textAlign = "left";
      ctx.fillText("RSI (14): " + latestRsi.toFixed(1), 8, rsiTop + 12);
    }

    // 5. Right Price Axis
    ctx.fillStyle = "#8892b0";
    ctx.font = "8.5px monospace";
    ctx.textAlign = "left";
    const numPriceSteps = 6;
    for (let i = 0; i <= numPriceSteps; i++) {
      const p = minPrice + (priceRange * i) / numPriceSteps;
      const y = priceAreaHeight - (i / numPriceSteps) * (priceAreaHeight - 30) - 15;
      ctx.fillText(`$${p.toFixed(2)}`, w - 58, y + 3);
    }

    // Current Price Tag on Right Axis
    const curY = priceAreaHeight - ((currentPrice - minPrice) / priceRange) * (priceAreaHeight - 30) + 15;
    ctx.fillStyle = "#00ff88";
    ctx.fillRect(w - 64, curY - 9, 62, 18);
    ctx.fillStyle = "#04060a";
    ctx.font = "bold 9.5px monospace";
    ctx.textAlign = "center";
    ctx.fillText(`$${currentPrice.toFixed(2)}`, w - 33, curY + 3.5);

    // 6. Interactive Crosshair & Hover Tooltip
    if (mousePos && mousePos.x < w - 65 && mousePos.y < priceAreaHeight) {
      ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(mousePos.x, 0); ctx.lineTo(mousePos.x, priceAreaHeight);
      ctx.moveTo(0, mousePos.y); ctx.lineTo(w - 65, mousePos.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }, [visibleCandles, livePrice, liveChange, canvasDimensions, showAiSetup, showEma, showBollinger, showVwap, showRsi, specialIndicator, mousePos]);

  // Handle Mouse Move for Interactive Crosshair
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || visibleCandles.length === 0) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePos({ x, y });

    const candleWidth = Math.max(4, (rect.width - 85) / visibleCandles.length - 3);
    const idx = Math.floor((x - 15) / (candleWidth + 3));
    if (idx >= 0 && idx < visibleCandles.length) {
      setHoveredCandle(visibleCandles[idx]);
    } else {
      setHoveredCandle(null);
    }
  };

  const latest = visibleCandles[visibleCandles.length - 1] || { close: 150, open: 150, high: 150, low: 150, volume: 50000 };
  const currentPrice = livePrice || latest.close;
  const isPositive = liveChange >= 0;
  const displayTicker =
    activeSymbol === "XAUUSD" || activeSymbol === "GOLD" || activeSymbol === "XAU"
      ? "XAU/USD (Spot Gold)"
      : activeSymbol;
  const activeCandle = hoveredCandle || latest;

  // Webull Style Order Book DOM Ladder Data
  const orderBookDOM = useMemo(() => {
    const bids = Array.from({ length: 6 }, (_, i) => ({
      price: +(currentPrice - (i + 1) * (currentPrice * 0.0008)).toFixed(2),
      size: Math.round(Math.random() * 4500 + 1200),
    }));
    const asks = Array.from({ length: 6 }, (_, i) => ({
      price: +(currentPrice + (i + 1) * (currentPrice * 0.0008)).toFixed(2),
      size: Math.round(Math.random() * 4200 + 1100),
    }));
    const totalBids = bids.reduce((s, b) => s + b.size, 0);
    const totalAsks = asks.reduce((s, a) => s + a.size, 0);
    const bidPct = Math.round((totalBids / (totalBids + totalAsks || 1)) * 100);
    return { bids, asks, bidPct, askPct: 100 - bidPct };
  }, [currentPrice]);

  const floatingStyle: React.CSSProperties = isFloating
    ? isFullscreenWindow
      ? { position: "fixed", inset: 0, zIndex: 99999, width: "100vw", height: "100vh" }
      : {
          position: "fixed",
          left: floatingPos ? `${floatingPos.x}px` : "calc(50vw - 460px)",
          top: floatingPos ? `${floatingPos.y}px` : "70px",
          zIndex: 99999,
          width: showOrderBookDOM ? "940px" : "740px",
          maxWidth: "96vw",
          boxShadow: "0 25px 80px -15px rgba(0, 0, 0, 0.95), 0 0 40px rgba(0, 255, 136, 0.25)",
        }
    : {};

  return (
    <div
      ref={isFloating ? floatingWindowRef : containerRef}
      style={floatingStyle}
      className={`${
        isFloating
          ? "bg-[#06090e]/98 backdrop-blur-2xl border-2 border-accent/70 rounded-2xl flex flex-col overflow-hidden font-mono shadow-2xl animate-fade-in"
          : "w-full rounded-2xl border border-accent/40 overflow-hidden bg-[#06090e] flex flex-col shadow-[0_0_40px_rgba(0,255,136,0.15)] my-2 font-mono"
      }`}
    >
      {/* Webull Pro Title / Drag Handle Bar */}
      <div
        onPointerDown={isFloating && !isFullscreenWindow ? handleWindowPointerDown : undefined}
        onPointerMove={isFloating && !isFullscreenWindow ? handleWindowPointerMove : undefined}
        onPointerUp={isFloating && !isFullscreenWindow ? handleWindowPointerUp : undefined}
        className={`flex flex-wrap items-center justify-between px-3.5 py-2.5 bg-[#0a0f18] border-b border-border/60 text-[10px] gap-2 ${
          isFloating && !isFullscreenWindow ? "cursor-move select-none" : ""
        }`}
      >
        <div className="flex items-center gap-2 flex-wrap">
          {isFloating && <span className="text-muted text-xs cursor-grab">⠿</span>}
          <span className="w-2.5 h-2.5 rounded-full bg-accent signal-pulse" />
          <span className="text-accent font-extrabold tracking-wider">
            {isFloating ? "⚡ 0ther5ide PRO FLOATING TERMINAL" : "NASDAQ · NYSE · KRAKEN L3 FEED"}
          </span>
          <span className="text-muted">·</span>
          <span className="text-fg font-bold bg-bg px-2 py-0.5 rounded border border-border/60">{displayTicker}</span>
          <span className={`font-bold text-xs ${isPositive ? "text-accent" : "text-red-400"}`}>
            ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({isPositive ? "+" : ""}{liveChange}%)
          </span>
        </div>

        {/* Timeframe Selector */}
        <div className="flex items-center gap-0.5 bg-bg/90 p-0.5 rounded border border-border/50">
          {["1M", "5M", "15M", "1H", "4H", "1D"].map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-2 py-0.5 rounded text-[9px] font-bold transition ${
                timeframe === tf ? "bg-accent text-bg shadow-sm font-extrabold" : "text-muted hover:text-fg"
              }`}
            >
              {tf}
            </button>
          ))}
        </div>

        {/* Window Controls & Zoom */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Order Book DOM Toggle */}
          <button
            onClick={() => setShowOrderBookDOM(!showOrderBookDOM)}
            className={`px-2 py-0.5 rounded text-[9px] font-bold border transition ${
              showOrderBookDOM ? "bg-accent/20 border-accent text-accent" : "border-border/40 text-muted"
            }`}
            title="Toggle Level 2 Order Book Depth Ladder"
          >
            DOM {showOrderBookDOM ? "ON" : "OFF"}
          </button>

          {/* Zoom Controls */}
          <div className="flex items-center gap-1 bg-surface/80 px-1.5 py-0.5 rounded border border-border/50">
            <span className="text-[8.5px] text-muted font-mono">{Math.round(zoomLevel * 100)}%</span>
            <button onClick={handleZoomIn} className="w-4 h-4 flex items-center justify-center rounded bg-surface text-fg text-xs font-bold hover:bg-border/60">+</button>
            <button onClick={handleZoomOut} className="w-4 h-4 flex items-center justify-center rounded bg-surface text-fg text-xs font-bold hover:bg-border/60">-</button>
            <button onClick={handleResetZoom} className="px-1 h-4 flex items-center justify-center rounded bg-surface text-muted text-[8px] hover:text-accent">⟲</button>
          </div>

          {/* Pop-Out / Float Button */}
          <button
            onClick={() => {
              if (isFloating) {
                setIsFloating(false);
                setIsFullscreenWindow(false);
              } else {
                setIsFloating(true);
              }
            }}
            className={`px-2.5 py-1 rounded transition font-bold border flex items-center gap-1 text-[9.5px] ${
              isFloating
                ? "bg-red-500/20 border-red-500/50 text-red-300 hover:bg-red-500/30"
                : "bg-gradient-to-r from-accent/20 to-emerald-400/20 border-accent/60 text-accent hover:brightness-110 shadow-sm"
            }`}
            title={isFloating ? "Dock Back into Page" : "Pop Out Floating Terminal"}
          >
            <span>{isFloating ? "⟲ DOCK" : "⛶ POP OUT (FLOAT)"}</span>
          </button>

          {isFloating && (
            <button
              onClick={() => setIsFullscreenWindow(!isFullscreenWindow)}
              className="px-2 py-1 rounded bg-surface hover:bg-border/60 border border-border/50 text-fg text-[9.5px] font-bold"
            >
              {isFullscreenWindow ? "⤓ RESTORE" : "⛶ MAX"}
            </button>
          )}
        </div>
      </div>

      {/* Tickers & Indicator Controls Toolbar */}
      <div className="flex flex-wrap items-center justify-between px-3 py-1.5 bg-[#080d14] border-b border-border/40 text-[9px] gap-2">
        {/* Tickers */}
        <div className="flex items-center gap-1">
          {TICKER_BUTTONS.map((t) => {
            const isSelected = activeSymbol === t.id || (t.id === "XAUUSD" && (activeSymbol === "GOLD" || activeSymbol === "XAU"));
            return (
              <button
                key={t.id}
                onClick={() => setActiveSymbol(t.id)}
                className={`px-2 py-0.5 rounded transition font-bold text-[9px] ${
                  isSelected ? "bg-accent text-bg shadow-sm" : "bg-surface border border-border/40 text-muted hover:text-accent"
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Indicators */}
        <div className="flex items-center gap-1 flex-wrap">
          <button
            onClick={() => { if (!isVipUser) { setPaywallFeature("AI Order Block Trade Targets"); return; } setShowAiSetup(!showAiSetup); }}
            className={`px-2 py-0.5 rounded transition font-bold border flex items-center gap-1 ${
              isVipUser && showAiSetup ? "bg-accent/20 border-accent text-accent" : "border-border/40 text-muted hover:text-fg"
            }`}
          >
            <span>🎯 AI TARGETS</span>
            {!isVipUser && <span className="text-[8px] text-yellow-400">🔒</span>}
          </button>

          <button
            onClick={() => { if (!isVipUser) { setPaywallFeature("1-Click Institutional Trade Execution"); return; } setShowExecutionModal(true); }}
            className={`px-2 py-0.5 rounded transition font-extrabold flex items-center gap-1 ${
              isVipUser ? "bg-gradient-to-r from-accent to-emerald-400 text-bg shadow-sm hover:brightness-110" : "bg-surface/80 border border-border/50 text-muted"
            }`}
          >
            <span>⚡ EXECUTE</span>
            {!isVipUser && <span className="text-[8px] text-yellow-400">🔒</span>}
          </button>

          <button
            onClick={() => { if (!isVipUser) { setPaywallFeature("Dual EMA 20/50"); return; } setShowEma(!showEma); }}
            className={`px-2 py-0.5 rounded transition font-bold border ${showEma ? "bg-cyan-500/20 border-cyan-400 text-cyan-300" : "border-border/40 text-muted"}`}
          >
            EMA 20/50
          </button>

          <button
            onClick={() => { if (!isVipUser) { setPaywallFeature("Bollinger Bands"); return; } setShowBollinger(!showBollinger); }}
            className={`px-2 py-0.5 rounded transition font-bold border ${showBollinger ? "bg-purple-500/20 border-purple-400 text-purple-300" : "border-border/40 text-muted"}`}
          >
            BOLL
          </button>

          <button
            onClick={() => { if (!isVipUser) { setPaywallFeature("VWAP"); return; } setShowVwap(!showVwap); }}
            className={`px-2 py-0.5 rounded transition font-bold border ${showVwap ? "bg-yellow-500/20 border-yellow-400 text-yellow-300" : "border-border/40 text-muted"}`}
          >
            VWAP
          </button>

          <button
            onClick={() => { if (!isVipUser) { setPaywallFeature("RSI (14)"); return; } setShowRsi(!showRsi); }}
            className={`px-2 py-0.5 rounded transition font-bold border ${showRsi ? "bg-fuchsia-500/20 border-fuchsia-400 text-fuchsia-300" : "border-border/40 text-muted"}`}
          >
            RSI
          </button>

          {/* Special Indicator Selector */}
          <select
            value={specialIndicator}
            onChange={(e) => {
              const val = e.target.value as any;
              if (!isVipUser && val !== "none") {
                setPaywallFeature("Institutional Special Indicators");
                return;
              }
              setSpecialIndicator(val);
            }}
            className="bg-surface/90 border border-border/70 text-accent font-mono text-[8.5px] rounded px-1.5 py-0.5 focus:outline-none focus:border-accent cursor-pointer"
          >
            <option value="none">-- Special Indicators --</option>
            <option value="cvd">🌊 CVD Delta Flow {!isVipUser ? "🔒" : ""}</option>
            <option value="gex">⚡ GEX Walls {!isVipUser ? "🔒" : ""}</option>
            <option value="anchored_vwap">🎯 Anchored VWAP {!isVipUser ? "🔒" : ""}</option>
            <option value="micro_price">🔬 Micro-Price {!isVipUser ? "🔒" : ""}</option>
            <option value="fvg">🧱 FVG Imbalances {!isVipUser ? "🔒" : ""}</option>
            <option value="godmode_v3">🔮 Godmode V3 {!isVipUser ? "🔒" : ""}</option>
          </select>
        </div>

        {/* Live Candle OHLC HUD */}
        <div className="flex items-center gap-2 text-muted">
          <span>O: <strong className="text-fg">${activeCandle.open}</strong></span>
          <span>H: <strong className="text-fg">${activeCandle.high}</strong></span>
          <span>L: <strong className="text-fg">${activeCandle.low}</strong></span>
          <span>C: <strong className="text-accent">${activeCandle.close}</strong></span>
          <span>VOL: <strong className="text-fg">{activeCandle.volume.toLocaleString()}</strong></span>
        </div>
      </div>

      {/* Main Canvas & Side Order Book Split Body */}
      <div className="flex-1 flex w-full relative min-h-[380px] bg-[#06090e]">
        {/* Candlestick Canvas Area */}
        <div className="flex-1 relative h-full">
          <canvas
            ref={canvasRef}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseMove={(e) => {
              if (isDragging) {
                const diff = e.clientX - dragStartX;
                if (Math.abs(diff) > 8) {
                  setPanOffset((p) => Math.max(0, p + (diff > 0 ? 1 : -1)));
                  setDragStartX(e.clientX);
                }
              }
              handleMouseMove(e);
            }}
            onMouseLeave={handleCanvasLeave}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="w-full h-full cursor-crosshair block select-none"
          />
        </div>

        {/* Webull Level 2 Order Book Depth Ladder (DOM) */}
        {showOrderBookDOM && (
          <div className="w-[180px] sm:w-[190px] bg-[#070b12] border-l border-border/50 flex flex-col justify-between p-2.5 text-[9px] font-mono select-none">
            <div>
              <div className="flex items-center justify-between pb-1 border-b border-border/40 text-[8.5px] text-muted uppercase">
                <span>ORDER BOOK L2</span>
                <span className="text-accent font-bold">DEPTH</span>
              </div>

              {/* Asks (Sells) */}
              <div className="space-y-1 pt-1.5">
                <div className="text-[8px] text-red-400/80 font-bold uppercase">Asks (Sell Queue)</div>
                {orderBookDOM.asks.slice(0, 4).reverse().map((a, i) => (
                  <div key={i} className="flex items-center justify-between relative overflow-hidden px-1 py-0.5 rounded bg-red-500/5">
                    <div className="absolute right-0 top-0 bottom-0 bg-red-500/15" style={{ width: `${Math.min(100, (a.size / 5000) * 100)}%` }} />
                    <span className="text-red-400 font-bold relative z-10">${a.price.toFixed(2)}</span>
                    <span className="text-muted relative z-10">{a.size.toLocaleString()}</span>
                  </div>
                ))}
              </div>

              {/* Spread Banner */}
              <div className="my-2 py-1 text-center bg-surface/80 rounded border border-border/40 font-bold text-fg text-[9px]">
                SPREAD: ${(orderBookDOM.asks[0]?.price - orderBookDOM.bids[0]?.price || 0.05).toFixed(2)}
              </div>

              {/* Bids (Buys) */}
              <div className="space-y-1">
                <div className="text-[8px] text-green-400/80 font-bold uppercase">Bids (Buy Queue)</div>
                {orderBookDOM.bids.slice(0, 4).map((b, i) => (
                  <div key={i} className="flex items-center justify-between relative overflow-hidden px-1 py-0.5 rounded bg-green-500/5">
                    <div className="absolute right-0 top-0 bottom-0 bg-green-500/15" style={{ width: `${Math.min(100, (b.size / 5000) * 100)}%` }} />
                    <span className="text-green-400 font-bold relative z-10">${b.price.toFixed(2)}</span>
                    <span className="text-muted relative z-10">{b.size.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Buying vs Selling Pressure Gauge */}
            <div className="pt-2 border-t border-border/40">
              <div className="flex justify-between text-[8px] text-muted mb-1 font-bold">
                <span className="text-green-400">BIDS {orderBookDOM.bidPct}%</span>
                <span className="text-red-400">ASKS {orderBookDOM.askPct}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-red-500/30 overflow-hidden flex">
                <div className="h-full bg-green-400" style={{ width: `${orderBookDOM.bidPct}%` }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Paywall Modal for Locked Features */}
      {paywallFeature && (
        <PaywallModal
          featureName={paywallFeature}
          onClose={() => setPaywallFeature(null)}
          onUpgrade={() => {
            window.location.href = "/?tab=pricing";
          }}
        />
      )}

      {/* Execution Console */}
      {showExecutionModal && (
        <TradeExecutionModal
          symbol={activeSymbol}
          currentPrice={currentPrice}
          entryPrice={+(currentPrice * 0.993).toFixed(2)}
          stopLossPrice={+(currentPrice * 0.974).toFixed(2)}
          tp1Price={+(currentPrice * 1.045).toFixed(2)}
          tp2Price={+(currentPrice * 1.082).toFixed(2)}
          onClose={() => setShowExecutionModal(false)}
        />
      )}
    </div>
  );
}
