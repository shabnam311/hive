// src/components/OllamaSetup.tsx
import { useState } from "react";
import { checkOllamaHealth } from "../services/ollama";

interface OllamaSetupProps {
  onRetry: () => void;
  onDismiss: () => void;
}

type OS = "windows" | "mac" | "linux";

function detectOS(): OS {
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes("win")) return "windows";
  if (ua.includes("mac")) return "mac";
  return "linux";
}

const instructions: Record<OS, { steps: string[]; downloadUrl: string; command: string }> = {
  windows: {
    downloadUrl: "https://ollama.com/download/windows",
    command: "ollama pull llama3",
    steps: [
      "Download and run the Ollama installer (.exe)",
      "Ollama starts automatically in the system tray after install",
      "Open PowerShell or Command Prompt and run the command below",
      "Come back here and click Retry",
    ],
  },
  mac: {
    downloadUrl: "https://ollama.com/download/mac",
    command: "ollama pull llama3",
    steps: [
      "Download and open the Ollama .dmg file",
      "Drag Ollama to Applications and open it — it runs in the menu bar",
      "Open Terminal and run the command below",
      "Come back here and click Retry",
    ],
  },
  linux: {
    downloadUrl: "https://ollama.com",
    command: "curl -fsSL https://ollama.com/install.sh | sh && ollama pull llama3",
    steps: [
      "Run the install command below in your terminal",
      "Ollama starts automatically as a service",
      "Come back here and click Retry",
    ],
  },
};

export function OllamaSetup({ onRetry, onDismiss }: OllamaSetupProps) {
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState(false);
  const [os, setOs] = useState<OS>(detectOS());
  const info = instructions[os];

  async function retry() {
    setChecking(true);
    setError(false);
    try {
      const healthy = await checkOllamaHealth();
      if (healthy) {
        onRetry();
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    }
    setChecking(false);
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(4,2,1,0.92)",
        backdropFilter: "blur(12px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        fontFamily: "var(--font-body, 'Crimson Text', serif)",
      }}
    >
      <div
        style={{
          background: "linear-gradient(160deg, #1a1005 0%, #0d0803 100%)",
          border: "1px solid #2a1a08",
          borderRadius: "16px",
          padding: "2.5rem",
          maxWidth: "520px",
          width: "90%",
          boxShadow: "0 32px 80px rgba(0,0,0,0.8)",
        }}
      >
        <div style={{ marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
            <span style={{ fontSize: "1.5rem" }}>🦙</span>
            <h2 style={{ fontFamily: "var(--font-display, 'Cinzel', serif)", color: "#f4e4c1", fontSize: "1.2rem", letterSpacing: "0.12em", margin: 0, fontWeight: 600 }}>
              OLLAMA NOT DETECTED
            </h2>
          </div>
          <p style={{ color: "#a09070", fontSize: "0.95rem", lineHeight: 1.6, margin: 0 }}>
            HIVE uses Ollama to run AI entirely on your machine — no API keys, no cloud, no data leaving your device.
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
          {(["windows", "mac", "linux"] as OS[]).map((o) => (
            <button
              key={o}
              onClick={() => setOs(o)}
              style={{
                padding: "0.35rem 0.9rem",
                borderRadius: "6px",
                border: "1px solid",
                borderColor: os === o ? "#c9a84c" : "#2a1a08",
                background: os === o ? "rgba(201,168,76,0.12)" : "transparent",
                color: os === o ? "#c9a84c" : "#705030",
                fontSize: "0.78rem",
                letterSpacing: "0.08em",
                cursor: "pointer",
                fontFamily: "var(--font-display, 'Cinzel', serif)",
              }}
            >
              {o === "windows" ? "WINDOWS" : o === "mac" ? "MAC" : "LINUX"}
            </button>
          ))}
        </div>

        <ol style={{ margin: "0 0 1.25rem 0", padding: "0 0 0 1.2rem", color: "#c0a878", fontSize: "0.9rem", lineHeight: 2 }}>
          {info.steps.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>

        <div style={{ background: "#050302", border: "1px solid #1a1005", borderRadius: "8px", padding: "0.85rem 1rem", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "1rem", justifyContent: "space-between" }}>
          <code style={{ fontFamily: "monospace", color: "#c9a84c", fontSize: "0.82rem", wordBreak: "break-all" }}>
            {info.command}
          </code>
          <button
            onClick={() => navigator.clipboard.writeText(info.command)}
            style={{ flexShrink: 0, background: "none", border: "1px solid #2a1a08", borderRadius: "4px", color: "#705030", fontSize: "0.72rem", padding: "0.25rem 0.6rem", cursor: "pointer", fontFamily: "var(--font-display, 'Cinzel', serif)" }}
          >
            COPY
          </button>
        </div>

        <div style={{ marginBottom: "1.5rem", textAlign: "center" }}>
          
            href={info.downloadUrl}
            target="_blank"
            rel="noreferrer"
            style={{ color: "#c9a84c", fontSize: "0.85rem", textDecoration: "none", borderBottom: "1px solid rgba(201,168,76,0.3)", paddingBottom: "1px" }}
          >
            → Download from ollama.com
          </a>
        </div>

        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button
            onClick={retry}
            disabled={checking}
            style={{ flex: 1, padding: "0.7rem", borderRadius: "8px", border: "1px solid #c9a84c", background: "rgba(201,168,76,0.1)", color: "#c9a84c", fontSize: "0.85rem", letterSpacing: "0.1em", cursor: checking ? "default" : "pointer", fontFamily: "var(--font-display, 'Cinzel', serif)" }}
          >
            {checking ? "CHECKING..." : "I'VE INSTALLED IT — RETRY"}
          </button>
          <button
            onClick={onDismiss}
            style={{ padding: "0.7rem 1.2rem", borderRadius: "8px", border: "1px solid #2a1a08", background: "transparent", color: "#705030", fontSize: "0.85rem", cursor: "pointer", fontFamily: "var(--font-display, 'Cinzel', serif)" }}
          >
            SKIP
          </button>
        </div>

        {error && (
          <p style={{ color: "#c0392b", fontSize: "0.8rem", textAlign: "center", marginTop: "1rem", marginBottom: 0 }}>
            Still not connected. Make sure Ollama is running and try again.
          </p>
        )}

        <p style={{ color: "#3a2a18", fontSize: "0.75rem", textAlign: "center", marginTop: "1.5rem", marginBottom: 0, lineHeight: 1.5 }}>
          AI features will be unavailable until Ollama is running. All other HIVE features work normally.
        </p>
      </div>
    </div>
  );
}