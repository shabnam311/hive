const { app, BrowserWindow, shell, ipcMain, dialog } = require("electron");
const path = require("path");
const { spawn } = require("child_process");
const fs = require("fs");
const http = require("http");

const isDev = !app.isPackaged;
let mainWindow = null;
let ollamaProcess = null;

function getOllamaPath() {
  if (process.platform === "win32") {
    const candidates = [
      path.join(process.env.LOCALAPPDATA || "", "Programs", "Ollama", "ollama.exe"),
      path.join(process.env.ProgramFiles || "", "Ollama", "ollama.exe"),
    ];
    return candidates.find((p) => { try { return fs.existsSync(p); } catch { return false; } }) ?? "ollama";
  }
  if (process.platform === "darwin") {
    return ["/usr/local/bin/ollama", "/opt/homebrew/bin/ollama"]
      .find((p) => fs.existsSync(p)) ?? "ollama";
  }
  return "/usr/local/bin/ollama";
}

function isOllamaRunning() {
  return new Promise((resolve) => {
    const req = http.get("http://localhost:11434/api/tags", (res) => {
      resolve(res.statusCode === 200);
    });
    req.on("error", () => resolve(false));
    req.setTimeout(2000, () => { req.destroy(); resolve(false); });
  });
}

async function startOllama() {
  if (await isOllamaRunning()) return;
  const ollamaPath = getOllamaPath();
  ollamaProcess = spawn(ollamaPath, ["serve"], {
    detached: false,
    stdio: "ignore",
    windowsHide: true,
  });
  ollamaProcess.on("error", () => { ollamaProcess = null; });
  ollamaProcess.on("exit", () => { ollamaProcess = null; });
  for (let i = 0; i < 16; i++) {
    await new Promise((r) => setTimeout(r, 500));
    if (await isOllamaRunning()) return;
  }
}

function stopOllama() {
  if (ollamaProcess) { try { ollamaProcess.kill(); } catch {} ollamaProcess = null; }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: "HIVE",
    icon: path.join(__dirname, "..", "public", "icon.ico"),
    backgroundColor: "#0d0903",
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webSecurity: false,
    },
  });

  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools();
  } else {
    // loadFile handles relative asset paths correctly for packaged apps
    const indexPath = path.join(app.getAppPath(), "dist", "index.html");
    mainWindow.loadFile(indexPath);
  }

  mainWindow.once("ready-to-show", () => { mainWindow.show(); });

  mainWindow.webContents.on("did-fail-load", (_e, code, desc, url) => {
    console.error("[HIVE] Load failed:", code, desc, url);
    if (!isDev) {
      setTimeout(() => {
        const indexPath = path.join(app.getAppPath(), "dist", "index.html");
        mainWindow && mainWindow.loadFile(indexPath);
      }, 1000);
    }
  });

  mainWindow.webContents.on("will-navigate", (event, url) => {
    if (!url.startsWith("file://") && !url.startsWith("http://localhost")) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.on("closed", () => { mainWindow = null; });
}

ipcMain.handle("ollama:status", () => isOllamaRunning());
ipcMain.handle("ollama:restart", async () => {
  stopOllama();
  await startOllama();
  return isOllamaRunning();
});
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
  startOllama().catch(() => {});
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