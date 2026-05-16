// ollama.ts — Local Ollama integration for "Web Inspo" features
// Hits localhost:11434 — gracefully fails if Ollama isn't running

const OLLAMA_URL = "http://localhost:11434/api/generate";
const DEFAULT_MODEL = "llama3";

export async function askOllama(prompt: string, model = DEFAULT_MODEL): Promise<string> {
  try {
    const res = await fetch(OLLAMA_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        prompt,
        stream: false,
        options: { temperature: 0.7, num_predict: 300 },
      }),
    });

    if (!res.ok) {
      console.warn(`Ollama returned ${res.status}`);
      return "";
    }

    const data = await res.json();
    return data.response?.trim() || "";
  } catch (err) {
    console.warn("Ollama not available:", err);
    return "";
  }
}

export async function getMovieInspo(title: string, year: string): Promise<string[]> {
  const prompt = `Give exactly 3 fascinating, little-known insights about the film "${title}" (${year}). Include director trivia, hidden production details, or thematic analysis. Format as bullet points starting with •. Be concise — max 2 sentences per bullet.`;
  const raw = await askOllama(prompt);
  if (!raw) return [];
  return raw
    .split("\n")
    .filter((l) => l.trim().startsWith("•"))
    .map((l) => l.trim());
}

export async function getBookInspo(title: string, author: string): Promise<string[]> {
  const prompt = `Give exactly 3 fascinating, little-known insights about the book "${title}" by ${author}. Include author background, writing process details, or literary analysis. Format as bullet points starting with •. Be concise — max 2 sentences per bullet.`;
  const raw = await askOllama(prompt);
  if (!raw) return [];
  return raw
    .split("\n")
    .filter((l) => l.trim().startsWith("•"))
    .map((l) => l.trim());
}

export async function getProjectionistRecommendation(
  watchlist: any[],
  moodDesc: string,
): Promise<string> {
  if (watchlist.length === 0) return "Your watchlist is empty. I cannot project what isn't there.";
  const listStr = watchlist.map((m) => `"${m.title}" (${m.year})`).join(", ");
  const prompt = `Act as an enigmatic, cinematic 'Projectionist'. A user feels: "${moodDesc}".
Here is their personal watchlist: ${listStr}.
Choose exactly ONE film from this watchlist that perfectly matches their current mood. 
Write a short, poetic, 3-sentence recommendation explaining why you selected this specific film for this feeling. Do not list other options.`;
  const raw = await askOllama(prompt);
  return raw || "The projector is jammed... (Make sure Ollama is running locally)";
}
