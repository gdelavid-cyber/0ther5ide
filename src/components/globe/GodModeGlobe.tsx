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

// Convert Lat/Lng to 3D Cartesian coordinates on sphere radius R
function latLngToVector3(lat: number, lng: number, radius: number = 100): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

// Generate an ultra-sharp procedural Earth texture with continents and night lights
function createProceduralEarthTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 2048;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d")!;

  // Deep Space Ocean Base
  ctx.fillStyle = "#060913";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Subtle longitude & latitude tactical navigation grid
  ctx.strokeStyle = "rgba(0, 255, 136, 0.08)";
  ctx.lineWidth = 1;
  for (let x = 0; x < canvas.width; x += 64) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y < canvas.height; y += 64) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  // Draw procedural landmass contours
  ctx.fillStyle = "#0c1824";
  ctx.strokeStyle = "#00ff88";
  ctx.lineWidth = 1.5;

  // Major continental landmass approximations (North America, South America, Eurasia, Africa, Australia)
  const landmasses = [
    // North America
    [[200, 200], [450, 150], [550, 300], [400, 450], [300, 480], [220, 350]],
    // South America
    [[400, 520], [520, 560], [480, 800], [420, 900], [380, 700]],
    // Europe & Africa
    [[850, 220], [1050, 200], [1150, 320], [1100, 600], [980, 850], [900, 650], [820, 400]],
    // Asia
    [[1100, 200], [1600, 180], [1750, 350], [1500, 550], [1300, 500], [1150, 380]],
    // Australia
    [[1550, 680], [1750, 700], [1700, 850], [1550, 820]],
  ];

  landmasses.forEach((poly) => {
    ctx.beginPath();
    ctx.moveTo(poly[0][0], poly[0][1]);
    for (let i = 1; i < poly.length; i++) {
      ctx.lineTo(poly[i][0], poly[i][1]);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  });

  // Add random city light clusters across land
  ctx.fillStyle = "rgba(0, 255, 136, 0.7)";
  for (let i = 0; i < 400; i++) {
    const rx = Math.random() * canvas.width;
    const ry = Math.random() * canvas.height;
    const size = Math.random() * 2 + 1;
    ctx.beginPath();
    ctx.arc(rx, ry, size, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

export default function GodModeGlobe({ signals, height = 500 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedSignal, setSelectedSignal] = useState<Signal | null>(null);
  const [isRotating, setIsRotating] = useState(true);
  const controlsRef = useRef<OrbitControls | null>(null);

  useEffect(() => {
    if (!containerRef.current || typeof window === "undefined") return;
    const container = containerRef.current;
    const w = container.clientWidth || 800;
    const h = height || container.clientHeight || 500;

    // 1. Scene & Camera Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#06070a");

    const camera = new THREE.PerspectiveCamera(45, w / h, 1, 2000);
    camera.position.set(0, 50, 260);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.8;
    controls.minDistance = 140;
    controls.maxDistance = 450;
    controlsRef.current = controls;

    // 2. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x00ff88, 1.2);
    dirLight1.position.set(200, 150, 200);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x4488ff, 0.9);
    dirLight2.position.set(-200, -100, -200);
    scene.add(dirLight2);

    // 3. Globe Sphere Mesh (Radius = 100)
    const earthRadius = 100;
    const earthGeometry = new THREE.SphereGeometry(earthRadius, 64, 64);
    const texture = createProceduralEarthTexture();
    const earthMaterial = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.7,
      metalness: 0.2,
      emissive: new THREE.Color(0x02110c),
      emissiveIntensity: 0.4,
    });
    const earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);
    scene.add(earthMesh);

    // 4. Volumetric Atmosphere Glow Sphere
    const atmosphereGeometry = new THREE.SphereGeometry(earthRadius * 1.12, 48, 48);
    const atmosphereMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ff88,
      transparent: true,
      opacity: 0.12,
      side: THREE.BackSide,
    });
    const atmosphereMesh = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    scene.add(atmosphereMesh);

    // 5. Tactical Hotspot Beacons & Expanding Radar Rings
    const beaconsGroup = new THREE.Group();
    scene.add(beaconsGroup);

    const sourceSignals = signals && signals.length > 0 ? signals : DEFAULT_HOTSPOTS;
    const validSignals = sourceSignals.filter((s) => s.lat !== 0 && s.lng !== 0);

    const interactiveObjects: THREE.Object3D[] = [];
    const animatedRings: { mesh: THREE.Mesh; scale: number; speed: number }[] = [];

    validSignals.forEach((s) => {
      const pos = latLngToVector3(s.lat, s.lng, earthRadius + 1.5);
      const colorHex = s.severity === 0 ? 0xff4444 : s.severity === 1 ? 0xff8800 : 0x00ff88;

      // Solid Beacon Cylinder / Pin
      const pinGeom = new THREE.CylinderGeometry(0.8, 0.2, 8, 8);
      pinGeom.rotateX(Math.PI / 2);
      const pinMat = new THREE.MeshBasicMaterial({ color: colorHex });
      const pinMesh = new THREE.Mesh(pinGeom, pinMat);
      pinMesh.position.copy(pos);
      pinMesh.lookAt(new THREE.Vector3(0, 0, 0));
      (pinMesh as any).signalData = s;
      beaconsGroup.add(pinMesh);
      interactiveObjects.push(pinMesh);

      // Glowing Beacon Sphere
      const sphereGeom = new THREE.SphereGeometry(s.severity === 0 ? 3 : 2, 16, 16);
      const sphereMat = new THREE.MeshBasicMaterial({ color: colorHex });
      const sphereMesh = new THREE.Mesh(sphereGeom, sphereMat);
      sphereMesh.position.copy(pos.clone().multiplyScalar(1.03));
      (sphereMesh as any).signalData = s;
      beaconsGroup.add(sphereMesh);
      interactiveObjects.push(sphereMesh);

      // Pulsing Radar Ring
      const ringGeom = new THREE.RingGeometry(1.5, 3.5, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: colorHex,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide,
      });
      const ringMesh = new THREE.Mesh(ringGeom, ringMat);
      ringMesh.position.copy(pos.clone().multiplyScalar(1.01));
      ringMesh.lookAt(new THREE.Vector3(0, 0, 0));
      beaconsGroup.add(ringMesh);
      animatedRings.push({ mesh: ringMesh, scale: 1, speed: 0.02 + Math.random() * 0.015 });
    });

    // 6. Kinetic Trajectory Arcs
    const arcsGroup = new THREE.Group();
    scene.add(arcsGroup);

    for (let i = 0; i < COMMAND_HUBS.length; i++) {
      const h1 = COMMAND_HUBS[i];
      const h2 = COMMAND_HUBS[(i + 1) % COMMAND_HUBS.length];
      const p1 = latLngToVector3(h1.lat, h1.lng, earthRadius);
      const p2 = latLngToVector3(h2.lat, h2.lng, earthRadius);

      const mid = p1.clone().add(p2).multiplyScalar(0.5);
      const dist = p1.distanceTo(p2);
      mid.setLength(earthRadius + dist * 0.35);

      const curve = new THREE.QuadraticBezierCurve3(p1, mid, p2);
      const points = curve.getPoints(40);
      const arcGeom = new THREE.BufferGeometry().setFromPoints(points);
      const arcMat = new THREE.LineBasicMaterial({
        color: i % 2 === 0 ? 0x00ff88 : 0xff4444,
        transparent: true,
        opacity: 0.75,
      });
      const arcLine = new THREE.Line(arcGeom, arcMat);
      arcsGroup.add(arcLine);
    }

    // 7. Raycaster for Interactive Click Inspection
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

    // 8. Animation & Render Loop
    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);

      // Animate pulsing radar rings
      animatedRings.forEach((r) => {
        r.scale += r.speed;
        r.mesh.scale.set(r.scale, r.scale, r.scale);
        const mat = r.mesh.material as THREE.MeshBasicMaterial;
        mat.opacity = Math.max(0, 1 - (r.scale - 1) / 3.5);
        if (r.scale > 4.5) {
          r.scale = 1;
        }
      });

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    // 9. Resize Handling
    const handleResize = () => {
      if (!container) return;
      const newW = container.clientWidth || 800;
      const newH = height || container.clientHeight || 500;
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
          <span>ORBITAL 3D PROJECTION · HARDWARE ACCELERATED</span>
        </div>
        <div className="text-[10px] text-muted mt-0.5">
          WebGL Shaders · Kinetic Trajectory Arcs · Active Sonar Beacons
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
