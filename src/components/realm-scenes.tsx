// Reactive 3D mini-scenes for each HIVE realm.
// Each scene accepts props that drive the world: counts light up lanterns,
// progress fills hourglasses, a `pulse` key (incremented on user actions)
// triggers a brief burst — flare, scale, sparkle bloom.
import { Canvas, useFrame, type ThreeEvent } from "@react-three/fiber";
import { Float, OrbitControls, Sparkles, Stars } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

const C = {
  midnight: "#0D1B3E",
  deepbrown: "#3B2208",
  amber: "#C8860A",
  amberHot: "#FFB347",
  forest: "#2D4A2D",
  forestLight: "#3F6B3F",
  parchment: "#F5ECD7",
  ember: "#8B2500",
  emberHot: "#FF5722",
  moon: "#C0C8D8",
  bark: "#2A1605",
  stone: "#1B1430",
};

// Reusable hook: returns 1→0 envelope each time `pulse` changes.
function usePulse(pulse: number | undefined) {
  const startRef = useRef<number | null>(null);
  const lastRef = useRef(pulse ?? 0);
  const [, force] = useState(0);
  useEffect(() => {
    if (pulse === undefined) return;
    if (pulse !== lastRef.current) {
      lastRef.current = pulse;
      startRef.current = performance.now();
      force((n) => n + 1);
    }
  }, [pulse]);
  return startRef;
}

function Drift({ strength = 1 }: { strength?: number }) {
  useFrame(({ camera, mouse, clock }) => {
    const t = clock.getElapsedTime();
    camera.position.x +=
      (mouse.x * 1.5 * strength + Math.sin(t * 0.15) * 0.3 - camera.position.x * 0.2) * 0.02;
    camera.position.y += (1.8 + mouse.y * 0.4 * strength - camera.position.y) * 0.02;
    camera.lookAt(0, 1, 0);
  });
  return null;
}

// A soft warm light that follows the cursor through the scene — gives every
// realm a feeling of "the world is reacting to you".
function CursorHalo({
  color = C.amberHot,
  intensity = 1.6,
  distance = 6,
  height = 1.6,
  reach = 4,
}: {
  color?: string;
  intensity?: number;
  distance?: number;
  height?: number;
  reach?: number;
}) {
  const ref = useRef<THREE.PointLight>(null);
  useFrame(({ mouse }) => {
    if (!ref.current) return;
    const tx = mouse.x * reach;
    const ty = height + mouse.y * 0.8;
    ref.current.position.x += (tx - ref.current.position.x) * 0.08;
    ref.current.position.y += (ty - ref.current.position.y) * 0.08;
    ref.current.position.z += (1 - ref.current.position.z) * 0.08;
  });
  return <pointLight ref={ref} color={color} intensity={intensity} distance={distance} />;
}

// Slowly rising particles — fits warm interior realms (study, books, corner).
function Embers({
  count = 80,
  color = C.amberHot,
  area = 8,
}: {
  count?: number;
  color?: string;
  area?: number;
}) {
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const a = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      a[i * 3] = (Math.random() - 0.5) * area;
      a[i * 3 + 1] = Math.random() * 4;
      a[i * 3 + 2] = (Math.random() - 0.5) * area;
    }
    return a;
  }, [count, area]);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const arr = ref.current.geometry.attributes.position.array as Float32Array;
    const t = clock.getElapsedTime();
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 1] += 0.012;
      arr[i * 3] += Math.sin(t * 0.6 + i) * 0.002;
      if (arr[i * 3 + 1] > 4.5) {
        arr[i * 3 + 1] = 0;
        arr[i * 3] = (Math.random() - 0.5) * area;
        arr[i * 3 + 2] = (Math.random() - 0.5) * area;
      }
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
  });
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color={color} size={0.05} transparent opacity={0.7} />
    </points>
  );
}

// Smoke / fog puffs — adds volume to torch corridors and candle rooms.
function Smoke({
  count = 30,
  color = "#5b4a6a",
  area = 6,
  height = 4,
}: {
  count?: number;
  color?: string;
  area?: number;
  height?: number;
}) {
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const a = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      a[i * 3] = (Math.random() - 0.5) * area;
      a[i * 3 + 1] = Math.random() * height;
      a[i * 3 + 2] = (Math.random() - 0.5) * area;
    }
    return a;
  }, [count, area, height]);
  useFrame(() => {
    if (!ref.current) return;
    const arr = ref.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 1] += 0.006;
      if (arr[i * 3 + 1] > height) arr[i * 3 + 1] = 0;
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
  });
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color={color} size={0.4} transparent opacity={0.18} depthWrite={false} />
    </points>
  );
}

function AtmosphericStars() {
  const ref = useRef<THREE.Points>(null);
  const count = 600;

  const { positions, sizes, opacities } = useMemo(() => {
    const p = new Float32Array(count * 3);
    const s = new Float32Array(count);
    const o = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      // spherical distribution
      const r = 20 + Math.random() * 30;
      const theta = 2 * Math.PI * Math.random();
      const phi = Math.acos(2 * Math.random() - 1);
      p[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      p[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      p[i * 3 + 2] = r * Math.cos(phi);
      // varied sizes and opacities
      s[i] = Math.random() > 0.9 ? 1.5 + Math.random() * 2 : Math.random() * 1.5;
      o[i] = 0.2 + Math.random() * 0.8;
    }
    return { positions: p, sizes: s, opacities: o };
  }, []);

  useFrame(({ clock, mouse }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime() * 0.05;
    ref.current.rotation.y = t * 0.5 + mouse.x * 0.15;
    ref.current.rotation.x = t * 0.2 - mouse.y * 0.15;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-size" args={[sizes, 1]} />
        <bufferAttribute attach="attributes-opacity" args={[opacities, 1]} />
      </bufferGeometry>
      {/* basic shader material to handle per-vertex opacity/size */}
      <shaderMaterial
        transparent
        depthWrite={false}
        vertexShader={`
          attribute float size;
          attribute float opacity;
          varying float vOpacity;
          void main() {
            vOpacity = opacity;
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = size * (300.0 / -mvPosition.z);
            gl_Position = projectionMatrix * mvPosition;
          }
        `}
        fragmentShader={`
          varying float vOpacity;
          void main() {
            float dist = distance(gl_PointCoord, vec2(0.5));
            if (dist > 0.5) discard;
            float strength = 1.0 - (dist * 2.0);
            gl_FragColor = vec4(1.0, 1.0, 1.0, vOpacity * strength);
          }
        `}
      />
    </points>
  );
}

function CanvasShell({
  children,
  bg = C.midnight,
  fog = true,
}: {
  children: React.ReactNode;
  bg?: string;
  fog?: boolean;
}) {
  return (
    <Canvas dpr={[1, 2]} camera={{ position: [3, 2.2, 5], fov: 45 }}>
      <color attach="background" args={[bg]} />
      {fog && <fog attach="fog" args={[bg, 5, 18]} />}
      <ambientLight intensity={0.3} color="#6a78b8" />
      <hemisphereLight args={["#3b4a8a", "#1a0f2c", 0.4]} />
      <AtmosphericStars />
      {children}
      <Drift />
      <OrbitControls
        enablePan={false}
        enableZoom={false}
        minPolarAngle={Math.PI / 3.4}
        maxPolarAngle={Math.PI / 2.1}
        autoRotate
        autoRotateSpeed={0.25}
      />
    </Canvas>
  );
}

/* ---------- PLANNER: cobblestone path with reactive lanterns ---------- */
function PathLantern({
  position,
  lit,
  pulseStart,
  onClick,
}: {
  position: [number, number, number];
  lit: boolean;
  pulseStart: React.MutableRefObject<number | null>;
  onClick?: () => void;
}) {
  const ref = useRef<THREE.PointLight>(null);
  const grp = useRef<THREE.Group>(null);
  const [hover, setHover] = useState(false);
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (ref.current && lit) {
      let i = 1.4 + Math.sin(t * 4 + position[0]) * 0.3;
      if (pulseStart.current) {
        const dt = (performance.now() - pulseStart.current) / 1000;
        if (dt < 1.2) i += (1 - dt / 1.2) * 3;
      }
      ref.current.intensity = i + (hover ? 1 : 0);
    }
    if (grp.current) {
      grp.current.rotation.z = Math.sin(t * 0.8 + position[2]) * 0.08;
    }
  });
  return (
    <Float speed={1.2} floatIntensity={0.2} rotationIntensity={0.1}>
      <group
        ref={grp}
        position={position}
        onClick={onClick}
        onPointerOver={(e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation();
          setHover(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHover(false);
          document.body.style.cursor = "auto";
        }}
      >
        <mesh position={[0, 0.4, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 0.8]} />
          <meshStandardMaterial color={C.deepbrown} />
        </mesh>
        <mesh position={[0, 0.85, 0]} scale={hover ? 1.15 : 1}>
          <boxGeometry args={[0.18, 0.22, 0.18]} />
          <meshStandardMaterial
            color={lit ? C.amberHot : "#3a3a4a"}
            emissive={lit ? C.amber : "#000"}
            emissiveIntensity={lit ? 1.5 : 0}
            transparent
            opacity={lit ? 0.9 : 0.5}
          />
        </mesh>
        {lit && <pointLight ref={ref} color={C.amberHot} intensity={1.4} distance={2.2} />}
      </group>
    </Float>
  );
}

export function PlannerScene({
  progress = 0.5,
  count = 8,
  pulse,
  onLanternClick,
}: {
  progress?: number;
  count?: number;
  pulse?: number;
  onLanternClick?: (i: number) => void;
}) {
  const pulseStart = usePulse(pulse);
  const stones = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        z: -3 + i * 0.55,
        x: Math.sin(i * 0.6) * 0.3,
      })),
    [],
  );
  const lanterns = useMemo(
    () =>
      Array.from({ length: Math.max(3, count) }, (_, i) => ({
        pos: [i % 2 === 0 ? -1.1 : 1.1, 0, -3 + i * (6 / count)] as [number, number, number],
        lit: i / count < progress,
      })),
    [count, progress],
  );
  return (
    <CanvasShell>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[14, 32]} />
        <meshStandardMaterial color={C.stone} flatShading />
      </mesh>
      {stones.map((s, i) => (
        <mesh key={i} position={[s.x, 0.02, s.z]} rotation={[-Math.PI / 2, 0, i]}>
          <circleGeometry args={[0.28, 6]} />
          <meshStandardMaterial color="#2a2440" flatShading />
        </mesh>
      ))}
      {lanterns.map((l, i) => (
        <PathLantern
          key={i}
          position={l.pos}
          lit={l.lit}
          pulseStart={pulseStart}
          onClick={() => onLanternClick?.(i)}
        />
      ))}
      <CursorHalo color={C.amberHot} intensity={2} distance={5} height={1.2} reach={2.5} />
      <Sparkles
        count={60}
        scale={[8, 3, 8]}
        position={[0, 1, 0]}
        size={2.5}
        speed={0.3}
        color={C.amberHot}
      />
    </CanvasShell>
  );
}

/* ---------- STUDY REALM: floating bookshelves, reactive glow ---------- */
function Bookshelf({ position, glow }: { position: [number, number, number]; glow: number }) {
  const colors = [C.amber, C.ember, C.forest, C.parchment, C.amberHot, C.moon];
  return (
    <Float speed={1} floatIntensity={0.3} rotationIntensity={0.05}>
      <group position={position}>
        <mesh>
          <boxGeometry args={[1.6, 1.2, 0.3]} />
          <meshStandardMaterial color={C.deepbrown} flatShading />
        </mesh>
        {[-0.35, 0.05, 0.45].map((y, row) => (
          <group key={row} position={[0, y, 0.16]}>
            {colors.map((col, i) => (
              <mesh key={i} position={[-0.6 + i * 0.22, 0, 0]}>
                <boxGeometry args={[0.18, 0.32, 0.04]} />
                <meshStandardMaterial
                  color={col}
                  emissive={col}
                  emissiveIntensity={glow * 0.6}
                  flatShading
                />
              </mesh>
            ))}
          </group>
        ))}
      </group>
    </Float>
  );
}

function RealmPulseLight({ pulse }: { pulse?: number }) {
  const pulseStart = usePulse(pulse);
  const lightRef = useRef<THREE.PointLight>(null);
  useFrame(() => {
    if (lightRef.current && pulseStart.current) {
      const dt = (performance.now() - pulseStart.current) / 1000;
      lightRef.current.intensity = dt < 1 ? 2 + (1 - dt) * 4 : 2;
    }
  });
  return (
    <pointLight ref={lightRef} position={[0, 4, 2]} color={C.amberHot} intensity={2} distance={8} />
  );
}

export function RealmScene({ confidence = 3, pulse }: { confidence?: number; pulse?: number }) {
  const glow = Math.min(1, confidence / 5);
  return (
    <CanvasShell>
      <RealmPulseLight pulse={pulse} />
      <Bookshelf position={[-2, 1.5, -1]} glow={glow} />
      <Bookshelf position={[2, 1.8, -2]} glow={glow} />
      <Bookshelf position={[0, 0.8, -3]} glow={glow} />
      <CursorHalo color={C.amberHot} intensity={1.8} distance={5} height={1.8} reach={3} />
      <Embers count={70} color={C.amberHot} area={8} />
      <Sparkles
        count={60 + glow * 80}
        scale={[10, 5, 10]}
        size={2}
        speed={0.25}
        color={C.amberHot}
      />
    </CanvasShell>
  );
}

/* ---------- FINANCE: coins, pulse spawns coin shower ---------- */
function Coin({
  position,
  delay,
  pulseStart,
}: {
  position: [number, number, number];
  delay: number;
  pulseStart: React.MutableRefObject<number | null>;
}) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime() + delay;
    ref.current.rotation.y = t * 2;
    let y = position[1] + Math.sin(t) * 0.2;
    if (pulseStart.current) {
      const dt = (performance.now() - pulseStart.current) / 1000 - delay * 0.05;
      if (dt > 0 && dt < 1) y += Math.sin(dt * Math.PI) * 0.6;
    }
    ref.current.position.y = y;
  });
  return (
    <mesh ref={ref} position={position}>
      <cylinderGeometry args={[0.2, 0.2, 0.04, 16]} />
      <meshStandardMaterial
        color={C.amberHot}
        emissive={C.amber}
        emissiveIntensity={0.6}
        metalness={0.7}
        roughness={0.3}
      />
    </mesh>
  );
}

export function FinanceScene({ pulse, count = 9 }: { pulse?: number; count?: number }) {
  const pulseStart = usePulse(pulse);
  return (
    <CanvasShell>
      <pointLight position={[0, 4, 2]} color={C.amberHot} intensity={2} distance={8} />
      {Array.from({ length: count }).map((_, i) => (
        <Coin
          key={i}
          position={[((i % 3) - 1) * 1.4, 1 + Math.floor(i / 3) * 0.7, -1 + (i % 2) * 0.5]}
          delay={i * 0.5}
          pulseStart={pulseStart}
        />
      ))}
      <CursorHalo color={C.amberHot} intensity={1.6} distance={5} height={1.6} reach={2.6} />
      <Sparkles count={40} scale={[7, 4, 7]} size={2} speed={0.3} color={C.amberHot} />
    </CanvasShell>
  );
}

/* ---------- CALORIES: hourglass with falling sand ---------- */
function FallingSand({ ratio }: { ratio: number }) {
  const ref = useRef<THREE.Points>(null);
  const N = 60;
  const positions = useMemo(() => new Float32Array(N * 3), []);
  useFrame(() => {
    if (!ref.current) return;
    const arr = ref.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < N; i++) {
      arr[i * 3 + 1] -= 0.04;
      if (arr[i * 3 + 1] < -0.4 + ratio * 0.6) {
        arr[i * 3] = (Math.random() - 0.5) * 0.05;
        arr[i * 3 + 1] = 0.4;
        arr[i * 3 + 2] = (Math.random() - 0.5) * 0.05;
      }
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
  });
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color={C.amberHot} size={0.05} />
    </points>
  );
}

export function CalorieScene({ ratio = 0.5, pulse }: { ratio?: number; pulse?: number }) {
  const pulseStart = usePulse(pulse);
  const groupRef = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (groupRef.current && pulseStart.current) {
      const dt = (performance.now() - pulseStart.current) / 1000;
      groupRef.current.rotation.z = dt < 0.6 ? Math.sin((dt / 0.6) * Math.PI) * 0.15 : 0;
    } else if (groupRef.current) {
      groupRef.current.rotation.z = Math.sin(clock.getElapsedTime() * 0.4) * 0.04;
    }
  });
  return (
    <CanvasShell>
      <pointLight position={[0, 3, 2]} color={C.amberHot} intensity={1.8} distance={8} />
      <Float speed={1.2} floatIntensity={0.3}>
        <group ref={groupRef} position={[0, 1.2, 0]}>
          <mesh>
            <coneGeometry args={[0.6, 1, 16, 1, true]} />
            <meshStandardMaterial
              color={C.parchment}
              transparent
              opacity={0.2}
              side={THREE.DoubleSide}
            />
          </mesh>
          <mesh position={[0, -1, 0]} rotation={[Math.PI, 0, 0]}>
            <coneGeometry args={[0.6, 1, 16, 1, true]} />
            <meshStandardMaterial
              color={C.parchment}
              transparent
              opacity={0.2}
              side={THREE.DoubleSide}
            />
          </mesh>
          <mesh position={[0, -1 + ratio * 0.6, 0]} rotation={[Math.PI, 0, 0]}>
            <coneGeometry args={[0.55 * ratio, 0.9 * ratio, 16]} />
            <meshStandardMaterial color={C.amberHot} emissive={C.amber} emissiveIntensity={0.6} />
          </mesh>
          <FallingSand ratio={ratio} />
        </group>
      </Float>
      <Sparkles count={30} scale={[6, 3, 6]} size={1.5} speed={0.2} color={C.amberHot} />
      <CursorHalo color={C.amberHot} intensity={1.4} distance={4} height={1.6} reach={2.2} />
    </CanvasShell>
  );
}

/* ---------- MUSIC: vinyls, click to spin faster, pulse on add ---------- */
function Vinyl({
  position,
  baseSpeed,
  pulseStart,
}: {
  position: [number, number, number];
  baseSpeed: number;
  pulseStart: React.MutableRefObject<number | null>;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const [boost, setBoost] = useState(0);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const decay = boost > 0 ? boost * 0.97 : 0;
    setBoost(decay);
    let s = baseSpeed + decay;
    if (pulseStart.current) {
      const dt = (performance.now() - pulseStart.current) / 1000;
      if (dt < 1) s += (1 - dt) * 4;
    }
    ref.current.rotation.z += s * 0.02;
    ref.current.position.y = position[1] + Math.sin(clock.getElapsedTime() + position[0]) * 0.05;
  });
  return (
    <Float speed={1} floatIntensity={0.3}>
      <group
        position={position}
        onClick={(e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation();
          setBoost(5);
        }}
        onPointerOver={() => (document.body.style.cursor = "pointer")}
        onPointerOut={() => (document.body.style.cursor = "auto")}
      >
        <mesh ref={ref}>
          <cylinderGeometry args={[0.5, 0.5, 0.03, 32]} />
          <meshStandardMaterial color="#0a0a0a" metalness={0.5} roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.02, 0]}>
          <cylinderGeometry args={[0.15, 0.15, 0.04, 16]} />
          <meshStandardMaterial color={C.ember} emissive={C.ember} emissiveIntensity={0.4} />
        </mesh>
      </group>
    </Float>
  );
}

export function MusicScene({ count = 3, pulse }: { count?: number; pulse?: number }) {
  const pulseStart = usePulse(pulse);
  const positions = useMemo(
    () =>
      Array.from({ length: Math.max(3, Math.min(8, count)) }, (_, i) => ({
        pos: [Math.cos(i * 1.3) * 1.8, 1 + (i % 2) * 0.6, -1 + Math.sin(i) * 0.6] as [
          number,
          number,
          number,
        ],
        speed: 1 + (i % 3) * 0.5,
      })),
    [count],
  );
  return (
    <CanvasShell>
      <pointLight position={[0, 3, 3]} color={C.amberHot} intensity={1.6} distance={8} />
      {positions.map((v, i) => (
        <Vinyl key={i} position={v.pos} baseSpeed={v.speed} pulseStart={pulseStart} />
      ))}
      <CursorHalo color={C.ember} intensity={1.5} distance={5} height={1.6} reach={2.6} />
      <Smoke count={20} color="#3a1a3a" area={6} height={4} />
      <Sparkles count={50} scale={[8, 4, 8]} size={2} speed={0.3} color={C.amberHot} />
    </CanvasShell>
  );
}

/* ---------- MOVIES: cinema tickets pinned in the air ---------- */
function Ticket({
  position,
  rot,
  pulseStart,
  delay,
}: {
  position: [number, number, number];
  rot: number;
  pulseStart: React.MutableRefObject<number | null>;
  delay: number;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const [hover, setHover] = useState(false);
  useFrame(() => {
    if (!ref.current) return;
    let s = hover ? 1.15 : 1;
    if (pulseStart.current) {
      const dt = (performance.now() - pulseStart.current) / 1000 - delay;
      if (dt > 0 && dt < 0.6) s += Math.sin((dt / 0.6) * Math.PI) * 0.3;
    }
    ref.current.scale.setScalar(s);
  });
  return (
    <Float speed={1.2} floatIntensity={0.4} rotationIntensity={0.15}>
      <mesh
        ref={ref}
        position={position}
        rotation={[0, rot, 0.05]}
        onPointerOver={(e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation();
          setHover(true);
        }}
        onPointerOut={() => setHover(false)}
      >
        <boxGeometry args={[0.9, 0.4, 0.02]} />
        <meshStandardMaterial color={C.parchment} flatShading />
      </mesh>
    </Float>
  );
}

export function MovieScene({ count = 5, pulse }: { count?: number; pulse?: number }) {
  const pulseStart = usePulse(pulse);
  return (
    <CanvasShell>
      <pointLight position={[2, 3, 2]} color={C.ember} intensity={1.8} distance={8} />
      <pointLight position={[-2, 2, 1]} color={C.amberHot} intensity={1.2} distance={6} />
      {/* Projector beam — a soft cone of warm light cutting through dust */}
      <mesh position={[0, 1.6, 1.2]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[1.2, 3, 24, 1, true]} />
        <meshBasicMaterial
          color={C.amberHot}
          transparent
          opacity={0.06}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      {Array.from({ length: Math.max(3, Math.min(12, count)) }).map((_, i) => (
        <Ticket
          key={i}
          position={[((i % 4) - 1.5) * 1.1, 1.3 + Math.floor(i / 4) * 0.7, -1]}
          rot={(Math.random() - 0.5) * 0.3}
          pulseStart={pulseStart}
          delay={i * 0.05}
        />
      ))}
      <CursorHalo color={C.amberHot} intensity={1.4} distance={5} height={1.6} reach={2.5} />
      <Smoke count={30} color="#2a1a3a" area={5} height={3.5} />
      <Sparkles count={40} scale={[8, 4, 8]} size={2} speed={0.3} color={C.amberHot} />
    </CanvasShell>
  );
}

/* ---------- BOOKS: floating tomes, glow with read progress ---------- */
function Tome({
  position,
  color,
  progress,
}: {
  position: [number, number, number];
  color: string;
  progress: number;
}) {
  return (
    <Float speed={1.1} floatIntensity={0.4} rotationIntensity={0.3}>
      <mesh position={position}>
        <boxGeometry args={[0.6, 0.85, 0.18]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={progress * 0.8}
          flatShading
        />
      </mesh>
    </Float>
  );
}

export function BookScene({
  progress = 0.4,
  count = 6,
  pulse,
}: {
  progress?: number;
  count?: number;
  pulse?: number;
}) {
  const pulseStart = usePulse(pulse);
  const lightRef = useRef<THREE.PointLight>(null);
  useFrame(() => {
    if (lightRef.current && pulseStart.current) {
      const dt = (performance.now() - pulseStart.current) / 1000;
      lightRef.current.intensity = dt < 1 ? 2 + (1 - dt) * 3 : 2;
    }
  });
  const books = useMemo(
    () =>
      Array.from({ length: Math.max(3, Math.min(10, count)) }, (_, i) => ({
        pos: [((i % 3) - 1) * 1.4, 1.2 + Math.floor(i / 3) * 0.8, -1] as [number, number, number],
        col: [C.amber, C.ember, C.forest, C.moon, C.amberHot, C.parchment][i % 6],
      })),
    [count],
  );
  return (
    <CanvasShell>
      <pointLight
        ref={lightRef}
        position={[0, 4, 2]}
        color={C.amberHot}
        intensity={2}
        distance={8}
      />
      {books.map((b, i) => (
        <Tome key={i} position={b.pos} color={b.col} progress={progress} />
      ))}
      <CursorHalo color={C.amberHot} intensity={1.5} distance={5} height={1.8} reach={2.6} />
      <Embers count={50} color={C.amberHot} area={7} />
      <Sparkles
        count={40 + progress * 60}
        scale={[8, 4, 8]}
        size={2}
        speed={0.3}
        color={C.amberHot}
      />
    </CanvasShell>
  );
}

/* ---------- CORNER: potion bottles, click to bubble, pulse on level up ---------- */
function Potion({
  position,
  color,
  pulseStart,
  delay,
}: {
  position: [number, number, number];
  color: string;
  pulseStart: React.MutableRefObject<number | null>;
  delay: number;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const [bubble, setBubble] = useState(0);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const decay = bubble > 0 ? bubble * 0.95 : 0;
    setBubble(decay);
    let s = 1 + decay * 0.2 + Math.sin(clock.getElapsedTime() * 2 + position[0]) * 0.04;
    if (pulseStart.current) {
      const dt = (performance.now() - pulseStart.current) / 1000 - delay;
      if (dt > 0 && dt < 1) s += Math.sin(dt * Math.PI) * 0.3;
    }
    ref.current.scale.setScalar(s);
  });
  return (
    <Float speed={1.4} floatIntensity={0.4} rotationIntensity={0.2}>
      <group
        position={position}
        onClick={(e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation();
          setBubble(2);
        }}
        onPointerOver={() => (document.body.style.cursor = "pointer")}
        onPointerOut={() => (document.body.style.cursor = "auto")}
      >
        <mesh ref={ref}>
          <sphereGeometry args={[0.3, 16, 16]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.5}
            transparent
            opacity={0.85}
          />
        </mesh>
        <mesh position={[0, 0.35, 0]}>
          <cylinderGeometry args={[0.08, 0.1, 0.2]} />
          <meshStandardMaterial color={C.deepbrown} />
        </mesh>
      </group>
    </Float>
  );
}

export function CornerScene({ level = 1, pulse }: { level?: number; pulse?: number }) {
  const pulseStart = usePulse(pulse);
  const potions = [
    { pos: [-1.5, 1.3, 0] as [number, number, number], color: C.amber },
    { pos: [0, 1.7, -1] as [number, number, number], color: C.forest },
    { pos: [1.5, 1.2, 0] as [number, number, number], color: C.ember },
    { pos: [-0.7, 1, -1.5] as [number, number, number], color: C.moon },
    { pos: [0.8, 1.5, -1.5] as [number, number, number], color: C.amberHot },
  ];
  return (
    <CanvasShell>
      <pointLight
        position={[0, 3, 2]}
        color={C.amberHot}
        intensity={2 + level * 0.2}
        distance={8}
      />
      {potions.map((p, i) => (
        <Potion key={i} position={p.pos} color={p.color} pulseStart={pulseStart} delay={i * 0.08} />
      ))}
      <CursorHalo color={C.forestLight} intensity={1.6} distance={5} height={1.6} reach={2.5} />
      <Embers count={50} color={C.forestLight} area={7} />
      <Sparkles
        count={60 + level * 20}
        scale={[8, 4, 8]}
        size={2.5}
        speed={0.3}
        color={C.amberHot}
      />
    </CanvasShell>
  );
}
