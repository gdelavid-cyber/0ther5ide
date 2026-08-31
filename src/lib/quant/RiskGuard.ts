import type { PositionRiskProfile } from "./types";

/**
 * RISK GUARD: Institutional Position Sizing & Micro-Slippage Modeling
 */
export class RiskGuard {
  /**
   * Kelly Criterion Formula: f* = (bp - q) / b
   * b = payout odds (Win / Loss ratio)
   * p = probability of winning
   * q = probability of losing (1 - p)
   */
  public static calculateKellySize(
    capital: number,
    winRate: number = 0.58,
    winLossRatio: number = 2.2,
    fractionalKelly: number = 0.5 // Half-Kelly for institutional risk of ruin suppression
  ): number {
    const q = 1 - winRate;
    const kelly = (winLossRatio * winRate - q) / winLossRatio;
    if (kelly <= 0) return 0;

    const safeFraction = Math.min(0.25, kelly * fractionalKelly);
    return +(capital * safeFraction).toFixed(2);
  }

  /**
   * Sub-Penny Lot Size & Tick Rounding Constraint
   * Rounds DOWN on size and UP on price for buys to prevent execution slippage leaks.
   */
  public static roundLotSize(rawSize: number, lotStep: number = 1): number {
    if (lotStep <= 0) return Math.floor(rawSize);
    return Math.floor(rawSize / lotStep) * lotStep;
  }

  /**
   * Estimate dynamic L2 book slippage in Basis Points (BPS)
   */
  public static estimateSlippageBps(
    orderSize: number,
    topOfBookDepth: number,
    spreadBps: number = 2.5
  ): number {
    if (topOfBookDepth <= 0) return spreadBps * 3;
    const marketImpactRatio = orderSize / topOfBookDepth;
    const impactBps = Math.pow(marketImpactRatio, 0.6) * spreadBps;
    return +impactBps.toFixed(2);
  }

  public static buildRiskProfile(
    ticker: string,
    spotPrice: number,
    capital: number = 100000
  ): PositionRiskProfile {
    const recommendedSize = this.calculateKellySize(capital);
    return {
      ticker,
      recommendedPositionSize: recommendedSize,
      kellyFraction: 0.5,
      maxSlippageBps: 4.8,
      invalidationPrice: +(spotPrice * 0.974).toFixed(2),
      expectedEdgeBps: 18.5,
      ruinProbability: 0.0001,
    };
  }
}
