# HIVE — your grimoire. your rules. your universe.

A local-first, immersive Life OS. Diary, planner, finance, 3D study realm, and a cozy den — all in one app, all on your machine.

## Run locally (web)
npm install
npm run dev

Opens at http://localhost:5173

## Run as desktop app
npm install
npm run electron:dev

## Build Windows installer (.exe)
npm run electron:build:win

Output is in the release/ folder. Double-click to install.

## AI setup (Ollama)
1. Download from https://ollama.com
2. Install and run it
3. Pull a model: ollama pull llama3
4. HIVE auto-detects it on startup — no API keys needed

## Data
Everything lives on your machine. IndexedDB in the browser, local files in the desktop app. Nothing sent anywhere.