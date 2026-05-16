// DenPage.tsx — Root page: wraps everything in DenProvider, renders scene + overlays
import { useEffect, useCallback, Suspense, Component, type ReactNode } from "react";
import { DenProvider, useDen } from "./DenContext";
import { DenScene } from "./DenScene";
import { DenSubNav } from "./DenSubNav";
import { EchoPanel } from "./EchoPanel";
import { ReelPanel } from "./ReelPanel";
import { FolioPanel } from "./FolioPanel";
import { NookPanel } from "./NookPanel";
import { RealmNav } from "../RealmShell";
import "./den.css";

// ─── Error Boundary ───────────────────────────────────────────────────────────
// Catches WebGL crashes (GPU unavailable, context lost, etc.)

class DenErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{
          position: "fixed", inset: 0, background: "#060402",
          display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", gap: 16,
        }}>
          <div style={{ fontSize: 40 }}>🕯️</div>
          <div style={{ fontFamily: "'Cinzel', serif", color: "#c9a84c", fontSize: 18, letterSpacing: "0.15em" }}>
            THE DEN IS UNAVAILABLE
          </div>
          <div style={{ fontFamily: "'Crimson Text', serif", color: "rgba(244,228,193,0.5)", fontSize: 14, textAlign: "center", maxWidth: 380 }}>
            Your device may not support WebGL, or the 3D scene failed to load.
            <br />Try refreshing the page.
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{ marginTop: 8, padding: "8px 24px", background: "rgba(201,168,76,0.1)", border: "1px solid #c9a84c", borderRadius: 6, color: "#c9a84c", cursor: "pointer", fontFamily: "'Cinzel', serif", fontSize: 11, letterSpacing: "0.15em" }}
          >
            RELOAD
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Loading screen ───────────────────────────────────────────────────────────

function DenLoadingScreen() {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "#060402",
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", gap: 20, zIndex: 10,
    }}>
      <div style={{ fontSize: 36, animation: "den-candle-flicker 1.5s ease-in-out infinite alternate" }}>🕯️</div>
      <div style={{ fontFamily: "'Cinzel', serif", color: "rgba(201,168,76,0.7)", fontSize: 13, letterSpacing: "0.25em" }}>
        LIGHTING THE DEN
      </div>
      <div style={{
        width: 120, height: 2, background: "rgba(201,168,76,0.15)", borderRadius: 2, overflow: "hidden",
      }}>
        <div style={{
          height: "100%", background: "#c9a84c", borderRadius: 2,
          animation: "den-load-bar 2s ease-in-out infinite",
        }} />
      </div>
      <style>{`
        @keyframes den-candle-flicker { 0% { opacity: 0.6; transform: scale(0.95); } 100% { opacity: 1; transform: scale(1.05); } }
        @keyframes den-load-bar { 0% { width: 0%; } 60% { width: 100%; } 100% { width: 100%; opacity: 0; } }
      `}</style>
    </div>
  );
}

// ─── Inner page ───────────────────────────────────────────────────────────────

function DenPageInner() {
  const { activeZone, setActiveZone } = useDen();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && activeZone) setActiveZone(null);
    },
    [activeZone, setActiveZone],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100vh", overflow: "hidden", background: "#060402" }}>
      {/* 3D Scene wrapped in error boundary + suspense */}
      <DenErrorBoundary>
        <Suspense fallback={<DenLoadingScreen />}>
          <DenScene />
        </Suspense>
      </DenErrorBoundary>

      {/* Scene blur overlay when panel is open */}
      {activeZone && <div className="den-scene-blur" />}

      {/* Film grain overlay */}
      <div className="den-film-grain" />

      {/* Main nav */}
      <RealmNav />

      {/* Sub-navigation */}
      <DenSubNav />

      {/* Zone panels */}
      {activeZone === "echo" && <EchoPanel />}
      {activeZone === "reel" && <ReelPanel />}
      {activeZone === "folio" && <FolioPanel />}
      {activeZone === "nook" && <NookPanel />}

      {/* Tagline */}
      {!activeZone && (
        <div style={{
          position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
          fontFamily: "'Crimson Text', serif", fontSize: 15, fontStyle: "italic",
          color: "rgba(244, 228, 193, 0.3)", letterSpacing: "0.05em",
          pointerEvents: "none", textAlign: "center", animation: "den-sl 1s ease both",
        }}>
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