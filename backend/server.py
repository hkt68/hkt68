from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import jwt
from passlib.context import CryptContext

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()
SECRET_KEY = os.environ.get('SECRET_KEY', 'your-secret-key-change-in-production')
ALGORITHM = "HS256"

app = FastAPI()
api_router = APIRouter(prefix="/api")

# ==================== MODELS ====================

# User Models
class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    email: EmailStr
    full_name: str
    role: str = "user"  # admin or user
    permissions: List[str] = []  # page permissions
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    full_name: str
    role: str = "user"
    permissions: List[str] = []

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
    sale_price: float  # KDV dahil
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
    movement_type: str  # "in" or "out"
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
    balance: float = 0.0  # negative = borç, positive = alacak
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CustomerCreate(BaseModel):
    name: str
    phone: str = ""
    email: str = ""
    address: str = ""

class CustomerTransaction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    customer_id: str
    customer_name: str
    transaction_type: str  # "debt" (borç), "payment" (tahsilat), "sale" (satış)
    amount: float
    description: str = ""
    sale_id: Optional[str] = None  # satıştan gelen işlemler için
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
    total: float
    payment_method: str  # "cash", "card", "other", "customer"
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

# Settings Models
class Settings(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = "app_settings"
    company_name: str = "Elite Medya Bilişim"
    site_title: str = "POS Satış Sistemi"
    logo_url: str = ""
    theme: str = "blue"  # blue, green, orange, purple, gray
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
    module: str  # "product", "sale", "customer", "settings", etc.
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
        
        user = await db.users.find_one({"username": username}, {"_id": 0})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def log_activity(user: str, action: str, description: str, module: str):
    log = ActivityLog(
        user=user,
        action=action,
        description=description,
        module=module
    )
    log_dict = log.model_dump()
    log_dict['created_at'] = log_dict['created_at'].isoformat()
    await db.activity_logs.insert_one(log_dict)

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/register", response_model=User)
async def register(user_data: UserCreate):
    # Check if user exists
    existing = await db.users.find_one({"username": user_data.username}, {"_id": 0})
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
    
    user_dict = user.model_dump()
    user_dict['password'] = hash_password(user_data.password)
    user_dict['created_at'] = user_dict['created_at'].isoformat()
    
    await db.users.insert_one(user_dict)
    return user

@api_router.post("/auth/login", response_model=Token)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"username": credentials.username}, {"_id": 0})
    if not user or not verify_password(credentials.password, user['password']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not user.get('is_active', True):
        raise HTTPException(status_code=401, detail="User is inactive")
    
    access_token = create_access_token(data={"sub": user['username']})
    
    # Convert datetime string back to datetime for response
    if isinstance(user.get('created_at'), str):
        user['created_at'] = datetime.fromisoformat(user['created_at'])
    
    user_obj = User(**{k: v for k, v in user.items() if k != 'password'})
    
    return Token(access_token=access_token, token_type="bearer", user=user_obj)

@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: dict = Depends(get_current_user)):
    if isinstance(current_user.get('created_at'), str):
        current_user['created_at'] = datetime.fromisoformat(current_user['created_at'])
    return User(**{k: v for k, v in current_user.items() if k != 'password'})

# ==================== PRODUCT ROUTES ====================

@api_router.get("/products", response_model=List[Product])
async def get_products(current_user: dict = Depends(get_current_user)):
    products = await db.products.find({}, {"_id": 0}).to_list(1000)
    for product in products:
        if isinstance(product.get('created_at'), str):
            product['created_at'] = datetime.fromisoformat(product['created_at'])
    return products

@api_router.get("/products/favorites", response_model=List[Product])
async def get_favorite_products(current_user: dict = Depends(get_current_user)):
    products = await db.products.find({"is_favorite": True}, {"_id": 0}).to_list(100)
    for product in products:
        if isinstance(product.get('created_at'), str):
            product['created_at'] = datetime.fromisoformat(product['created_at'])
    return products

@api_router.get("/products/barcode/{barcode}", response_model=Product)
async def get_product_by_barcode(barcode: str, current_user: dict = Depends(get_current_user)):
    product = await db.products.find_one({"barcode": barcode}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if isinstance(product.get('created_at'), str):
        product['created_at'] = datetime.fromisoformat(product['created_at'])
    return Product(**product)

@api_router.post("/products", response_model=Product)
async def create_product(product_data: ProductCreate, current_user: dict = Depends(get_current_user)):
    # Check if barcode exists
    existing = await db.products.find_one({"barcode": product_data.barcode}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Barcode already exists")
    
    product = Product(**product_data.model_dump())
    product_dict = product.model_dump()
    product_dict['created_at'] = product_dict['created_at'].isoformat()
    
    await db.products.insert_one(product_dict)
    await log_activity(current_user['username'], "create", f"Product created: {product.name}", "product")
    
    return product

@api_router.put("/products/{product_id}", response_model=Product)
async def update_product(product_id: str, product_data: ProductUpdate, current_user: dict = Depends(get_current_user)):
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    update_data = {k: v for k, v in product_data.model_dump().items() if v is not None}
    
    if update_data:
        await db.products.update_one({"id": product_id}, {"$set": update_data})
    
    updated_product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if isinstance(updated_product.get('created_at'), str):
        updated_product['created_at'] = datetime.fromisoformat(updated_product['created_at'])
    
    await log_activity(current_user['username'], "update", f"Product updated: {updated_product['name']}", "product")
    
    return Product(**updated_product)

@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str, current_user: dict = Depends(get_current_user)):
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    await db.products.delete_one({"id": product_id})
    await log_activity(current_user['username'], "delete", f"Product deleted: {product['name']}", "product")
    
    return {"message": "Product deleted"}

# ==================== STOCK ROUTES ====================

@api_router.post("/stock/movement")
async def create_stock_movement(movement_data: StockMovementCreate, current_user: dict = Depends(get_current_user)):
    product = await db.products.find_one({"id": movement_data.product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Update stock
    quantity_change = movement_data.quantity if movement_data.movement_type == "in" else -movement_data.quantity
    new_stock = product['stock'] + quantity_change
    
    if new_stock < 0:
        raise HTTPException(status_code=400, detail="Insufficient stock")
    
    await db.products.update_one({"id": movement_data.product_id}, {"$set": {"stock": new_stock}})
    
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
    
    movement_dict = movement.model_dump()
    movement_dict['created_at'] = movement_dict['created_at'].isoformat()
    
    await db.stock_movements.insert_one(movement_dict)
    await log_activity(current_user['username'], "stock_movement", f"Stock {movement_data.movement_type}: {product['name']} ({movement_data.quantity})", "stock")
    
    return {"message": "Stock updated", "new_stock": new_stock}

@api_router.get("/stock/movements")
async def get_stock_movements(current_user: dict = Depends(get_current_user)):
    movements = await db.stock_movements.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    for movement in movements:
        if isinstance(movement.get('created_at'), str):
            movement['created_at'] = datetime.fromisoformat(movement['created_at'])
    return movements

# ==================== CUSTOMER ROUTES ====================

@api_router.get("/customers", response_model=List[Customer])
async def get_customers(current_user: dict = Depends(get_current_user)):
    customers = await db.customers.find({}, {"_id": 0}).to_list(1000)
    for customer in customers:
        if isinstance(customer.get('created_at'), str):
            customer['created_at'] = datetime.fromisoformat(customer['created_at'])
    return customers

@api_router.get("/customers/{customer_id}", response_model=Customer)
async def get_customer(customer_id: str, current_user: dict = Depends(get_current_user)):
    customer = await db.customers.find_one({"id": customer_id}, {"_id": 0})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    if isinstance(customer.get('created_at'), str):
        customer['created_at'] = datetime.fromisoformat(customer['created_at'])
    return Customer(**customer)

@api_router.post("/customers", response_model=Customer)
async def create_customer(customer_data: CustomerCreate, current_user: dict = Depends(get_current_user)):
    customer = Customer(**customer_data.model_dump())
    customer_dict = customer.model_dump()
    customer_dict['created_at'] = customer_dict['created_at'].isoformat()
    
    await db.customers.insert_one(customer_dict)
    await log_activity(current_user['username'], "create", f"Customer created: {customer.name}", "customer")
    
    return customer

@api_router.put("/customers/{customer_id}")
async def update_customer(customer_id: str, customer_data: CustomerCreate, current_user: dict = Depends(get_current_user)):
    customer = await db.customers.find_one({"id": customer_id}, {"_id": 0})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    update_data = customer_data.model_dump()
    await db.customers.update_one({"id": customer_id}, {"$set": update_data})
    
    await log_activity(current_user['username'], "update", f"Customer updated: {customer_data.name}", "customer")
    
    return {"message": "Customer updated"}

@api_router.delete("/customers/{customer_id}")
async def delete_customer(customer_id: str, current_user: dict = Depends(get_current_user)):
    customer = await db.customers.find_one({"id": customer_id}, {"_id": 0})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    await db.customers.delete_one({"id": customer_id})
    await log_activity(current_user['username'], "delete", f"Customer deleted: {customer['name']}", "customer")
    
    return {"message": "Customer deleted"}

@api_router.post("/customers/transaction")
async def create_customer_transaction(transaction_data: CustomerTransactionCreate, current_user: dict = Depends(get_current_user)):
    customer = await db.customers.find_one({"id": transaction_data.customer_id}, {"_id": 0})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Update customer balance
    amount_change = transaction_data.amount if transaction_data.transaction_type == "debt" else -transaction_data.amount
    new_balance = customer['balance'] + amount_change
    
    await db.customers.update_one({"id": transaction_data.customer_id}, {"$set": {"balance": new_balance}})
    
    # Create transaction record
    transaction = CustomerTransaction(
        customer_id=transaction_data.customer_id,
        customer_name=customer['name'],
        transaction_type=transaction_data.transaction_type,
        amount=transaction_data.amount,
        description=transaction_data.description,
        user=current_user['username']
    )
    
    transaction_dict = transaction.model_dump()
    transaction_dict['created_at'] = transaction_dict['created_at'].isoformat()
    
    await db.customer_transactions.insert_one(transaction_dict)
    await log_activity(current_user['username'], "customer_transaction", f"Transaction: {customer['name']} - {transaction_data.transaction_type} - {transaction_data.amount} TL", "customer")
    
    return {"message": "Transaction created", "new_balance": new_balance}

@api_router.get("/customers/{customer_id}/transactions")
async def get_customer_transactions(customer_id: str, current_user: dict = Depends(get_current_user)):
    transactions = await db.customer_transactions.find({"customer_id": customer_id}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    for transaction in transactions:
        if isinstance(transaction.get('created_at'), str):
            transaction['created_at'] = datetime.fromisoformat(transaction['created_at'])
    return transactions

# ==================== SALE ROUTES ====================

@api_router.post("/sales", response_model=Sale)
async def create_sale(sale_data: SaleCreate, current_user: dict = Depends(get_current_user)):
    # Calculate totals
    subtotal = sum(item.total for item in sale_data.items)
    total = subtotal
    
    # Generate sale number
    count = await db.sales.count_documents({}) + 1
    sale_number = f"S{datetime.now().strftime('%Y%m%d')}{count:04d}"
    
    # Create sale
    sale = Sale(
        sale_number=sale_number,
        items=[item.model_dump() for item in sale_data.items],
        subtotal=subtotal,
        total=total,
        payment_method=sale_data.payment_method,
        customer_id=sale_data.customer_id,
        cash_received=sale_data.cash_received,
        change=sale_data.cash_received - total if sale_data.cash_received else None,
        print_receipt=sale_data.print_receipt,
        user=current_user['username']
    )
    
    # If customer payment, add to customer transactions
    if sale_data.payment_method == "customer" and sale_data.customer_id:
        customer = await db.customers.find_one({"id": sale_data.customer_id}, {"_id": 0})
        if customer:
            sale.customer_name = customer['name']
            
            # Update customer balance (add debt)
            new_balance = customer['balance'] + total
            await db.customers.update_one({"id": sale_data.customer_id}, {"$set": {"balance": new_balance}})
            
            # Create transaction record
            transaction = CustomerTransaction(
                customer_id=sale_data.customer_id,
                customer_name=customer['name'],
                transaction_type="sale",
                amount=total,
                description=f"Satış: {sale_number}",
                sale_id=sale.id,
                user=current_user['username']
            )
            
            transaction_dict = transaction.model_dump()
            transaction_dict['created_at'] = transaction_dict['created_at'].isoformat()
            await db.customer_transactions.insert_one(transaction_dict)
    
    # Update product stocks
    for item in sale_data.items:
        product = await db.products.find_one({"id": item.product_id}, {"_id": 0})
        if product:
            new_stock = product['stock'] - item.quantity
            await db.products.update_one({"id": item.product_id}, {"$set": {"stock": new_stock}})
            
            # Create stock movement
            movement = StockMovement(
                product_id=item.product_id,
                product_name=item.product_name,
                barcode=item.barcode,
                movement_type="out",
                quantity=item.quantity,
                note=f"Satış: {sale_number}",
                user=current_user['username']
            )
            
            movement_dict = movement.model_dump()
            movement_dict['created_at'] = movement_dict['created_at'].isoformat()
            await db.stock_movements.insert_one(movement_dict)
    
    sale_dict = sale.model_dump()
    sale_dict['created_at'] = sale_dict['created_at'].isoformat()
    
    await db.sales.insert_one(sale_dict)
    await log_activity(current_user['username'], "sale", f"Sale created: {sale_number} - {total} TL", "sale")
    
    return sale

@api_router.get("/sales")
async def get_sales(current_user: dict = Depends(get_current_user)):
    sales = await db.sales.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    for sale in sales:
        if isinstance(sale.get('created_at'), str):
            sale['created_at'] = datetime.fromisoformat(sale['created_at'])
    return sales

@api_router.get("/sales/{sale_id}")
async def get_sale(sale_id: str, current_user: dict = Depends(get_current_user)):
    sale = await db.sales.find_one({"id": sale_id}, {"_id": 0})
    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")
    if isinstance(sale.get('created_at'), str):
        sale['created_at'] = datetime.fromisoformat(sale['created_at'])
    return sale

# ==================== SETTINGS ROUTES ====================

@api_router.get("/settings", response_model=Settings)
async def get_settings():
    settings = await db.settings.find_one({"id": "app_settings"}, {"_id": 0})
    if not settings:
        # Create default settings
        default_settings = Settings()
        settings_dict = default_settings.model_dump()
        settings_dict['created_at'] = settings_dict['created_at'].isoformat()
        settings_dict['updated_at'] = settings_dict['updated_at'].isoformat()
        await db.settings.insert_one(settings_dict)
        return default_settings
    
    if isinstance(settings.get('created_at'), str):
        settings['created_at'] = datetime.fromisoformat(settings['created_at'])
    if isinstance(settings.get('updated_at'), str):
        settings['updated_at'] = datetime.fromisoformat(settings['updated_at'])
    
    return Settings(**settings)

@api_router.put("/settings", response_model=Settings)
async def update_settings(settings_data: SettingsUpdate, current_user: dict = Depends(get_current_user)):
    update_data = {k: v for k, v in settings_data.model_dump().items() if v is not None}
    update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    await db.settings.update_one({"id": "app_settings"}, {"$set": update_data}, upsert=True)
    
    settings = await db.settings.find_one({"id": "app_settings"}, {"_id": 0})
    if isinstance(settings.get('created_at'), str):
        settings['created_at'] = datetime.fromisoformat(settings['created_at'])
    if isinstance(settings.get('updated_at'), str):
        settings['updated_at'] = datetime.fromisoformat(settings['updated_at'])
    
    await log_activity(current_user['username'], "update", "Settings updated", "settings")
    
    return Settings(**settings)

# ==================== USER MANAGEMENT ROUTES ====================

@api_router.get("/users", response_model=List[User])
async def get_users(current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Not authorized")
    
    users = await db.users.find({}, {"_id": 0, "password": 0}).to_list(1000)
    for user in users:
        if isinstance(user.get('created_at'), str):
            user['created_at'] = datetime.fromisoformat(user['created_at'])
    return users

@api_router.put("/users/{user_id}")
async def update_user(user_id: str, update_data: dict, current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Not authorized")
    
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    await db.users.update_one({"id": user_id}, {"$set": update_data})
    await log_activity(current_user['username'], "update", f"User updated: {user['username']}", "user")
    
    return {"message": "User updated"}

@api_router.delete("/users/{user_id}")
async def delete_user(user_id: str, current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Not authorized")
    
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    await db.users.delete_one({"id": user_id})
    await log_activity(current_user['username'], "delete", f"User deleted: {user['username']}", "user")
    
    return {"message": "User deleted"}

# ==================== REPORTS ROUTES ====================

@api_router.get("/reports/sales")
async def get_sales_report(start_date: str, end_date: str, current_user: dict = Depends(get_current_user)):
    start = datetime.fromisoformat(start_date)
    end = datetime.fromisoformat(end_date)
    
    sales = await db.sales.find({
        "created_at": {
            "$gte": start.isoformat(),
            "$lte": end.isoformat()
        }
    }, {"_id": 0}).to_list(10000)
    
    total_sales = sum(sale['total'] for sale in sales)
    total_count = len(sales)
    
    return {
        "total_sales": total_sales,
        "total_count": total_count,
        "sales": sales
    }

@api_router.get("/reports/products")
async def get_products_report(current_user: dict = Depends(get_current_user)):
    products = await db.products.find({}, {"_id": 0}).to_list(10000)
    
    total_stock_value = sum(p['purchase_price'] * p['stock'] for p in products)
    low_stock = [p for p in products if p['stock'] < 10]
    
    return {
        "total_products": len(products),
        "total_stock_value": total_stock_value,
        "low_stock_count": len(low_stock),
        "low_stock_products": low_stock
    }

@api_router.get("/reports/profit")
async def get_profit_report(start_date: str, end_date: str, current_user: dict = Depends(get_current_user)):
    start = datetime.fromisoformat(start_date)
    end = datetime.fromisoformat(end_date)
    
    sales = await db.sales.find({
        "created_at": {
            "$gte": start.isoformat(),
            "$lte": end.isoformat()
        }
    }, {"_id": 0}).to_list(10000)
    
    total_revenue = 0
    total_cost = 0
    
    for sale in sales:
        for item in sale['items']:
            product = await db.products.find_one({"id": item['product_id']}, {"_id": 0})
            if product:
                total_revenue += item['total']
                total_cost += product['purchase_price'] * item['quantity']
    
    profit = total_revenue - total_cost
    
    return {
        "total_revenue": total_revenue,
        "total_cost": total_cost,
        "profit": profit,
        "profit_margin": (profit / total_revenue * 100) if total_revenue > 0 else 0
    }

# ==================== ACTIVITY LOGS ====================

@api_router.get("/logs")
async def get_activity_logs(current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Not authorized")
    
    logs = await db.activity_logs.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    for log in logs:
        if isinstance(log.get('created_at'), str):
            log['created_at'] = datetime.fromisoformat(log['created_at'])
    return logs

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
