const { app, BrowserWindow, ipcMain, screen, Tray, Menu, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const sheetsService = require('./sheets-service');

let mainWindow;
let tray;

const DEFAULT_SPREADSHEET_IDS = {
    "2026": "1FZiIyewRin7UHsOb_WkdovSyZSveYMZP9XYwHKq2Jwc",
    "2027": "19aBVCorFXmE_ZCyLssIG6yQBIr8wgyy1DakMQFy792I",
    "2028": "1z5_xUwcy-ZnPqYSmPK8NNqqqAdsD8O7d3K-jJxCDNbk",
    "2029": "1w4QiZkGsjCdmHtEQa40ulH55dj6E16Yz9ZlEL837Ivw",
    "2030": "1lmHIpeoC5xanoeAAOzsYCNCqBrWgCAAjTaP4Z8CBI3c",
    "2031": "1Vla6YpT8KlI3oUmv5Uyd_qpuLAr9jPPCc8C_QkqXRAg",
    "2032": "1HmxI2GRkhbIMYSEh4beC0__IL6cfI7bV3yreEsAVCJY",
    "2033": "1nZbFZg72HBkYw1GFF2tupkhLHeYoCcVP4jZj_RWpHjY",
    "2034": "1aCcz-XxNh59bC-QoXwcRQGHbSU2VP22_2Sm9dWQamkE",
    "2035": "18OYbuaQs0CddLlnrgGBx-Tq9mXfTe1s2njl1LT1wFaM",
    "2036": "1-UO_ThZC9NEWz7HDDp7Br1jqRKEavr-6mw6WptUkBqk",
    "2037": "10ZebJYWrPT_M7_plDHZz2sYo6ph5kw9spxkiqN1aknE",
    "2038": "16RhTLLB-XrtCV6TsELezKkBsUqGlLvj22EINVajTQMk",
    "2039": "1VDJQw4ig0H835repZson7XCGsJHpo8OMJVBkYW-sfq8",
    "2040": "1gT6Cu0-Y9B6A2HBWoMIsLBGdByj_2lHeKZrjbT48qEY"
};

function getCredentialsPath() {
    const credsDir = path.join(__dirname, 'credentials');
    if (!fs.existsSync(credsDir)) {
        try { fs.mkdirSync(credsDir, { recursive: true }); } catch (e) {}
        return null;
    }
    const files = fs.readdirSync(credsDir);
    const jsonFile = files.find(f => f.endsWith('.json'));
    return jsonFile ? path.join(credsDir, jsonFile) : null;
}

function getConfigPath() {
    return path.join(app.getPath('userData'), 'config.json');
}

function getSettings() {
    const currentYear = new Date().getFullYear().toString();
    
    // Prepare base configuration with hardcoded default spreadsheet IDs
    const defaultYearsConfig = {};
    for (const [year, id] of Object.entries(DEFAULT_SPREADSHEET_IDS)) {
        defaultYearsConfig[year] = { spreadsheetId: id };
    }

    let parsed = {
        activeYear: currentYear,
        lastAutoBumpYear: currentYear,
        years: defaultYearsConfig
    };

    try {
        const configPath = getConfigPath();
        if (fs.existsSync(configPath)) {
            const data = fs.readFileSync(configPath, 'utf8');
            const userParsed = JSON.parse(data);
            
            // Migrate from old structure if necessary
            if (userParsed.spreadsheetId && !userParsed.years) {
                userParsed.years = {
                    [currentYear]: { spreadsheetId: userParsed.spreadsheetId }
                };
            }
            
            // Auto-bump activeYear when a new year arrives
            if (userParsed.lastAutoBumpYear !== currentYear) {
                userParsed.activeYear = currentYear;
                userParsed.lastAutoBumpYear = currentYear;
            }

            // Merge user settings: overrides the hardcoded defaults only if user provided a custom ID
            parsed.activeYear = userParsed.activeYear || currentYear;
            parsed.lastAutoBumpYear = userParsed.lastAutoBumpYear || currentYear;
            
            if (userParsed.years) {
                for (const [year, config] of Object.entries(userParsed.years)) {
                    if (config && config.spreadsheetId && config.spreadsheetId.trim() !== '') {
                        // User customized this year's spreadsheet
                        parsed.years[year] = { spreadsheetId: config.spreadsheetId };
                    }
                }
            }

            // Save merged config back so the file stays updated with defaults
            fs.writeFileSync(configPath, JSON.stringify(parsed, null, 2), 'utf8');
            return parsed;
        } else {
            // First time running, save defaults
            fs.writeFileSync(configPath, JSON.stringify(parsed, null, 2), 'utf8');
        }
    } catch (e) {
        console.error('Failed to read config', e);
    }
    
    return parsed;
}

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
            const settings = getSettings();
            const credPath = getCredentialsPath();
            if (!credPath) throw new Error("File JSON tidak ditemukan di folder app/credentials");
            
            const activeYear = settings.activeYear || new Date().getFullYear().toString();
            const activeConfig = settings.years ? settings.years[activeYear] : null;
            
            if (!activeConfig || !activeConfig.spreadsheetId) {
                return { success: false, error: "Spreadsheet ID tahun " + activeYear + " masih kosong." };
            }

            await sheetsService.init(credPath, activeConfig.spreadsheetId);
            return { success: true };
        } catch (err) {
            console.error('Sheets init error:', err);
            return { success: false, error: err.message };
        }
    });

    ipcMain.handle('settings:get', () => {
        return getSettings();
    });

    ipcMain.handle('settings:save', async (_, { year, spreadsheetId }) => {
        try {
            const settings = getSettings();
            if (!settings.years) settings.years = {};
            settings.years[year] = { spreadsheetId };
            settings.activeYear = year; // Set active year
            fs.writeFileSync(getConfigPath(), JSON.stringify(settings, null, 2), 'utf8');
            return { success: true };
        } catch (err) {
            console.error('Settings save error:', err);
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
        mainWindow.close();
    });

    ipcMain.on('open-url', (_, url) => {
        shell.openExternal(url);
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
