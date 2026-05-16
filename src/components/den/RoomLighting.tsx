// RoomLighting.tsx — Warm cozy lighting for 9×10 room
// Dimmer than harsh but bright enough to see everything.
// Key: golden directional from window. Fill: warm ambient. Accents: salt lamp, desk lamp, candles.
// Phase 2: 2048 shadows, animated flames, zone color temps, candle shadows
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useDen } from "./DenContext";
import { useTimeOfDay } from "./useTimeOfDay";

export function RoomLighting() {
  const { activeZone, pomodoroActive } = useDen();
  const timeOfDay = useTimeOfDay();
  const saltRef = useRef<THREE.PointLight>(null);
  const candleRefs = useRef<THREE.PointLight[]>([]);
  const flameRefs = useRef<THREE.Mesh[]>([]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    // Salt lamp pulse
    if (saltRef.current) {
      saltRef.current.intensity = 3.5 + Math.sin((t * Math.PI) / 2) * 0.5;
    }
    // Candle flicker — both light AND flame mesh sync
    candleRefs.current.forEach((c, i) => {
      if (!c) return;
      const flicker = 0.6 + Math.sin(t * 11 + i * 1.6) * 0.1 + (Math.random() - 0.5) * 0.03;
      c.intensity = flicker;
      // Sync flame mesh scale with light intensity
      const flame = flameRefs.current[i];
      if (flame) {
        const s = 0.8 + (flicker - 0.5) * 0.6;
        flame.scale.set(s, s * (1 + Math.sin(t * 13 + i) * 0.3), s);
        flame.rotation.z = Math.sin(t * 7 + i * 2) * 0.15;
      }
    });
  });

  // Zone-specific color temperature hints
  const echoTint = activeZone === "echo" ? 0.3 : 0;
  const nookTint = activeZone === "nook" ? 0.4 : 0;

  // Pomodoro focus dimming
  const ambientIntensity = pomodoroActive
    ? 0.15
    : timeOfDay === "morning" || timeOfDay === "afternoon"
      ? 0.5
      : 0.4;

  // Time of Day key lighting
  const isDay = timeOfDay === "morning" || timeOfDay === "afternoon";
  const keyColor = isDay ? "#FFF4E0" : "#FFE4A0";
  const keyIntensity = isDay ? 2.5 : 1.6;
  const moonIntensity = timeOfDay === "night" ? 0.4 : 0;
  const candleBase = isDay ? 0.2 : 0.6; // Candles low during day

  return (
    <>
      {/* AMBIENT — dims during pomodoro for focus */}
      <ambientLight color="#FFF0D8" intensity={ambientIntensity} />
      <hemisphereLight args={["#FFE8C0", "#8B5A30", isDay ? 0.4 : 0.25]} />

      {/* KEY — golden sun or pale daylight from window */}
      <directionalLight
        position={[-6, 8, -1]}
        intensity={keyIntensity}
        color={keyColor}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={0.5}
        shadow-camera-far={25}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
        shadow-bias={-0.0002}
      />

      {/* FILL — soft warm from front-right */}
      <directionalLight position={[5, 4, 6]} intensity={isDay ? 0.6 : 0.35} color="#FFC880" />

      {/* MOONLIGHT — only at night */}
      {moonIntensity > 0 && (
        <directionalLight
          position={[-8, 6, -2]}
          intensity={moonIntensity}
          color="#8090c0"
          castShadow
          shadow-mapSize={[1024, 1024]}
          shadow-camera-near={1}
          shadow-camera-far={20}
          shadow-camera-left={-4}
          shadow-camera-right={4}
          shadow-camera-top={4}
          shadow-camera-bottom={-4}
          shadow-bias={-0.001}
        />
      )}

      {/* SALT LAMP — warm orange pool on nightstand */}
      <pointLight
        ref={saltRef}
        position={[-0.85, 0.9, -3.2]}
        color="#FF8C20"
        intensity={3.5}
        distance={5}
        decay={1.8}
        castShadow
      />

      {/* ECHO mushroom lamp — slightly cooler when Echo active */}
      <pointLight
        position={[-2.5, 1.55, 1.0]}
        color={echoTint > 0 ? "#D080FF" : "#FF9040"}
        intensity={2.0 + echoTint}
        distance={3}
        decay={2}
      />

      {/* NOOK desk lamp — brightens when Nook active */}
      <spotLight
        position={[3.5, 1.9, 2.5]}
        angle={Math.PI / 5}
        penumbra={0.5}
        intensity={2.5 + nookTint * 2}
        color="#FFE890"
        distance={3.5}
        castShadow={activeZone === "nook"}
      />

      {/* CANDLES — flickering accent glows with animated flames */}
      {[
        [-2.8, 1.55, 1.2],
        [3.5, 2.1, -1.5],
        [2.5, 0.95, 2.2],
        [-2.6, 0.87, -5.0],
      ].map((pos, i) => (
        <group key={`c-${i}`}>
          {/* Candle body */}
          <mesh position={[pos[0], pos[1], pos[2]]}>
            <cylinderGeometry args={[0.013, 0.016, 0.055, 8]} />
            <meshStandardMaterial color="#F2E8D0" roughness={0.8} />
          </mesh>
          {/* Animated flame — cone instead of sphere */}
          <mesh
            ref={(el) => {
              if (el) flameRefs.current[i] = el;
            }}
            position={[pos[0], pos[1] + 0.04, pos[2]]}
          >
            <coneGeometry args={[0.008, 0.025, 6]} />
            <meshStandardMaterial
              color="#FFCC40"
              emissive="#FF8800"
              emissiveIntensity={4}
              transparent
              opacity={0.85}
            />
          </mesh>
          {/* Candle light — first 2 cast shadows for wall flicker */}
          <pointLight
            ref={(el) => {
              if (el) candleRefs.current[i] = el;
            }}
            position={[pos[0], pos[1] + 0.04, pos[2]]}
            color="#FF8030"
            intensity={candleBase}
            distance={1.5}
            decay={2}
            castShadow={i < 2}
            shadow-mapSize={[512, 512]}
          />
        </group>
      ))}
    </>
  );
}
