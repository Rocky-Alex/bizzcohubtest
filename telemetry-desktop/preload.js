const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  executePowerShell: (command) => ipcRenderer.invoke('execute-ps', command),
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  downloadUpdate: (url) => ipcRenderer.invoke('download-update', url),
  installUpdate: (tempFile) => ipcRenderer.invoke('install-update', tempFile),
  onDownloadProgress: (callback) => ipcRenderer.on('download-progress', (event, value) => callback(value)),
  removeDownloadProgress: () => ipcRenderer.removeAllListeners('download-progress')
});
