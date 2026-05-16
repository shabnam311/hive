// electron/main.js
// Electron main process — starts the app window and manages Ollama as a child process.

const { app, BrowserWindow, shell, ipcMain } = require("electron");
const path = require("path");
const { spawn, execFile } = require("child_process");
const fs = require("fs");

const isDev = !app.isPackaged;
const OLLAMA_PORT = 11434;

let mainWindow = null;
let ollamaProcess = null;

// ─── Ollama management ──────────────────────────────────────────────────────

function getOllamaPath() {
  if (process.platform === "win32") {
    // Common install locations on Windows
    const candidates = [
      path.join(process.env.LOCALAPPDATA || "", "Programs", "Ollama", "ollama.exe"),
      path.join(process.env.ProgramFiles || "", "Ollama", "ollama.exe"),
      "ollama.exe", // on PATH
    ];
    return candidates.find((p) => {
      try { return fs.existsSync(p); } catch { return false; }
    }) ?? "ollama";
  }

  if (process.platform === "darwin") {
    const candidates = [
      "/usr/local/bin/ollama",
      "/opt/homebrew/bin/ollama", // Apple Silicon homebrew
      path.join(process.env.HOME || "", ".ollama", "ollama"),
    ];
    return candidates.find((p) => {
      try { return fs.existsSync(p); } catch { return false; }
    }) ?? "ollama";
  }

  // Linux
  return "/usr/local/bin/ollama";
}

async function isOllamaRunning() {
  try {
    const { default: fetch } = await import("node-fetch").catch(() => ({
      default: global.fetch,
    }));
    const fn = fetch ?? global.fetch;
    const res = await fn(`http://localhost:${OLLAMA_PORT}/api/tags`, {
      signal: AbortSignal.timeout(2000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function startOllama() {
  if (await isOllamaRunning()) {
    console.log("[Ollama] Already running");
    return;
  }

  const ollamaPath = getOllamaPath();
  console.log(`[Ollama] Starting from: ${ollamaPath}`);

  ollamaProcess = spawn(ollamaPath, ["serve"], {
    detached: false,
    stdio: "ignore",
    env: { ...process.env, OLLAMA_HOST: `127.0.0.1:${OLLAMA_PORT}` },
  });

  ollamaProcess.on("error", (err) => {
    console.error("[Ollama] Failed to start:", err.message);
    ollamaProcess = null;
  });

  ollamaProcess.on("exit", (code) => {
    console.log(`[Ollama] Exited with code ${code}`);
    ollamaProcess = null;
  });

  // Wait up to 8s for Ollama to be ready
  for (let i = 0; i < 16; i++) {
    await new Promise((r) => setTimeout(r, 500));
    if (await isOllamaRunning()) {
      console.log("[Ollama] Ready");
      return;
    }
  }

  console.warn("[Ollama] Timed out waiting for startup");
}

function stopOllama() {
  if (ollamaProcess) {
    ollamaProcess.kill();
    ollamaProcess = null;
  }
}

// ─── Window ─────────────────────────────────────────────────────────────────

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: "HIVE",
    // icon set per platform below
    icon: path.join(__dirname, "..", "public", "icon.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    backgroundColor: "#1a1a18", // matches app dark bg — prevents white flash
    show: false, // show after ready-to-show
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default",
  });

  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, "..", "dist", "index.html"));
  }

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  // Open external links in the system browser, not inside Electron
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// ─── IPC handlers ────────────────────────────────────────────────────────────

// Renderer can ask "is Ollama running?"
ipcMain.handle("ollama:status", async () => {
  return isOllamaRunning();
});

// Renderer can request Ollama restart
ipcMain.handle("ollama:restart", async () => {
  stopOllama();
  await startOllama();
  return isOllamaRunning();
});

// ─── App lifecycle ────────────────────────────────────────────────────────────

app.whenReady().then(async () => {
  await startOllama();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  stopOllama();
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  stopOllama();
});
