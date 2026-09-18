const { app, BrowserWindow, Menu, tray, ipcMain } = require("electron");
const path = require("path");
const { fork } = require("child_process");

let mainWindow;
let serverProcess;

function startServer() {
  const serverPath = path.join(__dirname, "../server/server.js");
  serverProcess = fork(serverPath, [], {
    env: { ...process.env, PORT: "3000" }
  });

  serverProcess.on("message", (msg) => {
    console.log("[Server Msg]:", msg);
  });

  serverProcess.on("error", (err) => {
    console.error("[Server Error]:", err);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 850,
    minWidth: 1024,
    minHeight: 720,
    title: "MINDORA — Microbiology Exhibition",
    icon: path.join(__dirname, "../client/public/assets/mindora-logo.png"),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // Remove default menu bar for clean app look
  Menu.setApplicationMenu(null);

  // Wait 1.5s for Express server to start listening
  setTimeout(() => {
    mainWindow.loadURL("http://localhost:3000");
  }, 1500);

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.on("ready", () => {
  startServer();
  createWindow();
});

app.on("window-all-closed", () => {
  if (serverProcess) {
    serverProcess.kill();
  }
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});
