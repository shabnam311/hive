// electron/preload.js
// Secure bridge — exposes only what the renderer needs, nothing else.
// contextIsolation: true means the renderer cannot access Node.js directly.

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electron", {
  // Check if Ollama is running (asks main process)
  ollamaStatus: () => ipcRenderer.invoke("ollama:status"),

  // Ask main process to restart Ollama
  ollamaRestart: () => ipcRenderer.invoke("ollama:restart"),

  // Platform info — useful for showing OS-specific instructions
  platform: process.platform, // 'win32' | 'darwin' | 'linux'

  // Whether we're running inside Electron at all
  isElectron: true,
});
