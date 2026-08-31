"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { severityColor } from "@/lib/utils";
import type { Signal, GlobeMarker } from "@/lib/types";

interface Props {
  signals: Signal[];
  height?: number;
}

const COMMAND_HUBS = [
  { name: "PENTAGON (US)", lat: 38.87, lng: -77.05 },
  { name: "TAIPEI ADIZ (TW)", lat: 25.03, lng: 121.56 },
  { name: "STRAIT OF HORMUZ", lat: 26.56, lng: 56.25 },
  { name: "BAB-EL-MANDEB (RED SEA)", lat: 12.58, lng: 43.33 },
  { name: "KYIV CORRIDOR (UA)", lat: 50.45, lng: 30.52 },
  { name: "TOKYO HQ (JP)", lat: 35.67, lng: 139.65 },
  { name: "GENEVA HUB (CH)", lat: 46.20, lng: 6.14 },
];

const DEFAULT_HOTSPOTS: Signal[] = [
  { id: "def-1", type: "conflict", title: "Red Sea Maritime Escort Intercept", country: "Yemen", lat: 14.80, lng: 42.95, severity: 0, source: "ACLED / Naval Command", url: "https://acleddata.com", ts: new Date().toISOString(), tags: [] },
  { id: "def-2", type: "conflict", title: "Donetsk Artillery & Kinetic Sector", country: "Ukraine", lat: 48.02, lng: 37.80, severity: 0, source: "GEOINT / VIIRS", url: "https://firms.modaps.eosdis.nasa.gov", ts: new Date().toISOString(), tags: [] },
  { id: "def-3", type: "geopolitical", title: "Taiwan Strait ADIZ Naval Incursion", country: "Taiwan", lat: 23.70, lng: 120.96, severity: 1, source: "MND / OpenSky", url: "https://opensky-network.org", ts: new Date().toISOString(), tags: [] },
  { id: "def-4", type: "satellite", title: "Strait of Hormuz Thermal Anomaly", country: "Iran", lat: 26.56, lng: 56.25, severity: 1, source: "NASA FIRMS", url: "https://firms.modaps.eosdis.nasa.gov", ts: new Date().toISOString(), tags: [] },
  { id: "def-5", type: "conflict", title: "Eastern Mediterranean Naval Concentration", country: "Cyprus", lat: 34.90, lng: 33.60, severity: 2, source: "AIS / OSINT", url: "https://gdeltproject.org", ts: new Date().toISOString(), tags: [] },
];

export default function GodModeGlobe({ signals, height = 500 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<any>(null);
  const [selectedSignal, setSelectedSignal] = useState<Signal | null>(null);
  const [isRotating, setIsRotating] = useState(true);

  const applyGlobeData = useCallback((globeInstance: any, dataSignals: Signal[]) => {
    if (!globeInstance) return;

    const sourceSignals = dataSignals && dataSignals.length > 0 ? dataSignals : DEFAULT_HOTSPOTS;
    const validSignals = sourceSignals.filter((s) => s.lat !== 0 && s.lng !== 0);

    const markers = validSignals.slice(0, 250).map((s): GlobeMarker => ({
      lat: s.lat,
      lng: s.lng,
      severity: s.severity,
      type: s.type,
      signal: s,
    }));

    const rings = validSignals
      .filter((s) => s.severity <= 1)
      .slice(0, 40)
      .map((s) => ({
        lat: s.lat,
        lng: s.lng,
        severity: s.severity,
      }));

    const arcs = [];
    for (let i = 0; i < COMMAND_HUBS.length; i++) {
      const hub = COMMAND_HUBS[i];
      const target = COMMAND_HUBS[(i + 1) % COMMAND_HUBS.length];
      arcs.push({
        startLat: hub.lat,
        startLng: hub.lng,
        endLat: target.lat,
        endLng: target.lng,
        color: ["rgba(0, 255, 136, 0.9)", "rgba(255, 68, 68, 0.9)"],
        altitude: 0.25,
        order: i * 0.5,
      });
    }

    validSignals.slice(0, 15).forEach((s, idx) => {
      const nearestHub = COMMAND_HUBS[idx % COMMAND_HUBS.length];
      arcs.push({
        startLat: nearestHub.lat,
        startLng: nearestHub.lng,
        endLat: s.lat,
        endLng: s.lng,
        color: ["#00ff88", severityColor(s.severity)],
        altitude: 0.18,
        order: idx * 0.4,
      });
    });

    const hubLabels = COMMAND_HUBS.map((h) => ({
      name: h.name,
      lat: h.lat,
      lng: h.lng,
      isHub: true,
    }));

    const signalLabels = validSignals
      .filter((s) => s.severity === 0)
      .slice(0, 10)
      .map((s) => ({
        name: (s.country || "ZONE") + ": " + (s.title || "").slice(0, 22) + "...",
        lat: s.lat,
        lng: s.lng,
        isHub: false,
      }));

    try {
      globeInstance
        .pointsData(markers)
        .ringsData(rings)
        .arcsData(arcs)
        .labelsData([...hubLabels, ...signalLabels]);
    } catch {}
  }, []);

  useEffect(() => {
    if (!containerRef.current || typeof window === "undefined") return;
    let isMounted = true;

    import("globe.gl").then((mod) => {
      if (!isMounted || !containerRef.current) return;
      const Globe = mod.default || mod;

      try {
        const w = containerRef.current.clientWidth || 800;
        const h = height || containerRef.current.clientHeight || 500;

        const globe = Globe()(containerRef.current)
          .globeImageUrl("//unpkg.com/three-globe/example/img/earth-night.jpg")
          .bumpImageUrl("//unpkg.com/three-globe/example/img/earth-topology.png")
          .backgroundImageUrl("//unpkg.com/three-globe/example/img/night-sky.png")
          .backgroundColor("#06070a")
          .showAtmosphere(true)
          .atmosphereColor("#00ff88")
          .atmosphereAltitude(0.24)
          .width(w)
          .height(h)
          // Points configuration
          .pointColor((d: any) => severityColor(d.severity))
          .pointAltitude(0.04)
          .pointRadius((d: any) => (d.severity === 0 ? 1.4 : d.severity === 1 ? 1.0 : 0.6))
          .pointResolution(16)
          .onPointClick((d: any) => {
            if (d.signal) {
              setSelectedSignal(d.signal);
              globe.pointOfView({ lat: d.lat, lng: d.lng, altitude: 1.6 }, 1200);
            }
          })
          // Rings configuration (Radar pulses)
          .ringColor((d: any) => (t: number) => {
            const col = d.severity === 0 ? "rgba(255,68,68," : d.severity === 1 ? "rgba(255,136,0," : "rgba(0,255,136,";
            return col + (1 - t) * 0.8 + ")";
          })
          .ringMaxRadius(4.5)
          .ringPropagationSpeed(2.8)
          .ringRepeatPeriod(900)
          // Arcs configuration (Kinetic trajectories)
          .arcColor((d: any) => d.color || ["#00ff88", "#ff4444"])
          .arcAltitude((d: any) => d.altitude || 0.22)
          .arcStroke(0.6)
          .arcDashLength(0.4)
          .arcDashGap(3.5)
          .arcDashInitialGap((d: any) => d.order || 0)
          .arcDashAnimateTime(1600)
          // Labels configuration
          .labelText((d: any) => d.name || d.title || "")
          .labelSize(1.1)
          .labelColor((d: any) => (d.isHub ? "#00ff88" : "#ffffff"))
          .labelDotRadius(0.35)
          .labelResolution(8);

        // OrbitControls auto-rotation
        const controls = globe.controls();
        if (controls) {
          controls.autoRotate = true;
          controls.autoRotateSpeed = 0.6;
          controls.enableDamping = true;
          controls.dampingFactor = 0.05;
        }

        // Set initial camera perspective
        globe.pointOfView({ lat: 20, lng: 15, altitude: 2.3 }, 0);

        // Populate initial data immediately
        applyGlobeData(globe, signals);

        globeRef.current = globe;

        const resizeObserver = new ResizeObserver(() => {
          if (containerRef.current && globeRef.current) {
            const currentW = containerRef.current.clientWidth;
            const currentH = containerRef.current.clientHeight || height;
            if (currentW > 0 && currentH > 0) {
              globeRef.current.width(currentW).height(currentH);
            }
          }
        });

        resizeObserver.observe(containerRef.current);
      } catch {}
    });

    return () => {
      isMounted = false;
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
      globeRef.current = null;
    };
  }, [height, applyGlobeData]);

  // Update whenever signals changes
  useEffect(() => {
    if (globeRef.current) {
      applyGlobeData(globeRef.current, signals);
    }
  }, [signals, applyGlobeData]);

  const toggleAutoRotate = () => {
    if (!globeRef.current) return;
    const controls = globeRef.current.controls();
    if (controls) {
      controls.autoRotate = !isRotating;
      setIsRotating(!isRotating);
    }
  };

  const resetView = () => {
    if (!globeRef.current) return;
    globeRef.current.pointOfView({ lat: 20, lng: 15, altitude: 2.3 }, 1000);
    setSelectedSignal(null);
  };

  return (
    <div className="w-full h-full relative rounded-xl border border-border/50 overflow-hidden glow-border bg-[#06070a] min-h-[380px]">
      <div
        ref={containerRef}
        className="globe-container w-full h-full min-h-[380px]"
        style={{ height: `${height}px`, width: "100%" }}
      />

      {/* Top Left HUD Telemetry Overlay */}
      <div className="absolute top-3 left-3 pointer-events-none z-10 bg-bg/80 backdrop-blur-md px-3 py-2 rounded-lg border border-border/40 text-xs font-mono shadow-lg">
        <div className="flex items-center gap-2 text-accent font-bold">
          <span className="w-2 h-2 rounded-full bg-accent signal-pulse" />
          <span>ORBITAL 3D PROJECTION · HIGH RESOLUTION</span>
        </div>
        <div className="text-[10px] text-muted mt-0.5">
          Night Lights · Ray-Scattering Atmosphere · Volumetric Beacons
        </div>
      </div>

      {/* Top Right Globe Camera & Rotation Controls */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
        <button
          onClick={toggleAutoRotate}
          className={"px-2.5 py-1 text-[10px] font-mono rounded border backdrop-blur-md transition " + (
            isRotating
              ? "bg-accent/20 border-accent/50 text-accent font-bold"
              : "bg-surface/80 border-border/50 text-muted hover:text-fg"
          )}
        >
          {isRotating ? "ROTATION ON" : "ROTATION PAUSED"}
        </button>
        <button
          onClick={resetView}
          className="px-2.5 py-1 text-[10px] font-mono rounded border border-border/50 bg-surface/80 text-fg hover:border-accent/40 transition backdrop-blur-md"
        >
          RESET CAMERA
        </button>
      </div>

      {/* Bottom Floating Signal Inspector when Clicked */}
      {selectedSignal && (
        <div className="absolute bottom-3 left-3 right-3 z-10 bg-bg/90 backdrop-blur-xl p-3 rounded-xl border border-accent/50 shadow-2xl flex flex-wrap items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-3">
            <span
              className={"w-3 h-3 rounded-full " + (
                selectedSignal.severity === 0 ? "bg-red-500 signal-pulse" : selectedSignal.severity === 1 ? "bg-orange-500 signal-pulse" : "bg-yellow-500"
              )}
            />
            <div>
              <div className="text-xs font-bold text-fg flex items-center gap-2">
                <span>{selectedSignal.country}</span>
                <span className="text-muted font-normal">·</span>
                <span className="text-accent font-mono">{selectedSignal.source}</span>
                <span className="text-[9px] text-muted font-mono">
                  [{selectedSignal.lat.toFixed(2)}, {selectedSignal.lng.toFixed(2)}]
                </span>
              </div>
              <div className="text-[11px] text-muted/90 mt-0.5">{selectedSignal.title}</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {selectedSignal.url && (
              <a
                href={selectedSignal.url}
                target="_blank"
                rel="noreferrer"
                className="px-2.5 py-1 bg-accent text-bg text-[10px] font-bold rounded hover:bg-accent/90 transition"
              >
                OPEN SOURCE INTEL
              </a>
            )}
            <button
              onClick={() => setSelectedSignal(null)}
              className="text-muted hover:text-fg text-xs px-2 py-1"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
