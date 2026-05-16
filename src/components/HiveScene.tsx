import { Canvas, useFrame } from "@react-three/fiber";
import { Float, OrbitControls, Sparkles, Stars } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";

// Color palette (mirrors src/styles.css)
const C = {
  midnight: "#0D1B3E",
  deepbrown: "#3B2208",
  amber: "#C8860A",
  amberHot: "#FFB347",
  forest: "#2D4A2D",
  forestLight: "#3F6B3F",
  parchment: "#F5ECD7",
  roof: "#5A2E0F",
  bark: "#2A1605",
  leaf: "#365E37",
  stone: "#1B1430",
  ember: "#8B2500",
  moon: "#C0C8D8",
};

function Lantern({ position }: { position: [number, number, number] }) {
  const light = useRef<THREE.PointLight>(null);
  useFrame(({ clock }) => {
    if (light.current) {
      const t = clock.getElapsedTime();
      light.current.intensity = 1.6 + Math.sin(t * 4 + position[0]) * 0.25;
    }
  });
  return (
    <Float speed={1.4} rotationIntensity={0.2} floatIntensity={0.35}>
      <group position={position}>
        <mesh position={[0, 0.18, 0]}>
          <cylinderGeometry args={[0.005, 0.005, 0.4]} />
          <meshStandardMaterial color={C.deepbrown} />
        </mesh>
        <mesh>
          <boxGeometry args={[0.18, 0.22, 0.18]} />
          <meshStandardMaterial
            color={C.amberHot}
            emissive={C.amber}
            emissiveIntensity={1.2}
            transparent
            opacity={0.85}
          />
        </mesh>
        <mesh position={[0, 0.13, 0]}>
          <boxGeometry args={[0.22, 0.04, 0.22]} />
          <meshStandardMaterial color={C.deepbrown} />
        </mesh>
        <pointLight ref={light} color={C.amberHot} intensity={1.6} distance={2.2} decay={2} />
      </group>
    </Float>
  );
}

function Treehouse() {
  return (
    <group position={[0, 0, 0]}>
      {/* trunk */}
      <mesh position={[0, 0.9, 0]} castShadow>
        <cylinderGeometry args={[0.32, 0.45, 1.8, 8]} />
        <meshStandardMaterial color={C.bark} flatShading />
      </mesh>
      {/* roots */}
      {[0, 1, 2, 3].map((i) => {
        const a = (i / 4) * Math.PI * 2;
        return (
          <mesh
            key={i}
            position={[Math.cos(a) * 0.3, 0.05, Math.sin(a) * 0.3]}
            rotation={[0, -a, Math.PI / 2.4]}
          >
            <coneGeometry args={[0.15, 0.5, 5]} />
            <meshStandardMaterial color={C.bark} flatShading />
          </mesh>
        );
      })}
      {/* house body */}
      <mesh position={[0, 1.85, 0]} castShadow>
        <boxGeometry args={[1.4, 0.9, 1.2]} />
        <meshStandardMaterial color={C.deepbrown} flatShading />
      </mesh>
      {/* roof */}
      <mesh position={[0, 2.55, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[1.1, 0.8, 4]} />
        <meshStandardMaterial color={C.roof} flatShading />
      </mesh>
      {/* glowing window */}
      <mesh position={[0, 1.85, 0.61]}>
        <planeGeometry args={[0.5, 0.45]} />
        <meshStandardMaterial color={C.amberHot} emissive={C.amber} emissiveIntensity={2} />
      </mesh>
      <pointLight position={[0, 1.9, 0.9]} color={C.amberHot} intensity={2.2} distance={3} />
      {/* tiny door */}
      <mesh position={[0.5, 1.7, 0.61]}>
        <planeGeometry args={[0.18, 0.32]} />
        <meshStandardMaterial color={C.bark} />
      </mesh>
      {/* canopy of leaves */}
      {[
        [0, 3.1, 0, 1.1],
        [-0.7, 2.9, 0.3, 0.7],
        [0.6, 2.95, -0.2, 0.75],
        [0.2, 3.3, 0.5, 0.6],
        [-0.4, 3.25, -0.4, 0.65],
      ].map(([x, y, z, s], i) => (
        <mesh key={i} position={[x as number, y as number, z as number]}>
          <icosahedronGeometry args={[s as number, 0]} />
          <meshStandardMaterial color={i % 2 ? C.leaf : C.forestLight} flatShading />
        </mesh>
      ))}
      {/* hanging lanterns */}
      <Lantern position={[-0.85, 2.2, 0.55]} />
      <Lantern position={[0.85, 2.15, 0.55]} />
      <Lantern position={[0, 2.6, 0.7]} />
    </group>
  );
}

function Hill({
  position,
  scale,
  color,
}: {
  position: [number, number, number];
  scale: number;
  color: string;
}) {
  return (
    <mesh position={position} receiveShadow>
      <sphereGeometry args={[scale, 12, 8]} />
      <meshStandardMaterial color={color} flatShading />
    </mesh>
  );
}

function Ground() {
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <circleGeometry args={[14, 32]} />
        <meshStandardMaterial color={C.stone} flatShading />
      </mesh>
      <Hill position={[-3.5, -0.4, -1.5]} scale={1.6} color={C.forest} />
      <Hill position={[3.8, -0.5, -1]} scale={1.8} color={C.forest} />
      <Hill position={[-5, -0.8, -3.5]} scale={2.2} color={C.midnight} />
      <Hill position={[5, -1, -4]} scale={2.4} color={C.midnight} />
      <Hill position={[0, -1.2, -5.5]} scale={3} color={C.midnight} />
    </>
  );
}

function Books() {
  // little stack of pixel-y books in the foreground
  const colors = [C.amber, C.ember, C.forest, C.parchment];
  return (
    <group position={[1.6, 0.05, 1.4]} rotation={[0, -0.4, 0]}>
      {colors.map((c, i) => (
        <mesh key={i} position={[0, 0.06 + i * 0.12, 0]} rotation={[0, i * 0.06, 0]}>
          <boxGeometry args={[0.5, 0.11, 0.35]} />
          <meshStandardMaterial color={c} flatShading />
        </mesh>
      ))}
    </group>
  );
}

function PathStones() {
  const stones = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => ({
        z: 1 + i * 0.6,
        x: Math.sin(i * 0.9) * 0.25,
      })),
    [],
  );
  return (
    <>
      {stones.map((s, i) => (
        <mesh key={i} position={[s.x, 0.02, s.z]} rotation={[-Math.PI / 2, 0, i]}>
          <circleGeometry args={[0.2, 6]} />
          <meshStandardMaterial color="#2a2440" flatShading />
        </mesh>
      ))}
    </>
  );
}

function Moon() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.position.y = 5 + Math.sin(clock.getElapsedTime() * 0.3) * 0.1;
    }
  });
  return (
    <mesh ref={ref} position={[-4, 5, -8]}>
      <sphereGeometry args={[0.9, 24, 24]} />
      <meshStandardMaterial color={C.moon} emissive={C.moon} emissiveIntensity={0.6} />
    </mesh>
  );
}

function SceneCamera() {
  useFrame(({ camera, mouse, clock }) => {
    const t = clock.getElapsedTime();
    const targetX = mouse.x * 0.6 + Math.sin(t * 0.2) * 0.15;
    const targetY = 2.4 + mouse.y * 0.25;
    camera.position.x += (targetX * 5 - camera.position.x) * 0.03;
    camera.position.y += (targetY - camera.position.y) * 0.03;
    camera.lookAt(0, 1.6, 0);
  });
  return null;
}

export function HiveScene() {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [4, 2.6, 5.5], fov: 42 }}
      gl={{ antialias: true }}
    >
      <color attach="background" args={[C.midnight]} />
      <fog attach="fog" args={[C.midnight, 6, 18]} />

      <ambientLight intensity={0.25} color="#6a78b8" />
      <directionalLight position={[-3, 6, 2]} intensity={0.5} color={C.moon} castShadow />
      <hemisphereLight args={["#3b4a8a", "#1a0f2c", 0.5]} />

      <Stars radius={40} depth={20} count={1200} factor={3} fade speed={0.6} />
      <Moon />

      <Ground />
      <Treehouse />
      <PathStones />
      <Books />

      {/* fireflies */}
      <Sparkles
        count={60}
        scale={[7, 4, 7]}
        position={[0, 1.8, 0]}
        size={3}
        speed={0.35}
        color={C.amberHot}
      />
      <Sparkles
        count={30}
        scale={[10, 6, 10]}
        position={[0, 3, -2]}
        size={1.6}
        speed={0.2}
        color={C.moon}
      />

      <SceneCamera />
      <OrbitControls
        enablePan={false}
        enableZoom={false}
        minPolarAngle={Math.PI / 3.2}
        maxPolarAngle={Math.PI / 2.05}
        autoRotate
        autoRotateSpeed={0.35}
      />
    </Canvas>
  );
}
