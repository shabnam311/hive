// DenStudyTables.tsx — 3 study tables with green desk lamps and open books
// Ported from Library's proven StudyTables component
import * as THREE from "three";

export function DenStudyTables() {
  const positions: [number, number, number][] = [
    [-3.5, 0, -3.5],
    [0, 0, -5.0],
    [3.5, 0, -3.5],
  ];

  return (
    <group>
      {positions.map((p, ti) => (
        <group key={ti} position={p}>
          {/* Table top */}
          <mesh position={[0, 0.82, 0]} receiveShadow>
            <boxGeometry args={[3.6, 0.09, 1.1]} />
            <meshStandardMaterial color="#2a1505" roughness={0.75} />
          </mesh>

          {/* 4 Legs */}
          {(
            [
              [-1.7, 0.41, -0.45],
              [1.7, 0.41, -0.45],
              [-1.7, 0.41, 0.45],
              [1.7, 0.41, 0.45],
            ] as [number, number, number][]
          ).map((lp, li) => (
            <mesh key={li} position={lp}>
              <boxGeometry args={[0.08, 0.82, 0.08]} />
              <meshStandardMaterial color="#1a0e04" roughness={0.85} />
            </mesh>
          ))}

          {/* Green desk lamp */}
          <group position={[ti === 1 ? 0.8 : -0.8, 0.86, -0.2]}>
            {/* Base */}
            <mesh position={[0, 0.04, 0]}>
              <cylinderGeometry args={[0.1, 0.12, 0.04, 10]} />
              <meshStandardMaterial color="#8b6914" metalness={0.6} roughness={0.4} />
            </mesh>
            {/* Arm */}
            <mesh position={[0, 0.34, 0]}>
              <cylinderGeometry args={[0.016, 0.016, 0.55, 6]} />
              <meshStandardMaterial color="#8b6914" metalness={0.6} roughness={0.4} />
            </mesh>
            {/* Green shade */}
            <mesh position={[0.12, 0.62, 0]} rotation={[0, 0, -0.4]}>
              <coneGeometry args={[0.17, 0.22, 10, 1, true]} />
              <meshStandardMaterial
                color="#1a3a1a"
                emissive="#1a3a1a"
                emissiveIntensity={0.5}
                side={THREE.DoubleSide}
              />
            </mesh>
            {/* Lamp light */}
            <pointLight
              position={[0.18, 0.52, 0]}
              color="#ffe4a0"
              intensity={1.1}
              distance={2.5}
              decay={2}
            />
          </group>

          {/* Open book on table */}
          <mesh
            position={[ti === 1 ? -0.4 : 0.3, 0.875, 0.1]}
            rotation={[-Math.PI / 2, 0, (ti - 1) * 0.15]}
          >
            <planeGeometry args={[0.48, 0.38]} />
            <meshStandardMaterial color="#f0e4c0" roughness={0.95} side={THREE.DoubleSide} />
          </mesh>

          {/* Small candle on corner of table */}
          <group position={[ti === 1 ? -1.2 : 1.2, 0.87, 0.35]}>
            <mesh position={[0, 0.06, 0]}>
              <cylinderGeometry args={[0.024, 0.028, 0.12, 8]} />
              <meshStandardMaterial color="#f0e6c8" roughness={0.8} />
            </mesh>
            <mesh position={[0, 0.13, 0]}>
              <sphereGeometry args={[0.014, 6, 6]} />
              <meshBasicMaterial color="#ff8c00" />
            </mesh>
          </group>
        </group>
      ))}
    </group>
  );
}
