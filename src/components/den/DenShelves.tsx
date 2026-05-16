// DenShelves.tsx — 3 wall-mounted shelves packed with 40+ books
// Book colors: burgundy, forest, navy, tan, rust, plum, midnight blue
// Shelves: #2E1808 (lighter walnut), iron brackets, roughness 0.88
import { useMemo } from "react";
import * as THREE from "three";
import { getDenTextures } from "./ProceduralTextures";

const BOOK_COLORS = [
  "#6B2020",
  "#1A4A20",
  "#1A204A",
  "#5A3A10",
  "#8A3018",
  "#3A1040",
  "#104A3A",
  "#7A1A10",
  "#204A2A",
  "#1A2A5A",
  "#8A4040",
  "#206040",
  "#304080",
  "#6A5020",
  "#C8B090",
  "#5A2A2A",
  "#205A30",
  "#2A205A",
  "#7A4A20",
  "#D8B890",
  "#A84040",
  "#40A060",
];

function PackedShelf({ y, z, width = 1.7 }: { y: number; z: number; width?: number }) {
  const books = useMemo(() => {
    const result: {
      x: number;
      w: number;
      h: number;
      color: string;
      lean: number;
      flat: boolean;
    }[] = [];
    let x = -width / 2 + 0.04;
    const shelfEnd = width / 2 - 0.04;
    while (x < shelfEnd) {
      const w = 0.04 + Math.random() * 0.06; // width 4-10cm
      const h = 0.18 + Math.random() * 0.14; // height 18-32cm
      const color = BOOK_COLORS[Math.floor(Math.random() * BOOK_COLORS.length)];
      const lean = Math.abs(x - shelfEnd) < 0.15 ? Math.random() * 0.15 + 0.05 : 0; // last books lean
      result.push({ x, w, h, color, lean, flat: false });
      x += w + 0.003; // tiny gap
    }
    // Add 1-2 flat books on top of standing books
    const flatCount = 1 + Math.floor(Math.random() * 2);
    for (let i = 0; i < flatCount; i++) {
      const fx = -width / 4 + (Math.random() * width) / 2;
      result.push({
        x: fx,
        w: 0.12,
        h: 0.16,
        color: BOOK_COLORS[Math.floor(Math.random() * BOOK_COLORS.length)],
        lean: 0,
        flat: true,
      });
    }
    return result;
  }, [width]);

  return (
    <group position={[0, y, z]}>
      {books.map((b, i) =>
        b.flat ? (
          // Flat horizontal book on top
          <mesh key={i} position={[b.x, 0.28, 0]} rotation={[0, Math.random() * 0.1, 0]}>
            <boxGeometry args={[b.w, 0.025, b.h]} />
            <meshStandardMaterial color={b.color} roughness={0.88} />
          </mesh>
        ) : (
          // Standing book
          <mesh key={i} position={[b.x, b.h / 2, 0]} rotation={[0, 0, b.lean]}>
            <boxGeometry args={[b.w, b.h, 0.14]} />
            <meshStandardMaterial color={b.color} roughness={0.88} />
          </mesh>
        ),
      )}
    </group>
  );
}

export function DenShelves() {
  const tex = getDenTextures();
  return (
    <group position={[3.8, 0, -1.5]}>
      {/* 3 shelves with iron brackets on right wall */}
      {[0.6, 1.3, 2.0].map((y, i) => (
        <group key={`shelf-${i}`}>
          {/* Shelf plank */}
          <mesh position={[0, y, 0]}>
            <boxGeometry args={[1.8, 0.04, 0.22]} />
            <meshStandardMaterial
              map={tex.wood}
              normalMap={tex.normalWood}
              color="#2E1808"
              roughness={0.88}
            />
          </mesh>
          {/* Iron brackets */}
          {[-0.7, 0.7].map((bx, bi) => (
            <group key={`bracket-${i}-${bi}`}>
              <mesh position={[bx, y - 0.08, 0.1]}>
                <boxGeometry args={[0.03, 0.14, 0.02]} />
                <meshStandardMaterial color="#2A2420" roughness={0.7} metalness={0.3} />
              </mesh>
              <mesh position={[bx, y - 0.14, 0.05]}>
                <boxGeometry args={[0.03, 0.02, 0.12]} />
                <meshStandardMaterial color="#2A2420" roughness={0.7} metalness={0.3} />
              </mesh>
            </group>
          ))}
          {/* Books on this shelf */}
          <PackedShelf y={y + 0.02} z={0} width={1.7} />
        </group>
      ))}

      {/* Floor stack of 4 books — reading pile */}
      <group position={[0.3, 0, 0.8]}>
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} position={[0, 0.015 + i * 0.028, 0]} rotation={[0, i * 0.08 - 0.1, 0]}>
            <boxGeometry args={[0.16 - i * 0.01, 0.025, 0.22 - i * 0.01]} />
            <meshStandardMaterial color={BOOK_COLORS[i + 5]} roughness={0.88} />
          </mesh>
        ))}
        {/* Top book face-down (open) */}
        <mesh position={[0, 0.13, 0]} rotation={[0, 0.15, 0]}>
          <boxGeometry args={[0.14, 0.02, 0.18]} />
          <meshStandardMaterial color="#D8C8A0" roughness={0.9} />
        </mesh>
      </group>
    </group>
  );
}
