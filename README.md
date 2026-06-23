<div align="center">

# 🐝 HIVE

**A local-first personal workspace — Diary, Planner, Finance, Library, Den, and AI — all running entirely on your machine.**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-shabnam311.github.io%2Fhive-c9a84c?style=flat-square&logo=github)](https://shabnam311.github.io/hive/)
[![License](https://img.shields.io/badge/license-MIT-c9a84c?style=flat-square)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-96%25-3178c6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Built with Vite](https://img.shields.io/badge/Built%20with-Vite-646cff?style=flat-square&logo=vite)](https://vitejs.dev/)

> No cloud. No API keys. No tracking. Your data stays on your device — always.

<!-- SCREENSHOT PLACEHOLDER -->
<!-- ![HIVE Screenshot](docs/screenshot.png) -->

</div>

---

## ✨ Features

| Module | Description | AI |
|--------|-------------|-----|
| **Diary** | Private journaling with mood tracking | ✅ Ollama |
| **Planner** | Task management and daily planning | — |
| **Finance** | Personal expense and budget tracking | — |
| **Library / Folio** | Book notes and reading log | ✅ Ollama |
| **Den / Nook** | Personal creative space with ambient music | ✅ Ollama |
| **Realm** | Custom workspace for your projects | ✅ Ollama |

- 🔒 **Fully local** — all data stored in IndexedDB, nothing leaves your device
- 🦙 **AI powered by [Ollama](https://ollama.com/)** — runs any local model (llama3, mistral, etc.)
- 🖥️ **Desktop app** — available as a native Electron app for Windows, Mac, and Linux
- 🌐 **Web app** — try it instantly at [shabnam311.github.io/hive](https://shabnam311.github.io/hive/) (AI requires local Ollama)

---

## 🚀 Getting Started

### Web (no install)

Visit **[shabnam311.github.io/hive](https://shabnam311.github.io/hive/)** — all features except AI work immediately in your browser. To enable AI, install Ollama locally (see below).

### Local Development

**Prerequisites:** Node.js 18+, npm

```bash
git clone https://github.com/shabnam311/hive.git
cd hive
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

---

## 🦙 AI Setup (Ollama)

HIVE uses [Ollama](https://ollama.com/) to run AI models locally — no OpenAI key, no subscriptions, no data sent anywhere.

1. Download and install Ollama from [ollama.com/download](https://ollama.com/download)
2. Pull a model:
   ```bash
   ollama pull llama3
   ```
3. Ollama runs as a background service — HIVE detects it automatically.

> If Ollama isn't running, HIVE shows a setup guide. You can skip it and use all non-AI features normally.

---

## 🖥️ Desktop App (Electron)

```bash
# Dev mode with live reload
npm run electron:dev

# Build for your platform
npm run electron:build          # current platform
npm run electron:build:win      # Windows (.exe installer)
npm run electron:build:mac      # macOS (.dmg)
npm run electron:build:linux    # Linux (.AppImage)
```

Builds output to the `release/` folder.

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript |
| Routing | TanStack Router (file-based) |
| Styling | CSS variables, custom design system |
| Data | IndexedDB (all local, no server) |
| AI | Ollama (local LLM inference) |
| Desktop | Electron 42 |
| Build | Vite 8 |
| Deploy | GitHub Pages |

---

## 📁 Project Structure

```
hive/
├── src/
│   ├── routes/              # TanStack Router file-based routes
│   ├── components/
│   │   ├── ollama/          # OllamaSetup, OllamaModelPicker
│   │   └── ErrorBoundary.tsx
│   ├── services/
│   │   └── ollama.ts        # Unified Ollama service (all AI calls)
│   └── db.ts                # Unified IndexedDB data layer
├── electron/
│   ├── main.js              # Electron main process
│   └── preload.js           # Secure IPC bridge
├── public/                  # Static assets
└── scripts/
    └── make-404.mjs         # SPA redirect for GitHub Pages
```

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to open an [issue](https://github.com/shabnam311/hive/issues) or submit a pull request.

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Commit your changes: `git commit -m "feat: add your feature"`
4. Push to your branch: `git push origin feat/your-feature`
5. Open a Pull Request

---

## 📄 License


MIT © [shabnam311](https://github.com/shabnam311)

---

<div align="center">
  <sub>Built with ❤️ as a local-first alternative to cloud-everything.</sub>
</div>
