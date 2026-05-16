import { useState, useEffect } from "react";

type OS = "mac" | "windows" | "linux" | "unknown";

function detectOS(): OS {
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes("mac")) return "mac";
  if (ua.includes("win")) return "windows";
  if (ua.includes("linux")) return "linux";
  return "unknown";
}

interface OllamaSetupProps {
  onDismiss: () => void;
  onRetry: () => void;
}

export function OllamaSetup({ onDismiss, onRetry }: OllamaSetupProps) {
  const [os, setOs] = useState<OS>("unknown");
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    setOs(detectOS());
  }, []);

  const handleRetry = async () => {
    setRetrying(true);
    await new Promise((r) => setTimeout(r, 800));
    onRetry();
    setRetrying(false);
  };

  const instructions: Record<OS, { steps: string[]; command: string }> = {
    mac: {
      steps: [
        "Download Ollama from ollama.com",
        "Open the downloaded .dmg and drag Ollama to Applications",
        "Launch Ollama from Applications — it runs in your menu bar",
        "Open Terminal and run the command below to pull a model",
      ],
      command: "ollama pull llama3",
    },
    windows: {
      steps: [
        "Download OllamaSetup.exe from ollama.com",
        "Run the installer — Ollama installs as a background service",
        "Open PowerShell or Command Prompt",
        "Run the command below to pull a model",
      ],
      command: "ollama pull llama3",
    },
    linux: {
      steps: [
        "Run the install script in your terminal",
        "Ollama starts automatically as a systemd service",
        "Pull a model with the command below",
      ],
      command: "curl -fsSL https://ollama.com/install.sh | sh && ollama pull llama3",
    },
    unknown: {
      steps: ["Visit ollama.com", "Download and install for your platform", "Pull a model"],
      command: "ollama pull llama3",
    },
  };

  const { steps, command } = instructions[os];

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
          boxShadow: "0 32px 80px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,200,100,0.06)",
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: "2rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
            <span style={{ fontSize: "1.5rem" }}>🦙</span>
            <h2
              style={{
                fontFamily: "var(--font-display, 'Cinzel', serif)",
                color: "#f4e4c1",
                fontSize: "1.2rem",
                letterSpacing: "0.12em",
                margin: 0,
                fontWeight: 600,
              }}
            >
              OLLAMA NOT DETECTED
            </h2>
          </div>
          <p style={{ color: "#a09070", fontSize: "0.95rem", lineHeight: 1.6, margin: 0 }}>
            HIVE uses Ollama to run AI entirely on your machine — no API keys, no cloud, no data
            leaving your device. Set it up in a few minutes.
          </p>
        </div>

        {/* OS Tabs */}
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
          {(["mac", "windows", "linux"] as OS[]).map((o) => (
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
                fontSize: "0.8rem",
                letterSpacing: "0.08em",
                cursor: "pointer",
                fontFamily: "var(--font-display, 'Cinzel', serif)",
                transition: "all 0.15s",
              }}
            >
              {o.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Steps */}
        <ol style={{ margin: "0 0 1.5rem 0", padding: "0 0 0 1.2rem", color: "#c0a878", fontSize: "0.9rem", lineHeight: 2 }}>
          {steps.map((step, i) => (
            <li key={i} style={{ marginBottom: "0.2rem" }}>
              {step}
            </li>
          ))}
        </ol>

        {/* Command block */}
        <div
          style={{
            background: "#050302",
            border: "1px solid #1a1005",
            borderRadius: "8px",
            padding: "0.85rem 1rem",
            marginBottom: "1.5rem",
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            justifyContent: "space-between",
          }}
        >
          <code style={{ fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)", color: "#c9a84c", fontSize: "0.82rem", wordBreak: "break-all" }}>
            {command}
          </code>
          <button
            onClick={() => navigator.clipboard.writeText(command)}
            style={{
              flexShrink: 0,
              background: "none",
              border: "1px solid #2a1a08",
              borderRadius: "4px",
              color: "#705030",
              fontSize: "0.72rem",
              padding: "0.25rem 0.6rem",
              cursor: "pointer",
              letterSpacing: "0.06em",
              fontFamily: "var(--font-display, 'Cinzel', serif)",
            }}
          >
            COPY
          </button>
        </div>

        {/* Download link */}
        <div style={{ marginBottom: "1.5rem", textAlign: "center" }}>
          <a
            href="https://ollama.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "#c9a84c",
              fontSize: "0.85rem",
              textDecoration: "none",
              letterSpacing: "0.06em",
              borderBottom: "1px solid rgba(201,168,76,0.3)",
              paddingBottom: "1px",
            }}
          >
            Download from ollama.com
          </a>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button
            onClick={handleRetry}
            disabled={retrying}
            style={{
              flex: 1,
              padding: "0.7rem",
              borderRadius: "8px",
              border: "1px solid #c9a84c",
              background: retrying ? "rgba(201,168,76,0.05)" : "rgba(201,168,76,0.1)",
              color: "#c9a84c",
              fontSize: "0.85rem",
              letterSpacing: "0.1em",
              cursor: retrying ? "default" : "pointer",
              fontFamily: "var(--font-display, 'Cinzel', serif)",
              transition: "all 0.15s",
            }}
          >
            {retrying ? "CHECKING..." : "I'VE INSTALLED IT — RETRY"}
          </button>
          <button
            onClick={onDismiss}
            style={{
              padding: "0.7rem 1.2rem",
              borderRadius: "8px",
              border: "1px solid #2a1a08",
              background: "transparent",
              color: "#705030",
              fontSize: "0.85rem",
              letterSpacing: "0.08em",
              cursor: "pointer",
              fontFamily: "var(--font-display, 'Cinzel', serif)",
            }}
          >
            SKIP
          </button>
        </div>

        <p style={{ color: "#3a2a18", fontSize: "0.75rem", textAlign: "center", marginTop: "1.5rem", marginBottom: 0, lineHeight: 1.5 }}>
          AI features will be unavailable until Ollama is running. All other HIVE features work normally.
        </p>
      </div>
    </div>
  );
}