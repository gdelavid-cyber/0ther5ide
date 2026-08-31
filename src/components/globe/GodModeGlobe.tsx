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

    // 1. Photorealistic WebGL Scene & Camera
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#020306");

    const camera = new THREE.PerspectiveCamera(42, w / h, 1, 4000);
    camera.position.set(0, 35, 250);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.04;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.55;
    controls.minDistance = 120;
    controls.maxDistance = 480;
    controlsRef.current = controls;

    // 2. Cinematic Solar & Space Lighting
    const ambientLight = new THREE.AmbientLight(0x0a1424, 0.85);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfffdfa, 3.2);
    sunLight.position.set(380, 160, 260);
    scene.add(sunLight);

    const earthShine = new THREE.DirectionalLight(0x1a3a60, 0.9);
    earthShine.position.set(-350, -80, -220);
    scene.add(earthShine);

    // 3. Deep Space Celestial Starfield (3,200 Stars with Spectral Variation)
    const starGeom = new THREE.BufferGeometry();
    const starCount = 3200;
    const starPos = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount * 3; i += 3) {
      starPos[i] = (Math.random() - 0.5) * 2600;
      starPos[i + 1] = (Math.random() - 0.5) * 2600;
      starPos[i + 2] = (Math.random() - 0.5) * 2600;

      // Color variation: blue, white, warm amber
      const r = Math.random();
      if (r > 0.8) {
        starColors[i] = 0.7; starColors[i + 1] = 0.85; starColors[i + 2] = 1.0; // Cool Blue
      } else if (r > 0.6) {
        starColors[i] = 1.0; starColors[i + 1] = 0.9; starColors[i + 2] = 0.7; // Warm Gold
      } else {
        starColors[i] = 0.95; starColors[i + 1] = 0.95; starColors[i + 2] = 1.0; // Pure White
      }
    }
    starGeom.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
    starGeom.setAttribute("color", new THREE.BufferAttribute(starColors, 3));
    const starMat = new THREE.PointsMaterial({
      size: 1.4,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
    });
    scene.add(new THREE.Points(starGeom, starMat));

    // 4. Photorealistic NASA Earth Core Sphere
    const earthRadius = 100;
    const earthGeometry = new THREE.SphereGeometry(earthRadius, 96, 96);
    const earthMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.35,
      metalness: 0.15,
      emissive: new THREE.Color(0x181810),
      emissiveIntensity: 0.45,
    });
    const earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);
    scene.add(earthMesh);

    // Texture Loader with Multi-Mirror Fallbacks for Maximum Realism
    const textureLoader = new THREE.TextureLoader();

    // High-Resolution NASA Blue Marble / Night Lights
    textureLoader.load(
      "https://raw.githubusercontent.com/vasturiano/three-globe/master/example/img/earth-blue-marble.jpg",
      (dayTex) => {
        dayTex.wrapS = THREE.RepeatWrapping;
        dayTex.wrapT = THREE.ClampToEdgeWrapping;
        earthMaterial.map = dayTex;
        earthMaterial.needsUpdate = true;
      },
      undefined,
      () => {
        textureLoader.load("https://raw.githubusercontent.com/vasturiano/three-globe/master/example/img/earth-night.jpg", (nightTex) => {
          earthMaterial.map = nightTex;
          earthMaterial.needsUpdate = true;
        });
      }
    );

    // Topographic Bump Map for 3D Mountain Elevation Relief
    textureLoader.load(
      "https://raw.githubusercontent.com/vasturiano/three-globe/master/example/img/earth-topology.png",
      (bumpTex) => {
        earthMaterial.bumpMap = bumpTex;
        earthMaterial.bumpScale = 1.2;
        earthMaterial.needsUpdate = true;
      }
    );

    // 5. Volumetric Dynamic Rotating Cloud Layer (Hovering at 100.7x Altitude)
    const cloudGeometry = new THREE.SphereGeometry(earthRadius * 1.007, 64, 64);
    const cloudMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.32,
      blending: THREE.NormalBlending,
      roughness: 0.9,
    });
    const cloudMesh = new THREE.Mesh(cloudGeometry, cloudMaterial);
    scene.add(cloudMesh);

    textureLoader.load(
      "https://raw.githubusercontent.com/vasturiano/three-globe/master/example/img/earth-water.png",
      (cloudTex) => {
        cloudMaterial.alphaMap = cloudTex;
        cloudMaterial.needsUpdate = true;
      }
    );

    // 6. Realistic Thin Rayleigh Atmosphere Glow (Delicate 100km Blue Horizon Limb)
    const atmoGeometry = new THREE.SphereGeometry(earthRadius * 1.018, 64, 64);
    const atmoMaterial = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.62 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.8);
          gl_FragColor = vec4(0.0, 0.65, 1.0, 1.0) * intensity * 0.45;
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
    });
    const atmoMesh = new THREE.Mesh(atmoGeometry, atmoMaterial);
    scene.add(atmoMesh);

    // 7. 4D Defense Satellites with Orbital Paths
    const satelliteGroup = new THREE.Group();
    scene.add(satelliteGroup);

    const satellites: { mesh: THREE.Mesh; orbitRadius: number; speed: number; angle: number }[] = [];
    const orbitConfigs = [
      { r: 122, speed: 0.010, tilt: 0.35, color: 0x00ffcc },
      { r: 138, speed: -0.008, tilt: 0.65, color: 0x00d9ff },
      { r: 154, speed: 0.006, tilt: -0.45, color: 0xffb700 },
    ];

    orbitConfigs.forEach((cfg) => {
      const orbitRingGeom = new THREE.BufferGeometry();
      const ringPoints: THREE.Vector3[] = [];
      const segs = 96;
      for (let i = 0; i <= segs; i++) {
        const theta = (i / segs) * Math.PI * 2;
        ringPoints.push(new THREE.Vector3(Math.cos(theta) * cfg.r, 0, Math.sin(theta) * cfg.r));
      }
      orbitRingGeom.setFromPoints(ringPoints);
      const ringLineMat = new THREE.LineBasicMaterial({ color: cfg.color, transparent: true, opacity: 0.18 });
      const ringMesh = new THREE.Line(orbitRingGeom, ringLineMat);
      ringMesh.rotation.x = cfg.tilt;
      satelliteGroup.add(ringMesh);

      // Satellite Module Mesh
      const satGeom = new THREE.SphereGeometry(1.4, 8, 8);
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

    // 8. Kinetic Conflict Beacons & Radar Rings
    const beaconsGroup = new THREE.Group();
    scene.add(beaconsGroup);

    const sourceSignals = signals && signals.length > 0 ? signals : DEFAULT_HOTSPOTS;
    const validSignals = sourceSignals.filter((s) => s.lat !== 0 && s.lng !== 0);

    const interactiveObjects: THREE.Object3D[] = [];
    const animatedRings: { mesh: THREE.Mesh; scale: number; speed: number }[] = [];

    validSignals.forEach((sig) => {
      const pos = latLngToVector3(sig.lat, sig.lng, earthRadius + 0.8);
      const colorHex = new THREE.Color(severityColor(sig.severity)).getHex();

      // Pin Core
      const pinGeom = new THREE.SphereGeometry(1.6, 12, 12);
      const pinMat = new THREE.MeshBasicMaterial({ color: colorHex });
      const pinMesh = new THREE.Mesh(pinGeom, pinMat);
      pinMesh.position.copy(pos);
      pinMesh.userData = { signal: sig };
      beaconsGroup.add(pinMesh);
      interactiveObjects.push(pinMesh);

      // Radar Pulse Ring
      const ringGeom = new THREE.RingGeometry(1.8, 2.6, 24);
      const ringMat = new THREE.MeshBasicMaterial({
        color: colorHex,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8,
      });
      const ringMesh = new THREE.Mesh(ringGeom, ringMat);
      ringMesh.position.copy(pos);
      ringMesh.lookAt(0, 0, 0);
      beaconsGroup.add(ringMesh);

      animatedRings.push({
        mesh: ringMesh,
        scale: 1,
        speed: 0.015 + Math.random() * 0.01,
      });
    });

    // 9. Niagara-Style Command Trajectory Arcs & Photon Particles
    const arcGroup = new THREE.Group();
    scene.add(arcGroup);

    const activeArcs = [
      { from: COMMAND_HUBS[0], to: COMMAND_HUBS[1], color: 0x00ffcc }, // Pentagon -> London
      { from: COMMAND_HUBS[1], to: COMMAND_HUBS[2], color: 0x00d9ff }, // London -> Kyiv
      { from: COMMAND_HUBS[0], to: COMMAND_HUBS[3], color: 0xffaa00 }, // Pentagon -> Tel Aviv
      { from: COMMAND_HUBS[3], to: COMMAND_HUBS[5], color: 0xff3b5c }, // Tel Aviv -> Bab-el-Mandeb
      { from: COMMAND_HUBS[0], to: COMMAND_HUBS[6], color: 0x00ffcc }, // Pentagon -> Taipei
    ];

    const photonParticles: { mesh: THREE.Mesh; curve: THREE.QuadraticBezierCurve3; progress: number; speed: number }[] = [];

    activeArcs.forEach((arcDef) => {
      const vFrom = latLngToVector3(arcDef.from.lat, arcDef.from.lng, earthRadius + 0.8);
      const vTo = latLngToVector3(arcDef.to.lat, arcDef.to.lng, earthRadius + 0.8);

      const mid = vFrom.clone().add(vTo).multiplyScalar(0.5);
      const dist = vFrom.distanceTo(vTo);
      mid.normalize().multiplyScalar(earthRadius + dist * 0.32);

      const curve = new THREE.QuadraticBezierCurve3(vFrom, mid, vTo);
      const points = curve.getPoints(48);

      const arcGeom = new THREE.BufferGeometry().setFromPoints(points);
      const arcMat = new THREE.LineBasicMaterial({
        color: arcDef.color,
        transparent: true,
        opacity: 0.35,
      });
      const arcLine = new THREE.Line(arcGeom, arcMat);
      arcGroup.add(arcLine);

      // Moving Photon Pulse
      const photonGeom = new THREE.SphereGeometry(1.2, 8, 8);
      const photonMat = new THREE.MeshBasicMaterial({ color: arcDef.color });
      const photonMesh = new THREE.Mesh(photonGeom, photonMat);
      arcGroup.add(photonMesh);

      photonParticles.push({
        mesh: photonMesh,
        curve,
        progress: Math.random(),
        speed: 0.006 + Math.random() * 0.004,
      });
    });

    // 10. Raycaster for Interactive Hotspot Clicks
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerDown = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(interactiveObjects);

      if (intersects.length > 0) {
        const target = intersects[0].object;
        if (target.userData?.signal) {
          setSelectedSignal(target.userData.signal);
        }
      }
    };

    renderer.domElement.addEventListener("pointerdown", handlePointerDown);

    // 11. 60 FPS Render Loop with Cloud & Satellite Physics
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);

      // Subtle Cloud Layer Independent Drift
      cloudMesh.rotation.y += 0.0006;

      // Orbit controls
      controls.update();

      // Satellite orbital movement
      satellites.forEach((sat, i) => {
        sat.angle += sat.speed;
        const cfg = orbitConfigs[i];
        const rawX = Math.cos(sat.angle) * sat.orbitRadius;
        const rawZ = Math.sin(sat.angle) * sat.orbitRadius;

        // Apply tilt
        const tiltedY = -rawZ * Math.sin(cfg.tilt);
        const tiltedZ = rawZ * Math.cos(cfg.tilt);

        sat.mesh.position.set(rawX, tiltedY, tiltedZ);
      });

      // Animated Radar Rings
      animatedRings.forEach((r) => {
        r.scale += r.speed;
        if (r.scale > 3.2) {
          r.scale = 1;
        }
        r.mesh.scale.set(r.scale, r.scale, 1);
        (r.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 1 - (r.scale - 1) / 2.2);
      });

      // Moving Photons along Beziers
      photonParticles.forEach((p) => {
        p.progress += p.speed;
        if (p.progress > 1) p.progress = 0;
        const pos = p.curve.getPoint(p.progress);
        p.mesh.position.copy(pos);
      });

      renderer.render(scene, camera);
    };
    animate();

    // 12. Responsive Resize
    const handleResize = () => {
      if (!containerRef.current) return;
      const newW = containerRef.current.clientWidth;
      const newH = height || containerRef.current.clientHeight || 540;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
      renderer.domElement.removeEventListener("pointerdown", handlePointerDown);
      renderer.dispose();
      controls.dispose();
    };
  }, [signals, height]);

  const toggleRotation = () => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = !controlsRef.current.autoRotate;
      setIsRotating(controlsRef.current.autoRotate);
    }
  };

  return (
    <div className="relative w-full rounded-2xl border border-accent/40 overflow-hidden bg-[#020306] shadow-[0_0_50px_rgba(0,255,136,0.1)] flex flex-col h-full font-mono">
      {/* HUD Top Overlay */}
      <div className="absolute top-3 left-3 z-10 flex flex-wrap items-center gap-2 pointer-events-auto">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-surface/90 border border-border/60 backdrop-blur-md text-xs">
          <span className="w-2 h-2 rounded-full bg-accent signal-pulse" />
          <span className="text-accent font-bold tracking-wider">NASA BLUE MARBLE 4D</span>
          <span className="text-[10px] text-muted hidden sm:inline">· 60 FPS PBR</span>
        </div>

        <button
          onClick={toggleRotation}
          className="px-2.5 py-1 rounded-full bg-surface/90 border border-border/60 hover:border-accent/60 text-[10px] text-muted hover:text-accent backdrop-blur-md transition flex items-center gap-1.5"
        >
          <span>{isRotating ? "⏸ PAUSE ROTATION" : "▶ RESUME ROTATION"}</span>
        </button>
      </div>

      {/* HUD Bottom Legend */}
      <div className="absolute bottom-3 left-3 z-10 hidden md:flex items-center gap-3 px-3 py-1.5 rounded-xl bg-surface/80 border border-border/40 backdrop-blur-md text-[10px] text-muted">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red-500" />
          <span>KINETIC CONFLICT</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-yellow-400" />
          <span>GEOINT THERMAL</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-cyan-400" />
          <span>4D DEFENSE SATELLITE</span>
        </div>
      </div>

      {/* 3D WebGL Canvas Mount */}
      <div ref={containerRef} className="w-full flex-1 min-h-[460px] cursor-grab active:cursor-grabbing" />

      {/* Active Selected Signal Modal / Popup */}
      {selectedSignal && (
        <div className="absolute bottom-4 right-4 z-20 max-w-sm w-[90vw] p-3.5 rounded-xl bg-bg/95 border-2 border-accent shadow-2xl backdrop-blur-xl animate-fade-in text-xs">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-border/40">
            <span className="px-2 py-0.5 rounded bg-accent/20 text-accent font-bold text-[10px] uppercase">
              {selectedSignal.type} // {selectedSignal.country}
            </span>
            <button
              onClick={() => setSelectedSignal(null)}
              className="text-muted hover:text-red-400 font-bold px-1"
            >
              ✕
            </button>
          </div>
          <h4 className="font-bold text-fg text-sm leading-snug mb-1">{selectedSignal.title}</h4>
          <div className="text-[10px] text-muted space-y-0.5 mt-2 font-mono">
            <div>COORDINATES: {selectedSignal.lat.toFixed(2)}°N, {selectedSignal.lng.toFixed(2)}°E</div>
            <div>SOURCE: {selectedSignal.source}</div>
            <div>TIMESTAMP: {new Date(selectedSignal.ts).toUTCString()}</div>
          </div>
        </div>
      )}
    </div>
  );
}
