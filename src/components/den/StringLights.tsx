// StringLights.tsx — 4 draped strings with visible wire, catenary sag, brightness variation
// Wire: dark thread #120A04, 3-4mm. Bulbs: 2cm spheres, warm white FFE4A0.
// Each bulb has fixed brightness variation (90-105%). Collective slow breathing.
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// 4 string paths: each is anchor points. Wire sags 15% between them.
const STRING_PATHS: { anchors: [number, number, number][]; bulbCount: number }[] = [
  // String 1: Back-left, above bed area
  {
    anchors: [
      [-4.2, 4.65, -4.5],
      [-1.5, 4.4, -3.0],
      [1.0, 4.3, -1.5],
    ],
    bulbCount: 14,
  },
  // String 2: Diagonal across room center
  {
    anchors: [
      [-4.4, 4.7, 2.0],
      [-1.0, 4.4, 0.5],
      [2.0, 4.3, -1.0],
      [4.2, 4.6, -2.5],
    ],
    bulbCount: 16,
  },
  // String 3: Left wall, ECHO side
  {
    anchors: [
      [-4.4, 4.65, 4.5],
      [-4.4, 4.4, 1.5],
      [-4.4, 4.5, -1.5],
    ],
    bulbCount: 10,
  },
  // String 4: Front-right, above NOOK
  {
    anchors: [
      [4.3, 4.65, 4.5],
      [2.5, 4.35, 2.5],
      [0.5, 4.3, 1.0],
    ],
    bulbCount: 10,
  },
];

function catenary(
  a: [number, number, number],
  b: [number, number, number],
  count: number,
): [number, number, number][] {
  const pts: [number, number, number][] = [];
  const dx = b[0] - a[0],
    dy = b[1] - a[1],
    dz = b[2] - a[2];
  const dist = Math.sqrt(dx * dx + dz * dz);
  const sag = dist * 0.15; // 15% sag
  for (let i = 0; i <= count; i++) {
    const t = i / count;
    // Parabolic droop
    const droop = -4 * sag * t * (1 - t);
    pts.push([a[0] + dx * t, a[1] + dy * t + droop, a[2] + dz * t]);
  }
  return pts;
}

function buildStringPoints(
  anchors: [number, number, number][],
  density: number,
): [number, number, number][] {
  const all: [number, number, number][] = [];
  for (let i = 0; i < anchors.length - 1; i++) {
    const segPts = catenary(anchors[i], anchors[i + 1], density);
    if (i > 0) segPts.shift(); // avoid duplicate at join
    all.push(...segPts);
  }
  return all;
}

export function StringLights() {
  const lightRefs = useRef<THREE.PointLight[]>([]);

  // Collective slow breathing
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    // Very slow collective pulse — barely perceptible
    const pulse = 1 + Math.sin(t * 0.25) * 0.04;
    // Subtle Y-axis sway on all bulbs
    lightRefs.current.forEach((l, i) => {
      if (l) {
        l.intensity = l.userData.baseIntensity * pulse;
        // Sway the parent group
        if (l.parent) {
          l.parent.position.y += Math.sin(t * 0.6 + i * 0.7) * 0.00005;
        }
      }
    });
  });

  const strings = useMemo(() => {
    let globalLightIdx = 0;
    return STRING_PATHS.map((s, si) => {
      const wirePoints = buildStringPoints(s.anchors, 12);
      const bulbPoints = buildStringPoints(
        s.anchors,
        Math.floor(s.bulbCount / (s.anchors.length - 1)),
      );
      // Assign fixed brightness variation to each bulb
      const bulbs = bulbPoints.map((pos, bi) => {
        const brightnessVar =
          bi === 3
            ? 0.15
            : bi === 7
              ? 0.3
              : 0.85 + (Math.sin(bi * 7.3 + si * 3.1) * 0.5 + 0.5) * 0.2; // 2 dim bulbs
        const hasLight = false; // DISABLED: Prevent WebGL shader limit crash (too many lights)
        if (hasLight) globalLightIdx++;
        return {
          pos,
          brightness: brightnessVar,
          hasLight,
          lightIdx: hasLight ? globalLightIdx - 1 : -1,
        };
      });
      return { wirePoints, bulbs };
    });
  }, []);

  return (
    <group>
      {strings.map((s, si) => (
        <group key={`string-${si}`}>
          {/* Wire segments — dark thread */}
          {s.wirePoints.slice(0, -1).map((p, i) => {
            const n = s.wirePoints[i + 1];
            const dx = n[0] - p[0],
              dy = n[1] - p[1],
              dz = n[2] - p[2];
            const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
            const mid: [number, number, number] = [
              (p[0] + n[0]) / 2,
              (p[1] + n[1]) / 2,
              (p[2] + n[2]) / 2,
            ];
            const dir = new THREE.Vector3(dx, dy, dz).normalize();
            const up = new THREE.Vector3(0, 1, 0);
            const quat = new THREE.Quaternion().setFromUnitVectors(up, dir);
            return (
              <mesh key={`w-${si}-${i}`} position={mid} quaternion={quat}>
                <cylinderGeometry args={[0.003, 0.003, len, 3]} />
                <meshStandardMaterial color="#120A04" roughness={1} />
              </mesh>
            );
          })}

          {/* Bulbs — 2cm spheres with emissive glow */}
          {s.bulbs.map((b, bi) => (
            <group key={`b-${si}-${bi}`} position={b.pos}>
              {/* Bulb sphere */}
              <mesh>
                <sphereGeometry args={[0.018, 8, 8]} />
                <meshStandardMaterial
                  color="#FFE4A0"
                  emissive="#FFF8D0"
                  emissiveIntensity={3.0 * b.brightness}
                  transparent
                  opacity={0.9}
                />
              </mesh>
              {/* Soft glow halo */}
              <mesh>
                <sphereGeometry args={[0.04, 8, 8]} />
                <meshStandardMaterial
                  color="#FFE4A0"
                  emissive="#FFE4A0"
                  emissiveIntensity={0.8 * b.brightness}
                  transparent
                  opacity={0.15}
                />
              </mesh>
              {/* Actual PointLight — only on select bulbs */}
              {b.hasLight && (
                <pointLight
                  ref={(el) => {
                    if (el) {
                      lightRefs.current[b.lightIdx] = el;
                      el.userData.baseIntensity = 0.5 * b.brightness;
                    }
                  }}
                  color="#FFE4A0"
                  intensity={0.5 * b.brightness}
                  distance={1.8}
                  decay={2}
                />
              )}
            </group>
          ))}
        </group>
      ))}
    </group>
  );
}
