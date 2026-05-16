// DenScene.tsx — 360° first-person POV cozy bedroom
// Camera at eye level in room center with OrbitControls for full rotation
// Rich warm lighting, bloom, vignette for immersive atmosphere
import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect, useState } from "react";
import * as THREE from "three";
import { Environment, ContactShadows } from "@react-three/drei";
import { DenRoom } from "./DenRoom";
import { DenBed } from "./DenBed";
import { DenShelves } from "./DenShelves";
import { StringLights } from "./StringLights";
import { Plants } from "./Plants";
import { WallDecor } from "./WallDecor";
import { RoomLighting } from "./RoomLighting";
import { DenCamera } from "./DenCamera";
import { EchoZone } from "./EchoZone";
import { ReelZone } from "./ReelZone";
import { FolioZone } from "./FolioZone";
import { NookZone } from "./NookZone";
import { Wardrobe } from "./Wardrobe";
import { DenCandleClusters } from "./DenCandleClusters";
import { DenChandelier } from "./DenChandelier";
import { DustParticles, RainOnWindow, FireSparks, LightningFlash } from "./Atmosphere";
import { startDenAmbience, stopDenAmbience } from "../../lib/den-sounds";

function DenAmbience() {
  useEffect(() => {
    const start = () => {
      startDenAmbience();
      window.removeEventListener("click", start);
    };
    window.addEventListener("click", start);
    return () => {
      window.removeEventListener("click", start);
      stopDenAmbience();
    };
  }, []);
  return null;
}

// 360° POV: Camera at eye level in center of room
// Room: x[-4.5..4.5] z[-5..5] y[0..5]
const CAM_POS: [number, number, number] = [0, 1.6, 0.5];

export function DenScene() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Short delay just for the CSS transition to kick in
    const t = setTimeout(() => setReady(true), 50);
    return () => clearTimeout(t);
  }, []);

  return (
    <Canvas
      shadows
      dpr={[1, 1.5]}
      camera={{ fov: 65, near: 0.1, far: 40, position: CAM_POS }}
      onCreated={({ camera, gl }) => {
        camera.lookAt(0, 1.4, -3);
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.35;
        gl.shadowMap.enabled = true;
        gl.shadowMap.type = THREE.PCFSoftShadowMap;
      }}
      gl={{ antialias: true }}
      style={{
        position: "absolute",
        inset: 0,
        opacity: ready ? 1 : 0,
        transition: "opacity 0.8s ease-in",
      }}
    >
      {/* Warm dark background */}
      <color attach="background" args={["#0E0A06"]} />

      {/* Environment map for metallic reflections (warm interior preset) */}
      <Environment preset="sunset" background={false} environmentIntensity={0.25} />

      <Suspense fallback={null}>
        <DenRoom />
        <DenBed />
        <DenShelves />
        <StringLights />
        <Plants />
        <WallDecor />
        <Wardrobe />
        <EchoZone />
        <ReelZone />
        <FolioZone />
        <NookZone />
        <RoomLighting />
        <DenCamera />
        <DenAmbience />

        {/* Atmosphere restored after fixing WebGL/Canvas blocking issues */}
        <DustParticles />
        <RainOnWindow />
        <FireSparks />
        <LightningFlash />
      </Suspense>
    </Canvas>
  );
}