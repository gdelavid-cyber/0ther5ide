export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";

interface Candle {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

const KRAKEN_PAIRS: Record<string, string> = {
  BTC: "XBTUSD",
  BITCOIN: "XBTUSD",
  ETH: "ETHUSD",
  ETHEREUM: "ETHUSD",
  SOL: "SOLUSD",
  SOLANA: "SOLUSD",
  XAUUSD: "PAXGUSD",
  GOLD: "PAXGUSD",
  XAU: "PAXGUSD",
};

const YAHOO_SYMBOLS: Record<string, string> = {
  NVDA: "NVDA",
  TSLA: "TSLA",
  SPY: "SPY",
  AAPL: "AAPL",
  MSFT: "MSFT",
  AMZN: "AMZN",
  GOOGL: "GOOGL",
  GOLD: "GC=F",
  XAUUSD: "GC=F",
  XAU: "GC=F",
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const rawSymbol = (searchParams.get("symbol") || "NVDA").toUpperCase().replace(/[^A-Z]/g, "");

  let currentPrice = 0;
  let change24h = 0;
  let high24h = 0;
  let low24h = 0;
  let candles: Candle[] = [];
  let source = "Global Live Exchange";

  // 1. Try Kraken Live Exchange Candles (Crypto & PAXG Gold)
  if (KRAKEN_PAIRS[rawSymbol]) {
    try {
      const pair = KRAKEN_PAIRS[rawSymbol];
      const res = await fetch(`https://api.kraken.com/0/public/OHLC?pair=${pair}&interval=15`, {
        next: { revalidate: 3 },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.result) {
          const pairKey = Object.keys(data.result)[0];
          const raw = data.result[pairKey] as Array<[number, string, string, string, string, string, string, number]>;
          if (raw && raw.length > 0) {
            const recent = raw.slice(-42);
            candles = recent.map((item) => {
              const t = new Date(item[0] * 1000);
              return {
                time: t.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                open: parseFloat(item[1]),
                high: parseFloat(item[2]),
                low: parseFloat(item[3]),
                close: parseFloat(item[4]),
                volume: Math.round(parseFloat(item[6])),
              };
            });

            const last = candles[candles.length - 1];
            const first = candles[0];
            currentPrice = last.close;
            change24h = +(((last.close - first.open) / first.open) * 100).toFixed(2);
            high24h = Math.max(...candles.map((c) => c.high));
            low24h = Math.min(...candles.map((c) => c.low));
            source = `Kraken Live (${pair})`;
          }
        }
      }
    } catch {}
  }

  // 2. If not crypto or if Kraken failed, fetch 100% Real Candles from Yahoo Finance Chart API
  if (candles.length === 0) {
    try {
      const ySymbol = YAHOO_SYMBOLS[rawSymbol] || rawSymbol;
      const res = await fetch(
        `https://query1.finance.yahoo.com/v8/finance/chart/${ySymbol}?interval=15m&range=5d`,
        {
          headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
          next: { revalidate: 3 },
        }
      );
      if (res.ok) {
        const data = await res.json();
        const result = data.chart?.result?.[0];
        if (result) {
          const timestamps = result.timestamp || [];
          const quote = result.indicators?.quote?.[0] || {};
          const opens = quote.open || [];
          const highs = quote.high || [];
          const lows = quote.low || [];
          const closes = quote.close || [];
          const volumes = quote.volume || [];

          const parsed: Candle[] = [];
          for (let i = 0; i < timestamps.length; i++) {
            if (closes[i] !== null && closes[i] !== undefined) {
              const t = new Date(timestamps[i] * 1000);
              parsed.push({
                time: t.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                open: +(opens[i] || closes[i]).toFixed(2),
                high: +(highs[i] || closes[i]).toFixed(2),
                low: +(lows[i] || closes[i]).toFixed(2),
                close: +closes[i].toFixed(2),
                volume: Math.round(volumes[i] || 1000),
              });
            }
          }

          if (parsed.length > 0) {
            candles = parsed.slice(-42);
            currentPrice = result.meta?.regularMarketPrice || candles[candles.length - 1].close;
            const first = candles[0];
            change24h = +(((currentPrice - first.open) / first.open) * 100).toFixed(2);
            high24h = result.meta?.regularMarketDayHigh || Math.max(...candles.map((c) => c.high));
            low24h = result.meta?.regularMarketDayLow || Math.min(...candles.map((c) => c.low));
            source = `NASDAQ/NYSE Real-Time (${ySymbol})`;
          }
        }
      }
    } catch {}
  }

  // 3. Fallback to Finnhub live quote if needed
  if (currentPrice === 0 || candles.length === 0) {
    const finnhubKey = process.env.FINNHUB_API_KEY || "daad3n9r01qvosod85ngdaad3n9r01qvosod85o0";
    try {
      const res = await fetch(`https://finnhub.io/api/v1/quote?symbol=${rawSymbol}&token=${finnhubKey}`, { next: { revalidate: 3 } });
      if (res.ok) {
        const q = await res.json();
        if (q.c && q.c > 0) {
          currentPrice = q.c;
          change24h = q.dp || 0;
          high24h = q.h || q.c;
          low24h = q.l || q.c;
          source = "Finnhub Live Quote";
        }
      }
    } catch {}
  }

  return NextResponse.json({
    symbol: rawSymbol,
    price: currentPrice,
    change24h,
    high: high24h,
    low: low24h,
    candles,
    candleCount: candles.length,
    source,
    timestamp: new Date().toISOString(),
  });
}
