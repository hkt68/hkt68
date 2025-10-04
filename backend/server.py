from fastapi import FastAPI, APIRouter, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from pathlib import Path
import os
import logging
import uuid
from typing import List, Optional
from datetime import datetime

from database import db
from models import *

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Create the main app
app = FastAPI(title="Elite Medya POS System", version="1.0.0")

# Create API router with /api prefix
api_router = APIRouter(prefix="/api")

# CORS middleware
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

# Startup and shutdown events
@app.on_event("startup")
async def startup_event():
    await db.init_pool()
    await db.create_tables()
    logger.info("🚀 Elite Medya POS System started successfully")

@app.on_event("shutdown")
async def shutdown_event():
    await db.close_pool()
    logger.info("👋 Elite Medya POS System shutdown")

# ==== CATEGORY ROUTES ====
@api_router.get("/categories", response_model=CategoryListResponse)
async def get_categories():
    """Tüm kategorileri getir"""
    try:
        categories = await db.fetch_all("SELECT * FROM categories ORDER BY name")
        return CategoryListResponse(data=[Category(**cat) for cat in categories])
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Kategoriler alınamadı: {str(e)}")

@api_router.post("/categories", response_model=CategoryResponse)
async def create_category(category: CategoryCreate):
    """Yeni kategori oluştur"""
    try:
        category_id = str(uuid.uuid4())
        await db.execute(
            "INSERT INTO categories (id, name, description) VALUES (%s, %s, %s)",
            (category_id, category.name, category.description)
        )
        
        new_category = await db.fetch_one(
            "SELECT * FROM categories WHERE id = %s", (category_id,)
        )
        return CategoryResponse(data=Category(**new_category))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Kategori oluşturulamadı: {str(e)}")

@api_router.delete("/categories/{category_id}")
async def delete_category(category_id: str):
    """Kategori sil"""
    try:
        result = await db.execute("DELETE FROM categories WHERE id = %s", (category_id,))
        if result == 0:
            raise HTTPException(status_code=404, detail="Kategori bulunamadı")
        return BaseResponse(message="Kategori başarıyla silindi")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Kategori silinemedi: {str(e)}")

# ==== PRODUCT ROUTES ====
@api_router.get("/products", response_model=ProductListResponse)
async def get_products():
    """Tüm ürünleri getir"""
    try:
        query = """
            SELECT p.*, c.name as category_name 
            FROM products p 
            LEFT JOIN categories c ON p.category_id = c.id 
            ORDER BY p.name
        """
        products = await db.fetch_all(query)
        return ProductListResponse(data=[Product(**prod) for prod in products])
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ürünler alınamadı: {str(e)}")

@api_router.get("/products/search")
async def search_products(q: str):
    """Ürün arama (isim veya barkod)"""
    try:
        query = """
            SELECT p.*, c.name as category_name 
            FROM products p 
            LEFT JOIN categories c ON p.category_id = c.id 
            WHERE p.name LIKE %s OR p.barcode LIKE %s 
            ORDER BY p.name
        """
        search_term = f"%{q}%"
        products = await db.fetch_all(query, (search_term, search_term))
        return SearchResponse(
            data=[Product(**prod) for prod in products],
            query=q,
            total=len(products)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Arama yapılamadı: {str(e)}")

@api_router.post("/products", response_model=ProductResponse)
async def create_product(product: ProductCreate):
    """Yeni ürün oluştur"""
    try:
        product_id = str(uuid.uuid4())
        
        # Barkod kontrolü
        if product.barcode:
            existing = await db.fetch_one(
                "SELECT id FROM products WHERE barcode = %s", (product.barcode,)
            )
            if existing:
                raise HTTPException(status_code=400, detail="Bu barkod zaten kullanılıyor")
        
        await db.execute(
            """
            INSERT INTO products 
            (id, name, barcode, category_id, purchase_price, sale_price, 
             stock_quantity, min_stock_level, unit, description) 
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (product_id, product.name, product.barcode, product.category_id,
             product.purchase_price, product.sale_price, product.stock_quantity,
             product.min_stock_level, product.unit, product.description)
        )
        
        new_product = await db.fetch_one(
            """
            SELECT p.*, c.name as category_name 
            FROM products p 
            LEFT JOIN categories c ON p.category_id = c.id 
            WHERE p.id = %s
            """, (product_id,)
        )
        return ProductResponse(data=Product(**new_product))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Ürün oluşturulamadı: {str(e)}")

@api_router.put("/products/{product_id}", response_model=ProductResponse)
async def update_product(product_id: str, product: ProductUpdate):
    """Ürün güncelle"""
    try:
        # Mevcut ürünü kontrol et
        existing = await db.fetch_one(
            "SELECT * FROM products WHERE id = %s", (product_id,)
        )
        if not existing:
            raise HTTPException(status_code=404, detail="Ürün bulunamadı")
        
        # Güncelleme alanlarını hazırla
        update_fields = []
        update_values = []
        
        for field, value in product.dict(exclude_unset=True).items():
            if field != 'id':  # ID güncellenmez
                update_fields.append(f"{field} = %s")
                update_values.append(value)
        
        if update_fields:
            update_values.append(product_id)
            query = f"UPDATE products SET {', '.join(update_fields)} WHERE id = %s"
            await db.execute(query, tuple(update_values))
        
        # Güncellenmiş ürünü getir
        updated_product = await db.fetch_one(
            """
            SELECT p.*, c.name as category_name 
            FROM products p 
            LEFT JOIN categories c ON p.category_id = c.id 
            WHERE p.id = %s
            """, (product_id,)
        )
        return ProductResponse(data=Product(**updated_product))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Ürün güncellenemedi: {str(e)}")

@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str):
    """Ürün sil"""
    try:
        result = await db.execute("DELETE FROM products WHERE id = %s", (product_id,))
        if result == 0:
            raise HTTPException(status_code=404, detail="Ürün bulunamadı")
        return BaseResponse(message="Ürün başarıyla silindi")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ürün silinemedi: {str(e)}")

# ==== CUSTOMER ROUTES ====
@api_router.get("/customers", response_model=CustomerListResponse)
async def get_customers():
    """Tüm müşterileri getir"""
    try:
        customers = await db.fetch_all("SELECT * FROM customers ORDER BY name")
        return CustomerListResponse(data=[Customer(**cust) for cust in customers])
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Müşteriler alınamadı: {str(e)}")

@api_router.post("/customers", response_model=CustomerResponse)
async def create_customer(customer: CustomerCreate):
    """Yeni müşteri oluştur"""
    try:
        customer_id = str(uuid.uuid4())
        await db.execute(
            """
            INSERT INTO customers (id, name, phone, email, address, tax_number) 
            VALUES (%s, %s, %s, %s, %s, %s)
            """,
            (customer_id, customer.name, customer.phone, customer.email, 
             customer.address, customer.tax_number)
        )
        
        new_customer = await db.fetch_one(
            "SELECT * FROM customers WHERE id = %s", (customer_id,)
        )
        return CustomerResponse(data=Customer(**new_customer))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Müşteri oluşturulamadı: {str(e)}")

# ==== BASIC ROUTES ====
@api_router.get("/")
async def root():
    return {"message": "Elite Medya POS System API v1.0", "status": "active"}

@api_router.get("/health")
async def health_check():
    try:
        # Database bağlantısını test et
        result = await db.fetch_one("SELECT 1 as test")
        return {"status": "healthy", "database": "connected", "timestamp": datetime.now()}
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Database connection failed: {str(e)}")

# Include router in main app
app.include_router(api_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)