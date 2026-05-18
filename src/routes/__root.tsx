import { Outlet, Link, createRootRoute, useNavigate } from "@tanstack/react-router";
import { OllamaProvider, useOllama } from "@/components/OllamaContext";
import { OllamaSetup } from "@/components/OllamaSetup";
import { DenProvider, useDen } from "@/components/den/DenContext";
import { useState } from "react";

function MiniPlayer() {
  const { spotifyPlaylistUrl, setSpotifyPlaylistUrl } = useDen();
  const [minimized, setMinimized] = useState(false);
  if (!spotifyPlaylistUrl) return null;
  return (
    <div style={{
      position: "fixed", bottom: 16, right: 16, zIndex: 9000,
      width: minimized ? 160 : 320,
      borderRadius: "12px", overflow: "hidden",
      boxShadow: "0 8px 32px rgba(0,0,0,0.7)",
      border: "1px solid rgba(201,168,76,0.2)",
      background: "#0d0803",
      transition: "width 0.2s ease",
    }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "5px 10px", background: "rgba(20,12,4,0.98)",
        borderBottom: "1px solid rgba(201,168,76,0.1)",
      }}>
        <span style={{ fontFamily: "'Cinzel', serif", fontSize: "0.58rem", letterSpacing: "0.12em", color: "rgba(201,168,76,0.55)" }}>
          ♫ ECHO
        </span>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <button
            onClick={() => setMinimized(!minimized)}
            title={minimized ? "Expand" : "Minimize"}
            style={{ background: "none", border: "none", color: "rgba(244,228,193,0.4)", cursor: "pointer", fontSize: "0.65rem", padding: "1px 3px", lineHeight: 1 }}
          >
            {minimized ? "▲" : "▼"}
          </button>
          <button
            onClick={() => setSpotifyPlaylistUrl(null)}
            title="Close player"
            style={{ background: "none", border: "none", color: "rgba(244,228,193,0.3)", cursor: "pointer", fontSize: "0.65rem", padding: "1px 3px", lineHeight: 1 }}
          >
            ✕
          </button>
        </div>
      </div>
      {!minimized && (
        <iframe
          src={spotifyPlaylistUrl}
          width="320" height="80" frameBorder="0"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          style={{ display: "block" }}
        />
      )}
    </div>
  );
}

function AppShell() {
  const { showSetup, retry, dismiss } = useOllama();
  const navigate = useNavigate();

  function handleDismiss() {
    dismiss();
    navigate({ to: "/" });
  }

  return (
    <>
      {showSetup && <OllamaSetup onRetry={retry} onDismiss={handleDismiss} />}
      <Outlet />
      <MiniPlayer />
    </>
  );
}

export const Route = createRootRoute({
  component: () => (
    <OllamaProvider>
      <DenProvider>
        <AppShell />
      </DenProvider>
    </OllamaProvider>
  ),
});