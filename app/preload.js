const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    // Google Sheets operations
    initSheets: () => ipcRenderer.invoke('sheets:init'),
    getData: () => ipcRenderer.invoke('sheets:getData'),
    getNextNumber: (jenisSurat) => ipcRenderer.invoke('sheets:getNextNumber', jenisSurat),
    appendEntry: (entry) => ipcRenderer.invoke('sheets:appendEntry', entry),
    updateStatus: (rowIndex, status) => ipcRenderer.invoke('sheets:updateStatus', rowIndex, status),

    // Window controls
    minimizeWindow: () => ipcRenderer.send('window:minimize'),
    closeWindow: () => ipcRenderer.send('window:close'),
});
