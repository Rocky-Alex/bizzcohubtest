const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  executePowerShell: (command) => ipcRenderer.invoke('execute-ps', command)
});
