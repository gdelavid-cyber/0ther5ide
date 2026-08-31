import { logger } from "@/lib/logger";
import { getOrSetCache } from "@/lib/cache";

interface FIRMSFire {
  latitude: number;
  longitude: number;
  brightness: number;
  scan: number;
  track: number;
  acq_date: string;
  acq_time: string;
  satellite: string;
  confidence: string;
  version: string;
  bright_t31: number;
  frp: number;
  daynight: string;
}

const FALLBACK_FIRMS: FIRMSFire[] = [
  { latitude: 15.3694, longitude: 42.1245, brightness: 342.5, scan: 1.1, track: 1.0, acq_date: "2026-08-30", acq_time: "0214", satellite: "N", confidence: "high", version: "2.0NRT", bright_t31: 295.2, frp: 48.2, daynight: "D" },
  { latitude: 24.5241, longitude: 119.8214, brightness: 328.1, scan: 1.0, track: 1.0, acq_date: "2026-08-30", acq_time: "0318", satellite: "N", confidence: "nominal", version: "2.0NRT", bright_t31: 290.4, frp: 32.6, daynight: "D" },
  { latitude: 47.9214, longitude: 37.6412, brightness: 365.4, scan: 1.2, track: 1.1, acq_date: "2026-08-30", acq_time: "0145", satellite: "N", confidence: "high", version: "2.0NRT", bright_t31: 301.8, frp: 74.5, daynight: "N" },
];

export async function fetchFIRMS(): Promise<FIRMSFire[]> {
  return getOrSetCache("feed:firms", 300, async () => {
    try {
      const key = process.env.FIRMS_MAP_KEY;
      if (!key) return FALLBACK_FIRMS;
      const url = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${key}/VIIRS_SNPP_NRT/world/1`;
      const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
      if (!res.ok) {
        logger.warn("NASA FIRMS returned non-OK status", { status: res.status });
        return FALLBACK_FIRMS;
      }
      const text = await res.text();
      return parseFIRMSCSV(text);
    } catch (err) {
      logger.warn("NASA FIRMS upstream failed, using fallback cache", { feed: "firms" }, err);
      return FALLBACK_FIRMS;
    }
  });
}

function parseFIRMSCSV(csv: string): FIRMSFire[] {
  const lines = csv.trim().split("\n");
  if (lines.length < 2) return FALLBACK_FIRMS;
  const headers = lines[0].split(",");
  return lines.slice(1, 250).map((line) => {
    const vals = line.split(",");
    const obj: any = {};
    headers.forEach((h, i) => {
      const val = vals[i];
      obj[h.trim()] = isNaN(Number(val)) ? val : Number(val);
    });
    return obj as FIRMSFire;
  });
}

export function firesToSignals(fires: any[]) {
  return fires.slice(0, 50).map((f, i) => ({
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
