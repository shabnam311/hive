// NookPanel.tsx — Journal, Focus Timer, Saves, Pulse
import { useState, useRef, useCallback, useEffect } from "react";
import { useDen } from "./DenContext";
import "./den.css";

// ─── Pomodoro Timer ───────────────────────────────────────────────────────────

function FocusTimer() {
  const [studyMin, setStudyMin] = useState(25);
  const [breakMin, setBreakMin] = useState(5);
  const [mode, setMode] = useState<"study" | "break">("study");
  const [running, setRunning] = useState(false);
  const [remaining, setRemaining] = useState(25 * 60 * 1000);
  const [sessions, setSessions] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const endsAtRef = useRef<number | null>(null);

  const totalMs = (mode === "study" ? studyMin : breakMin) * 60 * 1000;
  const pct = Math.max(0, Math.min(1, remaining / totalMs));
  const mins = Math.floor(remaining / 60000);
  const secs = Math.floor((remaining % 60000) / 1000);
  const display = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

  useEffect(() => {
    if (!running) return;
    endsAtRef.current = Date.now() + remaining;
    intervalRef.current = setInterval(() => {
      const left = Math.max(0, (endsAtRef.current ?? 0) - Date.now());
      setRemaining(left);
      if (left <= 0) {
        clearInterval(intervalRef.current!);
        setRunning(false);
        const next: "study" | "break" = mode === "study" ? "break" : "study";
        if (mode === "study") setSessions((s) => s + 1);
        setMode(next);
        setRemaining((next === "study" ? studyMin : breakMin) * 60 * 1000);
      }
    }, 500);
    return () => clearInterval(intervalRef.current!);
  }, [running]);

  const toggle = () => setRunning((r) => !r);

  const reset = () => {
    setRunning(false);
    clearInterval(intervalRef.current!);
    setRemaining((mode === "study" ? studyMin : breakMin) * 60 * 1000);
  };

  const switchMode = (m: "study" | "break") => {
    setRunning(false);
    clearInterval(intervalRef.current!);
    setMode(m);
    setRemaining((m === "study" ? studyMin : breakMin) * 60 * 1000);
  };

  // Circle ring
  const r = 54;
  const circ = 2 * Math.PI * r;
  const dash = circ * pct;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1.2rem", padding: "1rem 0" }}>
      {/* Mode tabs */}
      <div style={{ display: "flex", gap: "0.5rem" }}>
        {(["study", "break"] as const).map((m) => (
          <button
            key={m}
            onClick={() => switchMode(m)}
            style={{
              padding: "0.3rem 1rem",
              borderRadius: "20px",
              border: "1px solid",
              borderColor: mode === m ? "#c9a84c" : "rgba(201,168,76,0.2)",
              background: mode === m ? "rgba(201,168,76,0.12)" : "transparent",
              color: mode === m ? "#c9a84c" : "rgba(244,228,193,0.4)",
              fontFamily: "'Cinzel', serif",
              fontSize: "0.65rem",
              letterSpacing: "0.12em",
              cursor: "pointer",
            }}
          >
            {m === "study" ? "FOCUS" : "BREAK"}
          </button>
        ))}
      </div>

      {/* Ring timer */}
      <div style={{ position: "relative", width: 140, height: 140 }}>
        <svg width="140" height="140" style={{ transform: "rotate(-90deg)" }}>
          <circle cx="70" cy="70" r={r} fill="none" stroke="rgba(201,168,76,0.1)" strokeWidth="6"/>
          <circle
            cx="70" cy="70" r={r} fill="none"
            stroke={mode === "study" ? "#c9a84c" : "#7ab840"}
            strokeWidth="6"
            strokeDasharray={`${dash} ${circ}`}
            strokeLinecap="round"
            style={{ transition: "stroke-dasharray 0.5s linear" }}
          />
        </svg>
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: "0.1rem",
        }}>
          <span style={{ fontFamily: "monospace", fontSize: "1.8rem", color: "#f4e4c1", letterSpacing: "0.05em" }}>
            {display}
          </span>
          <span style={{ fontFamily: "'Cinzel', serif", fontSize: "0.55rem", letterSpacing: "0.18em", color: "rgba(201,168,76,0.5)" }}>
            {mode === "study" ? "FOCUS" : "REST"}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: "flex", gap: "0.75rem" }}>
        <button
          onClick={toggle}
          style={{
            padding: "0.5rem 1.8rem",
            borderRadius: "6px",
            border: "1px solid #c9a84c",
            background: running ? "rgba(201,168,76,0.05)" : "rgba(201,168,76,0.15)",
            color: "#c9a84c",
            fontFamily: "'Cinzel', serif",
            fontSize: "0.7rem",
            letterSpacing: "0.12em",
            cursor: "pointer",
          }}
        >
          {running ? "PAUSE" : "START"}
        </button>
        <button
          onClick={reset}
          style={{
            padding: "0.5rem 0.9rem",
            borderRadius: "6px",
            border: "1px solid rgba(201,168,76,0.2)",
            background: "transparent",
            color: "rgba(244,228,193,0.4)",
            fontFamily: "'Cinzel', serif",
            fontSize: "0.7rem",
            cursor: "pointer",
          }}
        >
          RESET
        </button>
      </div>

      {/* Sessions count */}
      {sessions > 0 && (
        <div style={{ fontFamily: "'Cinzel', serif", fontSize: "0.6rem", letterSpacing: "0.15em", color: "rgba(201,168,76,0.4)" }}>
          {sessions} {sessions === 1 ? "SESSION" : "SESSIONS"} COMPLETED
        </div>
      )}

      {/* Duration settings */}
      <div style={{ display: "flex", gap: "1.5rem", marginTop: "0.5rem" }}>
        {[
          { label: "FOCUS", val: studyMin, set: setStudyMin, options: [15, 20, 25, 30, 45, 60] },
          { label: "BREAK", val: breakMin, set: setBreakMin, options: [5, 10, 15] },
        ].map(({ label, val, set, options }) => (
          <div key={label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.3rem" }}>
            <span style={{ fontFamily: "'Cinzel', serif", fontSize: "0.55rem", letterSpacing: "0.15em", color: "rgba(201,168,76,0.4)" }}>{label}</span>
            <select
              value={val}
              onChange={(e) => { set(Number(e.target.value)); reset(); }}
              style={{
                background: "#0d0905",
                border: "1px solid rgba(201,168,76,0.2)",
                borderRadius: "4px",
                color: "#c9a84c",
                fontSize: "0.75rem",
                padding: "0.2rem 0.4rem",
                fontFamily: "monospace",
                cursor: "pointer",
              }}
            >
              {options.map((o) => <option key={o} value={o}>{o}m</option>)}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Panel ───────────────────────────────────────────────────────────────

export function NookPanel() {
  const { setActiveZone, saves, removeSave, nookNotes, setNookNotes, journals, updateJournal } =
    useDen();
  const [activeTab, setActiveTab] = useState<"journal" | "focus" | "saves" | "pulse">("journal");
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
      debounceRef.current = setTimeout(() => { setNookNotes(value); }, 500);
    },
    [setNookNotes],
  );

  const handleJournalChange = useCallback(
    (field: "morningIntentions" | "eveningReflection", value: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => { updateJournal(todayStr, { [field]: value }); }, 500);
    },
    [updateJournal, todayStr],
  );

  const typeIcons: Record<string, string> = { track: "🎵", movie: "🎬", book: "📖", quote: "✦" };

  return (
    <div className="den-panel den-panel--nook">
      <div className="den-panel-header">
        <span className="den-panel-zone-label">NOOK</span>
        <button className="den-panel-close" onClick={() => setActiveZone(null)}>✕</button>
      </div>

      <div className="den-panel-body">
        <div className="den-tabs">
          {(["journal", "focus", "saves", "pulse"] as const).map((t) => (
            <button
              key={t}
              className={`den-tab ${activeTab === t ? "den-tab--active" : ""}`}
              onClick={() => setActiveTab(t)}
            >
              {t === "journal" ? "Journal" : t === "focus" ? "⏱ Focus" : t === "saves" ? "Saves" : "Pulse"}
            </button>
          ))}
        </div>

        {activeTab === "journal" && (
          <div className="den-card" style={{ background: "rgba(20,10,4,0.95)", border: "1px solid #302010" }}>
            <div style={{ textAlign: "center", fontFamily: "'Dancing Script', cursive", fontSize: 28, color: "#e8d8c0", marginBottom: 16 }}>
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </div>
            <div className="den-panel-zone-label" style={{ marginBottom: 8, fontSize: 10 }}>Morning Intentions</div>
            <textarea
              className="den-textarea" rows={4}
              placeholder="What are three things you want to do today?"
              defaultValue={todayJournal.morningIntentions}
              onChange={(e) => handleJournalChange("morningIntentions", e.target.value)}
              style={{ background: "transparent", border: "none", borderBottom: "1px dashed rgba(201,168,76,0.3)", borderRadius: 0, marginBottom: 16 }}
            />
            <div className="den-panel-zone-label" style={{ marginBottom: 8, fontSize: 10 }}>Evening Reflection</div>
            <textarea
              className="den-textarea" rows={6}
              placeholder="What actually happened? No checkboxes, just words..."
              defaultValue={todayJournal.eveningReflection}
              onChange={(e) => handleJournalChange("eveningReflection", e.target.value)}
              style={{ background: "transparent", border: "none", borderBottom: "1px dashed rgba(201,168,76,0.3)", borderRadius: 0 }}
            />
          </div>
        )}

        {activeTab === "focus" && <FocusTimer />}

        {activeTab === "pulse" && (
          <div className="den-empty">
            <div className="den-empty-icon">⏳</div>
            <div className="den-empty-text">
              The Weekly Pulse will gather your activity here every Sunday.<br/>
              (Books, Films, Songs, and Focus Sessions)
            </div>
          </div>
        )}

        {activeTab === "saves" && (
          <>
            {saves.length === 0 ? (
              <div className="den-empty" style={{ padding: "1rem 0" }}>
                <div className="den-empty-text">
                  the corner is quiet.<br/>
                  save something from ECHO, REEL, or FOLIO and it will drift here.
                </div>
              </div>
            ) : (
              <div style={{ maxHeight: 280, overflowY: "auto", marginBottom: "0.5rem" }}>
                {saves.map((s) => (
                  <div key={s.id} className="den-card" style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 6, padding: "0.5rem 0.7rem" }}>
                    <span style={{ fontSize: 16 }}>{typeIcons[s.type] || "✦"}</span>
                    {s.imageUrl && <img src={s.imageUrl} alt="" style={{ width: 32, height: 32, borderRadius: 4, objectFit: "cover" }}/>}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: "'Cinzel', serif", fontSize: 12, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {s.type === "quote" ? `"${s.label}"` : s.label}
                      </div>
                      <div style={{ fontSize: 11, fontStyle: "italic", color: "var(--den-text-dim)" }}>{s.sublabel}</div>
                    </div>
                    <button className="den-btn den-btn--danger" onClick={() => removeSave(s.id)} style={{ fontSize: 8, padding: "3px 8px" }}>✕</button>
                  </div>
                ))}
              </div>
            )}
            <hr className="den-divider"/>
            <div className="den-panel-zone-label" style={{ marginBottom: 8, fontSize: 10 }}>Ambient Notes</div>
            <textarea
              className="den-textarea" rows={4}
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