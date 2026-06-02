const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { exec } = require('child_process');

// Determine if we are running in dev mode
const isDev = process.env.NODE_ENV === 'development';

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC handler to execute PowerShell commands silently
ipcMain.handle('execute-ps', async (event, command) => {
  return new Promise((resolve, reject) => {
    // Run PowerShell command hidden, without flashing a window
    exec(`powershell.exe -Command "${command.replace(/"/g, '\\"')}"`, {
      windowsHide: true
    }, (error, stdout, stderr) => {
      if (error) {
        console.error(`Exec error: ${error}`);
        resolve({ error: error.message, stdout: '', stderr: stderr });
      } else {
        resolve({ error: null, stdout: stdout, stderr: stderr });
      }
    });
  });
});
