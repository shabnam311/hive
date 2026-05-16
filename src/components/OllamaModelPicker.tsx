// src/components/OllamaModelPicker.tsx
import { useState } from "react";
import { useOllama } from "./OllamaContext";

interface OllamaModelPickerProps {
  compact?: boolean;
}

export function OllamaModelPicker({ compact = false }: OllamaModelPickerProps) {
  const { status, models, selectedModel, setSelectedModel } = useOllama();
  const [open, setOpen] = useState(false);

  if (status === "offline") {
    return (
      <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: compact ? "0.25rem 0.6rem" : "0.4rem 0.8rem", borderRadius: "6px", border: "1px solid #2a1a08", background: "rgba(80,20,10,0.3)", fontSize: compact ? "0.72rem" : "0.8rem", color: "#704030", letterSpacing: "0.06em", fontFamily: "var(--font-display, 'Cinzel', serif)" }}>
        <span style={{ fontSize: "0.6em" }}>●</span> OFFLINE
      </div>
    );
  }

  if (status === "checking") {
    return (
      <div style={{ display: "inline-flex", alignItems: "center", padding: compact ? "0.25rem 0.6rem" : "0.4rem 0.8rem", borderRadius: "6px", border: "1px solid #2a1a08", fontSize: compact ? "0.72rem" : "0.8rem", color: "#705030", fontFamily: "var(--font-display, 'Cinzel', serif)" }}>
        ...
      </div>
    );
  }

  const displayName = selectedModel ? selectedModel.split(":")[0] : "No model";

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: compact ? "0.25rem 0.6rem" : "0.4rem 0.8rem", borderRadius: "6px", border: "1px solid #2a3a10", background: "rgba(40,80,10,0.2)", fontSize: compact ? "0.72rem" : "0.8rem", color: "#7ab840", letterSpacing: "0.06em", cursor: "pointer", fontFamily: "var(--font-display, 'Cinzel', serif)" }}
      >
        <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#7ab840", boxShadow: "0 0 6px rgba(122,184,64,0.8)", flexShrink: 0, display: "inline-block" }} />
        {displayName}
        {models.length > 1 && <span style={{ opacity: 0.5 }}>▾</span>}
      </button>

      {open && models.length > 1 && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 100 }} onClick={() => setOpen(false)} />
          <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 101, background: "#1a1005", border: "1px solid #2a1a08", borderRadius: "8px", padding: "0.35rem", minWidth: "160px", boxShadow: "0 8px 32px rgba(0,0,0,0.6)" }}>
            {models.map((m) => (
              <button
                key={m.name}
                onClick={() => { setSelectedModel(m.name); setOpen(false); }}
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "0.45rem 0.65rem", borderRadius: "5px", border: "none", background: m.name === selectedModel ? "rgba(201,168,76,0.12)" : "transparent", color: m.name === selectedModel ? "#c9a84c" : "#a09070", fontSize: "0.8rem", cursor: "pointer", textAlign: "left", fontFamily: "var(--font-body, 'Crimson Text', serif)", gap: "0.75rem" }}
              >
                <span>{m.displayName}</span>
                <span style={{ opacity: 0.5, fontSize: "0.7rem" }}>{m.sizeGB}GB</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}