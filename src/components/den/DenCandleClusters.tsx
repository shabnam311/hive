// DenCandleClusters.tsx — Fewer candle clusters, placed for cozy den
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

function CandleCluster({ pos }: { pos: [number, number, number] }) {
  const lRef = useRef<THREE.PointLight>(null);
  const flameRefs = useRef<THREE.Mesh[]>([]);

  useFrame(({ clock }) => {
    if (!lRef.current) return;
    const t = clock.getElapsedTime();
    lRef.current.intensity =
      0.9 +
      Math.sin(t * 7.2 + pos[0]) * 0.12 +
      Math.sin(t * 13.1 + pos[2]) * 0.05 +
      (Math.random() - 0.5) * 0.03;
    flameRefs.current.forEach((f, i) => {
      if (!f) return;
      const s = 0.85 + Math.sin(t * 10 + i * 2 + pos[0]) * 0.2;
      f.scale.set(s, s * (1.1 + Math.sin(t * 14 + i) * 0.2), s);
      f.rotation.z = Math.sin(t * 8 + i * 1.3) * 0.15;
    });
  });

  return (
    <group position={pos}>
      {[-0.07, 0, 0.07].map((dx, i) => (
        <group key={i} position={[dx, 0, 0]}>
          <mesh>
            <cylinderGeometry args={[0.025, 0.03, 0.12 + i * 0.04, 8]} />
            <meshStandardMaterial color="#f0e6c8" roughness={0.8} />
          </mesh>
          <mesh
            ref={(el) => {
              if (el) flameRefs.current[i] = el;
            }}
            position={[0, 0.09 + i * 0.02, 0]}
          >
            <coneGeometry args={[0.009, 0.025, 6]} />
            <meshStandardMaterial
              color="#FFCC40"
              emissive="#FF8800"
              emissiveIntensity={4}
              transparent
              opacity={0.85}
            />
          </mesh>
        </group>
      ))}
      <pointLight ref={lRef} color="#ff9040" intensity={0.9} distance={4} decay={2} />
    </group>
  );
}

// Cozy positions: on bookshelves + fireplace mantle area
const POSITIONS: [number, number, number][] = [
  [-4, 2.5, -6.5], // back shelf left
  [3, 3.2, -6.5], // back shelf right
  [-6, 2.5, -4], // left wall shelf
  [5, 1.5, 2], // right side ambient
];

export function DenCandleClusters() {
  return (
    <group>
      {POSITIONS.map((pos, i) => (
        <CandleCluster key={i} pos={pos} />
      ))}
    </group>
  );
}
