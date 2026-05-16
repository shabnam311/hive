// vite.config.ts
// Plain Vite config — no @lovable.dev wrapper.
// SPA mode: TanStack Router (file-based), no SSR.

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { TanStackRouterVite } from "@tanstack/router-vite-plugin";

export default defineConfig({
  plugins: [
    react(),
    TanStackRouterVite(), // auto-generates routeTree.gen.ts — do NOT commit that file
  ],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  // Electron needs files served from ./ not /
  base: process.env.ELECTRON === "true" ? "./" : "/",

  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: { main: path.resolve(__dirname, "index.html") },
    },
  },

  server: {
    port: 5173,
    strictPort: true,
  },
});
