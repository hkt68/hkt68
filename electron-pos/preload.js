// Elite Medya Bilişim POS - Preload Script
const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // App info
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getAppInfo: () => ipcRenderer.invoke('get-app-info'),

  // Dialog methods
  showMessageBox: (options) => ipcRenderer.invoke('show-message-box', options),
  showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),
  showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options),

  // Database operations
  databaseQuery: (query, params) => ipcRenderer.invoke('database-query', query, params),

  // Notifications
  showNotification: (options) => ipcRenderer.invoke('show-notification', options),

  // Navigation listeners
  onNavigate: (callback) => ipcRenderer.on('navigate-to', callback),
  onAction: (callback) => ipcRenderer.on('action', callback),
  
  // Data export/import
  onExportData: (callback) => ipcRenderer.on('export-data', callback),
  onImportData: (callback) => ipcRenderer.on('import-data', callback),

  // Remove listeners
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),

  // File system operations
  writeFile: (filePath, data) => ipcRenderer.invoke('write-file', filePath, data),
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),

  // System info
  platform: process.platform,
  
  // Custom POS methods
  pos: {
    // Customer operations
    createCustomer: (customerData) => ipcRenderer.invoke('pos-create-customer', customerData),
    getCustomers: (filters) => ipcRenderer.invoke('pos-get-customers', filters),
    updateCustomer: (id, customerData) => ipcRenderer.invoke('pos-update-customer', id, customerData),
    deleteCustomer: (id) => ipcRenderer.invoke('pos-delete-customer', id),
    getCustomerAccountSummary: (id) => ipcRenderer.invoke('pos-get-customer-account', id),

    // Payment operations
    recordPayment: (paymentData) => ipcRenderer.invoke('pos-record-payment', paymentData),
    getPayments: (filters) => ipcRenderer.invoke('pos-get-payments', filters),
    deletePayment: (id) => ipcRenderer.invoke('pos-delete-payment', id),

    // Credit operations
    addManualCredit: (customerId, creditData) => ipcRenderer.invoke('pos-add-manual-credit', customerId, creditData),
    getCreditSales: (filters) => ipcRenderer.invoke('pos-get-credit-sales', filters),
    deleteCreditSale: (id) => ipcRenderer.invoke('pos-delete-credit-sale', id),

    // Product operations
    getProducts: (filters) => ipcRenderer.invoke('pos-get-products', filters),
    createProduct: (productData) => ipcRenderer.invoke('pos-create-product', productData),
    updateProduct: (id, productData) => ipcRenderer.invoke('pos-update-product', id, productData),

    // Sales operations
    createSale: (saleData) => ipcRenderer.invoke('pos-create-sale', saleData),
    getSales: (filters) => ipcRenderer.invoke('pos-get-sales', filters),
    deleteSale: (id) => ipcRenderer.invoke('pos-delete-sale', id),

    // Backup operations
    exportBackup: () => ipcRenderer.invoke('pos-export-backup'),
    importBackup: (backupData) => ipcRenderer.invoke('pos-import-backup', backupData),

    // Reports
    getDashboardMetrics: () => ipcRenderer.invoke('pos-get-dashboard-metrics'),
    generateReport: (reportType, filters) => ipcRenderer.invoke('pos-generate-report', reportType, filters),

    // Settings
    getSettings: () => ipcRenderer.invoke('pos-get-settings'),
    updateSettings: (settings) => ipcRenderer.invoke('pos-update-settings', settings)
  }
});

// Utility functions for React app
contextBridge.exposeInMainWorld('utils', {
  formatCurrency: (amount) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(amount);
  },

  formatDate: (date) => {
    return new Intl.DateTimeFormat('tr-TR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  },

  generateId: (prefix = '') => {
    return prefix + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  },

  validateEmail: (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  },

  validatePhone: (phone) => {
    const re = /^[\+]?[0-9\s\-\(\)]{10,}$/;
    return re.test(phone.replace(/\s/g, ''));
  },

  // Local storage wrapper for settings
  storage: {
    set: (key, value) => {
      localStorage.setItem(key, JSON.stringify(value));
    },
    get: (key, defaultValue = null) => {
      try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
      } catch {
        return defaultValue;
      }
    },
    remove: (key) => {
      localStorage.removeItem(key);
    },
    clear: () => {
      localStorage.clear();
    }
  }
});

// Environment info
contextBridge.exposeInMainWorld('env', {
  isDev: process.env.NODE_ENV === 'development',
  platform: process.platform,
  arch: process.arch,
  nodeVersion: process.versions.node,
  electronVersion: process.versions.electron
});

// Console logging for development
if (process.env.NODE_ENV === 'development') {
  contextBridge.exposeInMainWorld('devLog', {
    log: (...args) => console.log('[RENDERER]', ...args),
    error: (...args) => console.error('[RENDERER]', ...args),
    warn: (...args) => console.warn('[RENDERER]', ...args)
  });
}