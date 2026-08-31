export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { generateOrderFlowData } from "@/lib/feeds/orderflow";

const KRAKEN_PAIRS: Record<string, string> = {
  BTC: "XBTUSD",
  ETH: "ETHUSD",
  SOL: "SOLUSD",
  XAUUSD: "PAXGUSD",
  GOLD: "PAXGUSD",
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawTicker = (searchParams.get("ticker") || "NVDA").toUpperCase().replace(/[^A-Z]/g, "");

    let liveSpot = 0;

    // 1. If Crypto/Gold, query Kraken for live spot price
    if (KRAKEN_PAIRS[rawTicker]) {
      try {
        const pair = KRAKEN_PAIRS[rawTicker];
        const res = await fetch(`https://api.kraken.com/0/public/Ticker?pair=${pair}`, {
          next: { revalidate: 3 },
        });
        if (res.ok) {
          const json = await res.json();
          const pKey = Object.keys(json.result)[0];
          liveSpot = parseFloat(json.result[pKey].c[0]);
        }
      } catch {}
    }

    // 2. If US Equities, query Finnhub
    if (liveSpot === 0) {
      const finnhubKey = process.env.FINNHUB_API_KEY || "daad3n9r01qvosod85ngdaad3n9r01qvosod85o0";
      try {
        const res = await fetch(`https://finnhub.io/api/v1/quote?symbol=${rawTicker}&token=${finnhubKey}`, {
          next: { revalidate: 3 },
        });
        if (res.ok) {
          const q = await res.json();
          if (q.c && q.c > 0) liveSpot = q.c;
        }
      } catch {}
    }

    // Generate comprehensive, deduplicated institutional order flow telemetry
    const flowData = generateOrderFlowData(rawTicker, liveSpot);
    return Response.json(flowData);
  } catch (err) {
    return Response.json({ error: "Failed to generate order flow telemetry" }, { status: 500 });
  }
}
