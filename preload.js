const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
    // Clipboard operations
    getHistory: () => ipcRenderer.invoke('get-history'),
    writeClipboard: (text) => ipcRenderer.invoke('write-clipboard', text),
    deleteItem: (id) => ipcRenderer.invoke('delete-item', id),
    clearHistory: () => ipcRenderer.invoke('clear-history'),

    // Window controls
    minimizeWindow: () => ipcRenderer.invoke('window-minimize'),
    closeWindow: () => ipcRenderer.invoke('window-close'),

    // Event listeners
    onClipboardChanged: (callback) => {
        ipcRenderer.on('clipboard-changed', (event, item) => callback(item));
    },
    onHistoryUpdated: (callback) => {
        ipcRenderer.on('history-updated', (event, history) => callback(history));
    }
});
