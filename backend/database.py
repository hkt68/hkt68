import aiomysql
import os
from typing import Dict, List, Optional, Any
import json
from datetime import datetime, date

class Database:
    def __init__(self):
        self.pool = None
        
    async def init_pool(self):
        """Initialize MySQL connection pool"""
        self.pool = await aiomysql.create_pool(
            host=os.environ.get('MYSQL_HOST'),
            port=int(os.environ.get('MYSQL_PORT', 3306)),
            user=os.environ.get('MYSQL_USER'),
            password=os.environ.get('MYSQL_PASSWORD'),
            db=os.environ.get('MYSQL_DATABASE'),
            charset='utf8mb4',
            autocommit=True,
            minsize=1,
            maxsize=10
        )
        
    async def close_pool(self):
        """Close MySQL connection pool"""
        if self.pool:
            self.pool.close()
            await self.pool.wait_closed()
    
    async def execute(self, query: str, params: tuple = None) -> int:
        """Execute INSERT, UPDATE, DELETE queries"""
        async with self.pool.acquire() as conn:
            async with conn.cursor() as cursor:
                await cursor.execute(query, params)
                return cursor.rowcount
    
    async def fetch_one(self, query: str, params: tuple = None) -> Dict:
        """Fetch single row"""
        async with self.pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cursor:
                await cursor.execute(query, params)
                return await cursor.fetchone()
    
    async def fetch_all(self, query: str, params: tuple = None) -> List[Dict]:
        """Fetch multiple rows"""
        async with self.pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cursor:
                await cursor.execute(query, params)
                return await cursor.fetchall()

    async def create_tables(self):
        """Create all required tables"""
        tables = {
            'categories': '''
                CREATE TABLE IF NOT EXISTS categories (
                    id VARCHAR(36) PRIMARY KEY,
                    name VARCHAR(100) NOT NULL UNIQUE,
                    description TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                )
            ''',
            'products': '''
                CREATE TABLE IF NOT EXISTS products (
                    id VARCHAR(36) PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    barcode VARCHAR(50) UNIQUE,
                    category_id VARCHAR(36),
                    purchase_price DECIMAL(10,2) DEFAULT 0,
                    sale_price DECIMAL(10,2) NOT NULL,
                    stock_quantity INT DEFAULT 0,
                    min_stock_level INT DEFAULT 0,
                    unit VARCHAR(20) DEFAULT 'adet',
                    description TEXT,
                    is_active BOOLEAN DEFAULT TRUE,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
                )
            ''',
            'customers': '''
                CREATE TABLE IF NOT EXISTS customers (
                    id VARCHAR(36) PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    phone VARCHAR(20),
                    email VARCHAR(100),
                    address TEXT,
                    tax_number VARCHAR(20),
                    balance DECIMAL(10,2) DEFAULT 0,
                    is_active BOOLEAN DEFAULT TRUE,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                )
            ''',
            'sales': '''
                CREATE TABLE IF NOT EXISTS sales (
                    id VARCHAR(36) PRIMARY KEY,
                    customer_id VARCHAR(36),
                    total_amount DECIMAL(10,2) NOT NULL,
                    payment_method ENUM('cash', 'card', 'other', 'credit') NOT NULL,
                    discount_amount DECIMAL(10,2) DEFAULT 0,
                    tax_amount DECIMAL(10,2) DEFAULT 0,
                    notes TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
                )
            ''',
            'sale_items': '''
                CREATE TABLE IF NOT EXISTS sale_items (
                    id VARCHAR(36) PRIMARY KEY,
                    sale_id VARCHAR(36) NOT NULL,
                    product_id VARCHAR(36) NOT NULL,
                    quantity INT NOT NULL,
                    unit_price DECIMAL(10,2) NOT NULL,
                    total_price DECIMAL(10,2) NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
                    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
                )
            ''',
            'customer_transactions': '''
                CREATE TABLE IF NOT EXISTS customer_transactions (
                    id VARCHAR(36) PRIMARY KEY,
                    customer_id VARCHAR(36) NOT NULL,
                    transaction_type ENUM('debt', 'payment', 'sale', 'manual_debt') NOT NULL,
                    amount DECIMAL(10,2) NOT NULL,
                    description TEXT,
                    reference_id VARCHAR(36),
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
                )
            ''',
            'system_backups': '''
                CREATE TABLE IF NOT EXISTS system_backups (
                    id VARCHAR(36) PRIMARY KEY,
                    filename VARCHAR(255) NOT NULL,
                    file_size INT,
                    backup_type ENUM('full', 'partial') DEFAULT 'full',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            '''
        }
        
        for table_name, create_sql in tables.items():
            try:
                await self.execute(create_sql)
                print(f"✅ Table '{table_name}' created successfully")
            except Exception as e:
                print(f"❌ Error creating table '{table_name}': {e}")

# Global database instance
db = Database()