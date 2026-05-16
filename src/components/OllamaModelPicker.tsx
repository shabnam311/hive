// src/components/ollama/OllamaModelPicker.tsx
// Dropdown for selecting which locally-installed Ollama model to use

import { useEffect, useState } from "react";
import {
  checkOllamaStatus,
  setSelectedModel,
  getSelectedModel,
  OllamaModel,
} from "../../services/ollama";

export function OllamaModelPicker() {
  const [models, setModels] = useState<OllamaModel[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkOllamaStatus().then((status) => {
      setModels(status.models);
      setSelected(getSelectedModel() ?? "");
      setLoading(false);
    });
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value;
    setSelected(val);
    setSelectedModel(val);
  }

  if (loading) return null;
  if (models.length === 0)
    return (
      <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
        No models found
      </span>
    );

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
        Model:
      </span>
      <select
        value={selected}
        onChange={handleChange}
        style={{
          fontSize: 12,
          padding: "2px 6px",
          borderRadius: 6,
          border: "0.5px solid var(--color-border-secondary)",
          background: "var(--color-background-secondary)",
          color: "var(--color-text-primary)",
          cursor: "pointer",
        }}
      >
        {models.map((m) => (
          <option key={m.name} value={m.name}>
            {m.name}
          </option>
        ))}
      </select>
    </div>
  );
}
