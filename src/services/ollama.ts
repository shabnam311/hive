// src/services/ollama.ts
// Unified Ollama service — single source of truth for all AI calls in HIVE.

const BASE_URL = import.meta.env.VITE_OLLAMA_URL ?? "http://localhost:11434";
const MODEL_KEY = "hive:ollama:model";
const FALLBACK_MODEL = import.meta.env.VITE_OLLAMA_DEFAULT_MODEL ?? "llama3";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OllamaModel {
  name: string;
  displayName: string;
  sizeGB: number;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface OllamaStatus {
  running: boolean;
  models: OllamaModel[];
  selectedModel: string;
}

// ─── Model preference ─────────────────────────────────────────────────────────

export function getSelectedModel(): string {
  return localStorage.getItem(MODEL_KEY) ?? FALLBACK_MODEL;
}

export function setSelectedModel(name: string): void {
  localStorage.setItem(MODEL_KEY, name);
}

// ─── Health & model discovery ─────────────────────────────────────────────────

export async function checkOllamaHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/api/tags`, {
      signal: AbortSignal.timeout(3000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function getAvailableModels(): Promise<OllamaModel[]> {
  try {
    const res = await fetch(`${BASE_URL}/api/tags`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.models ?? [])
      .filter((m: { name: string }) => !m.name.includes("moondream") && !m.name.includes("llava"))
      .map((m: { name: string; size: number }) => ({
        name: m.name,
        displayName: m.name.split(":")[0],
        sizeGB: Math.round((m.size / 1e9) * 10) / 10,
      }));
  } catch {
    return [];
  }
}

export async function getBestModel(): Promise<string> {
  const models = await getAvailableModels();
  const saved = localStorage.getItem(MODEL_KEY);
  if (saved && models.some((m) => m.name === saved)) return saved;
  if (models.length > 0) return models[0].name;
  return FALLBACK_MODEL;
}

// ─── Full status check (used by OllamaSetup) ─────────────────────────────────

export async function checkOllamaStatus(): Promise<OllamaStatus> {
  const running = await checkOllamaHealth();
  if (!running) {
    return { running: false, models: [], selectedModel: getSelectedModel() };
  }
  const models = await getAvailableModels();
  return { running: true, models, selectedModel: getSelectedModel() };
}

// ─── One-shot generation ──────────────────────────────────────────────────────

export async function askOllama(prompt: string, model?: string): Promise<string> {
  const modelToUse = model ?? (await getBestModel());
  try {
    const res = await fetch(`${BASE_URL}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: modelToUse,
        prompt,
        stream: false,
        options: { temperature: 0.7, num_predict: 300 },
      }),
      signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok) return "";
    const data = await res.json();
    return data.response?.trim() ?? "";
  } catch {
    return "";
  }
}

// ─── Streaming chat ───────────────────────────────────────────────────────────

export async function* streamChat(
  messages: ChatMessage[],
  systemPrompt?: string,
  model?: string,
): AsyncGenerator<string> {
  const modelToUse = model ?? (await getBestModel());
  const fullMessages: ChatMessage[] = systemPrompt
    ? [{ role: "system", content: systemPrompt }, ...messages]
    : messages;

  const res = await fetch(`${BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: modelToUse,
      messages: fullMessages,
      stream: true,
    }),
    signal: AbortSignal.timeout(60_000),
  });

  if (!res.ok || !res.body) {
    throw new Error(`Ollama error: ${res.status}`);
  }

  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += dec.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const j = JSON.parse(line);
        if (j.error) {
          console.error("Ollama stream error:", j.error);
          yield `\n[Error: ${j.error}]`;
        }
        const token: string = j.message?.content ?? "";
        if (token) yield token;
      } catch (e) {
        // ignore JSON parse errors for malformed lines
      }
    }
  }
  
  if (buffer.trim()) {
    try {
      const j = JSON.parse(buffer);
      const token: string = j.message?.content ?? "";
      if (token) yield token;
    } catch {}
  }
}

// ─── Den panel helpers ────────────────────────────────────────────────────────

export async function getMovieInspo(
  title: string,
  year: string,
  model?: string,
): Promise<string[]> {
  const prompt = `Give exactly 3 fascinating, little-known insights about the film "${title}" (${year}). Format as bullet points starting with •. Max 2 sentences per bullet.`;
  const raw = await askOllama(prompt, model);
  if (!raw) return [];
  return raw.split("\n").filter((l) => l.trim().startsWith("•")).map((l) => l.trim());
}

export async function getBookInspo(
  title: string,
  author: string,
  model?: string,
): Promise<string[]> {
  const prompt = `Give exactly 3 fascinating, little-known insights about the book "${title}" by ${author}. Format as bullet points starting with •. Max 2 sentences per bullet.`;
  const raw = await askOllama(prompt, model);
  if (!raw) return [];
  return raw.split("\n").filter((l) => l.trim().startsWith("•")).map((l) => l.trim());
}

export async function getProjectionistRecommendation(
  watchlist: Array<{ title: string; year: string }>,
  moodDesc: string,
  model?: string,
): Promise<string> {
  if (watchlist.length === 0) return "Your watchlist is empty.";
  const listStr = watchlist.map((m) => `"${m.title}" (${m.year})`).join(", ");
  const prompt = `Act as a cinematic 'Projectionist'. A user feels: "${moodDesc}". Their watchlist: ${listStr}. Choose ONE film and write a poetic 3-sentence recommendation.`;
  const raw = await askOllama(prompt, model);
  return raw || "The projector is jammed... (Make sure Ollama is running locally)";
}