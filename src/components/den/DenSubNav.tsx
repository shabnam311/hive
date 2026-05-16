// DenSubNav.tsx — Zone tabs floating over the 3D scene
import { useDen, type ZoneId } from "./DenContext";
import "./den.css";

const ZONES: { id: ZoneId; icon: string; label: string }[] = [
  { id: "echo", icon: "♫", label: "ECHO" },
  { id: "reel", icon: "◉", label: "REEL" },
  { id: "folio", icon: "✦", label: "FOLIO" },
  { id: "nook", icon: "✿", label: "NOOK" },
];

export function DenSubNav() {
  const { activeZone, setActiveZone } = useDen();

  return (
    <nav className="den-subnav">
      {ZONES.map((z) => (
        <button
          key={z.id}
          className={`den-subnav-item ${
            activeZone === z.id ? "den-subnav-item--active" : "den-subnav-item--inactive"
          }`}
          onClick={() => setActiveZone(activeZone === z.id ? null : z.id)}
        >
          {z.icon} {z.label}
        </button>
      ))}
    </nav>
  );
}
