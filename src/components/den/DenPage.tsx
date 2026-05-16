// DenPage.tsx — Root page: wraps everything in DenProvider, renders scene + overlays
import { useEffect, useCallback } from "react";
import { DenProvider, useDen } from "./DenContext";
import { DenScene } from "./DenScene";
import { DenSubNav } from "./DenSubNav";
import { EchoPanel } from "./EchoPanel";
import { ReelPanel } from "./ReelPanel";
import { FolioPanel } from "./FolioPanel";
import { NookPanel } from "./NookPanel";
import { RealmNav } from "../RealmShell";
import "./den.css";

function DenPageInner() {
  const { activeZone, setActiveZone } = useDen();

  // Close panel on Escape
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && activeZone) {
        setActiveZone(null);
      }
    },
    [activeZone, setActiveZone],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100vh",
        overflow: "hidden",
        background: "#060402",
      }}
    >
      {/* 3D Scene — fills entire viewport */}
      <DenScene />

      {/* Scene blur overlay when panel is open */}
      {activeZone && <div className="den-scene-blur" />}

      {/* Film grain overlay — analog warmth */}
      <div className="den-film-grain" />

      {/* Main nav bar */}
      <RealmNav />

      {/* Sub-navigation */}
      <DenSubNav />

      {/* Zone overlay panels */}
      {activeZone === "echo" && <EchoPanel />}
      {activeZone === "reel" && <ReelPanel />}
      {activeZone === "folio" && <FolioPanel />}
      {activeZone === "nook" && <NookPanel />}

      {/* Tagline — bottom center when no panel is active */}
      {!activeZone && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            left: "50%",
            transform: "translateX(-50%)",
            fontFamily: "'Crimson Text', serif",
            fontSize: 15,
            fontStyle: "italic",
            color: "rgba(244, 228, 193, 0.3)",
            letterSpacing: "0.05em",
            pointerEvents: "none",
            textAlign: "center",
            animation: "den-sl 1s ease both",
          }}
        >
          where you disappear into what you love.
        </div>
      )}
    </div>
  );
}

export function DenPage() {
  return (
    <DenProvider>
      <DenPageInner />
    </DenProvider>
  );
}
