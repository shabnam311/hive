// DenRoom.tsx — Cozy bedroom sanctuary: 9 wide x 10 deep x 5 tall
// Warm cream walls, dark oak floor, window light, fairy lights feel
// Packed with cozy details — rugs, cushions, curtains, picture frames
import * as THREE from "three";
import { getDenTextures } from "./ProceduralTextures";

const W = 9; // room width  (x: -4.5 to 4.5)
const D = 10; // room depth  (z: -5 to 5)
const H = 5; // room height (y: 0 to 5)

function PictureFrame({
  pos,
  ry = 0,
  w = 0.6,
  h = 0.45,
  frameColor = "#2A1408",
  artColor = "#4a3020",
}: {
  pos: [number, number, number];
  ry?: number;
  w?: number;
  h?: number;
  frameColor?: string;
  artColor?: string;
}) {
  return (
    <group position={pos} rotation={[0, ry, 0]}>
      <mesh>
        <boxGeometry args={[w + 0.06, h + 0.06, 0.03]} />
        <meshStandardMaterial color={frameColor} roughness={0.7} />
      </mesh>
      <mesh position={[0, 0, 0.016]}>
        <planeGeometry args={[w - 0.04, h - 0.04]} />
        <meshStandardMaterial color={artColor} roughness={0.95} />
      </mesh>
    </group>
  );
}

function Cushion({
  pos,
  color = "#8B4040",
  ry = 0,
}: {
  pos: [number, number, number];
  color?: string;
  ry?: number;
}) {
  return (
    <mesh position={pos} rotation={[0, ry, 0]} scale={[1, 0.4, 1]}>
      <sphereGeometry args={[0.22, 8, 6]} />
      <meshStandardMaterial color={color} roughness={0.95} />
    </mesh>
  );
}

function SmallPlant({ pos }: { pos: [number, number, number] }) {
  return (
    <group position={pos}>
      <mesh position={[0, 0.06, 0]}>
        <cylinderGeometry args={[0.06, 0.08, 0.12, 8]} />
        <meshStandardMaterial color="#6B4423" roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.04, 0]}>
        <cylinderGeometry args={[0.055, 0.055, 0.02, 8]} />
        <meshStandardMaterial color="#3A2210" roughness={0.9} />
      </mesh>
      {[0, 1.2, 2.4, 3.6, 5].map((a, i) => (
        <mesh
          key={i}
          position={[Math.cos(a) * 0.03, 0.14 + i * 0.02, Math.sin(a) * 0.03]}
          rotation={[0.3 * Math.cos(a), 0, 0.3 * Math.sin(a)]}
        >
          <sphereGeometry args={[0.04 + i * 0.005, 6, 4]} />
          <meshStandardMaterial color={i % 2 === 0 ? "#2D5A2D" : "#3A6B3A"} roughness={0.92} />
        </mesh>
      ))}
    </group>
  );
}

function Candle({ pos, h = 0.15 }: { pos: [number, number, number]; h?: number }) {
  return (
    <group position={pos}>
      <mesh position={[0, h / 2, 0]}>
        <cylinderGeometry args={[0.02, 0.025, h, 6]} />
        <meshStandardMaterial color="#F5ECD8" roughness={0.85} />
      </mesh>
      <mesh position={[0, h + 0.02, 0]}>
        <coneGeometry args={[0.008, 0.03, 6]} />
        <meshStandardMaterial
          color="#FFCC44"
          emissive="#FF8800"
          emissiveIntensity={2}
          transparent
          opacity={0.85}
        />
      </mesh>
      <pointLight
        position={[0, h + 0.04, 0]}
        color="#FFA040"
        intensity={0.6}
        distance={2.5}
        decay={2}
      />
    </group>
  );
}

function CurtainPanel({
  pos,
  ry = 0,
  h = 2.4,
  w = 0.6,
}: {
  pos: [number, number, number];
  ry?: number;
  h?: number;
  w?: number;
}) {
  const tex = getDenTextures();
  return (
    <mesh position={pos} rotation={[0, ry, 0]}>
      <planeGeometry args={[w, h]} />
      <meshStandardMaterial
        map={tex.curtain}
        normalMap={tex.normalFabric}
        color="#6B3A2A"
        roughness={0.95}
        side={THREE.DoubleSide}
        transparent
        opacity={0.9}
      />
    </mesh>
  );
}

export function DenRoom() {
  const tex = getDenTextures();
  return (
    <group>
      {/* ═══ FLOOR — warm dark oak planks ═══ */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[W, D]} />
        <meshStandardMaterial
          map={tex.floor}
          normalMap={tex.normalWood}
          color="#3A2210"
          roughness={0.84}
        />
      </mesh>
      {Array.from({ length: 7 }, (_, i) => (
        <mesh
          key={i}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.004, -D / 2 + (i + 0.5) * (D / 7)]}
        >
          <planeGeometry args={[W, D / 7 - 0.04]} />
          <meshStandardMaterial
            map={tex.floor}
            normalMap={tex.normalWood}
            color={i % 2 === 0 ? "#3E2612" : "#452A14"}
            roughness={0.85}
          />
        </mesh>
      ))}

      {/* ═══ LARGE RUG — cozy layered rugs ═══ */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0.02]}
        position={[-0.5, 0.012, 0]}
        scale={[1, 1.33, 1]}
        receiveShadow
      >
        <circleGeometry args={[2.4, 32]} />
        <meshStandardMaterial map={tex.rug} color="#2A4020" roughness={0.96} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0.02]} position={[-0.5, 0.015, 0]} scale={[1, 1.33, 1]}>
        <circleGeometry args={[1.8, 32]} />
        <meshStandardMaterial map={tex.rug} color="#324A28" roughness={0.95} />
      </mesh>
      {/* Small accent rug near bed */}
      <mesh rotation={[-Math.PI / 2, 0, 0.3]} position={[2.5, 0.01, 2]} receiveShadow>
        <planeGeometry args={[1.6, 1.0]} />
        <meshStandardMaterial color="#5A2828" roughness={0.96} />
      </mesh>

      {/* ═══ BACK WALL ═══ */}
      <mesh position={[0, H / 2, -D / 2]} receiveShadow>
        <planeGeometry args={[W, H]} />
        <meshStandardMaterial
          map={tex.plasterBack}
          normalMap={tex.normalPlaster}
          color="#DBC8A8"
          roughness={0.92}
        />
      </mesh>
      {/* ═══ LEFT WALL ═══ */}
      <mesh rotation={[0, Math.PI / 2, 0]} position={[-W / 2, H / 2, 0]} receiveShadow>
        <planeGeometry args={[D, H]} />
        <meshStandardMaterial
          map={tex.plasterLeft}
          normalMap={tex.normalPlaster}
          color="#D8C4A2"
          roughness={0.92}
        />
      </mesh>
      {/* ═══ RIGHT WALL ═══ */}
      <mesh rotation={[0, -Math.PI / 2, 0]} position={[W / 2, H / 2, 0]} receiveShadow>
        <planeGeometry args={[D, H]} />
        <meshStandardMaterial
          map={tex.plasterRight}
          normalMap={tex.normalPlaster}
          color="#D4C09E"
          roughness={0.92}
        />
      </mesh>
      {/* ═══ CEILING ═══ */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, H, 0]}>
        <planeGeometry args={[W, D]} />
        <meshStandardMaterial
          map={tex.plasterCeiling}
          normalMap={tex.normalPlaster}
          color="#EDE0C8"
          roughness={1}
        />
      </mesh>

      {/* ═══ FRONT WALL — with large arched window opening ═══ */}
      <group>
        <mesh position={[-W / 4 - 0.5, H / 2, D / 2]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[W / 2 - 1, H]} />
          <meshStandardMaterial color="#D6C0A0" roughness={0.92} />
        </mesh>
        <mesh position={[W / 4 + 0.5, H / 2, D / 2]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[W / 2 - 1, H]} />
          <meshStandardMaterial color="#D6C0A0" roughness={0.92} />
        </mesh>
        <mesh position={[0, H - 0.6, D / 2]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[2.8, 1.2]} />
          <meshStandardMaterial color="#D6C0A0" roughness={0.92} />
        </mesh>
        {/* Arch frame */}
        <mesh position={[-1.4, H / 2 - 0.6, D / 2 - 0.01]}>
          <boxGeometry args={[0.08, H - 1.2, 0.04]} />
          <meshStandardMaterial color="#2A1408" roughness={0.88} />
        </mesh>
        <mesh position={[1.4, H / 2 - 0.6, D / 2 - 0.01]}>
          <boxGeometry args={[0.08, H - 1.2, 0.04]} />
          <meshStandardMaterial color="#2A1408" roughness={0.88} />
        </mesh>
        <mesh position={[0, H - 1.0, D / 2 - 0.01]}>
          <boxGeometry args={[2.88, 0.08, 0.04]} />
          <meshStandardMaterial color="#2A1408" roughness={0.88} />
        </mesh>
        {/* Night sky glow */}
        <mesh position={[0, 1.8, D / 2 + 0.05]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[2.6, 3.4]} />
          <meshStandardMaterial
            map={tex.nightSky}
            emissive="#1a2550"
            emissiveIntensity={0.3}
            transparent
            opacity={0.35}
          />
        </mesh>
        <pointLight
          position={[0, 2.2, D / 2 + 0.5]}
          color="#8090c0"
          intensity={0.6}
          distance={5}
          decay={2}
        />
        {/* Curtains flanking the archway */}
        <CurtainPanel pos={[-1.25, 2.2, D / 2 - 0.06]} w={0.5} h={3.2} />
        <CurtainPanel pos={[1.25, 2.2, D / 2 - 0.06]} w={0.5} h={3.2} />
      </group>

      {/* ═══ BASEBOARDS ═══ */}
      <mesh position={[0, 0.05, -D / 2 + 0.02]}>
        <boxGeometry args={[W, 0.1, 0.03]} />
        <meshStandardMaterial color="#2A1408" roughness={0.88} />
      </mesh>
      <mesh rotation={[0, Math.PI / 2, 0]} position={[-W / 2 + 0.02, 0.05, 0]}>
        <boxGeometry args={[D, 0.1, 0.03]} />
        <meshStandardMaterial color="#2A1408" roughness={0.88} />
      </mesh>
      <mesh rotation={[0, -Math.PI / 2, 0]} position={[W / 2 - 0.02, 0.05, 0]}>
        <boxGeometry args={[D, 0.1, 0.03]} />
        <meshStandardMaterial color="#2A1408" roughness={0.88} />
      </mesh>

      {/* ═══ WINDOW — left wall ═══ */}
      <group position={[-W / 2 + 0.02, 2.6, -1.8]}>
        <mesh rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[1.8, 2.4]} />
          <meshStandardMaterial color="#C8B898" roughness={0.88} />
        </mesh>
        <mesh rotation={[0, Math.PI / 2, 0]} position={[0.02, 0, 0]}>
          <planeGeometry args={[1.5, 2.1]} />
          <meshPhysicalMaterial
            color="#6878A0"
            emissive="#8AA0C8"
            emissiveIntensity={0.3}
            transparent
            opacity={0.25}
            transmission={0.6}
            roughness={0.05}
            ior={1.5}
          />
        </mesh>
        <mesh rotation={[0, Math.PI / 2, 0]} position={[0.04, 0, 0]}>
          <boxGeometry args={[1.5, 0.04, 0.03]} />
          <meshStandardMaterial color="#C4B090" roughness={0.88} />
        </mesh>
        <mesh rotation={[0, Math.PI / 2, 0]} position={[0.04, 0, 0]}>
          <boxGeometry args={[0.04, 2.1, 0.03]} />
          <meshStandardMaterial color="#C4B090" roughness={0.88} />
        </mesh>
        {/* Window curtains */}
        <CurtainPanel pos={[0.06, 0, -0.85]} ry={Math.PI / 2} w={0.4} h={2.6} />
        <CurtainPanel pos={[0.06, 0, 0.85]} ry={Math.PI / 2} w={0.4} h={2.6} />
        {/* Warm light from window */}
        <pointLight position={[0.5, 0, 0]} color="#C8D8F0" intensity={1.2} distance={6} decay={2} />
        {/* Light patch on floor */}
        <mesh rotation={[-Math.PI / 2, 0, 0.08]} position={[1.8, -2.55, 0]}>
          <planeGeometry args={[2.2, 3.5]} />
          <meshStandardMaterial color="#FFE890" transparent opacity={0.04} />
        </mesh>
      </group>

      {/* ═══ DOOR — right wall ═══ */}
      <group position={[W / 2 - 0.02, 1.15, 3.5]}>
        <mesh rotation={[0, -Math.PI / 2, 0]}>
          <planeGeometry args={[1.0, 2.3]} />
          <meshStandardMaterial color="#2E1808" roughness={0.85} />
        </mesh>
        <mesh rotation={[0, -Math.PI / 2, 0]} position={[-0.01, 0, 0]}>
          <boxGeometry args={[1.06, 2.36, 0.06]} />
          <meshStandardMaterial color="#2A1408" roughness={0.88} />
        </mesh>
        {/* Door knob */}
        <mesh position={[-0.04, -0.1, 0.35]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.025, 0.025, 0.04, 8]} />
          <meshStandardMaterial color="#8B7530" metalness={0.7} roughness={0.3} />
        </mesh>
      </group>

      {/* ═══ CEILING BEAMS ═══ */}
      {[-2.5, 0, 2.5].map((z) => (
        <mesh key={z} position={[0, H - 0.06, z]}>
          <boxGeometry args={[W, 0.07, 0.12]} />
          <meshStandardMaterial color="#2E1808" roughness={0.9} />
        </mesh>
      ))}

      {/* ═══ PENDANT LIGHT ═══ */}
      <group position={[0, H - 0.04, 0]}>
        <mesh position={[0, -0.25, 0]}>
          <cylinderGeometry args={[0.005, 0.005, 0.5, 4]} />
          <meshStandardMaterial color="#1A1008" roughness={0.9} />
        </mesh>
        <mesh position={[0, -0.58, 0]} scale={[1, 0.6, 1]}>
          <sphereGeometry args={[0.2, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#D4B888" roughness={0.75} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, -0.62, 0]}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshStandardMaterial color="#FFE8A0" emissive="#FFE890" emissiveIntensity={2.5} />
        </mesh>
        <pointLight
          position={[0, -0.65, 0]}
          color="#FFE890"
          intensity={1.5}
          distance={5}
          decay={2}
        />
      </group>

      {/* ═══ WALL DECORATIONS ═══ */}
      {/* Back wall — picture frames */}
      <PictureFrame pos={[-2, 2.8, -D / 2 + 0.03]} w={0.7} h={0.5} artColor="#3A4A30" />
      <PictureFrame pos={[0.5, 3.0, -D / 2 + 0.03]} w={0.5} h={0.65} artColor="#4A3040" />
      <PictureFrame pos={[2.5, 2.7, -D / 2 + 0.03]} w={0.4} h={0.4} artColor="#2A3050" />
      {/* Left wall — picture */}
      <PictureFrame
        pos={[-W / 2 + 0.03, 2.8, 2.5]}
        ry={Math.PI / 2}
        w={0.55}
        h={0.4}
        artColor="#504030"
      />
      {/* Right wall */}
      <PictureFrame
        pos={[W / 2 - 0.03, 3.0, -2]}
        ry={-Math.PI / 2}
        w={0.6}
        h={0.45}
        artColor="#384030"
      />

      {/* ═══ COZY DETAILS ═══ */}
      {/* Cushions scattered around */}
      <Cushion pos={[-1.2, 0.1, 1.5]} color="#8B4040" ry={0.3} />
      <Cushion pos={[-0.7, 0.1, 1.8]} color="#5A4A6A" ry={-0.5} />
      <Cushion pos={[0.2, 0.1, 1.2]} color="#6A5A3A" ry={0.8} />

      {/* Small plants on surfaces */}
      <SmallPlant pos={[-3.8, 0, -4]} />
      <SmallPlant pos={[3.5, 0, -3.5]} />

      {/* Candles — scattered for warmth */}
      <Candle pos={[-3.5, 0, 3.5]} h={0.12} />
      <Candle pos={[3.8, 0, -4.2]} h={0.18} />

      {/* Stack of books on floor */}
      <group position={[-2.5, 0, 3]}>
        {[
          { color: "#6B1A1A", w: 0.3, h: 0.04 },
          { color: "#1A3A5A", w: 0.28, h: 0.035 },
          { color: "#5A3A1A", w: 0.32, h: 0.045 },
          { color: "#2A4A2A", w: 0.27, h: 0.04 },
        ].map((b, i) => {
          const y = [0, 0.04, 0.075, 0.12][i];
          return (
            <mesh key={i} position={[0, y + b.h / 2, 0]} rotation={[0, i * 0.15, 0]}>
              <boxGeometry args={[b.w, b.h, 0.2]} />
              <meshStandardMaterial color={b.color} roughness={0.75} />
            </mesh>
          );
        })}
      </group>

      {/* Woven basket */}
      <group position={[3.8, 0, 2]}>
        <mesh position={[0, 0.15, 0]}>
          <cylinderGeometry args={[0.2, 0.25, 0.3, 12]} />
          <meshStandardMaterial color="#6B4A20" roughness={0.92} />
        </mesh>
      </group>

      {/* Small side table */}
      <group position={[-3.5, 0, -1]}>
        <mesh position={[0, 0.35, 0]}>
          <cylinderGeometry args={[0.3, 0.3, 0.03, 12]} />
          <meshStandardMaterial color="#3A2210" roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.17, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 0.34, 6]} />
          <meshStandardMaterial color="#2A1608" roughness={0.85} />
        </mesh>
        {/* Cup on table */}
        <mesh position={[0.1, 0.39, 0.05]}>
          <cylinderGeometry args={[0.035, 0.03, 0.06, 8]} />
          <meshStandardMaterial color="#D4C0A0" roughness={0.8} />
        </mesh>
        <SmallPlant pos={[-0.12, 0.365, -0.05]} />
      </group>

      {/* Fairy light wire along back wall (decorative dots) */}
      {Array.from({ length: 12 }, (_, i) => {
        const x = -3.5 + i * 0.64;
        const y = 3.6 + Math.sin(i * 0.8) * 0.12;
        return (
          <group key={`fairy-${i}`} position={[x, y, -D / 2 + 0.06]}>
            <mesh>
              <sphereGeometry args={[0.02, 4, 4]} />
              <meshStandardMaterial color="#FFE8A0" emissive="#FFCC60" emissiveIntensity={1.5} />
            </mesh>
            {/* pointLight removed here to prevent WebGL uniform limits crash */}
          </group>
        );
      })}
    </group>
  );
}
