// FolioPanel.tsx — Book tracker with Open Library search + Ollama Inspo
import { useState } from "react";
import { useDen, type Book } from "./DenContext";
import { getBookInspo } from "../../services/ollama";
import { useOllama } from "@/components/OllamaContext";
import "./den.css";

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="den-stars">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          className={`den-star ${n <= value ? "den-star--filled" : "den-star--empty"}`}
          onClick={() => onChange(n)}
        >
          {n <= value ? "★" : "☆"}
        </button>
      ))}
    </div>
  );
}

export function FolioPanel() {
  const {
    setActiveZone,
    currentlyReading,
    wantToRead,
    readLog,
    setCurrentlyReading,
    updateCurrentlyReading,
    finishCurrentlyReading,
    addToWantToRead,
    removeFromWantToRead,
    startReading,
    updateReadLog,
    removeFromReadLog,
  } = useDen();

  // Manual Entry Form
  const { selectedModel, status: ollamaStatus } = useOllama();
  const [newTitle, setNewTitle] = useState("");
  const [newAuthor, setNewAuthor] = useState("");
  const [newImage, setNewImage] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const [finishRating, setFinishRating] = useState(4);
  const [finishQuote, setFinishQuote] = useState("");
  const [inspoId, setInspoId] = useState<string | null>(null);
  const [inspoLoading, setInspoLoading] = useState(false);
  const [inspoData, setInspoData] = useState<Record<string, string[]>>({});

  const handleInspo = async (b: { id: string; title: string; author: string }) => {
    if (inspoData[b.id]) {
      setInspoId(inspoId === b.id ? null : b.id);
      return;
    }
    setInspoId(b.id);
    setInspoLoading(true);
    const insights = await getBookInspo(b.title, b.author, ollamaStatus === "running" ? selectedModel : undefined);
    setInspoData((d) => ({
      ...d,
      [b.id]:
        insights.length > 0
          ? insights
          : ["Ollama not available — start it locally to get insights."],
    }));
    setInspoLoading(false);
  };
  const [showFinish, setShowFinish] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) {
        setNewImage(ev.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleManualAdd = (target: "reading" | "want" | "read") => {
    if (!newTitle.trim()) return;
    const book: Book = {
      id: crypto.randomUUID(),
      title: newTitle,
      author: newAuthor || "Unknown Author",
      coverUrl: newImage,
      pageCount: 300,
      currentPage: 0,
      readingNotes: "",
      addedAt: new Date().toISOString(),
    };
    if (target === "reading") setCurrentlyReading(book);
    else if (target === "want") addToWantToRead(book);
    else {
      setCurrentlyReading(book);
      finishCurrentlyReading({
        startedAt: new Date().toISOString(),
        finishedAt: new Date().toISOString(),
        rating: 4,
        favouriteQuote: "",
        webInspo: [],
      });
    }
    setNewTitle("");
    setNewAuthor("");
    setNewImage(null);
    setIsAdding(false);
  };

  const daysSince = (dateStr: string) => {
    const d = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
    return d <= 0 ? "today" : `${d} day${d > 1 ? "s" : ""} ago`;
  };

  return (
    <div className="den-panel den-panel--folio">
      <div className="den-panel-header">
        <span className="den-panel-zone-label">FOLIO</span>
        <button className="den-panel-close" onClick={() => setActiveZone(null)}>
          ✕
        </button>
      </div>
      <div className="den-panel-body">
        {/* Manual Add Form Toggle */}
        <div style={{ marginBottom: "1rem" }}>
          {!isAdding ? (
            <button
              className="den-btn"
              style={{ width: "100%", padding: "10px" }}
              onClick={() => setIsAdding(true)}
            >
              + Add a Book
            </button>
          ) : (
            <div
              className="den-card"
              style={{ background: "rgba(20,10,4,0.95)", border: "1px solid #302010", padding: 16 }}
            >
              <div
                style={{
                  fontFamily: "'Cinzel', serif",
                  fontSize: 14,
                  marginBottom: 12,
                  color: "#e8d8c0",
                }}
              >
                Add Book to Folio
              </div>

              <input
                className="den-input"
                placeholder="Book Title..."
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                style={{ marginBottom: 8 }}
              />

              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <input
                  className="den-input"
                  placeholder="Author Name"
                  value={newAuthor}
                  onChange={(e) => setNewAuthor(e.target.value)}
                  style={{ flex: 1 }}
                />
                <label
                  className="den-btn"
                  style={{
                    flex: 1,
                    textAlign: "center",
                    cursor: "pointer",
                    background: newImage ? "#405030" : undefined,
                  }}
                >
                  {newImage ? "Cover Selected ✓" : "Upload Cover"}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{ display: "none" }}
                  />
                </label>
              </div>

              <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                <button className="den-btn den-btn--danger" onClick={() => setIsAdding(false)}>
                  Cancel
                </button>
                <button
                  className="den-btn"
                  onClick={() => handleManualAdd("want")}
                  disabled={!newTitle.trim()}
                >
                  Want to Read
                </button>
                <button
                  className="den-btn"
                  onClick={() => handleManualAdd("reading")}
                  disabled={!newTitle.trim()}
                >
                  Reading Now
                </button>
                <button
                  className="den-btn"
                  onClick={() => handleManualAdd("read")}
                  disabled={!newTitle.trim()}
                >
                  Read
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Currently Reading */}
        {currentlyReading ? (
          <div style={{ marginBottom: "1.5rem" }}>
            <div
              style={{
                fontFamily: "'Cinzel', serif",
                fontSize: 10,
                letterSpacing: "0.2em",
                textTransform: "uppercase" as const,
                color: "var(--den-text-dim)",
                marginBottom: 8,
              }}
            >
              Currently Reading
            </div>
            <div className="den-card" style={{ padding: "1rem" }}>
              <div style={{ display: "flex", gap: 12 }}>
                {currentlyReading.coverUrl && (
                  <img
                    src={currentlyReading.coverUrl}
                    alt=""
                    className="den-cover"
                    style={{ width: 60, height: 88 }}
                  />
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "'Cinzel', serif", fontSize: 16 }}>
                    {currentlyReading.title}
                  </div>
                  <div style={{ fontStyle: "italic", fontSize: 14, color: "var(--den-text-dim)" }}>
                    {currentlyReading.author}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--den-text-dim)", marginTop: 6 }}>
                    Page {currentlyReading.currentPage} of {currentlyReading.pageCount} · started{" "}
                    {daysSince(currentlyReading.addedAt)}
                  </div>
                  <div className="den-progress" style={{ marginTop: 8 }}>
                    <div
                      className="den-progress-fill"
                      style={{
                        width: `${(currentlyReading.currentPage / Math.max(1, currentlyReading.pageCount)) * 100}%`,
                      }}
                    />
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={currentlyReading.pageCount}
                    value={currentlyReading.currentPage}
                    onChange={(e) =>
                      updateCurrentlyReading({ currentPage: Number(e.target.value) })
                    }
                    style={{ width: "100%", marginTop: 6, accentColor: "#c9a84c" }}
                  />
                </div>
              </div>
              <textarea
                className="den-textarea"
                rows={2}
                placeholder="thoughts while reading…"
                value={currentlyReading.readingNotes}
                onChange={(e) => updateCurrentlyReading({ readingNotes: e.target.value })}
                style={{ marginTop: 10, fontSize: 14 }}
              />
              <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                {!showFinish ? (
                  <button className="den-btn" onClick={() => setShowFinish(true)}>
                    Mark as Read
                  </button>
                ) : (
                  <div style={{ width: "100%" }}>
                    <StarRating value={finishRating} onChange={setFinishRating} />
                    <input
                      className="den-input"
                      placeholder="favourite quote..."
                      value={finishQuote}
                      onChange={(e) => setFinishQuote(e.target.value)}
                      style={{ marginTop: 6, fontSize: 13 }}
                    />
                    <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                      <button
                        className="den-btn"
                        onClick={() => {
                          finishCurrentlyReading({
                            startedAt: currentlyReading.addedAt,
                            finishedAt: new Date().toISOString(),
                            rating: finishRating,
                            favouriteQuote: finishQuote,
                            webInspo: [],
                          });
                          setShowFinish(false);
                          setFinishRating(4);
                          setFinishQuote("");
                        }}
                      >
                        Finish
                      </button>
                      <button
                        className="den-btn den-btn--danger"
                        onClick={() => setShowFinish(false)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="den-empty" style={{ paddingBottom: "0.5rem" }}>
            <div className="den-empty-text">
              the stand holds no book yet.
              <br />
              add one above and it will appear on your shelf.
            </div>
          </div>
        )}

        {/* Want to Read */}
        {wantToRead.length > 0 && (
          <div style={{ marginBottom: "1.5rem" }}>
            <div
              style={{
                fontFamily: "'Cinzel', serif",
                fontSize: 10,
                letterSpacing: "0.2em",
                textTransform: "uppercase" as const,
                color: "var(--den-text-dim)",
                marginBottom: 8,
              }}
            >
              Want to Read ({wantToRead.length})
            </div>
            {wantToRead.map((b) => (
              <div
                key={b.id}
                className="den-card"
                style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 6 }}
              >
                {b.coverUrl && (
                  <img
                    src={b.coverUrl}
                    alt=""
                    className="den-cover"
                    style={{ width: 32, height: 46 }}
                  />
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "'Cinzel', serif", fontSize: 13 }}>{b.title}</div>
                  <div style={{ fontSize: 12, fontStyle: "italic", color: "var(--den-text-dim)" }}>
                    {b.author}
                  </div>
                </div>
                <button className="den-btn" onClick={() => startReading(b.id)}>
                  Start
                </button>
                <button
                  className="den-btn den-btn--danger"
                  onClick={() => removeFromWantToRead(b.id)}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Read Log */}
        {readLog.length > 0 && (
          <div>
            <div
              style={{
                fontFamily: "'Cinzel', serif",
                fontSize: 10,
                letterSpacing: "0.2em",
                textTransform: "uppercase" as const,
                color: "var(--den-text-dim)",
                marginBottom: 8,
              }}
            >
              Read ({readLog.length})
            </div>
            <div className="den-grid-2">
              {readLog.map((b) => (
                <div key={b.id} className="den-card">
                  <div style={{ display: "flex", gap: 8 }}>
                    {b.coverUrl && (
                      <img
                        src={b.coverUrl}
                        alt=""
                        className="den-cover"
                        style={{ width: 40, height: 58 }}
                      />
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: "'Cinzel', serif", fontSize: 13 }}>{b.title}</div>
                      <div
                        style={{ fontSize: 12, fontStyle: "italic", color: "var(--den-text-dim)" }}
                      >
                        {b.author}
                      </div>
                      <StarRating
                        value={b.rating}
                        onChange={(v) => updateReadLog(b.id, { rating: v })}
                      />
                    </div>
                  </div>
                  {b.favouriteQuote && (
                    <div className="den-quote" style={{ marginTop: 8 }}>
                      "{b.favouriteQuote}"<div className="den-quote-attr">— {b.author}</div>
                    </div>
                  )}
                  {inspoId === b.id && inspoData[b.id] && (
                    <div
                      style={{
                        marginTop: 8,
                        padding: "6px 8px",
                        background: "rgba(0,0,0,0.3)",
                        borderRadius: 6,
                        fontSize: 12,
                        color: "var(--den-text-dim)",
                      }}
                    >
                      {inspoData[b.id].map((line, li) => (
                        <div key={li} style={{ marginBottom: 4 }}>
                          {line}
                        </div>
                      ))}
                    </div>
                  )}
                  <div
                    style={{ display: "flex", justifyContent: "flex-end", gap: 6, marginTop: 6 }}
                  >
                    <button
                      className="den-btn"
                      onClick={() => handleInspo(b)}
                      style={{ fontSize: 10 }}
                    >
                      {inspoLoading && inspoId === b.id ? "..." : "✦ Inspo"}
                    </button>
                    <button
                      className="den-btn den-btn--danger"
                      onClick={() => removeFromReadLog(b.id)}
                      style={{ fontSize: 8 }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
