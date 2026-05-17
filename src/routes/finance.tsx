import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { RealmShell, Panel } from "@/components/RealmShell";
import { FinanceScene } from "@/components/realm-scenes";
import { useDBValue } from "@/hooks/use-db";

export const Route = createFileRoute("/finance")({
  component: FinPage,
});

type Tx = {
  id: string;
  type: "in" | "out";
  amount: number;
  cat: string;
  note: string;
  date: string;
};

// Custom hook for animated numbers
function useAnimatedNumber(value: number, duration = 600) {
  const [displayValue, setDisplayValue] = useState(value);
  useEffect(() => {
    let startTime: number;
    const startValue = displayValue;
    const endValue = value;
    const animate = (time: number) => {
      if (!startTime) startTime = time;
      const progress = Math.min((time - startTime) / duration, 1);
      // easeOutExpo
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setDisplayValue(Math.round(startValue + (endValue - startValue) * ease));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [value]);
  return displayValue;
}

function FinPage() {
  const [budget] = useDBValue("hive.fin.budget", 5000);
  const [tx, setTx] = useDBValue<Tx[]>("hive.fin.tx", []);
  const [chai, setChai] = useDBValue("hive.fin.chai", 0);
  const [draft, setDraft] = useState({ type: "out" as Tx["type"], amount: 0, cat: "", note: "" });
  const [pulse, setPulse] = useState(0);

  const totals = useMemo(() => {
    const out = tx.filter((t) => t.type === "out").reduce((a, t) => a + t.amount, 0);
    const inc = tx.filter((t) => t.type === "in").reduce((a, t) => a + t.amount, 0);
    return { out, inc, net: inc - out, ratio: Math.min(1, out / budget) };
  }, [tx, budget]);

  const add = () => {
    if (!draft.amount) return;
    setTx((t) => [
      { ...draft, id: crypto.randomUUID(), date: new Date().toISOString().slice(0, 10) },
      ...t,
    ]);
    setDraft({ ...draft, amount: 0, cat: "", note: "" });
    setPulse((p) => p + 1);
  };

  const currentDate = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });

  // Custom colors for the dark academia theme
  const colSpent = "text-[#c0848a]"; // Dusty rose
  const colEarned = "text-[#8da399]"; // Sage green
  const colNet = "text-[#d4a96a]"; // Deep amber

  return (
    <RealmShell
      scene={<FinanceScene pulse={pulse} count={Math.min(15, 6 + tx.length)} />}
      title="The Ledger"
      subtitle="every coin remembered."
    >
      {/* Date Context */}
      <div className="flex justify-center mb-6">
        <div className="font-display text-[11px] uppercase tracking-[0.4em] text-parchment/40 border-b border-parchment/10 pb-2 px-12">
          {currentDate}
        </div>
      </div>

      {/* Main Ledger "Book" Wrapper */}
      <div className="grid gap-0 md:grid-cols-[1fr_320px] rounded-xl overflow-hidden border border-amber/20 shadow-[inset_0_0_80px_rgba(0,0,0,0.8),0_20px_40px_rgba(0,0,0,0.5)] bg-[#0d131a] relative">
        {/* Subtle Parchment Texture Overlay */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay"
          style={{
            backgroundImage:
              "url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')",
          }}
        ></div>

        {/* Left Page (Main Ledger) */}
        <div className="p-6 md:p-8 relative border-r border-[#d4a96a]/10 shadow-[inset_-10px_0_20px_rgba(0,0,0,0.4)]">
          {/* NET Balance Big Center Highlight */}
          <div className="flex flex-col items-center mb-10 pb-8 border-b border-[#d4a96a]/10 relative">
            <div className="absolute bottom-0 w-32 h-[1px] bg-gradient-to-r from-transparent via-[#d4a96a]/30 to-transparent"></div>
            <div className="font-display text-xs uppercase tracking-[0.4em] text-[#d4a96a]/50 font-light mb-2">
              Net Balance
            </div>
            <AnimatedNumber
              value={totals.net}
              prefix={totals.net < 0 ? "−₹" : "₹"}
              className={`font-display text-5xl md:text-6xl ${totals.net >= 0 ? colNet + " text-glow-amber" : colSpent}`}
            />
          </div>

          <div className="grid grid-cols-2 gap-6 mb-8 px-4">
            <S label="spent" v={totals.out} color={colSpent} />
            <S label="earned" v={totals.inc} color={colEarned} align="right" />
          </div>

          <table className="w-full text-sm mt-4">
            <thead>
              <tr className="text-[#d4a96a]/40 font-mono text-[10px] uppercase tracking-[0.25em] border-b border-[#d4a96a]/20">
                <th className="text-left py-3 font-normal">date</th>
                <th className="text-left py-3 font-normal">cat</th>
                <th className="text-left py-3 font-normal hidden sm:table-cell">note</th>
                <th className="text-right py-3 font-normal">amount</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {tx.length === 0 && (
                <tr className="border-b border-[#d4a96a]/10 opacity-30">
                  <td className="py-4 font-mono text-xs text-parchment/40">2026-05-15</td>
                  <td className="font-hand text-[#d4a96a]/50">example</td>
                  <td className="text-parchment/40 italic hidden sm:table-cell">
                    a ghost entry appears...
                  </td>
                  <td className="text-right font-mono text-[#8da399]/50">+₹0</td>
                  <td />
                </tr>
              )}
              {tx.map((t) => (
                <tr
                  key={t.id}
                  className="border-b border-[#d4a96a]/10 hover:bg-[#d4a96a]/5 transition-colors group"
                >
                  <td className="py-3 font-mono text-xs text-parchment/50">{t.date}</td>
                  <td className="font-hand text-[#d4a96a] text-base">{t.cat}</td>
                  <td className="text-parchment/70 italic hidden sm:table-cell">{t.note}</td>
                  <td
                    className={`text-right font-mono tracking-wider ${t.type === "in" ? colEarned : colSpent}`}
                  >
                    {t.type === "in" ? "+" : "−"}₹{t.amount}
                  </td>
                  <td className="text-right pl-2">
                    <button
                      onClick={() => setTx((arr) => arr.filter((x) => x.id !== t.id))}
                      className="text-parchment/20 hover:text-ember text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
              {/* Extra blank ledger lines */}
              {Array.from({ length: Math.max(0, 5 - tx.length) }).map((_, i) => (
                <tr key={`blank-${i}`} className="border-b border-[#d4a96a]/5">
                  <td className="py-5"></td>
                  <td />
                  <td className="hidden sm:table-cell" />
                  <td />
                  <td />
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Right Page (Sidebar) */}
        <div className="p-6 md:p-8 bg-[#151110] shadow-[inset_10px_0_20px_rgba(0,0,0,0.5)] flex flex-col gap-10">
          {/* New Entry Form */}
          <section>
            <div className="font-display text-[10px] uppercase tracking-[0.3em] text-[#d4a96a]/60 mb-5 flex items-center gap-3">
              <span>New Entry</span>
              <div className="h-[1px] flex-1 bg-gradient-to-r from-[#d4a96a]/20 to-transparent"></div>
            </div>

            <div className="flex gap-2 mb-6">
              {(["out", "in"] as const).map((t) => {
                const isActive = draft.type === t;
                return (
                  <button
                    key={t}
                    onClick={() => setDraft({ ...draft, type: t })}
                    className={`flex-1 rounded-sm py-2.5 font-display text-[10px] uppercase tracking-[0.2em] transition-all duration-300 ${
                      isActive
                        ? `bg-[#d4a96a]/15 text-[#d4a96a] shadow-[inset_0_0_10px_rgba(212,169,106,0.1)] border border-[#d4a96a]/30`
                        : "bg-black/40 text-parchment/30 shadow-[inset_0_4px_6px_rgba(0,0,0,0.6)] border border-transparent hover:text-parchment/50"
                    }`}
                  >
                    {t === "out" ? "Spent" : "Earned"}
                  </button>
                );
              })}
            </div>

            <div className="space-y-4">
              <input
                type="number"
                min="0.01"
                step="0.01"
                placeholder="amount"
                value={draft.amount || ""}
                onChange={(e) => setDraft({ ...draft, amount: Number(e.target.value) })}
                className="w-full bg-transparent border-b border-[#d4a96a]/30 px-1 py-2 font-mono text-lg text-parchment outline-none focus:border-[#d4a96a] placeholder:text-parchment/20 transition-colors"
              />
              <input
                placeholder="category (e.g. food)"
                value={draft.cat}
                onChange={(e) => setDraft({ ...draft, cat: e.target.value })}
                className="w-full bg-transparent border-b border-[#d4a96a]/30 px-1 py-2 font-hand text-lg text-[#d4a96a] outline-none focus:border-[#d4a96a] placeholder:text-parchment/20 placeholder:font-sans placeholder:text-sm transition-colors"
              />
              <input
                placeholder="note"
                value={draft.note}
                onChange={(e) => setDraft({ ...draft, note: e.target.value })}
                className="w-full bg-transparent border-b border-[#d4a96a]/30 px-1 py-2 text-sm text-parchment/80 italic outline-none focus:border-[#d4a96a] placeholder:text-parchment/20 placeholder:not-italic transition-colors"
              />
            </div>

            <button
              onClick={add}
              disabled={!draft.amount}
              className="mt-8 w-full rounded-sm border border-[#d4a96a]/40 bg-[#d4a96a]/10 py-3 font-display text-[11px] uppercase tracking-[0.4em] text-[#d4a96a] transition-all hover:bg-[#d4a96a]/20 hover:shadow-[inset_0_0_15px_rgba(212,169,106,0.3)] disabled:opacity-30 disabled:cursor-not-allowed group relative overflow-hidden"
            >
              <span className="relative z-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                Ink It In
              </span>
        
            </button>
          </section>

          {/* Budget Candle */}
          <section className="mt-4">
            <div className="flex justify-between items-end mb-3">
              <div className="font-display text-[10px] uppercase tracking-[0.3em] text-[#d4a96a]/60">
                Monthly Budget
              </div>
              <div className="font-mono text-[10px] text-parchment/50">
                ₹{budget - totals.out} left
              </div>
            </div>
            <div className="h-1.5 rounded-full bg-[#2a1b15] shadow-[inset_0_1px_3px_rgba(0,0,0,0.8)] relative">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#d4a96a] to-amberHot shadow-[0_0_10px_rgba(255,179,71,0.5)] transition-all duration-1000 ease-out"
                style={{ width: `${totals.ratio * 100}%` }}
              >
                {/* Flickering Flame Icon */}
                {totals.ratio > 0 && totals.ratio < 1 && (
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 text-[10px] animate-pulse drop-shadow-[0_0_5px_#ffb347]">
                    🔥
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Page Fold Divider */}
          <div className="relative h-4 my-2">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#d4a96a]/5 to-transparent"></div>
            <div className="absolute top-1/2 w-full h-[1px] bg-[#d4a96a]/20 shadow-[0_1px_0_rgba(255,255,255,0.05)]"></div>
          </div>

          {/* Chai Jar */}
          <section className="relative group">
            <div className="flex justify-between items-center mb-2">
              <div className="font-display text-[10px] uppercase tracking-[0.3em] text-[#d4a96a]/80 flex items-center gap-2">
                <span className="text-sm opacity-80">☕</span> Chai Jar
              </div>
              <button
                onClick={() => setChai(0)}
                className="text-[9px] uppercase tracking-wider text-parchment/30 hover:text-ember underline decoration-parchment/20 underline-offset-4 transition-colors"
              >
                reset
              </button>
            </div>

            <div className="flex items-end justify-between bg-black/20 p-4 rounded-lg border border-[#d4a96a]/10 relative overflow-hidden">
              {/* Fill animation background */}
              <div
                className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#c0848a]/20 to-transparent transition-all duration-1000 ease-out"
                style={{ height: `${Math.min(100, (chai / 800) * 100)}%` }}
              ></div>

              <div className="relative z-10">
                <AnimatedNumber
                  value={chai}
                  prefix="₹"
                  className="font-display text-4xl text-[#c0848a] drop-shadow-[0_0_15px_rgba(192,132,138,0.4)]"
                />
                <div className="font-hand text-parchment/60 text-sm mt-1 italic">
                  small wins, saved up.
                </div>
              </div>

              <button
                onClick={() => {
                  setChai((c) => c + 80);
                  setPulse((p) => p + 1);
                }}
                className="relative z-10 rounded-full w-12 h-12 border border-[#c0848a]/40 bg-[#c0848a]/10 flex items-center justify-center text-xs text-[#c0848a] hover:bg-[#c0848a]/20 hover:scale-105 transition-all shadow-[0_0_10px_rgba(192,132,138,0.1)] hover:shadow-[0_0_20px_rgba(192,132,138,0.3)]"
              >
                +80
              </button>
            </div>
          </section>
        </div>
      </div>
    </RealmShell>
  );
}

function AnimatedNumber({
  value,
  prefix = "",
  className = "",
}: {
  value: number;
  prefix?: string;
  className?: string;
}) {
  const displayValue = useAnimatedNumber(value);
  return (
    <div className={className}>
      {prefix}
      {displayValue}
    </div>
  );
}

function S({
  label,
  v,
  color = "text-parchment",
  align = "left",
}: {
  label: string;
  v: number;
  color?: string;
  align?: "left" | "right";
}) {
  return (
    <div
      className={`flex flex-col ${align === "right" ? "items-end text-right" : "items-start text-left"}`}
    >
      <div className="font-display text-[9px] uppercase tracking-[0.4em] text-[#d4a96a]/40 font-light mb-1">
        {label}
      </div>
      <AnimatedNumber value={v} prefix="₹" className={`font-display text-2xl ${color}`} />
    </div>
  );
}