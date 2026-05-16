// WallDecor.tsx — Posters, vinyl records, pinboard, disco ball, wall clock, mirror
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { getDenTextures } from "./ProceduralTextures";

function Poster({
  pos,
  size,
  color,
  rot = [0, 0, 0],
  tilt = 0,
}: {
  pos: [number, number, number];
  size: [number, number];
  color: string;
  rot?: [number, number, number];
  tilt?: number;
}) {
  return (
    <group position={pos} rotation={[rot[0], rot[1], rot[2] + tilt]}>
      <mesh>
        <planeGeometry args={size} />
        <meshBasicMaterial color={color} />
      </mesh>
      {/* Thin frame */}
      <mesh position={[0, 0, -0.005]}>
        <boxGeometry args={[size[0] + 0.04, size[1] + 0.04, 0.01]} />
        <meshStandardMaterial color="#0a0604" roughness={0.9} />
      </mesh>
    </group>
  );
}

function VinylRecord({ pos, labelColor }: { pos: [number, number, number]; labelColor: string }) {
  return (
    <group position={pos} rotation={[0, 0, (Math.random() - 0.5) * 0.2]}>
      <mesh>
        <cylinderGeometry args={[0.22, 0.22, 0.012, 32]} />
        <meshStandardMaterial color="#0a0808" roughness={0.15} metalness={0.25} />
      </mesh>
      <mesh position={[0, 0.008, 0]}>
        <cylinderGeometry args={[0.07, 0.07, 0.014, 16]} />
        <meshStandardMaterial color={labelColor} roughness={0.6} />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.015, 0.015, 0.02, 8]} />
        <meshStandardMaterial color="#2a2020" roughness={0.8} />
      </mesh>
    </group>
  );
}

function Pinboard({ pos }: { pos: [number, number, number] }) {
  const notes = [
    { x: -0.8, y: 0.4, rot: 0.06, w: 0.22, h: 0.18, color: "#f0e0c0", pin: "#c03020" },
    { x: -0.3, y: -0.2, rot: -0.1, w: 0.2, h: 0.15, color: "#e8e0a0", pin: "#e8a020" },
    { x: 0.4, y: 0.5, rot: 0.04, w: 0.25, h: 0.2, color: "#e0e8d8", pin: "#2060c0" },
    { x: 0.7, y: -0.1, rot: -0.08, w: 0.18, h: 0.14, color: "#f0e0c0", pin: "#30a040" },
    { x: -0.5, y: 0.0, rot: 0.12, w: 0.28, h: 0.22, color: "#d8c8a0", pin: "#c03020" },
    { x: 0.1, y: 0.3, rot: -0.02, w: 0.24, h: 0.18, color: "#f0e0c0", pin: "#e8a020" },
    { x: -0.9, y: -0.4, rot: 0.05, w: 0.2, h: 0.16, color: "#e8d0b0", pin: "#2060c0" },
    { x: 0.8, y: 0.3, rot: -0.06, w: 0.22, h: 0.2, color: "#d8d0b8", pin: "#30a040" },
  ];
  const photos = [
    { x: -0.1, y: -0.5, rot: 0.03, w: 0.24, h: 0.18, color: "#3a2818" },
    { x: 0.5, y: -0.4, rot: -0.04, w: 0.2, h: 0.15, color: "#1a2830" },
    { x: -0.6, y: 0.5, rot: 0.08, w: 0.22, h: 0.16, color: "#2a1818" },
    { x: 0.3, y: -0.6, rot: -0.06, w: 0.18, h: 0.14, color: "#281a28" },
  ];

  return (
    <group position={pos}>
      {/* Cork board */}
      <mesh>
        <boxGeometry args={[2.6, 1.6, 0.06]} />
        <meshStandardMaterial map={getDenTextures().cork} color="#5a3818" roughness={0.98} />
      </mesh>
      {/* Notes */}
      {notes.map((n, i) => (
        <group key={`n-${i}`} position={[n.x, n.y, 0.035]} rotation={[0, 0, n.rot]}>
          <mesh>
            <planeGeometry args={[n.w, n.h]} />
            <meshStandardMaterial color={n.color} roughness={0.95} />
          </mesh>
          <mesh position={[0, n.h / 2 - 0.02, 0.005]}>
            <cylinderGeometry args={[0.008, 0.008, 0.02, 8]} />
            <meshStandardMaterial color={n.pin} roughness={0.5} metalness={0.3} />
          </mesh>
        </group>
      ))}
      {/* Photos */}
      {photos.map((p, i) => (
        <group key={`p-${i}`} position={[p.x, p.y, 0.033]} rotation={[0, 0, p.rot]}>
          <mesh>
            <planeGeometry args={[p.w, p.h]} />
            <meshStandardMaterial color={p.color} roughness={0.85} />
          </mesh>
        </group>
      ))}
      {/* Strings between some pins */}
      <mesh position={[-0.55, 0.2, 0.04]}>
        <cylinderGeometry args={[0.002, 0.002, 0.8, 4]} />
        <meshStandardMaterial color="#8a6030" roughness={0.9} />
      </mesh>
    </group>
  );
}

function DiscoBall({ pos }: { pos: [number, number, number] }) {
  const ref = useRef<THREE.Mesh>(null);
  const dotRefs = useRef<THREE.PointLight[]>([]);
  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.y += 0.002;
    const t = clock.getElapsedTime();
    dotRefs.current.forEach((d, i) => {
      if (!d) return;
      const a = t * 0.3 + (i / 4) * Math.PI * 2;
      d.position.set(
        pos[0] + Math.cos(a) * 3.5,
        pos[1] - 2 + Math.sin(a * 0.7) * 1.5,
        pos[2] + Math.sin(a) * 3.5,
      );
      d.intensity = 0.15 + Math.sin(t * 2 + i) * 0.08;
    });
  });
  return (
    <group position={pos}>
      <mesh position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.002, 0.002, 0.8, 4]} />
        <meshStandardMaterial color="#1a1a1a" roughness={1} />
      </mesh>
      <mesh ref={ref}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial color="#d0d8d0" metalness={0.95} roughness={0.05} />
      </mesh>
      {/* Reflected light dots on walls */}
      {[0, 1, 2, 3].map((i) => (
        <pointLight
          key={`dot-${i}`}
          ref={(el) => {
            if (el) dotRefs.current[i] = el;
          }}
          color="#FFE8D0"
          intensity={0.15}
          distance={2}
          decay={2}
        />
      ))}
    </group>
  );
}

function WallClock({ pos }: { pos: [number, number, number] }) {
  const hourRef = useRef<THREE.Mesh>(null);
  const minRef = useRef<THREE.Mesh>(null);
  const secRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    const now = new Date();
    if (hourRef.current)
      hourRef.current.rotation.z = -(
        ((now.getHours() % 12) / 12) * Math.PI * 2 +
        (now.getMinutes() / 60) * ((Math.PI * 2) / 12)
      );
    if (minRef.current) minRef.current.rotation.z = -(now.getMinutes() / 60) * Math.PI * 2;
    // Discrete tick for second hand with overshoot
    if (secRef.current) {
      const sec = now.getSeconds();
      const ms = now.getMilliseconds();
      const targetAngle = -(sec / 60) * Math.PI * 2;
      // Overshoot in first 100ms of each second
      const overshoot = ms < 100 ? Math.sin((ms / 100) * Math.PI) * 0.03 : 0;
      secRef.current.rotation.z = targetAngle - overshoot;
    }
  });
  return (
    <group position={pos}>
      <mesh>
        <cylinderGeometry args={[0.2, 0.2, 0.025, 32]} />
        <meshStandardMaterial color="#e8e0d0" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0, 0.015]}>
        <torusGeometry args={[0.2, 0.012, 8, 32]} />
        <meshStandardMaterial color="#2a1808" roughness={0.85} />
      </mesh>
      {/* Hour markers */}
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.sin(a) * 0.16, Math.cos(a) * 0.16, 0.015]}>
            <sphereGeometry args={[0.008, 6, 6]} />
            <meshStandardMaterial color="#2a1808" />
          </mesh>
        );
      })}
      {/* Hour hand */}
      <mesh ref={hourRef} position={[0, 0.05, 0.018]}>
        <boxGeometry args={[0.012, 0.11, 0.004]} />
        <meshStandardMaterial color="#1a0e04" />
      </mesh>
      {/* Minute hand */}
      <mesh ref={minRef} position={[0, 0.065, 0.02]}>
        <boxGeometry args={[0.008, 0.14, 0.004]} />
        <meshStandardMaterial color="#1a0e04" />
      </mesh>
      {/* Second hand */}
      <mesh ref={secRef} position={[0, 0.07, 0.022]}>
        <boxGeometry args={[0.004, 0.15, 0.003]} />
        <meshStandardMaterial color="#8b2020" />
      </mesh>
    </group>
  );
}

function Mirror({ pos }: { pos: [number, number, number] }) {
  return (
    <group position={pos} rotation={[0, Math.PI / 2, 0]}>
      <mesh>
        <torusGeometry args={[0.3, 0.02, 8, 32]} />
        <meshStandardMaterial color="#8b7030" metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh>
        <circleGeometry args={[0.28, 32]} />
        <meshStandardMaterial color="#2a2828" roughness={0.05} metalness={0.8} />
      </mesh>
    </group>
  );
}

export function WallDecor() {
  return (
    <group>
      {/* ═══ BACK WALL POSTERS (flanking REEL screen) ═══ */}
      <Poster pos={[-4, 3.5, -7.92]} size={[0.65, 0.9]} color="#0e0828" tilt={0.03} />
      <Poster pos={[-3.2, 4.0, -7.9]} size={[0.5, 0.7]} color="#1a0408" tilt={-0.02} />
      <Poster pos={[-3.6, 2.8, -7.88]} size={[0.45, 0.6]} color="#081a08" tilt={0.05} />
      <Poster pos={[4.2, 3.8, -7.92]} size={[0.5, 0.8]} color="#1a1202" tilt={-0.04} />
      <Poster pos={[3.4, 3.0, -7.9]} size={[0.7, 0.5]} color="#0a0a1a" tilt={0.02} />

      {/* ═══ LEFT WALL — postcards around window ═══ */}
      <Poster
        pos={[-6.92, 2.0, -1]}
        size={[0.2, 0.16]}
        color="#2a1a10"
        rot={[0, Math.PI / 2, 0]}
        tilt={0.08}
      />
      <Poster
        pos={[-6.92, 2.3, -0.4]}
        size={[0.18, 0.14]}
        color="#1a2028"
        rot={[0, Math.PI / 2, 0]}
        tilt={-0.05}
      />
      <Poster
        pos={[-6.92, 1.8, 0.2]}
        size={[0.22, 0.16]}
        color="#281814"
        rot={[0, Math.PI / 2, 0]}
        tilt={0.04}
      />
      <Poster
        pos={[-6.92, 2.5, 2.5]}
        size={[0.2, 0.18]}
        color="#1a2818"
        rot={[0, Math.PI / 2, 0]}
        tilt={-0.06}
      />
      <Poster
        pos={[-6.92, 2.1, 3.0]}
        size={[0.16, 0.14]}
        color="#281020"
        rot={[0, Math.PI / 2, 0]}
        tilt={0.03}
      />

      {/* ═══ MIRROR — left wall ═══ */}
      <Mirror pos={[-6.9, 3.5, -3]} />

      {/* ═══ VINYL RECORDS on right wall ═══ */}
      <group rotation={[0, -Math.PI / 2, 0]}>
        <VinylRecord pos={[2, 4.0, -6.92]} labelColor="#8b1a1a" />
        <VinylRecord pos={[0.5, 3.5, -6.92]} labelColor="#1a3a6b" />
        <VinylRecord pos={[-1, 4.2, -6.92]} labelColor="#6b5a10" />
      </group>

      <group position={[6.9, 2.2, 2]} rotation={[0, -Math.PI / 2, 0]}>
        <Pinboard pos={[0, 0, 0]} />
      </group>

      {/* ═══ DISCO BALL — hanging above center ═══ */}
      <DiscoBall pos={[0.5, 5.8, 0.5]} />

      {/* ═══ WALL CLOCK — back-right ═══ */}
      <WallClock pos={[3, 4.5, -7.92]} />
    </group>
  );
}
