// Elite Medya Bilişim POS - Electron Main Process
const { app, BrowserWindow, Menu, Tray, ipcMain, dialog } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development';

// SQLite database için (Windows'da çalışacak)
let Database;
try {
  Database = require('./database/database');
} catch (error) {
  console.log('Database module will be loaded on Windows');
}

let mainWindow;
let tray = null;

// App event handlers
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Create main window
function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'assets', 'icon.png'),
    title: 'Elite Medya Bilişim POS',
    show: false // Don't show until ready
  });

  // Load the app
  const startUrl = isDev 
    ? 'http://localhost:3000' 
    : `file://${path.join(__dirname, 'renderer/build/index.html')}`;
  
  mainWindow.loadURL(startUrl);

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Minimize to tray instead of closing
  mainWindow.on('close', (event) => {
    if (!app.isQuiting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  // Create system tray
  createTray();

  // Create menu
  createMenu();
}

// Create system tray
function createTray() {
  tray = new Tray(path.join(__dirname, 'assets', 'icon.png'));
  
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Elite Medya POS\'u Aç',
      click: () => {
        mainWindow.show();
      }
    },
    {
      label: 'Yeni Satış',
      click: () => {
        mainWindow.show();
        mainWindow.webContents.send('navigate-to', '/sales');
      }
    },
    {
      label: 'Müşteriler',
      click: () => {
        mainWindow.show();
        mainWindow.webContents.send('navigate-to', '/customers');
      }
    },
    { type: 'separator' },
    {
      label: 'Yedek Al',
      click: () => {
        exportData();
      }
    },
    { type: 'separator' },
    {
      label: 'Çıkış',
      click: () => {
        app.isQuiting = true;
        app.quit();
      }
    }
  ]);

  tray.setToolTip('Elite Medya Bilişim POS');
  tray.setContextMenu(contextMenu);
  
  // Double click to open
  tray.on('double-click', () => {
    mainWindow.show();
  });
}

// Create application menu
function createMenu() {
  const template = [
    {
      label: 'Dosya',
      submenu: [
        {
          label: 'Yeni Müşteri',
          accelerator: 'Ctrl+N',
          click: () => {
            mainWindow.webContents.send('action', 'new-customer');
          }
        },
        {
          label: 'Yeni Satış',
          accelerator: 'Ctrl+S',
          click: () => {
            mainWindow.webContents.send('navigate-to', '/sales');
          }
        },
        { type: 'separator' },
        {
          label: 'Yedek Al',
          accelerator: 'Ctrl+B',
          click: exportData
        },
        {
          label: 'Yedek Geri Yükle',
          accelerator: 'Ctrl+R',
          click: importData
        },
        { type: 'separator' },
        {
          label: 'Çıkış',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.isQuiting = true;
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Düzenle',
      submenu: [
        { label: 'Geri Al', accelerator: 'Ctrl+Z', role: 'undo' },
        { label: 'Yinele', accelerator: 'Shift+Ctrl+Z', role: 'redo' },
        { type: 'separator' },
        { label: 'Kes', accelerator: 'Ctrl+X', role: 'cut' },
        { label: 'Kopyala', accelerator: 'Ctrl+C', role: 'copy' },
        { label: 'Yapıştır', accelerator: 'Ctrl+V', role: 'paste' }
      ]
    },
    {
      label: 'Görünüm',
      submenu: [
        { label: 'Yeniden Yükle', accelerator: 'Ctrl+R', role: 'reload' },
        { label: 'Geliştirici Araçları', accelerator: 'F12', role: 'toggledevtools' },
        { type: 'separator' },
        { label: 'Yakınlaştır', accelerator: 'Ctrl+=', role: 'zoomin' },
        { label: 'Uzaklaştır', accelerator: 'Ctrl+-', role: 'zoomout' },
        { label: 'Gerçek Boyut', accelerator: 'Ctrl+0', role: 'resetzoom' },
        { type: 'separator' },
        { label: 'Tam Ekran', accelerator: 'F11', role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Raporlar',
      submenu: [
        {
          label: 'Günlük Satış Raporu',
          click: () => {
            mainWindow.webContents.send('action', 'daily-report');
          }
        },
        {
          label: 'Müşteri Borç Raporu',
          click: () => {
            mainWindow.webContents.send('action', 'debt-report');
          }
        },
        {
          label: 'Stok Raporu',
          click: () => {
            mainWindow.webContents.send('action', 'stock-report');
          }
        }
      ]
    },
    {
      label: 'Yardım',
      submenu: [
        {
          label: 'Kullanım Kılavuzu',
          click: () => {
            // Open help dialog or external link
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'Elite Medya POS - Yardım',
              message: 'Elite Medya Bilişim POS Sistemi v1.0\n\nKullanım için:\n• F1: Yardım\n• Ctrl+N: Yeni Müşteri\n• Ctrl+S: Yeni Satış\n• F11: Tam Ekran',
              buttons: ['Tamam']
            });
          }
        },
        {
          label: 'Hakkında',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'Hakkında',
              message: `Elite Medya Bilişim POS Sistemi\nVersiyon: 1.0.0\n\n© 2024 Elite Medya Bilişim\nTüm hakları saklıdır.`,
              buttons: ['Tamam']
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// Export data function
async function exportData() {
  try {
    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'Yedek Dosyası Kaydet',
      defaultPath: `elite-pos-backup-${new Date().toISOString().split('T')[0]}.json`,
      filters: [
        { name: 'JSON Dosyası', extensions: ['json'] }
      ]
    });

    if (!result.canceled) {
      mainWindow.webContents.send('export-data', result.filePath);
    }
  } catch (error) {
    console.error('Export error:', error);
  }
}

// Import data function
async function importData() {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Yedek Dosyası Seç',
      filters: [
        { name: 'JSON Dosyası', extensions: ['json'] }
      ],
      properties: ['openFile']
    });

    if (!result.canceled && result.filePaths.length > 0) {
      mainWindow.webContents.send('import-data', result.filePaths[0]);
    }
  } catch (error) {
    console.error('Import error:', error);
  }
}

// IPC handlers
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('show-message-box', async (event, options) => {
  const result = await dialog.showMessageBox(mainWindow, options);
  return result;
});

ipcMain.handle('show-save-dialog', async (event, options) => {
  const result = await dialog.showSaveDialog(mainWindow, options);
  return result;
});

ipcMain.handle('show-open-dialog', async (event, options) => {
  const result = await dialog.showOpenDialog(mainWindow, options);
  return result;
});

// Database operations (will be implemented with SQLite)
ipcMain.handle('database-query', async (event, query, params) => {
  try {
    if (Database) {
      return await Database.query(query, params);
    } else {
      throw new Error('Database not available');
    }
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
});

// Notification
ipcMain.handle('show-notification', (event, options) => {
  const { Notification } = require('electron');
  
  if (Notification.isSupported()) {
    const notification = new Notification({
      title: options.title || 'Elite Medya POS',
      body: options.body || '',
      icon: path.join(__dirname, 'assets', 'icon.png')
    });
    
    notification.show();
    return true;
  }
  return false;
});

// App info
ipcMain.handle('get-app-info', () => {
  return {
    name: app.getName(),
    version: app.getVersion(),
    platform: process.platform,
    arch: process.arch
  };
});