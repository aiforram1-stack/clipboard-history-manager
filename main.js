const { app, BrowserWindow, clipboard, ipcMain, Tray, Menu, nativeImage } = require('electron');
const path = require('path');
const Store = require('electron-store');

// Initialize persistent storage
const store = new Store({
  name: 'clipboard-history',
  defaults: {
    history: [],
    maxItems: 50
  }
});

let mainWindow;
let tray;
let lastClipboardText = '';
let clipboardWatcher;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 450,
    height: 700,
    minWidth: 350,
    minHeight: 400,
    frame: false,
    transparent: true,
    vibrancy: 'dark',
    backgroundColor: '#00000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    icon: path.join(__dirname, 'assets', 'icon.png')
  });

  mainWindow.loadFile('index.html');

  // Start clipboard monitoring
  startClipboardMonitoring();

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Hide to tray instead of closing (on Mac)
  mainWindow.on('close', (event) => {
    if (process.platform === 'darwin' && !app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });
}

function createTray() {
  // Create a simple tray icon
  const iconPath = path.join(__dirname, 'assets', 'icon.png');
  let trayIcon;
  
  try {
    trayIcon = nativeImage.createFromPath(iconPath);
    if (trayIcon.isEmpty()) {
      // Create a simple colored icon if file doesn't exist
      trayIcon = nativeImage.createEmpty();
    }
    trayIcon = trayIcon.resize({ width: 16, height: 16 });
  } catch (e) {
    trayIcon = nativeImage.createEmpty();
  }

  tray = new Tray(trayIcon);
  
  const contextMenu = Menu.buildFromTemplate([
    { 
      label: 'Show Window', 
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    },
    { type: 'separator' },
    { 
      label: 'Clear History', 
      click: () => {
        store.set('history', []);
        if (mainWindow) {
          mainWindow.webContents.send('history-updated', []);
        }
      }
    },
    { type: 'separator' },
    { 
      label: 'Quit', 
      click: () => {
        app.isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setToolTip('Clipboard History Manager');
  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    }
  });
}

function startClipboardMonitoring() {
  // Initialize with current clipboard content
  lastClipboardText = clipboard.readText();

  // Poll clipboard every 500ms
  clipboardWatcher = setInterval(() => {
    const currentText = clipboard.readText();
    
    // Check if clipboard content has changed and is not empty
    if (currentText && currentText !== lastClipboardText && currentText.trim() !== '') {
      lastClipboardText = currentText;
      addToHistory(currentText);
    }
  }, 500);
}

function addToHistory(text) {
  let history = store.get('history', []);
  const maxItems = store.get('maxItems', 50);

  // Check for duplicates - if text already exists, move it to top
  const existingIndex = history.findIndex(item => item.text === text);
  if (existingIndex !== -1) {
    history.splice(existingIndex, 1);
  }

  // Add new item at the beginning
  const newItem = {
    id: Date.now().toString(),
    text: text,
    timestamp: new Date().toISOString(),
    preview: text.substring(0, 100) + (text.length > 100 ? '...' : '')
  };

  history.unshift(newItem);

  // Limit history size
  if (history.length > maxItems) {
    history = history.slice(0, maxItems);
  }

  store.set('history', history);

  // Notify renderer
  if (mainWindow && mainWindow.webContents) {
    mainWindow.webContents.send('clipboard-changed', newItem);
  }
}

// IPC Handlers
ipcMain.handle('get-history', () => {
  return store.get('history', []);
});

ipcMain.handle('write-clipboard', (event, text) => {
  clipboard.writeText(text);
  lastClipboardText = text; // Prevent re-adding the same text
  return true;
});

ipcMain.handle('delete-item', (event, id) => {
  let history = store.get('history', []);
  history = history.filter(item => item.id !== id);
  store.set('history', history);
  return history;
});

ipcMain.handle('clear-history', () => {
  store.set('history', []);
  return [];
});

ipcMain.handle('window-minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.handle('window-close', () => {
  if (mainWindow) mainWindow.close();
});

// App lifecycle
app.whenReady().then(() => {
  createWindow();
  createTray();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    } else if (mainWindow) {
      mainWindow.show();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  app.isQuitting = true;
  if (clipboardWatcher) {
    clearInterval(clipboardWatcher);
  }
});
