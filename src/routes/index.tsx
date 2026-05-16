import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";
import { HiveScene } from "@/components/HiveScene";
import { TopBar, HeroCopy, BottomDock, CornerWhisper } from "@/components/HiveOverlay";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <main className="relative h-screen w-screen overflow-hidden bg-midnight">
      {/* 3D living scene */}
      <div className="absolute inset-0">
        <Suspense fallback={null}>
          <HiveScene />
        </Suspense>
      </div>

      {/* atmospheric vignette */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,oklch(0.08_0.04_265/0.85)_100%)]" />

      {/* ui */}
      <TopBar />
      <HeroCopy />
      <CornerWhisper />

      <BottomDock />

      {/* drifting dust motes (CSS particles over canvas) */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {Array.from({ length: 24 }).map((_, i) => (
          <span
            key={i}
            className="absolute h-1 w-1 rounded-full bg-amber/60 animate-twinkle"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 4}s`,
              filter: "blur(0.5px)",
            }}
          />
        ))}
      </div>
    </main>
  );
}