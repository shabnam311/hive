import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  component: Privacy,
});

function Privacy() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "#0d0903",
      color: "#c9a84c",
      fontFamily: "Crimson Text, serif",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "2rem",
    }}>
      <div style={{ maxWidth: "600px", lineHeight: "1.8" }}>
        <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>Privacy Policy</h1>
        <p style={{ opacity: 0.8, marginBottom: "1rem" }}>
          HIVE is a local-first application. Everything stays on your device.
        </p>
        <ul style={{ opacity: 0.7, paddingLeft: "1.5rem" }}>
          <li>No accounts. No sign-up.</li>
          <li>All data is stored in your browser's IndexedDB or local app storage.</li>
          <li>No data is ever sent to any server.</li>
          <li>No analytics, no tracking, no telemetry.</li>
          <li>AI runs locally via Ollama on your own machine.</li>
          <li>We collect nothing. We know nothing about you.</li>
        </ul>
        <p style={{ opacity: 0.5, marginTop: "2rem", fontSize: "0.85rem" }}>
          Last updated: May 2026
        </p>
      </div>
    </div>
  );
}