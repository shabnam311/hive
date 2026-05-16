// NookZone.tsx — 3D: Personal desk, lamp, mug, trinkets, pinboard
import { useRef, useMemo, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { getDenTextures } from "./ProceduralTextures";
import { useDen } from "./DenContext";

function PomodoroHourglass({ position }: { position: [number, number, number] }) {
  const { pomodoroActive, pomodoroTimeLeft, startPomodoro, stopPomodoro } = useDen();
  const [hovered, setHovered] = useState(false);
  const totalTime = 25 * 60;
  const ratio = Math.max(0, Math.min(1, pomodoroTimeLeft / totalTime));

  const points = useMemo(() => {
    const pts = [];
    for (let i = 0; i <= 20; i++) {
      const t = i / 20;
      const y = (t - 0.5) * 0.16; // height is ~0.16
      const x = 0.01 + 0.035 * Math.pow((t - 0.5) * 2, 2);
      pts.push(new THREE.Vector2(x, y));
    }
    return pts;
  }, []);

  const handleClick = (e: any) => {
    e.stopPropagation();
    if (pomodoroActive) stopPomodoro();
    else startPomodoro();
  };

  return (
    <group
      position={position}
      onClick={handleClick}
      onPointerEnter={(e) => {
        e.stopPropagation();
        document.body.style.cursor = "pointer";
        setHovered(true);
      }}
      onPointerLeave={(e) => {
        e.stopPropagation();
        document.body.style.cursor = "default";
        setHovered(false);
      }}
    >
      {/* Top Cap */}
      <mesh position={[0, 0.08, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.01, 16]} />
        <meshStandardMaterial
          color="#8B7030"
          metalness={0.8}
          roughness={0.2}
          emissive={hovered ? "#403010" : "#000000"}
        />
      </mesh>

      {/* Glass Body */}
      <mesh>
        <latheGeometry args={[points, 24]} />
        <meshPhysicalMaterial
          color="#ffffff"
          transparent
          opacity={0.3}
          roughness={0.1}
          transmission={0.9}
          thickness={0.01}
        />
      </mesh>

      {/* Top Sand */}
      <mesh position={[0, 0.04 * ratio, 0]} visible={ratio > 0} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.04 * Math.sqrt(ratio), 0.08 * ratio, 16]} />
        <meshStandardMaterial color="#e8c8a0" roughness={0.9} />
      </mesh>

      {/* Bottom Sand */}
      <mesh position={[0, -0.04 * (1 - ratio), 0]} visible={ratio < 1}>
        <coneGeometry args={[0.04 * Math.sqrt(1 - ratio), 0.08 * (1 - ratio), 16]} />
        <meshStandardMaterial color="#e8c8a0" roughness={0.9} />
      </mesh>

      {/* Bottom Cap */}
      <mesh position={[0, -0.08, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.01, 16]} />
        <meshStandardMaterial color="#8B7030" metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  );
}

export function NookZone() {
  const { setActiveZone, saves, activeZone } = useDen();
  const tex = getDenTextures();
  const steamRefs = useRef<THREE.Mesh[]>([]);
  const [hovered, setHovered] = useState(false);
  const isActive = activeZone === "nook";

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    steamRefs.current.forEach((mesh, i) => {
      if (!mesh) return;
      const phase = (t * 0.25 + i * 0.15) % 1.0;
      // S-curve horizontal drift
      mesh.position.y = 1.18 + phase * 0.5;
      mesh.position.x = Math.sin(phase * Math.PI * 2 + i) * 0.015;
      mesh.position.z = Math.cos(phase * Math.PI * 1.5 + i * 0.5) * 0.01;
      // Fade out as it rises, grow slightly
      const opacity = 0.25 * (1 - phase) * (isActive ? 1.5 : 1);
      const scale = 0.6 + phase * 1.2;
      mesh.scale.set(scale, scale, scale);
      (mesh.material as THREE.MeshBasicMaterial).opacity = opacity;
    });
  });

  const handleClick = (e: any) => {
    e.stopPropagation();
    setActiveZone("nook");
  };

  // Pinboard notes based on saves
  const pinNotes = useMemo(() => {
    const notes = [];
    const colors = [
      "#f0e4c1",
      "#f5ecd7",
      "#f0d8a0",
      "#e8c8a0",
      "#f0e0d0",
      "#e0d0c0",
      "#f5e0b8",
      "#e8d8c0",
    ];
    for (let i = 0; i < Math.max(6, saves.length); i++) {
      notes.push({
        x: (Math.random() - 0.5) * 2.6,
        y: (Math.random() - 0.5) * 1.2,
        rot: (Math.random() - 0.5) * 0.4,
        color: colors[i % colors.length],
        w: 0.25 + Math.random() * 0.15,
        h: 0.2 + Math.random() * 0.12,
      });
    }
    return notes;
  }, [saves.length]);

  return (
    <group position={[2.5, 0, 2]}>
      {/* ── Personal Desk ── */}
      <mesh
        position={[0, 0.86, 0]}
        castShadow
        receiveShadow
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
        <boxGeometry args={[1.8, 0.085, 1.0]} />
        <meshStandardMaterial
          map={tex.wood}
          normalMap={tex.normalWood}
          color="#2A1408"
          roughness={0.82}
          emissive="#FFE890"
          emissiveIntensity={hovered ? 0.15 : isActive ? 0.08 : 0}
        />
      </mesh>
      {/* Front panel */}
      <mesh position={[0, 0.44, 0.63]}>
        <boxGeometry args={[2.8, 0.84, 0.05]} />
        <meshStandardMaterial color="#1e0e04" roughness={0.9} />
      </mesh>
      {/* Desk legs */}
      {[
        [-1.3, 0.43, -0.58],
        [1.3, 0.43, -0.58],
        [-1.3, 0.43, 0.58],
        [1.3, 0.43, 0.58],
      ].map((p, i) => (
        <mesh key={i} position={p as [number, number, number]}>
          <boxGeometry args={[0.08, 0.86, 0.08]} />
          <meshStandardMaterial color="#1a0e04" roughness={0.85} />
        </mesh>
      ))}

      {/* ── Brass Desk Lamp ── */}
      <group position={[1.0, 0.9, -0.3]}>
        <mesh position={[0, 0.04, 0]}>
          <cylinderGeometry args={[0.1, 0.12, 0.04, 10]} />
          <meshStandardMaterial color="#8B7030" metalness={0.72} roughness={0.28} />
        </mesh>
        <mesh position={[0, 0.34, 0]}>
          <cylinderGeometry args={[0.016, 0.016, 0.55, 6]} />
          <meshStandardMaterial color="#8B7030" metalness={0.72} roughness={0.28} />
        </mesh>
        <mesh position={[0.1, 0.62, 0]} rotation={[0, 0, -0.4]}>
          <coneGeometry args={[0.2, 0.26, 10, 1, true]} />
          <meshStandardMaterial color="#1A3A14" roughness={0.7} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* ── Ceramic Mug ── */}
      <group position={[-0.5, 0.9, 0.1]}>
        <mesh position={[0, 0.06, 0]}>
          <cylinderGeometry args={[0.04, 0.035, 0.1, 12]} />
          <meshStandardMaterial color="#e8d8c0" roughness={0.75} />
        </mesh>
        {/* Handle */}
        <mesh position={[0.05, 0.06, 0]} rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.025, 0.006, 6, 12, Math.PI]} />
          <meshStandardMaterial color="#e8d8c0" roughness={0.75} />
        </mesh>
        {/* Steam particles — 12 with S-curve drift */}
        {Array.from({ length: 12 }, (_, i) => (
          <mesh
            key={i}
            ref={(el) => {
              if (el) steamRefs.current[i] = el;
            }}
            position={[(Math.random() - 0.5) * 0.03, 1.18, (Math.random() - 0.5) * 0.03]}
          >
            <sphereGeometry args={[0.005 + Math.random() * 0.006, 4, 4]} />
            <meshBasicMaterial color="#f0e8d0" transparent opacity={0.25} />
          </mesh>
        ))}
      </group>

      {/* ── Journal / Notebook (open, clickable) ── */}
      <group position={[0, 0.91, 0]} onClick={handleClick}>
        <mesh position={[-0.15, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.28, 0.36]} />
          <meshStandardMaterial color="#f0e0b8" roughness={0.95} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0.15, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.28, 0.36]} />
          <meshStandardMaterial color="#f5eccc" roughness={0.95} side={THREE.DoubleSide} />
        </mesh>
        {/* Spine */}
        <mesh position={[0, 0.005, 0]}>
          <boxGeometry args={[0.03, 0.01, 0.36]} />
          <meshStandardMaterial color="#2a1505" roughness={0.8} />
        </mesh>
      </group>

      {/* ── Trinkets ── */}
      {/* Globe */}
      <mesh position={[0.9, 1.0, 0.3]}>
        <sphereGeometry args={[0.07, 12, 12]} />
        <meshStandardMaterial color="#1a3050" roughness={0.6} metalness={0.1} />
      </mesh>
      {/* Globe equator ring */}
      <mesh position={[0.9, 1.0, 0.3]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.072, 0.003, 6, 24]} />
        <meshStandardMaterial color="#8b6914" metalness={0.6} roughness={0.4} />
      </mesh>

      {/* Pocket watch (replaced by Hourglass) */}
      <PomodoroHourglass position={[0.65, 0.98, 0.35]} />

      {/* Succulent */}
      <group position={[1.1, 0.9, 0.45]}>
        <mesh position={[0, 0.03, 0]}>
          <cylinderGeometry args={[0.04, 0.035, 0.06, 8]} />
          <meshStandardMaterial color="#4a3018" roughness={0.9} />
        </mesh>
        {[0, 1.2, 2.4, 3.6, 4.8].map((a, i) => (
          <mesh
            key={i}
            position={[Math.cos(a) * 0.02, 0.07 + i * 0.01, Math.sin(a) * 0.02]}
            rotation={[0.3 * Math.cos(a), 0, 0.3 * Math.sin(a)]}
          >
            <coneGeometry args={[0.012, 0.035, 4]} />
            <meshStandardMaterial color="#2a3a18" roughness={0.85} />
          </mesh>
        ))}
      </group>

      {/* Framed photo */}
      <group position={[0.75, 0.98, -0.4]}>
        <mesh>
          <boxGeometry args={[0.12, 0.15, 0.015]} />
          <meshStandardMaterial color="#1a0e06" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0, 0.009]}>
          <planeGeometry args={[0.09, 0.12]} />
          <meshStandardMaterial color="#e8d0a0" roughness={0.95} />
        </mesh>
      </group>

      {/* ── Mood Board / Pinboard ── */}
      <group position={[0, 2.5, 1.2]}>
        <mesh>
          <boxGeometry args={[3.2, 1.8, 0.04]} />
          <meshStandardMaterial map={tex.cork} color="#5a3a18" roughness={0.92} />
        </mesh>
        {/* Pinned notes */}
        {pinNotes.map((note, i) => (
          <group key={i} position={[note.x, note.y, 0.025]} rotation={[0, 0, note.rot]}>
            <mesh>
              <planeGeometry args={[note.w, note.h]} />
              <meshStandardMaterial color={note.color} roughness={0.95} side={THREE.DoubleSide} />
            </mesh>
            {/* Pin */}
            <mesh position={[0, note.h / 2 - 0.02, 0.005]}>
              <cylinderGeometry args={[0.012, 0.012, 0.015, 8]} />
              <meshStandardMaterial color="#c9a84c" metalness={0.5} roughness={0.4} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}
