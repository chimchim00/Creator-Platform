import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { ViewportMode } from "../types";
import { RotateCw, ZoomIn, ZoomOut, Eye, Layers, Sparkles, Box } from "lucide-react";

interface ThreeViewportProps {
  modelType: "robot" | "plant_monitor" | "speaker" | "custom_device" | "wearable";
  mode: ViewportMode;
  onModeChange: (m: ViewportMode) => void;
  highlightedKey?: string;
  onSelectKey?: (key: string) => void;
}

export const ThreeViewport: React.FC<ThreeViewportProps> = ({
  modelType,
  mode,
  onModeChange,
  highlightedKey,
  onSelectKey,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [wireframe, setWireframe] = useState(false);
  const [explosionProgress, setExplosionProgress] = useState(mode === "exploded" ? 1 : 0);
  const [expression, setExpression] = useState<"smile" | "wink" | "curious" | "listening">("smile");

  // Keep references to Three.js objects
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const groupRef = useRef<THREE.Group | null>(null);
  const partsRef = useRef<Map<string, THREE.Object3D>>(new Map());
  const animFrameIdRef = useRef<number | null>(null);

  // Rotation & interaction state
  const isDraggingRef = useRef(false);
  const prevMousePosRef = useRef({ x: 0, y: 0 });
  const rotationRef = useRef({ x: 0.2, y: -0.4 });
  const targetRotationRef = useRef({ x: 0.2, y: -0.4 });
  const zoomRef = useRef(3.5);
  const targetZoomRef = useRef(3.5);

  // Synchronize explosion slider when mode changes
  useEffect(() => {
    if (mode === "exploded") {
      setExplosionProgress(1);
    } else {
      setExplosionProgress(0);
    }
  }, [mode]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // SCENE
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // CAMERA
    const width = container.clientWidth || 400;
    const height = container.clientHeight || 350;
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0.8, zoomRef.current);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // RENDERER
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    container.replaceChildren(renderer.domElement);

    // LIGHTS
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
    keyLight.position.set(4, 8, 5);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x818cf8, 1.0);
    fillLight.position.set(-5, -2, -3);
    scene.add(fillLight);

    const pointGlow = new THREE.PointLight(0x38bdf8, 2, 4);
    pointGlow.position.set(0, 0.2, 1.2);
    scene.add(pointGlow);

    // ROOT MODEL GROUP
    const mainGroup = new THREE.Group();
    scene.add(mainGroup);
    groupRef.current = mainGroup;

    // Build Model geometry based on modelType
    partsRef.current.clear();
    build3DModel(mainGroup, modelType, partsRef.current);

    // ANIMATION LOOP
    let clock = new THREE.Clock();
    const animate = () => {
      animFrameIdRef.current = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Smooth rotation interpolation
      rotationRef.current.x += (targetRotationRef.current.x - rotationRef.current.x) * 0.08;
      rotationRef.current.y += (targetRotationRef.current.y - rotationRef.current.y) * 0.08;
      zoomRef.current += (targetZoomRef.current - zoomRef.current) * 0.08;

      if (cameraRef.current) {
        cameraRef.current.position.z = zoomRef.current;
      }

      if (mainGroup) {
        // Continuous auto-orbit when not dragging and in appearance mode
        if (!isDraggingRef.current && mode === "appearance") {
          targetRotationRef.current.y += 0.003;
        }

        // Apply rotation
        mainGroup.rotation.x = rotationRef.current.x;
        mainGroup.rotation.y = rotationRef.current.y;

        // Dynamic Demo animation
        if (mode === "demo") {
          // Floating bobbing effect
          mainGroup.position.y = Math.sin(elapsedTime * 2) * 0.05;

          // Head tilt
          const head = partsRef.current.get("head");
          if (head) {
            head.rotation.z = Math.sin(elapsedTime * 1.5) * 0.08;
            head.rotation.y = Math.cos(elapsedTime * 1.2) * 0.08;
          }

          // Arm animation if robot has arms
          const armL = partsRef.current.get("arm_left");
          const armR = partsRef.current.get("arm_right");
          if (armL) armL.rotation.x = Math.sin(elapsedTime * 4) * 0.4;
          if (armR) armR.rotation.x = -Math.sin(elapsedTime * 4) * 0.4;

          // Pulse point light
          pointGlow.intensity = 1.5 + Math.sin(elapsedTime * 4) * 0.8;
        } else {
          mainGroup.position.y = 0;
          const head = partsRef.current.get("head");
          if (head) {
            head.rotation.z = 0;
            head.rotation.y = 0;
          }
        }

        // Handle Exploded view offsets
        applyExplodedOffsets(partsRef.current, explosionProgress, modelType);
      }

      renderer.render(scene, camera);
    };
    animate();

    // RESIZE OBSERVER
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: newW, height: newH } = entry.contentRect;
        if (newW > 0 && newH > 0 && cameraRef.current && rendererRef.current) {
          cameraRef.current.aspect = newW / newH;
          cameraRef.current.updateProjectionMatrix();
          rendererRef.current.setSize(newW, newH);
        }
      }
    });
    resizeObserver.observe(container);

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
      resizeObserver.disconnect();
      renderer.dispose();
    };
  }, [modelType]);

  // Update wireframe mode
  useEffect(() => {
    partsRef.current.forEach((obj) => {
      obj.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => (m.wireframe = wireframe));
          } else {
            child.material.wireframe = wireframe;
          }
        }
      });
    });
  }, [wireframe]);

  // Update Highlighted part
  useEffect(() => {
    partsRef.current.forEach((obj, key) => {
      const isHighlighted = highlightedKey && key === highlightedKey;
      obj.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material && !child.userData.isScreenCanvas) {
          const mat = child.material as THREE.MeshStandardMaterial;
          if (isHighlighted) {
            mat.emissive = new THREE.Color(0x4f46e5);
            mat.emissiveIntensity = 0.6;
          } else {
            mat.emissive = new THREE.Color(0x000000);
            mat.emissiveIntensity = 0;
          }
        }
      });
    });
  }, [highlightedKey]);

  // Handle pointer interactions
  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    prevMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const deltaX = e.clientX - prevMousePosRef.current.x;
    const deltaY = e.clientY - prevMousePosRef.current.y;

    targetRotationRef.current.y += deltaX * 0.008;
    targetRotationRef.current.x = Math.max(
      -Math.PI / 3,
      Math.min(Math.PI / 3, targetRotationRef.current.x + deltaY * 0.008)
    );

    prevMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    targetZoomRef.current = Math.max(2.0, Math.min(5.5, targetZoomRef.current + e.deltaY * 0.003));
  };

  const resetCamera = () => {
    targetRotationRef.current = { x: 0.2, y: -0.4 };
    targetZoomRef.current = 3.5;
  };

  return (
    <div className="relative w-full h-full flex flex-col justify-between select-none">
      {/* TOP VIEW TOGGLE BAR */}
      <div className="flex items-center justify-between z-10 px-4 pt-3">
        <div className="bg-white/90 backdrop-blur-md rounded-full p-1 border border-slate-200 shadow-sm flex space-x-1">
          <button
            id="btn-view-appearance"
            onClick={() => onModeChange("appearance")}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-full transition flex items-center space-x-1.5 ${
              mode === "appearance"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>产品外观</span>
          </button>
          <button
            id="btn-view-exploded"
            onClick={() => onModeChange("exploded")}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-full transition flex items-center space-x-1.5 ${
              mode === "exploded"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>爆炸结构</span>
          </button>
          <button
            id="btn-view-demo"
            onClick={() => onModeChange("demo")}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-full transition flex items-center space-x-1.5 ${
              mode === "demo"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>动态 Demo</span>
          </button>
        </div>

        {/* RIGHT QUICK CONTROLS */}
        <div className="flex items-center space-x-1 bg-white/90 backdrop-blur-md rounded-xl p-1 border border-slate-200 shadow-sm text-slate-600">
          <button
            onClick={() => setWireframe(!wireframe)}
            title="线框/实体切换"
            className={`p-1.5 rounded-lg transition ${wireframe ? "bg-indigo-100 text-indigo-600" : "hover:bg-slate-100"}`}
          >
            <Box className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => (targetZoomRef.current = Math.max(2.0, targetZoomRef.current - 0.4))}
            title="放大"
            className="p-1.5 hover:bg-slate-100 rounded-lg transition"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => (targetZoomRef.current = Math.min(5.5, targetZoomRef.current + 0.4))}
            title="缩小"
            className="p-1.5 hover:bg-slate-100 rounded-lg transition"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={resetCamera}
            title="复位视角"
            className="p-1.5 hover:bg-slate-100 rounded-lg transition"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* EXPLODED SLIDER (visible when exploded mode) */}
      {mode === "exploded" && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 bg-white/95 backdrop-blur-md px-4 py-2 rounded-full border border-slate-200 shadow-lg flex items-center space-x-3 text-xs text-slate-700">
          <span className="font-semibold text-indigo-600">爆炸分离程度:</span>
          <input
            type="range"
            min="0"
            max="1.5"
            step="0.05"
            value={explosionProgress}
            onChange={(e) => setExplosionProgress(parseFloat(e.target.value))}
            className="w-32 accent-indigo-600 cursor-pointer"
          />
          <span className="font-mono text-slate-500 w-8">{Math.round(explosionProgress * 100)}%</span>
        </div>
      )}

      {/* DEMO EXPRESSION SWITCHER (visible when demo mode) */}
      {mode === "demo" && modelType === "robot" && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-200 shadow-lg flex items-center space-x-2 text-xs">
          <span className="text-slate-500 font-medium">表情互动:</span>
          {(["smile", "wink", "curious", "listening"] as const).map((exp) => (
            <button
              key={exp}
              onClick={() => setExpression(exp)}
              className={`px-2.5 py-1 rounded-full font-medium transition ${
                expression === exp ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {exp === "smile" ? "微笑眨眼" : exp === "wink" ? "俏皮单眼" : exp === "curious" ? "好奇注视" : "倾听对话"}
            </button>
          ))}
        </div>
      )}

      {/* 3D CANVAS CONTAINER */}
      <div
        ref={mountRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onWheel={handleWheel}
        className="flex-1 w-full h-full min-h-[300px] cursor-grab active:cursor-grabbing relative overflow-hidden"
      />

      {/* BOTTOM FOOTER TIP */}
      <div className="px-4 pb-3 flex items-center justify-between text-[11px] text-slate-400 z-10 pointer-events-none">
        <span className="bg-white/80 backdrop-blur px-2.5 py-1 rounded-md border border-slate-100 shadow-xs">
          按住左键旋转 3D 视角 | 滚轮缩放 | 点击 BOM 清单可联动高亮
        </span>
        {highlightedKey && (
          <span className="bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-md border border-indigo-100 font-medium">
            当前高亮组件: {highlightedKey}
          </span>
        )}
      </div>
    </div>
  );
};

// ==================== 3D GEOMETRY BUILDERS ====================

function build3DModel(
  group: THREE.Group,
  modelType: string,
  partsMap: Map<string, THREE.Object3D>
) {
  // Material presets
  const whiteShellMat = new THREE.MeshStandardMaterial({
    color: 0xf3f4f6,
    roughness: 0.25,
    metalness: 0.1,
  });
  const darkScreenMat = new THREE.MeshStandardMaterial({
    color: 0x09090b,
    roughness: 0.1,
    metalness: 0.8,
  });
  const blueGlowMat = new THREE.MeshBasicMaterial({ color: 0x22d3ee });
  const pcbMat = new THREE.MeshStandardMaterial({
    color: 0x065f46,
    roughness: 0.4,
    metalness: 0.3,
  });
  const goldProbeMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    roughness: 0.2,
    metalness: 0.9,
  });
  const batteryMat = new THREE.MeshStandardMaterial({
    color: 0x3b82f6,
    roughness: 0.3,
    metalness: 0.5,
  });
  const metalSpeakerMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.3,
    metalness: 0.8,
  });

  if (modelType === "plant_monitor") {
    // Top Water Drop Enclosure
    const topHousing = new THREE.Group();
    topHousing.name = "head";
    const capsuleGeom = new THREE.CylinderGeometry(0.32, 0.35, 1.2, 32);
    const capsuleMesh = new THREE.Mesh(capsuleGeom, whiteShellMat);
    capsuleMesh.position.y = 0.6;
    topHousing.add(capsuleMesh);

    // Light Sensor Window
    const lensGeom = new THREE.SphereGeometry(0.12, 16, 16);
    const lensMat = new THREE.MeshStandardMaterial({ color: 0x60a5fa, roughness: 0.1, transparent: true, opacity: 0.8 });
    const lensMesh = new THREE.Mesh(lensGeom, lensMat);
    lensMesh.position.set(0, 1.2, 0.15);
    topHousing.add(lensMesh);

    partsMap.set("head", topHousing);
    group.add(topHousing);

    // Middle Electronics & Battery Chamber
    const baseGroup = new THREE.Group();
    baseGroup.name = "base";
    const batteryGeom = new THREE.CylinderGeometry(0.2, 0.2, 0.7, 16);
    const batteryMesh = new THREE.Mesh(batteryGeom, batteryMat);
    batteryMesh.position.set(0, 0.2, 0);
    baseGroup.add(batteryMesh);
    partsMap.set("battery", batteryMesh);

    partsMap.set("base", baseGroup);
    group.add(baseGroup);

    // Lower Soil Probes
    const sensorGroup = new THREE.Group();
    sensorGroup.name = "sensor";

    const probeLGeom = new THREE.BoxGeometry(0.08, 1.2, 0.03);
    const probeL = new THREE.Mesh(probeLGeom, goldProbeMat);
    probeL.position.set(-0.16, -0.7, 0);

    const probeRGeom = new THREE.BoxGeometry(0.08, 1.2, 0.03);
    const probeR = new THREE.Mesh(probeRGeom, goldProbeMat);
    probeR.position.set(0.16, -0.7, 0);

    sensorGroup.add(probeL);
    sensorGroup.add(probeR);
    partsMap.set("sensor", sensorGroup);
    group.add(sensorGroup);

    return;
  }

  if (modelType === "speaker") {
    // Cylindrical Acoustic Body
    const speakerBody = new THREE.Group();
    speakerBody.name = "speaker";

    const cylinderGeom = new THREE.CylinderGeometry(0.7, 0.75, 1.5, 32);
    const cylinderMesh = new THREE.Mesh(cylinderGeom, metalSpeakerMat);
    speakerBody.add(cylinderMesh);

    // Top Light Ring
    const ringGeom = new THREE.TorusGeometry(0.65, 0.06, 16, 32);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const ringMesh = new THREE.Mesh(ringGeom, ringMat);
    ringMesh.rotation.x = Math.PI / 2;
    ringMesh.position.y = 0.76;
    speakerBody.add(ringMesh);
    partsMap.set("head", ringMesh);

    // Internal Driver Cone
    const coneGeom = new THREE.ConeGeometry(0.45, 0.3, 24);
    const coneMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5 });
    const coneMesh = new THREE.Mesh(coneGeom, coneMat);
    coneMesh.position.set(0, 0.2, 0.4);
    coneMesh.rotation.x = Math.PI / 2;
    speakerBody.add(coneMesh);

    partsMap.set("speaker", speakerBody);
    group.add(speakerBody);

    // Bottom Base & Battery
    const baseGroup = new THREE.Group();
    baseGroup.name = "base";
    const baseGeom = new THREE.CylinderGeometry(0.75, 0.8, 0.3, 32);
    const baseMesh = new THREE.Mesh(baseGeom, whiteShellMat);
    baseMesh.position.y = -0.9;
    baseGroup.add(baseMesh);
    partsMap.set("base", baseGroup);
    group.add(baseGroup);

    return;
  }

  // DEFAULT: COMPANION ROBOT (Cute modern rounded head with screen, camera, ears, speaker, base)
  const headGroup = new THREE.Group();
  headGroup.name = "head";

  // Rounded Head Enclosure
  const headGeom = new THREE.BoxGeometry(1.2, 1.0, 0.95);
  // Soft chamfer appearance
  const headMesh = new THREE.Mesh(headGeom, whiteShellMat);
  headMesh.position.y = 0.35;
  headGroup.add(headMesh);

  // Black OLED Front Face
  const screenGeom = new THREE.BoxGeometry(0.96, 0.72, 0.05);
  const screenMesh = new THREE.Mesh(screenGeom, darkScreenMat);
  screenMesh.position.set(0, 0.35, 0.49);
  headGroup.add(screenMesh);
  partsMap.set("screen", screenMesh);

  // Glowing Eyes
  const eyeLGeom = new THREE.CylinderGeometry(0.08, 0.08, 0.02, 16);
  const eyeL = new THREE.Mesh(eyeLGeom, blueGlowMat);
  eyeL.rotation.x = Math.PI / 2;
  eyeL.position.set(-0.25, 0.38, 0.52);

  const eyeRGeom = new THREE.CylinderGeometry(0.08, 0.08, 0.02, 16);
  const eyeR = new THREE.Mesh(eyeRGeom, blueGlowMat);
  eyeR.rotation.x = Math.PI / 2;
  eyeR.position.set(0.25, 0.38, 0.52);

  headGroup.add(eyeL);
  headGroup.add(eyeR);

  // Camera Aperture Dot above Screen
  const camGeom = new THREE.CylinderGeometry(0.04, 0.04, 0.02, 16);
  const camMat = new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.9, roughness: 0.1 });
  const camMesh = new THREE.Mesh(camGeom, camMat);
  camMesh.rotation.x = Math.PI / 2;
  camMesh.position.set(0, 0.65, 0.5);
  headGroup.add(camMesh);
  partsMap.set("camera", camMesh);

  // Ears / Microphones on sides
  const earL = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.06, 16), metalSpeakerMat);
  earL.rotation.z = Math.PI / 2;
  earL.position.set(-0.62, 0.35, 0);
  const earR = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.06, 16), metalSpeakerMat);
  earR.rotation.z = Math.PI / 2;
  earR.position.set(0.62, 0.35, 0);
  headGroup.add(earL);
  headGroup.add(earR);

  partsMap.set("head", headGroup);
  group.add(headGroup);

  // Speaker Back Mesh
  const speakerGroup = new THREE.Group();
  speakerGroup.name = "speaker";
  const speakerGeom = new THREE.CylinderGeometry(0.28, 0.28, 0.05, 24);
  const speakerMesh = new THREE.Mesh(speakerGeom, metalSpeakerMat);
  speakerMesh.rotation.x = Math.PI / 2;
  speakerMesh.position.set(0, 0.35, -0.49);
  speakerGroup.add(speakerMesh);
  partsMap.set("speaker", speakerGroup);
  group.add(speakerGroup);

  // Internal PCB Board
  const pcbGeom = new THREE.BoxGeometry(0.85, 0.6, 0.03);
  const pcbMesh = new THREE.Mesh(pcbGeom, pcbMat);
  pcbMesh.position.set(0, 0.35, 0.0);
  partsMap.set("pcb", pcbMesh);
  headGroup.add(pcbMesh);

  // Base Body (Bottom Platform)
  const baseGroup = new THREE.Group();
  baseGroup.name = "base";
  const baseGeom = new THREE.CylinderGeometry(0.68, 0.78, 0.45, 32);
  const baseMesh = new THREE.Mesh(baseGeom, whiteShellMat);
  baseMesh.position.y = -0.4;
  baseGroup.add(baseMesh);

  // Battery Inside Base
  const batteryGeom = new THREE.BoxGeometry(0.6, 0.22, 0.4);
  const batteryMesh = new THREE.Mesh(batteryGeom, batteryMat);
  batteryMesh.position.set(0, -0.4, 0);
  baseGroup.add(batteryMesh);
  partsMap.set("battery", batteryMesh);

  partsMap.set("base", baseGroup);
  group.add(baseGroup);

  // Optional Arms (for gesture expression)
  const armLGroup = new THREE.Group();
  armLGroup.position.set(-0.75, -0.25, 0);
  const armLGeom = new THREE.CapsuleGeometry(0.09, 0.4, 8, 16);
  const armL = new THREE.Mesh(armLGeom, whiteShellMat);
  armL.rotation.z = Math.PI / 6;
  armLGroup.add(armL);
  partsMap.set("arm_left", armLGroup);
  group.add(armLGroup);

  const armRGroup = new THREE.Group();
  armRGroup.position.set(0.75, -0.25, 0);
  const armRGeom = new THREE.CapsuleGeometry(0.09, 0.4, 8, 16);
  const armR = new THREE.Mesh(armRGeom, whiteShellMat);
  armR.rotation.z = -Math.PI / 6;
  armRGroup.add(armR);
  partsMap.set("arm_right", armRGroup);
  group.add(armRGroup);
}

function applyExplodedOffsets(
  partsMap: Map<string, THREE.Object3D>,
  factor: number,
  modelType: string
) {
  if (modelType === "plant_monitor") {
    const head = partsMap.get("head");
    const base = partsMap.get("base");
    const sensor = partsMap.get("sensor");

    if (head) head.position.y = factor * 0.7;
    if (base) base.position.y = 0;
    if (sensor) sensor.position.y = -factor * 0.7;
    return;
  }

  if (modelType === "speaker") {
    const head = partsMap.get("head");
    const speaker = partsMap.get("speaker");
    const base = partsMap.get("base");

    if (head) head.position.y = 0.76 + factor * 0.6;
    if (speaker) speaker.position.y = factor * 0.2;
    if (base) base.position.y = -0.9 - factor * 0.6;
    return;
  }

  // ROBOT EXPLOSION
  const head = partsMap.get("head");
  const screen = partsMap.get("screen");
  const speaker = partsMap.get("speaker");
  const base = partsMap.get("base");
  const armL = partsMap.get("arm_left");
  const armR = partsMap.get("arm_right");

  if (head) head.position.y = factor * 0.5;
  if (screen) screen.position.z = 0.49 + factor * 0.5;
  if (speaker) speaker.position.z = -factor * 0.6;
  if (base) base.position.y = -factor * 0.5;
  if (armL) armL.position.x = -0.75 - factor * 0.4;
  if (armR) armR.position.x = 0.75 + factor * 0.4;
}
