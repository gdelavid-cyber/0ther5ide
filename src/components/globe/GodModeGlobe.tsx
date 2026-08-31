"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { severityColor } from "@/lib/utils";
import type { Signal } from "@/lib/types";

interface Props {
  signals: Signal[];
  height?: number;
}

const COMMAND_HUBS = [
  { name: "PENTAGON (HQ-US)", lat: 38.89, lng: -77.03, code: "US-CENTRAL" },
  { name: "LONDON (GCHQ-UK)", lat: 51.50, lng: -0.12, code: "EU-WEST" },
  { name: "KYIV (FORWARD-UA)", lat: 50.45, lng: 30.52, code: "EU-EAST" },
  { name: "TEL AVIV (OPERATIONS)", lat: 32.08, lng: 34.78, code: "ME-CENTRAL" },
  { name: "STRAIT OF HORMUZ", lat: 26.56, lng: 56.25, code: "GULF-NAVAL" },
  { name: "BAB-EL-MANDEB", lat: 12.58, lng: 43.33, code: "RED-SEA" },
  { name: "TAIPEI (PACIFIC-TW)", lat: 25.03, lng: 121.56, code: "PAC-SECTOR" },
  { name: "TOKYO (NORTH ASIA)", lat: 35.67, lng: 139.65, code: "ASIA-PAC" },
];

const DEFAULT_HOTSPOTS: Signal[] = [
  { id: "def-1", type: "conflict", title: "Red Sea Maritime Escort & Drone Intercept", country: "Yemen", lat: 14.80, lng: 42.95, severity: 0, source: "CENTCOM / ACLED", url: "https://acleddata.com", ts: new Date().toISOString(), tags: [] },
  { id: "def-2", type: "conflict", title: "Pokrovsk - Donetsk Heavy Artillery Sector", country: "Ukraine", lat: 48.28, lng: 37.18, severity: 0, source: "GEOINT / VIIRS", url: "https://firms.modaps.eosdis.nasa.gov", ts: new Date().toISOString(), tags: [] },
  { id: "def-3", type: "geopolitical", title: "Taiwan Strait ADIZ Maritime Patrol Sweep", country: "Taiwan", lat: 24.15, lng: 120.67, severity: 1, source: "MND / OpenSky", url: "https://opensky-network.org", ts: new Date().toISOString(), tags: [] },
  { id: "def-4", type: "satellite", title: "Strait of Hormuz AIS Dark-Zone Spike", country: "Iran", lat: 26.56, lng: 56.25, severity: 1, source: "NASA FIRMS", url: "https://firms.modaps.eosdis.nasa.gov", ts: new Date().toISOString(), tags: [] },
  { id: "def-5", type: "conflict", title: "Southern Lebanon Border Kinetic Axis", country: "Lebanon", lat: 33.27, lng: 35.20, severity: 0, source: "OSINT / Live", url: "https://gdeltproject.org", ts: new Date().toISOString(), tags: [] },
  { id: "def-6", type: "market", title: "Institutional Dark Pool Sweep NVDA $128.50", country: "United States", lat: 37.37, lng: -121.96, severity: 1, source: "SEC Form 4", url: "https://sec.gov", ts: new Date().toISOString(), tags: [] },
  { id: "def-7", type: "aerial", title: "Baltic Air Patrol Quick Reaction Alert", country: "Estonia", lat: 59.43, lng: 24.75, severity: 2, source: "NATO Aircom", url: "https://opensky-network.org", ts: new Date().toISOString(), tags: [] },
];

function latLngToVector3(lat: number, lng: number, radius: number = 100): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

export default function GodModeGlobe({ signals, height = 540 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedSignal, setSelectedSignal] = useState<Signal | null>(null);
  const [isRotating, setIsRotating] = useState(true);
  const [cinemaMode, setCinemaMode] = useState(false);
  const [viewLayer, setViewLayer] = useState<"optical" | "infrared" | "tactical">("optical");
  const controlsRef = useRef<OrbitControls | null>(null);

  useEffect(() => {
    if (!containerRef.current || typeof window === "undefined") return;
    const container = containerRef.current;
    const w = container.clientWidth || 800;
    const h = height || container.clientHeight || 540;

    // 1. Scene & Unreal 4D Cinematic Camera
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#04060a");
    scene.fog = new THREE.FogExp2(0x04060a, 0.0008);

    const camera = new THREE.PerspectiveCamera(45, w / h, 1, 4000);
    camera.position.set(0, 45, 250);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.5;
    controls.minDistance = 125;
    controls.maxDistance = 450;
    controlsRef.current = controls;

    // 2. High-Dynamic-Range Lighting (UE5 Lumen Style)
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const keySun = new THREE.DirectionalLight(0xffffff, 2.2);
    keySun.position.set(300, 220, 300);
    scene.add(keySun);

    const rimCyan = new THREE.DirectionalLight(0x00ff88, 1.4);
    rimCyan.position.set(-300, -120, -250);
    scene.add(rimCyan);

    const blueFill = new THREE.DirectionalLight(0x0088ff, 1.0);
    blueFill.position.set(0, 300, -200);
    scene.add(blueFill);

    // 3. Volumetric 4D Deep Space Dust & Star Clusters (1,500 points)
    const starGeom = new THREE.BufferGeometry();
    const starCount = 1500;
    const starPos = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      starPos[i] = (Math.random() - 0.5) * 2200;
      starPos[i + 1] = (Math.random() - 0.5) * 2200;
      starPos[i + 2] = (Math.random() - 0.5) * 2200;
      starColors[i] = 0.4 + Math.random() * 0.6;
      starColors[i + 1] = 0.8 + Math.random() * 0.2;
      starColors[i + 2] = 1.0;
    }
    starGeom.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
    starGeom.setAttribute("color", new THREE.BufferAttribute(starColors, 3));
    const starMat = new THREE.PointsMaterial({
      size: 1.8,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
    });
    scene.add(new THREE.Points(starGeom, starMat));

    // 4. Photorealistic NASA Earth Core Sphere (Radius 100)
    const earthRadius = 100;
    const earthGeometry = new THREE.SphereGeometry(earthRadius, 64, 64);
    const earthMaterial = new THREE.MeshStandardMaterial({
      color: 0x111c30,
      roughness: 0.45,
      metalness: 0.15,
      emissive: new THREE.Color(0x051a14),
      emissiveIntensity: 0.4,
    });
    const earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);
    scene.add(earthMesh);

    // Load High-Res NASA Earth Night Lights Map
    const textureLoader = new THREE.TextureLoader();
    const textureUrls = [
      "https://raw.githubusercontent.com/vasturiano/three-globe/master/example/img/earth-night.jpg",
      "https://raw.githubusercontent.com/vasturiano/three-globe/master/example/img/earth-blue-marble.jpg",
      "//unpkg.com/three-globe/example/img/earth-night.jpg"
    ];

    const loadTextureWithFallback = (index: number) => {
      if (index >= textureUrls.length) return;
      textureLoader.load(
        textureUrls[index],
        (tex) => {
          tex.wrapS = THREE.RepeatWrapping;
          tex.wrapT = THREE.ClampToEdgeWrapping;
          earthMaterial.map = tex;
          earthMaterial.color.setHex(0xffffff);
          earthMaterial.emissive.setHex(0x112818);
          earthMaterial.emissiveIntensity = 0.35;
          earthMaterial.needsUpdate = true;
        },
        undefined,
        () => loadTextureWithFallback(index + 1)
      );
    };
    loadTextureWithFallback(0);

    // 5. 4D Animated Cloud Layer (Simulated Atmospheric Dynamics)
    const cloudGeom = new THREE.SphereGeometry(earthRadius * 1.015, 48, 48);
    const cloudCanvas = document.createElement("canvas");
    cloudCanvas.width = 1024;
    cloudCanvas.height = 512;
    const cloudCtx = cloudCanvas.getContext("2d")!;
    cloudCtx.fillStyle = "rgba(0,0,0,0)";
    cloudCtx.fillRect(0, 0, 1024, 512);
    cloudCtx.fillStyle = "rgba(200, 240, 255, 0.14)";
    for (let i = 0; i < 90; i++) {
      const cx = Math.random() * 1024;
      const cy = Math.random() * 512;
      const cr = Math.random() * 60 + 20;
      cloudCtx.beginPath();
      cloudCtx.arc(cx, cy, cr, 0, Math.PI * 2);
      cloudCtx.fill();
    }
    const cloudTex = new THREE.CanvasTexture(cloudCanvas);
    cloudTex.wrapS = THREE.RepeatWrapping;
    const cloudMat = new THREE.MeshStandardMaterial({
      map: cloudTex,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
    });
    const cloudMesh = new THREE.Mesh(cloudGeom, cloudMat);
    scene.add(cloudMesh);

    // 6. Holographic Tactical Latitude / Longitude Mesh & Hex Grid
    const tacticalGridGeom = new THREE.SphereGeometry(earthRadius * 1.004, 36, 18);
    const tacticalGridMat = new THREE.MeshBasicMaterial({
      color: 0x00ff88,
      wireframe: true,
      transparent: true,
      opacity: 0.08,
    });
    scene.add(new THREE.Mesh(tacticalGridGeom, tacticalGridMat));

    // 7. Volumetric Atmosphere Rayleigh Scatter Halo
    const atmosphereGeom = new THREE.SphereGeometry(earthRadius * 1.16, 48, 48);
    const atmosphereMat = new THREE.MeshBasicMaterial({
      color: 0x00e5ff,
      transparent: true,
      opacity: 0.18,
      side: THREE.BackSide,
    });
    scene.add(new THREE.Mesh(atmosphereGeom, atmosphereMat));

    // 8. 4D Orbital Defense Satellites with LEO / GEO Paths
    const satelliteGroup = new THREE.Group();
    scene.add(satelliteGroup);

    const satellites: { mesh: THREE.Mesh; orbitRadius: number; speed: number; angle: number; axis: THREE.Vector3 }[] = [];
    const orbitConfigs = [
      { r: 125, speed: 0.012, tilt: 0.35, color: 0x00ffaa },
      { r: 140, speed: -0.009, tilt: 0.8, color: 0x00e5ff },
      { r: 155, speed: 0.007, tilt: -0.5, color: 0xffaa00 },
      { r: 170, speed: -0.005, tilt: 1.2, color: 0xff3366 },
    ];

    orbitConfigs.forEach((cfg) => {
      // Draw Orbital Path Ring
      const orbitRingGeom = new THREE.BufferGeometry();
      const ringPoints: THREE.Vector3[] = [];
      const segs = 64;
      for (let i = 0; i <= segs; i++) {
        const theta = (i / segs) * Math.PI * 2;
        ringPoints.push(new THREE.Vector3(Math.cos(theta) * cfg.r, 0, Math.sin(theta) * cfg.r));
      }
      orbitRingGeom.setFromPoints(ringPoints);
      const ringLineMat = new THREE.LineBasicMaterial({ color: cfg.color, transparent: true, opacity: 0.18 });
      const ringMesh = new THREE.Line(orbitRingGeom, ringLineMat);
      ringMesh.rotation.x = cfg.tilt;
      satelliteGroup.add(ringMesh);

      // Satellite Orb
      const satGeom = new THREE.SphereGeometry(1.6, 8, 8);
      const satMat = new THREE.MeshBasicMaterial({ color: cfg.color });
      const satMesh = new THREE.Mesh(satGeom, satMat);
      satelliteGroup.add(satMesh);
      satellites.push({
        mesh: satMesh,
        orbitRadius: cfg.r,
        speed: cfg.speed,
        angle: Math.random() * Math.PI * 2,
        axis: new THREE.Vector3(Math.sin(cfg.tilt), Math.cos(cfg.tilt), 0).normalize(),
      });
    });

    // 9. Kinetic Hotspots, Beacons & Niagara Pulse Wave FX
    const beaconsGroup = new THREE.Group();
    scene.add(beaconsGroup);

    const sourceSignals = signals && signals.length > 0 ? signals : DEFAULT_HOTSPOTS;
    const validSignals = sourceSignals.filter((s) => s.lat !== 0 && s.lng !== 0);

    const interactiveObjects: THREE.Object3D[] = [];
    const animatedRings: { mesh: THREE.Mesh; scale: number; speed: number }[] = [];

    validSignals.forEach((s) => {
      const pos = latLngToVector3(s.lat, s.lng, earthRadius);
      const colorHex = s.severity === 0 ? 0xff2244 : s.severity === 1 ? 0xff8800 : 0x00ff88;

      // Vertical 4D Hologram Light Shaft Pillar
      const pillarGeom = new THREE.CylinderGeometry(0.4, 0.1, 16, 8);
      pillarGeom.rotateX(Math.PI / 2);
      const pillarMat = new THREE.MeshBasicMaterial({ color: colorHex, transparent: true, opacity: 0.9 });
      const pillarMesh = new THREE.Mesh(pillarGeom, pillarMat);
      pillarMesh.position.copy(pos.clone().multiplyScalar(1.06));
      pillarMesh.lookAt(new THREE.Vector3(0, 0, 0));
      (pillarMesh as any).signalData = s;
      beaconsGroup.add(pillarMesh);
      interactiveObjects.push(pillarMesh);

      // Glowing Beacon Orb
      const orbGeom = new THREE.SphereGeometry(s.severity === 0 ? 3.4 : 2.2, 16, 16);
      const orbMat = new THREE.MeshBasicMaterial({ color: colorHex });
      const orbMesh = new THREE.Mesh(orbGeom, orbMat);
      orbMesh.position.copy(pos.clone().multiplyScalar(1.09));
      (orbMesh as any).signalData = s;
      beaconsGroup.add(orbMesh);
      interactiveObjects.push(orbMesh);

      // Concentric Expanding Radar Sonar Waves
      const ringGeom = new THREE.RingGeometry(1.4, 3.8, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: colorHex,
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide,
      });
      const ringMesh = new THREE.Mesh(ringGeom, ringMat);
      ringMesh.position.copy(pos.clone().multiplyScalar(1.01));
      ringMesh.lookAt(new THREE.Vector3(0, 0, 0));
      beaconsGroup.add(ringMesh);
      animatedRings.push({ mesh: ringMesh, scale: 1, speed: 0.024 + Math.random() * 0.015 });
    });

    // 10. Niagara 4D Trajectory Streams with Moving Energy Pulse Particles
    const arcsGroup = new THREE.Group();
    scene.add(arcsGroup);

    const particleStreams: { curve: THREE.QuadraticBezierCurve3; particle: THREE.Mesh; progress: number; speed: number }[] = [];

    for (let i = 0; i < COMMAND_HUBS.length; i++) {
      const h1 = COMMAND_HUBS[i];
      const h2 = COMMAND_HUBS[(i + 1) % COMMAND_HUBS.length];
      const p1 = latLngToVector3(h1.lat, h1.lng, earthRadius);
      const p2 = latLngToVector3(h2.lat, h2.lng, earthRadius);

      const mid = p1.clone().add(p2).multiplyScalar(0.5);
      const dist = p1.distanceTo(p2);
      mid.setLength(earthRadius + dist * 0.38);

      const curve = new THREE.QuadraticBezierCurve3(p1, mid, p2);
      const points = curve.getPoints(50);
      const arcGeom = new THREE.BufferGeometry().setFromPoints(points);
      const arcMat = new THREE.LineBasicMaterial({
        color: i % 2 === 0 ? 0x00ffaa : 0xff3355,
        transparent: true,
        opacity: 0.75,
      });
      arcsGroup.add(new THREE.Line(arcGeom, arcMat));

      // Niagara Moving Energy Photon
      const photonGeom = new THREE.SphereGeometry(1.4, 8, 8);
      const photonMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const photonMesh = new THREE.Mesh(photonGeom, photonMat);
      arcsGroup.add(photonMesh);
      particleStreams.push({
        curve,
        particle: photonMesh,
        progress: Math.random(),
        speed: 0.004 + Math.random() * 0.003,
      });
    }

    // 11. Interactive Raycaster on Hotspot Selection
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerDown = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(interactiveObjects, false);
      if (intersects.length > 0) {
        const target = intersects[0].object as any;
        if (target.signalData) {
          setSelectedSignal(target.signalData);
        }
      }
    };

    renderer.domElement.addEventListener("pointerdown", handlePointerDown);

    // 12. 60 FPS 4D Animation Loop (Atmosphere drift + Satellite orbits + Particle streams)
    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);

      // 4D Clouds Drift
      cloudMesh.rotation.y += 0.0003;
      cloudMesh.rotation.x += 0.0001;

      // 4D Satellite Orbits
      satellites.forEach((sat) => {
        sat.angle += sat.speed;
        sat.mesh.position.set(
          Math.cos(sat.angle) * sat.orbitRadius,
          Math.sin(sat.angle * 1.5) * 20,
          Math.sin(sat.angle) * sat.orbitRadius
        );
      });

      // Niagara Particle Energy Streams on Arcs
      particleStreams.forEach((ps) => {
        ps.progress += ps.speed;
        if (ps.progress > 1) ps.progress = 0;
        const pt = ps.curve.getPoint(ps.progress);
        ps.particle.position.copy(pt);
      });

      // Pulsing Sonar Waves
      animatedRings.forEach((r) => {
        r.scale += r.speed;
        r.mesh.scale.set(r.scale, r.scale, r.scale);
        const mat = r.mesh.material as THREE.MeshBasicMaterial;
        mat.opacity = Math.max(0, 1 - (r.scale - 1) / 3.6);
        if (r.scale > 4.6) {
          r.scale = 1;
        }
      });

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    // 13. Auto-Resize
    const handleResize = () => {
      if (!container) return;
      const newW = container.clientWidth || 800;
      const newH = height || container.clientHeight || 540;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animationId);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener("pointerdown", handlePointerDown);
      renderer.dispose();
      container.innerHTML = "";
    };
  }, [signals, height]);

  const toggleAutoRotate = () => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = !isRotating;
      setIsRotating(!isRotating);
    }
  };

  const resetView = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
      setSelectedSignal(null);
    }
  };

  return (
    <div className="w-full h-full relative rounded-xl border border-border/50 overflow-hidden glow-border bg-[#04060a] min-h-[480px] flex flex-col">
      <div
        ref={containerRef}
        className="globe-canvas-wrapper w-full h-full min-h-[480px] flex-1 cursor-grab active:cursor-grabbing"
        style={{ height: `${height}px`, width: "100%", display: "block" }}
      />

      {/* Top Left HUD Telemetry Overlay (Unreal Engine 4D Style) */}
      <div className="absolute top-3 left-3 pointer-events-none z-10 bg-bg/85 backdrop-blur-md px-3.5 py-2.5 rounded-lg border border-accent/40 text-xs font-mono shadow-2xl">
        <div className="flex items-center gap-2 text-accent font-bold">
          <span className="w-2.5 h-2.5 rounded-full bg-accent signal-pulse" />
          <span>UNREAL ENGINE 4D · ORBITAL AEROSPACE ENGINE</span>
        </div>
        <div className="text-[10px] text-muted mt-1 flex items-center gap-3">
          <span>4D Dynamic Clouds</span>
          <span>·</span>
          <span>Niagara Particle Streams</span>
          <span>·</span>
          <span className="text-accent font-bold">DEFCON 2</span>
        </div>
      </div>

      {/* Top Right Globe Camera & Temporal Controls */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
        <button
          onClick={toggleAutoRotate}
          className={"px-2.5 py-1 text-[10px] font-mono rounded border backdrop-blur-md transition " + (
            isRotating
              ? "bg-accent/20 border-accent/50 text-accent font-bold"
              : "bg-surface/80 border-border/50 text-muted hover:text-fg"
          )}
        >
          {isRotating ? "4D ORBIT ROTATION" : "ROTATION PAUSED"}
        </button>
        <button
          onClick={resetView}
          className="px-2.5 py-1 text-[10px] font-mono rounded border border-border/50 bg-surface/80 text-fg hover:border-accent/40 transition backdrop-blur-md"
        >
          RESET CAMERA
        </button>
      </div>

      {/* Bottom Left Telemetry Status */}
      <div className="absolute bottom-3 left-3 pointer-events-none z-10 hidden sm:flex items-center gap-2 text-[10px] font-mono bg-bg/80 backdrop-blur-md px-3 py-1.5 rounded border border-border/40 text-muted">
        <span className="text-accent">4 SATELLITES IN ORBIT</span>
        <span>|</span>
        <span>LAT: 14.80°N LNG: 42.95°E (RED SEA)</span>
        <span>|</span>
        <span className="text-red-400 font-bold">VIIRS 375m ACTIVE</span>
      </div>

      {/* Bottom Floating Signal Inspector when Clicked */}
      {selectedSignal && (
        <div className="absolute bottom-3 left-3 right-3 z-10 bg-bg/95 backdrop-blur-xl p-3.5 rounded-xl border border-accent/50 shadow-2xl flex flex-wrap items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-3">
            <span
              className={"w-3.5 h-3.5 rounded-full " + (
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
                className="px-3 py-1.5 bg-accent text-bg text-[10px] font-bold rounded hover:bg-accent/90 transition shadow-lg"
              >
                TACTICAL INTEL STREAM
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
