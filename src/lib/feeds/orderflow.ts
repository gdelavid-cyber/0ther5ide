import type { OrderFlowData, OptionFlowItem, DarkPoolPrint, OrderBookLadder, FlowDecomposition } from "@/lib/types";

const TICKERS = ["NVDA", "PLTR", "TSLA", "AAPL", "SPY", "QQQ", "LMT", "MSFT"];

export function generateOrderFlowData(selectedTicker: string = "NVDA"): OrderFlowData {
  const ticker = selectedTicker.toUpperCase();
  const spotMap: Record<string, number> = {
    NVDA: 128.50,
    PLTR: 32.40,
    TSLA: 218.80,
    AAPL: 226.10,
    SPY: 562.40,
    QQQ: 480.20,
    LMT: 565.30,
    MSFT: 448.90,
  };
  const spot = spotMap[ticker] || 150.00;

  // 1. Institutional Options Flow (Sweeps, Blocks, Golden Sweeps)
  const optionsFlow: OptionFlowItem[] = [
    {
      id: "flow-1",
      ticker,
      type: "GOLDEN_SWEEP",
      strike: Math.round((spot * 1.06) / 5) * 5,
      expiry: "2024-09-20",
      sentiment: "BULLISH",
      contractType: "CALL",
      premium: 2450000,
      size: 4800,
      spotPrice: spot,
      volume: 12500,
      openInterest: 1850,
      volOiRatio: 6.75,
      timestamp: new Date(Date.now() - 1000 * 45).toISOString(),
      venue: "MULTI-EXCHANGE (ISE/CBOE/PHLX)",
      isUnusual: true,
    },
    {
      id: "flow-2",
      ticker,
      type: "SWEEP",
      strike: Math.round((spot * 1.02) / 5) * 5,
      expiry: "2024-09-13",
      sentiment: "BULLISH",
      contractType: "CALL",
      premium: 890000,
      size: 1950,
      spotPrice: spot,
      volume: 4800,
      openInterest: 920,
      volOiRatio: 5.21,
      timestamp: new Date(Date.now() - 1000 * 180).toISOString(),
      venue: "NASDAQ (NOM/BX)",
      isUnusual: true,
    },
    {
      id: "flow-3",
      ticker: ticker === "NVDA" ? "PLTR" : "NVDA",
      type: "BLOCK",
      strike: Math.round((spotMap[ticker === "NVDA" ? "PLTR" : "NVDA"] * 0.95) / 5) * 5,
      expiry: "2024-10-18",
      sentiment: "BEARISH",
      contractType: "PUT",
      premium: 1250000,
      size: 3200,
      spotPrice: spotMap[ticker === "NVDA" ? "PLTR" : "NVDA"] || 32,
      volume: 5100,
      openInterest: 4200,
      volOiRatio: 1.21,
      timestamp: new Date(Date.now() - 1000 * 320).toISOString(),
      venue: "OFF-EXCHANGE BLOCK",
      isUnusual: false,
    },
    {
      id: "flow-4",
      ticker: "SPY",
      type: "GOLDEN_SWEEP",
      strike: 565,
      expiry: "2024-09-06",
      sentiment: "BULLISH",
      contractType: "CALL",
      premium: 3850000,
      size: 7500,
      spotPrice: 562.40,
      volume: 24000,
      openInterest: 3100,
      volOiRatio: 7.74,
      timestamp: new Date(Date.now() - 1000 * 480).toISOString(),
      venue: "CBOE AGGRESSIVE",
      isUnusual: true,
    },
    {
      id: "flow-5",
      ticker,
      type: "SWEEP",
      strike: Math.round((spot * 0.98) / 5) * 5,
      expiry: "2024-09-27",
      sentiment: "BEARISH",
      contractType: "PUT",
      premium: 640000,
      size: 1400,
      spotPrice: spot,
      volume: 2800,
      openInterest: 1100,
      volOiRatio: 2.54,
      timestamp: new Date(Date.now() - 1000 * 620).toISOString(),
      venue: "BOX INTERCEPT",
      isUnusual: false,
    },
    {
      id: "flow-6",
      ticker: "LMT",
      type: "GOLDEN_SWEEP",
      strike: 580,
      expiry: "2024-10-18",
      sentiment: "BULLISH",
      contractType: "CALL",
      premium: 1780000,
      size: 2100,
      spotPrice: 565.30,
      volume: 3800,
      openInterest: 450,
      volOiRatio: 8.44,
      timestamp: new Date(Date.now() - 1000 * 780).toISOString(),
      venue: "PHLX DEFENSE BASKET",
      isUnusual: true,
    },
  ];

  // 2. Dark Pool Prints & Smart Tape
  const darkPoolPrints: DarkPoolPrint[] = [
    {
      id: "dp-1",
      ticker,
      price: spot + 0.05,
      size: 425000,
      premium: 425000 * spot,
      exchange: "ADF (FINRA Alternative Display)",
      timestamp: new Date(Date.now() - 1000 * 90).toISOString(),
      side: "ABOVE_ASK",
      sentiment: "BULLISH",
    },
    {
      id: "dp-2",
      ticker,
      price: spot,
      size: 280000,
      premium: 280000 * spot,
      exchange: "UBS ATS (Dark Pool)",
      timestamp: new Date(Date.now() - 1000 * 240).toISOString(),
      side: "MID",
      sentiment: "NEUTRAL",
    },
    {
      id: "dp-3",
      ticker: "TSLA",
      price: 218.80,
      size: 510000,
      premium: 510000 * 218.80,
      exchange: "Crossfinder (Credit Suisse Dark)",
      timestamp: new Date(Date.now() - 1000 * 410).toISOString(),
      side: "ABOVE_ASK",
      sentiment: "BULLISH",
    },
    {
      id: "dp-4",
      ticker: "SPY",
      price: 562.38,
      size: 890000,
      premium: 890000 * 562.38,
      exchange: "Intelligent Cross (ASPM)",
      timestamp: new Date(Date.now() - 1000 * 580).toISOString(),
      side: "BELOW_BID",
      sentiment: "BEARISH",
    },
  ];

  // 3. Depth-of-Book / Level 2 DOM Ladder (Nasdaq TotalView Style)
  const bids = [];
  const asks = [];
  let bidAccum = 0;
  let askAccum = 0;

  for (let i = 1; i <= 10; i++) {
    const bPrice = +(spot - i * 0.05).toFixed(2);
    const bSize = Math.round(1500 + Math.sin(i * 1.5) * 800 + (i === 3 ? 4500 : 0));
    bidAccum += bSize;
    bids.push({
      price: bPrice,
      size: bSize,
      total: bidAccum,
      delta: bSize - 1200,
      isImbalance: i === 3,
    });

    const aPrice = +(spot + i * 0.05).toFixed(2);
    const aSize = Math.round(1300 + Math.cos(i * 1.4) * 600 + (i === 6 ? 3800 : 0));
    askAccum += aSize;
    asks.push({
      price: aPrice,
      size: aSize,
      total: askAccum,
      delta: aSize - 1200,
      isImbalance: i === 6,
    });
  }

  const orderBook: OrderBookLadder = {
    ticker,
    currentPrice: spot,
    bids,
    asks,
    spread: 0.02,
    bidDepthTotal: bidAccum,
    askDepthTotal: askAccum,
    imbalanceRatio: +(bidAccum / (askAccum || 1)).toFixed(2),
  };

  // 4. BMLL XTech Institutional Decomposition
  const decomposition: FlowDecomposition = {
    ticker,
    institutionalDominance: 84.6, // 84.6% explained by institutional positioning
    institutionalNetDelta: +1854000,
    retailShare: 9.8,
    hftShare: 5.6,
    darkPoolVolumeRatio: 58.4, // 58.4% volume executed off-exchange
    gammaExposureGEX: "POSITIVE_GAMMA",
    verdict: "STRONG_INSTITUTIONAL_ACCUMULATION",
  };

  const totalSweepVolume = optionsFlow.reduce((sum, f) => sum + f.premium, 0);
  const bullishVol = optionsFlow.filter(f => f.sentiment === "BULLISH").reduce((sum, f) => sum + f.premium, 0);

  return {
    optionsFlow,
    darkPoolPrints,
    orderBook,
    decomposition,
    summary: {
      totalSweepVolume,
      bullishFlowPercent: Math.round((bullishVol / (totalSweepVolume || 1)) * 100),
      darkPoolTotalValue: darkPoolPrints.reduce((sum, d) => sum + d.premium, 0),
      topActiveTickers: TICKERS,
      updatedAt: new Date().toISOString(),
    },
  };
}
