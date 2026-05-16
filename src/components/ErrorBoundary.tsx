// src/components/ErrorBoundary.tsx
// Catches any render error (Three.js WebGL crash, network fail, etc.)
// and shows a friendly message instead of a white screen.

import { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: "" };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[HIVE ErrorBoundary]", error, info);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "3rem",
            minHeight: 200,
            textAlign: "center",
            fontFamily: "inherit",
          }}
        >
          <div style={{ fontSize: 36, marginBottom: "1rem" }}>⚠️</div>
          <h2
            style={{
              fontSize: 18,
              fontWeight: 500,
              marginBottom: "0.5rem",
              color: "var(--color-text-primary)",
            }}
          >
            Something went wrong
          </h2>
          <p
            style={{
              fontSize: 13,
              color: "var(--color-text-secondary)",
              maxWidth: 340,
              lineHeight: 1.6,
              marginBottom: "1.5rem",
            }}
          >
            {this.state.message || "An unexpected error occurred."}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, message: "" })}
            style={{
              padding: "0.5rem 1.25rem",
              borderRadius: 8,
              border: "0.5px solid var(--color-border-secondary)",
              background: "transparent",
              fontSize: 13,
              cursor: "pointer",
              color: "var(--color-text-primary)",
            }}
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Convenience wrapper for 3D scenes — shows a specific message for WebGL issues
export function DenSceneBoundary({ children }: { children: ReactNode }) {
  const fallback = (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: 400,
        textAlign: "center",
        fontFamily: "inherit",
      }}
    >
      <div style={{ fontSize: 36, marginBottom: "1rem" }}>🖥️</div>
      <h2 style={{ fontSize: 16, fontWeight: 500, marginBottom: "0.5rem" }}>
        3D scene couldn't load
      </h2>
      <p style={{ fontSize: 13, color: "var(--color-text-secondary)", maxWidth: 300 }}>
        Your device may not support WebGL, or your GPU ran into an issue. Try
        refreshing the page.
      </p>
    </div>
  );

  return <ErrorBoundary fallback={fallback}>{children}</ErrorBoundary>;
}
