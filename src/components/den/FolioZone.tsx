// FolioZone.tsx — 3D: Reading stand, bookshelves, quill, stacked books
import { useRef, useMemo, useEffect } from "react";
import * as THREE from "three";
import { getDenTextures } from "./ProceduralTextures";
import { useDen } from "./DenContext";

const BOOK_PALETTE = [
  "#6b1a1a",
  "#1a3a1a",
  "#1a1a5c",
  "#5c3a1a",
  "#4a1a4a",
  "#6b5010",
  "#8b4010",
  "#c4512a",
];

export function FolioZone() {
  const { setActiveZone, wantToRead, readLog, currentlyReading } = useDen();
  const tex = getDenTextures();
  const shelfBooksRef = useRef<THREE.InstancedMesh>(null);

  // Build instanced shelf books
  const allBooks = useMemo(() => {
    const items = [...wantToRead, ...readLog];
    if (currentlyReading) items.unshift(currentlyReading);
    return items;
  }, [wantToRead, readLog, currentlyReading]);

  const shelfBookData = useMemo(() => {
    const data: {
      pos: [number, number, number];
      scale: [number, number, number];
      color: THREE.Color;
    }[] = [];
    const shelves = [0, -1.5, -3.0];
    shelves.forEach((sz, shelfIdx) => {
      let x = -1.0;
      for (let i = 0; i < 12 && x < 1.0; i++) {
        const bookIdx = shelfIdx * 12 + i;
        const w = 0.04 + Math.random() * 0.05;
        const h = 0.35 + Math.random() * 0.2;
        const userBook = allBooks[bookIdx];
        const color = userBook
          ? new THREE.Color(BOOK_PALETTE[bookIdx % BOOK_PALETTE.length])
          : new THREE.Color(BOOK_PALETTE[Math.floor(Math.random() * BOOK_PALETTE.length)]);
        data.push({
          pos: [x + w / 2, h / 2, sz],
          scale: [w, h, 0.2],
          color,
        });
        x += w + 0.005;
      }
    });
    return data;
  }, [allBooks]);

  useEffect(() => {
    if (!shelfBooksRef.current) return;
    const dummy = new THREE.Object3D();
    shelfBookData.forEach((b, i) => {
      dummy.position.set(...b.pos);
      dummy.scale.set(...b.scale);
      dummy.updateMatrix();
      shelfBooksRef.current!.setMatrixAt(i, dummy.matrix);
      shelfBooksRef.current!.setColorAt(i, b.color);
    });
    shelfBooksRef.current.instanceMatrix.needsUpdate = true;
    if (shelfBooksRef.current.instanceColor) shelfBooksRef.current.instanceColor.needsUpdate = true;
  }, [shelfBookData]);

  const handleClick = (e: any) => {
    e.stopPropagation();
    setActiveZone("folio");
  };

  return (
    <group position={[3.8, 0, -3.0]}>
      {/* ── Reading Stand / Lectern ── */}
      <group
        position={[0, 0, 1]}
        onClick={handleClick}
        onPointerEnter={(e) => {
          e.stopPropagation();
          document.body.style.cursor = "pointer";
        }}
        onPointerLeave={() => {
          document.body.style.cursor = "default";
        }}
      >
        {/* Base */}
        <mesh position={[0, 0.5, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 1.0, 8]} />
          <meshStandardMaterial color="#2a1505" roughness={0.8} />
        </mesh>
        {/* Base plate */}
        <mesh position={[0, 0.02, 0]}>
          <boxGeometry args={[0.55, 0.06, 0.42]} />
          <meshStandardMaterial color="#2a1505" roughness={0.8} />
        </mesh>
        {/* Angled top */}
        <mesh position={[0, 1.1, 0.1]} rotation={[-0.35, 0, 0]}>
          <boxGeometry args={[0.65, 0.06, 0.52]} />
          <meshStandardMaterial color="#2a1505" roughness={0.75} />
        </mesh>
        {/* Open book on stand */}
        <group position={[0, 1.16, 0.1]} rotation={[-0.35, 0, 0]}>
          <mesh position={[-0.14, 0.01, 0]}>
            <planeGeometry args={[0.26, 0.38]} />
            <meshStandardMaterial color="#f0e0b8" roughness={0.95} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[0.14, 0.01, 0]}>
            <planeGeometry args={[0.26, 0.38]} />
            <meshStandardMaterial color="#f5eccc" roughness={0.95} side={THREE.DoubleSide} />
          </mesh>
          {/* Ribbon bookmark */}
          <mesh position={[0, -0.2, 0.01]}>
            <planeGeometry args={[0.015, 0.12]} />
            <meshStandardMaterial color="#8b1a10" roughness={0.9} side={THREE.DoubleSide} />
          </mesh>
        </group>
      </group>

      {/* ── Bookshelves on wall ── */}
      {[0, -1.5, -3.0].map((z, i) => (
        <mesh key={`shelf-${i}`} position={[0.6, 1.2 + i * 0.9, z]} onClick={handleClick}>
          <boxGeometry args={[2.4, 0.06, 0.38]} />
          <meshStandardMaterial
            map={tex.wood}
            normalMap={tex.normalWood}
            color="#2a1505"
            roughness={0.8}
          />
        </mesh>
      ))}
      {/* Instanced books */}
      {shelfBookData.length > 0 && (
        <instancedMesh
          ref={shelfBooksRef}
          args={[undefined, undefined, shelfBookData.length]}
          position={[0.6, 1.24, 0]}
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial roughness={0.6} metalness={0.05} />
        </instancedMesh>
      )}

      {/* ── Quill + Inkwell on side table ── */}
      <group position={[-0.6, 0, 0.5]}>
        {/* Side table */}
        <mesh position={[0, 0.41, 0]}>
          <boxGeometry args={[0.42, 0.82, 0.38]} />
          <meshStandardMaterial color="#2a1505" roughness={0.8} />
        </mesh>
        {/* Inkwell */}
        <mesh position={[0, 0.86, 0]}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshStandardMaterial
            color="#0a0810"
            metalness={0.6}
            roughness={0.3}
            emissive="#0a0820"
            emissiveIntensity={0.15}
          />
        </mesh>
        {/* Quill */}
        <mesh position={[-0.06, 0.9, 0]} rotation={[0, 0, -0.5]}>
          <cylinderGeometry args={[0.002, 0.006, 0.35, 5]} />
          <meshStandardMaterial color="#f0e8d0" roughness={0.9} />
        </mesh>
      </group>

      {/* ── Stacked books on floor ── */}
      <group position={[0.3, 0, 1.6]}>
        {[
          { c: "#6b1a1a", y: 0.03 },
          { c: "#1a3a1a", y: 0.09 },
          { c: "#1a1a5c", y: 0.15 },
          { c: "#5c3a1a", y: 0.21 },
        ].map((b, i) => (
          <mesh key={i} position={[i * 0.01, b.y, i * 0.005]} rotation={[0, i * 0.1, 0]}>
            <boxGeometry args={[0.35, 0.05, 0.25]} />
            <meshStandardMaterial color={b.c} roughness={0.7} />
          </mesh>
        ))}
      </group>
    </group>
  );
}
