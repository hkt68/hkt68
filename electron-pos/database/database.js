// Elite Medya Bilişim POS - SQLite Database Handler
const path = require('path');
const fs = require('fs');
const { app } = require('electron');

let sqlite3;
try {
  sqlite3 = require('sqlite3').verbose();
} catch (error) {
  console.log('SQLite3 will be available when app is packaged');
}

class Database {
  constructor() {
    this.db = null;
    this.dbPath = null;
  }

  // Initialize database
  async initialize() {
    try {
      // Database file path (in user data directory)
      const userDataPath = app.getPath('userData');
      this.dbPath = path.join(userDataPath, 'elite-pos.db');
      
      console.log('Database path:', this.dbPath);
      
      // Create database connection
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          console.error('Database connection error:', err.message);
          throw err;
        }
        console.log('Connected to SQLite database');
      });

      // Create tables
      await this.createTables();
      
      // Insert sample data if database is empty
      await this.insertSampleData();
      
      return true;
    } catch (error) {
      console.error('Database initialization error:', error);
      throw error;
    }
  }

  // Create database tables
  async createTables() {
    const tables = [
      // Customers table
      `CREATE TABLE IF NOT EXISTS customers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT,
        email TEXT,
        address TEXT,
        tax_number TEXT,
        credit_limit REAL DEFAULT 5000.0,
        notes TEXT,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Products table
      `CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        sku TEXT UNIQUE,
        barcode TEXT UNIQUE,
        category_id TEXT,
        cost_price REAL DEFAULT 0.0,
        selling_price REAL NOT NULL,
        stock_quantity INTEGER DEFAULT 0,
        min_stock_level INTEGER DEFAULT 5,
        max_stock_level INTEGER DEFAULT 1000,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Categories table
      `CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Credit sales table (Cari hesap)
      `CREATE TABLE IF NOT EXISTS credit_sales (
        id TEXT PRIMARY KEY,
        customer_id TEXT NOT NULL,
        total_amount REAL NOT NULL,
        paid_amount REAL DEFAULT 0.0,
        remaining_amount REAL NOT NULL,
        due_date DATE,
        payment_status TEXT DEFAULT 'unpaid',
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers(id)
      )`,

      // Payments table
      `CREATE TABLE IF NOT EXISTS payments (
        id TEXT PRIMARY KEY,
        customer_id TEXT NOT NULL,
        credit_sale_id TEXT,
        amount REAL NOT NULL,
        payment_method TEXT DEFAULT 'cash',
        reference_no TEXT,
        notes TEXT,
        payment_type TEXT DEFAULT 'customer_payment',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers(id),
        FOREIGN KEY (credit_sale_id) REFERENCES credit_sales(id)
      )`,

      // Sales table
      `CREATE TABLE IF NOT EXISTS sales (
        id TEXT PRIMARY KEY,
        product_id TEXT,
        customer_id TEXT,
        quantity INTEGER DEFAULT 1,
        unit_price REAL NOT NULL,
        total_amount REAL NOT NULL,
        payment_method TEXT DEFAULT 'cash',
        is_credit_sale BOOLEAN DEFAULT 0,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id),
        FOREIGN KEY (customer_id) REFERENCES customers(id)
      )`,

      // Stock transactions table
      `CREATE TABLE IF NOT EXISTS stock_transactions (
        id TEXT PRIMARY KEY,
        product_id TEXT NOT NULL,
        transaction_type TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        previous_stock INTEGER NOT NULL,
        new_stock INTEGER NOT NULL,
        unit_cost REAL,
        reference_type TEXT DEFAULT 'manual',
        reference_id TEXT,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id)
      )`,

      // Settings table
      `CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`
    ];

    for (const table of tables) {
      await this.run(table);
    }

    // Create indexes
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name)',
      'CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone)',
      'CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode)',
      'CREATE INDEX IF NOT EXISTS idx_credit_sales_customer ON credit_sales(customer_id)',
      'CREATE INDEX IF NOT EXISTS idx_payments_customer ON payments(customer_id)',
      'CREATE INDEX IF NOT EXISTS idx_sales_customer ON sales(customer_id)'
    ];

    for (const index of indexes) {
      await this.run(index);
    }
  }

  // Insert sample data
  async insertSampleData() {
    try {
      // Check if data already exists
      const customerCount = await this.get('SELECT COUNT(*) as count FROM customers');
      
      if (customerCount.count === 0) {
        console.log('Inserting sample data...');
        
        // Sample categories
        await this.run(`INSERT INTO categories (id, name, description) VALUES 
          ('cat_1', 'Kırtasiye', 'Genel kırtasiye ürünleri'),
          ('cat_2', 'Ofis Malzemeleri', 'Ofis için gerekli malzemeler')`);

        // Sample products
        await this.run(`INSERT INTO products (id, name, sku, barcode, category_id, cost_price, selling_price, stock_quantity) VALUES 
          ('prod_1', 'Kalem (Mavi)', 'KLM-001', '1234567890123', 'cat_1', 2.50, 5.50, 100),
          ('prod_2', 'Defter A4', 'DFT-001', '2345678901234', 'cat_1', 8.00, 12.00, 50),
          ('prod_3', 'Silgi', 'SLG-001', '3456789012345', 'cat_1', 1.50, 3.25, 200)`);

        // Sample customers
        await this.run(`INSERT INTO customers (id, name, phone, email, credit_limit, notes) VALUES 
          ('cust_1', 'Ahmet Yılmaz', '0532 123 4567', 'ahmet@example.com', 10000.0, 'Güvenilir müşteri'),
          ('cust_2', 'Fatma Kaya', '0533 234 5678', 'fatma@example.com', 5000.0, 'Düzenli müşteri')`);

        // Default settings
        await this.run(`INSERT INTO settings (key, value) VALUES 
          ('company_name', 'Elite Medya Bilişim'),
          ('currency', 'TRY'),
          ('tax_rate', '18'),
          ('backup_interval', '24')`);

        console.log('Sample data inserted successfully');
      }
    } catch (error) {
      console.error('Error inserting sample data:', error);
    }
  }

  // Database query methods
  run(query, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(query, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, changes: this.changes });
        }
      });
    });
  }

  get(query, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(query, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  all(query, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(query, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // Utility methods
  generateId(prefix = '') {
    return prefix + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // POS specific methods
  async getCustomers(filters = {}) {
    let query = `SELECT c.*, 
      COALESCE(SUM(cs.remaining_amount), 0) as current_debt,
      COALESCE(SUM(CASE WHEN cs.due_date < date('now') AND cs.payment_status != 'paid' THEN cs.remaining_amount ELSE 0 END), 0) as overdue_debt,
      CASE WHEN SUM(CASE WHEN cs.due_date < date('now') AND cs.payment_status != 'paid' THEN cs.remaining_amount ELSE 0 END) > 0 THEN 1 ELSE 0 END as has_overdue
      FROM customers c
      LEFT JOIN credit_sales cs ON c.id = cs.customer_id AND cs.payment_status != 'paid'
      WHERE c.is_active = 1`;
    
    const params = [];
    
    if (filters.search) {
      query += ` AND (c.name LIKE ? OR c.phone LIKE ? OR c.email LIKE ?)`;
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }
    
    query += ` GROUP BY c.id ORDER BY c.name`;
    
    return await this.all(query, params);
  }

  async createCustomer(customerData) {
    const id = this.generateId('cust');
    const query = `INSERT INTO customers (id, name, phone, email, address, tax_number, credit_limit, notes) 
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    
    await this.run(query, [
      id,
      customerData.name,
      customerData.phone || '',
      customerData.email || '',
      customerData.address || '',
      customerData.tax_number || '',
      customerData.credit_limit || 5000.0,
      customerData.notes || ''
    ]);
    
    return { id };
  }

  async getCustomerAccountSummary(customerId) {
    const customer = await this.get('SELECT * FROM customers WHERE id = ?', [customerId]);
    if (!customer) return null;

    const debtQuery = `SELECT 
      COALESCE(SUM(remaining_amount), 0) as total_debt,
      COALESCE(SUM(CASE WHEN due_date < date('now') AND payment_status != 'paid' THEN remaining_amount ELSE 0 END), 0) as overdue_debt
      FROM credit_sales 
      WHERE customer_id = ? AND payment_status != 'paid'`;
    
    const debtSummary = await this.get(debtQuery, [customerId]);
    
    const recentPayments = await this.all(
      'SELECT * FROM payments WHERE customer_id = ? ORDER BY created_at DESC LIMIT 10',
      [customerId]
    );

    return {
      ...customer,
      total_debt: debtSummary.total_debt,
      overdue_debt: debtSummary.overdue_debt,
      available_credit: customer.credit_limit - debtSummary.total_debt,
      has_overdue: debtSummary.overdue_debt > 0,
      recent_payments: recentPayments
    };
  }

  async addManualCredit(customerId, creditData) {
    const id = this.generateId('credit');
    const query = `INSERT INTO credit_sales (id, customer_id, total_amount, remaining_amount, due_date, notes, payment_status) 
                   VALUES (?, ?, ?, ?, ?, ?, 'unpaid')`;
    
    await this.run(query, [
      id,
      customerId,
      creditData.amount,
      creditData.amount,
      creditData.due_date || null,
      creditData.notes
    ]);
    
    return { id };
  }

  async recordPayment(paymentData) {
    const id = this.generateId('pay');
    
    // Get current debt
    const debtResult = await this.get(
      'SELECT COALESCE(SUM(remaining_amount), 0) as total_debt FROM credit_sales WHERE customer_id = ? AND payment_status != "paid"',
      [paymentData.customer_id]
    );
    
    const currentDebt = debtResult.total_debt;
    const amount = paymentData.amount;
    
    // Create payment record
    await this.run(
      'INSERT INTO payments (id, customer_id, amount, payment_method, reference_no, notes, payment_type) VALUES (?, ?, ?, ?, ?, ?, "customer_payment")',
      [id, paymentData.customer_id, amount, paymentData.payment_method || 'cash', paymentData.reference_no || '', paymentData.notes || '']
    );
    
    // Apply payment to credit sales (FIFO)
    if (currentDebt > 0) {
      const creditSales = await this.all(
        'SELECT * FROM credit_sales WHERE customer_id = ? AND payment_status != "paid" AND remaining_amount > 0 ORDER BY created_at',
        [paymentData.customer_id]
      );
      
      let remainingPayment = amount;
      
      for (const creditSale of creditSales) {
        if (remainingPayment <= 0) break;
        
        const paymentForThisCredit = Math.min(remainingPayment, creditSale.remaining_amount);
        const newRemaining = creditSale.remaining_amount - paymentForThisCredit;
        const newStatus = newRemaining <= 0 ? 'paid' : 'partial';
        
        await this.run(
          'UPDATE credit_sales SET remaining_amount = ?, payment_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [newRemaining, newStatus, creditSale.id]
        );
        
        remainingPayment -= paymentForThisCredit;
      }
    }
    
    return {
      id,
      amount,
      previous_debt: currentDebt,
      remaining_debt: Math.max(0, currentDebt - amount),
      credit_balance: Math.max(0, amount - currentDebt)
    };
  }

  // Export/Import methods
  async exportData() {
    const tables = ['customers', 'products', 'categories', 'credit_sales', 'payments', 'sales', 'stock_transactions', 'settings'];
    const exportData = {
      export_date: new Date().toISOString(),
      version: '1.0',
      system: 'Elite Medya Bilişim POS Desktop',
      data: {}
    };
    
    for (const table of tables) {
      try {
        const data = await this.all(`SELECT * FROM ${table}`);
        exportData.data[table] = data;
      } catch (error) {
        console.error(`Export error for table ${table}:`, error);
        exportData.data[table] = [];
      }
    }
    
    return exportData;
  }

  async importData(backupData) {
    if (!backupData.data) {
      throw new Error('Invalid backup format');
    }
    
    const importOrder = ['categories', 'customers', 'products', 'credit_sales', 'payments', 'sales', 'stock_transactions', 'settings'];
    const results = {};
    
    for (const table of importOrder) {
      if (!backupData.data[table]) {
        results[table] = 0;
        continue;
      }
      
      const records = backupData.data[table];
      if (!records.length) {
        results[table] = 0;
        continue;
      }
      
      // Clear existing data
      await this.run(`DELETE FROM ${table}`);
      
      // Insert new data
      let imported = 0;
      for (const record of records) {
        try {
          const columns = Object.keys(record);
          const placeholders = columns.map(() => '?').join(',');
          const values = Object.values(record);
          
          await this.run(
            `INSERT INTO ${table} (${columns.join(',')}) VALUES (${placeholders})`,
            values
          );
          imported++;
        } catch (error) {
          console.error(`Import error for ${table} record:`, error);
        }
      }
      
      results[table] = imported;
    }
    
    return results;
  }

  // Close database connection
  close() {
    return new Promise((resolve) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) {
            console.error('Error closing database:', err);
          } else {
            console.log('Database connection closed');
          }
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}

module.exports = new Database();