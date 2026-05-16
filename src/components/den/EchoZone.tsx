// EchoZone.tsx — Music corner: record player, speaker, vinyl shelf, mushroom lamp
// Sideboard: #2A1408 (dark oak), Record player base: #4A2A08 (honey oak)
// Vinyl: #0A0808 roughness 0.15 metalness 0.2
import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { getDenTextures } from "./ProceduralTextures";
import { useDen } from "./DenContext";

export function EchoZone() {
  const { setActiveZone, activeZone, spotifyPlaylistUrl } = useDen();
  const tex = getDenTextures();
  const platterRef = useRef<THREE.Mesh>(null);
  const tonearmRef = useRef<THREE.Group>(null);
  const targetSpeed = useRef(0.002);
  const currentSpeed = useRef(0.002);
  const [hovered, setHovered] = useState(false);

  useFrame(() => {
    // Smooth spin-up / spin-down easing if Spotify is connected
    targetSpeed.current = activeZone === "echo" || spotifyPlaylistUrl ? 0.012 : 0.002;
    currentSpeed.current += (targetSpeed.current - currentSpeed.current) * 0.02;
    if (platterRef.current) platterRef.current.rotation.y += currentSpeed.current;
    if (tonearmRef.current) {
      const target = activeZone === "echo" || spotifyPlaylistUrl ? -0.22 : -0.15;
      tonearmRef.current.rotation.z += (target - tonearmRef.current.rotation.z) * 0.02;
    }
  });

  const handleClick = (e: any) => {
    e.stopPropagation();
    setActiveZone("echo");
  };

  return (
    <group position={[-3.2, 0, 1.0]}>
      {/* ═══ SIDEBOARD — knee height, dark oak ═══ */}
      <mesh position={[0, 0.3, 0]}>
        <boxGeometry args={[1.3, 0.6, 0.4]} />
        <meshStandardMaterial
          map={tex.wood}
          normalMap={tex.normalWood}
          color="#2A1408"
          roughness={0.86}
        />
      </mesh>
      {/* Sideboard top — slightly lighter from wear */}
      <mesh position={[0, 0.61, 0]}>
        <boxGeometry args={[1.35, 0.02, 0.42]} />
        <meshStandardMaterial color="#321A0A" roughness={0.84} />
      </mesh>

      {/* ═══ RECORD PLAYER — honey-stained oak base ═══ */}
      <mesh
        position={[-0.15, 0.67, 0]}
        onClick={handleClick}
        onPointerEnter={(e) => {
          e.stopPropagation();
          document.body.style.cursor = "pointer";
          setHovered(true);
        }}
        onPointerLeave={() => {
          document.body.style.cursor = "default";
          setHovered(false);
        }}
      >
        <boxGeometry args={[0.8, 0.06, 0.55]} />
        <meshStandardMaterial
          color="#4A2A08"
          roughness={0.75}
          emissive="#FF9040"
          emissiveIntensity={hovered ? 0.3 : 0}
        />
      </mesh>

      {/* Platter */}
      <mesh ref={platterRef} position={[-0.15, 0.73, 0]}>
        <cylinderGeometry args={[0.22, 0.22, 0.018, 48]} />
        <meshStandardMaterial color="#0A0808" roughness={0.15} metalness={0.2} />
      </mesh>
      {/* Vinyl grooves ring */}
      <mesh position={[-0.15, 0.742, 0]}>
        <torusGeometry args={[0.16, 0.002, 4, 48]} />
        <meshStandardMaterial color="#141010" roughness={0.12} metalness={0.25} />
      </mesh>
      {/* Record label — warm amber */}
      <mesh position={[-0.15, 0.745, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 0.004, 16]} />
        <meshStandardMaterial color="#C8780A" roughness={0.6} />
      </mesh>

      {/* Tonearm */}
      <group ref={tonearmRef} position={[0.18, 0.75, -0.15]}>
        {/* Arm */}
        <mesh rotation={[0, 0, -0.15]} position={[-0.12, 0, 0.05]}>
          <cylinderGeometry args={[0.005, 0.004, 0.38, 6]} />
          <meshStandardMaterial color="#8B7030" metalness={0.72} roughness={0.28} />
        </mesh>
        {/* Pivot base */}
        <mesh position={[0, -0.01, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 0.025, 8]} />
          <meshStandardMaterial color="#8B7030" metalness={0.72} roughness={0.28} />
        </mesh>
        {/* Headshell */}
        <mesh position={[-0.3, 0.04, 0.05]}>
          <boxGeometry args={[0.04, 0.006, 0.015]} />
          <meshStandardMaterial color="#8B7030" metalness={0.72} roughness={0.28} />
        </mesh>
      </group>

      {/* ═══ SPEAKER — single, right of record player ═══ */}
      <group position={[0.45, 0.63, 0]}>
        <mesh position={[0, 0.15, 0]}>
          <boxGeometry args={[0.22, 0.3, 0.18]} />
          <meshStandardMaterial color="#1A0E06" roughness={0.88} />
        </mesh>
        {/* Fabric front — charcoal */}
        <mesh position={[0, 0.15, 0.092]}>
          <planeGeometry args={[0.18, 0.26]} />
          <meshStandardMaterial color="#141210" roughness={0.95} />
        </mesh>
        {/* Speaker cone */}
        <mesh position={[0, 0.12, 0.094]}>
          <circleGeometry args={[0.06, 16]} />
          <meshStandardMaterial color="#0A0808" roughness={0.7} />
        </mesh>
      </group>

      {/* ═══ WALL SHELF — vinyl sleeves, mushroom lamp ═══ */}
      <mesh position={[0, 1.5, -0.25]}>
        <boxGeometry args={[1.6, 0.035, 0.2]} />
        <meshStandardMaterial
          map={tex.wood}
          normalMap={tex.normalWood}
          color="#2E1808"
          roughness={0.88}
        />
      </mesh>
      {/* Bracket supports */}
      {[-0.6, 0.6].map((x, i) => (
        <group key={`b-${i}`}>
          <mesh position={[x, 1.38, -0.2]}>
            <boxGeometry args={[0.03, 0.2, 0.025]} />
            <meshStandardMaterial color="#2A2420" roughness={0.7} metalness={0.3} />
          </mesh>
          <mesh position={[x, 1.29, -0.28]}>
            <boxGeometry args={[0.03, 0.025, 0.15]} />
            <meshStandardMaterial color="#2A2420" roughness={0.7} metalness={0.3} />
          </mesh>
        </group>
      ))}

      {/* Vinyl sleeves on shelf — standing vertical */}
      {[
        { x: -0.5, color: "#1A1A4A" }, // deep blue-purple
        { x: -0.38, color: "#4A1A1A" }, // dark red
        { x: -0.26, color: "#D8C8A0" }, // warm cream
        { x: -0.14, color: "#0A0A0A" }, // near-black
      ].map((v, i) => (
        <mesh key={`vs-${i}`} position={[v.x, 1.56, -0.25]} rotation={[0, (i - 2) * 0.03, 0]}>
          <boxGeometry args={[0.04, 0.28, 0.28]} />
          <meshStandardMaterial color={v.color} roughness={0.85} />
        </mesh>
      ))}
      {/* Leaning sleeves behind */}
      <mesh position={[-0.02, 1.56, -0.32]} rotation={[0.1, 0.05, 0]}>
        <boxGeometry args={[0.04, 0.26, 0.26]} />
        <meshStandardMaterial color="#3A2A1A" roughness={0.85} />
      </mesh>
      <mesh position={[0.08, 1.56, -0.3]} rotation={[-0.08, -0.06, 0]}>
        <boxGeometry args={[0.04, 0.27, 0.27]} />
        <meshStandardMaterial color="#1A2A1A" roughness={0.85} />
      </mesh>

      {/* ═══ MUSHROOM LAMP — amber-red dome, right end of shelf ═══ */}
      <group position={[0.55, 1.52, -0.22]}>
        {/* Ceramic base */}
        <mesh position={[0, 0.04, 0]}>
          <cylinderGeometry args={[0.03, 0.04, 0.08, 10]} />
          <meshStandardMaterial color="#D0C4A8" roughness={0.85} />
        </mesh>
        {/* Dome shade */}
        <mesh position={[0, 0.1, 0]} scale={[1, 0.6, 1]}>
          <sphereGeometry args={[0.06, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial
            color="#8B3008"
            emissive="#FF6018"
            emissiveIntensity={1.2}
            transparent
            opacity={0.6}
            roughness={0.5}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>

      {/* Small succulent — right end of shelf */}
      <group position={[-0.65, 1.53, -0.22]}>
        <mesh position={[0, 0.02, 0]}>
          <cylinderGeometry args={[0.025, 0.02, 0.04, 8]} />
          <meshStandardMaterial color="#8B4520" roughness={0.85} />
        </mesh>
        <mesh position={[0, 0.05, 0]} scale={[1, 0.6, 1]}>
          <sphereGeometry args={[0.02, 8, 8]} />
          <meshStandardMaterial color="#1E3010" roughness={0.88} />
        </mesh>
      </group>

      {/* ═══ VINYL CRATE on floor — open box with records ═══ */}
      <group position={[0.7, 0.15, 0.5]}>
        <mesh>
          <boxGeometry args={[0.4, 0.3, 0.35]} />
          <meshStandardMaterial color="#2A1505" roughness={0.88} />
        </mesh>

        {/* Records standing in crate */}
        {[0, 0.04, 0.08, -0.04, -0.08].map((z, i) => (
          <mesh key={`crate-${i}`} position={[0, 0.04, z]} rotation={[0, (i - 2) * 0.02, 0]}>
            <planeGeometry args={[0.32, 0.25]} />
            <meshStandardMaterial
              color={["#4A2A08", "#1A1A4A", "#4A1A1A", "#1A3A1A", "#2A2A0A"][i]}
              roughness={0.6}
              side={THREE.DoubleSide}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
}
