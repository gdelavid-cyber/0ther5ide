import { fetchACLED } from "./acled";
import { fetchGDELT } from "./gdelt";
import { fetchOpenSky } from "./opensky";
import { fetchFIRMS, firesToSignals } from "./firms";
import { fetchCrypto } from "./markets";
import { fetchSECInsiders } from "./sec";
import { severityColor } from "@/lib/utils";
import type { Signal, TensionIndex, FlightTrack, InsiderTrade } from "@/lib/types";

function acledToSignals(rows: any[]): Signal[] {
  const now = Date.now();
  return (rows || []).slice(0, 50).map((r: any, i: number) => ({
    id: `acled-${i}-${r.iso3 || "LOC"}`,
    type: "conflict" as const,
    title: `${r.event_type || "Security Event"}: ${r.actor1 || "Regional Force"} vs ${r.actor2 || "Opposing Group"}`,
    country: r.actor1_country || "International",
    lat: r.latitude || 0,
    lng: r.longitude || 0,
    severity: (r.fatalities || 0) > 30 ? 3 : (r.fatalities || 0) > 5 ? 2 : 1,
    source: "ACLED Global Conflict Monitor",
    url: `https://acleddata.com/event/${r.iso3 || ""}`,
    ts: new Date(now - i * 1000 * 60 * 35).toISOString(),
    tags: [{ k: "source", t: "ACLED" }, { k: "country", t: r.actor1_country || "Regional" }],
  }));
}

function gdeltToSignals(articles: any[]): Signal[] {
  const now = Date.now();
  return (articles || []).slice(0, 30).map((a: any, i: number) => {
    const isCritical = /strike|missile|naval|sanctions|emergency|taiwan|red sea|ukraine|oil|escalat/i.test(a.title || "");
    return {
      id: `gdelt-${i}-${(a.domain || "news").replace(/[^a-zA-Z0-9]/g, "").slice(-16)}`,
      type: "news" as const,
      title: a.title || "Geopolitical intelligence dispatch",
      country: a.sourcecountry || "International",
      lat: 0,
      lng: 0,
      severity: isCritical ? 2 : 1,
      source: `GDELT 2.0 (${a.domain || "Global Wire"})`,
      url: a.url || "https://gdeltproject.org",
      ts: a.scrapedAt || new Date(now - i * 1000 * 60 * 15).toISOString(),
      tags: [{ k: "source", t: "GDELT" }, { k: "domain", t: a.domain || "web" }],
    };
  });
}

function secToSignals(trades: InsiderTrade[]): Signal[] {
  const now = Date.now();
  return (trades || []).slice(0, 15).map((t, i) => {
    const isBuy = t.action === "buy";
    const formattedVal = (t.value / 1000000).toFixed(2);
    return {
      id: `sec-${t.id || i}`,
      type: "market" as const,
      title: `SEC Form 4: ${t.person} (${t.role}) ${isBuy ? "acquired" : "sold"} $${formattedVal}M ${t.company} (${t.ticker})`,
      country: "United States (SEC EDGAR)",
      lat: 38.8951,
      lng: -77.0364,
      severity: t.value > 5000000 ? 2 : 1,
      source: "SEC EDGAR Form 4",
      url: `https://www.sec.gov/edgar/searchedgar/companysearch`,
      ts: t.filedAt || new Date(now - i * 1000 * 60 * 20).toISOString(),
      tags: [{ k: "source", t: "SEC" }, { k: "ticker", t: t.ticker }],
    };
  });
}

function cryptoToSignals(cryptos: any[]): Signal[] {
  const now = Date.now();
  return (cryptos || []).filter((c: any) => Math.abs(c.price_change_percentage_24h || 0) > 3).slice(0, 10).map((c: any, i: number) => ({
    id: `crypto-${c.id || i}`,
    type: "market" as const,
    title: `Macro Volatility Spike: ${c.name} (${(c.symbol || "").toUpperCase()}) ${c.price_change_percentage_24h > 0 ? "+" : ""}${(c.price_change_percentage_24h || 0).toFixed(1)}% (24h)`,
    country: "Global Macro Markets",
    lat: 0,
    lng: 0,
    severity: Math.abs(c.price_change_percentage_24h) > 10 ? 2 : 1,
    source: "Global Market Flow Radar",
    url: `https://coingecko.com/en/coins/${c.id}`,
    ts: new Date(now - i * 1000 * 60 * 28).toISOString(),
    tags: [{ k: "asset", t: "crypto" }, { k: "symbol", t: c.symbol }],
  }));
}

export async function aggregateIntel() {
  const [acledRows, gdeltArticles, flights, fires, cryptos, secTrades] = await Promise.all([
    fetchACLED().catch(() => []),
    fetchGDELT().catch(() => []),
    fetchOpenSky().catch(() => []),
    fetchFIRMS().catch(() => []),
    fetchCrypto().catch(() => []),
    fetchSECInsiders().catch(() => []),
  ]);

  const acledSignals = acledToSignals(acledRows);
  const gdeltSignals = gdeltToSignals(gdeltArticles);
  const firesSignals = firesToSignals(fires);
  const cryptoSignals = cryptoToSignals(cryptos);
  const secSignals = secToSignals(secTrades);

  // Balanced multi-discipline merge: News + Conflict + Insider Trading + Satellite Recon + Macro Markets
  const allSignals = [
    ...gdeltSignals,
    ...secSignals,
    ...acledSignals,
    ...cryptoSignals,
    ...firesSignals,
  ]
    .sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime())
    .slice(0, 100);

  const tension = computeTension(allSignals);

  const sourcesOk = [
    acledRows.length > 0 ? 1 : 0,
    gdeltArticles.length > 0 ? 1 : 0,
    flights.length > 0 ? 1 : 0,
    fires.length > 0 ? 1 : 0,
    cryptos.length > 0 ? 1 : 0,
    secTrades.length > 0 ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  return {
    meta: {
      sourcesQueried: 6,
      sourcesOk,
      updated: new Date().toISOString(),
    },
    signals: allSignals,
    tension,
    acled: { totalEvents: acledRows.length },
    sec: { totalFilings: secTrades.length },
    tg: { urgent: [], topPosts: [] },
  };
}

function computeTension(signals: Signal[]): TensionIndex {
  if (signals.length === 0) {
    return { score: 35, level: "LOW", regions: [] };
  }

  const avgSev = signals.reduce((sum, s) => sum + s.severity, 0) / signals.length;
  const severe = signals.filter((s) => s.severity >= 3).length;
  const high = signals.filter((s) => s.severity === 2).length;

  let score = Math.min(100, Math.round(avgSev * 25 + severe * 10 + high * 5));
  score = Math.max(0, Math.min(100, score));

  let level: TensionIndex["level"] = "LOW";
  if (score >= 70) level = "SEVERE";
  else if (score >= 50) level = "HIGH";
  else if (score >= 30) level = "ELEVATED";

  const countryCounts = new Map<string, number>();
  signals.forEach((s) => {
    if (s.country && s.country !== "Global") {
      countryCounts.set(s.country, (countryCounts.get(s.country) || 0) + 1);
    }
  });

  const regions = Array.from(countryCounts.entries())
    .map(([country, count]) => ({
      country,
      score: Math.min(100, count * 20),
      trend: "stable" as const,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  return { score, level, regions };
}

export function flightsToFeed(flights: any[]): FlightTrack[] {
  return (flights || []).filter((f: any) => !f.onGround).slice(0, 50).map((f: any) => ({
    icao: f.icao24,
    lat: f.latitude,
    lng: f.longitude,
    alt: f.baroAltitude,
    heading: f.heading,
    speed: f.velocity,
    callsign: f.callsign,
    type: "commercial",
  }));
}
