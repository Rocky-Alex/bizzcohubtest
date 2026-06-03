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

// IPC handler to download and install updates silently
ipcMain.handle('update-app', async () => {
  return new Promise((resolve) => {
    const url = 'https://bizzcohubtest.netlify.app/BizzCo-Telemetry-Setup.exe';
    const tempFile = path.join(os.tmpdir(), 'BizzCoUpdate.exe');
    
    const file = fs.createWriteStream(tempFile);
    https.get(url, (response) => {
      // Check for redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
         https.get(response.headers.location, (res) => {
            res.pipe(file);
            file.on('finish', () => {
              file.close(() => {
                exec(`"${tempFile}" /S`);
                setTimeout(() => { app.quit(); }, 1500);
                resolve({ success: true });
              });
            });
         }).on('error', (err) => {
            resolve({ success: false, error: err.message });
         });
         return;
      }

      response.pipe(file);
      file.on('finish', () => {
        file.close(() => {
          exec(`"${tempFile}" /S`);
          setTimeout(() => { app.quit(); }, 1500);
          resolve({ success: true });
        });
      });
    }).on('error', (err) => {
      fs.unlink(tempFile, () => {});
      resolve({ success: false, error: err.message });
    });
  });
});
