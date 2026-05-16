import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useEffect, useRef, Suspense } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Feather,
  Flame,
  Sparkles,
  Volume2,
  VolumeX,
  PenTool,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { DiaryScene } from "@/components/diary/DiaryScene";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { RealmNav } from "@/components/RealmShell";

export const Route = createFileRoute("/diary")({
  component: DiaryPage,
});

type DiaryEntry = {
  id: string;
  date: string;
  content: string;
  mood: string;
  wordCount: number;
  updatedAt: string;
};
type DiaryData = Record<string, DiaryEntry>;

const MOODS = [
  { emoji: "🌧️", label: "melancholy" },
  { emoji: "🌿", label: "peaceful" },
  { emoji: "🔥", label: "passionate" },
  { emoji: "⭐", label: "inspired" },
  { emoji: "🌙", label: "reflective" },
  { emoji: "☀️", label: "radiant" },
  { emoji: "🌊", label: "overwhelmed" },
  { emoji: "🍂", label: "nostalgic" },
];

const PROMPTS = [
  "what did the world whisper to you today?",
  "what are you grateful for, even quietly?",
  "describe a moment that made you pause.",
  "what would you tell yesterday's you?",
  "what colour was today?",
  "what are you carrying that you could set down?",
];

const fmtKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

// ─── Custom Icons ─────────────────────────────────────────────────────────

const UnlitCandleIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    opacity={0.5}
  >
    <rect x="9" y="10" width="6" height="12" rx="1" />
    <path d="M12 10V8" />
  </svg>
);

const PaperStackIcon = ({ count }: { count: number }) => {
  const h = Math.min(count * 2, 12);
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={`M4 ${20 - h}h16v2H4z`} fill="currentColor" fillOpacity={0.2} />
      <path d="M4 22h16v-2H4v2z" />
      <path d="M5 18h14v-2H5v2z" opacity={0.7} />
      <path d="M6 14h12v-2H6v2z" opacity={0.4} />
    </svg>
  );
};

const DrawnBookIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
  </svg>
);

// ─── Number Flip Counter ───────────────────────────────────────────────────

function FlipCounter({ value }: { value: number }) {
  return (
    <div
      style={{ display: "inline-flex", overflow: "hidden", height: "1.2em", position: "relative" }}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={value}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -20, opacity: 0, position: "absolute" }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          style={{ display: "inline-block" }}
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────

function DiaryPage() {
  const today = new Date();
  const [entries, setEntries] = useLocalStorage<DiaryData>("hive.diary.v1", {});
  const [selected, setSelected] = useState(fmtKey(today));
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [draft, setDraft] = useState("");
  const [draftMood, setDraftMood] = useState("");
  const [pulse, setPulse] = useState(0);

  const [isSealing, setIsSealing] = useState(false);
  const [hasSealed, setHasSealed] = useState(false);

  const [isFocused, setIsFocused] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [ambientSound, setAmbientSound] = useState(false);
  const [prompt] = useState(() => PROMPTS[Math.floor(Math.random() * PROMPTS.length)]);
  const textRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const entry = entries[selected];
    setDraft(entry?.content ?? "");
    setDraftMood(entry?.mood ?? "");
    setHasSealed(false);
  }, [selected]);

  const wordCount = useMemo(() => draft.trim().split(/\s+/).filter(Boolean).length, [draft]);

  const streak = useMemo(() => {
    let count = 0;
    const d = new Date(today);
    while (true) {
      const key = fmtKey(d);
      if (entries[key] && entries[key].content.trim().length > 0) {
        count++;
        d.setDate(d.getDate() - 1);
      } else break;
    }
    return count;
  }, [entries]);

  const totalEntries = useMemo(
    () => Object.values(entries).filter((e) => e.content.trim().length > 0).length,
    [entries],
  );

  const save = () => {
    setIsSealing(true);
    setTimeout(() => {
      const entry: DiaryEntry = {
        id: selected,
        date: selected,
        content: draft,
        mood: draftMood,
        wordCount,
        updatedAt: new Date().toISOString(),
      };
      setEntries((prev) => ({ ...prev, [selected]: entry }));
      setPulse((p) => p + 1);
      setHasSealed(true);
      setIsSealing(false);
    }, 600);
    setTimeout(() => setHasSealed(false), 3000);
  };

  const grid = useMemo(() => {
    const first = new Date(viewYear, viewMonth, 1);
    const startDay = first.getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const cells: Array<{ day: number | null; key: string | null }> = [];
    for (let i = 0; i < startDay; i++) cells.push({ day: null, key: null });
    for (let d = 1; d <= daysInMonth; d++)
      cells.push({ day: d, key: fmtKey(new Date(viewYear, viewMonth, d)) });
    while (cells.length % 7 !== 0) cells.push({ day: null, key: null });
    return cells;
  }, [viewYear, viewMonth]);

  const flipMonth = (dir: "next" | "prev") => {
    let nm = dir === "next" ? viewMonth + 1 : viewMonth - 1;
    let ny = viewYear;
    if (nm > 11) {
      nm = 0;
      ny += 1;
    }
    if (nm < 0) {
      nm = 11;
      ny -= 1;
    }
    setViewYear(ny);
    setViewMonth(nm);
  };

  const selectedDate = new Date(selected + "T00:00:00");
  const prettyDay = selectedDate
    .toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })
    .toUpperCase();

  // ─── Animations ──────────────────────────────────────────────────────────

  const staggerContainer = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.1 } },
  };
  const fadeIn: any = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } },
  };

  const titleChars = "The Diary".split("");
  const titleContainer: any = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.06 } },
  };
  const titleChar: any = {
    hidden: { opacity: 0, filter: "blur(10px)", scale: 1.05 },
    show: { opacity: 1, filter: "blur(0px)", scale: 1, transition: { duration: 0.8 } },
  };

  // ─── Styles ──────────────────────────────────────────────────────────────

  const pageStyle: React.CSSProperties = {
    position: "relative",
    minHeight: "100vh",
    width: "100%",
    overflow: "hidden",
    background: "#0d0906",
  };

  const grimBg: React.CSSProperties = {
    background: "radial-gradient(ellipse at 50% 30%, rgba(55,30,15,0.95), rgba(20,12,6,0.98) 70%)",
    border: "1px solid rgba(180,140,70,0.25)",
    borderRadius: 16,
    backdropFilter: "blur(12px)",
    boxShadow:
      "0 12px 40px rgba(0,0,0,0.8), inset 0 4px 20px rgba(0,0,0,0.6), inset 0 1px 0 rgba(201,168,76,0.08)",
  };

  const paperBg: React.CSSProperties = {
    background: "rgba(230, 215, 195, 0.04)",
    border: "1px solid rgba(180,140,70,0.15)",
    borderRadius: 12,
  };

  const calBg: React.CSSProperties = {
    background: "linear-gradient(145deg, rgba(42,26,14,0.95), rgba(30,18,10,0.98))",
    backgroundImage:
      "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.02) 2px, rgba(0,0,0,0.02) 4px)",
    border: "1px solid rgba(180,140,70,0.2)",
    borderRadius: 16,
    boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
  };

  return (
    <div style={pageStyle}>
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 1,
          background: "linear-gradient(90deg, transparent, #c9a84c, transparent)",
          zIndex: 100,
          opacity: 0.7,
        }}
      />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ duration: 2 }}
        style={{ position: "absolute", inset: 0 }}
      >
        <Suspense fallback={null}>
          <DiaryScene pulse={pulse} />
        </Suspense>
      </motion.div>

      <div
        style={{
          position: "absolute",
          inset: 0,
          overflow: "hidden",
          pointerEvents: "none",
          zIndex: 2,
        }}
      >
        {Array.from({ length: 25 }).map((_, i) => (
          <motion.div
            key={`mote-${i}`}
            initial={{ y: "100vh", x: `${Math.random() * 100}vw`, opacity: 0 }}
            animate={{
              y: "-20vh",
              opacity: [0, 0.4, 0.4, 0],
              x: `${Math.random() * 100}vw`,
            }}
            transition={{
              duration: 15 + Math.random() * 20,
              repeat: Infinity,
              delay: Math.random() * 20,
              ease: "linear",
            }}
            style={{
              position: "absolute",
              width: 3,
              height: 3,
              background: "#ffccaa",
              borderRadius: "50%",
              filter: "blur(1px)",
            }}
          />
        ))}
      </div>

      <div className="pointer-events-auto relative z-[60]">
        <RealmNav />
      </div>

      <motion.main
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        style={{
          position: "relative",
          zIndex: 10,
          maxWidth: 1100,
          margin: "0 auto",
          padding: "100px 24px 60px",
        }}
      >
        <motion.div variants={fadeIn} style={{ marginBottom: 32, y: scrollY * 0.4 }}>
          <motion.h1
            variants={titleContainer}
            style={{
              fontFamily: "'Cinzel',serif",
              fontSize: "clamp(36px, 6vw, 52px)",
              color: "#f5ecd7",
              textShadow: "0 0 20px rgba(201,168,76,0.4)",
              margin: 0,
              display: "flex",
            }}
          >
            {titleChars.map((c, i) => (
              <motion.span
                key={i}
                variants={titleChar}
                style={{ whiteSpace: c === " " ? "pre" : "normal" }}
              >
                {c}
              </motion.span>
            ))}
          </motion.h1>
          <motion.div
            variants={fadeIn}
            style={{
              fontFamily: "'Dancing Script',cursive",
              fontSize: 20,
              color: "rgba(201,168,76,0.7)",
              marginTop: 8,
            }}
          >
            ink your truth. the pages remember.
          </motion.div>
        </motion.div>

        <div style={{ display: "grid", gap: 24, gridTemplateColumns: "minmax(0,1fr) 300px" }}>
          <motion.div variants={fadeIn}>
            <motion.div
              animate={{ y: [0, -2, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              style={{ ...grimBg, padding: 28, position: "relative" }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 20,
                }}
              >
                <div>
                  <div
                    style={{
                      fontFamily: "'Cinzel',serif",
                      fontSize: 14,
                      letterSpacing: "0.25em",
                      color: "rgba(201,168,76,0.9)",
                      textShadow: "0 1px 2px rgba(0,0,0,0.8)",
                    }}
                  >
                    {prettyDay}
                  </div>
                  {draftMood && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      style={{
                        fontFamily: "'Dancing Script',cursive",
                        fontSize: 16,
                        color: "rgba(245,236,215,0.5)",
                        marginTop: 4,
                        display: "block",
                      }}
                    >
                      feeling {MOODS.find((m) => m.emoji === draftMood)?.label}
                    </motion.span>
                  )}
                </div>

                <button
                  className="seal-btn"
                  onClick={save}
                  disabled={isSealing || hasSealed}
                  style={{
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "10px 22px",
                    borderRadius: 24,
                    fontFamily: "'Cinzel',serif",
                    fontSize: 11,
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    border: hasSealed ? "1px solid rgba(45,90,45,0.6)" : "1px solid #4a1010",
                    background: hasSealed
                      ? "rgba(45,90,45,0.2)"
                      : "linear-gradient(135deg, #8b1a1a, #5a1010)",
                    color: hasSealed ? "#6a9a6a" : "#f5ecd7",
                    cursor: "pointer",
                    transition: "all 0.3s",
                    boxShadow: hasSealed
                      ? "none"
                      : "0 4px 10px rgba(0,0,0,0.5), inset 0 2px 4px rgba(255,255,255,0.2)",
                  }}
                >
                  {hasSealed ? (
                    <Flame size={14} />
                  ) : (
                    <div
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: "50%",
                        border: "1px solid rgba(255,255,255,0.3)",
                        display: "grid",
                        placeItems: "center",
                      }}
                    >
                      <span style={{ fontSize: 8 }}>H</span>
                    </div>
                  )}
                  {hasSealed ? "inked" : "seal it"}
                  {isSealing && (
                    <motion.div
                      animate={{ scaleY: [0, 2, 2], y: [0, 0, 8], opacity: [1, 1, 0] }}
                      transition={{ duration: 0.6 }}
                      style={{
                        position: "absolute",
                        bottom: -4,
                        left: "50%",
                        translateX: "-50%",
                        width: 6,
                        height: 12,
                        background: "#5a1010",
                        borderRadius: "0 0 4px 4px",
                        transformOrigin: "top",
                      }}
                    />
                  )}
                </button>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginBottom: 20,
                  padding: "8px 16px",
                  background: "rgba(10,5,2,0.6)",
                  borderRadius: 24,
                  border: "1px solid rgba(201,168,76,0.1)",
                  width: "fit-content",
                }}
              >
                <span
                  style={{
                    fontFamily: "'Cinzel',serif",
                    fontSize: 9,
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    color: "rgba(201,168,76,0.5)",
                    marginRight: 6,
                  }}
                >
                  mood
                </span>
                {MOODS.map((m) => (
                  <motion.button
                    key={m.emoji}
                    onClick={() => setDraftMood(draftMood === m.emoji ? "" : m.emoji)}
                    title={m.label}
                    whileHover={{ y: -6, scale: 1.15 }}
                    whileTap={{ scale: 0.9 }}
                    style={{
                      position: "relative",
                      padding: "4px",
                      fontSize: 18,
                      borderRadius: "50%",
                      border: "none",
                      cursor: "pointer",
                      background: "transparent",
                      opacity: draftMood === m.emoji ? 1 : draftMood ? 0.3 : 1,
                      filter:
                        draftMood === m.emoji
                          ? "drop-shadow(0 0 10px rgba(201,168,76,0.8))"
                          : "none",
                    }}
                  >
                    {m.emoji}
                    {draftMood === m.emoji && (
                      <motion.div
                        key={m.emoji + pulse}
                        initial={{ scale: 0.8, opacity: 0.8 }}
                        animate={{ scale: 1.6, opacity: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        style={{
                          position: "absolute",
                          inset: 0,
                          borderRadius: "50%",
                          border: "2px solid #c9a84c",
                        }}
                      />
                    )}
                  </motion.button>
                ))}
              </div>

              <motion.div
                animate={isSealing ? { scale: 0.98, opacity: 0.5 } : { scale: 1, opacity: 1 }}
                transition={{ duration: 0.4 }}
              >
                <AnimatePresence>
                  {!draft && !isFocused && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, filter: "blur(4px)" }}
                      style={{ padding: "20px", marginBottom: 16, textAlign: "center" }}
                    >
                      <Feather
                        size={16}
                        style={{ color: "rgba(201,168,76,0.4)", margin: "0 auto 8px" }}
                      />
                      <div
                        className="prompt-pulse"
                        style={{
                          fontFamily: "'Dancing Script',cursive",
                          fontSize: 18,
                          color: "rgba(245,236,215,0.5)",
                          fontStyle: "italic",
                        }}
                      >
                        {prompt}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div style={{ ...paperBg, position: "relative", overflow: "hidden" }}>
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      opacity: 0.08,
                      mixBlendMode: "overlay",
                      pointerEvents: "none",
                      backgroundImage:
                        'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")',
                    }}
                  />

                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      pointerEvents: "none",
                      backgroundImage:
                        "repeating-linear-gradient(transparent, transparent 31px, rgba(139,69,19,0.08) 31px, rgba(139,69,19,0.08) 32px)",
                      backgroundPositionY: "20px",
                    }}
                  />

                  <div
                    style={{
                      position: "absolute",
                      left: 50,
                      top: 0,
                      bottom: 0,
                      width: 1,
                      background: "rgba(139,26,26,0.3)",
                      boxShadow: "1px 0 0 rgba(139,26,26,0.1)",
                    }}
                  />

                  <AnimatePresence>
                    {isFocused && draft.length === 0 && (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 0.5, x: 0 }}
                        exit={{ opacity: 0 }}
                        style={{ position: "absolute", left: 24, top: 24, pointerEvents: "none" }}
                      >
                        <PenTool size={18} color="#c9a84c" />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <textarea
                    ref={textRef}
                    value={draft}
                    onChange={(e) => {
                      setDraft(e.target.value);
                      setHasSealed(false);
                    }}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder="begin writing..."
                    rows={18}
                    style={{
                      width: "100%",
                      resize: "none",
                      border: "none",
                      outline: "none",
                      background: "transparent",
                      color: "rgba(245,236,215,0.9)",
                      fontFamily: "'Crimson Text',serif",
                      fontSize: 18,
                      lineHeight: "32px",
                      padding: "20px 24px 20px 64px",
                      position: "relative",
                      zIndex: 2,
                    }}
                  />
                </div>
              </motion.div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: 14,
                  fontFamily: "'JetBrains Mono',monospace",
                  fontSize: 10,
                  letterSpacing: "0.15em",
                  color: "rgba(245,236,215,0.35)",
                }}
              >
                <span>
                  <FlipCounter value={wordCount} /> word{wordCount !== 1 ? "s" : ""}
                </span>
                {draft && !hasSealed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{ color: "rgba(201,168,76,0.45)" }}
                  >
                    ● unsaved
                  </motion.span>
                )}
              </div>
            </motion.div>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            style={{ display: "flex", flexDirection: "column", gap: 20 }}
          >
            <motion.div variants={fadeIn} style={calBg} className="p-5">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 12,
                }}
              >
                <button onClick={() => flipMonth("prev")} className="cal-nav">
                  <ChevronLeft size={14} />
                </button>
                <div style={{ textAlign: "center" }}>
                  <div
                    style={{
                      fontFamily: "'Cinzel',serif",
                      fontSize: 14,
                      color: "#f5ecd7",
                      letterSpacing: "0.1em",
                    }}
                  >
                    {MONTHS[viewMonth]}
                  </div>
                  <div
                    style={{
                      fontFamily: "'Crimson Text',serif",
                      fontStyle: "italic",
                      fontSize: 11,
                      color: "rgba(201,168,76,0.6)",
                    }}
                  >
                    {viewYear}
                  </div>
                </div>
                <button onClick={() => flipMonth("next")} className="cal-nav">
                  <ChevronRight size={14} />
                </button>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(7, 1fr)",
                  gap: 2,
                  marginBottom: 6,
                }}
              >
                {WEEKDAYS.map((d, i) => (
                  <div
                    key={i}
                    style={{
                      textAlign: "center",
                      fontFamily: "'Cinzel',serif",
                      fontSize: 9,
                      color: "rgba(201,168,76,0.5)",
                    }}
                  >
                    {d}
                  </div>
                ))}
              </div>

              <div style={{ position: "relative", minHeight: 180, overflow: "hidden" }}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${viewYear}-${viewMonth}`}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                    style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}
                  >
                    {grid.map((cell, i) => {
                      if (!cell.day || !cell.key)
                        return <div key={i} style={{ aspectRatio: "1" }} />;
                      const isSel = cell.key === selected;
                      const isToday = cell.key === fmtKey(today);
                      const hasEntry = (entries[cell.key]?.content?.trim().length ?? 0) > 0;
                      return (
                        <div key={i} style={{ position: "relative" }}>
                          <button
                            className="cal-day group"
                            onClick={() => setSelected(cell.key!)}
                            style={{
                              width: "100%",
                              aspectRatio: "1",
                              display: "grid",
                              placeItems: "center",
                              position: "relative",
                              borderRadius: 6,
                              border: isSel
                                ? "1px solid rgba(201,168,76,0.6)"
                                : isToday
                                  ? "1px solid rgba(201,168,76,0.2)"
                                  : "1px solid transparent",
                              background: isSel ? "rgba(201,168,76,0.15)" : "transparent",
                              color: isSel ? "#c9a84c" : "rgba(245,236,215,0.7)",
                              fontFamily: "'Crimson Text',serif",
                              fontSize: 13,
                              cursor: "pointer",
                              transition: "all 0.2s",
                              zIndex: 2,
                            }}
                          >
                            {isToday && !isSel && (
                              <div
                                className="today-pulse"
                                style={{
                                  position: "absolute",
                                  inset: 0,
                                  borderRadius: 6,
                                  border: "1px solid rgba(201,168,76,0.5)",
                                }}
                              />
                            )}
                            <span style={{ position: "relative", zIndex: 2 }}>{cell.day}</span>

                            {hasEntry && (
                              <div
                                style={{
                                  position: "absolute",
                                  bottom: 4,
                                  left: "50%",
                                  transform: "translateX(-50%)",
                                  width: 4,
                                  height: 4,
                                  borderRadius: "50%",
                                  background: "#8b1a1a",
                                  zIndex: 5,
                                }}
                              />
                            )}
                          </button>

                          {hasEntry && (
                            <div
                              className="cal-tooltip"
                              style={{
                                position: "absolute",
                                bottom: "100%",
                                left: "50%",
                                transform: "translate(-50%, -4px)",
                                width: 140,
                                padding: "8px 10px",
                                background: "rgba(20,12,6,0.95)",
                                border: "1px solid rgba(201,168,76,0.3)",
                                borderRadius: 6,
                                fontFamily: "'Crimson Text',serif",
                                fontSize: 12,
                                color: "#f5ecd7",
                                opacity: 0,
                                pointerEvents: "none",
                                transition: "all 0.2s",
                                zIndex: 50,
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
                              }}
                            >
                              {entries[cell.key!]?.content.substring(0, 30)}...
                              <div
                                style={{
                                  position: "absolute",
                                  bottom: -4,
                                  left: "50%",
                                  transform: "translateX(-50%) rotate(45deg)",
                                  width: 8,
                                  height: 8,
                                  background: "rgba(20,12,6,0.95)",
                                  borderRight: "1px solid rgba(201,168,76,0.3)",
                                  borderBottom: "1px solid rgba(201,168,76,0.3)",
                                }}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>

            <motion.div variants={fadeIn} style={{ ...grimBg, padding: 20 }}>
              <div
                style={{
                  fontFamily: "'Cinzel',serif",
                  fontSize: 10,
                  letterSpacing: "0.3em",
                  textTransform: "uppercase",
                  color: "rgba(201,168,76,0.6)",
                  marginBottom: 16,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Sparkles size={12} /> grimoire stats
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {streak > 0 ? <Flame size={16} color="#ff9040" /> : <UnlitCandleIcon />}
                    <div
                      style={{
                        fontFamily: "'Cinzel',serif",
                        fontSize: 28,
                        color: streak > 0 ? "#ff9040" : "rgba(245,236,215,0.3)",
                        textShadow: streak > 0 ? "0 0 16px rgba(255,144,64,0.4)" : "none",
                      }}
                    >
                      <FlipCounter value={streak} />
                    </div>
                  </div>
                  <div
                    style={{
                      fontFamily: "'JetBrains Mono',monospace",
                      fontSize: 8,
                      letterSpacing: "0.2em",
                      color: "rgba(245,236,215,0.4)",
                      textTransform: "uppercase",
                      marginTop: 4,
                    }}
                  >
                    day streak
                  </div>
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {totalEntries > 0 ? (
                      <PaperStackIcon count={totalEntries} />
                    ) : (
                      <UnlitCandleIcon />
                    )}
                    <div
                      style={{
                        fontFamily: "'Cinzel',serif",
                        fontSize: 28,
                        color: totalEntries > 0 ? "#f5ecd7" : "rgba(245,236,215,0.3)",
                      }}
                    >
                      <FlipCounter value={totalEntries} />
                    </div>
                  </div>
                  <div
                    style={{
                      fontFamily: "'JetBrains Mono',monospace",
                      fontSize: 8,
                      letterSpacing: "0.2em",
                      color: "rgba(245,236,215,0.4)",
                      textTransform: "uppercase",
                      marginTop: 4,
                    }}
                  >
                    pages inked
                  </div>
                </div>
              </div>

              <div
                style={{
                  height: 1,
                  background:
                    "linear-gradient(90deg, transparent, rgba(201,168,76,0.2), transparent)",
                  margin: "16px 0",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    left: "50%",
                    top: "50%",
                    transform: "translate(-50%, -50%) rotate(45deg)",
                    width: 6,
                    height: 6,
                    border: "1px solid rgba(201,168,76,0.4)",
                    background: "#1a0e06",
                  }}
                />
              </div>

              {streak > 0 && (
                <div style={{ display: "flex", gap: 2 }}>
                  {Array.from({ length: Math.min(streak, 14) }).map((_, i) => (
                    <motion.span
                      initial={{ scaleY: 0 }}
                      animate={{ scaleY: 1 }}
                      transition={{ delay: i * 0.05 }}
                      key={i}
                      style={{
                        flex: 1,
                        height: 4,
                        borderRadius: 2,
                        background: `rgba(255,144,64,${0.3 + (i / 14) * 0.7})`,
                        transformOrigin: "bottom",
                      }}
                    />
                  ))}
                </div>
              )}
            </motion.div>

            <motion.div variants={fadeIn} style={{ ...grimBg, padding: 20 }}>
              <div
                style={{
                  fontFamily: "'Cinzel',serif",
                  fontSize: 10,
                  letterSpacing: "0.3em",
                  textTransform: "uppercase",
                  color: "rgba(201,168,76,0.6)",
                  marginBottom: 16,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <DrawnBookIcon /> recent pages
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {Object.values(entries)
                  .filter((e) => e.content.trim().length > 0)
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .slice(0, 5)
                  .map((entry) => {
                    const d = new Date(entry.date + "T00:00:00");
                    const label = d
                      .toLocaleDateString(undefined, { month: "short", day: "numeric" })
                      .toUpperCase();
                    const preview = entry.content.slice(0, 45).trim();
                    return (
                      <motion.button
                        key={entry.date}
                        onClick={() => setSelected(entry.date)}
                        className="recent-card"
                        whileHover={{ y: -3 }}
                        style={{
                          display: "block",
                          width: "100%",
                          textAlign: "left",
                          padding: "12px 14px",
                          cursor: "pointer",
                          background:
                            selected === entry.date
                              ? "linear-gradient(145deg, rgba(201,168,76,0.1), rgba(201,168,76,0.02))"
                              : "rgba(15,8,4,0.6)",
                          border: "none",
                          borderLeft:
                            selected === entry.date ? "3px solid #c9a84c" : "3px solid transparent",
                          boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
                          clipPath:
                            "polygon(0 0, 100% 0, 100% calc(100% - 4px), 98% 100%, 96% calc(100% - 2px), 94% 100%, 92% calc(100% - 4px), 90% 100%, 88% calc(100% - 2px), 86% 100%, 84% calc(100% - 4px), 82% 100%, 80% calc(100% - 2px), 78% 100%, 76% calc(100% - 4px), 74% 100%, 72% calc(100% - 2px), 70% 100%, 68% calc(100% - 4px), 66% 100%, 64% calc(100% - 2px), 62% 100%, 60% calc(100% - 4px), 58% 100%, 56% calc(100% - 2px), 54% 100%, 52% calc(100% - 4px), 50% 100%, 48% calc(100% - 2px), 46% 100%, 44% calc(100% - 4px), 42% 100%, 40% calc(100% - 2px), 38% 100%, 36% calc(100% - 4px), 34% 100%, 32% calc(100% - 2px), 30% 100%, 28% calc(100% - 4px), 26% 100%, 24% calc(100% - 2px), 22% 100%, 20% calc(100% - 4px), 18% 100%, 16% calc(100% - 2px), 14% 100%, 12% calc(100% - 4px), 10% 100%, 8% calc(100% - 2px), 6% 100%, 4% calc(100% - 4px), 2% 100%, 0 calc(100% - 2px))",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <span
                            style={{
                              fontFamily: "'Cinzel',serif",
                              fontSize: 10,
                              letterSpacing: "0.1em",
                              color: selected === entry.date ? "#c9a84c" : "rgba(245,236,215,0.7)",
                            }}
                          >
                            {label}
                          </span>
                          <span style={{ fontSize: 14 }}>{entry.mood}</span>
                        </div>
                        <div
                          style={{
                            fontFamily: "'Crimson Text',serif",
                            fontSize: 13,
                            color: "rgba(245,236,215,0.5)",
                            fontStyle: "italic",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            marginTop: 4,
                          }}
                        >
                          {preview}
                          {preview.length >= 45 ? "…" : ""}
                        </div>
                      </motion.button>
                    );
                  })}
              </div>

              {totalEntries === 0 && (
                <div
                  style={{
                    padding: "30px 10px",
                    textAlign: "center",
                    fontFamily: "'Dancing Script',cursive",
                    fontSize: 18,
                    color: "rgba(245,236,215,0.3)",
                    fontStyle: "italic",
                  }}
                >
                  the first page awaits.
                </div>
              )}
            </motion.div>
          </motion.div>
        </div>
      </motion.main>

      <button
        onClick={() => setAmbientSound(!ambientSound)}
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          zIndex: 100,
          width: 40,
          height: 40,
          borderRadius: "50%",
          background: "rgba(20,12,6,0.6)",
          border: "1px solid rgba(201,168,76,0.2)",
          display: "grid",
          placeItems: "center",
          color: ambientSound ? "#c9a84c" : "rgba(245,236,215,0.4)",
          cursor: "pointer",
          backdropFilter: "blur(8px)",
          transition: "all 0.3s",
        }}
      >
        {ambientSound ? <Volume2 size={18} /> : <VolumeX size={18} />}
      </button>

      <style>{`
        .prompt-pulse { animation: pulseFade 4s ease-in-out infinite; }
        @keyframes pulseFade { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.8; } }
        
        .nav-tab:hover { color: #f5ecd7 !important; text-shadow: 0 0 8px #ffaa40; }

        .group:hover .cal-tooltip { opacity: 1; transform: translate(-50%, -12px); }

        .today-pulse { animation: todayPulse 3s ease-in-out infinite; }
        @keyframes todayPulse { 0%, 100% { opacity: 0.3; } 50% { opacity: 1; } }

        .seal-btn:hover { box-shadow: 0 4px 15px rgba(255,144,64,0.4), inset 0 2px 4px rgba(255,255,255,0.2) !important; }
        .cal-nav:hover { background: rgba(201,168,76,0.1) !important; }
        .recent-card:hover { box-shadow: 0 8px 20px rgba(0,0,0,0.4) !important; }

        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(201,168,76,0.2); border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(201,168,76,0.4); }

        @media (max-width: 768px) { main > div > div { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  );
}