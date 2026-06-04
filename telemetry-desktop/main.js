const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { exec } = require('child_process');
const https = require('https');
const fs = require('fs');
const os = require('os');

// Determine if we are running in dev mode
const isDev = process.env.NODE_ENV === 'development';

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  mainWindow.maximize();

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

const { autoUpdater } = require('electron-updater');

autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = false;

// Pipe the updater's download-progress event to the frontend
autoUpdater.on('download-progress', (progressObj) => {
  const percentage = Math.round(progressObj.percent);
  BrowserWindow.getAllWindows().forEach(win => {
    win.webContents.send('download-progress', percentage);
  });
});

// IPC handler to check for updates using autoUpdater
ipcMain.handle('check-for-updates', async () => {
  try {
    const result = await autoUpdater.checkForUpdates();
    if (result && result.updateInfo) {
      return {
        version: result.updateInfo.version,
        releaseNotes: result.updateInfo.releaseNotes || 'A new update is ready to be installed via Delta-Update.',
      };
    }
    if (isDev) {
      return { version: '1.0.3-dev', releaseNotes: 'Dev Mode Mock Update' };
    }
    return null;
  } catch (err) {
    console.error("Update check failed:", err);
    if (isDev) {
      return { version: '1.0.3-dev-fallback', releaseNotes: 'Dev Mode Fallback Update (Visual Test)' };
    }
    return null;
  }
});

// IPC handler to download updates silently using delta-updates
ipcMain.handle('download-update', async () => {
  return new Promise((resolve) => {
    autoUpdater.downloadUpdate().catch(err => {
      // If we are testing visually in dev mode, electron-updater will throw
      if (isDev && (err.message.includes("Update info is not set") || err.message.includes("Please check update first"))) {
        let progress = 0;
        const interval = setInterval(() => {
          progress += 5;
          BrowserWindow.getAllWindows().forEach(win => win.webContents.send('download-progress', progress));
          if (progress >= 100) {
            clearInterval(interval);
            resolve({ success: true, tempFile: 'dev-mock-update' });
          }
        }, 100);
        return;
      }
      resolve({ success: false, error: err.message });
    });
    
    autoUpdater.once('update-downloaded', () => {
      // The update is successfully downloaded in the background
      resolve({ success: true, tempFile: 'electron-updater-managed' });
    });
  });
});

// IPC handler to install the previously downloaded update
ipcMain.handle('install-update', async () => {
  // isSilent = false (we want it to be reliable), isForceRunAfter = true
  autoUpdater.quitAndInstall(false, true);
  return { success: true };
});
