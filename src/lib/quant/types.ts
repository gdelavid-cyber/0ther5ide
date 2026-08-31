/**
 * INSTITUTIONAL QUANTITATIVE CORE TYPES
 * Designed for Sub-Millisecond L2 Market Microstructure & Flow Decoding
 */

export type AggressorSide = "AGGRESSIVE_BUY" | "AGGRESSIVE_SELL" | "PASSIVE_CROSS";

export interface MicrostructureTrade {
  id: string;
  ticker: string;
  price: number;
  size: number;
  value: number;
  aggressor: AggressorSide;
  isIceberg: boolean;
  isDarkPoolBlock: boolean;
  timestampNanos: number;
  exchange: "KRAKEN" | "NASDAQ" | "NYSE" | "FINRA_ADF" | "CME";
}

export interface Level2OrderBook {
  ticker: string;
  bids: Array<{ price: number; size: number; ordersCount: number }>;
  asks: Array<{ price: number; size: number; ordersCount: number }>;
  spread: number;
  midPrice: number;
  microPrice: number;
  orderFlowImbalance: number;
  timestampNanos: number;
  checksum: string;
}

export interface CumulativeVolumeDelta {
  ticker: string;
  cumulativeDelta: number;
  delta24h: number;
  absorptionRatio: number;
  divergenceSignal: "BULLISH_ABSORPTION" | "BEARISH_EXHAUSTION" | "NEUTRAL";
}

export interface GammaExposureProfile {
  ticker: string;
  netGamma: number;
  gammaRegime: "VOLATILITY_SUPPRESSION" | "VOLATILITY_EXPLOSION";
  callWallPrice: number;
  putWallPrice: number;
  gammaFlipPoint: number;
  dealerPositioning: "LONG_GAMMA" | "SHORT_GAMMA";
}

export interface PositionRiskProfile {
  ticker: string;
  recommendedPositionSize: number;
  kellyFraction: number;
  maxSlippageBps: number;
  invalidationPrice: number;
  expectedEdgeBps: number;
  ruinProbability: number;
}
