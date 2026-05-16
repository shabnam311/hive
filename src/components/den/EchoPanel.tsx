import { useState } from "react";
import { useDen } from "./DenContext";
import "./den.css";

export function EchoPanel() {
  const { setActiveZone, spotifyPlaylistUrl, setSpotifyPlaylistUrl } = useDen();
  const [inputUrl, setInputUrl] = useState("");

  // Convert standard open.spotify.com link to embed format
  const getEmbedUrl = (url: string) => {
    try {
      if (url.includes("open.spotify.com")) {
        const urlObj = new URL(url);
        // Extracts /playlist/1234 from https://open.spotify.com/playlist/1234
        return `https://open.spotify.com/embed${urlObj.pathname}?utm_source=generator&theme=0`;
      }
      return url;
    } catch {
      return null;
    }
  };

  const handleSave = () => {
    const embedUrl = getEmbedUrl(inputUrl);
    if (embedUrl) {
      setSpotifyPlaylistUrl(embedUrl);
      setInputUrl("");
    } else {
      alert("Please paste a valid Spotify link (e.g. https://open.spotify.com/playlist/...)");
    }
  };

  return (
    <div className="den-panel den-panel--echo">
      <div className="den-panel-header">
        <span className="den-panel-zone-label">ECHO</span>
        <button className="den-panel-close" onClick={() => setActiveZone(null)}>
          ✕
        </button>
      </div>
      <div className="den-panel-body">
        {!spotifyPlaylistUrl ? (
          <div className="den-empty" style={{ paddingTop: "3rem", paddingBottom: "3rem" }}>
            <div style={{ fontSize: "48px", marginBottom: "1.5rem", opacity: 0.3 }}>♫</div>
            <div className="den-empty-text">silence is a room waiting to be filled.</div>

            <div
              style={{
                marginTop: "2rem",
                width: "100%",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              <input
                className="den-input"
                placeholder="Paste Spotify Playlist Link here..."
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
              />
              <button
                className="den-btn"
                style={{ padding: "10px 28px", fontSize: "10px" }}
                onClick={handleSave}
                disabled={!inputUrl}
              >
                Set Soundtrack
              </button>
            </div>

            {/* Decorative record player SVG */}
            <div style={{ marginTop: "3rem", opacity: 0.15 }}>
              <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
                <circle cx="60" cy="60" r="50" stroke="#c9a84c" strokeWidth="1" />
                <circle cx="60" cy="60" r="40" stroke="#c9a84c" strokeWidth="0.5" />
                <circle cx="60" cy="60" r="30" stroke="#c9a84c" strokeWidth="0.5" />
                <circle cx="60" cy="60" r="15" fill="#c9a84c" fillOpacity="0.3" />
                <circle cx="60" cy="60" r="5" fill="#c9a84c" fillOpacity="0.6" />
                <line x1="60" y1="15" x2="85" y2="10" stroke="#c9a84c" strokeWidth="1" />
              </svg>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
            <div
              style={{
                fontFamily: "'Cinzel', serif",
                fontSize: "10px",
                letterSpacing: "0.2em",
                textTransform: "uppercase" as const,
                color: "var(--den-text-dim)",
                marginBottom: "0.8rem",
              }}
            >
              Current Soundtrack
            </div>

            <iframe
              src={spotifyPlaylistUrl}
              width="100%"
              height="352"
              frameBorder="0"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              style={{ borderRadius: "12px", border: "1px solid rgba(200, 150, 50, 0.2)" }}
            ></iframe>

            <div style={{ marginTop: "auto", paddingTop: "2rem", textAlign: "center" }}>
              <button
                className="den-btn den-btn--danger"
                onClick={() => setSpotifyPlaylistUrl(null)}
                style={{ fontSize: "10px" }}
              >
                Remove Playlist
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
