// DiaryScene.tsx — Vintage writing desk 3D background for Diary page
import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense, useMemo, useRef } from "react";
import * as THREE from "three";

function Candle({
  pos,
  height = 0.28,
  color = "#ff9040",
  intensity = 1.2,
}: {
  pos: [number, number, number];
  height?: number;
  color?: string;
  intensity?: number;
}) {
  const lRef = useRef<THREE.PointLight>(null);
  useFrame(({ clock }) => {
    if (!lRef.current) return;
    const t = clock.getElapsedTime();
    lRef.current.intensity =
      intensity +
      Math.sin(t * 9.1 + pos[0]) * 0.22 +
      Math.sin(t * 14.7 + pos[2]) * 0.09 +
      (Math.random() - 0.5) * 0.06;
  });
  return (
    <group position={pos}>
      <mesh position={[0, height / 2, 0]}>
        <cylinderGeometry args={[0.038, 0.045, height, 10]} />
        <meshStandardMaterial color="#f5edd8" roughness={0.85} />
      </mesh>
      <mesh position={[0, height + 0.04, 0]}>
        <coneGeometry args={[0.014, 0.055, 8]} />
        <meshStandardMaterial
          color="#ffcc44"
          emissive="#ff8800"
          emissiveIntensity={2.2}
          transparent
          opacity={0.9}
        />
      </mesh>
      <pointLight
        ref={lRef}
        position={[0, height + 0.08, 0]}
        color={color}
        intensity={intensity}
        distance={5.5}
        decay={2}
      />
    </group>
  );
}

function CandleHolder({ pos }: { pos: [number, number, number] }) {
  return (
    <group position={pos}>
      <mesh position={[0, 0.018, 0]}>
        <cylinderGeometry args={[0.088, 0.1, 0.036, 14]} />
        <meshStandardMaterial color="#7a5a18" metalness={0.7} roughness={0.35} />
      </mesh>
      <Candle pos={[0, 0.054, 0]} height={0.21} />
    </group>
  );
}

function InkBottle({ pos, color = "#1a0a2e" }: { pos: [number, number, number]; color?: string }) {
  return (
    <group position={pos}>
      <mesh position={[0, 0.065, 0]}>
        <cylinderGeometry args={[0.04, 0.05, 0.13, 10]} />
        <meshStandardMaterial color={color} roughness={0.2} transparent opacity={0.85} />
      </mesh>
      <mesh position={[0, 0.145, 0]}>
        <cylinderGeometry args={[0.018, 0.038, 0.04, 8]} />
        <meshStandardMaterial color={color} roughness={0.2} transparent opacity={0.85} />
      </mesh>
      <mesh position={[0, 0.168, 0]}>
        <cylinderGeometry args={[0.022, 0.022, 0.018, 8]} />
        <meshStandardMaterial color="#1a0e04" roughness={0.8} />
      </mesh>
    </group>
  );
}

function Quill({ pos, ry = 0 }: { pos: [number, number, number]; ry?: number }) {
  return (
    <group position={pos} rotation={[0, ry, 0]}>
      <mesh rotation={[0, 0, -0.4]} position={[0.05, 0.08, 0]}>
        <cylinderGeometry args={[0.007, 0.003, 0.32, 5]} />
        <meshStandardMaterial color="#f5ecd8" roughness={0.85} />
      </mesh>
      <mesh rotation={[0.3, 0, -0.5]} position={[0.02, 0.15, 0]}>
        <planeGeometry args={[0.06, 0.14]} />
        <meshStandardMaterial
          color="#f0e6cc"
          roughness={0.9}
          side={THREE.DoubleSide}
          transparent
          opacity={0.85}
        />
      </mesh>
    </group>
  );
}

function WritingDesk() {
  return (
    <group position={[0, 0, 4.5]}>
      <mesh position={[0, 0.82, 0]} receiveShadow>
        <boxGeometry args={[5.5, 0.1, 2.2]} />
        <meshStandardMaterial color="#2e1508" roughness={0.72} metalness={0.03} />
      </mesh>
      <mesh position={[0, 0.42, 1.08]}>
        <boxGeometry args={[5.5, 0.78, 0.06]} />
        <meshStandardMaterial color="#21100a" roughness={0.9} />
      </mesh>
      {(
        [
          [-2.6, 0.41, -0.95],
          [2.6, 0.41, -0.95],
          [-2.6, 0.41, 0.95],
          [2.6, 0.41, 0.95],
        ] as [number, number, number][]
      ).map((p, i) => (
        <mesh key={i} position={p}>
          <boxGeometry args={[0.12, 0.84, 0.12]} />
          <meshStandardMaterial color="#180e04" roughness={0.88} />
        </mesh>
      ))}
      <CandleHolder pos={[-1.8, 0.876, 0.3]} />
      <Candle pos={[1.9, 0.876, -0.2]} height={0.19} color="#ffb050" intensity={1.0} />
      <InkBottle pos={[1.3, 0.876, 0.45]} color="#1a0a2e" />
      <Quill pos={[1.4, 0.876, 0.5]} ry={0.3} />
      <mesh position={[-0.9, 0.878, 0.55]} rotation={[-Math.PI / 2, 0, 0.15]}>
        <planeGeometry args={[0.52, 0.4]} />
        <meshStandardMaterial color="#2a0e04" roughness={0.75} />
      </mesh>
    </group>
  );
}

function BackRoom() {
  const decoBooks = useMemo(() => {
    const out: { pos: [number, number, number]; color: string; w: number; h: number }[] = [];
    const COLORS = [
      "#6b1a1a",
      "#1a3a1a",
      "#1a1a5c",
      "#5c3a1a",
      "#4a1a4a",
      "#6b5010",
      "#8b4010",
      "#2d4a1a",
    ];
    for (let row = 0; row < 4; row++) {
      const y = 0.4 + row * 0.62;
      let x = -7.5;
      while (x < 7.5) {
        const w = 0.06 + Math.random() * 0.07;
        const h = 0.38 + Math.random() * 0.2;
        out.push({
          pos: [x + w / 2, y + h / 2, -7.8],
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          w,
          h,
        });
        x += w + 0.008;
      }
    }
    return out;
  }, []);

  return (
    <group>
      <mesh position={[0, 4, -8]}>
        <planeGeometry args={[18, 9]} />
        <meshStandardMaterial color="#1a0d05" roughness={1} />
      </mesh>
      {[0, 1, 2, 3].map((r) => (
        <mesh key={r} position={[0, 0.38 + r * 0.62 - 0.02, -7.82]}>
          <boxGeometry args={[16, 0.04, 0.28]} />
          <meshStandardMaterial color="#2a1406" roughness={0.88} />
        </mesh>
      ))}
      {decoBooks.map((b, i) => (
        <mesh key={i} position={b.pos}>
          <boxGeometry args={[b.w, b.h, 0.22]} />
          <meshStandardMaterial color={b.color} roughness={0.65} />
        </mesh>
      ))}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -2]}>
        <planeGeometry args={[18, 18]} />
        <meshStandardMaterial color="#1e0e05" roughness={0.92} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 1]}>
        <planeGeometry args={[5, 8]} />
        <meshStandardMaterial color="#4a1a18" roughness={0.92} />
      </mesh>
      <mesh rotation={[0, Math.PI / 2, 0]} position={[-9, 4, -2]}>
        <planeGeometry args={[14, 9]} />
        <meshStandardMaterial color="#180c04" roughness={1} />
      </mesh>
      <mesh rotation={[0, -Math.PI / 2, 0]} position={[9, 4, -2]}>
        <planeGeometry args={[14, 9]} />
        <meshStandardMaterial color="#180c04" roughness={1} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 8.5, -2]}>
        <planeGeometry args={[18, 14]} />
        <meshStandardMaterial color="#0a0603" roughness={1} />
      </mesh>
      <Candle pos={[-5.5, 3.15, -7.6]} height={0.16} color="#ffaa40" intensity={0.7} />
      <Candle pos={[4.2, 2.55, -7.6]} height={0.19} color="#ffaa40" intensity={0.6} />
    </group>
  );
}

function DustMotes() {
  const ref = useRef<THREE.Points>(null);
  const N = 150;
  const pos = useMemo(() => {
    const a = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      a[i * 3] = (Math.random() - 0.5) * 10;
      a[i * 3 + 1] = Math.random() * 5 + 0.5;
      a[i * 3 + 2] = -Math.random() * 10 + 5;
    }
    return a;
  }, []);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    const arr = ref.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < N; i++) {
      arr[i * 3 + 1] += 0.001 + Math.sin(t * 0.3 + i) * 0.0004;
      arr[i * 3] += Math.sin(t * 0.2 + i * 0.5) * 0.0006;
      if (arr[i * 3 + 1] > 6) arr[i * 3 + 1] = 0.3;
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
  });
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[pos, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color="#f5d880"
        size={0.018}
        transparent
        opacity={0.38}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

function Scene() {
  return (
    <>
      <fog attach="fog" args={["#0d0804", 10, 28]} />
      <color attach="background" args={["#0d0804"]} />
      <ambientLight color="#7a4a20" intensity={0.38} />
      <hemisphereLight args={["#b87030", "#1a0e04", 0.32]} />
      <pointLight
        position={[-4, 4, -7]}
        color="#c87020"
        intensity={2.8}
        distance={12}
        decay={1.9}
      />
      <pointLight position={[4, 4, -7]} color="#c87020" intensity={2.8} distance={12} decay={1.9} />
      <pointLight position={[0, 3.2, 5]} color="#ffa040" intensity={2.2} distance={8} decay={2} />
      <BackRoom />
      <WritingDesk />
      <DustMotes />
    </>
  );
}

// ─── Exported Component ───────────────────────────────────────────────────────

export function DiaryScene({ pulse }: { pulse?: number }) {
  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: [0, 6, 8], fov: 38, near: 0.1, far: 40 }}
      onCreated={({ camera, gl }) => {
        camera.lookAt(0, 0.8, 2);
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.2;
      }}
      gl={{ antialias: true }}
      style={{ position: "absolute", inset: 0 }}
    >
      <Suspense fallback={null}>
        <Scene />
      </Suspense>
    </Canvas>
  );
}
