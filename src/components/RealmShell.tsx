import { Link, useLocation } from "@tanstack/react-router";
import { type ReactNode, Suspense, useEffect, useState } from "react";
import { motion } from "framer-motion";

const NAV = [
  { to: "/", label: "Home", icon: "⌂" },
  { to: "/planner", label: "Planner", icon: "◷" },
  { to: "/realm", label: "Realm", icon: "✧" },
  { to: "/diary", label: "Diary", icon: "✎" },
  { to: "/finance", label: "The Ledger", icon: "◎" },
  { to: "/den", label: "The Den", icon: "⚑" },
] as const;

export function RealmNav() {
  const { pathname } = useLocation();
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between gap-4 border-b border-amber/15 bg-[#0d0906]/60 px-6 py-3 backdrop-blur-xl">
      <Link to="/" className="flex items-center gap-3 group">
        <div className="relative grid h-8 w-8 place-items-center rounded-md border border-amber/40 bg-deepbrown/60 overflow-hidden">
          <div className="absolute inset-0 bg-[conic-gradient(from_0deg,transparent_0%,rgba(201,168,76,0.2)_25%,transparent_50%,rgba(201,168,76,0.2)_75%,transparent_100%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-hover:animate-spin-slow" />
          <span className="relative z-10 font-display text-sm text-amber text-glow-amber">H</span>
        </div>
        <span className="font-display text-sm tracking-[0.4em] text-parchment/90">HIVE</span>
      </Link>

      <nav
        className="flex flex-1 items-center gap-2 overflow-x-auto px-2"
        onMouseLeave={() => setHoveredTab(null)}
      >
        {NAV.map((n) => {
          const active = pathname === n.to;
          return (
            <Link
              key={n.to}
              to={n.to}
              onMouseEnter={() => setHoveredTab(n.to)}
              className={`group relative whitespace-nowrap flex items-center gap-2 rounded-md px-4 py-2 font-display text-[10px] uppercase tracking-[0.3em] transition-colors duration-300 ${
                active ? "text-[#0d0906]" : "text-parchment/55 hover:text-amber"
              }`}
            >
              {active && (
                <motion.div
                  layoutId="active-nav-pill"
                  className="absolute inset-0 rounded-md bg-amber shadow-[0_0_15px_rgba(201,168,76,0.6)]"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}

              <span
                className={`relative z-10 text-[14px] transition-all duration-300 ${active ? "opacity-90" : "opacity-70 group-hover:opacity-100 group-hover:drop-shadow-[0_0_8px_rgba(201,168,76,0.8)]"}`}
              >
                {n.icon}
              </span>
              <span className={`relative z-10 ${active ? "font-bold" : ""}`}>{n.label}</span>

              {/* Flicker Underline on hover for inactive tabs */}
              {!active && hoveredTab === n.to && (
                <div className="absolute bottom-1 left-4 right-4 h-[1px] bg-amber/80 animate-flicker-underline" />
              )}
            </Link>
          );
        })}
      </nav>

      <span className="hidden font-mono text-[10px] text-parchment/15 md:block transition-opacity hover:opacity-100 cursor-default">
        v2.0 · local
      </span>

      <style>{`
        @keyframes flicker-underline {
          0%, 100% { opacity: 0.8; box-shadow: 0 0 4px rgba(201,168,76,0.6); }
          25% { opacity: 0.2; box-shadow: none; }
          50% { opacity: 0.9; box-shadow: 0 0 8px rgba(201,168,76,0.8); }
          75% { opacity: 0.4; box-shadow: 0 0 2px rgba(201,168,76,0.3); }
        }
        .animate-flicker-underline {
          animation: flicker-underline 0.6s ease-in-out forwards;
        }
      `}</style>
    </header>
  );
}

export function RealmShell({
  scene,
  title,
  subtitle,
  children,
}: {
  scene: ReactNode;
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Split title into words if it's the LANTERN PATH
  const isLanternPath = title === "The LANTERN PATH" || title === "LANTERN PATH";
  const titleWords = title.replace("The ", "").split(" ");

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#0d0906]">
      <div className="absolute inset-0">
        <Suspense fallback={<div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100%",background:"#0a0604",color:"rgba(201,168,76,0.4)",fontFamily:"'Cinzel',serif",fontSize:"0.75rem",letterSpacing:"0.2em"}}>LOADING...</div>}>{scene}</Suspense>
      </div>

      {/* Background gradients */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,#0d0906_100%)] z-[1]" />
      <div className="pointer-events-none fixed bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-[#0d0906] to-transparent z-[2]" />
      <div className="pointer-events-none fixed bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-[radial-gradient(ellipse_at_center,rgba(139,69,19,0.15)_0%,transparent_70%)] z-[2]" />

      <RealmNav />

      <main className="relative z-10 mx-auto max-w-6xl px-6 pt-28 pb-20">
        <motion.div
          initial="hidden"
          animate="show"
          variants={{
            hidden: { opacity: 0 },
            show: { opacity: 1, transition: { staggerChildren: 0.2, delayChildren: 0.4 } },
          }}
          className="mb-10"
          style={{ y: scrollY * 0.35 }} // Parallax
        >
          {/* Tagline Typewriter */}
          <motion.div
            variants={{
              hidden: { opacity: 0, filter: "blur(4px)" },
              show: { opacity: 1, filter: "blur(0px)", transition: { duration: 1.2 } },
            }}
            className="font-hand text-amber/80 text-xl mb-3 tracking-wide"
          >
            {subtitle}
          </motion.div>

          {/* Title Stagger */}
          <h1 className="font-display text-5xl text-glow-amber md:text-6xl flex flex-wrap items-baseline gap-x-4 gap-y-2">
            {title.startsWith("The ") && (
              <motion.span
                variants={{
                  hidden: { opacity: 0 },
                  show: { opacity: 0.7, transition: { duration: 1 } },
                }}
                className="text-3xl md:text-4xl text-parchment/70 font-light tracking-[0.1em]"
              >
                The
              </motion.span>
            )}

            {titleWords.map((word, i) => (
              <motion.span
                key={i}
                variants={{
                  hidden: { opacity: 0, y: 10, filter: "blur(10px)", color: "rgba(245,236,215,0)" },
                  show: {
                    opacity: 1,
                    y: 0,
                    filter: "blur(0px)",
                    color: "rgba(245,236,215,1)",
                    transition: { duration: 1.2, ease: "easeOut" },
                  },
                }}
                className="text-parchment font-bold tracking-widest uppercase relative"
              >
                {word}
                {/* Slow breathing lantern glow behind title words if lantern path */}
                {isLanternPath && (
                  <motion.div
                    animate={{ opacity: [0.1, 0.4, 0.1] }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: i * 0.5,
                    }}
                    className="absolute inset-0 bg-amber/30 blur-xl z-[-1]"
                  />
                )}
              </motion.span>
            ))}
          </h1>
        </motion.div>

        {children}
      </main>
    </div>
  );
}

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`glass-panel rounded-xl p-5 ${className}`}>{children}</div>;
}
