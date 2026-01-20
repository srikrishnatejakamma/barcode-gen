// electron-main.js
const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');
const { fork } = require('child_process');

let mainWindow;
let serverProcess;
const DEFAULT_PORT = process.env.PORT || 3000;

function createWindow(url) {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.loadURL(url);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function startServerAndOpen() {
  const serverPath = path.join(__dirname, 'server.js');
  serverProcess = fork(serverPath, {
    env: { ...process.env, NODE_ENV: process.env.NODE_ENV || 'production' },
    stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
  });

  serverProcess.stdout?.on('data', (d) => console.log(`[server] ${d.toString()}`));
  serverProcess.stderr?.on('data', (d) => console.error(`[server] ${d.toString()}`));

  serverProcess.on('message', (msg) => {
    if (msg && msg.type === 'ready') {
      const url = `http://localhost:${msg.port || DEFAULT_PORT}`;
      createWindow(url);
    }
  });

  serverProcess.on('exit', (code, signal) => {
    console.log(`Server process exited: code=${code} signal=${signal}`);
    if (!app.isQuiting) {
      dialog.showErrorBox('Server stopped', 'The embedded server stopped unexpectedly. The application will quit.');
      app.quit();
    }
  });
}

app.whenReady().then(() => {
  startServerAndOpen();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0 && !mainWindow) {
      startServerAndOpen();
    }
  });
});

app.on('window-all-closed', () => {
  // On macOS apps often stay active until explicitly quit; we'll quit on all platforms here.
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  app.isQuiting = true;
  if (serverProcess && !serverProcess.killed) {
    serverProcess.kill();
  }
});