from fastapi import FastAPI, APIRouter, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from pathlib import Path
import os
import logging
import uuid
from typing import List, Optional
from datetime import datetime, timedelta

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
            "INSERT INTO categories (id, name, description) VALUES (?, ?, ?)",
            (category_id, category.name, category.description)
        )
        
        new_category = await db.fetch_one(
            "SELECT * FROM categories WHERE id = ?", (category_id,)
        )
        return CategoryResponse(data=Category(**new_category))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Kategori oluşturulamadı: {str(e)}")

@api_router.delete("/categories/{category_id}")
async def delete_category(category_id: str):
    """Kategori sil"""
    try:
        result = await db.execute("DELETE FROM categories WHERE id = ?", (category_id,))
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
    """Ürün arama (isim veya barkod) - gelişmiş"""
    try:
        query = """
            SELECT p.*, c.name as category_name 
            FROM products p 
            LEFT JOIN categories c ON p.category_id = c.id 
            WHERE p.name LIKE ? OR p.barcode LIKE ? 
            ORDER BY 
                CASE 
                    WHEN p.name LIKE ? THEN 1  -- Başlangıçta eşleşen öncelikli
                    ELSE 2 
                END, p.is_favorite DESC, p.name
        """
        search_term = f"%{q}%"
        exact_start = f"{q}%"
        products = await db.fetch_all(query, (search_term, search_term, exact_start))
        return SearchResponse(
            data=[Product(**prod) for prod in products],
            query=q,
            total=len(products)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Arama yapılamadı: {str(e)}")

@api_router.get("/products/favorites")
async def get_favorite_products():
    """Favori ürünleri getir"""
    try:
        query = """
            SELECT p.*, c.name as category_name 
            FROM products p 
            LEFT JOIN categories c ON p.category_id = c.id 
            WHERE p.is_favorite = 1 AND p.is_active = 1
            ORDER BY p.name
        """
        products = await db.fetch_all(query)
        return ProductListResponse(data=[Product(**prod) for prod in products])
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Favori ürünler alınamadı: {str(e)}")

@api_router.put("/products/{product_id}/favorite")
async def toggle_product_favorite(product_id: str):
    """Ürün favori durumunu değiştir"""
    try:
        # Mevcut favori durumunu al
        product = await db.fetch_one("SELECT is_favorite FROM products WHERE id = ?", (product_id,))
        if not product:
            raise HTTPException(status_code=404, detail="Ürün bulunamadı")
        
        new_favorite_status = 0 if product['is_favorite'] else 1
        await db.execute(
            "UPDATE products SET is_favorite = ? WHERE id = ?", 
            (new_favorite_status, product_id)
        )
        
        status = "eklendi" if new_favorite_status else "kaldırıldı"
        return BaseResponse(message=f"Ürün favorilerden {status}")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Favori durumu güncellenemedi: {str(e)}")

@api_router.get("/products/suggestions")
async def get_product_suggestions(q: str, limit: int = 5):
    """Ürün önerileri - hızlı arama"""
    try:
        query = """
            SELECT p.name, p.barcode, p.sale_price, p.id, p.image_url
            FROM products p 
            WHERE (p.name LIKE ? OR p.barcode LIKE ?) AND p.is_active = 1
            ORDER BY p.is_favorite DESC, p.name
            LIMIT ?
        """
        search_term = f"%{q}%"
        suggestions = await db.fetch_all(query, (search_term, search_term, limit))
        return {"success": True, "data": suggestions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Öneriler alınamadı: {str(e)}")

@api_router.get("/products/{product_id}")
async def get_product(product_id: str):
    """Tek ürün detaylarını getir"""
    try:
        product = await db.fetch_one(
            """
            SELECT p.*, c.name as category_name 
            FROM products p 
            LEFT JOIN categories c ON p.category_id = c.id 
            WHERE p.id = ?
            """, (product_id,)
        )
        if not product:
            raise HTTPException(status_code=404, detail="Ürün bulunamadı")
        return ProductResponse(data=Product(**product))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ürün detayları alınamadı: {str(e)}")

@api_router.post("/products", response_model=ProductResponse)
async def create_product(product: ProductCreate):
    """Yeni ürün oluştur"""
    try:
        product_id = str(uuid.uuid4())
        
        # Barkod kontrolü
        if product.barcode:
            existing = await db.fetch_one(
                "SELECT id FROM products WHERE barcode = ?", (product.barcode,)
            )
            if existing:
                raise HTTPException(status_code=400, detail="Bu barkod zaten kullanılıyor")
        
        await db.execute(
            """
            INSERT INTO products 
            (id, name, barcode, category_id, purchase_price, sale_price, 
             stock_quantity, min_stock_level, unit, description, vat_rate, image_url) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (product_id, product.name, product.barcode, product.category_id,
             product.purchase_price, product.sale_price, product.stock_quantity,
             product.min_stock_level, product.unit, product.description, 
             product.vat_rate, product.image_url)
        )
        
        new_product = await db.fetch_one(
            """
            SELECT p.*, c.name as category_name 
            FROM products p 
            LEFT JOIN categories c ON p.category_id = c.id 
            WHERE p.id = ?
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
            "SELECT * FROM products WHERE id = ?", (product_id,)
        )
        if not existing:
            raise HTTPException(status_code=404, detail="Ürün bulunamadı")
        
        # Güncelleme alanlarını hazırla
        update_fields = []
        update_values = []
        
        for field, value in product.dict(exclude_unset=True).items():
            if field != 'id':  # ID güncellenmez
                update_fields.append(f"{field} = ?")
                update_values.append(value)
        
        if update_fields:
            update_values.append(product_id)
            query = f"UPDATE products SET {', '.join(update_fields)} WHERE id = ?"
            await db.execute(query, tuple(update_values))
        
        # Güncellenmiş ürünü getir
        updated_product = await db.fetch_one(
            """
            SELECT p.*, c.name as category_name 
            FROM products p 
            LEFT JOIN categories c ON p.category_id = c.id 
            WHERE p.id = ?
            """, (product_id,)
        )
        return ProductResponse(data=Product(**updated_product))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Ürün güncellenemedi: {str(e)}")

@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str):
    """Ürün sil"""
    try:
        result = await db.execute("DELETE FROM products WHERE id = ?", (product_id,))
        if result == 0:
            raise HTTPException(status_code=404, detail="Ürün bulunamadı")
        return BaseResponse(message="Ürün başarıyla silindi")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ürün silinemedi: {str(e)}")

# ==== SALES ROUTES ====
@api_router.post("/sales", response_model=SaleResponse)
async def create_sale(sale: SaleCreate):
    """Yeni satış oluştur"""
    try:
        sale_id = str(uuid.uuid4())
        total_amount = 0
        
        # Satış kalemlerini işle ve toplam hesapla
        sale_items = []
        for item_data in sale.items:
            # Ürün bilgilerini al
            product = await db.fetch_one(
                "SELECT * FROM products WHERE id = ?", (item_data['product_id'],)
            )
            if not product:
                raise HTTPException(status_code=404, detail=f"Ürün bulunamadı: {item_data['product_id']}")
            
            # Stok kontrolü
            if product['stock_quantity'] < item_data['quantity']:
                raise HTTPException(
                    status_code=400, 
                    detail=f"{product['name']} için yeterli stok yok. Mevcut: {product['stock_quantity']}, Talep: {item_data['quantity']}"
                )
            
            item_total = item_data['quantity'] * item_data['unit_price']
            total_amount += item_total
            
            sale_item_id = str(uuid.uuid4())
            sale_items.append({
                'id': sale_item_id,
                'sale_id': sale_id,
                'product_id': item_data['product_id'],
                'quantity': item_data['quantity'],
                'unit_price': item_data['unit_price'],
                'total_price': item_total
            })
        
        # Satış kaydını oluştur
        await db.execute(
            """
            INSERT INTO sales (id, customer_id, total_amount, payment_method, 
                             discount_amount, tax_amount, notes) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (sale_id, sale.customer_id, total_amount, sale.payment_method,
             sale.discount_amount, sale.tax_amount, sale.notes)
        )
        
        # Satış kalemlerini kaydet ve stokları güncelle
        for item in sale_items:
            # Satış kalemi kaydet
            await db.execute(
                """
                INSERT INTO sale_items (id, sale_id, product_id, quantity, unit_price, total_price) 
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (item['id'], item['sale_id'], item['product_id'], 
                 item['quantity'], item['unit_price'], item['total_price'])
            )
            
            # Stok güncelle
            await db.execute(
                "UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?",
                (item['quantity'], item['product_id'])
            )
        
        # Müşteri cari hesap işlemi (kredi ile satış ise)
        if sale.payment_method == 'credit' and sale.customer_id:
            # Müşteri bakiyesini güncelle
            await db.execute(
                "UPDATE customers SET balance = balance + ? WHERE id = ?",
                (total_amount, sale.customer_id)
            )
            
            # Cari hesap hareketini kaydet
            transaction_id = str(uuid.uuid4())
            await db.execute(
                """
                INSERT INTO customer_transactions 
                (id, customer_id, transaction_type, amount, description, reference_id) 
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (transaction_id, sale.customer_id, 'sale', total_amount,
                 f"Satış - Fiş No: {sale_id[:8]}", sale_id)
            )
        
        # Oluşturulan satışı ve kalemlerini getir
        created_sale = await db.fetch_one(
            """
            SELECT s.*, c.name as customer_name 
            FROM sales s 
            LEFT JOIN customers c ON s.customer_id = c.id 
            WHERE s.id = ?
            """, (sale_id,)
        )
        
        # Satış kalemlerini getir
        sale_items = await db.fetch_all(
            """
            SELECT si.*, p.name as product_name, p.vat_rate
            FROM sale_items si
            JOIN products p ON si.product_id = p.id
            WHERE si.sale_id = ?
            """, (sale_id,)
        )
        
        # Sale nesnesini oluştur ve items'ları ekle
        sale_data = Sale(**created_sale)
        sale_data.items = [SaleItem(**item) for item in sale_items]
        
        return SaleResponse(
            data=sale_data,
            message=f"Satış başarıyla tamamlandı. Toplam: {total_amount:.2f} TL"
        )
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Satış tamamlanamadı: {str(e)}")

@api_router.get("/sales", response_model=SaleListResponse)
async def get_sales():
    """Tüm satışları getir"""
    try:
        sales = await db.fetch_all(
            """
            SELECT s.*, c.name as customer_name 
            FROM sales s 
            LEFT JOIN customers c ON s.customer_id = c.id 
            ORDER BY s.created_at DESC
            """
        )
        return SaleListResponse(data=[Sale(**sale) for sale in sales])
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Satışlar alınamadı: {str(e)}")

@api_router.get("/sales/{sale_id}/items")
async def get_sale_items(sale_id: str):
    """Satış kalemlerini getir"""
    try:
        items = await db.fetch_all(
            """
            SELECT si.*, p.name as product_name, p.unit
            FROM sale_items si
            JOIN products p ON si.product_id = p.id
            WHERE si.sale_id = ?
            """, (sale_id,)
        )
        return {"success": True, "data": items}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Satış kalemleri alınamadı: {str(e)}")

# ==== CUSTOMER ROUTES ====
@api_router.get("/customers/{customer_id}/transactions")
async def get_customer_transactions(customer_id: str):
    """Müşteri cari hesap hareketlerini getir"""
    try:
        transactions = await db.fetch_all(
            """
            SELECT ct.*, s.total_amount as sale_amount
            FROM customer_transactions ct
            LEFT JOIN sales s ON ct.reference_id = s.id
            WHERE ct.customer_id = ?
            ORDER BY ct.created_at DESC
            """, (customer_id,)
        )
        return {"success": True, "data": transactions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Müşteri hareketleri alınamadı: {str(e)}")

@api_router.post("/customers/{customer_id}/transactions")
async def add_customer_transaction(customer_id: str, transaction: TransactionCreate):
    """Manuel borç/ödeme ekleme"""
    try:
        # Müşteri var mı kontrol et
        customer = await db.fetch_one("SELECT * FROM customers WHERE id = ?", (customer_id,))
        if not customer:
            raise HTTPException(status_code=404, detail="Müşteri bulunamadı")
        
        transaction_id = str(uuid.uuid4())
        
        # Transaction kaydet
        await db.execute(
            """
            INSERT INTO customer_transactions 
            (id, customer_id, transaction_type, amount, description) 
            VALUES (?, ?, ?, ?, ?)
            """,
            (transaction_id, customer_id, transaction.transaction_type, 
             transaction.amount, transaction.description)
        )
        
        # Müşteri bakiyesini güncelle
        if transaction.transaction_type in ['debt', 'manual_debt']:
            # Borç artırır
            await db.execute(
                "UPDATE customers SET balance = balance + ? WHERE id = ?",
                (transaction.amount, customer_id)
            )
        elif transaction.transaction_type == 'payment':
            # Ödeme borcu azaltır
            await db.execute(
                "UPDATE customers SET balance = balance - ? WHERE id = ?", 
                (transaction.amount, customer_id)
            )
        
        # Oluşturulan transaction'ı getir
        new_transaction = await db.fetch_one(
            "SELECT * FROM customer_transactions WHERE id = ?", (transaction_id,)
        )
        
        return TransactionResponse(
            data=CustomerTransaction(**new_transaction),
            message="Hareket başarıyla eklendi"
        )
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Hareket eklenemedi: {str(e)}")

@api_router.get("/customers/{customer_id}")
async def get_customer_detail(customer_id: str):
    """Müşteri detay ve bakiye bilgisi"""
    try:
        customer = await db.fetch_one("SELECT * FROM customers WHERE id = ?", (customer_id,))
        if not customer:
            raise HTTPException(status_code=404, detail="Müşteri bulunamadı")
        
        # Son hareketleri de al
        recent_transactions = await db.fetch_all(
            """
            SELECT ct.*, s.total_amount as sale_amount
            FROM customer_transactions ct
            LEFT JOIN sales s ON ct.reference_id = s.id
            WHERE ct.customer_id = ?
            ORDER BY ct.created_at DESC
            LIMIT 10
            """, (customer_id,)
        )
        
        customer_data = Customer(**customer)
        return {
            "success": True,
            "data": {
                "customer": customer_data,
                "recent_transactions": recent_transactions,
                "total_debt": customer['balance'],
                "transaction_count": len(recent_transactions)
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Müşteri detayları alınamadı: {str(e)}")

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
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (customer_id, customer.name, customer.phone, customer.email, 
             customer.address, customer.tax_number)
        )
        
        new_customer = await db.fetch_one(
            "SELECT * FROM customers WHERE id = ?", (customer_id,)
        )
        return CustomerResponse(data=Customer(**new_customer))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Müşteri oluşturulamadı: {str(e)}")

@api_router.put("/customers/{customer_id}", response_model=CustomerResponse)
async def update_customer(customer_id: str, customer: CustomerCreate):
    """Müşteri güncelle"""
    try:
        # Mevcut müşteriyi kontrol et
        existing = await db.fetch_one("SELECT * FROM customers WHERE id = ?", (customer_id,))
        if not existing:
            raise HTTPException(status_code=404, detail="Müşteri bulunamadı")
        
        # Müşteriyi güncelle
        await db.execute(
            """
            UPDATE customers 
            SET name = ?, phone = ?, email = ?, address = ?, tax_number = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
            """,
            (customer.name, customer.phone, customer.email, customer.address, 
             customer.tax_number, customer_id)
        )
        
        # Güncellenmiş müşteriyi getir
        updated_customer = await db.fetch_one(
            "SELECT * FROM customers WHERE id = ?", (customer_id,)
        )
        return CustomerResponse(data=Customer(**updated_customer))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Müşteri güncellenemedi: {str(e)}")

@api_router.delete("/customers/{customer_id}")
async def delete_customer(customer_id: str):
    """Müşteri sil (tüm hareketleri ile birlikte)"""
    try:
        # Önce müşteriyi kontrol et
        customer = await db.fetch_one("SELECT * FROM customers WHERE id = ?", (customer_id,))
        if not customer:
            raise HTTPException(status_code=404, detail="Müşteri bulunamadı")
        
        # Müşteri hareketlerini sil
        await db.execute("DELETE FROM customer_transactions WHERE customer_id = ?", (customer_id,))
        
        # Müşteriyi sil
        result = await db.execute("DELETE FROM customers WHERE id = ?", (customer_id,))
        
        if result == 0:
            raise HTTPException(status_code=404, detail="Müşteri bulunamadı")
        
        return BaseResponse(message="Müşteri ve tüm hareketleri başarıyla silindi")
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Müşteri silinemedi: {str(e)}")

@api_router.delete("/customers/{customer_id}/transactions/{transaction_id}")
async def delete_customer_transaction(customer_id: str, transaction_id: str):
    """Müşteri hareketi sil ve bakiye güncelle"""
    try:
        # Transaction'ı al
        transaction = await db.fetch_one(
            "SELECT * FROM customer_transactions WHERE id = ? AND customer_id = ?",
            (transaction_id, customer_id)
        )
        if not transaction:
            raise HTTPException(status_code=404, detail="Hareket bulunamadı")
        
        # Bakiye güncellemesi için ters işlem yap
        if transaction['transaction_type'] in ['debt', 'manual_debt', 'sale']:
            # Borç kaydı siliniyor, bakiyeden düş
            await db.execute(
                "UPDATE customers SET balance = balance - ? WHERE id = ?",
                (transaction['amount'], customer_id)
            )
        elif transaction['transaction_type'] == 'payment':
            # Ödeme kaydı siliniyor, bakiyeye ekle
            await db.execute(
                "UPDATE customers SET balance = balance + ? WHERE id = ?",
                (transaction['amount'], customer_id)
            )
        
        # Transaction'ı sil
        await db.execute(
            "DELETE FROM customer_transactions WHERE id = ?", (transaction_id,)
        )
        
        return BaseResponse(message="Hareket başarıyla silindi ve bakiye güncellendi")
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Hareket silinemedi: {str(e)}")

# ==== REPORTS ROUTES ====
@api_router.get("/reports/sales")
async def get_sales_report(start_date: str = None, end_date: str = None):
    """Satış raporu - tarih aralığına göre"""
    try:
        # Varsayılan tarih aralığı: son 30 gün
        if not start_date:
            start_date = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')
        if not end_date:
            end_date = datetime.now().strftime('%Y-%m-%d')
        
        # Satış özeti
        sales_summary = await db.fetch_one(
            """
            SELECT 
                COUNT(*) as total_sales,
                SUM(total_amount) as total_revenue,
                AVG(total_amount) as avg_sale_amount,
                SUM(CASE WHEN payment_method = 'cash' THEN total_amount ELSE 0 END) as cash_sales,
                SUM(CASE WHEN payment_method = 'card' THEN total_amount ELSE 0 END) as card_sales,
                SUM(CASE WHEN payment_method = 'credit' THEN total_amount ELSE 0 END) as credit_sales
            FROM sales 
            WHERE DATE(created_at) BETWEEN ? AND ?
            """, (start_date, end_date)
        )
        
        # Günlük bazda satışlar
        daily_sales = await db.fetch_all(
            """
            SELECT 
                DATE(created_at) as sale_date,
                COUNT(*) as sale_count,
                SUM(total_amount) as daily_revenue
            FROM sales 
            WHERE DATE(created_at) BETWEEN ? AND ?
            GROUP BY DATE(created_at)
            ORDER BY sale_date DESC
            """, (start_date, end_date)
        )
        
        # En çok satılan ürünler
        top_products = await db.fetch_all(
            """
            SELECT 
                p.name as product_name,
                p.sale_price,
                SUM(si.quantity) as total_quantity,
                SUM(si.total_price) as total_sales_amount,
                COUNT(DISTINCT si.sale_id) as sale_count
            FROM sale_items si
            JOIN products p ON si.product_id = p.id
            JOIN sales s ON si.sale_id = s.id
            WHERE DATE(s.created_at) BETWEEN ? AND ?
            GROUP BY p.id, p.name, p.sale_price
            ORDER BY total_quantity DESC
            LIMIT 10
            """, (start_date, end_date)
        )
        
        return {
            "success": True,
            "data": {
                "period": {"start_date": start_date, "end_date": end_date},
                "summary": sales_summary,
                "daily_sales": daily_sales,
                "top_products": top_products
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Satış raporu alınamadı: {str(e)}")

@api_router.get("/reports/inventory")
async def get_inventory_report():
    """Stok raporu"""
    try:
        # Düşük stok ürünleri
        low_stock = await db.fetch_all(
            """
            SELECT p.*, c.name as category_name
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.stock_quantity <= p.min_stock_level AND p.is_active = 1
            ORDER BY (p.stock_quantity - p.min_stock_level) ASC
            """
        )
        
        # Stok değeri
        inventory_value = await db.fetch_one(
            """
            SELECT 
                SUM(p.stock_quantity * p.purchase_price) as total_purchase_value,
                SUM(p.stock_quantity * p.sale_price) as total_sale_value,
                COUNT(*) as total_products,
                SUM(p.stock_quantity) as total_items
            FROM products p 
            WHERE p.is_active = 1
            """
        )
        
        # Kategori bazlı stok
        category_stock = await db.fetch_all(
            """
            SELECT 
                c.name as category_name,
                COUNT(p.id) as product_count,
                SUM(p.stock_quantity) as total_quantity,
                SUM(p.stock_quantity * p.sale_price) as total_value
            FROM products p
            JOIN categories c ON p.category_id = c.id
            WHERE p.is_active = 1
            GROUP BY c.id, c.name
            ORDER BY total_value DESC
            """
        )
        
        return {
            "success": True,
            "data": {
                "inventory_summary": inventory_value,
                "low_stock_products": low_stock,
                "category_breakdown": category_stock
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Stok raporu alınamadı: {str(e)}")

@api_router.get("/reports/customers")
async def get_customer_report():
    """Müşteri analiz raporu"""
    try:
        # Müşteri özeti
        customer_summary = await db.fetch_one(
            """
            SELECT 
                COUNT(*) as total_customers,
                SUM(CASE WHEN balance > 0 THEN 1 ELSE 0 END) as customers_with_debt,
                SUM(CASE WHEN balance > 0 THEN balance ELSE 0 END) as total_debt,
                SUM(CASE WHEN balance < 0 THEN ABS(balance) ELSE 0 END) as total_credit,
                AVG(balance) as avg_balance
            FROM customers
            WHERE is_active = 1
            """
        )
        
        # En borçlu müşteriler
        top_debtors = await db.fetch_all(
            """
            SELECT name, phone, balance, created_at
            FROM customers 
            WHERE balance > 0 AND is_active = 1
            ORDER BY balance DESC
            LIMIT 10
            """
        )
        
        # En çok alışveriş yapan müşteriler
        top_buyers = await db.fetch_all(
            """
            SELECT 
                c.name,
                c.phone,
                COUNT(s.id) as total_sales,
                SUM(s.total_amount) as total_spent
            FROM customers c
            JOIN sales s ON c.id = s.customer_id
            WHERE c.is_active = 1
            GROUP BY c.id, c.name, c.phone
            ORDER BY total_spent DESC
            LIMIT 10
            """
        )
        
        return {
            "success": True,
            "data": {
                "customer_summary": customer_summary,
                "top_debtors": top_debtors,
                "top_buyers": top_buyers
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Müşteri raporu alınamadı: {str(e)}")

@api_router.get("/reports/dashboard")
async def get_dashboard_stats():
    """Ana sayfa dashboard istatistikleri"""
    try:
        today = datetime.now().strftime('%Y-%m-%d')
        
        # Bugünkü satışlar
        today_stats = await db.fetch_one(
            """
            SELECT 
                COUNT(*) as today_sales,
                COALESCE(SUM(total_amount), 0) as today_revenue
            FROM sales 
            WHERE DATE(created_at) = ?
            """, (today,)
        )
        
        # Genel istatistikler
        general_stats = await db.fetch_all(
            """
            SELECT 
                'products' as type, COUNT(*) as count FROM products WHERE is_active = 1
            UNION ALL
            SELECT 
                'customers' as type, COUNT(*) as count FROM customers WHERE is_active = 1
            UNION ALL
            SELECT 
                'low_stock' as type, COUNT(*) as count FROM products 
                WHERE stock_quantity <= min_stock_level AND is_active = 1
            """
        )
        
        # Son 7 günlük satış trendi
        weekly_trend = await db.fetch_all(
            """
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as sales_count,
                SUM(total_amount) as revenue
            FROM sales 
            WHERE created_at >= date('now', '-7 days')
            GROUP BY DATE(created_at)
            ORDER BY date ASC
            """
        )
        
        return {
            "success": True,
            "data": {
                "today": today_stats,
                "general": {stat['type']: stat['count'] for stat in general_stats},
                "weekly_trend": weekly_trend
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Dashboard istatistikleri alınamadı: {str(e)}")

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