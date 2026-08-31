import { NextRequest } from "next/server";
import { generateOrderFlowData } from "@/lib/feeds/orderflow";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const ticker = searchParams.get("ticker") || "NVDA";
    const data = generateOrderFlowData(ticker);
    return Response.json(data);
  } catch (err) {
    return Response.json({ error: "Failed to generate order flow telemetry" }, { status: 500 });
  }
}
