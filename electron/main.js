// electron/main.js — HIVE desktop app entry point
const { app, BrowserWindow, shell, ipcMain, dialog } = require("electron");
const path = require("path");
const { spawn } = require("child_process");
const fs = require("fs");
const os = require("os");
const http = require("http");

const isDev = process.env.NODE_ENV === "development" || !app.isPackaged;
let mainWindow = null;
let ollamaProcess = null;

function getOllamaPath() {
  const platform = os.platform();
  if (platform === "win32") {
    const localApp = path.join(os.homedir(), "AppData", "Local", "Programs", "Ollama", "ollama.exe");
    if (fs.existsSync(localApp)) return localApp;
    return "ollama";
  }
  if (platform === "darwin") return "/usr/local/bin/ollama";
  return "ollama";
}

function checkOllamaRunning() {
  return new Promise((resolve) => {
    const req = http.get("http://localhost:11434/api/tags", (res) => {
      resolve(res.statusCode === 200);
    });
    req.on("error", () => resolve(false));
    req.setTimeout(2000, () => { req.destroy(); resolve(false); });
  });
}

async function startOllama() {
  const already = await checkOllamaRunning();
  if (already) { console.log("[HIVE] Ollama already running"); return; }
  const ollamaPath = getOllamaPath();
  console.log("[HIVE] Starting Ollama from:", ollamaPath);
  ollamaProcess = spawn(ollamaPath, ["serve"], {
    detached: false,
    stdio: "ignore",
    windowsHide: true,
  });
  ollamaProcess.on("error", (e) => console.warn("[HIVE] Ollama start failed:", e.message));
  await new Promise((r) => setTimeout(r, 2000));
}

function stopOllama() {
  if (ollamaProcess) {
    try { ollamaProcess.kill(); } catch {}
    ollamaProcess = null;
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 680,
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default",
    backgroundColor: "#0d0803",
    icon: path.join(__dirname, "icon.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http")) shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.on("closed", () => { mainWindow = null; });
}

ipcMain.handle("ollama:status", async () => await checkOllamaRunning());
ipcMain.handle("ollama:start", async () => { await startOllama(); return await checkOllamaRunning(); });

ipcMain.handle("app:export-data", async (_, jsonString) => {
  const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
    title: "Export HIVE Data",
    defaultPath: `hive-backup-${new Date().toISOString().slice(0, 10)}.json`,
    filters: [{ name: "JSON", extensions: ["json"] }],
  });
  if (canceled || !filePath) return false;
  fs.writeFileSync(filePath, jsonString, "utf8");
  return true;
});

ipcMain.handle("app:version", () => app.getVersion());

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

app.on("before-quit", () => stopOllama());