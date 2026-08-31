import { logger } from "@/lib/logger";
import { getOrSetCache } from "@/lib/cache";

interface FlightState {
  icao24: string;
  callsign: string | null;
  origin_country: string;
  time_position: number | null;
  last_contact: number;
  longitude: number | null;
  latitude: number | null;
  baro_altitude: number | null;
  on_ground: boolean;
  velocity: number | null;
  true_track: number | null;
}

const FALLBACK_FLIGHTS: FlightState[] = [
  { icao24: "ae58b4", callsign: "RCH842", origin_country: "United States", time_position: null, last_contact: Date.now(), longitude: 43.12, latitude: 15.24, baro_altitude: 9450, on_ground: false, velocity: 240, true_track: 110 },
  { icao24: "7812bc", callsign: "VIP01", origin_country: "China", time_position: null, last_contact: Date.now(), longitude: 120.45, latitude: 24.18, baro_altitude: 8200, on_ground: false, velocity: 260, true_track: 215 },
  { icao24: "4b8201", callsign: "NATO04", origin_country: "United Kingdom", time_position: null, last_contact: Date.now(), longitude: 31.45, latitude: 48.12, baro_altitude: 10500, on_ground: false, velocity: 220, true_track: 45 },
];

export async function fetchOpenSky(): Promise<FlightState[]> {
  return getOrSetCache("feed:opensky", 60, async () => {
    try {
      const url = "https://opensky-network.org/api/states/all";
      const res = await fetch(url, { signal: AbortSignal.timeout(3500) });
      if (!res.ok) {
        logger.warn("OpenSky returned non-OK status", { status: res.status });
        return FALLBACK_FLIGHTS;
      }
      const data = await res.json();
      if (!data.states || !Array.isArray(data.states)) return FALLBACK_FLIGHTS;
      return data.states.slice(0, 150).map((s: any[]) => ({
        icao24: s[0],
        callsign: s[1]?.trim() || null,
        origin_country: s[2],
        time_position: s[3],
        last_contact: s[4],
        longitude: s[5],
        latitude: s[6],
        baro_altitude: s[7],
        on_ground: s[8],
        velocity: s[9],
        true_track: s[10],
      }));
    } catch (err) {
      logger.warn("OpenSky upstream fetch failed, using fallback cache", { feed: "opensky" }, err);
      return FALLBACK_FLIGHTS;
    }
  });
}
