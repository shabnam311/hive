import { createRouter, createHashHistory, createBrowserHistory } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

// Detect Electron: file:// protocol means we're packaged
const isElectron =
  typeof window !== "undefined" &&
  (window.location.protocol === "file:" ||
    window.navigator.userAgent.toLowerCase().includes("electron"));

// Use hash history everywhere so GitHub Pages doesn't 404 on direct links/refreshes
const history = createHashHistory();
export const router = createRouter({
  routeTree,
  history,
  basepath: import.meta.env.BASE_URL,
  defaultPreloadStaleTime: 0,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}