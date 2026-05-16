// ReelZone.tsx — 3D: Projector, cinema screen, posters, film strip, chair
import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useDen, WatchedMovie } from "./DenContext";
import { getDenTextures } from "./ProceduralTextures";

function TicketWall({ watched }: { watched: WatchedMovie[] }) {
  const tex = getDenTextures();

  // Decide color based on decade string (e.g. "1970", "2010")
  const getTicketColor = (year: string) => {
    const y = parseInt(year, 10);
    if (isNaN(y)) return "#e8d8c0"; // default off-white
    if (y < 1980) return "#dcb484"; // 70s sepia
    if (y < 1990) return "#e0c8b0"; // 80s warm
    if (y < 2000) return "#c8d0c0"; // 90s cool
    if (y < 2010) return "#b0b8c0"; // 2000s silver
    if (y < 2020) return "#a0a8b0"; // 2010s slate grey
    return "#f0f0f0"; // 2020s white
  };

  return (
    <group position={[3.8, 2.0, -1.0]} rotation={[0, -Math.PI / 2, 0]}>
      {/* The Corkboard */}
      <mesh>
        <boxGeometry args={[3.6, 1.8, 0.04]} />
        <meshStandardMaterial map={tex.cork} color="#5a3a18" roughness={0.92} />
      </mesh>

      {/* The Tickets */}
      <group position={[0, 0, 0.025]}>
        {watched.map((movie, i) => {
          // Deterministic pseudo-randomness based on ID/index so they don't jump around
          const seed = i * 13.57;
          const x = -1.5 + (seed % 3.0);
          const y = -0.7 + ((seed * 1.3) % 1.4);
          const rot = (seed % 0.4) - 0.2;
          const color = getTicketColor(movie.year);

          return (
            <group key={movie.id} position={[x, y, 0.005 + i * 0.001]} rotation={[0, 0, rot]}>
              <mesh>
                {/* A slightly irregular rectangle representing a stub */}
                <planeGeometry args={[0.25, 0.15]} />
                <meshStandardMaterial color={color} roughness={0.9} side={THREE.DoubleSide} />
              </mesh>
              {/* Pin */}
              <mesh position={[0, 0.06, 0.005]}>
                <cylinderGeometry args={[0.008, 0.008, 0.015, 8]} />
                <meshStandardMaterial color="#888888" metalness={0.5} roughness={0.4} />
              </mesh>
            </group>
          );
        })}
      </group>

      {/* Director Wall Section (placeholder for now) */}
      <group position={[1.4, -0.6, 0.025]}>
        <mesh>
          <planeGeometry args={[0.6, 0.4]} />
          <meshStandardMaterial color="#f5ecc0" roughness={0.95} />
        </mesh>
      </group>
    </group>
  );
}

export function ReelZone() {
  const { setActiveZone, activeZone, watched } = useDen();
  const reel1 = useRef<THREE.Mesh>(null);
  const reel2 = useRef<THREE.Mesh>(null);
  const isActive = activeZone === "reel";
  const [hovered, setHovered] = useState(false);

  useFrame(() => {
    const speed = isActive ? 0.012 : 0.004;
    // Micro-stutter: 1% chance per frame of a tiny pause
    const stutter = Math.random() < 0.01 ? 0 : 1;
    if (reel1.current) reel1.current.rotation.z += speed * stutter;
    if (reel2.current) reel2.current.rotation.z -= speed * stutter;
  });

  const handleClick = (e: any) => {
    e.stopPropagation();
    setActiveZone("reel");
  };

  return (
    <group position={[0, 0, -4.2]}>
      {/* Cinema Screen on back wall */}
      <mesh
        position={[0, 2.8, -0.4]}
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
        <planeGeometry args={[3.2, 2.0]} />
        <meshStandardMaterial
          color="#0a0810"
          emissive={isActive ? "#e8d8b0" : hovered ? "#504020" : "#0a0810"}
          emissiveIntensity={isActive ? 0.15 : hovered ? 0.15 : 0.02}
        />
      </mesh>
      {/* Screen frame — thin black border */}
      <mesh position={[0, 4.05, -0.88]}>
        <boxGeometry args={[3.0, 0.06, 0.04]} />
        <meshStandardMaterial color="#0A0808" roughness={0.9} />
      </mesh>
      <mesh position={[0, 2.0, -0.88]}>
        <boxGeometry args={[3.0, 0.06, 0.04]} />
        <meshStandardMaterial color="#0A0808" roughness={0.9} />
      </mesh>
      <mesh position={[-1.47, 3.0, -0.88]}>
        <boxGeometry args={[0.06, 2.16, 0.04]} />
        <meshStandardMaterial color="#0A0808" roughness={0.9} />
      </mesh>
      <mesh position={[1.47, 3.0, -0.88]}>
        <boxGeometry args={[0.06, 2.16, 0.04]} />
        <meshStandardMaterial color="#0A0808" roughness={0.9} />
      </mesh>

      {/* ── Media Cabinet below screen ── */}
      <mesh position={[0, 0.25, -0.85]}>
        <boxGeometry args={[1.2, 0.5, 0.4]} />
        <meshStandardMaterial color="#1A0A04" roughness={0.88} />
      </mesh>
      {/* Cabinet doors */}
      <mesh position={[-0.28, 0.25, -0.64]}>
        <planeGeometry args={[0.52, 0.4]} />
        <meshStandardMaterial color="#160804" roughness={0.9} />
      </mesh>
      <mesh position={[0.28, 0.25, -0.64]}>
        <planeGeometry args={[0.52, 0.4]} />
        <meshStandardMaterial color="#160804" roughness={0.9} />
      </mesh>
      {/* Brass knobs */}
      <mesh position={[-0.05, 0.25, -0.63]}>
        <sphereGeometry args={[0.01, 6, 6]} />
        <meshStandardMaterial color="#8B7030" metalness={0.72} roughness={0.28} />
      </mesh>
      <mesh position={[0.05, 0.25, -0.63]}>
        <sphereGeometry args={[0.01, 6, 6]} />
        <meshStandardMaterial color="#8B7030" metalness={0.72} roughness={0.28} />
      </mesh>

      {/* ── Film Projector ── */}
      <group
        position={[1.5, 1.2, 5]}
        onClick={handleClick}
        onPointerEnter={(e) => {
          e.stopPropagation();
          document.body.style.cursor = "pointer";
        }}
        onPointerLeave={() => {
          document.body.style.cursor = "default";
        }}
      >
        {/* Body */}
        <mesh>
          <cylinderGeometry args={[0.18, 0.22, 0.45, 12]} />
          <meshStandardMaterial color="#2a2a2a" roughness={0.6} metalness={0.4} />
        </mesh>
        {/* Reels */}
        <mesh ref={reel1} position={[-0.15, 0.35, 0]}>
          <torusGeometry args={[0.22, 0.035, 8, 32]} />
          <meshStandardMaterial color="#8b6914" metalness={0.6} roughness={0.4} />
        </mesh>
        <mesh ref={reel2} position={[0.15, 0.35, 0]}>
          <torusGeometry args={[0.18, 0.03, 8, 32]} />
          <meshStandardMaterial color="#8b6914" metalness={0.6} roughness={0.4} />
        </mesh>
        {/* Lens */}
        <mesh position={[0, 0, 0.25]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.08, 0.07, 0.12, 16]} />
          <meshStandardMaterial
            color="#1a2030"
            emissive="#2040a0"
            emissiveIntensity={0.15}
            roughness={0.3}
            metalness={0.5}
          />
        </mesh>
        {/* Tripod legs */}
        {[0, 2.1, 4.2].map((a, i) => (
          <mesh
            key={i}
            position={[Math.cos(a) * 0.15, -0.6, Math.sin(a) * 0.15]}
            rotation={[0.15 * Math.cos(a), 0, 0.15 * Math.sin(a)]}
          >
            <cylinderGeometry args={[0.015, 0.02, 0.8, 6]} />
            <meshStandardMaterial color="#8b6914" metalness={0.5} roughness={0.5} />
          </mesh>
        ))}
      </group>

      {/* ── Movie Poster Frames (Left only) ── */}
      {/* Left poster */}
      <group position={[-2.5, 3.0, -0.88]}>
        <mesh>
          <boxGeometry args={[0.82, 1.17, 0.04]} />
          <meshStandardMaterial color="#2a1a08" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0, 0.025]}>
          <planeGeometry args={[0.7, 1.05]} />
          <meshStandardMaterial color="#1a0a2a" emissive="#1a0a2a" emissiveIntensity={0.08} />
        </mesh>
      </group>

      {/* ── Ticket Wall (Right Wall) ── */}
      <TicketWall watched={watched} />

      {/* ── Folding Chair — slightly angled left ── */}
      <group position={[0.2, 0, 2.5]} rotation={[0, 0.08, 0]}>
        {/* Seat with burgundy cushion */}
        <mesh position={[0, 0.35, 0]}>
          <boxGeometry args={[0.4, 0.04, 0.4]} />
          <meshStandardMaterial color="#2A1408" roughness={0.85} />
        </mesh>
        <mesh position={[0, 0.38, 0]}>
          <boxGeometry args={[0.35, 0.025, 0.35]} />
          <meshStandardMaterial color="#4A1418" roughness={0.9} />
        </mesh>
        {/* Back */}
        <mesh position={[0, 0.55, -0.18]}>
          <boxGeometry args={[0.4, 0.4, 0.03]} />
          <meshStandardMaterial color="#2A1408" roughness={0.85} />
        </mesh>
        {/* Legs */}
        {[
          [-0.17, 0.17, -0.17],
          [0.17, 0.17, -0.17],
          [-0.17, 0.17, 0.17],
          [0.17, 0.17, 0.17],
        ].map((p, i) => (
          <mesh key={i} position={p as [number, number, number]}>
            <cylinderGeometry args={[0.01, 0.01, 0.34, 6]} />
            <meshStandardMaterial color="#2A1408" roughness={0.85} />
          </mesh>
        ))}
        {/* Green blanket draped over back */}
        <mesh position={[0, 0.62, -0.22]} rotation={[0.15, 0, 0]}>
          <boxGeometry args={[0.38, 0.35, 0.03]} />
          <meshStandardMaterial color="#1A2A14" roughness={0.95} />
        </mesh>
        {/* Blanket hanging down sides */}
        <mesh position={[-0.2, 0.45, -0.22]} rotation={[0, 0, 0.2]}>
          <boxGeometry args={[0.15, 0.25, 0.02]} />
          <meshStandardMaterial color="#1A2A14" roughness={0.95} />
        </mesh>
        <mesh position={[0.2, 0.42, -0.22]} rotation={[0, 0, -0.15]}>
          <boxGeometry args={[0.12, 0.2, 0.02]} />
          <meshStandardMaterial color="#1A2A14" roughness={0.95} />
        </mesh>
      </group>

      {/* ── Film Strip (decorative) ── */}
      <group position={[2, 1.8, 4.5]}>
        {Array.from({ length: 8 }).map((_, i) => (
          <mesh key={i} position={[0, -i * 0.12, 0]}>
            <boxGeometry args={[0.15, 0.1, 0.003]} />
            <meshStandardMaterial
              color="#0a0808"
              emissive={i % 2 === 0 ? "#201510" : "#000000"}
              emissiveIntensity={0.15}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
}
