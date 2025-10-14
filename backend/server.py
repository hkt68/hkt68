from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import aiomysql
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
import json
from datetime import datetime, timezone, timedelta
import jwt
from passlib.context import CryptContext

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MySQL configuration
MYSQL_CONFIG = {
    'host': os.environ.get('MYSQL_HOST', 'localhost'),
    'port': int(os.environ.get('MYSQL_PORT', 3306)),
    'user': os.environ.get('MYSQL_USER'),
    'password': os.environ.get('MYSQL_PASSWORD'),
    'db': os.environ.get('MYSQL_DATABASE'),
    'charset': 'utf8mb4',
    'autocommit': True
}

# Global connection pool
pool = None

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()
SECRET_KEY = os.environ.get('SECRET_KEY', 'your-secret-key-change-in-production')
ALGORITHM = "HS256"

app = FastAPI()
api_router = APIRouter(prefix="/api")

# ==================== DATABASE INITIALIZATION ====================

async def create_pool():
    """Create MySQL connection pool"""
    global pool
    pool = await aiomysql.create_pool(**MYSQL_CONFIG, maxsize=10)
    logging.info("✅ MySQL connection pool created")

async def init_database():
    """Initialize database tables"""
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            # Users table
            await cur.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id VARCHAR(36) PRIMARY KEY,
                    username VARCHAR(100) UNIQUE NOT NULL,
                    email VARCHAR(255) NOT NULL,
                    password VARCHAR(255) NOT NULL,
                    full_name VARCHAR(255) NOT NULL,
                    role VARCHAR(20) DEFAULT 'user',
                    permissions TEXT,
                    is_active BOOLEAN DEFAULT TRUE,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """)
            
            # Products table
            await cur.execute("""
                CREATE TABLE IF NOT EXISTS products (
                    id VARCHAR(36) PRIMARY KEY,
                    barcode VARCHAR(100) UNIQUE NOT NULL,
                    name VARCHAR(255) NOT NULL,
                    category VARCHAR(100),
                    purchase_price DECIMAL(10,2) NOT NULL,
                    sale_price DECIMAL(10,2) NOT NULL,
                    vat_rate DECIMAL(5,2) DEFAULT 18.0,
                    stock INT DEFAULT 0,
                    is_favorite BOOLEAN DEFAULT FALSE,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """)
            
            # Customers table
            await cur.execute("""
                CREATE TABLE IF NOT EXISTS customers (
                    id VARCHAR(36) PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    phone VARCHAR(50),
                    email VARCHAR(255),
                    address TEXT,
                    balance DECIMAL(10,2) DEFAULT 0.0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """)
            
            # Sales table
            await cur.execute("""
                CREATE TABLE IF NOT EXISTS sales (
                    id VARCHAR(36) PRIMARY KEY,
                    sale_number VARCHAR(50) UNIQUE NOT NULL,
                    items TEXT NOT NULL,
                    subtotal DECIMAL(10,2) NOT NULL,
                    discount_rate DECIMAL(5,2) DEFAULT 0.0,
                    discount_amount DECIMAL(10,2) DEFAULT 0.0,
                    total DECIMAL(10,2) NOT NULL,
                    payment_method VARCHAR(50) NOT NULL,
                    customer_id VARCHAR(36),
                    customer_name VARCHAR(255),
                    cash_received DECIMAL(10,2),
                    `change` DECIMAL(10,2),
                    print_receipt BOOLEAN DEFAULT FALSE,
                    user VARCHAR(100) NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """)
            
            # Stock movements table
            await cur.execute("""
                CREATE TABLE IF NOT EXISTS stock_movements (
                    id VARCHAR(36) PRIMARY KEY,
                    product_id VARCHAR(36) NOT NULL,
                    product_name VARCHAR(255) NOT NULL,
                    barcode VARCHAR(100) NOT NULL,
                    movement_type VARCHAR(10) NOT NULL,
                    quantity INT NOT NULL,
                    note TEXT,
                    user VARCHAR(100) NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """)
            
            # Customer transactions table
            await cur.execute("""
                CREATE TABLE IF NOT EXISTS customer_transactions (
                    id VARCHAR(36) PRIMARY KEY,
                    customer_id VARCHAR(36) NOT NULL,
                    customer_name VARCHAR(255) NOT NULL,
                    transaction_type VARCHAR(20) NOT NULL,
                    amount DECIMAL(10,2) NOT NULL,
                    description TEXT,
                    sale_id VARCHAR(36),
                    user VARCHAR(100) NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """)
            
            # Settings table
            await cur.execute("""
                CREATE TABLE IF NOT EXISTS settings (
                    id VARCHAR(36) PRIMARY KEY,
                    company_name VARCHAR(255),
                    site_title VARCHAR(255),
                    logo_url VARCHAR(500),
                    theme VARCHAR(50),
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """)
            
            # Activity logs table
            await cur.execute("""
                CREATE TABLE IF NOT EXISTS activity_logs (
                    id VARCHAR(36) PRIMARY KEY,
                    user VARCHAR(100) NOT NULL,
                    action VARCHAR(100) NOT NULL,
                    description TEXT,
                    module VARCHAR(50) NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """)
            
            await conn.commit()
            logging.info("✅ Database tables initialized")
            
            # Create default admin user if not exists
            await cur.execute("SELECT id FROM users WHERE username = 'admin'")
            admin = await cur.fetchone()
            if not admin:
                admin_id = str(uuid.uuid4())
                admin_password = hash_password("admin123")
                await cur.execute("""
                    INSERT INTO users (id, username, email, password, full_name, role, permissions)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                """, (admin_id, 'admin', 'admin@pos.com', admin_password, 'Admin User', 'admin', '[]'))
                await conn.commit()
                logging.info("✅ Default admin user created (username: admin, password: admin123)")

@app.on_event("startup")
async def startup_event():
    """Initialize database on startup"""
    await create_pool()
    await init_database()

@app.on_event("shutdown")
async def shutdown_event():
    """Close database connection pool on shutdown"""
    global pool
    if pool:
        pool.close()
        await pool.wait_closed()

# ==================== MODELS ====================

# User Models
class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    email: EmailStr
    full_name: str
    role: str = "user"
    permissions: List[str] = []
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    full_name: str
    role: str = "user"
    permissions: List[str] = []

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    role: Optional[str] = None
    permissions: Optional[List[str]] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None

class UserLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: User

# Product Models
class Product(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    barcode: str
    name: str
    category: str = ""
    purchase_price: float
    sale_price: float
    vat_rate: float = 18.0
    stock: int = 0
    is_favorite: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ProductCreate(BaseModel):
    barcode: str
    name: str
    category: str = ""
    purchase_price: float
    sale_price: float
    vat_rate: float = 18.0
    stock: int = 0
    is_favorite: bool = False

class ProductUpdate(BaseModel):
    barcode: Optional[str] = None
    name: Optional[str] = None
    category: Optional[str] = None
    purchase_price: Optional[float] = None
    sale_price: Optional[float] = None
    vat_rate: Optional[float] = None
    stock: Optional[int] = None
    is_favorite: Optional[bool] = None

# Stock Models
class StockMovement(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    product_id: str
    product_name: str
    barcode: str
    movement_type: str
    quantity: int
    note: str = ""
    user: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StockMovementCreate(BaseModel):
    product_id: str
    movement_type: str
    quantity: int
    note: str = ""

# Customer Models
class Customer(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    phone: str = ""
    email: str = ""
    address: str = ""
    balance: float = 0.0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CustomerCreate(BaseModel):
    name: str
    phone: str = ""
    email: str = ""
    address: str = ""

class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None

class CustomerTransaction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    customer_id: str
    customer_name: str
    transaction_type: str
    amount: float
    description: str = ""
    sale_id: Optional[str] = None
    user: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CustomerTransactionCreate(BaseModel):
    customer_id: str
    transaction_type: str
    amount: float
    description: str = ""

# Sale Models
class SaleItem(BaseModel):
    product_id: str
    product_name: str
    barcode: str
    quantity: int
    unit_price: float
    total: float

class Sale(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    sale_number: str
    items: List[SaleItem]
    subtotal: float
    discount_rate: float = 0.0
    discount_amount: float = 0.0
    total: float
    payment_method: str
    customer_id: Optional[str] = None
    customer_name: Optional[str] = None
    cash_received: Optional[float] = None
    change: Optional[float] = None
    print_receipt: bool = False
    user: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SaleCreate(BaseModel):
    items: List[SaleItem]
    payment_method: str
    customer_id: Optional[str] = None
    cash_received: Optional[float] = None
    print_receipt: bool = False
    discount_rate: float = 0.0

# Settings Models
class Settings(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = "app_settings"
    company_name: str = "Elite Medya Bilişim"
    site_title: str = "POS Satış Sistemi"
    logo_url: str = ""
    theme: str = "blue"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SettingsUpdate(BaseModel):
    company_name: Optional[str] = None
    site_title: Optional[str] = None
    logo_url: Optional[str] = None
    theme: Optional[str] = None

# Log Models
class ActivityLog(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user: str
    action: str
    description: str
    module: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ==================== HELPER FUNCTIONS ====================

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=7)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        async with pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cur:
                await cur.execute("SELECT * FROM users WHERE username = %s", (username,))
                user = await cur.fetchone()
                
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        
        # Parse JSON fields
        if user.get('permissions') and isinstance(user['permissions'], str):
            user['permissions'] = json.loads(user['permissions'])
        
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def log_activity(user: str, action: str, description: str, module: str):
    log = ActivityLog(user=user, action=action, description=description, module=module)
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            await cur.execute("""
                INSERT INTO activity_logs (id, user, action, description, module, created_at)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (log.id, log.user, log.action, log.description, log.module, log.created_at))
            await conn.commit()

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/register", response_model=User)
async def register(user_data: UserCreate):
    async with pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cur:
            # Check if user exists
            await cur.execute("SELECT id FROM users WHERE username = %s", (user_data.username,))
            existing = await cur.fetchone()
            if existing:
                raise HTTPException(status_code=400, detail="Username already exists")
            
            # Create user
            user = User(
                username=user_data.username,
                email=user_data.email,
                full_name=user_data.full_name,
                role=user_data.role,
                permissions=user_data.permissions
            )
            
            await cur.execute("""
                INSERT INTO users (id, username, email, password, full_name, role, permissions, is_active, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (user.id, user.username, user.email, hash_password(user_data.password), 
                  user.full_name, user.role, json.dumps(user.permissions), user.is_active, user.created_at))
            await conn.commit()
            
            return user

@api_router.post("/auth/login", response_model=Token)
async def login(credentials: UserLogin):
    async with pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cur:
            await cur.execute("SELECT * FROM users WHERE username = %s", (credentials.username,))
            user = await cur.fetchone()
            
    if not user or not verify_password(credentials.password, user['password']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not user.get('is_active', True):
        raise HTTPException(status_code=401, detail="User is inactive")
    
    access_token = create_access_token(data={"sub": user['username']})
    
    # Parse JSON fields
    if user.get('permissions') and isinstance(user['permissions'], str):
        user['permissions'] = json.loads(user['permissions'])
    
    user_obj = User(**{k: v for k, v in user.items() if k != 'password'})
    
    return Token(access_token=access_token, token_type="bearer", user=user_obj)

@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: dict = Depends(get_current_user)):
    return User(**current_user)

# ==================== PRODUCT ROUTES ====================

@api_router.get("/products", response_model=List[Product])
async def get_products(search: Optional[str] = None):
    async with pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cur:
            if search:
                await cur.execute("""
                    SELECT * FROM products 
                    WHERE barcode LIKE %s OR name LIKE %s 
                    ORDER BY created_at DESC
                """, (f"%{search}%", f"%{search}%"))
            else:
                await cur.execute("SELECT * FROM products ORDER BY created_at DESC")
            
            products = await cur.fetchall()
            return [Product(**p) for p in products]

@api_router.get("/products/{product_id}", response_model=Product)
async def get_product(product_id: str):
    async with pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cur:
            await cur.execute("SELECT * FROM products WHERE id = %s", (product_id,))
            product = await cur.fetchone()
            
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return Product(**product)

@api_router.get("/products/barcode/{barcode}", response_model=Product)
async def get_product_by_barcode(barcode: str):
    async with pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cur:
            await cur.execute("SELECT * FROM products WHERE barcode = %s", (barcode,))
            product = await cur.fetchone()
            
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return Product(**product)

@api_router.post("/products", response_model=Product)
async def create_product(product_data: ProductCreate, current_user: dict = Depends(get_current_user)):
    async with pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cur:
            # Check if barcode exists
            await cur.execute("SELECT id FROM products WHERE barcode = %s", (product_data.barcode,))
            existing = await cur.fetchone()
            if existing:
                raise HTTPException(status_code=400, detail="Barcode already exists")
            
            product = Product(**product_data.model_dump())
            
            await cur.execute("""
                INSERT INTO products (id, barcode, name, category, purchase_price, sale_price, 
                                     vat_rate, stock, is_favorite, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (product.id, product.barcode, product.name, product.category, 
                  product.purchase_price, product.sale_price, product.vat_rate, 
                  product.stock, product.is_favorite, product.created_at))
            await conn.commit()
            
            await log_activity(current_user['username'], "create", f"Created product: {product.name}", "product")
            
            return product

@api_router.put("/products/{product_id}", response_model=Product)
async def update_product(product_id: str, product_data: ProductUpdate, current_user: dict = Depends(get_current_user)):
    async with pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cur:
            # Check if product exists
            await cur.execute("SELECT * FROM products WHERE id = %s", (product_id,))
            existing = await cur.fetchone()
            if not existing:
                raise HTTPException(status_code=404, detail="Product not found")
            
            # Build update query
            update_fields = []
            values = []
            for field, value in product_data.model_dump(exclude_unset=True).items():
                update_fields.append(f"{field} = %s")
                values.append(value)
            
            if update_fields:
                values.append(product_id)
                query = f"UPDATE products SET {', '.join(update_fields)} WHERE id = %s"
                await cur.execute(query, tuple(values))
                await conn.commit()
            
            # Fetch updated product
            await cur.execute("SELECT * FROM products WHERE id = %s", (product_id,))
            updated = await cur.fetchone()
            
            await log_activity(current_user['username'], "update", f"Updated product: {updated['name']}", "product")
            
            return Product(**updated)

@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str, current_user: dict = Depends(get_current_user)):
    async with pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cur:
            await cur.execute("SELECT name FROM products WHERE id = %s", (product_id,))
            product = await cur.fetchone()
            if not product:
                raise HTTPException(status_code=404, detail="Product not found")
            
            await cur.execute("DELETE FROM products WHERE id = %s", (product_id,))
            await conn.commit()
            
            await log_activity(current_user['username'], "delete", f"Deleted product: {product['name']}", "product")
            
            return {"message": "Product deleted successfully"}

# ==================== STOCK ROUTES ====================

@api_router.get("/stock", response_model=List[StockMovement])
async def get_stock_movements():
    async with pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cur:
            await cur.execute("SELECT * FROM stock_movements ORDER BY created_at DESC")
            movements = await cur.fetchall()
            return [StockMovement(**m) for m in movements]

@api_router.post("/stock", response_model=StockMovement)
async def create_stock_movement(movement_data: StockMovementCreate, current_user: dict = Depends(get_current_user)):
    async with pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cur:
            # Get product details
            await cur.execute("SELECT * FROM products WHERE id = %s", (movement_data.product_id,))
            product = await cur.fetchone()
            if not product:
                raise HTTPException(status_code=404, detail="Product not found")
            
            # Update stock
            new_stock = product['stock']
            if movement_data.movement_type == "in":
                new_stock += movement_data.quantity
            else:
                new_stock -= movement_data.quantity
                if new_stock < 0:
                    raise HTTPException(status_code=400, detail="Insufficient stock")
            
            await cur.execute("UPDATE products SET stock = %s WHERE id = %s", 
                            (new_stock, movement_data.product_id))
            
            # Create movement record
            movement = StockMovement(
                product_id=movement_data.product_id,
                product_name=product['name'],
                barcode=product['barcode'],
                movement_type=movement_data.movement_type,
                quantity=movement_data.quantity,
                note=movement_data.note,
                user=current_user['username']
            )
            
            await cur.execute("""
                INSERT INTO stock_movements (id, product_id, product_name, barcode, movement_type, 
                                            quantity, note, user, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (movement.id, movement.product_id, movement.product_name, movement.barcode,
                  movement.movement_type, movement.quantity, movement.note, movement.user, movement.created_at))
            
            await conn.commit()
            
            await log_activity(current_user['username'], "stock", 
                             f"Stock {movement_data.movement_type}: {product['name']} ({movement_data.quantity})", 
                             "stock")
            
            return movement

# ==================== CUSTOMER ROUTES ====================

@api_router.get("/customers", response_model=List[Customer])
async def get_customers(search: Optional[str] = None):
    async with pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cur:
            if search:
                await cur.execute("""
                    SELECT * FROM customers 
                    WHERE name LIKE %s OR phone LIKE %s 
                    ORDER BY created_at DESC
                """, (f"%{search}%", f"%{search}%"))
            else:
                await cur.execute("SELECT * FROM customers ORDER BY created_at DESC")
            
            customers = await cur.fetchall()
            return [Customer(**c) for c in customers]

@api_router.get("/customers/{customer_id}", response_model=Customer)
async def get_customer(customer_id: str):
    async with pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cur:
            await cur.execute("SELECT * FROM customers WHERE id = %s", (customer_id,))
            customer = await cur.fetchone()
            
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    return Customer(**customer)

@api_router.post("/customers", response_model=Customer)
async def create_customer(customer_data: CustomerCreate, current_user: dict = Depends(get_current_user)):
    customer = Customer(**customer_data.model_dump())
    
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            await cur.execute("""
                INSERT INTO customers (id, name, phone, email, address, balance, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (customer.id, customer.name, customer.phone, customer.email, 
                  customer.address, customer.balance, customer.created_at))
            await conn.commit()
    
    await log_activity(current_user['username'], "create", f"Created customer: {customer.name}", "customer")
    
    return customer

@api_router.put("/customers/{customer_id}", response_model=Customer)
async def update_customer(customer_id: str, customer_data: CustomerUpdate, current_user: dict = Depends(get_current_user)):
    async with pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cur:
            # Check if customer exists
            await cur.execute("SELECT * FROM customers WHERE id = %s", (customer_id,))
            existing = await cur.fetchone()
            if not existing:
                raise HTTPException(status_code=404, detail="Customer not found")
            
            # Build update query
            update_fields = []
            values = []
            for field, value in customer_data.model_dump(exclude_unset=True).items():
                update_fields.append(f"{field} = %s")
                values.append(value)
            
            if update_fields:
                values.append(customer_id)
                query = f"UPDATE customers SET {', '.join(update_fields)} WHERE id = %s"
                await cur.execute(query, tuple(values))
                await conn.commit()
            
            # Fetch updated customer
            await cur.execute("SELECT * FROM customers WHERE id = %s", (customer_id,))
            updated = await cur.fetchone()
            
            await log_activity(current_user['username'], "update", f"Updated customer: {updated['name']}", "customer")
            
            return Customer(**updated)

@api_router.delete("/customers/{customer_id}")
async def delete_customer(customer_id: str, current_user: dict = Depends(get_current_user)):
    async with pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cur:
            await cur.execute("SELECT name FROM customers WHERE id = %s", (customer_id,))
            customer = await cur.fetchone()
            if not customer:
                raise HTTPException(status_code=404, detail="Customer not found")
            
            await cur.execute("DELETE FROM customers WHERE id = %s", (customer_id,))
            await conn.commit()
            
            await log_activity(current_user['username'], "delete", f"Deleted customer: {customer['name']}", "customer")
            
            return {"message": "Customer deleted successfully"}

@api_router.get("/customers/{customer_id}/transactions", response_model=List[CustomerTransaction])
async def get_customer_transactions(customer_id: str):
    async with pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cur:
            await cur.execute("""
                SELECT * FROM customer_transactions 
                WHERE customer_id = %s 
                ORDER BY created_at DESC
            """, (customer_id,))
            transactions = await cur.fetchall()
            return [CustomerTransaction(**t) for t in transactions]

@api_router.post("/customers/{customer_id}/transactions", response_model=CustomerTransaction)
async def create_customer_transaction(customer_id: str, transaction_data: CustomerTransactionCreate, 
                                     current_user: dict = Depends(get_current_user)):
    async with pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cur:
            # Get customer
            await cur.execute("SELECT * FROM customers WHERE id = %s", (customer_id,))
            customer = await cur.fetchone()
            if not customer:
                raise HTTPException(status_code=404, detail="Customer not found")
            
            # Create transaction
            transaction = CustomerTransaction(
                customer_id=customer_id,
                customer_name=customer['name'],
                transaction_type=transaction_data.transaction_type,
                amount=transaction_data.amount,
                description=transaction_data.description,
                user=current_user['username']
            )
            
            await cur.execute("""
                INSERT INTO customer_transactions (id, customer_id, customer_name, transaction_type, 
                                                   amount, description, sale_id, user, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (transaction.id, transaction.customer_id, transaction.customer_name, 
                  transaction.transaction_type, transaction.amount, transaction.description,
                  transaction.sale_id, transaction.user, transaction.created_at))
            
            # Update customer balance
            new_balance = customer['balance']
            if transaction_data.transaction_type == "debt":
                new_balance += transaction_data.amount
            elif transaction_data.transaction_type == "payment":
                new_balance -= transaction_data.amount
            
            await cur.execute("UPDATE customers SET balance = %s WHERE id = %s", 
                            (new_balance, customer_id))
            
            await conn.commit()
            
            await log_activity(current_user['username'], "transaction", 
                             f"Customer transaction: {customer['name']} - {transaction_data.transaction_type}", 
                             "customer")
            
            return transaction

# ==================== SALES ROUTES ====================

@api_router.get("/sales", response_model=List[Sale])
async def get_sales(start_date: Optional[str] = None, end_date: Optional[str] = None):
    async with pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cur:
            if start_date and end_date:
                await cur.execute("""
                    SELECT * FROM sales 
                    WHERE created_at BETWEEN %s AND %s 
                    ORDER BY created_at DESC
                """, (start_date, end_date))
            else:
                await cur.execute("SELECT * FROM sales ORDER BY created_at DESC")
            
            sales = await cur.fetchall()
            
            # Parse JSON items field
            for sale in sales:
                if isinstance(sale['items'], str):
                    sale['items'] = json.loads(sale['items'])
            
            return [Sale(**s) for s in sales]

@api_router.get("/sales/{sale_id}", response_model=Sale)
async def get_sale(sale_id: str):
    async with pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cur:
            await cur.execute("SELECT * FROM sales WHERE id = %s", (sale_id,))
            sale = await cur.fetchone()
            
    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")
    
    # Parse JSON items field
    if isinstance(sale['items'], str):
        sale['items'] = json.loads(sale['items'])
    
    return Sale(**sale)

@api_router.post("/sales", response_model=Sale)
async def create_sale(sale_data: SaleCreate, current_user: dict = Depends(get_current_user)):
    # Calculate totals
    subtotal = sum(item.total for item in sale_data.items)
    discount_amount = subtotal * (sale_data.discount_rate / 100)
    total = subtotal - discount_amount
    
    # Generate sale number
    sale_number = f"FIS-{datetime.now().strftime('%Y%m%d%H%M%S')}"
    
    # Calculate change if cash payment
    change = None
    if sale_data.payment_method == "cash" and sale_data.cash_received:
        change = sale_data.cash_received - total
    
    # Get customer name if customer payment
    customer_name = None
    if sale_data.customer_id:
        async with pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cur:
                await cur.execute("SELECT name FROM customers WHERE id = %s", (sale_data.customer_id,))
                customer = await cur.fetchone()
                if customer:
                    customer_name = customer['name']
    
    # Create sale
    sale = Sale(
        sale_number=sale_number,
        items=sale_data.items,
        subtotal=subtotal,
        discount_rate=sale_data.discount_rate,
        discount_amount=discount_amount,
        total=total,
        payment_method=sale_data.payment_method,
        customer_id=sale_data.customer_id,
        customer_name=customer_name,
        cash_received=sale_data.cash_received,
        change=change,
        print_receipt=sale_data.print_receipt,
        user=current_user['username']
    )
    
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            # Insert sale
            await cur.execute("""
                INSERT INTO sales (id, sale_number, items, subtotal, discount_rate, discount_amount, 
                                  total, payment_method, customer_id, customer_name, cash_received, 
                                  `change`, print_receipt, user, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (sale.id, sale.sale_number, json.dumps([item.model_dump() for item in sale.items]), 
                  sale.subtotal, sale.discount_rate, sale.discount_amount, sale.total, 
                  sale.payment_method, sale.customer_id, sale.customer_name, sale.cash_received, 
                  sale.change, sale.print_receipt, sale.user, sale.created_at))
            
            # Update product stocks
            for item in sale_data.items:
                await cur.execute("UPDATE products SET stock = stock - %s WHERE id = %s", 
                                (item.quantity, item.product_id))
            
            # If customer payment, add to customer balance
            if sale_data.customer_id and customer_name:
                await cur.execute("UPDATE customers SET balance = balance + %s WHERE id = %s",
                                (total, sale_data.customer_id))
                
                # Create customer transaction
                trans_id = str(uuid.uuid4())
                await cur.execute("""
                    INSERT INTO customer_transactions (id, customer_id, customer_name, transaction_type, 
                                                       amount, description, sale_id, user, created_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (trans_id, sale_data.customer_id, customer_name, "sale", total, 
                      f"Sale: {sale_number}", sale.id, current_user['username'], sale.created_at))
            
            await conn.commit()
    
    await log_activity(current_user['username'], "sale", f"Created sale: {sale_number}", "sale")
    
    return sale

# ==================== SETTINGS ROUTES ====================

@api_router.get("/settings", response_model=Settings)
async def get_settings():
    async with pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cur:
            await cur.execute("SELECT * FROM settings WHERE id = 'app_settings'")
            settings = await cur.fetchone()
            
    if not settings:
        # Create default settings
        default_settings = Settings()
        async with pool.acquire() as conn:
            async with conn.cursor() as cur:
                await cur.execute("""
                    INSERT INTO settings (id, company_name, site_title, logo_url, theme, created_at, updated_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                """, (default_settings.id, default_settings.company_name, default_settings.site_title,
                      default_settings.logo_url, default_settings.theme, default_settings.created_at,
                      default_settings.updated_at))
                await conn.commit()
        return default_settings
    
    return Settings(**settings)

@api_router.put("/settings", response_model=Settings)
async def update_settings(settings_data: SettingsUpdate, current_user: dict = Depends(get_current_user)):
    async with pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cur:
            # Build update query
            update_fields = []
            values = []
            for field, value in settings_data.model_dump(exclude_unset=True).items():
                update_fields.append(f"{field} = %s")
                values.append(value)
            
            if update_fields:
                update_fields.append("updated_at = NOW()")
                values.append('app_settings')
                query = f"UPDATE settings SET {', '.join(update_fields)} WHERE id = %s"
                await cur.execute(query, tuple(values))
                await conn.commit()
            
            # Fetch updated settings
            await cur.execute("SELECT * FROM settings WHERE id = 'app_settings'")
            updated = await cur.fetchone()
            
            await log_activity(current_user['username'], "update", "Updated settings", "settings")
            
            return Settings(**updated)

# ==================== USER MANAGEMENT ROUTES ====================

@api_router.get("/users", response_model=List[User])
async def get_users(current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    async with pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cur:
            await cur.execute("SELECT * FROM users ORDER BY created_at DESC")
            users = await cur.fetchall()
            
            # Parse JSON fields
            for user in users:
                if user.get('permissions') and isinstance(user['permissions'], str):
                    user['permissions'] = json.loads(user['permissions'])
            
            return [User(**{k: v for k, v in u.items() if k != 'password'}) for u in users]

@api_router.put("/users/{user_id}", response_model=User)
async def update_user(user_id: str, user_data: UserUpdate, current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    async with pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cur:
            # Check if user exists
            await cur.execute("SELECT * FROM users WHERE id = %s", (user_id,))
            existing = await cur.fetchone()
            if not existing:
                raise HTTPException(status_code=404, detail="User not found")
            
            # Build update query
            update_fields = []
            values = []
            update_data = user_data.model_dump(exclude_unset=True)
            
            for field, value in update_data.items():
                if field == 'password':
                    update_fields.append("password = %s")
                    values.append(hash_password(value))
                elif field == 'permissions':
                    update_fields.append("permissions = %s")
                    values.append(json.dumps(value))
                else:
                    update_fields.append(f"{field} = %s")
                    values.append(value)
            
            if update_fields:
                values.append(user_id)
                query = f"UPDATE users SET {', '.join(update_fields)} WHERE id = %s"
                await cur.execute(query, tuple(values))
                await conn.commit()
            
            # Fetch updated user
            await cur.execute("SELECT * FROM users WHERE id = %s", (user_id,))
            updated = await cur.fetchone()
            
            # Parse JSON fields
            if updated.get('permissions') and isinstance(updated['permissions'], str):
                updated['permissions'] = json.loads(updated['permissions'])
            
            await log_activity(current_user['username'], "update", f"Updated user: {updated['username']}", "user")
            
            return User(**{k: v for k, v in updated.items() if k != 'password'})

@api_router.delete("/users/{user_id}")
async def delete_user(user_id: str, current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    async with pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cur:
            await cur.execute("SELECT username FROM users WHERE id = %s", (user_id,))
            user = await cur.fetchone()
            if not user:
                raise HTTPException(status_code=404, detail="User not found")
            
            await cur.execute("DELETE FROM users WHERE id = %s", (user_id,))
            await conn.commit()
            
            await log_activity(current_user['username'], "delete", f"Deleted user: {user['username']}", "user")
            
            return {"message": "User deleted successfully"}

# ==================== ACTIVITY LOGS ROUTES ====================

@api_router.get("/logs", response_model=List[ActivityLog])
async def get_logs(page: int = 1, limit: int = 10, current_user: dict = Depends(get_current_user)):
    offset = (page - 1) * limit
    
    async with pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cur:
            await cur.execute("""
                SELECT * FROM activity_logs 
                ORDER BY created_at DESC 
                LIMIT %s OFFSET %s
            """, (limit, offset))
            logs = await cur.fetchall()
            return [ActivityLog(**log) for log in logs]

@api_router.get("/logs/count")
async def get_logs_count(current_user: dict = Depends(get_current_user)):
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            await cur.execute("SELECT COUNT(*) FROM activity_logs")
            count = await cur.fetchone()
            return {"count": count[0]}

# ==================== BACKUP & RESTORE ROUTES ====================

@api_router.get("/backup")
async def backup_data(current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    backup = {}
    
    async with pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cur:
            # Backup all tables
            tables = ['users', 'products', 'customers', 'sales', 'stock_movements', 
                     'customer_transactions', 'settings', 'activity_logs']
            
            for table in tables:
                await cur.execute(f"SELECT * FROM {table}")
                rows = await cur.fetchall()
                
                # Convert datetime and decimal to string
                for row in rows:
                    for key, value in row.items():
                        if isinstance(value, datetime):
                            row[key] = value.isoformat()
                        elif hasattr(value, '__float__'):  # Decimal
                            row[key] = float(value)
                
                backup[table] = rows
    
    await log_activity(current_user['username'], "backup", "Created data backup", "settings")
    
    return backup

@api_router.post("/restore")
async def restore_data(backup_data: Dict[str, Any], current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            # Clear existing data
            tables = ['activity_logs', 'customer_transactions', 'stock_movements', 'sales', 
                     'customers', 'products', 'users', 'settings']
            
            for table in tables:
                await cur.execute(f"DELETE FROM {table}")
            
            # Restore data
            for table, rows in backup_data.items():
                if rows:
                    # Get column names
                    columns = list(rows[0].keys())
                    placeholders = ', '.join(['%s'] * len(columns))
                    columns_str = ', '.join([f'`{col}`' for col in columns])
                    
                    query = f"INSERT INTO {table} ({columns_str}) VALUES ({placeholders})"
                    
                    for row in rows:
                        values = [row[col] for col in columns]
                        await cur.execute(query, tuple(values))
            
            await conn.commit()
    
    await log_activity(current_user['username'], "restore", "Restored data from backup", "settings")
    
    return {"message": "Data restored successfully"}

# ==================== REPORTS ROUTES ====================

@api_router.get("/reports/sales")
async def get_sales_report(start_date: Optional[str] = None, end_date: Optional[str] = None, 
                          current_user: dict = Depends(get_current_user)):
    async with pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cur:
            if start_date and end_date:
                await cur.execute("""
                    SELECT 
                        COUNT(*) as total_sales,
                        SUM(total) as total_revenue,
                        SUM(subtotal - total) as total_discounts
                    FROM sales
                    WHERE created_at BETWEEN %s AND %s
                """, (start_date, end_date))
            else:
                await cur.execute("""
                    SELECT 
                        COUNT(*) as total_sales,
                        SUM(total) as total_revenue,
                        SUM(discount_amount) as total_discounts
                    FROM sales
                """)
            
            result = await cur.fetchone()
            
            # Convert Decimal to float
            for key in result:
                if hasattr(result[key], '__float__'):
                    result[key] = float(result[key])
            
            return result if result else {"total_sales": 0, "total_revenue": 0, "total_discounts": 0}

@api_router.get("/reports/products")
async def get_product_report(current_user: dict = Depends(get_current_user)):
    async with pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cur:
            await cur.execute("""
                SELECT 
                    COUNT(*) as total_products,
                    SUM(stock) as total_stock_quantity,
                    SUM(stock * purchase_price) as total_stock_value
                FROM products
            """)
            result = await cur.fetchone()
            
            # Convert Decimal to float
            for key in result:
                if result[key] and hasattr(result[key], '__float__'):
                    result[key] = float(result[key])
            
            return result if result else {"total_products": 0, "total_stock_quantity": 0, "total_stock_value": 0}

# ==================== CORS & APP SETUP ====================

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)

@app.get("/")
async def root():
    return {"message": "POS System API - MySQL Edition", "status": "running"}

@app.get("/health")
async def health():
    try:
        async with pool.acquire() as conn:
            async with conn.cursor() as cur:
                await cur.execute("SELECT 1")
                await cur.fetchone()
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "database": "disconnected", "error": str(e)}
