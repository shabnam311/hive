import { Outlet, Link, createRootRoute } from "@tanstack/react-router";
import { OllamaProvider } from "@/components/OllamaContext";
import { OllamaSetup } from "@/components/OllamaSetup";
import { useOllama } from "@/components/OllamaContext";

function AppShell() {
  const { showSetup, retry, dismiss } = useOllama();
  return (
    <>
      {showSetup && <OllamaSetup onRetry={retry} onDismiss={dismiss} />}
      <Outlet />
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
      <AppShell />
    </OllamaProvider>
  ),
  notFoundComponent: NotFoundComponent,
});