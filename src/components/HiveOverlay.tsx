import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";

function useClock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000 * 30);
    return () => clearInterval(id);
  }, []);
  return now;
}

function timeOfDay(h: number) {
  if (h < 8) return "Dawn";
  if (h < 17) return "Day";
  if (h < 20) return "Dusk";
  return "Midnight";
}

import { RealmNav } from "./RealmShell";

export function TopBar() {
  return (
    <div className="pointer-events-auto relative z-50">
      <RealmNav />
    </div>
  );
}

export function HeroCopy() {
  return (
    <div className="pointer-events-none absolute left-0 right-0 top-[16%] z-10 mx-auto max-w-3xl px-6 text-center animate-fade-up">
      <h1 className="mt-2 font-display text-6xl font-semibold tracking-tight text-parchment text-glow-amber md:text-8xl">
        a living universe,
        <br />
        <span className="italic text-amber">built for one.</span>
      </h1>
      <div className="pointer-events-auto mt-8 flex items-center justify-center gap-4">
        <Link
          to="/planner"
          className="group relative overflow-hidden rounded-md border border-amber/60 bg-amber/15 px-6 py-3 font-display text-sm uppercase tracking-[0.3em] text-amber transition-all hover:bg-amber hover:text-primary-foreground hover:shadow-[0_0_40px_-5px_oklch(0.74_0.16_75/0.7)]"
        >
          Enter the Hive
        </Link>
      </div>
    </div>
  );
}

function Widget({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`glass-panel rounded-xl p-5 ${className}`}>
      <div className="mb-2 flex items-center justify-between">
        <span className="font-display text-[10px] uppercase tracking-[0.35em] text-amber/80">
          {title}
        </span>
        <span className="h-1.5 w-1.5 rounded-full bg-amber animate-flicker" />
      </div>
      {children}
    </div>
  );
}

export function BottomDock() {
  const now = useClock();
  const hh = now ? now.getHours().toString().padStart(2, "0") : "--";
  const mm = now ? now.getMinutes().toString().padStart(2, "0") : "--";
  const date = now
    ? now.toLocaleDateString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
      })
    : "";
  const tod = now ? timeOfDay(now.getHours()) : "";

  return (
    <div className="pointer-events-auto fixed bottom-6 left-1/2 z-20 w-[min(1100px,calc(100vw-2rem))] -translate-x-1/2">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Widget title="Hour" className="md:col-span-1">
          <div className="font-display text-3xl text-parchment text-glow-amber">
            {hh}
            <span className="text-amber animate-flicker">:</span>
            {mm}
          </div>
          <div className="mt-1 font-mono text-[10px] text-parchment/55">
            {date} · {tod}
          </div>
        </Widget>

        <Widget title="Currently">
          <div className="font-hand text-amber text-lg leading-tight">
            Awaiting <span className="text-parchment/80">your focus</span>
          </div>
          <div className="font-hand text-parchment/70">
            Listening <span className="text-parchment/50">to silence</span>
          </div>
        </Widget>

        <Widget title="Weather">
          <div className="flex items-end gap-2">
            <span className="font-display text-3xl text-parchment">--°</span>
            <span className="mb-1 font-mono text-[10px] text-parchment/55">unknown</span>
          </div>
          <div className="mt-1 text-xs text-parchment/65">waiting for sync</div>
        </Widget>

        <Widget title="Streak">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-3xl text-amber/30">
              0
            </span>
            <span className="font-mono text-[10px] text-parchment/30">days lit</span>
          </div>
          <div className="mt-2 flex gap-1">
            {Array.from({ length: 7 }).map((_, i) => (
              <span
                key={i}
                className="h-1.5 flex-1 rounded-full bg-parchment/10"
              />
            ))}
          </div>
        </Widget>

        <Widget title="Gratitude">
          <div className="font-hand text-parchment/50 text-lg leading-snug italic">
            "What are you grateful for today?"
          </div>
        </Widget>
      </div>
    </div>
  );
}

export function SideRizz() {
  return (
    <aside className="pointer-events-auto fixed right-6 top-1/2 z-20 hidden -translate-y-1/2 lg:block">
      <div className="glass-panel rounded-xl p-4 w-56">
        <div className="font-display text-[10px] uppercase tracking-[0.35em] text-amber/80">
          Rizz Meter
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-parchment/10">
          <div className="h-full w-[78%] rounded-full bg-gradient-to-r from-amber via-amber to-ember" />
        </div>
        <div className="mt-2 font-hand text-amber text-lg">main character energy</div>
        <div className="mt-3 border-t border-parchment/10 pt-3 font-mono text-[10px] text-parchment/55">
          xp · 4,820 / 5,000
          <br />
          lvl 14 · apprentice wanderer
        </div>
      </div>
    </aside>
  );
}

export function CornerWhisper() {
  return (
    <div className="pointer-events-none fixed left-6 top-1/2 z-20 hidden max-w-[14rem] -translate-y-1/2 lg:block">
      <div className="font-hand text-parchment/55 text-xl leading-snug">
        the lanterns are lit.
        <br />
        the fireflies remember.
        <br />
        <span className="text-amber/80">welcome home.</span>
      </div>
    </div>
  );
}
