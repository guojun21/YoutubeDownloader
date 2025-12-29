"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const child_process_1 = require("child_process");
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
let mainWindow = null;
let backendProcess = null;
const BACKEND_PORT = 5123;
function getDotnetPath() {
    // Prefer a user-local installation to avoid requiring admin rights.
    // dotnet-install.sh defaults to ~/.dotnet/dotnet on macOS/Linux.
    const userDotnet = path_1.default.join(os_1.default.homedir(), '.dotnet', 'dotnet');
    return userDotnet;
}
function createWindow() {
    mainWindow = new electron_1.BrowserWindow({
        width: 900,
        height: 700,
        minWidth: 700,
        minHeight: 500,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path_1.default.join(__dirname, 'preload.js'),
        },
        titleBarStyle: 'hiddenInset',
        backgroundColor: '#1a1a2e',
    });
    if (process.env.VITE_DEV_SERVER_URL) {
        mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
        mainWindow.webContents.openDevTools();
    }
    else {
        mainWindow.loadFile(path_1.default.join(__dirname, '../dist/index.html'));
    }
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}
function startBackend() {
    const backendPath = path_1.default.join(__dirname, '../../YoutubeDownloader.Api');
    const dotnet = getDotnetPath();
    backendProcess = (0, child_process_1.spawn)(dotnet, ['run', '--project', backendPath], {
        env: {
            ...process.env,
            ASPNETCORE_URLS: `http://localhost:${BACKEND_PORT}`,
        },
    });
    backendProcess.stdout?.on('data', (data) => {
        console.log(`Backend: ${data}`);
    });
    backendProcess.stderr?.on('data', (data) => {
        console.error(`Backend Error: ${data}`);
    });
}
function stopBackend() {
    if (backendProcess) {
        backendProcess.kill();
        backendProcess = null;
    }
}
electron_1.app.whenReady().then(() => {
    startBackend();
    // Wait a bit for backend to start
    setTimeout(createWindow, 2000);
    electron_1.app.on('activate', () => {
        if (electron_1.BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});
electron_1.app.on('window-all-closed', () => {
    stopBackend();
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
electron_1.app.on('quit', () => {
    stopBackend();
});
// IPC handlers
electron_1.ipcMain.handle('get-backend-url', () => {
    return `http://localhost:${BACKEND_PORT}`;
});
