// electron/preload.js — secure bridge between renderer and Node.js
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("hive", {
  ollama: {
    status: () => ipcRenderer.invoke("ollama:status"),
    start: () => ipcRenderer.invoke("ollama:start"),
  },
  app: {
    exportData: (jsonString) => ipcRenderer.invoke("app:export-data", jsonString),
    version: () => ipcRenderer.invoke("app:version"),
    isElectron: true,
  },
});