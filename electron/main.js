// electron/main.js - Electron Main Process
const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const isDev = process.env.NODE_ENV === 'development';

let mainWindow = null;
let nextServer = null;

// Create the main application window
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    icon: path.join(__dirname, '../public/revlo-logo.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      sandbox: true,
    },
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    show: false, // Don't show until ready
  });

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    // Focus on window
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
  });

  // Load the application
  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
  } else {
    // In production, load from local server
    mainWindow.loadURL('http://localhost:3000');
  }

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

// Start Next.js server in production
function startNextServer() {
  if (isDev) {
    // In development, Next.js dev server runs separately
    return;
  }

  // For standalone mode, server.js is in .next/standalone
  const standalonePath = path.join(__dirname, '../.next/standalone');
  const serverPath = path.join(standalonePath, 'server.js');
  
  // Check if standalone exists, otherwise use root server.js
  const fs = require('fs');
  const actualServerPath = fs.existsSync(serverPath) 
    ? serverPath 
    : path.join(__dirname, '../server.js');
  
  // Start Next.js standalone server
  nextServer = spawn('node', [actualServerPath], {
    cwd: fs.existsSync(standalonePath) ? standalonePath : path.join(__dirname, '..'),
    env: { 
      ...process.env, 
      PORT: '3000',
      NODE_ENV: 'production'
    },
  });

  nextServer.stdout.on('data', (data) => {
    console.log(`Next.js: ${data}`);
  });

  nextServer.stderr.on('data', (data) => {
    console.error(`Next.js Error: ${data}`);
  });

  nextServer.on('close', (code) => {
    console.log(`Next.js server exited with code ${code}`);
  });
}

// App event handlers
app.whenReady().then(() => {
  if (!isDev) {
    startNextServer();
    // Wait a bit for server to start
    setTimeout(() => {
      createWindow();
    }, 2000);
  } else {
    createWindow();
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (nextServer) {
    nextServer.kill();
  }
  
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (nextServer) {
    nextServer.kill();
  }
});

// IPC Handlers for offline/online sync
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('check-online-status', () => {
  return mainWindow?.webContents.send('online-status', navigator.onLine);
});

// Handle file operations
ipcMain.handle('show-save-dialog', async (event, options) => {
  const result = await dialog.showSaveDialog(mainWindow, options);
  return result;
});

ipcMain.handle('show-open-dialog', async (event, options) => {
  const result = await dialog.showOpenDialog(mainWindow, options);
  return result;
});

// Auto-updater (can be implemented later)
// ipcMain.handle('check-for-updates', async () => {
//   // Implement auto-update logic here
// });

