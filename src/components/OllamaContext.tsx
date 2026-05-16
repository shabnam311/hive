// src/components/OllamaContext.tsx
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  checkOllamaHealth,
  getAvailableModels,
  getBestModel,
  setSelectedModel as saveModelPreference,
  type OllamaModel,
} from "../services/ollama";

type OllamaStatus = "checking" | "running" | "offline";

interface OllamaContextValue {
  status: OllamaStatus;
  models: OllamaModel[];
  selectedModel: string;
  setSelectedModel: (name: string) => void;
  retry: () => void;
  dismiss: () => void;
  showSetup: boolean;
}

const OllamaContext = createContext<OllamaContextValue | null>(null);

export function OllamaProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<OllamaStatus>("checking");
  const [models, setModels] = useState<OllamaModel[]>([]);
  const [selectedModel, setSelectedModelState] = useState<string>("");
  const [showSetup, setShowSetup] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  const check = async () => {
    setStatus("checking");
    const healthy = await checkOllamaHealth();
    if (healthy) {
      const available = await getAvailableModels();
      setModels(available);
      const best = await getBestModel();
      setSelectedModelState(best);
      setStatus("running");
      setShowSetup(false);
    } else {
      setStatus("offline");
      if (!hasChecked) setShowSetup(true);
    }
    setHasChecked(true);
  };

  useEffect(() => {
    check();
    const interval = setInterval(async () => {
      const healthy = await checkOllamaHealth();
      if (healthy && status !== "running") check();
      else if (!healthy && status === "running") setStatus("offline");
    }, 30_000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setSelectedModel = (name: string) => {
    setSelectedModelState(name);
    saveModelPreference(name);
  };

  return (
    <OllamaContext.Provider
      value={{ status, models, selectedModel, setSelectedModel, retry: check, dismiss: () => setShowSetup(false), showSetup }}
    >
      {children}
    </OllamaContext.Provider>
  );
}

export function useOllama(): OllamaContextValue {
  const ctx = useContext(OllamaContext);
  if (!ctx) throw new Error("useOllama must be used inside OllamaProvider");
  return ctx;
}