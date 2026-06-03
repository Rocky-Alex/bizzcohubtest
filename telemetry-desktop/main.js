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

// IPC handler to safely download updates silently without executing them yet
ipcMain.handle('download-update', async (event, url) => {
  return new Promise((resolve) => {
    if (!url) {
      resolve({ success: false, error: "No URL provided" });
      return;
    }
    const tempFile = path.join(os.tmpdir(), 'BizzCoUpdate.exe');
    
    const file = fs.createWriteStream(tempFile);
    
    const startDownload = (downloadUrl) => {
      https.get(downloadUrl, (response) => {
        // Handle redirects
        if (response.statusCode === 301 || response.statusCode === 302) {
           startDownload(response.headers.location);
           return;
        }

        const totalBytes = parseInt(response.headers['content-length'], 10);
        let downloadedBytes = 0;

        response.on('data', (chunk) => {
          downloadedBytes += chunk.length;
          if (totalBytes) {
            const percentage = Math.round((downloadedBytes / totalBytes) * 100);
            event.sender.send('download-progress', percentage);
          }
        });

        response.pipe(file);
        file.on('finish', () => {
          file.close(() => {
            resolve({ success: true, tempFile: tempFile });
          });
        });
      }).on('error', (err) => {
        fs.unlink(tempFile, () => {});
        resolve({ success: false, error: err.message });
      });
    };
    
    startDownload(url);
  });
});

// IPC handler to install the previously downloaded update and restart the app
ipcMain.handle('install-update', async (event, tempFile) => {
  return new Promise((resolve) => {
    if (!fs.existsSync(tempFile)) {
      resolve({ success: false, error: "Update file not found on disk" });
      return;
    }
    const psCommand = `Start-Sleep -Seconds 2; Start-Process -FilePath '${tempFile}' -ArgumentList '/S' -Wait; Start-Process -FilePath '${process.execPath}'`;
    const { spawn } = require('child_process');
    const child = spawn('powershell.exe', ['-Command', psCommand], {
      detached: true,
      windowsHide: true,
      stdio: 'ignore'
    });
    child.unref();
    setTimeout(() => { app.quit(); }, 500);
    resolve({ success: true });
  });
});
