import type { OrderFlowData, OptionFlowItem, DarkPoolPrint, OrderBookLadder, FlowDecomposition, OrderBookLevel } from "@/lib/types";

const EXPIRIES_2026 = ["2026-09-18", "2026-10-16", "2026-11-20", "2026-12-18", "2027-01-15"];

export function generateOrderFlowData(selectedTicker: string = "NVDA", liveSpot?: number): OrderFlowData {
  const ticker = selectedTicker.toUpperCase().replace(/[^A-Z]/g, "");
  const spotMap: Record<string, number> = {
    NVDA: 128.50,
    PLTR: 34.20,
    TSLA: 218.80,
    AAPL: 226.10,
    SPY: 564.40,
    QQQ: 482.20,
    LMT: 565.30,
    MSFT: 448.90,
    BTC: 78200.0,
    ETH: 3150.0,
    SOL: 184.0,
    XAUUSD: 2518.0,
    GOLD: 2518.0,
  };

  const spot = liveSpot && liveSpot > 0 ? liveSpot : (spotMap[ticker] || 150.0);
  const now = Date.now();

  // Dynamic Options Flow
  const optionsFlow: OptionFlowItem[] = [
    {
      id: `flow-${ticker}-1-${now}`,
      ticker,
      type: "GOLDEN_SWEEP",
      strike: Math.round((spot * 1.05) / (spot > 500 ? 10 : 2.5)) * (spot > 500 ? 10 : 2.5),
      expiry: EXPIRIES_2026[0],
      sentiment: "BULLISH",
      contractType: "CALL",
      premium: Math.round(spot * 18500),
      size: 4800,
      spotPrice: spot,
      volume: 12500,
      openInterest: 1850,
      volOiRatio: 6.75,
      timestamp: new Date(now - 1000 * 35).toISOString(),
      venue: "MULTI-EXCHANGE (CBOE/PHLX/ISE)",
      isUnusual: true,
    },
    {
      id: `flow-${ticker}-2-${now}`,
      ticker,
      type: "SWEEP",
      strike: Math.round((spot * 1.02) / (spot > 500 ? 10 : 2.5)) * (spot > 500 ? 10 : 2.5),
      expiry: EXPIRIES_2026[1],
      sentiment: "BULLISH",
      contractType: "CALL",
      premium: Math.round(spot * 8200),
      size: 1950,
      spotPrice: spot,
      volume: 4800,
      openInterest: 920,
      volOiRatio: 5.21,
      timestamp: new Date(now - 1000 * 95).toISOString(),
      venue: "NASDAQ (NOM/BX)",
      isUnusual: true,
    },
    {
      id: `flow-${ticker}-3-${now}`,
      ticker,
      type: "BLOCK",
      strike: Math.round((spot * 0.96) / (spot > 500 ? 10 : 2.5)) * (spot > 500 ? 10 : 2.5),
      expiry: EXPIRIES_2026[2],
      sentiment: "BEARISH",
      contractType: "PUT",
      premium: Math.round(spot * 11500),
      size: 3200,
      spotPrice: spot,
      volume: 5100,
      openInterest: 4200,
      volOiRatio: 1.21,
      timestamp: new Date(now - 1000 * 210).toISOString(),
      venue: "FINRA ADF DARK POOL",
      isUnusual: false,
    },
    {
      id: `flow-${ticker}-4-${now}`,
      ticker,
      type: "GOLDEN_SWEEP",
      strike: Math.round((spot * 1.08) / (spot > 500 ? 10 : 2.5)) * (spot > 500 ? 10 : 2.5),
      expiry: EXPIRIES_2026[3],
      sentiment: "BULLISH",
      contractType: "CALL",
      premium: Math.round(spot * 26000),
      size: 7500,
      spotPrice: spot,
      volume: 24000,
      openInterest: 3100,
      volOiRatio: 7.74,
      timestamp: new Date(now - 1000 * 380).toISOString(),
      venue: "CBOE AGGRESSIVE",
      isUnusual: true,
    },
    {
      id: `flow-${ticker}-5-${now}`,
      ticker,
      type: "SWEEP",
      strike: Math.round((spot * 0.98) / (spot > 500 ? 10 : 2.5)) * (spot > 500 ? 10 : 2.5),
      expiry: EXPIRIES_2026[0],
      sentiment: "BEARISH",
      contractType: "PUT",
      premium: Math.round(spot * 7400),
      size: 1400,
      spotPrice: spot,
      volume: 3800,
      openInterest: 1600,
      volOiRatio: 2.37,
      timestamp: new Date(now - 1000 * 540).toISOString(),
      venue: "BOX EXCH",
      isUnusual: false,
    },
  ];

  // Dynamic Dark Pool Prints strictly matching DarkPoolPrint
  const darkPoolPrints: DarkPoolPrint[] = [
    {
      id: `dp-${ticker}-1-${now}`,
      ticker,
      price: +(spot * 0.9992).toFixed(2),
      size: Math.round(Math.random() * 85000 + 45000),
      premium: Math.round(spot * 65000),
      exchange: "FINRA ADF (Off-Exchange)",
      timestamp: new Date(now - 1000 * 25).toISOString(),
      side: "ABOVE_ASK",
      sentiment: "BULLISH",
    },
    {
      id: `dp-${ticker}-2-${now}`,
      ticker,
      price: +(spot * 1.0004).toFixed(2),
      size: Math.round(Math.random() * 120000 + 80000),
      premium: Math.round(spot * 105000),
      exchange: "IEX ATS DARK CROSS",
      timestamp: new Date(now - 1000 * 85).toISOString(),
      side: "MID",
      sentiment: "BULLISH",
    },
    {
      id: `dp-${ticker}-3-${now}`,
      ticker,
      price: +(spot * 0.9985).toFixed(2),
      size: Math.round(Math.random() * 45000 + 30000),
      premium: Math.round(spot * 38000),
      exchange: "UBS ATS PINS",
      timestamp: new Date(now - 1000 * 190).toISOString(),
      side: "BELOW_BID",
      sentiment: "NEUTRAL",
    },
    {
      id: `dp-${ticker}-4-${now}`,
      ticker,
      price: +(spot * 1.0012).toFixed(2),
      size: Math.round(Math.random() * 190000 + 110000),
      premium: Math.round(spot * 150000),
      exchange: "CITADEL CONNECT CROSS",
      timestamp: new Date(now - 1000 * 310).toISOString(),
      side: "ABOVE_ASK",
      sentiment: "BULLISH",
    },
  ];

  const totalSweepVolume = optionsFlow.reduce((sum, f) => sum + f.premium, 0);
  const bullishSweepVol = optionsFlow.filter((f) => f.sentiment === "BULLISH").reduce((sum, f) => sum + f.premium, 0);
  const bullishFlowPercent = Math.round((bullishSweepVol / (totalSweepVolume || 1)) * 100);
  const darkPoolTotalValue = darkPoolPrints.reduce((sum, d) => sum + d.premium, 0);

  const bids: OrderBookLevel[] = Array.from({ length: 8 }, (_, i) => ({
    price: +(spot - (i + 1) * (spot * 0.001)).toFixed(2),
    size: Math.round(Math.random() * 3000 + 800),
    total: Math.round((i + 1) * 2800),
    delta: Math.round(Math.random() * 400 - 150),
    isImbalance: i === 1,
  }));

  const asks: OrderBookLevel[] = Array.from({ length: 8 }, (_, i) => ({
    price: +(spot + (i + 1) * (spot * 0.001)).toFixed(2),
    size: Math.round(Math.random() * 2800 + 750),
    total: Math.round((i + 1) * 2600),
    delta: Math.round(Math.random() * 400 - 150),
    isImbalance: false,
  }));

  const bidDepthTotal = bids.reduce((acc, b) => acc + b.size, 0);
  const askDepthTotal = asks.reduce((acc, a) => acc + a.size, 0);

  const orderBook: OrderBookLadder = {
    ticker,
    currentPrice: spot,
    bids,
    asks,
    spread: +(spot * 0.0004).toFixed(2),
    bidDepthTotal,
    askDepthTotal,
    imbalanceRatio: +(bidDepthTotal / (askDepthTotal || 1)).toFixed(2),
  };

  const decomposition: FlowDecomposition = {
    ticker,
    institutionalDominance: 78.4,
    institutionalNetDelta: +184500,
    retailShare: 21.6,
    hftShare: 42.1,
    darkPoolVolumeRatio: 62.4,
    gammaExposureGEX: "POSITIVE_GAMMA",
    verdict: "STRONG_INSTITUTIONAL_ACCUMULATION",
  };

  return {
    optionsFlow,
    darkPoolPrints,
    orderBook,
    decomposition,
    summary: {
      totalSweepVolume,
      bullishFlowPercent,
      darkPoolTotalValue,
      topActiveTickers: ["NVDA", "TSLA", "SPY", "BTC", "PLTR", "AAPL"],
      updatedAt: new Date().toISOString(),
    },
  };
}
