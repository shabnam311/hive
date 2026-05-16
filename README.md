# HIVE

Your personal local-first workspace — Diary, Planner, Finance, Library, Den, and an AI powered entirely by Ollama running on your machine.

---

## Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [Ollama](https://ollama.com/) installed and running
- At least one Ollama model: `ollama pull llama3`

---

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

---

## Desktop app (Electron)

Run in dev mode with live reload:

```bash
npm run electron:dev
```

Build a distributable:

```bash
# Current platform
npm run electron:build

# Specific platform
npm run electron:build:win     # Windows .exe installer
npm run electron:build:mac     # Mac .dmg
npm run electron:build:linux   # Linux .AppImage
```

Output goes to the `release/` folder.

---

## Architecture

| Feature | Data | AI |
|---|---|---|
| Diary | IndexedDB | Ollama |
| Planner | IndexedDB | — |
| Finance | IndexedDB | — |
| Library / Folio | IndexedDB | Ollama |
| Den / Nook | IndexedDB | Ollama |
| Realm | IndexedDB | Ollama |

All data is stored locally. No cloud, no tracking, no API keys required.

---

## Ollama setup

HIVE uses [Ollama](https://ollama.com/) to run AI locally. Ollama must be installed and running before the AI features work.

1. Download Ollama from https://ollama.com/download
2. Install and start it (it runs as a background service)
3. Pull a model: `ollama pull llama3`
4. Start HIVE — it will detect Ollama automatically

If Ollama isn't running, HIVE shows a setup screen with instructions.

---

## Project structure

```
src/
  services/
    ollama.ts         ← unified Ollama service (all AI calls go here)
  components/
    ollama/
      OllamaSetup.tsx     ← shown when Ollama isn't running
      OllamaModelPicker.tsx
    ErrorBoundary.tsx
  db.ts               ← unified IndexedDB data layer
  routes/             ← TanStack Router file-based routes

electron/
  main.js             ← Node.js main process
  preload.js          ← secure IPC bridge
```
