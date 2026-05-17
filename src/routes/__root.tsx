import { Outlet, Link, createRootRoute } from "@tanstack/react-router";
import { OllamaProvider, useOllama } from "@/components/OllamaContext";
import { OllamaSetup } from "@/components/OllamaSetup";
import { DenProvider, useDen } from "@/components/den/DenContext";

function MiniPlayer() {
  const { spotifyPlaylistUrl } = useDen();
  if (!spotifyPlaylistUrl) return null;
  return (
    <div style={{
      position: "fixed", bottom: 16, right: 16, zIndex: 9000,
      width: 320, borderRadius: "12px", overflow: "hidden",
      boxShadow: "0 8px 32px rgba(0,0,0,0.7)",
      border: "1px solid rgba(201,168,76,0.2)", background: "#000",
    }}>
      <iframe
        src={spotifyPlaylistUrl}
        width="320" height="80" frameBorder="0"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        style={{ display: "block" }}
      />
    </div>
  );
}

function AppShell() {
  const { showSetup, retry, dismiss } = useOllama();
  return (
    <>
      {showSetup && <OllamaSetup onRetry={retry} onDismiss={dismiss} />}
      <Outlet />
      <MiniPlayer />
    </>
  );
}

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold">404</h1>
        <p className="mt-2 text-sm">Page not found.</p>
        <div className="mt-6">
          <Link to="/" className="inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium">
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  component: () => (
    <OllamaProvider>
      <DenProvider>
        <AppShell />
      </DenProvider>
    </OllamaProvider>
  ),
  notFoundComponent: NotFoundComponent,
});