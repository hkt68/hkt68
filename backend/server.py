from fastapi import FastAPI, APIRouter, HTTPException, Query
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timedelta
from enum import Enum

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI(title="Inventory Management System", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Enums
class TransactionType(str, Enum):
    STOCK_IN = "stock_in"
    STOCK_OUT = "stock_out"
    SALE = "sale"
    ADJUSTMENT = "adjustment"
    RETURN = "return"

class AlertType(str, Enum):
    LOW_STOCK = "low_stock"
    OUT_OF_STOCK = "out_of_stock"
    REORDER_POINT = "reorder_point"

# Models
class Category(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class CategoryCreate(BaseModel):
    name: str
    description: Optional[str] = None

class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

class Product(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    category_id: str
    sku: Optional[str] = None
    barcode: Optional[str] = None
    description: Optional[str] = None
    cost_price: float = 0.0
    selling_price: float = 0.0
    current_stock: int = 0
    min_stock_level: int = 0
    max_stock_level: Optional[int] = None
    image_url: Optional[str] = None
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class ProductCreate(BaseModel):
    name: str
    category_id: str
    sku: Optional[str] = None
    barcode: Optional[str] = None
    description: Optional[str] = None
    cost_price: float = 0.0
    selling_price: float = 0.0
    min_stock_level: int = 0
    max_stock_level: Optional[int] = None
    image_url: Optional[str] = None

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    category_id: Optional[str] = None
    sku: Optional[str] = None
    barcode: Optional[str] = None
    description: Optional[str] = None
    cost_price: Optional[float] = None
    selling_price: Optional[float] = None
    min_stock_level: Optional[int] = None
    max_stock_level: Optional[int] = None
    image_url: Optional[str] = None
    is_active: Optional[bool] = None

class StockTransaction(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    product_id: str
    transaction_type: TransactionType
    quantity: int
    unit_price: Optional[float] = None
    total_amount: Optional[float] = None
    reference_no: Optional[str] = None
    notes: Optional[str] = None
    created_by: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class StockTransactionCreate(BaseModel):
    product_id: str
    transaction_type: TransactionType
    quantity: int
    unit_price: Optional[float] = None
    reference_no: Optional[str] = None
    notes: Optional[str] = None
    created_by: Optional[str] = None

class Sale(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    product_id: str
    quantity: int
    unit_price: float
    total_amount: float
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    payment_method: Optional[str] = "cash"
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class SaleCreate(BaseModel):
    product_id: str
    quantity: int
    unit_price: float
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    payment_method: Optional[str] = "cash"
    notes: Optional[str] = None

class StockAlert(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    product_id: str
    alert_type: AlertType
    message: str
    is_resolved: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    resolved_at: Optional[datetime] = None

# Cari Hesap Modelleri
class PaymentStatus(str, Enum):
    PAID = "paid"           # Ödendi
    PARTIAL = "partial"     # Kısmi ödeme
    UNPAID = "unpaid"       # Ödenmedi
    OVERDUE = "overdue"     # Vadesi geçti

class Customer(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    tax_number: Optional[str] = None
    credit_limit: float = 0.0  # Kredi limiti
    notes: Optional[str] = None
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class CustomerCreate(BaseModel):
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    tax_number: Optional[str] = None
    credit_limit: Optional[float] = 0.0
    notes: Optional[str] = None

class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    tax_number: Optional[str] = None
    credit_limit: Optional[float] = None
    notes: Optional[str] = None
    is_active: Optional[bool] = None

class CreditSale(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    customer_id: str
    sale_ids: List[str]  # Bu veresiye satışa ait sale ID'leri
    total_amount: float
    paid_amount: float = 0.0
    remaining_amount: float
    due_date: Optional[datetime] = None
    payment_status: PaymentStatus = PaymentStatus.UNPAID
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class CreditSaleCreate(BaseModel):
    customer_id: str
    sale_ids: List[str]
    total_amount: float
    due_date: Optional[datetime] = None
    notes: Optional[str] = None

class Payment(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    customer_id: str
    credit_sale_id: str
    amount: float
    payment_method: str = "cash"
    reference_no: Optional[str] = None
    notes: Optional[str] = None
    created_by: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class PaymentCreate(BaseModel):
    customer_id: str
    credit_sale_id: str
    amount: float
    payment_method: str = "cash"
    reference_no: Optional[str] = None
    notes: Optional[str] = None
    created_by: Optional[str] = None

# Helper Functions
async def update_product_stock(product_id: str, quantity_change: int):
    """Update product stock level"""
    product = await db.products.find_one({"id": product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    new_stock = product["current_stock"] + quantity_change
    if new_stock < 0:
        raise HTTPException(status_code=400, detail="Insufficient stock")
    
    await db.products.update_one(
        {"id": product_id}, 
        {"$set": {"current_stock": new_stock, "updated_at": datetime.utcnow()}}
    )
    
    # Check for low stock alerts
    if new_stock <= product["min_stock_level"]:
        alert_type = AlertType.OUT_OF_STOCK if new_stock == 0 else AlertType.LOW_STOCK
        message = f"Product {product['name']} is {'out of stock' if new_stock == 0 else 'running low on stock'}"
        
        # Check if alert already exists
        existing_alert = await db.stock_alerts.find_one({
            "product_id": product_id,
            "alert_type": alert_type,
            "is_resolved": False
        })
        
        if not existing_alert:
            alert = StockAlert(
                product_id=product_id,
                alert_type=alert_type,
                message=message
            )
            await db.stock_alerts.insert_one(alert.dict())
    
    return new_stock

# API Endpoints

# Health Check
@api_router.get("/")
async def root():
    return {"message": "Inventory Management System API"}

# Categories
@api_router.post("/categories", response_model=Category)
async def create_category(category: CategoryCreate):
    category_obj = Category(**category.dict())
    await db.categories.insert_one(category_obj.dict())
    return category_obj

@api_router.get("/categories", response_model=List[Category])
async def get_categories():
    categories = await db.categories.find().to_list(1000)
    return [Category(**cat) for cat in categories]

@api_router.get("/categories/{category_id}", response_model=Category)
async def get_category(category_id: str):
    category = await db.categories.find_one({"id": category_id})
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    return Category(**category)

@api_router.put("/categories/{category_id}", response_model=Category)
async def update_category(category_id: str, category_update: CategoryUpdate):
    update_data = {k: v for k, v in category_update.dict().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No data to update")
    
    result = await db.categories.update_one(
        {"id": category_id}, 
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")
    
    updated_category = await db.categories.find_one({"id": category_id})
    return Category(**updated_category)

@api_router.delete("/categories/{category_id}")
async def delete_category(category_id: str):
    # Check if category has products
    products_count = await db.products.count_documents({"category_id": category_id})
    if products_count > 0:
        raise HTTPException(status_code=400, detail="Cannot delete category with existing products")
    
    result = await db.categories.delete_one({"id": category_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")
    
    return {"message": "Category deleted successfully"}

# Products
@api_router.post("/products", response_model=Product)
async def create_product(product: ProductCreate):
    # Verify category exists
    category = await db.categories.find_one({"id": product.category_id})
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    product_obj = Product(**product.dict())
    await db.products.insert_one(product_obj.dict())
    return product_obj

@api_router.get("/products", response_model=List[Product])
async def get_products(
    category_id: Optional[str] = None,
    search: Optional[str] = None,
    low_stock_only: bool = False
):
    query = {}
    
    if category_id:
        query["category_id"] = category_id
    
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"sku": {"$regex": search, "$options": "i"}},
            {"barcode": {"$regex": search, "$options": "i"}}
        ]
    
    products = await db.products.find(query).to_list(1000)
    product_list = [Product(**product) for product in products]
    
    if low_stock_only:
        product_list = [p for p in product_list if p.current_stock <= p.min_stock_level]
    
    return product_list

@api_router.get("/products/{product_id}", response_model=Product)
async def get_product(product_id: str):
    product = await db.products.find_one({"id": product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return Product(**product)

@api_router.put("/products/{product_id}", response_model=Product)
async def update_product(product_id: str, product_update: ProductUpdate):
    update_data = {k: v for k, v in product_update.dict().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No data to update")
    
    update_data["updated_at"] = datetime.utcnow()
    
    result = await db.products.update_one(
        {"id": product_id}, 
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    
    updated_product = await db.products.find_one({"id": product_id})
    return Product(**updated_product)

@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str):
    result = await db.products.delete_one({"id": product_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return {"message": "Product deleted successfully"}

# Stock Transactions
@api_router.post("/stock/transactions", response_model=StockTransaction)
async def create_stock_transaction(transaction: StockTransactionCreate):
    # Verify product exists
    product = await db.products.find_one({"id": transaction.product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    transaction_obj = StockTransaction(**transaction.dict())
    
    # Calculate total amount if unit price is provided
    if transaction.unit_price:
        transaction_obj.total_amount = transaction.quantity * transaction.unit_price
    
    await db.stock_transactions.insert_one(transaction_obj.dict())
    
    # Update product stock
    quantity_change = transaction.quantity if transaction.transaction_type == TransactionType.STOCK_IN else -transaction.quantity
    await update_product_stock(transaction.product_id, quantity_change)
    
    return transaction_obj

@api_router.get("/stock/transactions", response_model=List[StockTransaction])
async def get_stock_transactions(
    product_id: Optional[str] = None,
    transaction_type: Optional[TransactionType] = None,
    limit: int = Query(100, le=1000)
):
    query = {}
    
    if product_id:
        query["product_id"] = product_id
    
    if transaction_type:
        query["transaction_type"] = transaction_type
    
    transactions = await db.stock_transactions.find(query).sort("created_at", -1).limit(limit).to_list(limit)
    return [StockTransaction(**transaction) for transaction in transactions]

# Sales
@api_router.post("/sales", response_model=Sale)
async def create_sale(sale: SaleCreate):
    # Verify product exists and has sufficient stock
    product = await db.products.find_one({"id": sale.product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    if product["current_stock"] < sale.quantity:
        raise HTTPException(status_code=400, detail="Insufficient stock")
    
    # Calculate total amount
    total_amount = sale.quantity * sale.unit_price
    
    sale_obj = Sale(**sale.dict(), total_amount=total_amount)
    await db.sales.insert_one(sale_obj.dict())
    
    # Update product stock
    await update_product_stock(sale.product_id, -sale.quantity)
    
    # Create stock transaction record
    stock_transaction = StockTransaction(
        product_id=sale.product_id,
        transaction_type=TransactionType.SALE,
        quantity=sale.quantity,
        unit_price=sale.unit_price,
        total_amount=total_amount,
        notes=f"Sale to {sale.customer_name or 'Customer'}"
    )
    await db.stock_transactions.insert_one(stock_transaction.dict())
    
    return sale_obj

@api_router.get("/sales", response_model=List[Sale])
async def get_sales(
    product_id: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    limit: int = Query(100, le=1000)
):
    query = {}
    
    if product_id:
        query["product_id"] = product_id
    
    if start_date or end_date:
        date_query = {}
        if start_date:
            date_query["$gte"] = start_date
        if end_date:
            date_query["$lte"] = end_date
        query["created_at"] = date_query
    
    sales = await db.sales.find(query).sort("created_at", -1).limit(limit).to_list(limit)
    return [Sale(**sale) for sale in sales]

# Stock Alerts
@api_router.get("/alerts", response_model=List[StockAlert])
async def get_stock_alerts(resolved: Optional[bool] = None):
    query = {}
    if resolved is not None:
        query["is_resolved"] = resolved
    
    alerts = await db.stock_alerts.find(query).sort("created_at", -1).to_list(1000)
    return [StockAlert(**alert) for alert in alerts]

@api_router.put("/alerts/{alert_id}/resolve")
async def resolve_alert(alert_id: str):
    result = await db.stock_alerts.update_one(
        {"id": alert_id}, 
        {"$set": {"is_resolved": True, "resolved_at": datetime.utcnow()}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    return {"message": "Alert resolved successfully"}

# Customers (Müşteriler)
@api_router.post("/customers", response_model=Customer)
async def create_customer(customer: CustomerCreate):
    customer_obj = Customer(**customer.dict())
    await db.customers.insert_one(customer_obj.dict())
    return customer_obj

@api_router.get("/customers", response_model=List[Customer])
async def get_customers(
    search: Optional[str] = None,
    active_only: bool = True
):
    query = {}
    
    if active_only:
        query["is_active"] = True
    
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"phone": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}}
        ]
    
    customers = await db.customers.find(query).sort("name", 1).to_list(1000)
    return [Customer(**customer) for customer in customers]

@api_router.get("/customers/{customer_id}", response_model=Customer)
async def get_customer(customer_id: str):
    customer = await db.customers.find_one({"id": customer_id})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return Customer(**customer)

@api_router.put("/customers/{customer_id}", response_model=Customer)
async def update_customer(customer_id: str, customer_update: CustomerUpdate):
    update_data = {k: v for k, v in customer_update.dict().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No data to update")
    
    update_data["updated_at"] = datetime.utcnow()
    
    result = await db.customers.update_one(
        {"id": customer_id}, 
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    updated_customer = await db.customers.find_one({"id": customer_id})
    return Customer(**updated_customer)

@api_router.delete("/customers/{customer_id}")
async def delete_customer(customer_id: str):
    # Check if customer has credit sales
    credit_sales_count = await db.credit_sales.count_documents({"customer_id": customer_id})
    if credit_sales_count > 0:
        raise HTTPException(status_code=400, detail="Cannot delete customer with existing credit sales")
    
    result = await db.customers.delete_one({"id": customer_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    return {"message": "Customer deleted successfully"}

# Credit Sales (Veresiye Satışlar)
@api_router.post("/credit-sales", response_model=CreditSale)
async def create_credit_sale(credit_sale: CreditSaleCreate):
    # Verify customer exists
    customer = await db.customers.find_one({"id": credit_sale.customer_id})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Check credit limit
    customer_obj = Customer(**customer)
    current_debt = await get_customer_total_debt(credit_sale.customer_id)
    
    if customer_obj.credit_limit > 0 and (current_debt + credit_sale.total_amount) > customer_obj.credit_limit:
        raise HTTPException(
            status_code=400, 
            detail=f"Credit limit exceeded. Current debt: ₺{current_debt:.2f}, Limit: ₺{customer_obj.credit_limit:.2f}"
        )
    
    credit_sale_obj = CreditSale(**credit_sale.dict(), remaining_amount=credit_sale.total_amount)
    await db.credit_sales.insert_one(credit_sale_obj.dict())
    return credit_sale_obj

@api_router.get("/credit-sales", response_model=List[CreditSale])
async def get_credit_sales(
    customer_id: Optional[str] = None,
    payment_status: Optional[PaymentStatus] = None,
    overdue_only: bool = False
):
    query = {}
    
    if customer_id:
        query["customer_id"] = customer_id
    
    if payment_status:
        query["payment_status"] = payment_status
    
    if overdue_only:
        query["due_date"] = {"$lt": datetime.utcnow()}
        query["payment_status"] = {"$ne": PaymentStatus.PAID}
    
    credit_sales = await db.credit_sales.find(query).sort("created_at", -1).to_list(1000)
    return [CreditSale(**sale) for sale in credit_sales]

# Payments (Ödemeler)
@api_router.post("/payments", response_model=Payment)
async def create_payment(payment: PaymentCreate):
    # Verify credit sale exists
    credit_sale = await db.credit_sales.find_one({"id": payment.credit_sale_id})
    if not credit_sale:
        raise HTTPException(status_code=404, detail="Credit sale not found")
    
    credit_sale_obj = CreditSale(**credit_sale)
    
    # Check if payment amount is valid
    if payment.amount <= 0:
        raise HTTPException(status_code=400, detail="Payment amount must be positive")
    
    if payment.amount > credit_sale_obj.remaining_amount:
        raise HTTPException(
            status_code=400, 
            detail=f"Payment amount exceeds remaining debt. Remaining: ₺{credit_sale_obj.remaining_amount:.2f}"
        )
    
    # Create payment record
    payment_obj = Payment(**payment.dict())
    await db.payments.insert_one(payment_obj.dict())
    
    # Update credit sale
    new_paid_amount = credit_sale_obj.paid_amount + payment.amount
    new_remaining_amount = credit_sale_obj.total_amount - new_paid_amount
    
    # Determine payment status
    if new_remaining_amount <= 0:
        new_status = PaymentStatus.PAID
    elif new_paid_amount > 0:
        new_status = PaymentStatus.PARTIAL
    else:
        new_status = PaymentStatus.UNPAID
    
    # Check if overdue
    if credit_sale_obj.due_date and datetime.utcnow() > credit_sale_obj.due_date and new_status != PaymentStatus.PAID:
        new_status = PaymentStatus.OVERDUE
    
    await db.credit_sales.update_one(
        {"id": payment.credit_sale_id},
        {
            "$set": {
                "paid_amount": new_paid_amount,
                "remaining_amount": new_remaining_amount,
                "payment_status": new_status,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    return payment_obj

@api_router.get("/payments", response_model=List[Payment])
async def get_payments(
    customer_id: Optional[str] = None,
    credit_sale_id: Optional[str] = None
):
    query = {}
    
    if customer_id:
        query["customer_id"] = customer_id
    
    if credit_sale_id:
        query["credit_sale_id"] = credit_sale_id
    
    payments = await db.payments.find(query).sort("created_at", -1).to_list(1000)
    return [Payment(**payment) for payment in payments]

# Helper function to calculate customer total debt
async def get_customer_total_debt(customer_id: str) -> float:
    pipeline = [
        {"$match": {"customer_id": customer_id, "payment_status": {"$ne": PaymentStatus.PAID}}},
        {"$group": {"_id": None, "total_debt": {"$sum": "$remaining_amount"}}}
    ]
    
    result = await db.credit_sales.aggregate(pipeline).to_list(1)
    return result[0]["total_debt"] if result else 0.0

# Customer Account Summary
@api_router.get("/customers/{customer_id}/account-summary")
async def get_customer_account_summary(customer_id: str):
    # Verify customer exists
    customer = await db.customers.find_one({"id": customer_id})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Get total debt
    total_debt = await get_customer_total_debt(customer_id)
    
    # Get credit sales count
    credit_sales_count = await db.credit_sales.count_documents({"customer_id": customer_id})
    
    # Get overdue amount
    overdue_pipeline = [
        {
            "$match": {
                "customer_id": customer_id,
                "due_date": {"$lt": datetime.utcnow()},
                "payment_status": {"$ne": PaymentStatus.PAID}
            }
        },
        {"$group": {"_id": None, "overdue_amount": {"$sum": "$remaining_amount"}}}
    ]
    
    overdue_result = await db.credit_sales.aggregate(overdue_pipeline).to_list(1)
    overdue_amount = overdue_result[0]["overdue_amount"] if overdue_result else 0.0
    
    # Get recent payments (last 10)
    recent_payments = await db.payments.find({"customer_id": customer_id}).sort("created_at", -1).limit(10).to_list(10)
    
    # Get recent credit sales (last 10)
    recent_credit_sales = await db.credit_sales.find({"customer_id": customer_id}).sort("created_at", -1).limit(10).to_list(10)
    
    return {
        "customer": Customer(**customer),
        "total_debt": total_debt,
        "overdue_amount": overdue_amount,
        "credit_sales_count": credit_sales_count,
        "credit_limit": customer["credit_limit"],
        "available_credit": max(0, customer["credit_limit"] - total_debt),
        "recent_payments": [Payment(**p) for p in recent_payments],
        "recent_credit_sales": [CreditSale(**cs) for cs in recent_credit_sales]
    }

# Dashboard & Analytics
@api_router.get("/dashboard/summary")
async def get_dashboard_summary():
    # Get counts
    total_products = await db.products.count_documents({})
    total_categories = await db.categories.count_documents({})
    active_alerts = await db.stock_alerts.count_documents({"is_resolved": False})
    
    # Get low stock products
    low_stock_products = await db.products.find({
        "$expr": {"$lte": ["$current_stock", "$min_stock_level"]}
    }).to_list(1000)
    
    # Get today's sales
    today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    tomorrow = today + timedelta(days=1)
    
    today_sales = await db.sales.find({
        "created_at": {"$gte": today, "$lt": tomorrow}
    }).to_list(1000)
    
    today_revenue = sum(sale["total_amount"] for sale in today_sales)
    today_sales_count = len(today_sales)
    
    # Get top selling products (last 30 days)
    thirty_days_ago = datetime.now() - timedelta(days=30)
    
    pipeline = [
        {"$match": {"created_at": {"$gte": thirty_days_ago}}},
        {
            "$group": {
                "_id": "$product_id",
                "total_quantity": {"$sum": "$quantity"},
                "total_revenue": {"$sum": "$total_amount"}
            }
        },
        {"$sort": {"total_quantity": -1}},
        {"$limit": 5}
    ]
    
    top_products_cursor = db.sales.aggregate(pipeline)
    top_products_data = await top_products_cursor.to_list(5)
    
    top_products = []
    for item in top_products_data:
        product = await db.products.find_one({"id": item["_id"]})
        if product:
            top_products.append({
                "product_name": product["name"],
                "total_quantity": item["total_quantity"],
                "total_revenue": item["total_revenue"]
            })
    
    return {
        "total_products": total_products,
        "total_categories": total_categories,
        "active_alerts": active_alerts,
        "low_stock_count": len(low_stock_products),
        "today_sales_count": today_sales_count,
        "today_revenue": today_revenue,
        "low_stock_products": [Product(**p) for p in low_stock_products[:10]],
        "top_selling_products": top_products
    }

# Sales Reports
@api_router.get("/reports/sales")
async def get_sales_report(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    group_by: str = Query("day", regex="^(day|week|month)$")
):
    # Default to last 30 days if no dates provided
    if not start_date:
        start_date = datetime.now() - timedelta(days=30)
    if not end_date:
        end_date = datetime.now()
    
    # Group format based on group_by parameter
    if group_by == "day":
        group_format = "%Y-%m-%d"
    elif group_by == "week":
        group_format = "%Y-%W"
    else:  # month
        group_format = "%Y-%m"
    
    pipeline = [
        {
            "$match": {
                "created_at": {"$gte": start_date, "$lte": end_date}
            }
        },
        {
            "$group": {
                "_id": {"$dateToString": {"format": group_format, "date": "$created_at"}},
                "total_sales": {"$sum": "$quantity"},
                "total_revenue": {"$sum": "$total_amount"},
                "sales_count": {"$sum": 1}
            }
        },
        {"$sort": {"_id": 1}}
    ]
    
    report_cursor = db.sales.aggregate(pipeline)
    report_data = await report_cursor.to_list(1000)
    
    return {
        "period": {"start_date": start_date, "end_date": end_date},
        "group_by": group_by,
        "data": report_data
    }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)