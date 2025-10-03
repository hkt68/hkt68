#!/usr/bin/env python3
"""
Specific test for manual credit entries in purchase history
Testing the updated purchase history endpoint for Elite Medya POS system
"""

import requests
import json
from datetime import datetime

# Backend URL
BACKEND_URL = "https://elite-pos-1.preview.emergentagent.com/api"

def test_manual_credit_purchase_history():
    """Test the specific requirements from the review request"""
    
    print("=" * 80)
    print("TESTING MANUAL CREDIT ENTRIES IN PURCHASE HISTORY")
    print("=" * 80)
    
    # Step 1: Create a test customer
    print("\n1. Creating test customer...")
    customer_data = {
        "name": "Test Müşteri - Manuel Kredi",
        "phone": "+90 555 123 4567",
        "credit_limit": 10000.0,
        "notes": "Manuel kredi testi için oluşturuldu"
    }
    
    response = requests.post(f"{BACKEND_URL}/customers", json=customer_data)
    if response.status_code != 200:
        print(f"❌ Failed to create customer: {response.text}")
        return False
    
    customer = response.json()
    customer_id = customer["id"]
    print(f"✅ Customer created: {customer['name']} (ID: {customer_id})")
    
    # Step 2: Add manual credit with specific notes as per review request
    print("\n2. Adding manual credit with detailed notes...")
    credit_data = {
        "amount": 75.50,
        "notes": "Stoktan alınan ofis malzemeleri - 3 adet kalem, 2 adet defter"
    }
    
    response = requests.post(f"{BACKEND_URL}/customers/{customer_id}/manual-credit", json=credit_data)
    if response.status_code != 200:
        print(f"❌ Failed to add manual credit: {response.text}")
        return False
    
    manual_credit = response.json()
    print(f"✅ Manual credit added: ₺{credit_data['amount']}")
    print(f"   Notes: {credit_data['notes']}")
    
    # Step 3: Verify purchase history includes manual credit with proper fields
    print("\n3. Verifying purchase history includes manual credit with notes...")
    response = requests.get(f"{BACKEND_URL}/customers/{customer_id}/purchase-history")
    if response.status_code != 200:
        print(f"❌ Failed to get purchase history: {response.text}")
        return False
    
    purchase_history = response.json()
    print(f"✅ Purchase history retrieved ({len(purchase_history)} records)")
    
    # Find manual credit entry
    manual_credit_entry = None
    for entry in purchase_history:
        if entry.get('type') == 'manual_credit':
            manual_credit_entry = entry
            break
    
    if not manual_credit_entry:
        print("❌ Manual credit entry not found in purchase history")
        return False
    
    print("\n4. Validating manual credit entry fields...")
    
    # Check required fields as per review request
    required_checks = [
        ("product_name", "Manuel Borç Girişi", "Product name should be 'Manuel Borç Girişi'"),
        ("description", credit_data["notes"], "Description should contain the notes"),
        ("notes", credit_data["notes"], "Notes should match the input notes"),
        ("type", "manual_credit", "Type should be 'manual_credit'"),
        ("total_amount", 75.50, "Amount should match the input amount")
    ]
    
    all_checks_passed = True
    for field, expected_value, description in required_checks:
        actual_value = manual_credit_entry.get(field)
        if actual_value == expected_value:
            print(f"✅ {field}: {actual_value} - {description}")
        else:
            print(f"❌ {field}: Expected '{expected_value}', got '{actual_value}' - {description}")
            all_checks_passed = False
    
    # Display the complete manual credit entry
    print("\n5. Complete manual credit entry details:")
    print(json.dumps(manual_credit_entry, indent=2, default=str))
    
    # Step 4: Test with another manual credit to ensure multiple entries work
    print("\n6. Adding second manual credit entry...")
    credit_data_2 = {
        "amount": 125.75,
        "notes": "Temizlik malzemeleri - deterjan, kağıt havlu, çöp torbası"
    }
    
    response = requests.post(f"{BACKEND_URL}/customers/{customer_id}/manual-credit", json=credit_data_2)
    if response.status_code != 200:
        print(f"❌ Failed to add second manual credit: {response.text}")
        return False
    
    print(f"✅ Second manual credit added: ₺{credit_data_2['amount']}")
    
    # Verify both entries appear in purchase history
    response = requests.get(f"{BACKEND_URL}/customers/{customer_id}/purchase-history")
    purchase_history = response.json()
    
    manual_credit_count = sum(1 for entry in purchase_history if entry.get('type') == 'manual_credit')
    print(f"✅ Purchase history now contains {manual_credit_count} manual credit entries")
    
    if manual_credit_count != 2:
        print(f"❌ Expected 2 manual credit entries, found {manual_credit_count}")
        all_checks_passed = False
    
    # Display all entries
    print("\n7. All purchase history entries:")
    for i, entry in enumerate(purchase_history, 1):
        print(f"   Entry {i}: {entry.get('product_name')} - ₺{entry.get('total_amount')} ({entry.get('type')})")
        if entry.get('type') == 'manual_credit':
            print(f"            Notes: {entry.get('notes')}")
    
    print("\n" + "=" * 80)
    if all_checks_passed:
        print("🎉 ALL TESTS PASSED - Manual credit entries working correctly!")
        print("✅ Manual credit entries appear in purchase history")
        print("✅ All required fields present (product_name, description, notes, type)")
        print("✅ Notes/descriptions are properly displayed")
        print("✅ Multiple manual credit entries supported")
    else:
        print("❌ SOME TESTS FAILED - Check the issues above")
    
    print("=" * 80)
    
    return all_checks_passed

if __name__ == "__main__":
    success = test_manual_credit_purchase_history()
    exit(0 if success else 1)