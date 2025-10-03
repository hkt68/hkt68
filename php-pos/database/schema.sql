-- Elite Medya Bilişim POS - MySQL Database Schema
-- Hosting: elitmedyabilisim.shop MySQL Database

-- Drop tables if exists (for fresh install)
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS credit_sales;
DROP TABLE IF EXISTS sales;
DROP TABLE IF EXISTS stock_transactions;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS customers;

-- Categories Table
CREATE TABLE categories (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Products Table
CREATE TABLE products (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    sku VARCHAR(100) UNIQUE,
    barcode VARCHAR(100) UNIQUE,
    category_id VARCHAR(50),
    cost_price DECIMAL(10,2) DEFAULT 0.00,
    selling_price DECIMAL(10,2) NOT NULL,
    stock_quantity INT DEFAULT 0,
    min_stock_level INT DEFAULT 5,
    max_stock_level INT DEFAULT 1000,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    INDEX idx_barcode (barcode),
    INDEX idx_sku (sku),
    INDEX idx_name (name)
);

-- Customers Table
CREATE TABLE customers (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(100),
    address TEXT,
    tax_number VARCHAR(50),
    credit_limit DECIMAL(10,2) DEFAULT 5000.00,
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name),
    INDEX idx_phone (phone),
    INDEX idx_email (email)
);

-- Sales Table
CREATE TABLE sales (
    id VARCHAR(50) PRIMARY KEY,
    product_id VARCHAR(50) NOT NULL,
    customer_id VARCHAR(50),
    quantity INT NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    payment_method ENUM('cash', 'card', 'credit') NOT NULL DEFAULT 'cash',
    is_credit_sale BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100) DEFAULT 'POS System',
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
    INDEX idx_customer (customer_id),
    INDEX idx_product (product_id),
    INDEX idx_date (created_at),
    INDEX idx_payment_method (payment_method)
);

-- Credit Sales Table (Cari Hesap)
CREATE TABLE credit_sales (
    id VARCHAR(50) PRIMARY KEY,
    customer_id VARCHAR(50) NOT NULL,
    sale_ids JSON, -- Array of sale IDs for this credit transaction
    total_amount DECIMAL(10,2) NOT NULL,
    paid_amount DECIMAL(10,2) DEFAULT 0.00,
    remaining_amount DECIMAL(10,2) NOT NULL,
    due_date DATE,
    payment_status ENUM('unpaid', 'partial', 'paid', 'overdue') DEFAULT 'unpaid',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    INDEX idx_customer (customer_id),
    INDEX idx_status (payment_status),
    INDEX idx_due_date (due_date)
);

-- Payments Table
CREATE TABLE payments (
    id VARCHAR(50) PRIMARY KEY,
    customer_id VARCHAR(50) NOT NULL,
    credit_sale_id VARCHAR(50),
    amount DECIMAL(10,2) NOT NULL,
    payment_method ENUM('cash', 'card', 'bank_transfer', 'check', 'other') DEFAULT 'cash',
    reference_no VARCHAR(100),
    notes TEXT,
    payment_type ENUM('sale_payment', 'customer_payment', 'credit_payment') DEFAULT 'customer_payment',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100) DEFAULT 'POS System',
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (credit_sale_id) REFERENCES credit_sales(id) ON DELETE SET NULL,
    INDEX idx_customer (customer_id),
    INDEX idx_credit_sale (credit_sale_id),
    INDEX idx_date (created_at),
    INDEX idx_payment_method (payment_method)
);

-- Stock Transactions Table
CREATE TABLE stock_transactions (
    id VARCHAR(50) PRIMARY KEY,
    product_id VARCHAR(50) NOT NULL,
    transaction_type ENUM('in', 'out', 'adjustment', 'sale', 'return') NOT NULL,
    quantity INT NOT NULL,
    previous_stock INT NOT NULL,
    new_stock INT NOT NULL,
    unit_cost DECIMAL(10,2),
    reference_type ENUM('sale', 'purchase', 'adjustment', 'return', 'manual') DEFAULT 'manual',
    reference_id VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100) DEFAULT 'System',
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_product (product_id),
    INDEX idx_type (transaction_type),
    INDEX idx_date (created_at)
);

-- Insert sample categories
INSERT INTO categories (id, name, description) VALUES
('cat_1', 'Kırtasiye', 'Genel kırtasiye ürünleri'),
('cat_2', 'Ofis Malzemleri', 'Ofis için gerekli malzemeler'),
('cat_3', 'Teknoloji', 'Bilgisayar ve teknoloji ürünleri');

-- Insert sample products  
INSERT INTO products (id, name, sku, barcode, category_id, cost_price, selling_price, stock_quantity) VALUES
('prod_1', 'Kalem (Mavi)', 'KLM-001', '1234567890123', 'cat_1', 2.50, 5.50, 100),
('prod_2', 'Defter A4', 'DFT-001', '2345678901234', 'cat_1', 8.00, 12.00, 50),
('prod_3', 'Silgi', 'SLG-001', '3456789012345', 'cat_1', 1.50, 3.25, 200),
('prod_4', 'Dosya', 'DSY-001', '4567890123456', 'cat_2', 5.00, 8.75, 75),
('prod_5', 'Zımba', 'ZMB-001', '5678901234567', 'cat_2', 15.00, 25.00, 25);

-- Insert sample customer
INSERT INTO customers (id, name, phone, email, credit_limit, notes) VALUES
('cust_1', 'Ahmet Yılmaz', '0532 123 4567', 'ahmet@example.com', 10000.00, 'Güvenilir müşteri'),
('cust_2', 'Fatma Kaya', '0533 234 5678', 'fatma@example.com', 5000.00, 'Düzenli müşteri'),
('cust_3', 'Mehmet Demir', '0534 345 6789', '', 7500.00, 'Toptan müşteri');

-- Create views for reporting
CREATE VIEW customer_debt_summary AS
SELECT 
    c.id,
    c.name,
    c.phone,
    c.credit_limit,
    COALESCE(SUM(cs.remaining_amount), 0) as total_debt,
    COALESCE(SUM(CASE WHEN cs.due_date < CURDATE() AND cs.payment_status != 'paid' THEN cs.remaining_amount ELSE 0 END), 0) as overdue_debt,
    (c.credit_limit - COALESCE(SUM(cs.remaining_amount), 0)) as available_credit,
    CASE 
        WHEN SUM(CASE WHEN cs.due_date < CURDATE() AND cs.payment_status != 'paid' THEN cs.remaining_amount ELSE 0 END) > 0 THEN TRUE 
        ELSE FALSE 
    END as has_overdue
FROM customers c
LEFT JOIN credit_sales cs ON c.id = cs.customer_id AND cs.payment_status != 'paid'
WHERE c.is_active = TRUE
GROUP BY c.id, c.name, c.phone, c.credit_limit;

-- Create view for product stock alerts
CREATE VIEW stock_alerts AS
SELECT 
    p.id,
    p.name,
    p.sku,
    p.stock_quantity,
    p.min_stock_level,
    CASE 
        WHEN p.stock_quantity = 0 THEN 'out_of_stock'
        WHEN p.stock_quantity <= p.min_stock_level THEN 'low_stock'
        ELSE 'normal'
    END as alert_type
FROM products p
WHERE p.is_active = TRUE
AND (p.stock_quantity = 0 OR p.stock_quantity <= p.min_stock_level);