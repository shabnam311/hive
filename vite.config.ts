// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
// ✅ Correct package — @tanstack/router-plugin is what's actually in node_modules
// The old import "@tanstack/router-vite-plugin" does NOT exist and crashes the dev server
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";

export default defineConfig({
  plugins: [
    // TanStackRouterVite MUST come before react() — it generates routeTree.gen.ts
    TanStackRouterVite({
      routesDirectory: "./src/routes",
      generatedRouteTree: "./src/routeTree.gen.ts",
    }),
    react(),
  ],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  // Electron needs relative paths (./) — web needs absolute (/)
  base: process.env.ELECTRON === "true" ? "./" : "/",

  build: {
    outDir: "dist",
    emptyOutDir: true,
  },

  server: {
    port: 5173,
    strictPort: true,
  },
});
