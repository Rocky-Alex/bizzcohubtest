const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  executePowerShell: (command) => ipcRenderer.invoke('execute-ps', command),
  downloadUpdate: (url) => ipcRenderer.invoke('download-update', url),
  installUpdate: (tempFile) => ipcRenderer.invoke('install-update', tempFile)
});
