import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { RealmShell, Panel } from "@/components/RealmShell";
import { PlannerScene } from "@/components/realm-scenes";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { motion, AnimatePresence } from "framer-motion";

export const Route = createFileRoute("/planner")({
  component: PlannerPage,
});

interface Task {
  id: string;
  text: string;
  done: boolean;
}

type DayMap = Record<string, Task[]>; // key: YYYY-MM-DD

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

function QuillStrikethrough() {
  return (
    <svg className="absolute inset-0 h-full w-full pointer-events-none" preserveAspectRatio="none">
      <motion.path
        d="M 0,10 Q 50,15 100,8 T 200,12"
        vectorEffect="non-scaling-stroke"
        stroke="rgba(201,168,76,0.6)"
        strokeWidth="1.5"
        fill="transparent"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      />
    </svg>
  );
}

function Firefly() {
  return (
    <motion.div
      className="fixed z-[100] w-1.5 h-1.5 rounded-full bg-amber shadow-[0_0_8px_rgba(201,168,76,0.8)] pointer-events-none"
      initial={{ opacity: 0, x: "-10vw", y: "50vh" }}
      animate={{
        opacity: [0, 1, 1, 0],
        x: ["-10vw", "40vw", "70vw", "110vw"],
        y: ["50vh", "30vh", "60vh", "40vh"],
      }}
      transition={{ duration: 15, ease: "linear" }}
    />
  );
}

function PlannerPage() {
  const today = new Date();
  const [tasksByDay, setTasksByDay] = useLocalStorage<DayMap>("hive.planner.v2", {});
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selected, setSelected] = useState<string>(fmtKey(today));
  const [draft, setDraft] = useState("");
  const [flipDir, setFlipDir] = useState<"next" | "prev" | "none">("none");
  const [pulse, setPulse] = useState(0);
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [hoveredCol, setHoveredCol] = useState<number | null>(null);

  // Idle firefly logic
  const [idleTime, setIdleTime] = useState(0);
  const [showFirefly, setShowFirefly] = useState(false);

  useEffect(() => {
    const handleActivity = () => setIdleTime(0);
    window.addEventListener("mousemove", handleActivity);
    window.addEventListener("keydown", handleActivity);
    const interval = setInterval(() => {
      setIdleTime((prev) => {
        if (prev >= 60 && !showFirefly) {
          setShowFirefly(true);
          setTimeout(() => setShowFirefly(false), 15000);
          return 0;
        }
        return prev + 1;
      });
    }, 1000);
    return () => {
      window.removeEventListener("mousemove", handleActivity);
      window.removeEventListener("keydown", handleActivity);
      clearInterval(interval);
    };
  }, [showFirefly]);

  const dayTasks = tasksByDay[selected] ?? [];
  const progress = dayTasks.length ? dayTasks.filter((t) => t.done).length / dayTasks.length : 0;

  // Calculate lanterns lit this month
  const lanternsLitThisMonth = useMemo(() => {
    let count = 0;
    for (const [key, tasks] of Object.entries(tasksByDay)) {
      if (key.startsWith(`${viewYear}-${String(viewMonth + 1).padStart(2, "0")}`)) {
        if (tasks.length > 0 && tasks.every((t) => t.done)) count++;
      }
    }
    return count;
  }, [tasksByDay, viewMonth, viewYear]);

  const grid = useMemo(() => {
    const first = new Date(viewYear, viewMonth, 1);
    const startDay = first.getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const cells: Array<{ day: number | null; key: string | null; row: number; col: number }> = [];

    let currentRow = 0;
    for (let i = 0; i < startDay; i++) {
      cells.push({ day: null, key: null, row: currentRow, col: i });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const col = cells.length % 7;
      if (col === 0 && cells.length > 0) currentRow++;
      const key = fmtKey(new Date(viewYear, viewMonth, d));
      cells.push({ day: d, key, row: currentRow, col });
    }

    while (cells.length % 7 !== 0) {
      const col = cells.length % 7;
      cells.push({ day: null, key: null, row: currentRow, col });
    }
    return cells;
  }, [viewYear, viewMonth]);

  const flip = (dir: "next" | "prev") => {
    setFlipDir(dir);
    setViewMonth((m) => {
      let nm = dir === "next" ? m + 1 : m - 1;
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
      return nm;
    });
  };

  const addTask = () => {
    const text = draft.trim();
    if (!text) return;
    setTasksByDay((prev) => ({
      ...prev,
      [selected]: [
        ...(prev[selected] ?? []),
      ],
    }));
    setDraft("");
    setPulse((p) => p + 1);
  };

  const toggle = (id: string) => {
    setTasksByDay((prev) => {
      const newTasks = (prev[selected] ?? []).map((t) =>
        t.id === id ? { ...t, done: !t.done } : t,
      );
      return { ...prev, [selected]: newTasks };
    });
    setPulse((p) => p + 1);
  };

  const remove = (id: string) => {
    setTasksByDay((prev) => ({
      ...prev,
      [selected]: (prev[selected] ?? []).filter((t) => t.id !== id),
    }));
  };

  const selectedDate = new Date(selected + "T00:00:00");
  const prettyDay = selectedDate.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <RealmShell
      scene={
        <PlannerScene progress={progress} count={Math.max(4, dayTasks.length)} pulse={pulse} />
      }
      title="The LANTERN PATH"
      subtitle="today, walked deliberately."
    >
      {showFirefly && <Firefly />}

      <div className="grid gap-6 md:grid-cols-[3fr_1fr] relative">
        {/* Faint mist layer at bottom of panels */}
        <div className="pointer-events-none absolute -bottom-10 left-0 right-0 h-32 bg-gradient-to-t from-parchment/5 to-transparent z-[5]" />

        {/* ─── CALENDAR PANEL (Rises from below) ─── */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8, ease: "easeOut" }}
          className="h-full"
        >
          <Panel className="relative overflow-hidden !bg-[#0d0906]/80 !border-amber/10 p-5 h-full">
            {/* Faint Linen Texture Overlay */}
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.04]"
              style={{
                backgroundImage:
                  "url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjZmZmIiAvPgo8cGF0aCBkPSJNMCAwTDggOFpNOCAwTDAgOFoiIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLXdpZHRoPSIxIiBvcGFjaXR5PSIwLjEiLz4KPC9zdmc+')",
              }}
            />

            <div className="mb-6 flex items-center justify-between border-b border-amber/20 pb-3">
              <button
                onClick={() => flip("prev")}
                className="group rounded-md p-2 text-amber/70 transition-colors hover:text-amber"
                aria-label="previous month"
              >
                <ChevronLeft
                  size={18}
                  className="transition-transform group-hover:-rotate-12 group-hover:scale-110"
                />
              </button>
              <div className="text-center group cursor-pointer">
                <div className="font-serif text-2xl tracking-wide text-parchment/90 transition-colors group-hover:text-amber">
                  {MONTHS[viewMonth]} <span className="text-amber/60">{viewYear}</span>
                </div>
              </div>
              <button
                onClick={() => flip("next")}
                className="group rounded-md p-2 text-amber/70 transition-colors hover:text-amber"
                aria-label="next month"
              >
                <ChevronRight
                  size={18}
                  className="transition-transform group-hover:rotate-12 group-hover:scale-110"
                />
              </button>
            </div>

            <div className="px-3 pb-3">
              <div className="mb-2 grid grid-cols-7 gap-px">
                {WEEKDAYS.map((d, i) => (
                  <div
                    key={i}
                    className="pb-2 text-center font-serif text-[11px] font-bold uppercase tracking-[0.2em] text-amber/50"
                  >
                    {d}
                  </div>
                ))}
              </div>

              <AnimatePresence mode="wait" custom={flipDir}>
                <motion.div
                  key={`${viewYear}-${viewMonth}`}
                  custom={flipDir}
                  initial={{
                    x: flipDir === "next" ? 40 : flipDir === "prev" ? -40 : 0,
                    opacity: 0,
                  }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: flipDir === "next" ? -40 : flipDir === "prev" ? 40 : 0, opacity: 0 }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                  className="grid grid-cols-7 gap-px bg-amber/15 border border-amber/15 rounded-sm overflow-hidden"
                >
                  {grid.map((cell, i) => {
                    if (!cell.day || !cell.key) {
                      return (
                        <div
                          key={i}
                          className="aspect-square bg-[#0d0906] flex items-center justify-center opacity-40"
                        >
                          {/* Faint watermark for empty top row */}
                          {i < 7 && (
                            <span className="font-display text-4xl text-amber/5 select-none">
                              ✧
                            </span>
                          )}
                        </div>
                      );
                    }

                    const isSelected = cell.key === selected;
                    const isToday = cell.key === fmtKey(today);
                    const cellDate = new Date(cell.key + "T00:00:00");
                    const isPast =
                      cellDate < new Date(today.getFullYear(), today.getMonth(), today.getDate());

                    const dayItems = tasksByDay[cell.key] ?? [];
                    const hasTasks = dayItems.length > 0;
                    const allDone = hasTasks && dayItems.every((t) => t.done);

                    // Lantern Path Hover Logic
                    const isHoveredPath = hoveredRow === cell.row && cell.col <= (hoveredCol ?? -1);

                    return (
                      <div
                        key={i}
                        onClick={() => setSelected(cell.key!)}
                        onMouseEnter={() => {
                          setHoveredRow(cell.row);
                          setHoveredCol(cell.col);
                        }}
                        onMouseLeave={() => {
                          setHoveredRow(null);
                          setHoveredCol(null);
                        }}
                        className={`group relative aspect-square bg-[#0d0906] cursor-pointer overflow-hidden transition-all duration-500
                          ${isPast ? "opacity-70 saturate-50" : ""}
                          ${isHoveredPath && !isSelected ? "bg-[#16100a]" : ""}
                        `}
                      >
                        {/* Inner Shadow for recessed look */}
                        <div className="absolute inset-0 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] pointer-events-none" />

                        {/* Ripple on click / selection */}
                        {isSelected && (
                          <motion.div
                            layoutId="selected-day-ripple"
                            className="absolute inset-0 border border-amber bg-amber/10 shadow-[0_0_15px_rgba(201,168,76,0.3)]"
                            initial={false}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                          />
                        )}

                        {/* Today Gold Pulse */}
                        {isToday && !isSelected && (
                          <div className="absolute inset-0 border border-amber/40 animate-pulse-slow" />
                        )}

                        {/* Hover Radial Light */}
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(201,168,76,0.25)_0%,transparent_80%)] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                        {/* Date Number */}
                        <span
                          className={`absolute bottom-2 left-2 font-serif text-sm transition-colors ${
                            isSelected
                              ? "text-amber"
                              : isToday
                                ? "text-amber/80 font-bold"
                                : "text-parchment/60 group-hover:text-parchment"
                          }`}
                        >
                          {cell.day}
                        </span>

                        {/* Tiny Lantern Icon for Tasks */}
                        {hasTasks && (
                          <span
                            className={`absolute top-2 right-2 text-[10px] ${allDone ? "text-amber drop-shadow-[0_0_4px_rgba(201,168,76,0.8)]" : "text-parchment/30"}`}
                          >
                            ◷
                          </span>
                        )}

                        {/* Empty State 'No Tasks' Microtext for Today */}
                        {isToday && !hasTasks && (
                          <span className="absolute bottom-2 right-2 text-[8px] font-mono uppercase tracking-widest text-parchment/20">
                            rest
                          </span>
                        )}

                        {/* Celebratory pulse when all done */}
                        {allDone && (
                          <div className="absolute inset-0 bg-amber/20 opacity-0 animate-celebration-pulse pointer-events-none" />
                        )}
                      </div>
                    );
                  })}
                </motion.div>
              </AnimatePresence>

              {/* Week at a glance / Stats */}
              <div className="mt-4 flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-amber/40">
                <div className="flex gap-1">
                  {WEEKDAYS.map((_, i) => (
                    <div
                      key={i}
                      className={`h-1 w-4 rounded-full ${i < new Date().getDay() ? "bg-amber/40" : i === new Date().getDay() ? "bg-amber shadow-[0_0_4px_rgba(201,168,76,0.8)]" : "bg-parchment/10"}`}
                    />
                  ))}
                </div>
                <div>{lanternsLitThisMonth} Lanterns Lit This Month</div>
              </div>
            </div>
          </Panel>
        </motion.div>

        {/* ─── TO-DO SIDEBAR (Slides in from right) ─── */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 1.1, ease: "easeOut" }}
          className="h-full"
        >
          <Panel className="relative overflow-hidden !bg-[#16100a] !border-amber/20 flex flex-col h-full shadow-2xl">
            <div className="mb-3 flex items-center gap-2 border-b border-amber/10 pb-2">
              <span className="text-amber/60 text-sm">◷</span>
              <div className="font-serif text-[11px] font-bold uppercase tracking-[0.3em] text-amber/80">
                To-Do
              </div>
            </div>

            <div className="mb-6 font-hand text-xl text-parchment/90">{prettyDay}</div>

            <div className="mb-4 flex gap-3 items-end">
              <input
                placeholder="add a task..."
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addTask()}
                className="flex-1 bg-transparent border-0 border-b border-amber/20 px-1 py-1.5 text-sm text-parchment outline-none placeholder:text-parchment/30 focus:border-amber focus:ring-0 transition-colors"
              />
              <button
                onClick={addTask}
                className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber/10 border border-amber/40 text-amber transition-all hover:bg-amber hover:text-[#0d0906] hover:shadow-[0_0_10px_rgba(201,168,76,0.5)] active:scale-90"
                aria-label="add task"
              >
                <X size={14} className="rotate-45" />
              </button>
            </div>

            <div className="flex-1 relative min-h-[200px]">
              <AnimatePresence mode="popLayout">
                {dayTasks.length === 0 ? (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex flex-col items-center justify-center text-center"
                  >
                    <div className="text-9xl text-amber/5 select-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                      ◷
                    </div>
                    <div className="font-hand text-lg text-parchment/40 relative z-10">
                      a fresh day.
                      <br />
                      light the first lantern.
                    </div>
                  </motion.div>
                ) : (
                  <ul className="space-y-3 relative z-10">
                    <AnimatePresence initial={false}>
                      {dayTasks.map((t) => (
                        <motion.li
                          key={t.id}
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.2 }}
                          className="group flex items-start gap-3 rounded-md px-1 py-1 transition-colors hover:bg-amber/5"
                        >
                          <button
                            onClick={() => toggle(t.id)}
                            className={`mt-1 h-3 w-3 shrink-0 rounded-full border transition-all ${
                              t.done
                                ? "bg-amber border-amber shadow-[0_0_8px_rgba(201,168,76,0.6)]"
                                : "border-parchment/30 bg-transparent hover:border-amber/60 hover:bg-amber/10"
                            }`}
                            aria-label="toggle"
                          />
                          <div className="relative flex-1">
                            <span
                              className={`block text-sm transition-colors duration-300 ${
                                t.done ? "text-parchment/30" : "text-parchment/90"
                              }`}
                            >
                              {t.text}
                            </span>
                            {t.done && <QuillStrikethrough />}
                          </div>
                          <button
                            onClick={() => remove(t.id)}
                            className="opacity-0 transition-opacity group-hover:opacity-100 text-parchment/20 hover:text-red-900 mt-0.5"
                            aria-label="remove"
                          >
                            <X size={14} />
                          </button>
                        </motion.li>
                      ))}
                    </AnimatePresence>
                  </ul>
                )}
              </AnimatePresence>
            </div>

            {dayTasks.length > 0 && (
              <div className="mt-4 border-t border-amber/10 pt-3 flex justify-between font-mono text-[10px] uppercase tracking-[0.2em] text-parchment/40">
                <span>{Math.round(progress * 100)}% lit</span>
                <span>
                  {dayTasks.filter((t) => t.done).length} / {dayTasks.length}
                </span>
              </div>
            )}
          </Panel>
        </motion.div>
      </div>

      <style>{`
        @keyframes pulse-slow {
          0%, 100% { border-color: rgba(201, 168, 76, 0.2); box-shadow: inset 0 0 0 rgba(201, 168, 76, 0); }
          50% { border-color: rgba(201, 168, 76, 0.6); box-shadow: inset 0 0 15px rgba(201, 168, 76, 0.2); }
        }
        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }
        @keyframes celebration-pulse {
          0% { opacity: 0.8; transform: scale(1); }
          100% { opacity: 0; transform: scale(1.05); }
        }
        .animate-celebration-pulse {
          animation: celebration-pulse 2s ease-out forwards;
        }
      `}</style>
    </RealmShell>
  );
}