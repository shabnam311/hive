// DenCamera.tsx — Cinematic first-person POV with smooth transitions
// Intro animation, zone dolly, idle breathing, buttery damping
import { useRef, useEffect, useState, useCallback } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { useDen } from "./DenContext";

const CENTER: [number, number, number] = [0, 1.6, 0];
const LOOK_AT: [number, number, number] = [0, 1.6, -0.1]; // Just in front of camera

// Zone camera targets — where to look when a zone is clicked
const ZONE_TARGETS: Record<string, { lookAt: [number, number, number] }> = {
  echo: { lookAt: [-3.2, 1.2, 1.0] },
  reel: { lookAt: [0, 2.8, -4.5] },
  folio: { lookAt: [3.8, 1.5, -2.0] },
  nook: { lookAt: [2.5, 1.2, 2.0] },
};

export function DenCamera() {
  const { activeZone } = useDen();
  const controlsRef = useRef<any>(null);
  const { camera } = useThree();
  const [introComplete, setIntroComplete] = useState(false);
  const lastActivity = useRef(Date.now());
  const prevZone = useRef<string | null>(null);

  // Track user activity
  const onInteraction = useCallback(() => {
    lastActivity.current = Date.now();
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", onInteraction);
    window.addEventListener("click", onInteraction);
    return () => {
      window.removeEventListener("mousemove", onInteraction);
      window.removeEventListener("click", onInteraction);
    };
  }, [onInteraction]);

  // Initial camera position
  useEffect(() => {
    camera.position.set(CENTER[0], CENTER[1] + 0.3, CENTER[2] + 1.5);
    camera.lookAt(...LOOK_AT);
  }, [camera]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    // Intro animation — pull back from close-up over 2.5s
    if (!introComplete && t < 2.5) {
      const progress = Math.min(t / 2.5, 1);
      const ease = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      camera.position.x = THREE.MathUtils.lerp(0.5, CENTER[0], ease);
      camera.position.y = THREE.MathUtils.lerp(CENTER[1] + 0.5, CENTER[1], ease);
      camera.position.z = THREE.MathUtils.lerp(CENTER[2] - 1, CENTER[2], ease);
      // FOV narrows to widen
      (camera as THREE.PerspectiveCamera).fov = THREE.MathUtils.lerp(45, 65, ease);
      (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
    } else if (!introComplete) {
      setIntroComplete(true);
      camera.position.set(...CENTER);
      (camera as THREE.PerspectiveCamera).fov = 65;
      (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
    }

    // Zone dolly — smoothly rotate toward zone target
    if (introComplete && controlsRef.current) {
      if (activeZone && ZONE_TARGETS[activeZone]) {
        // Calculate a target point 0.1 units away from the center in the direction of the zone
        const zonePoint = new THREE.Vector3(...ZONE_TARGETS[activeZone].lookAt);
        const dir = zonePoint.sub(new THREE.Vector3(...CENTER)).normalize();
        const target = new THREE.Vector3(...CENTER).add(dir.multiplyScalar(0.1));

        const currentTarget = controlsRef.current.target as THREE.Vector3;
        currentTarget.lerp(target, 0.05);
        prevZone.current = activeZone;
      } else if (prevZone.current) {
        // Return to default look-at
        const target = new THREE.Vector3(...LOOK_AT);
        const currentTarget = controlsRef.current.target as THREE.Vector3;
        currentTarget.lerp(target, 0.04);
        if (currentTarget.distanceTo(target) < 0.005) {
          prevZone.current = null;
        }
      }

      // Idle breathing — subtle FOV oscillation after 20s inactivity
      const idle = (Date.now() - lastActivity.current) / 1000;
      if (idle > 20 && !activeZone) {
        const breath = Math.sin(t * 0.4) * 0.5;
        (camera as THREE.PerspectiveCamera).fov = 65 + breath;
        (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
      }
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      target={new THREE.Vector3(...LOOK_AT)}
      enablePan={false}
      enableZoom={false}
      minPolarAngle={Math.PI * 0.15}
      maxPolarAngle={Math.PI * 0.8}
      enableDamping
      dampingFactor={0.03}
      rotateSpeed={0.4}
      autoRotate={!activeZone && introComplete}
      autoRotateSpeed={0.15}
    />
  );
}
