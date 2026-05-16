// LibraryScene.tsx — Complete rewrite
// FOCUSTOWN-STYLE: Fixed third-person camera looks down over your desk
// into a warm gothic library. Bookshelves fill the back wall.
// Arched windows with warm light. Study tables in middle distance.
// YOUR DESK in foreground with clickable open book (portal).
// NO first-person. NO drifting camera. NO dark corridor.

import { Canvas, useFrame } from "@react-three/fiber";
import { Html, Text } from "@react-three/drei";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

// ─── Types ────────────────────────────────────────────────────────────────────

export type SceneSubject = {
  id: string;
  name: string;
  color: string;
  confidence: number;
};

// alias kept for backward compat
export type SceneBook = SceneSubject;

type Props = {
  subjects?: SceneSubject[];
  books?: SceneSubject[]; // legacy alias
  activeId?: string | null;
  onOpenPortal?: () => void; // click the desk book
  onSelectSubject?: (id: string) => void;
  onSelectBook?: (id: string) => void; // legacy alias
  timerRunning?: boolean;
};

// ─── Palette ──────────────────────────────────────────────────────────────────

const BOOK_COLORS = [
  "#6b1a1a",
  "#8b2020",
  "#7a1515",
  "#9b3030",
  "#1a3a1a",
  "#2d4a1a",
  "#1a4a28",
  "#2d5a20",
  "#1a1a5c",
  "#1a2870",
  "#141a60",
  "#1a3060",
  "#5c3a1a",
  "#6b4510",
  "#3d2008",
  "#7a5520",
  "#4a1a4a",
  "#3a1040",
  "#5a2a5a",
  "#6b5010",
  "#8b6914",
  "#7a6218",
  "#8b4010",
  "#4a6b10",
  // mid-tones so light bounces
  "#c4512a",
  "#2d6e2d",
  "#2d4a8a",
  "#8b5e2a",
  "#d4744a",
  "#4a8a4a",
  "#c9a84c",
  "#6b3a6b",
];

// ─── Instanced decorative books ──────────────────────────────────────────────

type BookInst = {
  pos: [number, number, number];
  ry: number;
  rz: number;
  sx: number;
  sy: number;
  sz: number;
  color: THREE.Color;
};

function buildBooks(): BookInst[] {
  const out: BookInst[] = [];
  const col = (h: string) => new THREE.Color(h);

  // BACK WALL  z = -9.4  →  x from -9 to +9  (10 sections × 9 rows)
  for (let s = 0; s < 10; s++) {
    const cx = -9 + s * 1.9;
    for (let r = 0; r < 9; r++) {
      const sy = 0.38 + r * 0.82;
      let x = cx - 0.88;
      let guard = 0;
      while (x < cx + 0.88 && guard++ < 50) {
        const w = 0.045 + Math.random() * 0.06;
        const h = 0.42 + Math.random() * 0.3;
        const d = 0.22 + Math.random() * 0.06;
        out.push({
          pos: [x + w / 2, sy + h / 2 + 0.03, -9.28 + d / 2],
          ry: 0,
          rz: (Math.random() - 0.5) * 0.1,
          sx: w,
          sy: h,
          sz: d,
          color: col(BOOK_COLORS[Math.floor(Math.random() * BOOK_COLORS.length)]),
        });
        x += w + 0.005;
      }
    }
  }

  // LEFT WALL  x = -10.4  →  z from -8 to +2  (5 sections × 6 rows)
  for (let s = 0; s < 5; s++) {
    const cz = -7 + s * 2;
    for (let r = 0; r < 6; r++) {
      const sy = 0.38 + r * 0.82;
      let z = cz - 0.85;
      let guard = 0;
      while (z < cz + 0.85 && guard++ < 50) {
        const w = 0.045 + Math.random() * 0.06;
        const h = 0.42 + Math.random() * 0.3;
        const d = 0.22 + Math.random() * 0.06;
        out.push({
          pos: [-10.28 + d / 2, sy + h / 2 + 0.03, z + w / 2],
          ry: Math.PI / 2,
          rz: (Math.random() - 0.5) * 0.1,
          sx: w,
          sy: h,
          sz: d,
          color: col(BOOK_COLORS[Math.floor(Math.random() * BOOK_COLORS.length)]),
        });
        z += w + 0.005;
      }
    }
  }

  // RIGHT WALL  x = +10.4  (rows 2-8 only — bottom reserved for subjects)
  for (let s = 0; s < 5; s++) {
    const cz = -7 + s * 2;
    for (let r = 2; r < 8; r++) {
      const sy = 0.38 + r * 0.82;
      let z = cz - 0.85;
      let guard = 0;
      while (z < cz + 0.85 && guard++ < 50) {
        const w = 0.045 + Math.random() * 0.06;
        const h = 0.42 + Math.random() * 0.3;
        const d = 0.22 + Math.random() * 0.06;
        out.push({
          pos: [10.28 - d / 2, sy + h / 2 + 0.03, z + w / 2],
          ry: -Math.PI / 2,
          rz: (Math.random() - 0.5) * 0.1,
          sx: w,
          sy: h,
          sz: d,
          color: col(BOOK_COLORS[Math.floor(Math.random() * BOOK_COLORS.length)]),
        });
        z += w + 0.005;
      }
    }
  }

  return out;
}

function DecoBooks() {
  const ref = useRef<THREE.InstancedMesh>(null);
  const books = useMemo(() => buildBooks(), []);

  useEffect(() => {
    if (!ref.current) return;
    const dummy = new THREE.Object3D();
    books.forEach((b, i) => {
      dummy.position.set(...b.pos);
      dummy.rotation.set(0, b.ry, b.rz);
      dummy.scale.set(b.sx, b.sy, b.sz);
      dummy.updateMatrix();
      ref.current!.setMatrixAt(i, dummy.matrix);
      ref.current!.setColorAt(i, b.color);
    });
    ref.current.instanceMatrix.needsUpdate = true;
    if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
  }, [books]);

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, books.length]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial roughness={0.62} metalness={0.06} />
    </instancedMesh>
  );
}

// ─── Shelf planks ─────────────────────────────────────────────────────────────

function Shelves() {
  const planks: { p: [number, number, number]; s: [number, number, number] }[] = [];
  for (let r = 0; r < 10; r++) {
    const y = 0.36 + r * 0.82 - 0.025;
    planks.push({ p: [0, y, -9.3], s: [20, 0.05, 0.32] }); // back wall
    planks.push({ p: [-10.3, y, -3], s: [0.32, 0.05, 14] }); // left wall
    planks.push({ p: [10.3, y, -3], s: [0.32, 0.05, 14] }); // right wall
  }
  return (
    <group>
      {planks.map((p, i) => (
        <mesh key={i} position={p.p}>
          <boxGeometry args={p.s} />
          <meshStandardMaterial color="#3a2010" roughness={0.85} />
        </mesh>
      ))}
      {/* Shelf back panels */}
      <mesh position={[0, 4.5, -9.45]}>
        <boxGeometry args={[20, 9, 0.06]} />
        <meshStandardMaterial color="#180e04" roughness={1} />
      </mesh>
      <mesh position={[-10.45, 3, -3]}>
        <boxGeometry args={[0.06, 6, 14]} />
        <meshStandardMaterial color="#180e04" roughness={1} />
      </mesh>
      <mesh position={[10.45, 3, -3]}>
        <boxGeometry args={[0.06, 6, 14]} />
        <meshStandardMaterial color="#180e04" roughness={1} />
      </mesh>
    </group>
  );
}

// ─── Room geometry ────────────────────────────────────────────────────────────

function Room() {
  return (
    <group>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -1]} receiveShadow>
        <planeGeometry args={[22, 28]} />
        <meshStandardMaterial color="#2a1808" roughness={0.92} metalness={0.02} />
      </mesh>
      {/* Persian rug — center aisle */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, -2]}>
        <planeGeometry args={[7, 15]} />
        <meshStandardMaterial color="#5a1a18" roughness={0.92} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.007, -2]}>
        <planeGeometry args={[6.2, 14.2]} />
        <meshStandardMaterial color="#7a2820" roughness={0.88} />
      </mesh>

      {/* Ceiling */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 9.5, -1]}>
        <planeGeometry args={[22, 28]} />
        <meshStandardMaterial color="#0a0603" roughness={1} />
      </mesh>

      {/* Walls */}
      <mesh position={[0, 4.5, -10]}>
        <planeGeometry args={[22, 9]} />
        <meshStandardMaterial color="#140c05" roughness={1} />
      </mesh>
      <mesh rotation={[0, Math.PI / 2, 0]} position={[-11, 4.5, -1]}>
        <planeGeometry args={[28, 9]} />
        <meshStandardMaterial color="#140c05" roughness={1} />
      </mesh>
      <mesh rotation={[0, -Math.PI / 2, 0]} position={[11, 4.5, -1]}>
        <planeGeometry args={[28, 9]} />
        <meshStandardMaterial color="#140c05" roughness={1} />
      </mesh>

      {/* Ceiling beams */}
      {[-1, -4, -7, 2].map((z) => (
        <mesh key={z} position={[0, 9.3, z]}>
          <boxGeometry args={[22, 0.22, 0.28]} />
          <meshStandardMaterial color="#1e1006" roughness={0.9} />
        </mesh>
      ))}
      {[-4, 0, 4].map((x) => (
        <mesh key={x} position={[x, 9.3, -4]}>
          <boxGeometry args={[0.28, 0.22, 28]} />
          <meshStandardMaterial color="#1e1006" roughness={0.9} />
        </mesh>
      ))}

      {/* ARCHED WINDOWS — LEFT WALL (warm sunlight) */}
      {[-1, -4, -7].map((z) => (
        <group key={z} position={[-10.85, 5, z]}>
          {/* Frame */}
          <mesh rotation={[0, Math.PI / 2, 0]}>
            <planeGeometry args={[2.5, 4.2]} />
            <meshStandardMaterial color="#1c1008" roughness={1} />
          </mesh>
          {/* Glass — warm amber glow */}
          <mesh rotation={[0, Math.PI / 2, 0]} position={[0.06, 0, 0]}>
            <planeGeometry args={[2.1, 3.8]} />
            <meshStandardMaterial
              color="#d4a020"
              emissive="#c88010"
              emissiveIntensity={0.55}
              transparent
              opacity={0.18}
            />
          </mesh>
          {/* Window light beam */}
          <pointLight
            position={[1.5, 0, 0]}
            color="#ffe890"
            intensity={2.2}
            distance={10}
            decay={2}
          />
        </group>
      ))}

      {/* ARCHED WINDOWS — RIGHT WALL (cooler moonlight) */}
      {[-2, -5].map((z) => (
        <group key={z} position={[10.85, 5.5, z]}>
          <mesh rotation={[0, -Math.PI / 2, 0]}>
            <planeGeometry args={[2.5, 3.5]} />
            <meshStandardMaterial color="#1c1008" roughness={1} />
          </mesh>
          <mesh rotation={[0, -Math.PI / 2, 0]} position={[-0.06, 0, 0]}>
            <planeGeometry args={[2.1, 3.1]} />
            <meshStandardMaterial
              color="#6080c0"
              emissive="#4060a0"
              emissiveIntensity={0.25}
              transparent
              opacity={0.12}
            />
          </mesh>
          <pointLight
            position={[-1.5, 0, 0]}
            color="#c0d0f8"
            intensity={0.8}
            distance={8}
            decay={2}
          />
        </group>
      ))}

      {/* Wainscoting — lower wall panels */}
      {[-9, -7, -5, -3, -1, 1, 3, 5, 7, 9].map((x) => (
        <mesh key={x} position={[x, 0.7, -9.92]}>
          <boxGeometry args={[1.8, 1.4, 0.04]} />
          <meshStandardMaterial color="#200e04" roughness={0.95} />
        </mesh>
      ))}
    </group>
  );
}

// ─── Chandelier ───────────────────────────────────────────────────────────────

function Chandelier({ pos }: { pos: [number, number, number] }) {
  const lRef = useRef<THREE.PointLight>(null);
  useFrame(({ clock }) => {
    if (!lRef.current) return;
    const t = clock.getElapsedTime();
    lRef.current.intensity =
      3.2 + Math.sin(t * 6.1) * 0.18 + Math.sin(t * 11.3) * 0.08 + (Math.random() - 0.5) * 0.04;
  });
  return (
    <group position={pos}>
      <mesh position={[0, 0.8, 0]}>
        <cylinderGeometry args={[0.016, 0.016, 1.5, 6]} />
        <meshStandardMaterial color="#3a2a14" />
      </mesh>
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
      {Array.from({ length: 8 }).map((_, i) => {
        const a = (i / 8) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * 1.1, 0.1, Math.sin(a) * 1.1]}>
            <cylinderGeometry args={[0.026, 0.026, 0.2, 6]} />
            <meshStandardMaterial color="#f0e8c8" emissive="#ff8c00" emissiveIntensity={1.8} />
          </mesh>
        );
      })}
      {/* Decorative pendants */}
      {Array.from({ length: 8 }).map((_, i) => {
        const a = (i / 8) * Math.PI * 2 + 0.4;
        return (
          <mesh key={i} position={[Math.cos(a) * 1.1, -0.12, Math.sin(a) * 1.1]}>
            <sphereGeometry args={[0.04, 6, 6]} />
            <meshStandardMaterial color="#8b6914" metalness={0.8} roughness={0.2} />
          </mesh>
        );
      })}
      <pointLight ref={lRef} color="#ffb860" intensity={3.2} distance={22} decay={1.6} />
    </group>
  );
}

// ─── Candle cluster ───────────────────────────────────────────────────────────

function CandleCluster({ pos }: { pos: [number, number, number] }) {
  const lRef = useRef<THREE.PointLight>(null);
  const flamesRef = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!lRef.current) return;
    const t = clock.getElapsedTime();
    lRef.current.intensity =
      0.9 +
      Math.sin(t * 7.2 + pos[0]) * 0.12 +
      Math.sin(t * 13.1 + pos[2]) * 0.05 +
      (Math.random() - 0.5) * 0.03;
      
    if (flamesRef.current) {
      flamesRef.current.children.forEach((flame, i) => {
        const scale = 1 + Math.sin(t * (10 + i * 2) + pos[0] * i) * 0.15 + (Math.random() - 0.5) * 0.1;
        flame.scale.set(scale, scale * 1.2, scale);
      });
    }
  });
  return (
    <group position={pos}>
      <group ref={flamesRef}>
        {[-0.09, 0, 0.09].map((dx, i) => (
          <mesh key={`flame-${i}`} position={[dx, 0.1 + i * 0.025, 0]}>
            <sphereGeometry args={[0.018, 6, 6]} />
            <meshBasicMaterial color="#ff8c00" />
          </mesh>
        ))}
      </group>
      {[-0.09, 0, 0.09].map((dx, i) => (
        <mesh key={`base-${i}`} position={[dx, 0, 0]}>
          <cylinderGeometry args={[0.028, 0.032, 0.14 + i * 0.05, 8]} />
          <meshStandardMaterial color="#f0e6c8" roughness={0.8} />
        </mesh>
      ))}
      <pointLight ref={lRef} color="#ff9040" intensity={0.9} distance={4.5} decay={2} />
    </group>
  );
}

// ─── Study tables (atmospheric, mid-ground) ──────────────────────────────────

function StudyTables() {
  const tablePositions: [number, number, number][] = [
    [-3.5, 0, -3.5],
    [0, 0, -4.5],
    [3.5, 0, -3.5],
  ];
  return (
    <group>
      {tablePositions.map((p, ti) => (
        <group key={ti} position={p}>
          {/* Table top */}
          <mesh position={[0, 0.82, 0]} receiveShadow>
            <boxGeometry args={[3.6, 0.09, 1.1]} />
            <meshStandardMaterial color="#2a1505" roughness={0.75} />
          </mesh>
          {/* Legs */}
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
          {/* Desk lamp (light only, geometry removed per user request) */}
          <group position={[ti === 1 ? 0.8 : -0.8, 0.86, -0.2]}>
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
        </group>
      ))}
    </group>
  );
}

// ─── Player desk ──────────────────────────────────────────────────────────────

function PlayerDesk({ onOpenPortal }: { onOpenPortal: () => void }) {
  const lampRef = useRef<THREE.SpotLight>(null);
  const candleRef = useRef<THREE.PointLight>(null);
  const candleFlameRef = useRef<THREE.Mesh>(null);
  const bookRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.PointLight>(null);
  const [hovered, setHovered] = useState(false);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (lampRef.current) lampRef.current.intensity = 3.8 + Math.sin(t * 2.5) * 0.08;
    if (candleRef.current)
      candleRef.current.intensity = 0.55 + Math.sin(t * 8.7) * 0.14 + (Math.random() - 0.5) * 0.02;
    if (candleFlameRef.current) {
      const scale = 1 + Math.sin(t * 12) * 0.15 + (Math.random() - 0.5) * 0.1;
      candleFlameRef.current.scale.set(scale, scale * 1.2, scale);
    }
    if (bookRef.current) {
      const m = bookRef.current.material as THREE.MeshStandardMaterial;
      m.emissiveIntensity = hovered
        ? 0.6 + Math.sin(t * 5) * 0.15 + Math.sin(t * 11) * 0.08
        : 0.12 + Math.sin(t * 1.6) * 0.06;
    }
    if (glowRef.current) {
      glowRef.current.intensity = hovered
        ? 1.8 + Math.sin(t * 4) * 0.3
        : 0.3 + Math.sin(t * 1.2) * 0.1;
    }
  });

  return (
    <group position={[0, 0, 5]}>
      {/* Desk surface */}
      <mesh position={[0, 0.86, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.4, 0.1, 1.6]} />
        <meshStandardMaterial color="#321808" roughness={0.7} metalness={0.03} />
      </mesh>
      {/* Desk front panel */}
      <mesh position={[0, 0.44, 0.78]}>
        <boxGeometry args={[3.4, 0.84, 0.05]} />
        <meshStandardMaterial color="#241205" roughness={0.9} />
      </mesh>
      {/* Legs */}
      {(
        [
          [-1.58, 0.43, -0.72],
          [1.58, 0.43, -0.72],
          [-1.58, 0.43, 0.72],
          [1.58, 0.43, 0.72],
        ] as [number, number, number][]
      ).map((p, i) => (
        <mesh key={i} position={p}>
          <boxGeometry args={[0.1, 0.86, 0.1]} />
          <meshStandardMaterial color="#1a0e04" roughness={0.85} />
        </mesh>
      ))}

      {/* LARGE INVISIBLE CLICK HITBOX over entire desk */}
      <mesh
        position={[0, 0.95, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onOpenPortal();
        }}
        onPointerEnter={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerLeave={() => {
          setHovered(false);
          document.body.style.cursor = "default";
        }}
      >
        <boxGeometry args={[2.5, 0.15, 1.2]} />
        <meshStandardMaterial transparent opacity={0} />
      </mesh>

      {/* ── OPEN BOOK (portal) ── */}
      <group position={[0, 0.915, 0]}>
        {/* Cover */}
        <mesh>
          <boxGeometry args={[1.45, 0.045, 0.64]} />
          <meshStandardMaterial color="#2a0e04" roughness={0.65} />
        </mesh>
        {/* Left page */}
        <mesh position={[-0.36, 0.028, 0]}>
          <boxGeometry args={[0.68, 0.006, 0.58]} />
          <meshStandardMaterial color="#f5e6c8" roughness={0.95} />
        </mesh>
        {/* Right page — visual glow target */}
        <mesh ref={bookRef} position={[0.36, 0.028, 0]}>
          <boxGeometry args={[0.68, 0.006, 0.58]} />
          <meshStandardMaterial
            color="#f5e6c8"
            emissive="#c9a84c"
            emissiveIntensity={0.12}
            roughness={0.95}
          />
        </mesh>
        {/* Spine */}
        <mesh position={[0, 0.03, 0]}>
          <boxGeometry args={[0.05, 0.055, 0.64]} />
          <meshStandardMaterial color="#1a0804" roughness={0.8} />
        </mesh>
        {/* Hover glow light */}
        <pointLight
          ref={glowRef}
          position={[0, 0.15, 0]}
          color="#c9a84c"
          intensity={0.3}
          distance={3}
          decay={2}
        />
        {/* Hover glow only — no label (HTML button handles it) */}
      </group>

      {/* Desk lamp (light only, geometry removed per user request) */}
      <group position={[-1.15, 0.9, -0.35]}>
        <spotLight
          ref={lampRef}
          position={[0.14, 0.56, 0]}
          target-position={[0.5, 0, 0.3]}
          color="#ffe4a0"
          intensity={3.8}
          distance={5.5}
          angle={Math.PI / 4.2}
          penumbra={0.4}
          castShadow
          shadow-mapSize-width={512}
          shadow-mapSize-height={512}
        />
      </group>

      {/* Candle (right) */}
      <group position={[1.15, 0.9, -0.35]}>
        <mesh position={[0, 0.09, 0]}>
          <cylinderGeometry args={[0.035, 0.042, 0.18, 8]} />
          <meshStandardMaterial color="#f0e6c8" roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.19, 0]} ref={candleFlameRef}>
          <sphereGeometry args={[0.02, 8, 8]} />
          <meshBasicMaterial color="#ff8c00" />
        </mesh>
        <pointLight
          ref={candleRef}
          position={[0, 0.22, 0]}
          color="#ff9040"
          intensity={0.55}
          distance={3.5}
          decay={2}
        />
      </group>

      {/* Hourglass */}
      <group position={[1.18, 0.97, 0.45]}>
        {[0.19, 0, -0.02].map((y, i) => (
          <mesh key={i} position={[0, y, 0]}>
            <cylinderGeometry args={[0.075, 0.075, 0.022, 12]} />
            <meshStandardMaterial color="#8b6914" metalness={0.65} roughness={0.35} />
          </mesh>
        ))}
        <mesh position={[0, 0.06, 0]}>
          <coneGeometry args={[0.058, 0.1, 12]} />
          <meshStandardMaterial color="#f0e6c8" transparent opacity={0.45} />
        </mesh>
        <mesh position={[0, 0.14, 0]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.058, 0.1, 12]} />
          <meshStandardMaterial color="#f0e6c8" transparent opacity={0.45} />
        </mesh>
      </group>

      {/* Stacked books (back-left) */}
      <group position={[-1.1, 0.93, 0.45]}>
        {[
          { c: "#6b1a1a", y: 0 },
          { c: "#1a3a4a", y: 0.062 },
          { c: "#3d2008", y: 0.124 },
          { c: "#4a1a4a", y: 0.186 },
        ].map((b, i) => (
          <mesh key={i} position={[0, b.y, 0]}>
            <boxGeometry args={[0.38, 0.055, 0.28]} />
            <meshStandardMaterial color={b.c} roughness={0.72} />
          </mesh>
        ))}
      </group>

      {/* Quill + inkwell */}
      <group position={[1.1, 0.895, 0.5]}>
        <mesh>
          <cylinderGeometry args={[0.038, 0.045, 0.055, 10]} />
          <meshStandardMaterial color="#1a1010" roughness={0.7} />
        </mesh>
        <mesh position={[-0.1, 0.04, 0]} rotation={[0, 0, -0.55]}>
          <cylinderGeometry args={[0.007, 0.002, 0.28, 5]} />
          <meshStandardMaterial color="#f0ead8" roughness={0.9} />
        </mesh>
      </group>
    </group>
  );
}

// ─── Subject books on the right-wall shelf ────────────────────────────────────

function SubjectBooks({
  subjects,
  activeId,
  onSelect,
}: {
  subjects: SceneSubject[];
  activeId?: string | null;
  onSelect: (id: string) => void;
}) {
  const placements = useMemo(
    () =>
      subjects.map((s, i) => ({
        ...s,
        x: 10.2,
        y: 0.38 + Math.floor(i / 14) * 0.82 + 0.3,
        z: -1 - (i % 14) * 0.18,
      })),
    [subjects],
  );

  return (
    <group>
      {placements.map((p) => (
        <SubjectBook
          key={p.id}
          x={p.x}
          y={p.y}
          z={p.z}
          color={p.color}
          name={p.name}
          active={p.id === activeId}
          onClick={() => onSelect(p.id)}
        />
      ))}
    </group>
  );
}

function SubjectBook({
  x,
  y,
  z,
  color,
  name,
  active,
  onClick,
}: {
  x: number;
  y: number;
  z: number;
  color: string;
  name: string;
  active: boolean;
  onClick: () => void;
}) {
  const mRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!mRef.current) return;
    const m = mRef.current.material as THREE.MeshStandardMaterial;
    const t = clock.getElapsedTime();
    m.emissiveIntensity = active ? 0.5 : 0.1 + Math.sin(t * 1.8) * 0.04;
  });
  return (
    <group position={[x, y, z]} rotation={[0, -Math.PI / 2, 0]}>
      <mesh
        ref={mRef}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onPointerEnter={(e) => {
          e.stopPropagation();
          document.body.style.cursor = "pointer";
        }}
        onPointerLeave={() => {
          document.body.style.cursor = "default";
        }}
      >
        <boxGeometry args={[0.11, 0.62, 0.3]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.12}
          roughness={0.55}
        />
      </mesh>
      <Html position={[0, 0.44, 0]} center distanceFactor={7} occlude={false}>
        <div
          style={{
            background: "rgba(8,5,2,0.9)",
            border: "1px solid rgba(201,168,76,0.5)",
            color: "#c9a84c",
            fontFamily: "'Cinzel', serif",
            fontSize: "8px",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            padding: "2px 5px",
            borderRadius: "2px",
            whiteSpace: "nowrap",
            pointerEvents: "none",
          }}
        >
          {name}
        </div>
      </Html>
    </group>
  );
}

// ─── Dust ─────────────────────────────────────────────────────────────────────

function Dust() {
  const ref = useRef<THREE.Points>(null);
  const N = 260;
  const pos = useMemo(() => {
    const a = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      a[i * 3] = (Math.random() - 0.5) * 18;
      a[i * 3 + 1] = Math.random() * 7 + 0.3;
      a[i * 3 + 2] = -Math.random() * 14 + 5;
    }
    return a;
  }, []);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    const arr = ref.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < N; i++) {
      arr[i * 3 + 1] += 0.0013 + Math.sin(t + i) * 0.0003;
      if (arr[i * 3 + 1] > 8) arr[i * 3 + 1] = 0.2;
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
  });
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[pos, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color="#f0d890"
        size={0.022}
        transparent
        opacity={0.42}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

// ─── Atmosphere & Effects ──────────────────────────────────────────────────

function AtmosphereControl({ timerRunning }: { timerRunning?: boolean }) {
  const ambientRef = useRef<THREE.AmbientLight>(null);
  const [targetColor] = useState(() => new THREE.Color());
  const [pulseStart, setPulseStart] = useState<number | null>(null);

  // Trigger pulse when timer stops running
  useEffect(() => {
    if (!timerRunning) {
      setPulseStart(Date.now());
    }
  }, [timerRunning]);

  useFrame(({ camera, clock }) => {
    const t = clock.getElapsedTime();
    const baseFov = 56;
    const cam = camera as THREE.PerspectiveCamera;
    cam.fov = baseFov - Math.sin(t * (Math.PI * 2 / 8)) * 0.4;
    cam.updateProjectionMatrix();

    if (ambientRef.current) {
      let r = 0, g = 0, b = 0;
      if (timerRunning) {
        targetColor.set("#a86020");
      } else {
        targetColor.set("#7a5530");
        if (pulseStart && Date.now() - pulseStart < 2000) {
          const progress = (Date.now() - pulseStart) / 2000;
          const pulseInt = Math.sin(progress * Math.PI) * 0.5; // Up and down
          r += pulseInt;
          g += pulseInt * 0.8;
          b += pulseInt * 0.4;
        }
      }
      ambientRef.current.color.lerp(targetColor, 0.02);
      ambientRef.current.color.r = Math.min(1, ambientRef.current.color.r + r);
      ambientRef.current.color.g = Math.min(1, ambientRef.current.color.g + g);
      ambientRef.current.color.b = Math.min(1, ambientRef.current.color.b + b);
    }
  });

  return <ambientLight ref={ambientRef} intensity={0.65} />;
}

function CarpetShimmer() {
  const lRef = useRef<THREE.PointLight>(null);
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (lRef.current) {
      lRef.current.position.z = -2 + Math.sin(t * (Math.PI * 2 / 12)) * 6;
      lRef.current.position.x = Math.cos(t * (Math.PI * 2 / 12)) * 1.5;
    }
  });
  return (
    <pointLight ref={lRef} color="#ffb860" intensity={0.4} distance={6} decay={2} position={[0, 0.1, -2]} />
  );
}

// ─── Scene (all lighting here) ────────────────────────────────────────────────

function Scene({
  subjects,
  activeId,
  onOpenPortal,
  onSelectSubject,
  timerRunning,
}: {
  subjects: SceneSubject[];
  activeId?: string | null;
  onOpenPortal: () => void;
  onSelectSubject: (id: string) => void;
  timerRunning?: boolean;
}) {
  return (
    <>
      {/* Fog: starts at 14 — room fully visible, fades to dark at 32 */}
      <fog attach="fog" args={["#0a0703", 14, 34]} />
      <color attach="background" args={["#0a0703"]} />

      {/* ── AMBIENT (warm, enough to see everything) ── */}
      <AtmosphereControl timerRunning={timerRunning} />
      <hemisphereLight args={["#c8860a", "#2a1505", 0.48]} />

      {/* ── CHANDELIERS ── */}
      <Chandelier pos={[0, 8.2, -2]} />
      <Chandelier pos={[0, 8.2, -6.5]} />

      {/* ── BACK WALL FILL (makes bookshelves visible) ── */}
      <pointLight
        position={[-4, 5, -9]}
        color="#c87820"
        intensity={3.5}
        distance={14}
        decay={1.8}
      />
      <pointLight position={[4, 5, -9]} color="#c87820" intensity={3.5} distance={14} decay={1.8} />
      <pointLight position={[0, 3, -9]} color="#b06820" intensity={2.2} distance={10} decay={2} />

      {/* ── SIDE SHELF FILLS ── */}
      <pointLight position={[-8, 3.5, -3]} color="#a05818" intensity={1.8} distance={9} decay={2} />
      <pointLight position={[8, 3.5, -3]} color="#a05818" intensity={1.8} distance={9} decay={2} />

      {/* ── DESK AREA FILL (near camera) ── */}
      <pointLight position={[0, 3.5, 5.5]} color="#ffa040" intensity={2.8} distance={9} decay={2} />

      {/* ── CANDLE CLUSTERS on shelves ── */}
      <CandleCluster pos={[-6, 2.8, -9]} />
      <CandleCluster pos={[6, 3.5, -9]} />
      <CandleCluster pos={[-10, 2.8, -5]} />
      <CandleCluster pos={[10, 3.8, -6]} />
      <CandleCluster pos={[-10, 1.2, -2]} />
      <CandleCluster pos={[10, 1.2, -2]} />

      <Room />
      <Shelves />
      <DecoBooks />
      <StudyTables />
      <PlayerDesk onOpenPortal={onOpenPortal} />
      <SubjectBooks subjects={subjects} activeId={activeId} onSelect={onSelectSubject} />
      <Dust />
      <CarpetShimmer />
    </>
  );
}

// ─── Public export ────────────────────────────────────────────────────────────

export function LibraryScene({
  subjects,
  books,
  activeId,
  onOpenPortal,
  onSelectSubject,
  onSelectBook,
  timerRunning,
}: Props) {
  const allSubjects = subjects ?? books ?? [];
  const handleSelect = onSelectSubject ?? onSelectBook ?? (() => {});
  const handlePortal = onOpenPortal ?? (() => {});

  return (
    <Canvas
      shadows
      dpr={[1, 1.5]}
      // ── THIRD-PERSON FIXED camera, looking down into the room ──
      // Camera is above-behind your desk, looking toward the bookshelves
      // This replicates the Focustown perspective exactly
      camera={{
        position: [0, 5.8, 9.5],
        fov: 56,
        near: 0.1,
        far: 55,
      }}
      onCreated={({ camera, gl }) => {
        // Look from above-behind desk, down through the room to the shelves
        camera.lookAt(0, 1.5, -3);
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        // ── CRITICAL: exposure 1.4 — bright enough to see everything ──
        gl.toneMappingExposure = 1.4;
      }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
    >
      <Suspense fallback={null}>
        <Scene
          subjects={allSubjects}
          activeId={activeId}
          onOpenPortal={handlePortal}
          onSelectSubject={handleSelect}
          timerRunning={timerRunning}
        />
      </Suspense>
    </Canvas>
  );
}

// Backward-compat alias
export { LibraryScene as GothicLibraryScene };
