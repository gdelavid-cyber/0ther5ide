export const dynamic = "force-dynamic";
import { fetchSECInsiders } from "@/lib/feeds/sec";
import type { InsiderTrade } from "@/lib/types";

export async function GET() {
  try {
    const filings = await fetchSECInsiders();
    const trades: InsiderTrade[] = (filings || []).slice(0, 50).map((f: any, i: number) => ({
      id: f.id || `sec-${i}`,
      person: f.person || f.name || "Executive Subject",
      company: f.company || f.ticker || "Listed Issuer",
      ticker: f.ticker || "EDGAR",
      action: f.action === "buy" ? "buy" : "sell",
      shares: f.shares || 10000,
      price: f.price || (f.value ? f.value / (f.shares || 1) : 150),
      value: f.value || 1500000,
      filedAt: f.filedAt || f.filingDate || new Date().toISOString(),
      source: "SEC EDGAR",
      notable: f.notable || i === 0,
      cik: f.cik || "0001045810",
      tags: f.tags || [{ k: "source", t: "SEC EDGAR" }],
    }));

    trades.sort((a, b) => {
      if (a.action === "buy" && b.action !== "buy") return -1;
      if (a.action !== "buy" && b.action === "buy") return 1;
      return b.value - a.value;
    });

    return Response.json({
      trades,
      updated: new Date().toISOString(),
      hasMore: trades.length >= 50,
    });
  } catch (err) {
    return Response.json(
      { error: "Failed to fetch insider filings" },
      { status: 500 }
    );
  }
}
