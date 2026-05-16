// ReelPanel.tsx — Movie journal with TMDB search + Ollama Inspo
import { useState } from "react";
import { useDen, type Movie, type WatchedMovie } from "./DenContext";
import { getMovieInspo } from "../../lib/ollama";
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

export function ReelPanel() {
  const {
    setActiveZone,
    watchlist,
    watched,
    addToWatchlist,
    removeFromWatchlist,
    markWatched,
    updateWatched,
    removeWatched,
  } = useDen();
  const [tab, setTab] = useState<"watchlist" | "watched">("watchlist");

  // Manual Entry Form
  const [newTitle, setNewTitle] = useState("");
  const [newYear, setNewYear] = useState("");
  const [newImage, setNewImage] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [markRating, setMarkRating] = useState(4);
  const [markNote, setMarkNote] = useState("");

  const [inspoId, setInspoId] = useState<string | null>(null);
  const [inspoLoading, setInspoLoading] = useState(false);
  const [inspoData, setInspoData] = useState<Record<string, string[]>>({});

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

  const handleManualAdd = (target: "watchlist" | "watched") => {
    if (!newTitle.trim()) return;
    const movie: Movie = {
      id: crypto.randomUUID(),
      title: newTitle,
      year: newYear || new Date().getFullYear().toString(),
      genre: "",
      director: "",
      plot: "",
      posterUrl: newImage,
      addedAt: new Date().toISOString(),
    };

    if (target === "watchlist") {
      addToWatchlist(movie);
    } else {
      addToWatchlist(movie);
      markWatched(movie.id, {
        watchedAt: new Date().toISOString(),
        rating: 4,
        note: "",
        webInspo: [],
      });
    }
    setNewTitle("");
    setNewYear("");
    setNewImage(null);
    setIsAdding(false);
  };

  const handleInspo = async (m: WatchedMovie) => {
    if (inspoData[m.id]) {
      setInspoId(inspoId === m.id ? null : m.id);
      return;
    }
    setInspoId(m.id);
    setInspoLoading(true);
    const insights = await getMovieInspo(m.title, m.year);
    setInspoData((d) => ({
      ...d,
      [m.id]:
        insights.length > 0
          ? insights
          : ["Ollama not available — start it locally to get insights."],
    }));
    setInspoLoading(false);
  };

  const thisMonth = watched.filter((m) => {
    const d = new Date(m.watchedAt);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  return (
    <div className="den-panel den-panel--reel">
      <div className="den-panel-header">
        <span className="den-panel-zone-label">REEL</span>
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
              + Add a Film
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
                Add Film to Reel
              </div>

              <input
                className="den-input"
                placeholder="Film Title..."
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                style={{ marginBottom: 8 }}
              />

              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <input
                  className="den-input"
                  placeholder="Release Year"
                  value={newYear}
                  onChange={(e) => setNewYear(e.target.value)}
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
                  {newImage ? "Image Selected ✓" : "Upload Poster"}
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
                  onClick={() => handleManualAdd("watchlist")}
                  disabled={!newTitle.trim()}
                >
                  To Watchlist
                </button>
                <button
                  className="den-btn"
                  onClick={() => handleManualAdd("watched")}
                  disabled={!newTitle.trim()}
                >
                  To Watched
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="den-tabs">
          <button
            className={`den-tab ${tab === "watchlist" ? "den-tab--active" : ""}`}
            onClick={() => setTab("watchlist")}
          >
            Watchlist ({watchlist.length})
          </button>
          <button
            className={`den-tab ${tab === "watched" ? "den-tab--active" : ""}`}
            onClick={() => setTab("watched")}
          >
            Watched ({watched.length})
          </button>
        </div>

        {/* Watchlist */}
        {tab === "watchlist" && (
          <>
            {watchlist.length === 0 ? (
              <div className="den-empty">
                <div className="den-empty-text">
                  no films queued yet. the reel is empty.
                  <br />
                  search for a film above, or browse what the night calls for.
                </div>
              </div>
            ) : (
              <div className="den-grid-2">
                {watchlist.map((m) => (
                  <div key={m.id} className="den-card">
                    <div style={{ display: "flex", gap: 8 }}>
                      {m.posterUrl && (
                        <img
                          src={m.posterUrl}
                          alt=""
                          className="den-poster"
                          style={{ width: 50, height: 72 }}
                        />
                      )}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: "'Cinzel', serif", fontSize: 13 }}>{m.title}</div>
                        <div
                          style={{
                            fontSize: 12,
                            fontStyle: "italic",
                            color: "var(--den-text-dim)",
                          }}
                        >
                          {m.year}{" "}
                          {m.genre && (
                            <span className="den-genre-tag" style={{ marginLeft: 6 }}>
                              {m.genre.split(",")[0]}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                      {markingId === m.id ? (
                        <div style={{ width: "100%" }}>
                          <StarRating value={markRating} onChange={setMarkRating} />
                          <input
                            className="den-input"
                            placeholder="favourite quote or note..."
                            value={markNote}
                            onChange={(e) => setMarkNote(e.target.value)}
                            style={{ marginTop: 6, fontSize: 13 }}
                          />
                          <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                            <button
                              className="den-btn"
                              onClick={() => {
                                markWatched(m.id, {
                                  watchedAt: new Date().toISOString(),
                                  rating: markRating,
                                  note: markNote,
                                  webInspo: [],
                                });
                                setMarkingId(null);
                                setMarkRating(4);
                                setMarkNote("");
                              }}
                            >
                              Finish
                            </button>
                            <button
                              className="den-btn den-btn--danger"
                              onClick={() => setMarkingId(null)}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <button className="den-btn" onClick={() => setMarkingId(m.id)}>
                            Mark Watched
                          </button>
                          <button
                            className="den-btn den-btn--danger"
                            onClick={() => removeFromWatchlist(m.id)}
                          >
                            ✕
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Watched */}
        {tab === "watched" && (
          <>
            {watched.length === 0 ? (
              <div className="den-empty">
                <div className="den-empty-text">no reels rolling yet.</div>
              </div>
            ) : (
              <div className="den-grid-2">
                {watched.map((m) => (
                  <div key={m.id} className="den-card">
                    <div style={{ display: "flex", gap: 8 }}>
                      {m.posterUrl && (
                        <img
                          src={m.posterUrl}
                          alt=""
                          className="den-poster"
                          style={{ width: 50, height: 72 }}
                        />
                      )}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: "'Cinzel', serif", fontSize: 13 }}>{m.title}</div>
                        <div
                          style={{
                            fontSize: 12,
                            fontStyle: "italic",
                            color: "var(--den-text-dim)",
                          }}
                        >
                          {m.year}
                        </div>
                        <StarRating
                          value={m.rating}
                          onChange={(v) => updateWatched(m.id, { rating: v })}
                        />
                      </div>
                    </div>
                    {m.note && (
                      <div
                        style={{
                          fontSize: 14,
                          fontStyle: "italic",
                          color: "var(--den-parchment)",
                          marginTop: 6,
                          opacity: 0.8,
                        }}
                      >
                        "{m.note}"
                      </div>
                    )}
                    {/* Inspo section */}
                    {inspoId === m.id && inspoData[m.id] && (
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
                        {inspoData[m.id].map((line, li) => (
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
                        onClick={() => handleInspo(m)}
                        style={{ fontSize: 10 }}
                      >
                        {inspoLoading && inspoId === m.id ? "..." : "✦ Inspo"}
                      </button>
                      <button
                        className="den-btn den-btn--danger"
                        onClick={() => removeWatched(m.id)}
                        style={{ fontSize: 8 }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Stats */}
        <div className="den-stats">
          Watched: {watched.length} films · Watchlist: {watchlist.length} · This month: {thisMonth}
        </div>
      </div>
    </div>
  );
}
