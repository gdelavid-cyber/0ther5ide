import { NextRequest, NextResponse } from "next/server";
import { computeMarketSwarmIntelligence } from "@/lib/swarm/marketSwarmEngine";

export const dynamic = "force-dynamic";

const SEED_PRICES: Record<string, number> = {
  NVDA: 128.50,
  BTC: 78200.0,
  XAUUSD: 2518.0,
  TSLA: 218.80,
  SPY: 564.40,
  ETH: 3150.0,
  SOL: 184.0,
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawSym = searchParams.get("symbol") || "NVDA";
    const sym = rawSym.toUpperCase().replace(/[^A-Z]/g, "") || "NVDA";
    const cleanSym = sym === "GOLD" || sym === "XAU" ? "XAUUSD" : sym;

    const basePrice = SEED_PRICES[cleanSym] || 150.0;
    const signal = computeMarketSwarmIntelligence(cleanSym, basePrice);

    return NextResponse.json(signal, {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to compute market swarm signals" },
      { status: 500 }
    );
  }
}
