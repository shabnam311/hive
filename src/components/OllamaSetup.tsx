// src/components/ollama/OllamaSetup.tsx
// Shown when Ollama is not running — gives user install instructions per OS

import { useState } from "react";
import { checkOllamaStatus } from "../../services/ollama";

interface OllamaSetupProps {
  onConnected: () => void;
}

type OS = "windows" | "mac" | "linux";

function detectOS(): OS {
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes("win")) return "windows";
  if (ua.includes("mac")) return "mac";
  return "linux";
}

const instructions: Record<OS, { steps: string[]; downloadUrl: string }> = {
  windows: {
    downloadUrl: "https://ollama.com/download/windows",
    steps: [
      "Download and run the Ollama installer (.exe)",
      "Once installed, Ollama starts automatically in the system tray",
      'Open a terminal (cmd/PowerShell) and run: ollama pull llama3',
      "Come back here and click Retry",
    ],
  },
  mac: {
    downloadUrl: "https://ollama.com/download/mac",
    steps: [
      "Download and open the Ollama .dmg file",
      "Drag Ollama to your Applications folder and open it",
      'Open Terminal and run: ollama pull llama3',
      "Come back here and click Retry",
    ],
  },
  linux: {
    downloadUrl: "https://ollama.com",
    steps: [
      'Run in terminal: curl -fsSL https://ollama.com/install.sh | sh',
      'Then run: ollama pull llama3',
      "Come back here and click Retry",
    ],
  },
};

export function OllamaSetup({ onConnected }: OllamaSetupProps) {
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState(false);
  const os = detectOS();
  const info = instructions[os];

  async function retry() {
    setChecking(true);
    setError(false);
    const status = await checkOllamaStatus();
    if (status.running) {
      onConnected();
    } else {
      setError(true);
    }
    setChecking(false);
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        padding: "2rem",
        fontFamily: "inherit",
        background: "var(--color-background-tertiary, #f5f5f0)",
      }}
    >
      <div
        style={{
          background: "var(--color-background-primary, white)",
          border: "0.5px solid var(--color-border-tertiary, #e0e0e0)",
          borderRadius: 16,
          padding: "2.5rem",
          maxWidth: 480,
          width: "100%",
        }}
      >
        {/* Icon */}
        <div style={{ fontSize: 48, marginBottom: "1rem", textAlign: "center" }}>🦙</div>

        <h1
          style={{
            fontSize: 22,
            fontWeight: 500,
            marginBottom: "0.5rem",
            textAlign: "center",
            color: "var(--color-text-primary)",
          }}
        >
          Ollama isn't running
        </h1>
        <p
          style={{
            fontSize: 14,
            color: "var(--color-text-secondary)",
            textAlign: "center",
            marginBottom: "2rem",
            lineHeight: 1.6,
          }}
        >
          HIVE uses Ollama to run AI locally on your machine — your data never
          leaves your computer.
        </p>

        {/* Steps */}
        <ol style={{ paddingLeft: "1.25rem", marginBottom: "2rem" }}>
          {info.steps.map((step, i) => (
            <li
              key={i}
              style={{
                fontSize: 14,
                color: "var(--color-text-primary)",
                lineHeight: 1.7,
                marginBottom: "0.5rem",
              }}
            >
              {step}
            </li>
          ))}
        </ol>

        {/* Download button */}
        <a
          href={info.downloadUrl}
          target="_blank"
          rel="noreferrer"
          style={{
            display: "block",
            textAlign: "center",
            background: "var(--color-background-secondary, #f0ede6)",
            color: "var(--color-text-primary)",
            padding: "0.75rem 1.5rem",
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 500,
            textDecoration: "none",
            marginBottom: "0.75rem",
            border: "0.5px solid var(--color-border-secondary)",
          }}
        >
          Download Ollama for {os.charAt(0).toUpperCase() + os.slice(1)}
        </a>

        {/* Retry button */}
        <button
          onClick={retry}
          disabled={checking}
          style={{
            display: "block",
            width: "100%",
            padding: "0.75rem",
            borderRadius: 8,
            border: "0.5px solid var(--color-border-primary)",
            background: "transparent",
            fontSize: 14,
            cursor: checking ? "not-allowed" : "pointer",
            color: "var(--color-text-primary)",
          }}
        >
          {checking ? "Checking…" : "Retry connection"}
        </button>

        {error && (
          <p
            style={{
              marginTop: "0.75rem",
              fontSize: 13,
              color: "var(--color-text-danger, #c0392b)",
              textAlign: "center",
            }}
          >
            Still not connected. Make sure Ollama is running and try again.
          </p>
        )}
      </div>
    </div>
  );
}
