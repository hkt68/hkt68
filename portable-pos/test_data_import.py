#!/usr/bin/env python3
"""
Elite Medya POS - Test Verisi İmport Aracı
Web uygulamasından veri çekmek için kullanın
"""

import json
import requests
import os
from datetime import datetime

def import_from_web():
    """Web API'den veri çek ve local dosyalara kaydet"""
    
    # Web API URL'i
    WEB_API_URL = "https://pos-crm-elite.preview.emergentagent.com/api"
    
    print("🌐 Web uygulamasından veri çekiliyor...")
    print(f"📡 API: {WEB_API_URL}")
    
    try:
        # Backup endpoint'den veri al
        backup_url = f"{WEB_API_URL}/backup/export"
        
        print(f"📥 Veri indiriliyor: {backup_url}")
        response = requests.get(backup_url, timeout=30)
        response.raise_for_status()
        
        backup_data = response.json()
        
        if 'data' not in backup_data:
            raise ValueError("Geçersiz veri formatı!")
        
        print("✅ Veri başarıyla alındı!")
        
        # Data klasörü oluştur
        data_path = os.path.join(os.path.dirname(__file__), 'data')
        if not os.path.exists(data_path):
            os.makedirs(data_path)
            print(f"📁 Data klasörü oluşturuldu: {data_path}")
        
        # Veri mapping ve dönüştürme
        web_data = backup_data['data']
        imported_counts = {}
        
        # Customers
        if 'customers' in web_data:
            customers = []
            for c in web_data['customers']:
                customer = {
                    "id": c.get('id', f"cust_{len(customers)+1:03d}"),
                    "name": c.get('name', ''),
                    "phone": c.get('phone', ''),
                    "email": c.get('email', ''),
                    "address": c.get('address', ''),
                    "credit_limit": c.get('credit_limit', 0.0),
                    "notes": c.get('notes', ''),
                    "created_at": c.get('created_at', datetime.now().isoformat())
                }
                customers.append(customer)
            
            # Dosyaya kaydet
            with open(os.path.join(data_path, 'customers.json'), 'w', encoding='utf-8') as f:
                json.dump(customers, f, ensure_ascii=False, indent=2, default=str)
            
            imported_counts['customers'] = len(customers)
            print(f"👥 Müşteriler: {len(customers)} kayıt kaydedildi")
        
        # Products
        if 'products' in web_data:
            products = []
            for p in web_data['products']:
                product = {
                    "id": p.get('id', f"prod_{len(products)+1:03d}"),
                    "name": p.get('name', ''),
                    "barcode": p.get('barcode', ''),
                    "price": p.get('selling_price', p.get('price', 0.0)),
                    "stock": p.get('current_stock', p.get('stock', 0)),
                    "created_at": p.get('created_at', datetime.now().isoformat())
                }
                products.append(product)
            
            with open(os.path.join(data_path, 'products.json'), 'w', encoding='utf-8') as f:
                json.dump(products, f, ensure_ascii=False, indent=2, default=str)
            
            imported_counts['products'] = len(products)
            print(f"📦 Ürünler: {len(products)} kayıt kaydedildi")
        
        # Credit Sales
        if 'credit_sales' in web_data:
            credit_sales = []
            for cs in web_data['credit_sales']:
                credit_sale = {
                    "id": cs.get('id', f"credit_{len(credit_sales)+1:03d}"),
                    "customer_id": cs.get('customer_id', ''),
                    "total_amount": cs.get('total_amount', 0.0),
                    "remaining_amount": cs.get('remaining_amount', 0.0),
                    "due_date": cs.get('due_date', ''),
                    "payment_status": cs.get('payment_status', 'unpaid'),
                    "notes": cs.get('notes', ''),
                    "created_at": cs.get('created_at', datetime.now().isoformat())
                }
                credit_sales.append(credit_sale)
            
            with open(os.path.join(data_path, 'credit_sales.json'), 'w', encoding='utf-8') as f:
                json.dump(credit_sales, f, ensure_ascii=False, indent=2, default=str)
            
            imported_counts['credit_sales'] = len(credit_sales)
            print(f"💳 Borçlar: {len(credit_sales)} kayıt kaydedildi")
        
        # Payments
        if 'payments' in web_data:
            payments = []
            for p in web_data['payments']:
                payment = {
                    "id": p.get('id', f"pay_{len(payments)+1:03d}"),
                    "customer_id": p.get('customer_id', ''),
                    "amount": p.get('amount', 0.0),
                    "payment_method": p.get('payment_method', 'cash'),
                    "notes": p.get('notes', ''),
                    "created_at": p.get('created_at', datetime.now().isoformat())
                }
                payments.append(payment)
            
            with open(os.path.join(data_path, 'payments.json'), 'w', encoding='utf-8') as f:
                json.dump(payments, f, ensure_ascii=False, indent=2, default=str)
            
            imported_counts['payments'] = len(payments)
            print(f"💰 Ödemeler: {len(payments)} kayıt kaydedildi")
        
        # Boş dosyalar için defaults
        for filename in ['customers.json', 'products.json', 'credit_sales.json', 'payments.json']:
            filepath = os.path.join(data_path, filename)
            if not os.path.exists(filepath):
                with open(filepath, 'w', encoding='utf-8') as f:
                    json.dump([], f)
        
        # Settings dosyası
        settings = {
            "company_name": "Elite Medya Bilişim",
            "currency": "TRY", 
            "version": "2.0",
            "web_api_url": WEB_API_URL,
            "last_sync": datetime.now().isoformat()
        }
        
        with open(os.path.join(data_path, 'settings.json'), 'w', encoding='utf-8') as f:
            json.dump(settings, f, ensure_ascii=False, indent=2, default=str)
        
        print("⚙️ Ayarlar kaydedildi")
        
        total_records = sum(imported_counts.values())
        
        print("\n" + "="*50)
        print(f"🎉 İMPORT TAMAMLANDI!")
        print(f"📊 Toplam: {total_records} kayıt")
        print(f"📁 Konum: {data_path}")
        print("="*50)
        
        for data_type, count in imported_counts.items():
            print(f"  • {data_type.title()}: {count} kayıt")
            
        print(f"\n💡 Şimdi 'python main.py' komutu ile uygulamayı başlatabilirsiniz!")
        
    except requests.exceptions.RequestException as e:
        print(f"❌ Bağlantı hatası: {e}")
        print("🔧 Çözüm önerileri:")
        print("  1. İnternet bağlantınızı kontrol edin")
        print("  2. Web API URL'nin doğru olduğunu kontrol edin")
        print("  3. Firewall ayarlarını kontrol edin")
        
    except Exception as e:
        print(f"❌ Hata: {e}")

if __name__ == "__main__":
    import_from_web()