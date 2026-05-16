// NookPanel.tsx — Journal, Weekly Pulse, Saves, Grimoire settings
import { useState, useRef, useCallback } from "react";
import { useDen } from "./DenContext";
import "./den.css";

export function NookPanel() {
  const { setActiveZone, saves, removeSave, nookNotes, setNookNotes, journals, updateJournal } =
    useDen();
  const [activeTab, setActiveTab] = useState<"journal" | "pulse" | "saves">("journal");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const todayStr = new Date().toISOString().split("T")[0];
  const todayJournal = journals.find((j) => j.date === todayStr) || {
    date: todayStr,
    morningIntentions: "",
    eveningReflection: "",
  };

  const handleNotesChange = useCallback(
    (value: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        setNookNotes(value);
      }, 500);
    },
    [setNookNotes],
  );

  const handleJournalChange = useCallback(
    (field: "morningIntentions" | "eveningReflection", value: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        updateJournal(todayStr, { [field]: value });
      }, 500);
    },
    [updateJournal, todayStr],
  );

  const typeIcons: Record<string, string> = {
    track: "🎵",
    movie: "🎬",
    book: "📖",
    quote: "✦",
  };

  return (
    <div className="den-panel den-panel--nook">
      <div className="den-panel-header">
        <span className="den-panel-zone-label">NOOK</span>
        <button className="den-panel-close" onClick={() => setActiveZone(null)}>
          ✕
        </button>
      </div>

      <div className="den-panel-body">
        <div className="den-tabs">
          <button
            className={`den-tab ${activeTab === "journal" ? "den-tab--active" : ""}`}
            onClick={() => setActiveTab("journal")}
          >
            Journal
          </button>
          <button
            className={`den-tab ${activeTab === "pulse" ? "den-tab--active" : ""}`}
            onClick={() => setActiveTab("pulse")}
          >
            Pulse
          </button>
          <button
            className={`den-tab ${activeTab === "saves" ? "den-tab--active" : ""}`}
            onClick={() => setActiveTab("saves")}
          >
            Saves
          </button>
        </div>

        {activeTab === "journal" && (
          <div
            className="den-card"
            style={{ background: "rgba(20,10,4,0.95)", border: "1px solid #302010" }}
          >
            <div
              style={{
                textAlign: "center",
                fontFamily: "'Dancing Script', cursive",
                fontSize: 28,
                color: "#e8d8c0",
                marginBottom: 16,
              }}
            >
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </div>

            <div className="den-panel-zone-label" style={{ marginBottom: 8, fontSize: 10 }}>
              Morning Intentions
            </div>
            <textarea
              className="den-textarea"
              rows={4}
              placeholder="What are three things you want to do today?"
              defaultValue={todayJournal.morningIntentions}
              onChange={(e) => handleJournalChange("morningIntentions", e.target.value)}
              style={{
                background: "transparent",
                border: "none",
                borderBottom: "1px dashed rgba(201,168,76,0.3)",
                borderRadius: 0,
                marginBottom: 16,
              }}
            />

            <div className="den-panel-zone-label" style={{ marginBottom: 8, fontSize: 10 }}>
              Evening Reflection
            </div>
            <textarea
              className="den-textarea"
              rows={6}
              placeholder="What actually happened? No checkboxes, just words..."
              defaultValue={todayJournal.eveningReflection}
              onChange={(e) => handleJournalChange("eveningReflection", e.target.value)}
              style={{
                background: "transparent",
                border: "none",
                borderBottom: "1px dashed rgba(201,168,76,0.3)",
                borderRadius: 0,
              }}
            />
          </div>
        )}

        {activeTab === "pulse" && (
          <div className="den-empty">
            <div className="den-empty-icon">⏳</div>
            <div className="den-empty-text">
              The Weekly Pulse will gather your activity here every Sunday. <br />
              (Books, Films, Songs, and Focus Sessions)
            </div>
          </div>
        )}

        {activeTab === "saves" && (
          <>
            {saves.length === 0 ? (
              <div className="den-empty" style={{ padding: "1rem 0" }}>
                <div className="den-empty-text">
                  the corner is quiet.
                  <br />
                  save something from ECHO, REEL, or FOLIO and it will drift here.
                </div>
              </div>
            ) : (
              <div style={{ maxHeight: 280, overflowY: "auto", marginBottom: "0.5rem" }}>
                {saves.map((s) => (
                  <div
                    key={s.id}
                    className="den-card"
                    style={{
                      display: "flex",
                      gap: 10,
                      alignItems: "center",
                      marginBottom: 6,
                      padding: "0.5rem 0.7rem",
                    }}
                  >
                    <span style={{ fontSize: 16 }}>{typeIcons[s.type] || "✦"}</span>
                    {s.imageUrl && (
                      <img
                        src={s.imageUrl}
                        alt=""
                        style={{ width: 32, height: 32, borderRadius: 4, objectFit: "cover" }}
                      />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontFamily: "'Cinzel', serif",
                          fontSize: 12,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {s.type === "quote" ? `"${s.label}"` : s.label}
                      </div>
                      <div
                        style={{ fontSize: 11, fontStyle: "italic", color: "var(--den-text-dim)" }}
                      >
                        {s.sublabel}
                      </div>
                    </div>
                    <button
                      className="den-btn den-btn--danger"
                      onClick={() => removeSave(s.id)}
                      style={{ fontSize: 8, padding: "3px 8px" }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
            <hr className="den-divider" />
            <div className="den-panel-zone-label" style={{ marginBottom: 8, fontSize: 10 }}>
              Ambient Notes
            </div>
            <textarea
              className="den-textarea"
              rows={4}
              placeholder="thoughts for no reason..."
              defaultValue={nookNotes}
              onChange={(e) => handleNotesChange(e.target.value)}
            />
          </>
        )}
      </div>
    </div>
  );
}
