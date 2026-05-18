// EchoPanel.tsx — Music corner of the Den
import { useState } from "react";
import { useDen } from "./DenContext";
import "./den.css";

const MOODS = ["3am", "studying", "cozy", "melancholic", "euphoric", "wandering", "focus", "nostalgic"];

interface LoggedTrack {
  id: string;
  title: string;
  artist: string;
  mood: string;
  note: string;
  loggedAt: string;
}

function getEmbedUrl(url: string): string | null {
  try {
    if (url.includes("open.spotify.com")) {
      const u = new URL(url);
      return `https://open.spotify.com/embed${u.pathname}?utm_source=generator&theme=0`;
    }
    return null;
  } catch {
    return null;
  }
}

export function EchoPanel() {
  const { setActiveZone, spotifyPlaylistUrl, setSpotifyPlaylistUrl } = useDen();
  const [tab, setTab] = useState<"player" | "log">("player");
  const [inputUrl, setInputUrl] = useState("");
  const [urlError, setUrlError] = useState(false);
  const [changingPlaylist, setChangingPlaylist] = useState(false);

  const [tracks, setTracks] = useState<LoggedTrack[]>(() => {
    try { return JSON.parse(localStorage.getItem("hive.echo.log") ?? "[]"); } catch { return []; }
  });
  const [logForm, setLogForm] = useState({ title: "", artist: "", mood: "cozy", note: "" });
  const [showLogForm, setShowLogForm] = useState(false);

  const saveTrack = () => {
    if (!logForm.title.trim()) return;
    const entry: LoggedTrack = {
      id: Math.random().toString(36).slice(2),
      ...logForm,
      loggedAt: new Date().toISOString(),
    };
    const next = [entry, ...tracks].slice(0, 100);
    setTracks(next);
    localStorage.setItem("hive.echo.log", JSON.stringify(next));
    setLogForm({ title: "", artist: "", mood: "cozy", note: "" });
    setShowLogForm(false);
  };

  const removeTrack = (id: string) => {
    const next = tracks.filter((t) => t.id !== id);
    setTracks(next);
    localStorage.setItem("hive.echo.log", JSON.stringify(next));
  };

  const handleSaveUrl = () => {
    const embed = getEmbedUrl(inputUrl.trim());
    if (!embed) { setUrlError(true); return; }
    setSpotifyPlaylistUrl(embed);
    setInputUrl("");
    setUrlError(false);
    setChangingPlaylist(false);
  };

  return (
    <div className="den-panel den-panel--echo">
      <div className="den-panel-header">
        <span className="den-panel-zone-label">ECHO</span>
        <button className="den-panel-close" onClick={() => setActiveZone(null)}>✕</button>
      </div>

      <div className="den-panel-body">
        <div className="den-tabs" style={{ marginBottom: "1rem" }}>
          {(["player", "log"] as const).map((t) => (
            <button key={t} className={`den-tab ${tab === t ? "den-tab--active" : ""}`} onClick={() => setTab(t)}>
              {t === "player" ? "♫ Player" : "📖 Log"}
            </button>
          ))}
        </div>

        {tab === "player" && (
          <>
            {spotifyPlaylistUrl && !changingPlaylist ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <iframe
                  src={spotifyPlaylistUrl}
                  width="100%" height="380" frameBorder="0"
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  loading="lazy"
                  style={{ borderRadius: "12px", border: "1px solid rgba(201,168,76,0.15)" }}
                />
                <button
                  className="den-btn"
                  onClick={() => setChangingPlaylist(true)}
                  style={{ alignSelf: "center", fontSize: "0.72rem", opacity: 0.5 }}
                >
                  change playlist
                </button>
              </div>
            ) : (
              <div className="den-empty" style={{ paddingTop: "1.5rem", paddingBottom: "1.5rem" }}>
                {/* Show mini preview of current playlist while changing */}
                {spotifyPlaylistUrl && changingPlaylist && (
                  <div style={{ width: "100%", marginBottom: "1rem" }}>
                    <iframe
                      src={spotifyPlaylistUrl}
                      width="100%" height="80" frameBorder="0"
                      style={{ borderRadius: "8px", border: "1px solid rgba(201,168,76,0.1)", opacity: 0.5, pointerEvents: "none", display: "block" }}
                    />
                    <p style={{ fontSize: "0.7rem", color: "rgba(244,228,193,0.35)", textAlign: "center", marginTop: "0.3rem", fontStyle: "italic" }}>
                      ♫ still playing — paste new link below
                    </p>
                  </div>
                )}
                {!spotifyPlaylistUrl && (
                  <div style={{ fontSize: "3rem", marginBottom: "1rem", opacity: 0.25 }}>♫</div>
                )}
                <div className="den-empty-text" style={{ marginBottom: "1.5rem" }}>
                  {spotifyPlaylistUrl ? "paste a new playlist link" : "silence is a room waiting to be filled."}
                </div>
                <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "8px" }}>
                  <input
                    className="den-input"
                    placeholder="paste a Spotify playlist / album / track link…"
                    value={inputUrl}
                    onChange={(e) => { setInputUrl(e.target.value); setUrlError(false); }}
                    onKeyDown={(e) => e.key === "Enter" && handleSaveUrl()}
                    style={{ borderColor: urlError ? "#c0392b" : undefined }}
                    autoFocus
                  />
                  {urlError && (
                    <span style={{ fontSize: "0.75rem", color: "#c0392b", fontStyle: "italic" }}>
                      paste a link from open.spotify.com
                    </span>
                  )}
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button className="den-btn den-btn--primary" onClick={handleSaveUrl} style={{ flex: 1 }}>
                      tune in
                    </button>
                    {changingPlaylist && (
                      <button className="den-btn" onClick={() => { setChangingPlaylist(false); setInputUrl(""); setUrlError(false); }}>
                        cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {tab === "log" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {!showLogForm ? (
              <button className="den-btn den-btn--primary" onClick={() => setShowLogForm(true)} style={{ alignSelf: "flex-start" }}>
                + log what you're listening to
              </button>
            ) : (
              <div className="den-card" style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                <input className="den-input" placeholder="track / album title *" value={logForm.title} onChange={(e) => setLogForm({ ...logForm, title: e.target.value })} />
                <input className="den-input" placeholder="artist" value={logForm.artist} onChange={(e) => setLogForm({ ...logForm, artist: e.target.value })} />
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                  {MOODS.map((m) => (
                    <button key={m} onClick={() => setLogForm({ ...logForm, mood: m })} style={{ padding: "0.2rem 0.6rem", borderRadius: "20px", border: "1px solid", borderColor: logForm.mood === m ? "#c9a84c" : "rgba(201,168,76,0.2)", background: logForm.mood === m ? "rgba(201,168,76,0.15)" : "transparent", color: logForm.mood === m ? "#c9a84c" : "rgba(244,228,193,0.45)", fontSize: "0.72rem", cursor: "pointer", fontFamily: "'Cinzel', serif", letterSpacing: "0.06em" }}>
                      {m}
                    </button>
                  ))}
                </div>
                <textarea className="den-textarea" placeholder="a note (optional)…" rows={2} value={logForm.note} onChange={(e) => setLogForm({ ...logForm, note: e.target.value })} />
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button className="den-btn den-btn--primary" onClick={saveTrack} style={{ flex: 1 }}>save</button>
                  <button className="den-btn" onClick={() => setShowLogForm(false)}>cancel</button>
                </div>
              </div>
            )}
            {tracks.length === 0 ? (
              <div className="den-empty" style={{ paddingTop: "1.5rem" }}>
                <div className="den-empty-text">your listening log is empty.<br />start logging what moves you.</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", maxHeight: "340px", overflowY: "auto" }}>
                {tracks.map((t) => (
                  <div key={t.id} className="den-card" style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start", padding: "0.6rem 0.75rem" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                        <span style={{ fontFamily: "'Cinzel', serif", fontSize: "0.82rem", color: "#f4e4c1" }}>{t.title}</span>
                        {t.artist && <span style={{ fontSize: "0.75rem", color: "rgba(244,228,193,0.45)", fontStyle: "italic" }}>— {t.artist}</span>}
                        <span style={{ padding: "0.1rem 0.5rem", borderRadius: "20px", border: "1px solid rgba(201,168,76,0.25)", color: "rgba(201,168,76,0.7)", fontSize: "0.65rem", fontFamily: "'Cinzel', serif", letterSpacing: "0.06em" }}>{t.mood}</span>
                      </div>
                      {t.note && <div style={{ fontSize: "0.78rem", color: "rgba(244,228,193,0.4)", fontStyle: "italic", marginTop: "0.2rem" }}>"{t.note}"</div>}
                      <div style={{ fontSize: "0.65rem", color: "rgba(244,228,193,0.25)", marginTop: "0.2rem" }}>{new Date(t.loggedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</div>
                    </div>
                    <button className="den-btn" onClick={() => removeTrack(t.id)} style={{ fontSize: "0.65rem", padding: "2px 6px", opacity: 0.4, flexShrink: 0 }}>✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}