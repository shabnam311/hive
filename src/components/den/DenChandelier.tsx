// DenChandelier.tsx — Brass chandelier with flickering candle tips
// Ported from Library's proven Chandelier component
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export function DenChandelier({ pos }: { pos: [number, number, number] }) {
  const lRef = useRef<THREE.PointLight>(null);
  const flameRefs = useRef<THREE.Mesh[]>([]);

  useFrame(({ clock }) => {
    if (!lRef.current) return;
    const t = clock.getElapsedTime();
    lRef.current.intensity =
      3.2 + Math.sin(t * 6.1) * 0.18 + Math.sin(t * 11.3) * 0.08 + (Math.random() - 0.5) * 0.04;
    // Animate all 8 flame meshes
    flameRefs.current.forEach((f, i) => {
      if (!f) return;
      const s = 0.9 + Math.sin(t * 9 + i * 1.2) * 0.2;
      f.scale.set(s, s * (1 + Math.sin(t * 12 + i) * 0.25), s);
      f.rotation.z = Math.sin(t * 7 + i * 1.5) * 0.2;
    });
  });

  return (
    <group position={pos}>
      {/* Chain from ceiling */}
      <mesh position={[0, 0.8, 0]}>
        <cylinderGeometry args={[0.016, 0.016, 1.5, 6]} />
        <meshStandardMaterial color="#3a2a14" roughness={0.8} />
      </mesh>

      {/* Main brass ring */}
      <mesh>
        <torusGeometry args={[1.1, 0.06, 8, 28]} />
        <meshStandardMaterial
          color="#8b6914"
          emissive="#6b5010"
          emissiveIntensity={0.4}
          metalness={0.7}
          roughness={0.35}
        />
      </mesh>

      {/* Inner ring */}
      <mesh>
        <torusGeometry args={[0.5, 0.04, 8, 20]} />
        <meshStandardMaterial color="#8b6914" metalness={0.7} roughness={0.35} />
      </mesh>

      {/* 8 candle tips around the outer ring */}
      {Array.from({ length: 8 }).map((_, i) => {
        const a = (i / 8) * Math.PI * 2;
        return (
          <group key={i} position={[Math.cos(a) * 1.1, 0, Math.sin(a) * 1.1]}>
            {/* Arm down from ring */}
            <mesh position={[0, -0.06, 0]}>
              <cylinderGeometry args={[0.012, 0.012, 0.12, 6]} />
              <meshStandardMaterial color="#8b6914" metalness={0.6} roughness={0.4} />
            </mesh>
            {/* Candle body */}
            <mesh position={[0, 0.08, 0]}>
              <cylinderGeometry args={[0.026, 0.026, 0.16, 6]} />
              <meshStandardMaterial color="#f0e8c8" roughness={0.8} />
            </mesh>
            {/* Flame — animated cone */}
            <mesh
              ref={(el) => {
                if (el) flameRefs.current[i] = el;
              }}
              position={[0, 0.18, 0]}
            >
              <coneGeometry args={[0.012, 0.03, 6]} />
              <meshStandardMaterial
                color="#FFCC40"
                emissive="#FF8800"
                emissiveIntensity={4}
                transparent
                opacity={0.85}
              />
            </mesh>
          </group>
        );
      })}

      {/* Decorative pendants hanging below */}
      {Array.from({ length: 8 }).map((_, i) => {
        const a = (i / 8) * Math.PI * 2 + 0.4;
        return (
          <mesh key={`p-${i}`} position={[Math.cos(a) * 1.1, -0.14, Math.sin(a) * 1.1]}>
            <sphereGeometry args={[0.035, 6, 6]} />
            <meshStandardMaterial color="#8b6914" metalness={0.8} roughness={0.2} />
          </mesh>
        );
      })}

      {/* Main chandelier light */}
      <pointLight ref={lRef} color="#ffb860" intensity={3.2} distance={22} decay={1.6} />
    </group>
  );
}
