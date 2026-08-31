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
  { name: "WASHINGTON (HQ)", lat: 38.89, lng: -77.03 },
  { name: "LONDON (GCHQ)", lat: 51.50, lng: -0.12 },
  { name: "KYIV (INTEL)", lat: 50.45, lng: 30.52 },
  { name: "TEL AVIV (OPERATIONS)", lat: 32.08, lng: 34.78 },
  { name: "STRAIT OF HORMUZ", lat: 26.56, lng: 56.25 },
  { name: "BAB-EL-MANDEB (RED SEA)", lat: 12.58, lng: 43.33 },
  { name: "TAIPEI (PACIFIC SECTOR)", lat: 25.03, lng: 121.56 },
  { name: "TOKYO (NORTH ASIA)", lat: 35.67, lng: 139.65 },
];

const DEFAULT_HOTSPOTS: Signal[] = [
  { id: "def-1", type: "conflict", title: "Red Sea Maritime Escort & Drone Intercept", country: "Yemen", lat: 14.80, lng: 42.95, severity: 0, source: "CENTCOM / ACLED", url: "https://acleddata.com", ts: new Date().toISOString(), tags: [] },
  { id: "def-2", type: "conflict", title: "Pokrovsk - Donetsk Heavy Artillery Axis", country: "Ukraine", lat: 48.28, lng: 37.18, severity: 0, source: "GEOINT / VIIRS", url: "https://firms.modaps.eosdis.nasa.gov", ts: new Date().toISOString(), tags: [] },
  { id: "def-3", type: "geopolitical", title: "Taiwan Strait ADIZ Maritime Patrol Sweep", country: "Taiwan", lat: 24.15, lng: 120.67, severity: 1, source: "MND / OpenSky", url: "https://opensky-network.org", ts: new Date().toISOString(), tags: [] },
  { id: "def-4", type: "satellite", title: "Strait of Hormuz AIS Dark-Zone Spike", country: "Iran", lat: 26.56, lng: 56.25, severity: 1, source: "NASA FIRMS", url: "https://firms.modaps.eosdis.nasa.gov", ts: new Date().toISOString(), tags: [] },
  { id: "def-5", type: "conflict", title: "Southern Lebanon Border Kinetic Exchanges", country: "Lebanon", lat: 33.27, lng: 35.20, severity: 0, source: "OSINT / Live", url: "https://gdeltproject.org", ts: new Date().toISOString(), tags: [] },
  { id: "def-6", type: "market", title: "NVDA Dark Pool Liquidity Cluster $128.50", country: "United States", lat: 37.37, lng: -121.96, severity: 1, source: "SEC Form 4", url: "https://sec.gov", ts: new Date().toISOString(), tags: [] },
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

export default function GodModeGlobe({ signals, height = 520 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedSignal, setSelectedSignal] = useState<Signal | null>(null);
  const [isRotating, setIsRotating] = useState(true);
  const controlsRef = useRef<OrbitControls | null>(null);

  useEffect(() => {
    if (!containerRef.current || typeof window === "undefined") return;
    const container = containerRef.current;
    const w = container.clientWidth || 800;
    const h = height || container.clientHeight || 520;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#05070c");

    const camera = new THREE.PerspectiveCamera(45, w / h, 1, 3000);
    camera.position.set(0, 30, 240);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
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
    controls.minDistance = 130;
    controls.maxDistance = 420;
    controlsRef.current = controls;

    // 2. High-Tech Illumination
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 1.8);
    sunLight.position.set(300, 200, 300);
    scene.add(sunLight);

    const cyanFill = new THREE.DirectionalLight(0x00ff88, 0.9);
    cyanFill.position.set(-300, -100, -200);
    scene.add(cyanFill);

    // 3. Deep Starfield Background
    const starGeom = new THREE.BufferGeometry();
    const starCount = 1200;
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      starPos[i] = (Math.random() - 0.5) * 1800;
      starPos[i + 1] = (Math.random() - 0.5) * 1800;
      starPos[i + 2] = (Math.random() - 0.5) * 1800;
    }
    starGeom.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({ color: 0x99ccff, size: 1.6, transparent: true, opacity: 0.7 });
    scene.add(new THREE.Points(starGeom, starMat));

    // 4. Photorealistic NASA Earth Night Texture Loader with multiple mirror fallbacks
    const earthRadius = 100;
    const earthGeometry = new THREE.SphereGeometry(earthRadius, 64, 64);
    
    // Initial sleek dark material
    const earthMaterial = new THREE.MeshStandardMaterial({
      color: 0x0a1424,
      roughness: 0.5,
      metalness: 0.1,
      emissive: new THREE.Color(0x02110c),
      emissiveIntensity: 0.3,
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
          earthMaterial.emissive.setHex(0x112211);
          earthMaterial.emissiveIntensity = 0.2;
          earthMaterial.needsUpdate = true;
        },
        undefined,
        () => loadTextureWithFallback(index + 1)
      );
    };
    loadTextureWithFallback(0);

    // 5. Holographic Grid & Atmosphere Shield
    const gridGeometry = new THREE.SphereGeometry(earthRadius * 1.002, 36, 18);
    const gridMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ff88,
      wireframe: true,
      transparent: true,
      opacity: 0.09,
    });
    scene.add(new THREE.Mesh(gridGeometry, gridMaterial));

    // Outer Atmospheric Glow
    const atmosGeom = new THREE.SphereGeometry(earthRadius * 1.14, 48, 48);
    const atmosMat = new THREE.MeshBasicMaterial({
      color: 0x00e5ff,
      transparent: true,
      opacity: 0.16,
      side: THREE.BackSide,
    });
    scene.add(new THREE.Mesh(atmosGeom, atmosMat));

    // 6. Active Telemetry Beacons & Sonar Waves
    const beaconsGroup = new THREE.Group();
    scene.add(beaconsGroup);

    const sourceSignals = signals && signals.length > 0 ? signals : DEFAULT_HOTSPOTS;
    const validSignals = sourceSignals.filter((s) => s.lat !== 0 && s.lng !== 0);

    const interactiveObjects: THREE.Object3D[] = [];
    const animatedRings: { mesh: THREE.Mesh; scale: number; speed: number }[] = [];

    validSignals.forEach((s) => {
      const pos = latLngToVector3(s.lat, s.lng, earthRadius);
      const colorHex = s.severity === 0 ? 0xff3333 : s.severity === 1 ? 0xff9900 : 0x00ff88;

      // Vertical Laser Pillar
      const pillarGeom = new THREE.CylinderGeometry(0.5, 0.1, 14, 8);
      pillarGeom.rotateX(Math.PI / 2);
      const pillarMat = new THREE.MeshBasicMaterial({ color: colorHex, transparent: true, opacity: 0.9 });
      const pillarMesh = new THREE.Mesh(pillarGeom, pillarMat);
      pillarMesh.position.copy(pos.clone().multiplyScalar(1.05));
      pillarMesh.lookAt(new THREE.Vector3(0, 0, 0));
      (pillarMesh as any).signalData = s;
      beaconsGroup.add(pillarMesh);
      interactiveObjects.push(pillarMesh);

      // Bright Core Beacon Orb
      const sphereGeom = new THREE.SphereGeometry(s.severity === 0 ? 3.0 : 2.0, 16, 16);
      const sphereMat = new THREE.MeshBasicMaterial({ color: colorHex });
      const sphereMesh = new THREE.Mesh(sphereGeom, sphereMat);
      sphereMesh.position.copy(pos.clone().multiplyScalar(1.08));
      (sphereMesh as any).signalData = s;
      beaconsGroup.add(sphereMesh);
      interactiveObjects.push(sphereMesh);

      // Concentric Expanding Radar Ring
      const ringGeom = new THREE.RingGeometry(1.2, 3.5, 32);
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
      animatedRings.push({ mesh: ringMesh, scale: 1, speed: 0.022 + Math.random() * 0.015 });
    });

    // 7. Kinetic Trajectory Bezier Arcs
    const arcsGroup = new THREE.Group();
    scene.add(arcsGroup);

    for (let i = 0; i < COMMAND_HUBS.length; i++) {
      const h1 = COMMAND_HUBS[i];
      const h2 = COMMAND_HUBS[(i + 1) % COMMAND_HUBS.length];
      const p1 = latLngToVector3(h1.lat, h1.lng, earthRadius);
      const p2 = latLngToVector3(h2.lat, h2.lng, earthRadius);

      const mid = p1.clone().add(p2).multiplyScalar(0.5);
      const dist = p1.distanceTo(p2);
      mid.setLength(earthRadius + dist * 0.38);

      const curve = new THREE.QuadraticBezierCurve3(p1, mid, p2);
      const points = curve.getPoints(45);
      const arcGeom = new THREE.BufferGeometry().setFromPoints(points);
      const arcMat = new THREE.LineBasicMaterial({
        color: i % 2 === 0 ? 0x00ff88 : 0xff3333,
        transparent: true,
        opacity: 0.85,
      });
      arcsGroup.add(new THREE.Line(arcGeom, arcMat));
    }

    // Connect top threat beacons to nearest Command Hub
    validSignals.slice(0, 8).forEach((s, idx) => {
      const hub = COMMAND_HUBS[idx % COMMAND_HUBS.length];
      const p1 = latLngToVector3(hub.lat, hub.lng, earthRadius);
      const p2 = latLngToVector3(s.lat, s.lng, earthRadius);
      const mid = p1.clone().add(p2).multiplyScalar(0.5);
      mid.setLength(earthRadius + p1.distanceTo(p2) * 0.25);
      const curve = new THREE.QuadraticBezierCurve3(p1, mid, p2);
      const arcGeom = new THREE.BufferGeometry().setFromPoints(curve.getPoints(30));
      const arcMat = new THREE.LineBasicMaterial({ color: 0x00e5ff, transparent: true, opacity: 0.6 });
      arcsGroup.add(new THREE.Line(arcGeom, arcMat));
    });

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

      // Radar Sonar Expansion
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

    // 10. Auto-Resize
    const handleResize = () => {
      if (!container) return;
      const newW = container.clientWidth || 800;
      const newH = height || container.clientHeight || 520;
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
    <div className="w-full h-full relative rounded-xl border border-border/50 overflow-hidden glow-border bg-[#05070c] min-h-[460px] flex flex-col">
      <div
        ref={containerRef}
        className="globe-canvas-wrapper w-full h-full min-h-[460px] flex-1 cursor-grab active:cursor-grabbing"
        style={{ height: `${height}px`, width: "100%", display: "block" }}
      />

      {/* Top Left HUD Telemetry Overlay */}
      <div className="absolute top-3 left-3 pointer-events-none z-10 bg-bg/85 backdrop-blur-md px-3 py-2 rounded-lg border border-border/40 text-xs font-mono shadow-xl">
        <div className="flex items-center gap-2 text-accent font-bold">
          <span className="w-2 h-2 rounded-full bg-accent signal-pulse" />
          <span>ORBITAL 3D PROJECTION · HARDWARE ACCELERATED</span>
        </div>
        <div className="text-[10px] text-muted mt-0.5">
          NASA Earth Night Lights · Kinetic Trajectories · Active Sonar Beacons
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
        <div className="absolute bottom-3 left-3 right-3 z-10 bg-bg/95 backdrop-blur-xl p-3 rounded-xl border border-accent/50 shadow-2xl flex flex-wrap items-center justify-between gap-3 animate-fade-in">
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
