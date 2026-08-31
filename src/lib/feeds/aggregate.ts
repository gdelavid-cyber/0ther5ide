import { fetchACLED } from "./acled";
import { fetchGDELT } from "./gdelt";
import { fetchOpenSky } from "./opensky";
import { fetchFIRMS } from "./firms";
import { fetchCrypto } from "./markets";
import { fetchSECInsiders } from "./sec";
import { severityColor } from "@/lib/utils";
import type { Signal, TensionIndex, FlightTrack } from "@/lib/types";

export function acledToSignals(rows: any[]): Signal[] {
  return (rows || []).slice(0, 200).map((r: any, i: number) => ({
    id: `acled-${i}-${r.iso3 || "LOC"}`,
    type: "conflict" as const,
    title: `${r.event_type || "Event"} — ${r.actor1_country || "Regional"}`,
    country: r.actor1_country || "International",
    lat: r.latitude || 0,
    lng: r.longitude || 0,
    severity: r.fatalities > 100 ? 3 : r.fatalities > 10 ? 2 : r.fatalities > 0 ? 1 : 0,
    source: "ACLED",
    url: `https://acleddata.com/event/${r.iso3 || ""}`,
    ts: new Date(r.year || 2024, (r.month || 1) - 1, r.day || 1).toISOString(),
    tags: [{ k: "source", t: "ACLED" }],
  }));
}

export function gdeltToSignals(articles: any[]): Signal[] {
  return (articles || []).slice(0, 50).map((a: any, i: number) => ({
    id: `gdelt-${i}-${(a.domain || "news").replace(/[^a-zA-Z0-9]/g, "")}`,
    type: "news" as const,
    title: a.title || "Geopolitical intelligence dispatch",
    country: a.sourcecountry || "International",
    lat: 0,
    lng: 0,
    severity: 1,
    source: "GDELT 2.0",
    url: a.url || "https://gdeltproject.org",
    ts: new Date().toISOString(),
    tags: [{ k: "source", t: "GDELT" }, { k: "domain", t: a.domain || "web" }],
  }));
}

export function firesToSignals(fires: any[]): Signal[] {
  return (fires || []).slice(0, 50).map((f: any, i: number) => ({
    id: `firms-${i}`,
    type: "satellite" as const,
    title: `Thermal Anomaly: ${f.brightness || 340}K (${f.satellite || "VIIRS"})`,
    country: "Satellite Observation",
    lat: f.latitude || 0,
    lng: f.longitude || 0,
    severity: f.brightness > 350 ? 0 : f.brightness > 330 ? 1 : 2,
    source: "NASA FIRMS",
    url: "https://firms.modaps.eosdis.nasa.gov",
    ts: new Date().toISOString(),
    tags: [{ k: "source", t: "NASA FIRMS" }],
  }));
}

export function cryptoToSignals(cryptos: any[]): Signal[] {
  return (cryptos || []).filter((c: any) => Math.abs(c.price_change_percentage_24h || 0) > 4).map((c: any) => ({
    id: `crypto-${c.id}`,
    type: "market" as const,
    title: `${c.name} (${(c.symbol || "").toUpperCase()}) ${c.price_change_percentage_24h > 0 ? "+" : ""}${(c.price_change_percentage_24h || 0).toFixed(1)}%`,
    country: "Global",
    lat: 0,
    lng: 0,
    severity: Math.abs(c.price_change_percentage_24h) > 12 ? 3 : Math.abs(c.price_change_percentage_24h) > 6 ? 2 : 1,
    source: "CoinGecko / Live",
    url: `https://coingecko.com/en/coins/${c.id}`,
    ts: new Date().toISOString(),
    tags: [{ k: "asset", t: "crypto" }, { k: "symbol", t: c.symbol }],
  }));
}

export function flightsToMarkers(flights: any[]) {
  return (flights || []).filter((f: any) => f.latitude && f.longitude).slice(0, 100).map((f: any, i: number) => ({
    id: `flight-${f.icao24 || i}`,
    type: "flight" as const,
    title: `Flight ${f.callsign || f.icao24} (${f.origin_country})`,
    country: f.origin_country || "Airspace",
    lat: f.latitude || 0,
    lng: f.longitude || 0,
    severity: 2,
    source: "OpenSky Network",
    url: "https://opensky-network.org",
    ts: new Date().toISOString(),
    tags: [{ k: "source", t: "OpenSky" }, { k: "icao", t: f.icao24 }],
  }));
}

export async function aggregateIntel() {
  const [acledRows, gdeltArticles, flights, fires, cryptos] = await Promise.all([
    fetchACLED().catch(() => []),
    fetchGDELT().catch(() => []),
    fetchOpenSky().catch(() => []),
    fetchFIRMS().catch(() => []),
    fetchCrypto().catch(() => []),
  ]);

  const acledSignals = acledToSignals(acledRows);
  const gdeltSignals = gdeltToSignals(gdeltArticles);
  const firesSignals = firesToSignals(fires);
  const cryptoSignals = cryptoToSignals(cryptos);

  const allSignals = [...acledSignals, ...gdeltSignals, ...firesSignals, ...cryptoSignals]
    .sort((a, b) => b.severity - a.severity || new Date(b.ts).getTime() - new Date(a.ts).getTime())
    .slice(0, 200);

  const tension = computeTension(allSignals);

  const sourcesOk = [
    acledRows.length > 0 ? 1 : 0,
    gdeltArticles.length > 0 ? 1 : 0,
    flights.length > 0 ? 1 : 0,
    fires.length > 0 ? 1 : 0,
    cryptos.length > 0 ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  return {
    meta: {
      sourcesQueried: 5,
      sourcesOk,
      updated: new Date().toISOString(),
    },
    signals: allSignals,
    tension,
    acled: { totalEvents: acledRows.length },
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
