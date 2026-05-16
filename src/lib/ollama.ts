// src/lib/ollama.ts

const OLLAMA_BASE = "http://localhost:11434";
const MODEL_PREF_KEY = "hive_ollama_model";

export interface OllamaModel {
  name: string;
  modified_at: string;
  size: number;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

// ─── Health ───────────────────────────────────────────────────────────────────

export async function checkOllamaHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${OLLAMA_BASE}/api/tags`, {
      signal: AbortSignal.timeout(3000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ─── Models ───────────────────────────────────────────────────────────────────

export async function getAvailableModels(): Promise<OllamaModel[]> {
  try {
    const res = await fetch(`${OLLAMA_BASE}/api/tags`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.models ?? []) as OllamaModel[];
  } catch {
    return [];
  }
}

export async function getBestModel(): Promise<string> {
  const saved = getSavedModelPreference();
  const models = await getAvailableModels();
  if (models.length === 0) return "";
  const names = models.map((m) => m.name);
  if (saved && names.includes(saved)) return saved;
  const preferred = ["llama3", "llama3:latest", "mistral", "mistral:latest", "llama2"];
  for (const p of preferred) {
    const match = names.find((n) => n === p || n.startsWith(p.split(":")[0]));
    if (match) return match;
  }
  return names[0];
}

export function saveModelPreference(model: string): void {
  try { localStorage.setItem(MODEL_PREF_KEY, model); } catch { }
}

export function getSavedModelPreference(): string | null {
  try { return localStorage.getItem(MODEL_PREF_KEY); } catch { return null; }
}

// ─── Core streaming ───────────────────────────────────────────────────────────

async function streamToCallback(
  messages: ChatMessage[],
  model: string,
  onChunk: (token: string) => void,
): Promise<string> {
  const res = await fetch(`${OLLAMA_BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages, stream: true }),
    signal: AbortSignal.timeout(120_000),
  });
  if (!res.ok) throw new Error(`Ollama error: ${res.status}`);
  if (!res.body) throw new Error("No response body");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let full = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const lines = decoder.decode(value, { stream: true }).split("\n");
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const json = JSON.parse(line);
        const chunk: string | undefined = json.message?.content;
        if (chunk) { full += chunk; onChunk(chunk); }
      } catch { }
    }
  }
  return full;
}

// ─── chatWithOllama ───────────────────────────────────────────────────────────
// SubjectWorkspace calls: chatWithOllama(messages, onChunk, modelName)
// onChunk is a streaming callback.

export async function chatWithOllama(
  messages: ChatMessage[],
  onChunk: ((token: string) => void) | string | undefined,
  modelName?: string,
): Promise<string> {
  const resolvedModel =
    (typeof modelName === "string" && modelName) ||
    getSavedModelPreference() ||
    (await getBestModel());

  if (!resolvedModel) return "";

  const cb: (token: string) => void =
    typeof onChunk === "function" ? onChunk : () => {};

  try {
    return await streamToCallback(messages, resolvedModel, cb);
  } catch {
    return "";
  }
}

// ─── Feature helpers ──────────────────────────────────────────────────────────

export async function getBookInspo(
  bookTitle: string,
  author?: string,
  model?: string,
): Promise<string> {
  const resolvedModel = model || getSavedModelPreference() || (await getBestModel());
  if (!resolvedModel) return "Ollama isn't running — start it to get book insights.";
  const prompt = author
    ? `Give a short inspiring 2-3 sentence reflection on "${bookTitle}" by ${author}. Focus on themes and why it matters.`
    : `Give a short inspiring 2-3 sentence reflection on the book "${bookTitle}". Focus on themes and why it matters.`;
  try {
    let result = "";
    await streamToCallback([{ role: "user", content: prompt }], resolvedModel, (c) => { result += c; });
    return result;
  } catch { return "Couldn't reach Ollama. Make sure it's running."; }
}

export async function getMovieInspo(
  title: string,
  model?: string,
): Promise<string> {
  const resolvedModel = model || getSavedModelPreference() || (await getBestModel());
  if (!resolvedModel) return "Ollama isn't running — start it to get film insights.";
  const prompt = `Give a short evocative 2-3 sentence reflection on "${title}". Focus on mood, themes, what makes it worth watching.`;
  try {
    let result = "";
    await streamToCallback([{ role: "user", content: prompt }], resolvedModel, (c) => { result += c; });
    return result;
  } catch { return "Couldn't reach Ollama. Make sure it's running."; }
}