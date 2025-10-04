import aiosqlite
import os
from typing import Dict, List, Optional, Any
import json
from datetime import datetime, date

class Database:
    def __init__(self):
        self.db_path = "/app/backend/elitmedya_pos.db"
        
    async def init_pool(self):
        """Initialize SQLite connection"""
        # SQLite için pool gerekmez, her işlemde bağlantı açarız
        print("✅ SQLite veritabanı hazır")
        
    async def close_pool(self):
        """Close SQLite connection"""
        # SQLite için özel bir kapatma işlemi gerekmiyor
        print("✅ SQLite bağlantısı kapatıldı")
    
    async def execute(self, query: str, params: tuple = None) -> int:
        """Execute INSERT, UPDATE, DELETE queries"""
        async with aiosqlite.connect(self.db_path) as conn:
            cursor = await conn.execute(query, params)
            await conn.commit()
            return cursor.rowcount
    
    async def fetch_one(self, query: str, params: tuple = None) -> Dict:
        """Fetch single row"""
        async with aiosqlite.connect(self.db_path) as conn:
            conn.row_factory = aiosqlite.Row
            cursor = await conn.execute(query, params)
            row = await cursor.fetchone()
            return dict(row) if row else None
    
    async def fetch_all(self, query: str, params: tuple = None) -> List[Dict]:
        """Fetch multiple rows"""
        async with aiosqlite.connect(self.db_path) as conn:
            conn.row_factory = aiosqlite.Row
            cursor = await conn.execute(query, params)
            rows = await cursor.fetchall()
            return [dict(row) for row in rows]

    async def create_tables(self):
        """Create all required tables"""
        tables = {
            'categories': '''
                CREATE TABLE IF NOT EXISTS categories (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL UNIQUE,
                    description TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            ''',
            'products': '''
                CREATE TABLE IF NOT EXISTS products (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    barcode TEXT UNIQUE,
                    category_id TEXT,
                    purchase_price REAL DEFAULT 0,
                    sale_price REAL NOT NULL,
                    stock_quantity INTEGER DEFAULT 0,
                    min_stock_level INTEGER DEFAULT 0,
                    unit TEXT DEFAULT 'adet',
                    description TEXT,
                    is_active INTEGER DEFAULT 1,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
                )
            ''',
            'customers': '''
                CREATE TABLE IF NOT EXISTS customers (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    phone TEXT,
                    email TEXT,
                    address TEXT,
                    tax_number TEXT,
                    balance REAL DEFAULT 0,
                    is_active INTEGER DEFAULT 1,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            ''',
            'sales': '''
                CREATE TABLE IF NOT EXISTS sales (
                    id TEXT PRIMARY KEY,
                    customer_id TEXT,
                    total_amount REAL NOT NULL,
                    payment_method TEXT NOT NULL,
                    discount_amount REAL DEFAULT 0,
                    tax_amount REAL DEFAULT 0,
                    notes TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
                )
            ''',
            'sale_items': '''
                CREATE TABLE IF NOT EXISTS sale_items (
                    id TEXT PRIMARY KEY,
                    sale_id TEXT NOT NULL,
                    product_id TEXT NOT NULL,
                    quantity INTEGER NOT NULL,
                    unit_price REAL NOT NULL,
                    total_price REAL NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
                    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
                )
            ''',
            'customer_transactions': '''
                CREATE TABLE IF NOT EXISTS customer_transactions (
                    id TEXT PRIMARY KEY,
                    customer_id TEXT NOT NULL,
                    transaction_type TEXT NOT NULL,
                    amount REAL NOT NULL,
                    description TEXT,
                    reference_id TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
                )
            ''',
            'system_backups': '''
                CREATE TABLE IF NOT EXISTS system_backups (
                    id TEXT PRIMARY KEY,
                    filename TEXT NOT NULL,
                    file_size INTEGER,
                    backup_type TEXT DEFAULT 'full',
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