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
  const controlsRef = useRef<OrbitControls | null>(null);

  useEffect(() => {
    if (!containerRef.current || typeof window === "undefined") return;
    const container = containerRef.current;
    const w = container.clientWidth || 800;
    const h = height || container.clientHeight || 540;

    // 1. Scene & Camera Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#04060a");

    const camera = new THREE.PerspectiveCamera(45, w / h, 1, 4000);
    camera.position.set(0, 30, 240);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.6;
    controls.minDistance = 125;
    controls.maxDistance = 450;
    controlsRef.current = controls;

    // 2. Clean Natural Deep Space Lighting (No Green Cast)
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.3);
    scene.add(ambientLight);

    const mainSun = new THREE.DirectionalLight(0xffffff, 2.0);
    mainSun.position.set(300, 200, 300);
    scene.add(mainSun);

    const softFill = new THREE.DirectionalLight(0x6699cc, 0.8);
    softFill.position.set(-300, -100, -200);
    scene.add(softFill);

    // 3. Deep Space Starfield
    const starGeom = new THREE.BufferGeometry();
    const starCount = 1400;
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      starPos[i] = (Math.random() - 0.5) * 2200;
      starPos[i + 1] = (Math.random() - 0.5) * 2200;
      starPos[i + 2] = (Math.random() - 0.5) * 2200;
    }
    starGeom.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xaaccff, size: 1.6, transparent: true, opacity: 0.75 });
    scene.add(new THREE.Points(starGeom, starMat));

    // 4. Photorealistic NASA Earth Core Sphere (Pure, Clean, No Outer Shell)
    const earthRadius = 100;
    const earthGeometry = new THREE.SphereGeometry(earthRadius, 64, 64);
    const earthMaterial = new THREE.MeshStandardMaterial({
      color: 0x0e1726,
      roughness: 0.45,
      metalness: 0.1,
      emissive: new THREE.Color(0x000000),
      emissiveIntensity: 0.0,
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
          earthMaterial.emissive.setHex(0x111111);
          earthMaterial.emissiveIntensity = 0.2;
          earthMaterial.needsUpdate = true;
        },
        undefined,
        () => loadTextureWithFallback(index + 1)
      );
    };
    loadTextureWithFallback(0);

    // 5. 4D Orbital Satellites
    const satelliteGroup = new THREE.Group();
    scene.add(satelliteGroup);

    const satellites: { mesh: THREE.Mesh; orbitRadius: number; speed: number; angle: number }[] = [];
    const orbitConfigs = [
      { r: 120, speed: 0.012, tilt: 0.3, color: 0x00ffaa },
      { r: 135, speed: -0.009, tilt: 0.7, color: 0x00e5ff },
      { r: 150, speed: 0.007, tilt: -0.4, color: 0xffaa00 },
    ];

    orbitConfigs.forEach((cfg) => {
      // Clean thin orbital track
      const orbitRingGeom = new THREE.BufferGeometry();
      const ringPoints: THREE.Vector3[] = [];
      const segs = 64;
      for (let i = 0; i <= segs; i++) {
        const theta = (i / segs) * Math.PI * 2;
        ringPoints.push(new THREE.Vector3(Math.cos(theta) * cfg.r, 0, Math.sin(theta) * cfg.r));
      }
      orbitRingGeom.setFromPoints(ringPoints);
      const ringLineMat = new THREE.LineBasicMaterial({ color: cfg.color, transparent: true, opacity: 0.15 });
      const ringMesh = new THREE.Line(orbitRingGeom, ringLineMat);
      ringMesh.rotation.x = cfg.tilt;
      satelliteGroup.add(ringMesh);

      // Satellite Dot
      const satGeom = new THREE.SphereGeometry(1.5, 8, 8);
      const satMat = new THREE.MeshBasicMaterial({ color: cfg.color });
      const satMesh = new THREE.Mesh(satGeom, satMat);
      satelliteGroup.add(satMesh);
      satellites.push({
        mesh: satMesh,
        orbitRadius: cfg.r,
        speed: cfg.speed,
        angle: Math.random() * Math.PI * 2,
      });
    });

    // 6. Kinetic Hotspots & Radar Rings
    const beaconsGroup = new THREE.Group();
    scene.add(beaconsGroup);

    const sourceSignals = signals && signals.length > 0 ? signals : DEFAULT_HOTSPOTS;
    const validSignals = sourceSignals.filter((s) => s.lat !== 0 && s.lng !== 0);

    const interactiveObjects: THREE.Object3D[] = [];
    const animatedRings: { mesh: THREE.Mesh; scale: number; speed: number }[] = [];

    validSignals.forEach((s) => {
      const pos = latLngToVector3(s.lat, s.lng, earthRadius);
      const colorHex = s.severity === 0 ? 0xff2244 : s.severity === 1 ? 0xff8800 : 0x00ff88;

      // Vertical Laser Pillar
      const pillarGeom = new THREE.CylinderGeometry(0.35, 0.08, 12, 8);
      pillarGeom.rotateX(Math.PI / 2);
      const pillarMat = new THREE.MeshBasicMaterial({ color: colorHex, transparent: true, opacity: 0.95 });
      const pillarMesh = new THREE.Mesh(pillarGeom, pillarMat);
      pillarMesh.position.copy(pos.clone().multiplyScalar(1.04));
      pillarMesh.lookAt(new THREE.Vector3(0, 0, 0));
      (pillarMesh as any).signalData = s;
      beaconsGroup.add(pillarMesh);
      interactiveObjects.push(pillarMesh);

      // Glowing Beacon Orb
      const orbGeom = new THREE.SphereGeometry(s.severity === 0 ? 3.0 : 2.0, 16, 16);
      const orbMat = new THREE.MeshBasicMaterial({ color: colorHex });
      const orbMesh = new THREE.Mesh(orbGeom, orbMat);
      orbMesh.position.copy(pos.clone().multiplyScalar(1.07));
      (orbMesh as any).signalData = s;
      beaconsGroup.add(orbMesh);
      interactiveObjects.push(orbMesh);

      // Concentric Expanding Radar Wave
      const ringGeom = new THREE.RingGeometry(1.2, 3.4, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: colorHex,
        transparent: true,
        opacity: 0.85,
        side: THREE.DoubleSide,
      });
      const ringMesh = new THREE.Mesh(ringGeom, ringMat);
      ringMesh.position.copy(pos.clone().multiplyScalar(1.01));
      ringMesh.lookAt(new THREE.Vector3(0, 0, 0));
      beaconsGroup.add(ringMesh);
      animatedRings.push({ mesh: ringMesh, scale: 1, speed: 0.022 + Math.random() * 0.015 });
    });

    // 7. Trajectory Arcs with Niagara Energy Photons
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
      mid.setLength(earthRadius + dist * 0.35);

      const curve = new THREE.QuadraticBezierCurve3(p1, mid, p2);
      const points = curve.getPoints(50);
      const arcGeom = new THREE.BufferGeometry().setFromPoints(points);
      const arcMat = new THREE.LineBasicMaterial({
        color: i % 2 === 0 ? 0x00ffaa : 0xff3355,
        transparent: true,
        opacity: 0.75,
      });
      arcsGroup.add(new THREE.Line(arcGeom, arcMat));

      // Moving Photon Energy Particle
      const photonGeom = new THREE.SphereGeometry(1.3, 8, 8);
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

    // 8. Raycaster for Interactive Hotspot Selection
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

    // 9. 60 FPS Render Loop
    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);

      // Satellite Orbits
      satellites.forEach((sat) => {
        sat.angle += sat.speed;
        sat.mesh.position.set(
          Math.cos(sat.angle) * sat.orbitRadius,
          Math.sin(sat.angle * 1.5) * 15,
          Math.sin(sat.angle) * sat.orbitRadius
        );
      });

      // Niagara Photons Moving on Arcs
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
        mat.opacity = Math.max(0, 1 - (r.scale - 1) / 3.4);
        if (r.scale > 4.4) {
          r.scale = 1;
        }
      });

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    // 10. Auto-Resize
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

      {/* Top Left HUD Telemetry Overlay */}
      <div className="absolute top-3 left-3 pointer-events-none z-10 bg-bg/85 backdrop-blur-md px-3.5 py-2.5 rounded-lg border border-accent/40 text-xs font-mono shadow-2xl">
        <div className="flex items-center gap-2 text-accent font-bold">
          <span className="w-2.5 h-2.5 rounded-full bg-accent signal-pulse" />
          <span>ORBITAL 3D PROJECTION · CLEAN OPTICAL VIEW</span>
        </div>
        <div className="text-[10px] text-muted mt-1 flex items-center gap-3">
          <span>NASA Night Lights</span>
          <span>·</span>
          <span>Orbital Satellites</span>
          <span>·</span>
          <span className="text-accent font-bold">DEFCON 2</span>
        </div>
      </div>

      {/* Top Right Globe Camera Controls */}
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
