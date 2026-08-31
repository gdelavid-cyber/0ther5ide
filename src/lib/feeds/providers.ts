// Multi-Provider Exchange & Market Intelligence Adapter
export interface MarketProviderStatus {
  polygon: boolean;
  finnhub: boolean;
  benzinga: boolean;
  secEdgar: boolean;
  mode: "LIVE_EXCHANGE_FEEDS" | "CALIBRATED_SYNTHESIS";
}

export function getProviderStatus(): MarketProviderStatus {
  const polygonKey = !!process.env.POLYGON_API_KEY;
  const finnhubKey = !!process.env.FINNHUB_API_KEY;
  const benzingaKey = !!process.env.BENZINGA_API_KEY;

  return {
    polygon: polygonKey,
    finnhub: finnhubKey,
    benzinga: benzingaKey,
    secEdgar: true,
    mode: (polygonKey || finnhubKey || benzingaKey) ? "LIVE_EXCHANGE_FEEDS" : "CALIBRATED_SYNTHESIS",
  };
}

export async function fetchLiveTickerPrice(ticker: string): Promise<{ price: number; changePct: number } | null> {
  const finnhubKey = process.env.FINNHUB_API_KEY;
  if (finnhubKey) {
    try {
      const res = await fetch(`https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${finnhubKey}`);
      if (res.ok) {
        const data = await res.json();
        return { price: data.c, changePct: data.dp };
      }
    } catch {}
  }

  // Polygon.io fallback
  const polygonKey = process.env.POLYGON_API_KEY;
  if (polygonKey) {
    try {
      const res = await fetch(`https://api.polygon.io/v2/aggs/ticker/${ticker}/prev?apiKey=${polygonKey}`);
      if (res.ok) {
        const data = await res.json();
        const prev = data.results?.[0];
        if (prev) return { price: prev.c, changePct: ((prev.c - prev.o) / prev.o) * 100 };
      }
    } catch {}
  }

  return null;
}
