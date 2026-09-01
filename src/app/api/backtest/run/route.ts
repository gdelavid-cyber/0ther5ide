import { NextRequest, NextResponse } from "next/server";
import { runQuantitativeBacktest, BacktestParams } from "@/lib/backtest/engine";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const params: BacktestParams = {
      symbol: body.symbol || "NVDA",
      strategy: body.strategy || "ai_swarm",
      timeframeYears: Number(body.timeframeYears) || 3,
      initialCapital: Number(body.initialCapital) || 10000,
      riskPerTradePct: Number(body.riskPerTradePct) || 2.0,
      takeProfitPct: Number(body.takeProfitPct) || 4.5,
      stopLossPct: Number(body.stopLossPct) || 2.0,
    };

    const result = runQuantitativeBacktest(params);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to execute backtest simulation" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const params: BacktestParams = {
      symbol: searchParams.get("symbol") || "NVDA",
      strategy: searchParams.get("strategy") || "ai_swarm",
      timeframeYears: Number(searchParams.get("timeframeYears")) || 3,
      initialCapital: Number(searchParams.get("initialCapital")) || 10000,
      riskPerTradePct: Number(searchParams.get("riskPerTradePct")) || 2.0,
      takeProfitPct: Number(searchParams.get("takeProfitPct")) || 4.5,
      stopLossPct: Number(searchParams.get("stopLossPct")) || 2.0,
    };

    const result = runQuantitativeBacktest(params);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to execute backtest simulation" },
      { status: 500 }
    );
  }
}
