const OLLAMA_BASE_URL = import.meta.env.VITE_OLLAMA_URL ?? "http://localhost:11434";
const GENERATE_URL = `${OLLAMA_BASE_URL}/api/generate`;
const CHAT_URL = `${OLLAMA_BASE_URL}/api/chat`;
const TAGS_URL = `${OLLAMA_BASE_URL}/api/tags`;
const FALLBACK_MODEL = import.meta.env.VITE_OLLAMA_DEFAULT_MODEL ?? "llama3";

export async function checkOllamaHealth(): Promise<boolean> {
  try {
    const res = await fetch(TAGS_URL, { method: "GET", signal: AbortSignal.timeout(3000) });
    return res.ok;
  } catch {
    return false;
  }
}

export interface OllamaModel {
  name: string;
  displayName: string;
  sizeGB: number;
}

export async function getAvailableModels(): Promise<OllamaModel[]> {
  try {
    const res = await fetch(TAGS_URL, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.models ?? []).map((m: { name: string; size: number }) => ({
      name: m.name,
      displayName: m.name.split(":")[0],
      sizeGB: Math.round((m.size / 1e9) * 10) / 10,
    }));
  } catch {
    return [];
  }
}

export async function getBestModel(): Promise<string> {
  const saved = localStorage.getItem("hive:ollama:model");
  if (saved) return saved;
  const models = await getAvailableModels();
  if (models.length > 0) return models[0].name;
  return FALLBACK_MODEL;
}

export function saveModelPreference(modelName: string): void {
  localStorage.setItem("hive:ollama:model", modelName);
}

export async function askOllama(prompt: string, model?: string): Promise<string> {
  const modelToUse = model ?? (await getBestModel());
  try {
    const res = await fetch(GENERATE_URL, {
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

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function chatWithOllama(
  messages: ChatMessage[],
  onChunk: (token: string) => void,
  model?: string,
): Promise<string> {
  const modelToUse = model ?? (await getBestModel());
  try {
    const res = await fetch(CHAT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: modelToUse, messages, stream: true }),
      signal: AbortSignal.timeout(60_000),
    });
    if (!res.ok || !res.body) return "";
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let full = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = dec.decode(value);
      for (const line of chunk.split("\n")) {
        if (!line.trim()) continue;
        try {
          const j = JSON.parse(line);
          const token: string = j.message?.content ?? "";
          full += token;
          onChunk(token);
        } catch {}
      }
    }
    return full;
  } catch {
    return "";
  }
}

export async function getMovieInspo(title: string, year: string, model?: string): Promise<string[]> {
  const prompt = `Give exactly 3 fascinating, little-known insights about the film "${title}" (${year}). Format as bullet points starting with •. Max 2 sentences per bullet.`;
  const raw = await askOllama(prompt, model);
  if (!raw) return [];
  return raw.split("\n").filter((l) => l.trim().startsWith("•")).map((l) => l.trim());
}

export async function getBookInspo(title: string, author: string, model?: string): Promise<string[]> {
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