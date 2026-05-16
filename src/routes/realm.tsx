import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronLeft,
  FolderPlus,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Trash2,
  X,
  BookOpen,
  GraduationCap,
  Archive,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { LibraryScene, type SceneSubject } from "@/components/library/LibraryScene";
import { SubjectWorkspace, type WorkspaceSubject } from "@/components/library/SubjectWorkspace";
import { useDBList, useDBValue } from "@/hooks/use-db";
import {
  playTimerChime,
  playSoftClick,
  playLibraryOpen,
  playPageTurn,
  playNotification,
  playHoot,
} from "@/lib/sounds";
import { motion, AnimatePresence } from "framer-motion";

export const Route = createFileRoute("/realm")({
  component: RealmPage,
  head: () => ({ meta: [{ title: "The Library · HIVE" }] }),
});

// ─── Types ────────────────────────────────────────────────────────────────────

type Subject = WorkspaceSubject & { groupId: string | null };

type Semester = { id: string; name: string; color: string; archived?: boolean };

// ─── Constants ────────────────────────────────────────────────────────────────

const SPINE_COLORS = [
  "#8B2500",
  "#C8860A",
  "#2D4A2D",
  "#3B2208",
  "#5C2A5C",
  "#1B4965",
  "#9C2542",
  "#6B4423",
  "#3F6B3F",
  "#7A3E2E",
  "#4a1a4a",
  "#1a2870",
];
const SEMESTER_COLORS = [
  "#c9a84c",
  "#9C2542",
  "#3F6B3F",
  "#1B4965",
  "#5C2A5C",
  "#C8860A",
  "#7A3E2E",
  "#2D4A2D",
];
const STUDY_PHRASES = [
  "stay with it.",
  "one page at a time.",
  "the work is the reward.",
  "deep work. deep roots.",
  "you're building something real.",
  "focus is a muscle.",
  "every minute compounds.",
];

type TimerMode = "study" | "break";
type TimerState = {
  mode: TimerMode;
  studyMin: number;
  breakMin: number;
  endsAt: number | null;
  remaining: number;
  running: boolean;
};
const DEFAULT_TIMER: TimerState = {
  mode: "study",
  studyMin: 25,
  breakMin: 5,
  endsAt: null,
  remaining: 25 * 60 * 1000,
  running: false,
};

function fmtMs(ms: number) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// ─── Nav ──────────────────────────────────────────────────────────────────────

import { RealmNav } from "@/components/RealmShell";

function HourglassIcon({ running }: { running: boolean }) {
  return (
    <svg viewBox="0 0 32 32" className={`h-7 w-7 ${running ? "animate-pulse" : ""}`}>
      <path
        d="M8 4 H24 L24 6 C24 11 18 13 18 16 C18 19 24 21 24 26 L24 28 H8 L8 26 C8 21 14 19 14 16 C14 13 8 11 8 6 Z"
        fill="none"
        stroke="#c9a84c"
        strokeWidth="1.4"
      />
    </svg>
  );
}

const DrawnBookIcon = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
    <path d="M8 7h6" />
    <path d="M8 11h8" />
  </svg>
);

// ─── Subject grid ─────────────────────────────────────────────────────────────

function SubjectGrid({
  subjects,
  onOpen,
  onDelete,
  emptyText = "no subjects yet.",
}: {
  subjects: Subject[];
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
  emptyText?: string;
}) {
  if (subjects.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-xl border-2 border-dashed border-[rgba(201,168,76,0.3)] bg-[rgba(201,168,76,0.02)] py-16 text-center" style={{ borderRadius: "20px 4px 20px 4px" }}>
        <DrawnBookIcon className="text-[#c9a84c]/40 w-12 h-12" />
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="font-hand text-xl italic text-[#f4e4c1]/60"
        >
          every great library began with one book
        </motion.div>
      </div>
    );
  }
  return (
    <div className="flex flex-wrap gap-5 pl-2 pb-4 pt-4">
      {subjects.map((s) => (
        <button
          key={s.id}
          onClick={() => onOpen(s.id)}
          className="group relative flex h-52 w-14 flex-col items-center rounded-sm border-t border-t-[#ffffff20] border-l border-r border-[#000] shadow-[10px_0_20px_rgba(0,0,0,0.6),inset_-2px_0_5px_rgba(0,0,0,0.5)] transition-all duration-300 hover:-translate-y-4 hover:shadow-[15px_15px_30px_rgba(0,0,0,0.8)]"
          style={{ background: `linear-gradient(90deg, ${s.color} 5%, #111 95%)` }}
        >
          {/* Top Ribs */}
          <div className="w-full h-[2px] border-b border-[#000] opacity-40 mt-3 bg-[rgba(255,255,255,0.1)]" />
          <div className="w-full h-[2px] border-b border-[#000] opacity-40 mt-1.5 bg-[rgba(255,255,255,0.1)]" />
          
          {/* Title */}
          <div className="mt-6 flex-1 text-[#f4e4c1] font-display text-[13px] tracking-[0.2em] uppercase truncate w-full px-1" style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}>
            {s.name}
          </div>
          
          {/* Bottom Badge / Hours */}
          <div className="mb-4 mt-2 font-mono text-[9px] text-[#c9a84c]/90 bg-[#000]/60 px-1 py-1 rounded shadow-[inset_0_1px_3px_rgba(0,0,0,1)] border border-[#222]">
            {s.hoursStudied.toFixed(1)}h
          </div>
          
          {/* Delete Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(s.id);
            }}
            className="absolute -top-3 -right-3 rounded-full bg-[#8b1c1c] w-6 h-6 flex items-center justify-center opacity-0 transition-all group-hover:opacity-100 hover:bg-[#a52020] border border-[#000] shadow-lg"
          >
            <Trash2 size={12} className="text-[#f4e4c1]" />
          </button>
        </button>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

function RealmPage() {
  const [subjects, setSubjects] = useDBList<Subject>("subjects", "hive.realm.v4");
  const [semesters, setSemesters] = useDBList<Semester>("semesters", "hive.realm.groups");

  const [fsOpen, setFsOpen] = useState(false);
  const [fsView, setFsView] = useState<{ kind: "root" } | { kind: "semester"; id: string }>({
    kind: "root",
  });
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [showAddSemester, setShowAddSemester] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(SPINE_COLORS[0]);
  const [newSemesterName, setNewSemesterName] = useState("");
  const [newSemesterColor, setNewSemesterColor] = useState(SEMESTER_COLORS[0]);

  const [openId, setOpenId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const [timer, setTimer] = useDBValue<TimerState>("hive.realm.timer", DEFAULT_TIMER);
  const [, setTick] = useState(0);
  const intervalRef = useRef<number | null>(null);
  const phraseRef = useRef(STUDY_PHRASES[0]);

  useEffect(() => {
    if (!timer.running) return;
    intervalRef.current = window.setInterval(() => setTick((n) => n + 1), 250);
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, [timer.running]);

  const remaining =
    timer.running && timer.endsAt ? Math.max(0, timer.endsAt - Date.now()) : timer.remaining;

  useEffect(() => {
    if (timer.running && remaining <= 0) {
      const nextMode: TimerMode = timer.mode === "study" ? "break" : "study";
      const nextMs = (nextMode === "study" ? timer.studyMin : timer.breakMin) * 60 * 1000;
      setTimer({ ...timer, mode: nextMode, running: false, endsAt: null, remaining: nextMs });
      playTimerChime(nextMode);
    }
  }, [remaining, timer, setTimer]);

  const open = subjects.find((s) => s.id === openId) ?? null;

  // ─── Mutations ───────────────────────────────────────────────────────────────

  const addSubject = () => {
    if (!newName.trim()) return;
    const groupId = fsView.kind === "semester" ? fsView.id : null;
    const s: Subject = {
      id: crypto.randomUUID(),
      name: newName.trim(),
      color: newColor,
      groupId,
      hoursStudied: 0,
      confidence: 0,
      notes: "",
      documents: [],
      chatHistory: [],
      flashcards: [],
      lastStudied: null,
    };
    setSubjects((arr) => [...arr, s]);
    setActiveId(s.id);
    setNewName("");
    setShowAddSubject(false);
    playSoftClick();
  };

  const addSemester = () => {
    if (!newSemesterName.trim()) return;
    const sem: Semester = {
      id: crypto.randomUUID(),
      name: newSemesterName.trim(),
      color: newSemesterColor,
    };
    setSemesters((arr) => [...arr, sem]);
    setNewSemesterName("");
    setShowAddSemester(false);
    playSoftClick();
  };

  const removeSubject = (id: string) => {
    setSubjects((arr) => arr.filter((s) => s.id !== id));
    if (openId === id) setOpenId(null);
    if (activeId === id) setActiveId(null);
  };

  const removeSemester = (id: string) => {
    setSubjects((arr) => arr.map((s) => (s.groupId === id ? { ...s, groupId: null } : s)));
    setSemesters((arr) => arr.filter((g) => g.id !== id));
    if (fsView.kind === "semester" && fsView.id === id) setFsView({ kind: "root" });
  };

  const archiveSemester = (id: string) => {
    setSemesters((arr) => arr.map((s) => (s.id === id ? { ...s, archived: !s.archived } : s)));
    playSoftClick();
  };

  const updateSubject = (id: string, patch: Partial<Subject>) =>
    setSubjects((arr) => arr.map((s) => (s.id === id ? { ...s, ...patch } : s)));

  const startTimer = () => {
    phraseRef.current = STUDY_PHRASES[Math.floor(Math.random() * STUDY_PHRASES.length)];
    setTimer({ ...timer, running: true, endsAt: Date.now() + timer.remaining });
    playHoot();
  };
  const pauseTimer = () => {
    setTimer({
      ...timer,
      running: false,
      remaining: timer.endsAt ? Math.max(0, timer.endsAt - Date.now()) : timer.remaining,
      endsAt: null,
    });
    playSoftClick();
  };
  const resetTimer = () => {
    const ms = (timer.mode === "study" ? timer.studyMin : timer.breakMin) * 60 * 1000;
    setTimer({ ...timer, running: false, endsAt: null, remaining: ms });
    playSoftClick();
  };
  const switchMode = (mode: TimerMode) => {
    const ms = (mode === "study" ? timer.studyMin : timer.breakMin) * 60 * 1000;
    setTimer({ ...timer, mode, running: false, endsAt: null, remaining: ms });
    playNotification();
  };

  const sceneSubjects: SceneSubject[] = subjects.map((s) => ({
    id: s.id,
    name: s.name,
    color: s.color,
    confidence: Math.max(1, Math.min(5, Math.round((s.confidence / 100) * 5))),
  }));

  const standaloneSubjects = useMemo(() => subjects.filter((s) => !s.groupId), [subjects]);
  const semesterSubjects = (sid: string) => subjects.filter((s) => s.groupId === sid);
  const activeSemesters = useMemo(() => semesters.filter((s) => !s.archived), [semesters]);
  const archivedSemesters = useMemo(() => semesters.filter((s) => s.archived), [semesters]);
  const currentSemester =
    fsView.kind === "semester" ? semesters.find((g) => g.id === fsView.id) : null;
  const currentSemesterSubjects = currentSemester ? semesterSubjects(currentSemester.id) : [];

  const openSubject = (id: string) => {
    setOpenId(id);
    setActiveId(id);
    setFsOpen(false);
    playPageTurn();
  };

  const handleOpenLibrary = () => {
    setFsOpen(true);
    playLibraryOpen();
  };

  return (
    <div className="relative h-screen w-full overflow-hidden bg-[#0a0604]">
      {/* 3D scene with camera push-forward transition */}
      <motion.div 
        className="absolute inset-0"
        animate={{ scale: fsOpen || open ? 1.05 : 1.0 }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
      >
        <LibraryScene
          subjects={sceneSubjects}
          activeId={activeId}
          onOpenPortal={handleOpenLibrary}
          onSelectSubject={(id) => openSubject(id)}
          timerRunning={timer.running}
        />
      </motion.div>

      {/* Page Load Fade-In */}
      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 0.8 }}
        onAnimationComplete={(def) => {
          // pointer-events-none is already handled by opacity 0 in CSS/Framer
        }}
        className="pointer-events-none fixed inset-0 z-50 bg-black"
        style={{ pointerEvents: "none" }}
      />

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,#000_115%)]" />
      <div className="pointer-events-auto relative z-[60]">
        <RealmNav />
      </div>

      {/* ── Open Library button — center of screen ── */}
      <AnimatePresence>
        {!fsOpen && !open && (
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.6, type: "spring", bounce: 0.4, delay: 0.8 }}
            className="pointer-events-auto fixed inset-0 z-20 flex items-center justify-center"
          >
            <motion.button
              onClick={handleOpenLibrary}
              whileHover={{ y: -6 }}
              style={{
                transform: "perspective(1000px) rotateX(3deg)",
                background: "linear-gradient(145deg, rgba(10,7,3,0.92), rgba(26,14,4,0.92))",
                border: "1px solid rgba(201,168,76,0.35)",
                backdropFilter: "blur(16px)",
                boxShadow:
                  "0 30px 60px rgba(0,0,0,0.8), 0 0 60px rgba(201,168,76,0.08), inset 0 1px 0 rgba(201,168,76,0.1)",
              }}
              className="group relative flex flex-col items-center gap-3 rounded-2xl px-10 py-6 transition-all duration-500"
            >
              {/* Faint candlelight flicker on the card */}
              <motion.div 
                className="absolute inset-0 rounded-2xl pointer-events-none"
                animate={{ opacity: [0.05, 0.2, 0.1, 0.25, 0.05] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                style={{
                  background: "radial-gradient(ellipse at 80% 20%, rgba(201,168,76,0.15), transparent 70%)"
                }}
              />
              
              <BookOpen
                size={28}
                className="text-[#c9a84c]/80 transition-all duration-500 group-hover:text-[#c9a84c] group-hover:rotate-[-6deg] group-hover:scale-110"
              />
              <span className="font-display text-sm uppercase tracking-[0.4em] text-[#c9a84c]/90 group-hover:text-[#c9a84c]">
                Open Library
              </span>
              <motion.span 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2, duration: 0.8 }}
                className="font-hand text-xs text-[#f4e4c1]/35 italic"
              >
                click the desk or here
              </motion.span>
              {/* Ambient glow hover */}
              <div
                className="absolute -inset-4 -z-10 rounded-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                style={{
                  background:
                    "radial-gradient(ellipse at 50% 50%, rgba(201,168,76,0.12), transparent 70%)",
                }}
              />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Timer widget — TOP RIGHT, larger ── */}
      <div className="pointer-events-auto fixed top-14 right-4 z-20">
        <div
          className={`rounded-xl px-6 py-5 shadow-2xl border border-[rgba(201,168,76,0.25)]`}
          style={{ background: "rgba(26,14,4,0.65)", backdropFilter: "blur(24px)", minWidth: 260, boxShadow: "0 20px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(201,168,76,0.15)" }}
        >
          <div className="flex items-center gap-5">
            <HourglassIcon running={timer.running} />
            <div
              className={`font-display text-5xl font-bold text-[#c9a84c] tabular-nums tracking-wider ${timer.running ? "" : ""}`}
              style={{
                textShadow: timer.running
                  ? "0 0 24px rgba(201,168,76,0.7), 0 0 40px rgba(201,168,76,0.3)"
                  : "0 0 12px rgba(201,168,76,0.3)",
              }}
            >
              {fmtMs(remaining)}
            </div>
          </div>
          {timer.running && (
            <div className="mt-2 font-hand text-sm text-[#f4e4c1]/60 italic">
              {phraseRef.current}
            </div>
          )}
          {/* Progress bar when running */}
          {timer.running && (
            <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-[rgba(201,168,76,0.1)]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#c9a84c] to-[#ffb347] transition-all duration-1000"
                style={{
                  width: `${Math.max(0, (1 - remaining / ((timer.mode === "study" ? timer.studyMin : timer.breakMin) * 60 * 1000)) * 100)}%`,
                }}
              />
            </div>
          )}
          <div className="mt-4 flex gap-1.5 rounded-lg border border-[#0d0804] bg-[#0d0804] p-1 shadow-[inset_0_2px_8px_rgba(0,0,0,0.8)]">
            {(["study", "break"] as const).map((m) => (
              <button
                key={m}
                suppressHydrationWarning
                onClick={() => switchMode(m)}
                className={`flex-1 rounded px-3 py-1.5 font-display text-[10px] font-bold uppercase tracking-[0.3em] transition-all duration-200 ${
                  timer.mode === m 
                    ? "bg-gradient-to-b from-[#2a1b10] to-[#1a1005] text-[#c9a84c] shadow-[0_2px_4px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.06)] border border-[#3a2515]" 
                    : "text-[#f4e4c1]/40 hover:text-[#f4e4c1] border border-transparent shadow-[inset_0_1px_3px_rgba(0,0,0,0.3)]"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between gap-3">
            <div className="flex gap-1.5">
              {timer.running ? (
                <button
                  suppressHydrationWarning
                  onClick={pauseTimer}
                  className="rounded-lg border border-[rgba(201,168,76,0.6)] bg-[rgba(201,168,76,0.15)] px-3 py-1.5 text-[#c9a84c] transition-all hover:bg-[#c9a84c] hover:text-black hover:shadow-[0_0_12px_rgba(201,168,76,0.3)]"
                >
                  <Pause size={14} />
                </button>
              ) : (
                <button
                  suppressHydrationWarning
                  onClick={startTimer}
                  className="rounded-lg border border-[rgba(201,168,76,0.6)] bg-[rgba(201,168,76,0.15)] px-3 py-1.5 text-[#c9a84c] transition-all hover:bg-[#c9a84c] hover:text-black hover:shadow-[0_0_12px_rgba(201,168,76,0.3)]"
                >
                  <Play size={14} />
                </button>
              )}
              <button
                suppressHydrationWarning
                onClick={resetTimer}
                className="rounded-lg border border-[rgba(201,168,76,0.3)] px-3 py-1.5 text-[#f4e4c1]/70 transition-all hover:bg-[rgba(201,168,76,0.1)] hover:text-[#c9a84c]"
              >
                <RotateCcw size={14} />
              </button>
            </div>
            <div className="flex items-center gap-1.5 font-display text-[12px] font-bold text-[#c9a84c]">
              <input
                suppressHydrationWarning
                type="number"
                min={1}
                value={timer.studyMin}
                onChange={(e) => {
                  const v = Math.max(1, Number(e.target.value) || 1);
                  setTimer({
                    ...timer,
                    studyMin: v,
                    ...(timer.mode === "study" && !timer.running
                      ? { remaining: v * 60 * 1000 }
                      : {}),
                  });
                }}
                className="w-12 rounded-sm border-t border-l border-[#000] border-b border-r border-[rgba(201,168,76,0.15)] bg-[#1a1005] px-1 py-1 text-center text-[#c9a84c] shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)] outline-none focus:border-[rgba(201,168,76,0.4)] transition-all"
              />
              <span className="text-[#c9a84c]/40">/</span>
              <input
                suppressHydrationWarning
                type="number"
                min={1}
                value={timer.breakMin}
                onChange={(e) => {
                  const v = Math.max(1, Number(e.target.value) || 1);
                  setTimer({
                    ...timer,
                    breakMin: v,
                    ...(timer.mode === "break" && !timer.running
                      ? { remaining: v * 60 * 1000 }
                      : {}),
                  });
                }}
                className="w-12 rounded-sm border-t border-l border-[#000] border-b border-r border-[rgba(201,168,76,0.15)] bg-[#1a1005] px-1 py-1 text-center text-[#c9a84c] shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)] outline-none focus:border-[rgba(201,168,76,0.4)] transition-all"
              />
            </div>
          </div>
          {activeId && subjects.find((s) => s.id === activeId) && (
            <button
              suppressHydrationWarning
              onClick={() => {
                const s = subjects.find((x) => x.id === activeId)!;
                updateSubject(s.id, {
                  hoursStudied: Math.round((s.hoursStudied + timer.studyMin / 60) * 10) / 10,
                });
                playSoftClick();
              }}
              className="mt-3 w-full rounded-lg border border-[rgba(201,168,76,0.2)] px-3 py-1.5 font-display text-[10px] uppercase tracking-[0.3em] text-[#c9a84c]/80 transition-all hover:bg-[rgba(201,168,76,0.1)] hover:text-[#c9a84c]"
            >
              + log to {subjects.find((s) => s.id === activeId)?.name}
            </button>
          )}
        </div>
      </div>

      {/* ── File System Overlay ── */}
      <AnimatePresence>
      {fsOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-30 bg-black/80 backdrop-blur-md"
            onClick={() => setFsOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, x: 100, rotateY: -15, transformPerspective: 1200 }}
            animate={{ opacity: 1, x: 0, rotateY: 0 }}
            exit={{ opacity: 0, x: 100, rotateY: 15 }}
            transition={{ duration: 0.5, type: "spring", bounce: 0.3 }}
            className="fixed inset-x-4 bottom-4 top-16 z-40 mx-auto max-w-5xl overflow-hidden rounded-2xl flex flex-col"
            style={{
              background: "linear-gradient(170deg, rgba(20,12,6,0.98), rgba(12,8,4,0.98))",
              border: "1px solid rgba(201,168,76,0.25)",
              boxShadow:
                "0 0 80px rgba(0,0,0,0.8), 0 0 40px rgba(201,168,76,0.08), inset 0 1px 0 rgba(201,168,76,0.1)",
            }}
          >
            {/* Paper Texture Overlay */}
            <div
              className="pointer-events-none absolute inset-0 z-0 opacity-[0.06]"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
              }}
            />
            
            {/* Header */}
            <div
              className="relative z-10 flex items-center justify-between px-8 py-5"
              style={{
                borderBottom: "1px solid rgba(201,168,76,0.15)",
                background: "rgba(201,168,76,0.03)",
              }}
            >
              <div className="flex items-center gap-4">
                {fsView.kind === "semester" && (
                  <button
                    onClick={() => setFsView({ kind: "root" })}
                    className="flex items-center gap-1 rounded-lg px-2 py-1 text-[#c9a84c] transition-all hover:bg-[rgba(201,168,76,0.1)]"
                  >
                    <ChevronLeft size={16} />
                  </button>
                )}
                <DrawnBookIcon className="text-[#c9a84c]/80 w-6 h-6" />
                <h2 className="font-display text-lg uppercase tracking-[0.3em] text-[#c9a84c]">
                  {fsView.kind === "root" ? "My Library" : (currentSemester?.name ?? "Folder")}
                </h2>
                {fsView.kind === "semester" && currentSemester && (
                  <span className="rounded-full bg-[rgba(201,168,76,0.1)] px-3 py-0.5 font-mono text-[10px] text-[#c9a84c]/80 border border-[#c9a84c]/20">
                    {currentSemesterSubjects.length} subject
                    {currentSemesterSubjects.length === 1 ? "" : "s"}
                  </span>
                )}
              </div>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setFsOpen(false)}
                className="rounded-full w-8 h-8 flex items-center justify-center bg-[#8b1c1c] text-[#f4e4c1]/90 shadow-[inset_0_2px_4px_rgba(0,0,0,0.5),0_2px_4px_rgba(0,0,0,0.4)] border border-[#5a0c0c] transition-all hover:bg-[#a52020]"
              >
                <X size={14} strokeWidth={3} />
              </motion.button>
            </div>

            {/* Actions bar */}
            <div
              className="relative z-10 flex flex-wrap gap-3 px-8 py-4"
              style={{ borderBottom: "1px solid rgba(201,168,76,0.1)" }}
            >
              {fsView.kind === "root" && (
                <button
                  onClick={() => setShowAddSemester(true)}
                  className="group flex items-center gap-2 rounded-md border border-[rgba(201,168,76,0.4)] bg-[rgba(201,168,76,0.05)] px-4 py-2 font-display text-[11px] uppercase tracking-[0.2em] text-[#c9a84c] transition-all hover:bg-[linear-gradient(90deg,rgba(201,168,76,0.15),transparent)] hover:border-[#c9a84c] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                >
                  <FolderPlus size={16} className="transition-transform group-hover:scale-110" /> New Folder
                </button>
              )}
              <button
                onClick={() => {
                  setNewColor(SPINE_COLORS[subjects.length % SPINE_COLORS.length]);
                  setShowAddSubject(true);
                }}
                className="group flex items-center gap-2 rounded-md border border-[rgba(201,168,76,0.4)] bg-[rgba(201,168,76,0.05)] px-4 py-2 font-display text-[11px] uppercase tracking-[0.2em] text-[#c9a84c] transition-all hover:bg-[linear-gradient(90deg,rgba(201,168,76,0.15),transparent)] hover:border-[#c9a84c] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
              >
                <Plus size={16} className="transition-transform group-hover:scale-110" /> New Subject
              </button>
            </div>

            {/* Content */}
            <div className="relative z-10 overflow-y-auto p-8 flex-1" style={{ maxHeight: "calc(100% - 130px)" }}>
              {fsView.kind === "root" ? (
                <>
                  {/* Active semesters */}
                  {activeSemesters.length > 0 && (
                    <div className="mb-10">
                      <div className="mb-4 flex items-center gap-2">
                        <span className="font-display text-[12px] uppercase tracking-[0.3em] text-[#c9a84c]/80">
                          Folders
                        </span>
                        <div className="h-[1px] flex-1 bg-gradient-to-r from-[#c9a84c]/30 to-transparent" />
                      </div>
                      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                        {activeSemesters.map((sem) => {
                          const count = semesterSubjects(sem.id).length;
                          const totalHours = semesterSubjects(sem.id).reduce(
                            (sum, s) => sum + s.hoursStudied,
                            0,
                          );
                          return (
                            <button
                              key={sem.id}
                              onClick={() => setFsView({ kind: "semester", id: sem.id })}
                              className="group relative flex flex-col rounded-xl border border-[rgba(201,168,76,0.2)] bg-[rgba(201,168,76,0.03)] p-5 text-left transition-all duration-300 hover:bg-[rgba(201,168,76,0.07)] hover:border-[rgba(201,168,76,0.4)] hover:shadow-[0_0_20px_rgba(201,168,76,0.06)]"
                              style={{ borderLeftWidth: 6, borderLeftColor: sem.color }}
                            >
                              <div className="font-display text-[15px] tracking-wide text-[#f4e4c1]">{sem.name}</div>
                              <div className="mt-2 flex items-center gap-3">
                                <span className="font-mono text-[10px] text-[#f4e4c1]/50">
                                  {count} subject{count === 1 ? "" : "s"}
                                </span>
                                {totalHours > 0 && (
                                  <span className="font-mono text-[10px] text-[#c9a84c]/60 bg-[#c9a84c]/10 px-1.5 py-0.5 rounded">
                                    {totalHours.toFixed(1)}h
                                  </span>
                                )}
                              </div>
                              <div className="absolute right-3 top-3 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    archiveSemester(sem.id);
                                  }}
                                  className="rounded p-1.5 text-[#f4e4c1]/40 hover:bg-[rgba(201,168,76,0.1)] hover:text-[#c9a84c]"
                                  title="Archive"
                                >
                                  <Archive size={14} />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeSemester(sem.id);
                                  }}
                                  className="rounded p-1.5 text-[#f4e4c1]/40 hover:text-red-400"
                                  title="Delete"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Standalone subjects */}
                  <div className="mb-4 flex items-center gap-2">
                    <span className="font-display text-[12px] uppercase tracking-[0.3em] text-[#c9a84c]/80">
                      {activeSemesters.length > 0 ? "Standalone Subjects" : "Subjects"}
                    </span>
                    <div className="h-[1px] flex-1 bg-gradient-to-r from-[#c9a84c]/30 to-transparent" />
                  </div>
                  {standaloneSubjects.length === 0 && activeSemesters.length === 0 ? (
                    <div className="flex flex-col items-center gap-4 rounded-xl border-2 border-dashed border-[rgba(201,168,76,0.3)] bg-[rgba(201,168,76,0.02)] py-16 text-center" style={{ borderRadius: "20px 4px 20px 4px" }}>
                      <DrawnBookIcon className="text-[#c9a84c]/40 w-12 h-12" />
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3, duration: 0.6 }}
                        className="font-hand text-xl italic text-[#f4e4c1]/60"
                      >
                        every great library began with one book
                      </motion.div>
                    </div>
                  ) : (
                    <SubjectGrid
                      subjects={standaloneSubjects}
                      onOpen={openSubject}
                      onDelete={removeSubject}
                    />
                  )}

                  {/* Archived semesters */}
                  {archivedSemesters.length > 0 && (
                    <div className="mt-8">
                      <div className="mb-3 flex items-center gap-2">
                        <Archive size={12} className="text-[#f4e4c1]/30" />
                        <span className="font-display text-[10px] uppercase tracking-[0.3em] text-[#f4e4c1]/30">
                          Archived
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 opacity-50">
                        {archivedSemesters.map((sem) => (
                          <button
                            key={sem.id}
                            onClick={() => archiveSemester(sem.id)}
                            className="flex items-center gap-2 rounded-lg border border-[rgba(201,168,76,0.1)] bg-black/20 p-3 text-left transition-all hover:opacity-100"
                          >
                            <div
                              className="h-2 w-2 rounded-full"
                              style={{ background: sem.color }}
                            />
                            <span className="font-display text-xs text-[#f4e4c1]/50">
                              {sem.name}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <SubjectGrid
                  subjects={currentSemesterSubjects}
                  onOpen={openSubject}
                  onDelete={removeSubject}
                  emptyText="no subjects in this folder yet."
                />
              )}
            </div>
          </motion.div>

          {/* Add subject modal */}
          {showAddSubject && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
              onClick={() => setShowAddSubject(false)}
            >
              <div
                className="w-full max-w-sm rounded-xl p-6"
                style={{
                  background: "linear-gradient(170deg, rgba(14,9,4,0.98), rgba(22,14,6,0.98))",
                  border: "1px solid rgba(201,168,76,0.3)",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="mb-4 font-display text-xs uppercase tracking-[0.3em] text-[#c9a84c]">
                  shelve a new subject
                </div>
                <input
                  suppressHydrationWarning
                  autoFocus
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addSubject()}
                  placeholder="subject name"
                  className="w-full rounded-lg border border-[rgba(201,168,76,0.25)] bg-black/40 px-4 py-2.5 text-[#f4e4c1] outline-none transition-all focus:border-[#c9a84c] focus:shadow-[0_0_12px_rgba(201,168,76,0.1)]"
                />
                <div className="mt-4 font-display text-[9px] uppercase tracking-[0.3em] text-[#c9a84c]/60">
                  spine color
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {SPINE_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setNewColor(c)}
                      className={`h-7 w-7 rounded-full border-2 transition-all ${newColor === c ? "scale-110 border-[#c9a84c] shadow-[0_0_8px_rgba(201,168,76,0.3)]" : "border-transparent hover:scale-105"}`}
                      style={{ background: c }}
                    />
                  ))}
                </div>
                {fsView.kind === "semester" && currentSemester && (
                  <div className="mt-3 rounded-lg bg-[rgba(201,168,76,0.05)] px-3 py-1.5 font-hand text-xs italic text-[#f4e4c1]/50">
                    will be placed in <span className="text-[#c9a84c]">{currentSemester.name}</span>
                  </div>
                )}
                <div className="mt-5 flex justify-end gap-2">
                  <button
                    onClick={() => setShowAddSubject(false)}
                    className="rounded-lg border border-[rgba(201,168,76,0.15)] px-4 py-2 text-xs text-[#f4e4c1]/50 transition-all hover:text-[#f4e4c1]"
                  >
                    cancel
                  </button>
                  <button
                    onClick={addSubject}
                    className="rounded-lg border border-[rgba(201,168,76,0.5)] bg-[rgba(201,168,76,0.12)] px-4 py-2 text-xs text-[#c9a84c] transition-all hover:bg-[#c9a84c] hover:text-black"
                  >
                    shelve
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Add semester modal */}
          {showAddSemester && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
              onClick={() => setShowAddSemester(false)}
            >
              <div
                className="w-full max-w-sm rounded-xl p-6"
                style={{
                  background: "linear-gradient(170deg, rgba(14,9,4,0.98), rgba(22,14,6,0.98))",
                  border: "1px solid rgba(201,168,76,0.3)",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="mb-4 font-display text-xs uppercase tracking-[0.3em] text-[#c9a84c]">
                  new folder
                </div>
                <input
                  suppressHydrationWarning
                  autoFocus
                  value={newSemesterName}
                  onChange={(e) => setNewSemesterName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addSemester()}
                  placeholder="e.g. Semester 5"
                  className="w-full rounded-lg border border-[rgba(201,168,76,0.25)] bg-black/40 px-4 py-2.5 text-[#f4e4c1] outline-none transition-all focus:border-[#c9a84c] focus:shadow-[0_0_12px_rgba(201,168,76,0.1)]"
                />
                <div className="mt-4 font-display text-[9px] uppercase tracking-[0.3em] text-[#c9a84c]/60">
                  folder color
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {SEMESTER_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setNewSemesterColor(c)}
                      className={`h-7 w-7 rounded-full border-2 transition-all ${newSemesterColor === c ? "scale-110 border-[#c9a84c] shadow-[0_0_8px_rgba(201,168,76,0.3)]" : "border-transparent hover:scale-105"}`}
                      style={{ background: c }}
                    />
                  ))}
                </div>
                <div className="mt-5 flex justify-end gap-2">
                  <button
                    onClick={() => setShowAddSemester(false)}
                    className="rounded-lg border border-[rgba(201,168,76,0.15)] px-4 py-2 text-xs text-[#f4e4c1]/50 transition-all hover:text-[#f4e4c1]"
                  >
                    cancel
                  </button>
                  <button
                    onClick={addSemester}
                    className="rounded-lg border border-[rgba(201,168,76,0.5)] bg-[rgba(201,168,76,0.12)] px-4 py-2 text-xs text-[#c9a84c] transition-all hover:bg-[#c9a84c] hover:text-black"
                  >
                    create
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
      </AnimatePresence>

      {/* ── Subject Workspace — centered modal ── */}
      <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md"
          onClick={() => setOpenId(null)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
            className="relative flex flex-col rounded-xl overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(201,168,76,0.1)]"
            style={{
              width: "min(95vw, 1100px)",
              height: "min(90vh, 800px)",
              background: "linear-gradient(170deg, rgba(14,9,4,0.98), rgba(22,14,6,0.98))",
              border: "1px solid rgba(201,168,76,0.3)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <SubjectWorkspace
              subject={open}
              onUpdate={(patch) => updateSubject(open.id, patch as Partial<Subject>)}
              onClose={() => setOpenId(null)}
            />
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
}
