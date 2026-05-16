// DenBed.tsx — Bed tucked into BACK-LEFT corner (against left wall + back wall)
// Position: x ≈ -4.5 (near left wall), z ≈ -5 (near back wall)
// Colors: teal duvet, rust throw, cream pillows, golden star pillow
import * as THREE from "three";
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { getDenTextures } from "./ProceduralTextures";

function StarPillow({ pos }: { pos: [number, number, number] }) {
  return (
    <group position={pos}>
      <mesh scale={[0.22, 0.06, 0.22]}>
        <dodecahedronGeometry args={[1, 0]} />
        <meshStandardMaterial
          color="#E8B820"
          emissive="#E8B820"
          emissiveIntensity={0.4}
          roughness={0.85}
        />
      </mesh>
    </group>
  );
}

function Plushie({
  pos,
  color,
  size = 0.11,
  rotation = [0, 0, 0],
}: {
  pos: [number, number, number];
  color: string;
  size?: number;
  rotation?: [number, number, number];
}) {
  return (
    <group position={pos} rotation={rotation}>
      {/* Body */}
      <mesh scale={[1, 0.82, 0.88]}>
        <sphereGeometry args={[size, 12, 10]} />
        <meshStandardMaterial color={color} roughness={0.95} />
      </mesh>
      {/* Head */}
      <mesh position={[0, size * 0.78, 0]}>
        <sphereGeometry args={[size * 0.68, 12, 10]} />
        <meshStandardMaterial color={color} roughness={0.95} />
      </mesh>
      {/* Ears */}
      <mesh position={[-size * 0.28, size * 1.12, 0]}>
        <sphereGeometry args={[size * 0.24, 8, 6]} />
        <meshStandardMaterial color={color} roughness={0.95} />
      </mesh>
      <mesh position={[size * 0.28, size * 1.12, 0]}>
        <sphereGeometry args={[size * 0.24, 8, 6]} />
        <meshStandardMaterial color={color} roughness={0.95} />
      </mesh>
      {/* Inner ears */}
      <mesh position={[-size * 0.28, size * 1.12, size * 0.1]}>
        <sphereGeometry args={[size * 0.12, 6, 6]} />
        <meshStandardMaterial color="#E8B0A0" roughness={0.95} />
      </mesh>
      <mesh position={[size * 0.28, size * 1.12, size * 0.1]}>
        <sphereGeometry args={[size * 0.12, 6, 6]} />
        <meshStandardMaterial color="#E8B0A0" roughness={0.95} />
      </mesh>
      {/* Eyes */}
      <mesh position={[-size * 0.18, size * 0.86, size * 0.58]}>
        <sphereGeometry args={[0.014, 6, 6]} />
        <meshBasicMaterial color="#1A0808" />
      </mesh>
      <mesh position={[size * 0.18, size * 0.86, size * 0.58]}>
        <sphereGeometry args={[0.014, 6, 6]} />
        <meshBasicMaterial color="#1A0808" />
      </mesh>
      {/* Nose */}
      <mesh position={[0, size * 0.78, size * 0.62]}>
        <sphereGeometry args={[0.008, 5, 5]} />
        <meshBasicMaterial color="#8B4040" />
      </mesh>
    </group>
  );
}

export function DenBed() {
  const tex = getDenTextures();
  const plushie1 = useRef<THREE.Group>(null);
  const plushie2 = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (plushie1.current) plushie1.current.scale.y = 1 + Math.sin(t * 0.8) * 0.02;
    if (plushie2.current) plushie2.current.scale.y = 1 + Math.sin(t * 0.6 + 1.5) * 0.02;
  });

  // Back-left corner: left wall at x=-7, back wall at z=-8
  // Bed runs along left wall (x-axis), headboard against back wall
  return (
    <group position={[-2.5, 0, -2.8]}>
      {/* ═══ BED FRAME — dark walnut ═══ */}
      {/* Headboard — against back wall */}
      <mesh position={[0, 0.92, -1.7]} castShadow>
        <boxGeometry args={[2.4, 1.0, 0.1]} />
        <meshStandardMaterial
          map={tex.wood}
          normalMap={tex.normalWood}
          color="#2A1408"
          roughness={0.88}
        />
      </mesh>
      {/* Headboard inset panels */}
      <mesh position={[-0.55, 0.88, -1.645]}>
        <boxGeometry args={[0.72, 0.56, 0.02]} />
        <meshStandardMaterial color="#221005" roughness={0.9} />
      </mesh>
      <mesh position={[0.55, 0.88, -1.645]}>
        <boxGeometry args={[0.72, 0.56, 0.02]} />
        <meshStandardMaterial color="#221005" roughness={0.9} />
      </mesh>
      {/* Side rails */}
      <mesh position={[-1.12, 0.33, 0]}>
        <boxGeometry args={[0.06, 0.1, 3.4]} />
        <meshStandardMaterial color="#2A1408" roughness={0.88} />
      </mesh>
      <mesh position={[1.12, 0.33, 0]}>
        <boxGeometry args={[0.06, 0.1, 3.4]} />
        <meshStandardMaterial color="#2A1408" roughness={0.88} />
      </mesh>
      {/* Footboard — shorter */}
      <mesh position={[0, 0.27, 1.65]}>
        <boxGeometry args={[2.4, 0.38, 0.07]} />
        <meshStandardMaterial color="#2A1408" roughness={0.88} />
      </mesh>
      {/* Legs */}
      {[
        [-1.08, 0.14, -1.62],
        [1.08, 0.14, -1.62],
        [-1.08, 0.14, 1.62],
        [1.08, 0.14, 1.62],
      ].map((p, i) => (
        <mesh key={i} position={p as [number, number, number]}>
          <cylinderGeometry args={[0.035, 0.042, 0.28, 8]} />
          <meshStandardMaterial color="#2A1408" roughness={0.88} />
        </mesh>
      ))}

      {/* ═══ MATTRESS — cream ═══ */}
      <mesh position={[0, 0.42, 0]} castShadow>
        <boxGeometry args={[2.15, 0.22, 3.25]} />
        <meshStandardMaterial color="#C8BCA8" roughness={0.94} />
      </mesh>

      {/* ═══ FITTED SHEET — sage green showing at edges ═══ */}
      <mesh position={[0, 0.54, 0]}>
        <boxGeometry args={[2.12, 0.02, 3.22]} />
        <meshStandardMaterial color="#8A9E78" roughness={0.96} />
      </mesh>

      {/* ═══ MAIN DUVET — dusty teal, thick puffs ═══ */}
      <mesh position={[0.06, 0.59, 0.18]} castShadow>
        <boxGeometry args={[2.05, 0.13, 2.65]} />
        <meshStandardMaterial
          map={tex.fabric}
          normalMap={tex.normalFabric}
          color="#3A5A58"
          roughness={0.96}
        />
      </mesh>
      {/* Duvet stitching ridges */}
      {[-0.55, 0, 0.55].map((x, i) => (
        <mesh key={i} position={[x, 0.655, 0.18]}>
          <boxGeometry args={[0.48, 0.016, 2.65]} />
          <meshStandardMaterial color="#426060" roughness={0.95} />
        </mesh>
      ))}
      {/* Horizontal stitches */}
      {[-0.8, 0, 0.8].map((z, i) => (
        <mesh key={i} position={[0.06, 0.656, z]}>
          <boxGeometry args={[2.05, 0.012, 0.45]} />
          <meshStandardMaterial color="#426060" roughness={0.95} />
        </mesh>
      ))}
      {/* Turned-back fold at top */}
      <mesh position={[-0.1, 0.6, -0.88]} rotation={[-0.12, 0, 0]}>
        <boxGeometry args={[1.95, 0.06, 0.42]} />
        <meshStandardMaterial color="#4A6A68" roughness={0.94} />
      </mesh>

      {/* ═══ THROW BLANKET — rust orange, bunched corner ═══ */}
      <mesh position={[0.25, 0.66, 0.88]} rotation={[0.01, 0.1, 0.04]} castShadow>
        <boxGeometry args={[1.15, 0.055, 0.9]} />
        <meshStandardMaterial
          map={tex.throwBlanket}
          normalMap={tex.normalFabric}
          color="#C4501A"
          roughness={0.92}
        />
      </mesh>
      {/* Bunched left corner */}
      <mesh position={[-0.38, 0.645, 1.18]} rotation={[0.3, 0.15, -0.3]}>
        <boxGeometry args={[0.3, 0.04, 0.35]} />
        <meshStandardMaterial color="#C4501A" roughness={0.92} />
      </mesh>
      {/* Hanging corner */}
      <mesh position={[-0.8, 0.52, 1.05]} rotation={[0.4, 0.1, -0.4]}>
        <boxGeometry args={[0.22, 0.03, 0.3]} />
        <meshStandardMaterial color="#B84818" roughness={0.92} />
      </mesh>

      {/* ═══ PILLOWS — two cream, slightly different angles ═══ */}
      <mesh position={[-0.42, 0.65, -1.28]} rotation={[-0.14, 0.02, 0]} castShadow>
        <boxGeometry args={[0.64, 0.13, 0.46]} />
        <meshStandardMaterial normalMap={tex.normalFabric} color="#EDD8BC" roughness={0.9} />
      </mesh>
      <mesh position={[0.42, 0.64, -1.26]} rotation={[-0.11, -0.03, 0.04]} castShadow>
        <boxGeometry args={[0.64, 0.11, 0.46]} />
        <meshStandardMaterial normalMap={tex.normalFabric} color="#E8D4B6" roughness={0.9} />
      </mesh>

      {/* ═══ STAR PILLOW ═══ */}
      <StarPillow pos={[0.05, 0.73, -0.72]} />

      {/* ═══ PLUSHIES on bed ═══ */}
      <group ref={plushie1}>
        <Plushie
          pos={[-0.55, 0.73, -1.02]}
          color="#6B3820"
          size={0.095}
          rotation={[0, -0.2, 0.1]}
        />
      </group>
      <group ref={plushie2}>
        <Plushie
          pos={[0.22, 0.74, -1.08]}
          color="#D4C0A0"
          size={0.075}
          rotation={[0, 0.15, -0.05]}
        />
      </group>

      {/* Open book face-down on duvet */}
      <mesh position={[-0.15, 0.64, 0.28]} rotation={[0, 0.25, 0]}>
        <boxGeometry args={[0.24, 0.016, 0.3]} />
        <meshStandardMaterial color="#F0E6D0" roughness={0.88} />
      </mesh>
      {/* Ribbon bookmark */}
      <mesh position={[-0.28, 0.64, 0.44]} rotation={[0.1, 0.25, 0]}>
        <boxGeometry args={[0.008, 0.012, 0.06]} />
        <meshStandardMaterial color="#A82828" roughness={0.8} />
      </mesh>

      {/* ═══ NIGHTSTAND — beside bed on right side ═══ */}
      <group position={[1.65, 0, -0.38]}>
        {/* Cabinet body */}
        <mesh position={[0, 0.33, 0]} castShadow>
          <boxGeometry args={[0.52, 0.66, 0.42]} />
          <meshStandardMaterial
            map={tex.wood}
            normalMap={tex.normalWood}
            color="#3A1E0C"
            roughness={0.86}
          />
        </mesh>
        {/* Top surface */}
        <mesh position={[0, 0.66, 0]}>
          <boxGeometry args={[0.54, 0.012, 0.44]} />
          <meshStandardMaterial color="#4A2A12" roughness={0.84} />
        </mesh>
        {/* Drawer */}
        <mesh position={[0, 0.22, 0.205]}>
          <boxGeometry args={[0.44, 0.11, 0.012]} />
          <meshStandardMaterial color="#2E1608" roughness={0.88} />
        </mesh>
        <mesh position={[0, 0.22, 0.215]}>
          <sphereGeometry args={[0.012, 8, 8]} />
          <meshStandardMaterial color="#8B7030" metalness={0.72} roughness={0.28} />
        </mesh>

        {/* ══ SALT LAMP ══ */}
        <group position={[-0.1, 0.68, 0]}>
          <mesh position={[0, 0.024, 0]}>
            <cylinderGeometry args={[0.068, 0.088, 0.034, 10]} />
            <meshStandardMaterial color="#3A2010" roughness={0.85} />
          </mesh>
          <mesh position={[0, 0.105, 0]} scale={[1, 0.86, 0.92]}>
            <dodecahedronGeometry args={[0.115, 1]} />
            <meshStandardMaterial
              color="#8B3A08"
              emissive="#FF7010"
              emissiveIntensity={4.5}
              transparent
              opacity={0.78}
              roughness={0.28}
            />
          </mesh>
        </group>

        {/* Candle */}
        <mesh position={[0.2, 0.675, 0.1]}>
          <cylinderGeometry args={[0.013, 0.016, 0.055, 8]} />
          <meshStandardMaterial color="#F2E8D0" roughness={0.8} />
        </mesh>

        {/* Book stack */}
        <group position={[0.18, 0.663, -0.1]}>
          {[0, 1, 2].map((i) => (
            <mesh key={i} position={[0, i * 0.022, 0]} rotation={[0, i * 0.08 - 0.06, 0]}>
              <boxGeometry args={[0.11 - i * 0.006, 0.02, 0.14 - i * 0.005]} />
              <meshStandardMaterial color={["#5A2020", "#1A3A20", "#1A204A"][i]} roughness={0.88} />
            </mesh>
          ))}
        </group>
      </group>
    </group>
  );
}
