#!/usr/bin/env python3
"""
Final Comprehensive Test for Elite Medya POS System Enhancements
Tests all 4 features with proper data management
"""

import requests
import json
import sys
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, Optional
import uuid

# Backend URL from environment
BACKEND_URL = "https://pos-crm-elite.preview.emergentagent.com/api"

class FinalComprehensiveTester:
    def __init__(self):
        self.base_url = BACKEND_URL
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

    def test_all_features(self) -> Dict[str, bool]:
        """Test all 4 features comprehensively"""
        self.log("=" * 80)
        self.log("FINAL COMPREHENSIVE TEST - Elite Medya POS System Enhancements")
        self.log("=" * 80)
        
        results = {}
        
        # FEATURE 1: Overdue Debt Display
        self.log("FEATURE 1: Testing Overdue Debt Display in Customer List")
        self.log("-" * 60)
        
        # Create customer with overdue debt
        customer_data = {
            "name": "Final Test Customer - Overdue",
            "phone": "+90 532 999 8877",
            "email": "final.overdue@test.com",
            "credit_limit": 5000.0,
            "notes": "Customer for overdue debt testing"
        }
        
        result = self.make_request("POST", "/customers", customer_data)
        if not result["success"]:
            self.log("❌ Failed to create customer for overdue test", "ERROR")
            results["feature_1_overdue_debt"] = False
        else:
            customer_id = result["data"]["id"]
            
            # Create overdue credit
            past_due_date = (datetime.now() - timedelta(days=15)).strftime("%Y-%m-%d")
            credit_data = {
                "amount": 175.50,
                "due_date": past_due_date,
                "notes": "Overdue test credit"
            }
            
            credit_result = self.make_request("POST", f"/customers/{customer_id}/manual-credit", credit_data)
            if credit_result["success"]:
                # Test customer list endpoint
                customers_result = self.make_request("GET", "/customers")
                if customers_result["success"]:
                    customers = customers_result["data"]
                    test_customer = next((c for c in customers if c["id"] == customer_id), None)
                    
                    if test_customer and test_customer.get("has_overdue") and test_customer.get("overdue_debt") > 0:
                        self.log(f"✅ FEATURE 1 PASSED - Overdue debt: ₺{test_customer.get('overdue_debt'):.2f}")
                        results["feature_1_overdue_debt"] = True
                    else:
                        self.log("❌ FEATURE 1 FAILED - Overdue debt not properly displayed", "ERROR")
                        results["feature_1_overdue_debt"] = False
                else:
                    results["feature_1_overdue_debt"] = False
            else:
                results["feature_1_overdue_debt"] = False
        
        # FEATURE 2: System Backup & Restore
        self.log("\nFEATURE 2: Testing System Backup & Restore")
        self.log("-" * 60)
        
        # Test backup export
        backup_result = self.make_request("GET", "/backup/export")
        if backup_result["success"]:
            backup_data = backup_result["data"]
            required_collections = ["customers", "products", "categories", "sales", "credit_sales", "stock_transactions", "payments"]
            
            if all(col in backup_data.get("data", {}) for col in required_collections):
                self.log("✅ Backup export successful with all collections")
                
                # Test backup import with minimal data
                test_import_data = {
                    "export_date": datetime.now(timezone.utc).isoformat(),
                    "version": "1.0",
                    "data": {col: [] for col in required_collections}
                }
                test_import_data["data"]["customers"] = [{
                    "id": str(uuid.uuid4()),
                    "name": "Import Test Customer Final",
                    "credit_limit": 500.0,
                    "is_active": True,
                    "created_at": datetime.now(timezone.utc).isoformat(),
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }]
                
                import_result = self.make_request("POST", "/backup/import", test_import_data)
                if import_result["success"] and import_result["data"].get("success"):
                    self.log("✅ FEATURE 2 PASSED - Backup & Restore working")
                    results["feature_2_backup_restore"] = True
                else:
                    self.log("❌ FEATURE 2 FAILED - Import failed", "ERROR")
                    results["feature_2_backup_restore"] = False
            else:
                self.log("❌ FEATURE 2 FAILED - Missing collections in backup", "ERROR")
                results["feature_2_backup_restore"] = False
        else:
            self.log("❌ FEATURE 2 FAILED - Backup export failed", "ERROR")
            results["feature_2_backup_restore"] = False
        
        # FEATURE 3: Overpayment Support
        self.log("\nFEATURE 3: Testing Overpayment Support")
        self.log("-" * 60)
        
        # Create fresh customer for overpayment test
        customer_data = {
            "name": "Final Test Customer - Overpayment",
            "phone": "+90 532 777 6655",
            "email": "final.overpay@test.com",
            "credit_limit": 3000.0
        }
        
        result = self.make_request("POST", "/customers", customer_data)
        if result["success"]:
            customer_id = result["data"]["id"]
            
            # Create debt
            credit_data = {
                "amount": 80.00,
                "due_date": (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d"),
                "notes": "Debt for overpayment test"
            }
            
            credit_result = self.make_request("POST", f"/customers/{customer_id}/manual-credit", credit_data)
            if credit_result["success"]:
                # Test overpayment
                overpayment_data = {
                    "customer_id": customer_id,
                    "amount": 120.00,  # 40 more than debt
                    "payment_method": "cash",
                    "notes": "Overpayment test"
                }
                
                payment_result = self.make_request("POST", "/payments/customer", overpayment_data)
                if payment_result["success"]:
                    response = payment_result["data"]
                    if (response.get("remaining_debt", 0) == 0 and 
                        response.get("credit_balance", 0) == 40.00):
                        self.log("✅ FEATURE 3 PASSED - Overpayment creates credit balance")
                        results["feature_3_overpayment"] = True
                    else:
                        self.log(f"❌ FEATURE 3 FAILED - Incorrect balance calculation", "ERROR")
                        results["feature_3_overpayment"] = False
                else:
                    results["feature_3_overpayment"] = False
            else:
                results["feature_3_overpayment"] = False
        else:
            results["feature_3_overpayment"] = False
        
        # FEATURE 4: Delete Operations
        self.log("\nFEATURE 4: Testing Delete Operations")
        self.log("-" * 60)
        
        # Create customer for delete tests
        customer_data = {
            "name": "Final Test Customer - Delete",
            "phone": "+90 532 555 4433",
            "email": "final.delete@test.com",
            "credit_limit": 2000.0
        }
        
        result = self.make_request("POST", "/customers", customer_data)
        if result["success"]:
            customer_id = result["data"]["id"]
            
            # Test credit sale deletion
            credit_data = {
                "amount": 60.00,
                "due_date": (datetime.now() + timedelta(days=20)).strftime("%Y-%m-%d"),
                "notes": "Credit for deletion test"
            }
            
            credit_result = self.make_request("POST", f"/customers/{customer_id}/manual-credit", credit_data)
            if credit_result["success"]:
                credit_id = credit_result["data"]["id"]
                
                # Test deletion without payments (should work)
                delete_result = self.make_request("DELETE", f"/credit-sales/{credit_id}")
                if delete_result["success"]:
                    # Test deletion validation with payments
                    credit_result2 = self.make_request("POST", f"/customers/{customer_id}/manual-credit", credit_data)
                    if credit_result2["success"]:
                        credit_id2 = credit_result2["data"]["id"]
                        
                        # Create payment
                        payment_data = {
                            "customer_id": customer_id,
                            "credit_sale_id": credit_id2,
                            "amount": 30.00,
                            "payment_method": "cash"
                        }
                        
                        payment_result = self.make_request("POST", "/payments", payment_data)
                        if payment_result["success"]:
                            payment_id = payment_result["data"]["id"]
                            
                            # Try to delete credit with payment (should fail)
                            delete_result2 = self.make_request("DELETE", f"/credit-sales/{credit_id2}")
                            if not delete_result2["success"]:
                                # Delete payment first
                                payment_delete = self.make_request("DELETE", f"/payments/{payment_id}")
                                if payment_delete["success"]:
                                    # Now credit deletion should work
                                    delete_result3 = self.make_request("DELETE", f"/credit-sales/{credit_id2}")
                                    if delete_result3["success"]:
                                        self.log("✅ FEATURE 4 PASSED - Delete operations with validation")
                                        results["feature_4_delete_operations"] = True
                                    else:
                                        results["feature_4_delete_operations"] = False
                                else:
                                    results["feature_4_delete_operations"] = False
                            else:
                                self.log("❌ FEATURE 4 FAILED - Should not allow credit deletion with payments", "ERROR")
                                results["feature_4_delete_operations"] = False
                        else:
                            results["feature_4_delete_operations"] = False
                    else:
                        results["feature_4_delete_operations"] = False
                else:
                    results["feature_4_delete_operations"] = False
            else:
                results["feature_4_delete_operations"] = False
        else:
            results["feature_4_delete_operations"] = False
        
        return results

    def run_final_test(self) -> Dict[str, bool]:
        """Run final comprehensive test"""
        results = self.test_all_features()
        
        # Summary
        self.log("=" * 80)
        self.log("FINAL TEST RESULTS SUMMARY")
        self.log("=" * 80)
        
        passed_tests = sum(1 for result in results.values() if result)
        total_tests = len(results)
        
        feature_names = {
            "feature_1_overdue_debt": "Feature 1: Overdue Debt Display",
            "feature_2_backup_restore": "Feature 2: System Backup & Restore", 
            "feature_3_overpayment": "Feature 3: Overpayment Support",
            "feature_4_delete_operations": "Feature 4: Delete Operations"
        }
        
        for test_name, result in results.items():
            status = "✅ PASSED" if result else "❌ FAILED"
            feature_name = feature_names.get(test_name, test_name)
            self.log(f"{feature_name}: {status}")
        
        self.log("=" * 80)
        self.log(f"Overall Result: {passed_tests}/{total_tests} features passed")
        
        if passed_tests == total_tests:
            self.log("🎉 ALL FEATURES WORKING CORRECTLY!")
        else:
            self.log(f"⚠️  {total_tests - passed_tests} feature(s) failed")
        
        return results

def main():
    """Main test execution function"""
    tester = FinalComprehensiveTester()
    
    try:
        results = tester.run_final_test()
        
        # Exit with appropriate code
        if all(results.values()):
            sys.exit(0)  # Success
        else:
            sys.exit(1)  # Some tests failed
            
    except KeyboardInterrupt:
        print("\n\nTest execution interrupted by user")
        sys.exit(2)
    except Exception as e:
        print(f"\n\nUnexpected error during testing: {str(e)}")
        sys.exit(3)

if __name__ == "__main__":
    main()