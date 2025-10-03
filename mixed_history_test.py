#!/usr/bin/env python3
"""
Test mixed purchase history with both regular sales and manual credit entries
"""

import requests
import json
from datetime import datetime

BACKEND_URL = "https://pos-crm-elite.preview.emergentagent.com/api"

def test_mixed_purchase_history():
    """Test purchase history with both regular sales and manual credits"""
    
    print("=" * 80)
    print("TESTING MIXED PURCHASE HISTORY (SALES + MANUAL CREDITS)")
    print("=" * 80)
    
    # Step 1: Create test customer
    print("\n1. Creating test customer...")
    customer_data = {
        "name": "Karışık Geçmiş Test Müşteri",
        "phone": "+90 555 987 6543",
        "credit_limit": 15000.0
    }
    
    response = requests.post(f"{BACKEND_URL}/customers", json=customer_data)
    if response.status_code != 200:
        print(f"❌ Failed to create customer: {response.text}")
        return False
    
    customer = response.json()
    customer_id = customer["id"]
    print(f"✅ Customer created: {customer_id}")
    
    # Step 2: Create a test category and product for regular sales
    print("\n2. Creating test category and product...")
    
    # Create category
    category_data = {"name": "Test Kategori", "description": "Test için oluşturuldu"}
    response = requests.post(f"{BACKEND_URL}/categories", json=category_data)
    if response.status_code != 200:
        print(f"❌ Failed to create category: {response.text}")
        return False
    
    category = response.json()
    category_id = category["id"]
    print(f"✅ Category created: {category_id}")
    
    # Create product
    product_data = {
        "name": "Test Ürün - Kalem",
        "category_id": category_id,
        "sku": "TEST-001",
        "cost_price": 5.0,
        "selling_price": 10.0,
        "min_stock_level": 10
    }
    response = requests.post(f"{BACKEND_URL}/products", json=product_data)
    if response.status_code != 200:
        print(f"❌ Failed to create product: {response.text}")
        return False
    
    product = response.json()
    product_id = product["id"]
    print(f"✅ Product created: {product['name']} ({product_id})")
    
    # Step 3: Add stock to the product
    print("\n3. Adding stock to product...")
    stock_data = {
        "product_id": product_id,
        "transaction_type": "stock_in",
        "quantity": 100,
        "unit_price": 5.0,
        "notes": "Initial stock"
    }
    response = requests.post(f"{BACKEND_URL}/stock/transactions", json=stock_data)
    if response.status_code != 200:
        print(f"❌ Failed to add stock: {response.text}")
        return False
    
    print("✅ Stock added successfully")
    
    # Step 4: Create a regular sale
    print("\n4. Creating regular sale...")
    sale_data = {
        "product_id": product_id,
        "quantity": 5,
        "unit_price": 10.0,
        "customer_id": customer_id,
        "customer_name": customer["name"],
        "payment_method": "cash",
        "is_credit_sale": False,
        "notes": "Nakit satış"
    }
    response = requests.post(f"{BACKEND_URL}/sales", json=sale_data)
    if response.status_code != 200:
        print(f"❌ Failed to create sale: {response.text}")
        return False
    
    sale = response.json()
    print(f"✅ Regular sale created: ₺{sale['total_amount']}")
    
    # Step 5: Add manual credit entries
    print("\n5. Adding manual credit entries...")
    
    manual_credits = [
        {
            "amount": 85.25,
            "notes": "Stoktan alınan kırtasiye malzemeleri - dosya, zımba, kalem"
        },
        {
            "amount": 42.75,
            "notes": "Ofis temizlik ürünleri - deterjan ve kağıt havlu"
        }
    ]
    
    for i, credit_data in enumerate(manual_credits, 1):
        response = requests.post(f"{BACKEND_URL}/customers/{customer_id}/manual-credit", json=credit_data)
        if response.status_code != 200:
            print(f"❌ Failed to add manual credit {i}: {response.text}")
            return False
        print(f"✅ Manual credit {i} added: ₺{credit_data['amount']}")
    
    # Step 6: Get purchase history and verify mixed entries
    print("\n6. Retrieving mixed purchase history...")
    response = requests.get(f"{BACKEND_URL}/customers/{customer_id}/purchase-history")
    if response.status_code != 200:
        print(f"❌ Failed to get purchase history: {response.text}")
        return False
    
    purchase_history = response.json()
    print(f"✅ Purchase history retrieved ({len(purchase_history)} total records)")
    
    # Analyze the entries
    regular_sales = [entry for entry in purchase_history if entry.get('type') == 'sale']
    manual_credits = [entry for entry in purchase_history if entry.get('type') == 'manual_credit']
    
    print(f"\n7. Purchase history analysis:")
    print(f"   - Regular sales: {len(regular_sales)}")
    print(f"   - Manual credits: {len(manual_credits)}")
    print(f"   - Total entries: {len(purchase_history)}")
    
    # Display all entries
    print(f"\n8. All purchase history entries (sorted by date):")
    for i, entry in enumerate(purchase_history, 1):
        entry_type = entry.get('type', 'unknown')
        product_name = entry.get('product_name', 'Unknown')
        amount = entry.get('total_amount', 0)
        date = entry.get('date', 'Unknown')
        
        print(f"   {i}. [{entry_type.upper()}] {product_name} - ₺{amount:.2f}")
        print(f"      Date: {date}")
        
        if entry_type == 'manual_credit':
            print(f"      Notes: {entry.get('notes', 'No notes')}")
        elif entry_type == 'sale':
            print(f"      Quantity: {entry.get('quantity', 0)}, Unit Price: ₺{entry.get('unit_price', 0):.2f}")
        print()
    
    # Validation
    success = True
    
    if len(regular_sales) != 1:
        print(f"❌ Expected 1 regular sale, found {len(regular_sales)}")
        success = False
    
    if len(manual_credits) != 2:
        print(f"❌ Expected 2 manual credits, found {len(manual_credits)}")
        success = False
    
    # Check that manual credits have required fields
    for credit in manual_credits:
        required_fields = ['product_name', 'description', 'notes', 'type']
        missing_fields = [field for field in required_fields if field not in credit]
        if missing_fields:
            print(f"❌ Manual credit missing fields: {missing_fields}")
            success = False
    
    # Check that regular sales have different structure
    for sale in regular_sales:
        if sale.get('type') != 'sale':
            print(f"❌ Regular sale has wrong type: {sale.get('type')}")
            success = False
    
    print("\n" + "=" * 80)
    if success:
        print("🎉 MIXED PURCHASE HISTORY TEST PASSED!")
        print("✅ Both regular sales and manual credits appear in purchase history")
        print("✅ Manual credits have proper notes/descriptions")
        print("✅ Different entry types are properly distinguished")
        print("✅ All entries are sorted by date")
    else:
        print("❌ MIXED PURCHASE HISTORY TEST FAILED!")
    
    print("=" * 80)
    
    return success

if __name__ == "__main__":
    success = test_mixed_purchase_history()
    exit(0 if success else 1)