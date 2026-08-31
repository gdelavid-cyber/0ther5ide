import type { MicrostructureTrade, Level2OrderBook, CumulativeVolumeDelta, AggressorSide } from "./types";

/**
 * FLOW SNIFFER: Institutional L2 Microstructure & Iceberg Order Detector
 * Distinguishes passive retail noise from aggressive institutional smart-money sweeps.
 */
export class FlowSniffer {
  private static cumulativeDeltas: Map<string, number> = new Map();

  /**
   * Classify aggressor side using Lee-Ready & BBO Spread Crossing Algorithm
   */
  public static classifyAggressor(
    tradePrice: number,
    bestBid: number,
    bestAsk: number,
    prevTradePrice?: number
  ): AggressorSide {
    if (tradePrice >= bestAsk) {
      return "AGGRESSIVE_BUY"; // Crossed spread into ask liquidity
    }
    if (tradePrice <= bestBid) {
      return "AGGRESSIVE_SELL"; // Hit the bid liquidity
    }

    // Midpoint tick rule fallback
    const mid = (bestBid + bestAsk) / 2;
    if (tradePrice > mid) return "AGGRESSIVE_BUY";
    if (tradePrice < mid) return "AGGRESSIVE_SELL";

    if (prevTradePrice !== undefined) {
      if (tradePrice > prevTradePrice) return "AGGRESSIVE_BUY";
      if (tradePrice < prevTradePrice) return "AGGRESSIVE_SELL";
    }

    return "PASSIVE_CROSS";
  }

  /**
   * Detect Iceberg Footprints: High volume executed at a fixed price level without consuming depth
   */
  public static detectIceberg(
    executedVolume: number,
    visibleDepthAtPrice: number,
    priceLevelUnchanged: boolean
  ): boolean {
    // If executed size is >3.5x the visible top-of-book depth without slippage, an iceberg was present
    return priceLevelUnchanged && executedVolume >= visibleDepthAtPrice * 3.5;
  }

  /**
   * Reconstruct Cumulative Volume Delta (CVD)
   */
  public static updateCvd(ticker: string, volume: number, aggressor: AggressorSide): CumulativeVolumeDelta {
    const current = this.cumulativeDeltas.get(ticker) || 0;
    let delta = 0;

    if (aggressor === "AGGRESSIVE_BUY") {
      delta = volume;
    } else if (aggressor === "AGGRESSIVE_SELL") {
      delta = -volume;
    }

    const updated = current + delta;
    this.cumulativeDeltas.set(ticker, updated);

    // Identify divergence patterns
    let divergenceSignal: "BULLISH_ABSORPTION" | "BEARISH_EXHAUSTION" | "NEUTRAL" = "NEUTRAL";
    if (updated > 50000) {
      divergenceSignal = "BULLISH_ABSORPTION";
    } else if (updated < -50000) {
      divergenceSignal = "BEARISH_EXHAUSTION";
    }

    return {
      ticker,
      cumulativeDelta: updated,
      delta24h: delta,
      absorptionRatio: Math.abs(updated) / (Math.abs(updated) + volume + 1),
      divergenceSignal,
    };
  }
}
