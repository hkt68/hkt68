#!/usr/bin/env python3
"""
Backend API Testing for Elite Medya POS System - New Enhancements
Tests the 4 new features:
1. Overdue Debt Display in Customer List
2. System Backup & Restore
3. Overpayment Support
4. Delete Operations
"""

import requests
import json
import sys
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, Optional
import uuid

# Backend URL from environment
BACKEND_URL = "https://pos-crm-elite.preview.emergentagent.com/api"

class ElitePOSEnhancementsTester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.test_customer_id = None
        self.test_credit_sale_id = None
        self.test_payment_id = None
        self.test_sale_id = None
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })
        
    def log(self, message: str, level: str = "INFO"):
        """Log test messages with timestamp"""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        print(f"[{timestamp}] [{level}] {message}")
        
    def make_request(self, method: str, endpoint: str, data: Optional[Dict] = None) -> Dict[str, Any]:
        """Make HTTP request and handle response"""
        url = f"{self.base_url}{endpoint}"
        
        try:
            if method.upper() == "GET":
                response = self.session.get(url)
            elif method.upper() == "POST":
                response = self.session.post(url, json=data)
            elif method.upper() == "PUT":
                response = self.session.put(url, json=data)
            elif method.upper() == "DELETE":
                response = self.session.delete(url)
            else:
                raise ValueError(f"Unsupported HTTP method: {method}")
                
            self.log(f"{method} {url} - Status: {response.status_code}")
            
            if response.status_code >= 400:
                self.log(f"Error Response: {response.text}", "ERROR")
                
            return {
                "status_code": response.status_code,
                "data": response.json() if response.content else None,
                "success": 200 <= response.status_code < 300
            }
            
        except requests.exceptions.RequestException as e:
            self.log(f"Request failed: {str(e)}", "ERROR")
            return {
                "status_code": 0,
                "data": None,
                "success": False,
                "error": str(e)
            }
        except json.JSONDecodeError as e:
            self.log(f"JSON decode error: {str(e)}", "ERROR")
            return {
                "status_code": response.status_code,
                "data": None,
                "success": False,
                "error": "Invalid JSON response"
            }

    def setup_test_data(self) -> bool:
        """Create test customer and overdue credit for testing"""
        self.log("Setting up test data...")
        
        # Create test customer
        customer_data = {
            "name": "Mehmet Özkan Test Müşteri",
            "phone": "+90 532 987 6543",
            "email": "mehmet.ozkan@test.com",
            "address": "Test Mahallesi, Test Caddesi No:15, Ankara",
            "tax_number": "9876543210",
            "credit_limit": 10000.0,
            "notes": "Test müşterisi - POS enhancements testi için"
        }
        
        result = self.make_request("POST", "/customers", customer_data)
        
        if result["success"]:
            self.test_customer_id = result["data"]["id"]
            self.log(f"✅ Test customer created with ID: {self.test_customer_id}")
        else:
            self.log(f"❌ Failed to create test customer: {result.get('error', 'Unknown error')}", "ERROR")
            return False
        
        # Create overdue manual credit (past due date)
        past_due_date = (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d")
        credit_data = {
            "amount": 250.75,
            "due_date": past_due_date,
            "notes": "Overdue test credit - 30 days past due"
        }
        
        result = self.make_request("POST", f"/customers/{self.test_customer_id}/manual-credit", credit_data)
        
        if result["success"]:
            self.test_credit_sale_id = result["data"]["id"]
            self.log(f"✅ Overdue credit created: ₺{credit_data['amount']} (due: {past_due_date})")
            return True
        else:
            self.log(f"❌ Failed to create overdue credit: {result.get('error', 'Unknown error')}", "ERROR")
            return False

    # FEATURE 1: Overdue Debt Display in Customer List
    def test_overdue_debt_display(self) -> bool:
        """Test GET /api/customers endpoint for overdue debt information"""
        self.log("=" * 60)
        self.log("FEATURE 1: Testing Overdue Debt Display in Customer List")
        self.log("=" * 60)
        
        result = self.make_request("GET", "/customers")
        
        if not result["success"]:
            self.log(f"❌ Failed to get customers list: {result.get('error', 'Unknown error')}", "ERROR")
            return False
        
        customers = result["data"]
        self.log(f"✅ Retrieved {len(customers)} customers")
        
        # Find our test customer
        test_customer = None
        for customer in customers:
            if customer.get("id") == self.test_customer_id:
                test_customer = customer
                break
        
        if not test_customer:
            self.log("❌ Test customer not found in customers list", "ERROR")
            return False
        
        # Verify required fields for overdue debt display
        required_fields = ["has_overdue", "overdue_debt", "current_debt"]
        missing_fields = [field for field in required_fields if field not in test_customer]
        
        if missing_fields:
            self.log(f"❌ Missing required fields: {missing_fields}", "ERROR")
            return False
        
        # Verify overdue debt calculation
        has_overdue = test_customer.get("has_overdue")
        overdue_debt = test_customer.get("overdue_debt")
        current_debt = test_customer.get("current_debt")
        
        self.log(f"✅ Customer overdue status:")
        self.log(f"   - Has Overdue: {has_overdue}")
        self.log(f"   - Overdue Debt: ₺{overdue_debt:.2f}")
        self.log(f"   - Current Debt: ₺{current_debt:.2f}")
        
        # Verify that our test customer shows as having overdue debt
        if not has_overdue:
            self.log("❌ Expected has_overdue=True for test customer with overdue credit", "ERROR")
            return False
        
        if overdue_debt <= 0:
            self.log("❌ Expected overdue_debt > 0 for test customer with overdue credit", "ERROR")
            return False
        
        # Verify overdue amount matches our test credit
        expected_overdue = 250.75
        if abs(overdue_debt - expected_overdue) > 0.01:
            self.log(f"❌ Expected overdue debt ₺{expected_overdue:.2f}, got ₺{overdue_debt:.2f}", "ERROR")
            return False
        
        self.log("✅ FEATURE 1 PASSED: Overdue debt display working correctly")
        return True

    # FEATURE 2: System Backup & Restore
    def test_backup_export(self) -> bool:
        """Test GET /api/backup/export to export all system data"""
        self.log("=" * 60)
        self.log("FEATURE 2A: Testing System Backup Export")
        self.log("=" * 60)
        
        result = self.make_request("GET", "/backup/export")
        
        if not result["success"]:
            self.log(f"❌ Failed to export backup: {result.get('error', 'Unknown error')}", "ERROR")
            return False
        
        backup_data = result["data"]
        
        # Verify backup structure
        required_fields = ["export_date", "version", "data"]
        missing_fields = [field for field in required_fields if field not in backup_data]
        
        if missing_fields:
            self.log(f"❌ Missing required backup fields: {missing_fields}", "ERROR")
            return False
        
        # Verify all required collections are included
        expected_collections = ["customers", "products", "categories", "sales", "credit_sales", "stock_transactions", "payments"]
        data_section = backup_data.get("data", {})
        missing_collections = [col for col in expected_collections if col not in data_section]
        
        if missing_collections:
            self.log(f"❌ Missing collections in backup: {missing_collections}", "ERROR")
            return False
        
        # Log backup statistics
        self.log("✅ Backup export successful:")
        self.log(f"   - Export Date: {backup_data.get('export_date')}")
        self.log(f"   - Version: {backup_data.get('version')}")
        
        for collection, documents in data_section.items():
            self.log(f"   - {collection}: {len(documents)} documents")
        
        # Store backup data for import test
        self.backup_data = backup_data
        
        self.log("✅ FEATURE 2A PASSED: Backup export working correctly")
        return True

    def test_backup_import(self) -> bool:
        """Test POST /api/backup/import with sample backup data"""
        self.log("=" * 60)
        self.log("FEATURE 2B: Testing System Backup Import")
        self.log("=" * 60)
        
        if not hasattr(self, 'backup_data'):
            self.log("❌ No backup data available for import test", "ERROR")
            return False
        
        # Store the original backup data to restore later
        original_backup = self.backup_data.copy()
        
        # Create a modified backup for testing import (add our test customer to existing data)
        test_backup = original_backup.copy()
        test_backup["data"]["customers"].append({
            "id": str(uuid.uuid4()),
            "name": "Import Test Customer",
            "phone": "+90 555 123 4567",
            "email": "import.test@example.com",
            "credit_limit": 1000.0,
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        })
        
        result = self.make_request("POST", "/backup/import", test_backup)
        
        if not result["success"]:
            self.log(f"❌ Failed to import backup: {result.get('error', 'Unknown error')}", "ERROR")
            return False
        
        import_result = result["data"]
        
        # Verify import response
        if not import_result.get("success"):
            self.log(f"❌ Import reported failure: {import_result.get('message', 'Unknown error')}", "ERROR")
            return False
        
        imported_collections = import_result.get("imported_collections", {})
        
        self.log("✅ Backup import successful:")
        self.log(f"   - Message: {import_result.get('message')}")
        
        for collection, count in imported_collections.items():
            self.log(f"   - {collection}: {count} documents imported")
        
        # Verify that the test customer was imported
        customers_result = self.make_request("GET", "/customers")
        if customers_result["success"]:
            customers = customers_result["data"]
            import_customer_found = any(c.get("name") == "Import Test Customer" for c in customers)
            
            if import_customer_found:
                self.log("✅ Import test customer found in system")
            else:
                self.log("❌ Import test customer not found in system", "ERROR")
                return False
        
        self.log("✅ FEATURE 2B PASSED: Backup import working correctly")
        return True

    # FEATURE 3: Overpayment Support
    def test_overpayment_support(self) -> bool:
        """Test POST /api/payments/customer endpoint with overpayment scenarios"""
        self.log("=" * 60)
        self.log("FEATURE 3: Testing Overpayment Support")
        self.log("=" * 60)
        
        if not self.test_customer_id:
            self.log("❌ No test customer available for overpayment test", "ERROR")
            return False
        
        # Get current customer debt
        account_result = self.make_request("GET", f"/customers/{self.test_customer_id}/account-summary")
        if not account_result["success"]:
            self.log("❌ Failed to get customer account summary", "ERROR")
            return False
        
        current_debt = account_result["data"].get("total_debt", 0)
        self.log(f"Current customer debt: ₺{current_debt:.2f}")
        
        # Test 1: Exact payment (should result in zero debt)
        self.log("Testing exact payment...")
        exact_payment_data = {
            "customer_id": self.test_customer_id,
            "amount": current_debt,
            "payment_method": "cash",
            "notes": "Exact payment test"
        }
        
        result = self.make_request("POST", "/payments/customer", exact_payment_data)
        
        if not result["success"]:
            self.log(f"❌ Exact payment failed: {result.get('error', 'Unknown error')}", "ERROR")
            return False
        
        payment_response = result["data"]
        self.log(f"✅ Exact payment successful:")
        self.log(f"   - Amount: ₺{payment_response.get('amount', 0):.2f}")
        self.log(f"   - Previous Debt: ₺{payment_response.get('previous_debt', 0):.2f}")
        self.log(f"   - Remaining Debt: ₺{payment_response.get('remaining_debt', 0):.2f}")
        self.log(f"   - Credit Balance: ₺{payment_response.get('credit_balance', 0):.2f}")
        
        # Verify exact payment results
        if payment_response.get('remaining_debt', 0) != 0:
            self.log("❌ Expected remaining debt to be 0 after exact payment", "ERROR")
            return False
        
        if payment_response.get('credit_balance', 0) != 0:
            self.log("❌ Expected credit balance to be 0 after exact payment", "ERROR")
            return False
        
        # Test 2: Overpayment (should result in credit balance)
        self.log("Testing overpayment...")
        overpayment_amount = 150.00
        overpayment_data = {
            "customer_id": self.test_customer_id,
            "amount": overpayment_amount,
            "payment_method": "bank_transfer",
            "reference_no": "OVR123456",
            "notes": "Overpayment test - customer paid extra"
        }
        
        result = self.make_request("POST", "/payments/customer", overpayment_data)
        
        if not result["success"]:
            self.log(f"❌ Overpayment failed: {result.get('error', 'Unknown error')}", "ERROR")
            return False
        
        overpayment_response = result["data"]
        self.log(f"✅ Overpayment successful:")
        self.log(f"   - Amount: ₺{overpayment_response.get('amount', 0):.2f}")
        self.log(f"   - Previous Debt: ₺{overpayment_response.get('previous_debt', 0):.2f}")
        self.log(f"   - Remaining Debt: ₺{overpayment_response.get('remaining_debt', 0):.2f}")
        self.log(f"   - Credit Balance: ₺{overpayment_response.get('credit_balance', 0):.2f}")
        
        # Verify overpayment results
        expected_credit_balance = overpayment_amount  # Since debt was already 0
        actual_credit_balance = overpayment_response.get('credit_balance', 0)
        
        if abs(actual_credit_balance - expected_credit_balance) > 0.01:
            self.log(f"❌ Expected credit balance ₺{expected_credit_balance:.2f}, got ₺{actual_credit_balance:.2f}", "ERROR")
            return False
        
        if overpayment_response.get('remaining_debt', 0) != 0:
            self.log("❌ Expected remaining debt to be 0 after overpayment", "ERROR")
            return False
        
        # Test 3: Partial payment (create new debt first)
        self.log("Testing partial payment...")
        
        # Create new manual credit for partial payment test
        new_credit_data = {
            "amount": 100.00,
            "due_date": (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d"),
            "notes": "New credit for partial payment test"
        }
        
        credit_result = self.make_request("POST", f"/customers/{self.test_customer_id}/manual-credit", new_credit_data)
        if not credit_result["success"]:
            self.log("❌ Failed to create new credit for partial payment test", "ERROR")
            return False
        
        # Make partial payment
        partial_payment_amount = 50.00
        partial_payment_data = {
            "customer_id": self.test_customer_id,
            "amount": partial_payment_amount,
            "payment_method": "cash",
            "notes": "Partial payment test"
        }
        
        result = self.make_request("POST", "/payments/customer", partial_payment_data)
        
        if not result["success"]:
            self.log(f"❌ Partial payment failed: {result.get('error', 'Unknown error')}", "ERROR")
            return False
        
        partial_response = result["data"]
        self.log(f"✅ Partial payment successful:")
        self.log(f"   - Amount: ₺{partial_response.get('amount', 0):.2f}")
        self.log(f"   - Previous Debt: ₺{partial_response.get('previous_debt', 0):.2f}")
        self.log(f"   - Remaining Debt: ₺{partial_response.get('remaining_debt', 0):.2f}")
        self.log(f"   - Credit Balance: ₺{partial_response.get('credit_balance', 0):.2f}")
        
        # Verify partial payment results
        expected_remaining_debt = 100.00 - partial_payment_amount  # New debt minus partial payment
        actual_remaining_debt = partial_response.get('remaining_debt', 0)
        
        if abs(actual_remaining_debt - expected_remaining_debt) > 0.01:
            self.log(f"❌ Expected remaining debt ₺{expected_remaining_debt:.2f}, got ₺{actual_remaining_debt:.2f}", "ERROR")
            return False
        
        self.log("✅ FEATURE 3 PASSED: Overpayment support working correctly")
        return True

    # FEATURE 4: Delete Operations
    def test_delete_operations(self) -> bool:
        """Test DELETE endpoints for credit-sales, sales, and payments"""
        self.log("=" * 60)
        self.log("FEATURE 4: Testing Delete Operations")
        self.log("=" * 60)
        
        # Test 4A: Delete Payment
        self.log("Testing payment deletion...")
        
        # First, get a payment to delete
        payments_result = self.make_request("GET", f"/payments?customer_id={self.test_customer_id}")
        if not payments_result["success"] or not payments_result["data"]:
            self.log("❌ No payments found for deletion test", "ERROR")
            return False
        
        payment_to_delete = payments_result["data"][0]
        payment_id = payment_to_delete["id"]
        
        result = self.make_request("DELETE", f"/payments/{payment_id}")
        
        if not result["success"]:
            self.log(f"❌ Payment deletion failed: {result.get('error', 'Unknown error')}", "ERROR")
            return False
        
        delete_response = result["data"]
        self.log(f"✅ Payment deleted successfully: {delete_response.get('message')}")
        
        # Verify payment is actually deleted
        verify_result = self.make_request("GET", f"/payments?customer_id={self.test_customer_id}")
        if verify_result["success"]:
            remaining_payments = verify_result["data"]
            if any(p["id"] == payment_id for p in remaining_payments):
                self.log("❌ Payment still exists after deletion", "ERROR")
                return False
            self.log("✅ Payment deletion verified")
        
        # Test 4B: Delete Manual Credit Sale
        self.log("Testing manual credit sale deletion...")
        
        # Create a new manual credit for deletion test
        credit_data = {
            "amount": 75.00,
            "due_date": (datetime.now() + timedelta(days=15)).strftime("%Y-%m-%d"),
            "notes": "Credit for deletion test"
        }
        
        credit_result = self.make_request("POST", f"/customers/{self.test_customer_id}/manual-credit", credit_data)
        if not credit_result["success"]:
            self.log("❌ Failed to create credit for deletion test", "ERROR")
            return False
        
        credit_id = credit_result["data"]["id"]
        
        # Delete the credit sale
        result = self.make_request("DELETE", f"/credit-sales/{credit_id}")
        
        if not result["success"]:
            self.log(f"❌ Credit sale deletion failed: {result.get('error', 'Unknown error')}", "ERROR")
            return False
        
        delete_response = result["data"]
        self.log(f"✅ Credit sale deleted successfully: {delete_response.get('message')}")
        
        # Test 4C: Test deletion validation (cannot delete with existing payments)
        self.log("Testing deletion validation...")
        
        # Create a new credit and payment for validation test
        credit_data = {
            "amount": 200.00,
            "due_date": (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d"),
            "notes": "Credit with payment for validation test"
        }
        
        credit_result = self.make_request("POST", f"/customers/{self.test_customer_id}/manual-credit", credit_data)
        if not credit_result["success"]:
            self.log("❌ Failed to create credit for validation test", "ERROR")
            return False
        
        credit_id = credit_result["data"]["id"]
        
        # Make a payment for this credit
        payment_data = {
            "customer_id": self.test_customer_id,
            "credit_sale_id": credit_id,
            "amount": 50.00,
            "payment_method": "cash",
            "notes": "Payment for validation test"
        }
        
        payment_result = self.make_request("POST", "/payments", payment_data)
        if not payment_result["success"]:
            self.log("❌ Failed to create payment for validation test", "ERROR")
            return False
        
        # Try to delete credit sale with existing payment (should fail)
        result = self.make_request("DELETE", f"/credit-sales/{credit_id}")
        
        if result["success"]:
            self.log("❌ Credit sale deletion should have failed due to existing payments", "ERROR")
            return False
        
        self.log("✅ Deletion validation working correctly - cannot delete credit sale with payments")
        
        self.log("✅ FEATURE 4 PASSED: Delete operations working correctly")
        return True

    def cleanup_test_data(self):
        """Clean up test data"""
        if self.test_customer_id:
            self.log("Cleaning up test data...")
            
            # Delete all payments for the customer first
            payments_result = self.make_request("GET", f"/payments?customer_id={self.test_customer_id}")
            if payments_result["success"]:
                for payment in payments_result["data"]:
                    self.make_request("DELETE", f"/payments/{payment['id']}")
            
            # Delete all credit sales for the customer
            credits_result = self.make_request("GET", f"/credit-sales?customer_id={self.test_customer_id}")
            if credits_result["success"]:
                for credit in credits_result["data"]:
                    self.make_request("DELETE", f"/credit-sales/{credit['id']}")
            
            # Finally delete the customer
            result = self.make_request("DELETE", f"/customers/{self.test_customer_id}")
            if result["success"]:
                self.log("✅ Test data cleaned up successfully")
            else:
                self.log(f"⚠️  Failed to clean up test customer: {result.get('error', 'Unknown error')}", "WARNING")

    def run_all_tests(self) -> Dict[str, bool]:
        """Run all enhancement tests"""
        self.log("=" * 80)
        self.log("Starting Elite Medya POS System Enhancements Tests")
        self.log("=" * 80)
        
        test_results = {}
        
        # Setup test data
        if not self.setup_test_data():
            self.log("❌ Failed to setup test data, aborting tests", "ERROR")
            return {"setup": False}
        
        # Run all feature tests
        test_results["feature_1_overdue_debt"] = self.test_overdue_debt_display()
        test_results["feature_2a_backup_export"] = self.test_backup_export()
        test_results["feature_2b_backup_import"] = self.test_backup_import()
        test_results["feature_3_overpayment"] = self.test_overpayment_support()
        test_results["feature_4_delete_operations"] = self.test_delete_operations()
        
        # Summary
        self.log("=" * 80)
        self.log("Test Results Summary:")
        self.log("=" * 80)
        
        passed_tests = sum(1 for result in test_results.values() if result)
        total_tests = len(test_results)
        
        for test_name, result in test_results.items():
            status = "✅ PASSED" if result else "❌ FAILED"
            feature_name = test_name.replace('_', ' ').title()
            self.log(f"{feature_name}: {status}")
        
        self.log("=" * 80)
        self.log(f"Overall Result: {passed_tests}/{total_tests} tests passed")
        
        if passed_tests == total_tests:
            self.log("🎉 All enhancement tests passed successfully!")
        else:
            self.log(f"⚠️  {total_tests - passed_tests} test(s) failed")
        
        # Cleanup
        self.cleanup_test_data()
        
        return test_results

def main():
    """Main test execution function"""
    tester = ElitePOSEnhancementsTester()
    
    try:
        results = tester.run_all_tests()
        
        # Exit with appropriate code
        if all(results.values()):
            sys.exit(0)  # Success
        else:
            sys.exit(1)  # Some tests failed
            
    except KeyboardInterrupt:
        print("\n\nTest execution interrupted by user")
        tester.cleanup_test_data()
        sys.exit(2)
    except Exception as e:
        print(f"\n\nUnexpected error during testing: {str(e)}")
        tester.cleanup_test_data()
        sys.exit(3)

if __name__ == "__main__":
    main()