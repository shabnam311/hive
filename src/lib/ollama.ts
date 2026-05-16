// src/services/ollama.ts
// Single unified Ollama service — replaces all scattered localhost:11434 fetch calls

const OLLAMA_BASE = "http://localhost:11434";

export interface OllamaModel {
  name: string;
  modified_at: string;
  size: number;
}

export interface OllamaStatus {
  running: boolean;
  models: OllamaModel[];
  selectedModel: string | null;
}

let _cachedStatus: OllamaStatus | null = null;
let _selectedModel: string | null = null;

// Check if Ollama is running and fetch available models
export async function checkOllamaStatus(): Promise<OllamaStatus> {
  try {
    const res = await fetch(`${OLLAMA_BASE}/api/tags`, {
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) throw new Error("not running");
    const data = await res.json();
    const models: OllamaModel[] = data.models ?? [];

    // Pick a default model — prefer llama3 if present, else first available
    if (!_selectedModel && models.length > 0) {
      const preferred = models.find((m) => m.name.startsWith("llama3"));
      _selectedModel = preferred?.name ?? models[0].name;
    }

    _cachedStatus = { running: true, models, selectedModel: _selectedModel };
    return _cachedStatus;
  } catch {
    _cachedStatus = { running: false, models: [], selectedModel: null };
    return _cachedStatus;
  }
}

// Set which model to use (called from settings UI)
export function setSelectedModel(modelName: string) {
  _selectedModel = modelName;
  if (_cachedStatus) _cachedStatus.selectedModel = modelName;
}

export function getSelectedModel(): string | null {
  return _selectedModel;
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

// Stream a chat completion — yields text chunks
export async function* streamChat(
  messages: ChatMessage[],
  systemPrompt?: string,
  model?: string
): AsyncGenerator<string> {
  const resolvedModel = model ?? _selectedModel;
  if (!resolvedModel) throw new Error("No Ollama model selected");

  const payload = {
    model: resolvedModel,
    messages: systemPrompt
      ? [{ role: "system", content: systemPrompt }, ...messages]
      : messages,
    stream: true,
  };

  const res = await fetch(`${OLLAMA_BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error(`Ollama error: ${res.status}`);
  if (!res.body) throw new Error("No response body");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const lines = decoder.decode(value, { stream: true }).split("\n");
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const json = JSON.parse(line);
        const chunk = json.message?.content;
        if (chunk) yield chunk;
      } catch {
        // skip malformed line
      }
    }
  }
}

// Non-streaming single completion (for quick features)
export async function complete(
  prompt: string,
  model?: string
): Promise<string> {
  const resolvedModel = model ?? _selectedModel;
  if (!resolvedModel) throw new Error("No Ollama model selected");

  const res = await fetch(`${OLLAMA_BASE}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: resolvedModel, prompt, stream: false }),
  });

  if (!res.ok) throw new Error(`Ollama error: ${res.status}`);
  const data = await res.json();
  return data.response ?? "";
}
