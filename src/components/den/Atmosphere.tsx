// Atmosphere.tsx — Dust near lights, rain with condensation, fire sparks, lightning
import { useRef, useMemo, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useDen } from "./DenContext";
import { useTimeOfDay } from "./useTimeOfDay";

export function DustParticles() {
  const ref = useRef<THREE.Points>(null);
  const N = 320;

  const { positions, sizes } = useMemo(() => {
    const pos = new Float32Array(N * 3);
    const sz = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      if (i < 60) {
        // Cluster near salt lamp
        pos[i * 3] = 0.3 + (Math.random() - 0.5) * 2;
        pos[i * 3 + 1] = 0.5 + Math.random() * 2;
        pos[i * 3 + 2] = -2.7 + (Math.random() - 0.5) * 2;
      } else if (i < 100) {
        // Cluster near window light
        pos[i * 3] = -3.5 + (Math.random() - 0.5) * 2;
        pos[i * 3 + 1] = 1.5 + Math.random() * 2.5;
        pos[i * 3 + 2] = -1.8 + (Math.random() - 0.5) * 2;
      } else {
        // General room scatter
        pos[i * 3] = (Math.random() - 0.5) * 9;
        pos[i * 3 + 1] = Math.random() * 5 + 0.3;
        pos[i * 3 + 2] = -5 + Math.random() * 10;
      }
      // Size variation: 0.012 to 0.04
      sz[i] = 0.012 + Math.random() * 0.028;
    }
    return { positions: pos, sizes: sz };
  }, []);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    const arr = ref.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < N; i++) {
      // Gentle upward drift with horizontal S-curve
      arr[i * 3 + 1] += 0.0006 + Math.sin(t * 0.3 + i) * 0.0003;
      arr[i * 3] += Math.sin(t * 0.15 + i * 0.5) * 0.0004;
      arr[i * 3 + 2] += Math.cos(t * 0.12 + i * 0.3) * 0.0002;
      if (arr[i * 3 + 1] > 5.5) {
        arr[i * 3 + 1] = 0.2;
        if (i < 60) {
          arr[i * 3] = 0.3 + (Math.random() - 0.5) * 2;
          arr[i * 3 + 2] = -2.7 + (Math.random() - 0.5) * 2;
        } else if (i < 100) {
          arr[i * 3] = -3.5 + (Math.random() - 0.5) * 2;
          arr[i * 3 + 2] = -1.8 + (Math.random() - 0.5) * 2;
        } else {
          arr[i * 3] = (Math.random() - 0.5) * 9;
          arr[i * 3 + 2] = -5 + Math.random() * 10;
        }
      }
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-size" args={[sizes, 1]} />
      </bufferGeometry>
      <pointsMaterial
        color="#f0d8a0"
        size={0.025}
        transparent
        opacity={0.4}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

export function RainOnWindow() {
  const { pomodoroActive } = useDen();
  const timeOfDay = useTimeOfDay();
  const isNight = timeOfDay === "night" || timeOfDay === "evening";
  const N = 120; // Increased base pool

  const dropsData = useMemo(
    () =>
      Array.from({ length: N }, () => ({
        y: Math.random() * 3.0 - 1.5,
        z: (Math.random() - 0.5) * 2.2 + 1,
        height: 0.03 + Math.random() * 0.05,
        speed: 0.018 + Math.random() * 0.015,
        opacity: 0.15 + Math.random() * 0.25,
        active: Math.random() > 0.5, // Initial active state
      })),
    [],
  );
  const meshRefs = useRef<THREE.Mesh[]>([]);

  useFrame(() => {
    // Rain is heavy at night, lighter in evening, off in morning unless pomodoro
    const targetActiveRatio = pomodoroActive
      ? 1.0
      : timeOfDay === "night"
        ? 0.8
        : timeOfDay === "evening"
          ? 0.4
          : 0;
    const activeCount = Math.floor(N * targetActiveRatio);

    dropsData.forEach((d, i) => {
      const m = meshRefs.current[i];
      if (!m) return;

      const isActiveDrop = i < activeCount;
      if (!isActiveDrop) {
        m.visible = false;
        return;
      }
      m.visible = true;

      const speedMult = pomodoroActive ? 1.5 : 1.0;
      d.y -= d.speed * speedMult;
      m.position.y = d.y + 3.8;
      m.position.z = d.z;
      if (d.y < -1.5) {
        d.y = 1.5;
        d.z = (Math.random() - 0.5) * 2.2 + 1;
      }
    });
  });

  return (
    <group>
      {dropsData.map((d, i) => (
        <mesh
          key={i}
          ref={(el) => {
            if (el) meshRefs.current[i] = el;
          }}
          position={[-6.88, d.y + 3.8, d.z]}
          rotation={[0, Math.PI / 2, 0]}
        >
          <boxGeometry args={[0.003, d.height, 0.001]} />
          <meshBasicMaterial color="#8090a8" transparent opacity={d.opacity} />
        </mesh>
      ))}
    </group>
  );
}

// Fire sparks — tiny upward-drifting orange particles near candle clusters
export function FireSparks() {
  const timeOfDay = useTimeOfDay();
  const ref = useRef<THREE.Points>(null);
  const N = 24;

  const positions = useMemo(() => {
    const a = new Float32Array(N * 3);
    // Spawn near candle cluster positions
    const sources: [number, number, number][] = [
      [-4, 2.5, -6.5],
      [3, 3.2, -6.5],
      [-6, 2.5, -4],
      [5, 1.5, 2],
    ];
    for (let i = 0; i < N; i++) {
      const src = sources[i % sources.length];
      a[i * 3] = src[0] + (Math.random() - 0.5) * 0.3;
      a[i * 3 + 1] = src[1] + Math.random() * 0.5;
      a[i * 3 + 2] = src[2] + (Math.random() - 0.5) * 0.3;
    }
    return a;
  }, []);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const isDay = timeOfDay === "morning" || timeOfDay === "afternoon";
    ref.current.visible = !isDay; // Embers only visible at night/evening
    if (isDay) return;

    const t = clock.getElapsedTime();
    const arr = ref.current.geometry.attributes.position.array as Float32Array;
    const sources: [number, number, number][] = [
      [-4, 2.5, -6.5],
      [3, 3.2, -6.5],
      [-6, 2.5, -4],
      [5, 1.5, 2],
    ];
    for (let i = 0; i < N; i++) {
      arr[i * 3 + 1] += 0.003 + Math.sin(t * 2 + i) * 0.001;
      arr[i * 3] += Math.sin(t * 1.5 + i * 0.8) * 0.001;
      // Reset when too high
      const src = sources[i % sources.length];
      if (arr[i * 3 + 1] > src[1] + 1.5) {
        arr[i * 3] = src[0] + (Math.random() - 0.5) * 0.3;
        arr[i * 3 + 1] = src[1];
        arr[i * 3 + 2] = src[2] + (Math.random() - 0.5) * 0.3;
      }
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color="#FF8030"
        size={0.012}
        transparent
        opacity={0.6}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// Lightning flash — brief white light pulse every 30-60s during rain
export function LightningFlash() {
  const timeOfDay = useTimeOfDay();
  const lightRef = useRef<THREE.DirectionalLight>(null);
  const nextFlashRef = useRef(30 + Math.random() * 30);

  useFrame(({ clock }) => {
    if (!lightRef.current) return;
    if (timeOfDay === "morning" || timeOfDay === "afternoon") return; // No lightning during day

    const t = clock.getElapsedTime();
    if (t > nextFlashRef.current) {
      // Brief flash
      const flashPhase = t - nextFlashRef.current;
      if (flashPhase < 0.1) {
        lightRef.current.intensity = 3.0;
      } else if (flashPhase < 0.15) {
        lightRef.current.intensity = 0;
      } else if (flashPhase < 0.2) {
        lightRef.current.intensity = 1.5; // second smaller flash
      } else if (flashPhase < 0.4) {
        lightRef.current.intensity = Math.max(0, 1.5 - (flashPhase - 0.2) * 7.5);
      } else {
        lightRef.current.intensity = 0;
        nextFlashRef.current = t + 30 + Math.random() * 30;
      }
    }
  });

  return <directionalLight ref={lightRef} position={[-8, 10, 5]} color="#E0E8FF" intensity={0} />;
}
