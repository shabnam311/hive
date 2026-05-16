// Wardrobe.tsx — Tall wooden wardrobe in back-right corner
// Dark walnut body with two doors, brass handles, clothes hanging inside
// Organic details: slightly open door revealing clothes, hat on top
import * as THREE from "three";
import { getDenTextures } from "./ProceduralTextures";

export function Wardrobe() {
  const tex = getDenTextures();
  // Back-right corner: x ≈ 5, z ≈ -6.5
  return (
    <group position={[3.0, 0, -3.8]}>
      {/* ═══ MAIN BODY ═══ */}
      <mesh position={[0, 1.3, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.8, 2.6, 0.58]} />
        <meshStandardMaterial
          map={tex.wood}
          normalMap={tex.normalWood}
          color="#2A1408"
          roughness={0.86}
        />
      </mesh>

      {/* Top cap — slightly proud */}
      <mesh position={[0, 2.62, 0]}>
        <boxGeometry args={[1.88, 0.08, 0.64]} />
        <meshStandardMaterial color="#221005" roughness={0.88} />
      </mesh>
      {/* Bottom plinth */}
      <mesh position={[0, 0.055, 0]}>
        <boxGeometry args={[1.88, 0.11, 0.64]} />
        <meshStandardMaterial color="#221005" roughness={0.88} />
      </mesh>

      {/* ═══ LEFT DOOR — closed ═══ */}
      <group position={[-0.46, 1.3, 0.3]}>
        <mesh castShadow>
          <boxGeometry args={[0.86, 2.42, 0.04]} />
          <meshStandardMaterial color="#321A0A" roughness={0.84} />
        </mesh>
        {/* Door panel inset */}
        <mesh position={[0, 0.35, 0.025]}>
          <boxGeometry args={[0.68, 0.88, 0.015]} />
          <meshStandardMaterial color="#2A1208" roughness={0.86} />
        </mesh>
        <mesh position={[0, -0.55, 0.025]}>
          <boxGeometry args={[0.68, 0.98, 0.015]} />
          <meshStandardMaterial color="#2A1208" roughness={0.86} />
        </mesh>
        {/* Brass handle */}
        <mesh position={[0.36, 0, 0.03]}>
          <cylinderGeometry args={[0.012, 0.012, 0.12, 8]} />
          <meshStandardMaterial color="#8B7030" metalness={0.72} roughness={0.28} />
        </mesh>
      </group>

      {/* ═══ RIGHT DOOR — slightly ajar, reveals inside ═══ */}
      <group position={[0.46, 1.3, 0.31]} rotation={[0, -0.18, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.86, 2.42, 0.04]} />
          <meshStandardMaterial color="#321A0A" roughness={0.84} />
        </mesh>
        {/* Door panel inset */}
        <mesh position={[0, 0.35, 0.025]}>
          <boxGeometry args={[0.68, 0.88, 0.015]} />
          <meshStandardMaterial color="#2A1208" roughness={0.86} />
        </mesh>
        <mesh position={[0, -0.55, 0.025]}>
          <boxGeometry args={[0.68, 0.98, 0.015]} />
          <meshStandardMaterial color="#2A1208" roughness={0.86} />
        </mesh>
        {/* Brass handle */}
        <mesh position={[-0.36, 0, 0.03]}>
          <cylinderGeometry args={[0.012, 0.012, 0.12, 8]} />
          <meshStandardMaterial color="#8B7030" metalness={0.72} roughness={0.28} />
        </mesh>
      </group>

      {/* ═══ INSIDE (visible through gap) — hanging clothes ═══ */}
      {/* Hanging rod */}
      <mesh position={[0, 2.1, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.012, 0.012, 1.6, 8]} />
        <meshStandardMaterial color="#8B7030" metalness={0.6} roughness={0.3} />
      </mesh>
      {/* Hanging clothes — color blocks */}
      {[
        { x: -0.55, color: "#2A3A5A", w: 0.22 }, // navy shirt
        { x: -0.28, color: "#3A2020", w: 0.18 }, // dark red
        { x: -0.04, color: "#E8D8C0", w: 0.2 }, // cream blouse
        { x: 0.2, color: "#1A2A1A", w: 0.22 }, // forest jacket
        { x: 0.46, color: "#4A3A2A", w: 0.18 }, // tan
      ].map((c, i) => (
        <group key={i} position={[c.x, 1.78, 0]}>
          {/* Hanger wire */}
          <mesh position={[0, 0.16, 0]}>
            <torusGeometry args={[0.07, 0.006, 6, 16, Math.PI]} />
            <meshStandardMaterial color="#8B7030" metalness={0.6} roughness={0.3} />
          </mesh>
          {/* Garment body */}
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[c.w, 0.38, 0.06]} />
            <meshStandardMaterial color={c.color} roughness={0.92} />
          </mesh>
          {/* Sleeve hints */}
          <mesh position={[-c.w / 2 - 0.04, 0.06, 0]} rotation={[0, 0, 0.25]}>
            <boxGeometry args={[0.06, 0.22, 0.05]} />
            <meshStandardMaterial color={c.color} roughness={0.92} />
          </mesh>
          <mesh position={[c.w / 2 + 0.04, 0.06, 0]} rotation={[0, 0, -0.25]}>
            <boxGeometry args={[0.06, 0.22, 0.05]} />
            <meshStandardMaterial color={c.color} roughness={0.92} />
          </mesh>
        </group>
      ))}
      {/* Shoes on floor inside */}
      {[
        [-0.4, "#1A1410"],
        [0.1, "#3A2A1A"],
      ].map(([x, col], i) => (
        <group key={i} position={[x as number, 0.12, 0]}>
          <mesh rotation={[0, i * 0.2, 0]}>
            <boxGeometry args={[0.08, 0.07, 0.22]} />
            <meshStandardMaterial color={col as string} roughness={0.88} />
          </mesh>
        </group>
      ))}

      {/* ═══ TOP SHELF decor ═══ */}
      {/* Hat box */}
      <mesh position={[-0.55, 2.73, 0]}>
        <cylinderGeometry args={[0.2, 0.2, 0.18, 16]} />
        <meshStandardMaterial color="#4A3A28" roughness={0.88} />
      </mesh>
      {/* Hat brim */}
      <mesh position={[-0.55, 2.83, 0]}>
        <cylinderGeometry args={[0.28, 0.28, 0.03, 16]} />
        <meshStandardMaterial color="#3A2A18" roughness={0.85} />
      </mesh>
      {/* Small bag */}
      <mesh position={[0.45, 2.72, 0]}>
        <boxGeometry args={[0.28, 0.18, 0.16]} />
        <meshStandardMaterial color="#6A4A28" roughness={0.88} />
      </mesh>
      {/* Bag handle */}
      <mesh position={[0.45, 2.83, 0]} rotation={[0, 0, 0]}>
        <torusGeometry args={[0.07, 0.008, 6, 12, Math.PI]} />
        <meshStandardMaterial color="#4A3018" roughness={0.85} />
      </mesh>

      {/* ═══ MIRROR on left side of wardrobe ═══ */}
      <group position={[-1.05, 1.3, 0.02]}>
        {/* Frame */}
        <mesh>
          <boxGeometry args={[0.05, 1.2, 0.42]} />
          <meshStandardMaterial color="#2A1408" roughness={0.88} />
        </mesh>
        {/* Glass */}
        <mesh position={[-0.02, 0, 0]}>
          <boxGeometry args={[0.01, 1.12, 0.36]} />
          <meshStandardMaterial
            color="#B8C8D0"
            metalness={0.85}
            roughness={0.05}
            transparent
            opacity={0.6}
          />
        </mesh>
      </group>
    </group>
  );
}
