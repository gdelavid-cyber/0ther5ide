import { fetchACLED, acledToSignals } from './acled';
import { fetchGDELT, gdeltToSignals } from './gdelt';
import { fetchOpenSky, flightsToMarkers } from './opensky';
import { fetchFIRMS, firesToSignals } from './firms';
import { fetchCrypto, cryptoToSignals } from './markets';
import { fetchSECInsiders } from './sec';
import type { Signal, IntelligenceData, TensionIndex, FlightTrack, FireHotspot } from '@/lib/types';

export async function aggregateIntel() {
  const [acledRows, gdeltArticles, flights, fires, cryptos] = await Promise.all([
    fetchACLED(),
    fetchGDELT(),
    fetchOpenSky(),
    fetchFIRMS(),
    fetchCrypto(),
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
    return { score: 35, level: 'LOW', regions: [] };
  }

  const avgSev = signals.reduce((sum, s) => sum + s.severity, 0) / signals.length;
  const severe = signals.filter(s => s.severity >= 3).length;
  const high = signals.filter(s => s.severity === 2).length;

  let score = Math.min(100, Math.round(avgSev * 25 + severe * 10 + high * 5));
  score = Math.max(0, Math.min(100, score));

  let level: TensionIndex['level'] = 'LOW';
  if (score >= 70) level = 'SEVERE';
  else if (score >= 50) level = 'HIGH';
  else if (score >= 30) level = 'ELEVATED';

  const countryCounts = new Map<string, number>();
  signals.forEach(s => {
    if (s.country && s.country !== 'Global') {
      countryCounts.set(s.country, (countryCounts.get(s.country) || 0) + 1);
    }
  });

  const regions = Array.from(countryCounts.entries())
    .map(([country, count]) => ({
      country,
      score: Math.min(100, count * 20),
      trend: 'stable' as const,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  return { score, level, regions };
}

export function flightsToFeed(flights: any[]): FlightTrack[] {
  return flights.filter((f: any) => !f.onGround).slice(0, 50).map(f => ({
    icao: f.icao24,
    lat: f.latitude,
    lng: f.longitude,
    alt: f.baroAltitude,
    heading: f.heading,
    speed: f.velocity,
    callsign: f.callsign,
    type: 'commercial',
  }));
}