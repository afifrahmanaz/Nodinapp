const { app, BrowserWindow, ipcMain, screen, Tray, Menu } = require('electron');
const path = require('path');
const sheetsService = require('./sheets-service');

let mainWindow;
let tray;

// Spreadsheet config
const SPREADSHEET_ID = '1FZiIyewRin7UHsOb_WkdovSyZSveYMZP9XYwHKq2Jwc';
const SHEET_NAME = 'NodinLK Lantaskim 2026';
const CREDENTIALS_PATH = path.join(__dirname, 'credentials', 'nodinapp-3aead65d0a22.json');

function createWindow() {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;

    mainWindow = new BrowserWindow({
        width: 300,
        height: 340,
        x: width - 315,
        y: height - 355,
        icon: path.join(__dirname, 'public', 'Logo Nodin app cropped.png'),
        frame: false,
        transparent: false,
        backgroundColor: '#f8f9fb',
        alwaysOnTop: true,
        resizable: false,
        skipTaskbar: false,
        show: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
        },
    });

    mainWindow.loadFile(path.join(__dirname, 'index.html'));

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

function createTray() {
    tray = new Tray(path.join(__dirname, 'public', 'Logo Nodin app cropped.png'));
    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Tampilkan Widget',
            click: () => {
                if (mainWindow) {
                    mainWindow.show();
                    mainWindow.focus();
                }
            },
        },
        {
            label: 'Sembunyikan',
            click: () => {
                if (mainWindow) mainWindow.hide();
            },
        },
        { type: 'separator' },
        {
            label: 'Keluar',
            click: () => {
                app.quit();
            },
        },
    ]);
    tray.setToolTip('Nodin Widget - Lantaskim');
    tray.setContextMenu(contextMenu);
    tray.on('click', () => {
        if (mainWindow) {
            mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
        }
    });
}

function registerIpcHandlers() {
    ipcMain.handle('sheets:init', async () => {
        try {
            await sheetsService.init(CREDENTIALS_PATH, SPREADSHEET_ID, SHEET_NAME);
            return { success: true };
        } catch (err) {
            console.error('Sheets init error:', err);
            return { success: false, error: err.message };
        }
    });

    ipcMain.handle('sheets:getData', async () => {
        try {
            const data = await sheetsService.readAllData();
            return { success: true, data };
        } catch (err) {
            console.error('Sheets read error:', err);
            return { success: false, error: err.message };
        }
    });

    ipcMain.handle('sheets:getNextNumber', async (_, jenisSurat) => {
        try {
            const number = await sheetsService.getNextNumber(jenisSurat);
            return { success: true, number };
        } catch (err) {
            console.error('Get next number error:', err);
            return { success: false, error: err.message };
        }
    });

    ipcMain.handle('sheets:appendEntry', async (_, entry) => {
        try {
            const result = await sheetsService.appendEntry(entry);
            return { success: true, result };
        } catch (err) {
            console.error('Append entry error:', err);
            return { success: false, error: err.message };
        }
    });

    ipcMain.handle('sheets:updateStatus', async (_, rowIndex, status) => {
        try {
            await sheetsService.updateStatus(rowIndex, status);
            return { success: true };
        } catch (err) {
            console.error('Update status error:', err);
            return { success: false, error: err.message };
        }
    });

    ipcMain.on('window:minimize', () => {
        if (mainWindow) mainWindow.hide();
    });

    ipcMain.on('window:close', () => {
        app.quit();
    });
}

app.whenReady().then(() => {
    registerIpcHandlers();
    createWindow();
    createTray();

    // Mengatur aplikasi agar otomatis berjalan saat komputer dihidupkan
    if (app.isPackaged) {
        app.setLoginItemSettings({
            openAtLogin: true,
            path: app.getPath('exe'),
        });
    }
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
