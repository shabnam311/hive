// Plants.tsx — Cozy bedroom plants: large monstera corner, hanging pothos, succulents
// Plants are in corners and on surfaces — not floating in air
import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// ─── Vine with proper catenary droop ────────────────────────────────────────
function Vine({
  origin,
  length,
  leafCount,
  color = "#2E4A1A",
  swayOffset = 0,
}: {
  origin: [number, number, number];
  length: number;
  leafCount: number;
  color?: string;
  swayOffset?: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (groupRef.current) {
      const t = clock.getElapsedTime();
      groupRef.current.rotation.z = Math.sin(t * 0.4 + swayOffset) * 0.05;
      groupRef.current.rotation.x = Math.sin(t * 0.3 + swayOffset + 1) * 0.02;
    }
  });

  const pts = useMemo(() => {
    const arr: [number, number, number][] = [];
    for (let i = 0; i <= 10; i++) {
      const t = i / 10;
      arr.push([
        origin[0] + Math.sin(t * 2.5 + swayOffset) * 0.05,
        origin[1] - t * length,
        origin[2] + Math.cos(t * 2 + swayOffset) * 0.04,
      ]);
    }
    return arr;
  }, [origin, length, swayOffset]);

  return (
    <group ref={groupRef}>
      {pts.slice(0, -1).map((p, i) => {
        const n = pts[i + 1];
        const dir = new THREE.Vector3(n[0] - p[0], n[1] - p[1], n[2] - p[2]);
        const len = dir.length();
        const mid: [number, number, number] = [
          (p[0] + n[0]) / 2,
          (p[1] + n[1]) / 2,
          (p[2] + n[2]) / 2,
        ];
        const up = new THREE.Vector3(0, 1, 0);
        const q = new THREE.Quaternion().setFromUnitVectors(up, dir.normalize());
        return (
          <mesh key={i} position={mid} quaternion={q}>
            <cylinderGeometry args={[0.005, 0.007, len, 4]} />
            <meshStandardMaterial color="#1A2E0A" roughness={0.9} />
          </mesh>
        );
      })}
      {Array.from({ length: leafCount }, (_, i) => {
        const t = (i + 0.5) / leafCount;
        const idx = Math.min(Math.floor(t * pts.length), pts.length - 1);
        const p = pts[idx];
        const side = i % 2 === 0 ? 1 : -1;
        return (
          <mesh
            key={`l-${i}`}
            position={p}
            rotation={[0.4 * Math.cos(i), i * 1.1 + swayOffset, side * 0.5]}
          >
            <planeGeometry args={[0.07 + Math.random() * 0.04, 0.09 + Math.random() * 0.04]} />
            <meshStandardMaterial
              color={color}
              roughness={0.88}
              transparent
              opacity={0.92}
              side={THREE.DoubleSide}
            />
          </mesh>
        );
      })}
    </group>
  );
}

// ─── Large Floor Monstera — front-right corner ───────────────────────────────
function FloorMonstera({ pos }: { pos: [number, number, number] }) {
  return (
    <group position={pos}>
      {/* Large terracotta pot */}
      <mesh position={[0, 0.18, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.16, 0.36, 14]} />
        <meshStandardMaterial color="#8B4520" roughness={0.85} />
      </mesh>
      {/* Pot rim */}
      <mesh position={[0, 0.37, 0]}>
        <torusGeometry args={[0.21, 0.025, 6, 16]} />
        <meshStandardMaterial color="#7A3A18" roughness={0.82} />
      </mesh>
      {/* Soil */}
      <mesh position={[0, 0.35, 0]}>
        <cylinderGeometry args={[0.18, 0.18, 0.04, 14]} />
        <meshStandardMaterial color="#1A1008" roughness={0.98} />
      </mesh>
      {/* Main stems */}
      {[0, 1.2, 2.5, 3.8, 5.1].map((angle, i) => (
        <group key={i}>
          <mesh position={[Math.cos(angle) * 0.06, 0.38 + i * 0.12, Math.sin(angle) * 0.06]}>
            <cylinderGeometry args={[0.012, 0.016, 0.22, 6]} />
            <meshStandardMaterial color="#1A3010" roughness={0.9} />
          </mesh>
          {/* Large split leaf */}
          <mesh
            position={[
              Math.cos(angle) * (0.22 + i * 0.04),
              0.55 + i * 0.16,
              Math.sin(angle) * (0.22 + i * 0.04),
            ]}
            rotation={[0.3 - i * 0.05, angle, 0.25 * Math.sin(angle)]}
          >
            <planeGeometry args={[0.32 + i * 0.04, 0.26 + i * 0.03]} />
            <meshStandardMaterial
              color={i < 2 ? "#1E3A0E" : "#254A12"}
              roughness={0.86}
              transparent
              opacity={0.92}
              side={THREE.DoubleSide}
            />
          </mesh>
          {/* Leaf hole detail */}
          <mesh
            position={[
              Math.cos(angle) * (0.26 + i * 0.04),
              0.55 + i * 0.16,
              Math.sin(angle) * (0.26 + i * 0.04),
            ]}
            rotation={[0.3 - i * 0.05, angle, 0.25 * Math.sin(angle)]}
          >
            <planeGeometry args={[0.08, 0.1]} />
            <meshStandardMaterial
              color="#EDE0C8"
              roughness={1}
              transparent
              opacity={0.4}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ─── Hanging Pothos from ceiling bracket ────────────────────────────────────
function HangingPothos({ pos }: { pos: [number, number, number] }) {
  return (
    <group position={pos}>
      {/* Wall bracket */}
      <mesh position={[0, 0.06, -0.08]}>
        <boxGeometry args={[0.06, 0.12, 0.12]} />
        <meshStandardMaterial color="#2A1408" roughness={0.88} />
      </mesh>
      {/* Terracotta pot */}
      <mesh>
        <cylinderGeometry args={[0.1, 0.08, 0.12, 12]} />
        <meshStandardMaterial color="#8B4520" roughness={0.85} />
      </mesh>
      {/* Soil */}
      <mesh position={[0, 0.055, 0]}>
        <cylinderGeometry args={[0.09, 0.09, 0.015, 12]} />
        <meshStandardMaterial color="#1A1008" roughness={0.98} />
      </mesh>
      {/* Vines */}
      {[0, 1.05, 2.1, 3.15, 4.2, 5.25].map((angle, i) => (
        <Vine
          key={i}
          origin={[Math.cos(angle) * 0.07, -0.04, Math.sin(angle) * 0.07]}
          length={0.5 + (i % 3) * 0.35}
          leafCount={4 + (i % 2) * 2}
          color={i % 2 === 0 ? "#2E4A1A" : "#3A5820"}
          swayOffset={angle}
        />
      ))}
    </group>
  );
}

// ─── Succulent cluster on a surface ─────────────────────────────────────────
function SucculentCluster({ pos }: { pos: [number, number, number] }) {
  return (
    <group position={pos}>
      {[
        [-0.07, "#8B4520", "#2A5818"],
        [0.03, "#C0B090", "#3A6828"],
        [0.13, "#6A4A30", "#486830"],
      ].map(([dx, potCol, leafCol], i) => (
        <group key={i} position={[dx as number, 0, 0]}>
          {/* Pot */}
          <mesh position={[0, 0.032, 0]}>
            <cylinderGeometry args={[0.032, 0.026, 0.064, 10]} />
            <meshStandardMaterial color={potCol as string} roughness={0.85} />
          </mesh>
          {/* Rosette leaves */}
          {[0, 1, 2, 3, 4].map((j) => (
            <mesh
              key={j}
              position={[Math.cos(j * 1.26) * 0.022, 0.075, Math.sin(j * 1.26) * 0.022]}
              rotation={[-0.4, j * 1.26, 0]}
            >
              <planeGeometry args={[0.025, 0.04]} />
              <meshStandardMaterial
                color={leafCol as string}
                roughness={0.88}
                transparent
                opacity={0.95}
                side={THREE.DoubleSide}
              />
            </mesh>
          ))}
          {/* Center bud */}
          <mesh position={[0, 0.08, 0]} scale={[1, 0.7, 1]}>
            <sphereGeometry args={[0.016, 8, 8]} />
            <meshStandardMaterial color={leafCol as string} roughness={0.88} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ─── Small pot plant ────────────────────────────────────────────────────────
function PotPlant({ pos, color = "#2A4818" }: { pos: [number, number, number]; color?: string }) {
  return (
    <group position={pos}>
      <mesh position={[0, 0.07, 0]}>
        <cylinderGeometry args={[0.06, 0.05, 0.14, 10]} />
        <meshStandardMaterial color="#8B4520" roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.14, 0]}>
        <torusGeometry args={[0.063, 0.012, 5, 12]} />
        <meshStandardMaterial color="#7A3A18" roughness={0.82} />
      </mesh>
      {[0, 1.0, 2.1, 3.2, 4.3].map((a, i) => (
        <mesh
          key={i}
          position={[Math.cos(a) * 0.06, 0.18 + i * 0.04, Math.sin(a) * 0.06]}
          rotation={[-0.3, a, 0.2 * Math.sin(a)]}
        >
          <planeGeometry args={[0.1, 0.08]} />
          <meshStandardMaterial
            color={color}
            roughness={0.88}
            transparent
            opacity={0.9}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}

export function Plants() {
  return (
    <group>
      {/* Large monstera — front-right corner */}
      <FloorMonstera pos={[3.8, 0, 4.0]} />

      {/* Medium pot — left wall front corner */}
      <FloorMonstera pos={[-4.0, 0, 3.5]} />

      {/* Hanging pothos — from left wall near window */}
      <HangingPothos pos={[-4.3, 3.8, -2.0]} />
      {/* Hanging pothos — right side above desk */}
      <HangingPothos pos={[2.0, 4.2, 2.5]} />

      {/* Succulents on NOOK desk */}
      <SucculentCluster pos={[2.5, 0.92, 1.5]} />

      {/* Succulents on bookshelf */}
      <SucculentCluster pos={[3.8, 2.1, -1.5]} />

      {/* Small pot on nightstand */}
      <PotPlant pos={[-2.6, 0.66, -5.0]} color="#2A5818" />

      {/* Small pot on ECHO shelf */}
      <PotPlant pos={[-2.5, 1.55, 1.3]} color="#3A5820" />

      {/* Floor pot beside wardrobe */}
      <PotPlant pos={[1.8, 0, -3.5]} color="#2E4818" />
    </group>
  );
}
