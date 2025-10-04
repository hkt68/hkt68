from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
import uuid

# Base Models
class BaseResponse(BaseModel):
    success: bool = True
    message: str = "İşlem başarılı"

# Category Models
class Category(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class CategoryCreate(BaseModel):
    name: str
    description: Optional[str] = None

class CategoryResponse(BaseResponse):
    data: Optional[Category] = None

class CategoryListResponse(BaseResponse):
    data: List[Category] = []

# Product Models  
class Product(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    barcode: Optional[str] = None
    category_id: Optional[str] = None
    category_name: Optional[str] = None
    purchase_price: float = 0
    sale_price: float
    stock_quantity: int = 0
    min_stock_level: int = 0
    unit: str = "adet"
    description: Optional[str] = None
    vat_rate: float = 20  # KDV oranı %
    image_url: Optional[str] = None
    is_favorite: bool = False
    is_active: bool = True
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class ProductCreate(BaseModel):
    name: str
    barcode: Optional[str] = None
    category_id: Optional[str] = None
    purchase_price: float = 0
    sale_price: float
    stock_quantity: int = 0
    min_stock_level: int = 0
    unit: str = "adet"
    description: Optional[str] = None
    vat_rate: float = 20
    image_url: Optional[str] = None

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    barcode: Optional[str] = None
    category_id: Optional[str] = None
    purchase_price: Optional[float] = None
    sale_price: Optional[float] = None
    stock_quantity: Optional[int] = None
    min_stock_level: Optional[int] = None
    unit: Optional[str] = None
    description: Optional[str] = None
    vat_rate: Optional[float] = None
    image_url: Optional[str] = None
    is_favorite: Optional[bool] = None
    is_active: Optional[bool] = None

class ProductResponse(BaseResponse):
    data: Optional[Product] = None

class ProductListResponse(BaseResponse):
    data: List[Product] = []

# Customer Models
class Customer(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    tax_number: Optional[str] = None
    balance: float = 0
    is_active: bool = True
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class CustomerCreate(BaseModel):
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    tax_number: Optional[str] = None

class CustomerResponse(BaseResponse):
    data: Optional[Customer] = None

class CustomerListResponse(BaseResponse):
    data: List[Customer] = []

# Sale Models
class SaleItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    product_id: str
    product_name: Optional[str] = None
    quantity: int
    unit_price: float
    total_price: float

class Sale(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    customer_id: Optional[str] = None
    customer_name: Optional[str] = None
    total_amount: float
    payment_method: str  # 'cash', 'card', 'other', 'credit'
    discount_amount: float = 0
    tax_amount: float = 0
    notes: Optional[str] = None
    items: List[SaleItem] = []
    created_at: Optional[datetime] = None

class SaleCreate(BaseModel):
    customer_id: Optional[str] = None
    items: List[dict]  # [{product_id, quantity, unit_price}]
    payment_method: str
    discount_amount: float = 0
    tax_amount: float = 0
    notes: Optional[str] = None

class SaleResponse(BaseResponse):
    data: Optional[Sale] = None

class SaleListResponse(BaseResponse):
    data: List[Sale] = []

# Transaction Models
class CustomerTransaction(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    customer_id: str
    transaction_type: str  # 'debt', 'payment', 'sale', 'manual_debt'
    amount: float
    description: Optional[str] = None
    reference_id: Optional[str] = None
    created_at: Optional[datetime] = None

class TransactionCreate(BaseModel):
    customer_id: str
    transaction_type: str
    amount: float
    description: Optional[str] = None

class TransactionResponse(BaseResponse):
    data: Optional[CustomerTransaction] = None

class TransactionListResponse(BaseResponse):
    data: List[CustomerTransaction] = []

# Search Models
class SearchResponse(BaseResponse):
    data: List[Product] = []
    query: str = ""
    total: int = 0