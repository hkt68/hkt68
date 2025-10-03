#!/usr/bin/env python3
"""
Backend API Testing for Elite Medya Bilişim POS System - Customer CRM
Tests the customer account management functionality including:
- Customer account summary
- Manual credit addition
- Payment recording
- Purchase history retrieval
- Detailed reporting
"""

import requests
import json
import sys
from datetime import datetime, timedelta
from typing import Dict, Any, Optional

# Backend URL from environment
BACKEND_URL = "https://elite-pos-1.preview.emergentagent.com/api"

class CustomerCRMTester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.test_customer_id = None
        self.test_credit_sale_id = None
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
    
    def test_create_customer(self) -> bool:
        """Test creating a customer for testing purposes"""
        self.log("Testing customer creation...")
        
        customer_data = {
            "name": "Ahmet Yılmaz Test Müşteri",
            "phone": "+90 532 123 4567",
            "email": "ahmet.yilmaz@test.com",
            "address": "Test Mahallesi, Test Sokak No:1, İstanbul",
            "tax_number": "1234567890",
            "credit_limit": 5000.0,
            "notes": "Test müşterisi - CRM testi için oluşturuldu"
        }
        
        result = self.make_request("POST", "/customers", customer_data)
        
        if result["success"]:
            self.test_customer_id = result["data"]["id"]
            self.log(f"✅ Customer created successfully with ID: {self.test_customer_id}")
            return True
        else:
            self.log(f"❌ Failed to create customer: {result.get('error', 'Unknown error')}", "ERROR")
            return False
    
    def test_manual_credit_addition(self) -> bool:
        """Test adding manual credit to customer account with detailed notes"""
        if not self.test_customer_id:
            self.log("❌ No test customer available for credit addition", "ERROR")
            return False
            
        self.log("Testing manual credit addition with detailed notes...")
        
        # Test data as specified in the review request
        credit_data = {
            "amount": 75.50,
            "due_date": "2025-01-15",
            "notes": "Stoktan alınan ofis malzemeleri - 3 adet kalem, 2 adet defter"
        }
        
        result = self.make_request("POST", f"/customers/{self.test_customer_id}/manual-credit", credit_data)
        
        if result["success"]:
            self.test_credit_sale_id = result["data"]["id"]
            self.log(f"✅ Manual credit added successfully: ₺{credit_data['amount']}")
            self.log(f"   - Notes: {credit_data['notes']}")
            return True
        else:
            self.log(f"❌ Failed to add manual credit: {result.get('error', 'Unknown error')}", "ERROR")
            return False
    
    def test_payment_recording(self) -> bool:
        """Test recording a payment for the customer"""
        if not self.test_customer_id or not self.test_credit_sale_id:
            self.log("❌ No test customer or credit sale available for payment recording", "ERROR")
            return False
            
        self.log("Testing payment recording...")
        
        # Test data as specified in the requirements
        payment_data = {
            "customer_id": self.test_customer_id,
            "credit_sale_id": self.test_credit_sale_id,
            "amount": 50.25,
            "payment_method": "cash",
            "notes": "Nakit ödeme"
        }
        
        result = self.make_request("POST", "/payments", payment_data)
        
        if result["success"]:
            self.log(f"✅ Payment recorded successfully: ₺{payment_data['amount']}")
            return True
        else:
            self.log(f"❌ Failed to record payment: {result.get('error', 'Unknown error')}", "ERROR")
            return False
    
    def test_account_summary(self) -> bool:
        """Test retrieving customer account summary"""
        if not self.test_customer_id:
            self.log("❌ No test customer available for account summary", "ERROR")
            return False
            
        self.log("Testing customer account summary retrieval...")
        
        result = self.make_request("GET", f"/customers/{self.test_customer_id}/account-summary")
        
        if result["success"]:
            data = result["data"]
            self.log("✅ Account summary retrieved successfully")
            self.log(f"   - Total Debt: ₺{data.get('total_debt', 0):.2f}")
            self.log(f"   - Overdue Amount: ₺{data.get('overdue_amount', 0):.2f}")
            self.log(f"   - Credit Limit: ₺{data.get('credit_limit', 0):.2f}")
            self.log(f"   - Available Credit: ₺{data.get('available_credit', 0):.2f}")
            self.log(f"   - Credit Sales Count: {data.get('credit_sales_count', 0)}")
            
            # Verify expected data structure
            required_fields = ['customer', 'total_debt', 'overdue_amount', 'credit_limit', 'available_credit']
            missing_fields = [field for field in required_fields if field not in data]
            
            if missing_fields:
                self.log(f"⚠️  Missing fields in account summary: {missing_fields}", "WARNING")
                return False
                
            return True
        else:
            self.log(f"❌ Failed to retrieve account summary: {result.get('error', 'Unknown error')}", "ERROR")
            return False
    
    def test_purchase_history(self) -> bool:
        """Test retrieving customer purchase history"""
        if not self.test_customer_id:
            self.log("❌ No test customer available for purchase history", "ERROR")
            return False
            
        self.log("Testing customer purchase history retrieval...")
        
        result = self.make_request("GET", f"/customers/{self.test_customer_id}/purchase-history")
        
        if result["success"]:
            data = result["data"]
            self.log(f"✅ Purchase history retrieved successfully ({len(data)} records)")
            
            # Since we only added manual credit (not actual product sales), 
            # the purchase history might be empty, which is expected
            if len(data) == 0:
                self.log("   - No purchase records found (expected for manual credit only)")
            else:
                for i, purchase in enumerate(data[:3]):  # Show first 3 records
                    self.log(f"   - Purchase {i+1}: {purchase.get('product_name')} - ₺{purchase.get('total_amount', 0):.2f}")
            
            return True
        else:
            self.log(f"❌ Failed to retrieve purchase history: {result.get('error', 'Unknown error')}", "ERROR")
            return False
    
    def test_detailed_report(self) -> bool:
        """Test generating detailed customer report"""
        if not self.test_customer_id:
            self.log("❌ No test customer available for detailed report", "ERROR")
            return False
            
        self.log("Testing detailed customer report generation...")
        
        result = self.make_request("GET", f"/customers/{self.test_customer_id}/detailed-report")
        
        if result["success"]:
            data = result["data"]
            self.log("✅ Detailed report generated successfully")
            
            summary = data.get('summary', {})
            self.log(f"   - Total Purchases: ₺{summary.get('total_purchases', 0):.2f}")
            self.log(f"   - Total Payments: ₺{summary.get('total_payments', 0):.2f}")
            self.log(f"   - Current Balance: ₺{summary.get('current_balance', 0):.2f}")
            self.log(f"   - Total Transactions: {summary.get('total_transactions', 0)}")
            
            # Verify expected data structure
            required_fields = ['customer', 'summary', 'purchase_history', 'payment_history', 'credit_sales']
            missing_fields = [field for field in required_fields if field not in data]
            
            if missing_fields:
                self.log(f"⚠️  Missing fields in detailed report: {missing_fields}", "WARNING")
                return False
                
            return True
        else:
            self.log(f"❌ Failed to generate detailed report: {result.get('error', 'Unknown error')}", "ERROR")
            return False
    
    def test_api_health(self) -> bool:
        """Test basic API connectivity"""
        self.log("Testing API health check...")
        
        result = self.make_request("GET", "/")
        
        if result["success"]:
            self.log("✅ API health check passed")
            return True
        else:
            self.log(f"❌ API health check failed: {result.get('error', 'Unknown error')}", "ERROR")
            return False
    
    def cleanup_test_data(self):
        """Clean up test customer data"""
        if self.test_customer_id:
            self.log("Cleaning up test customer data...")
            result = self.make_request("DELETE", f"/customers/{self.test_customer_id}")
            if result["success"]:
                self.log("✅ Test customer cleaned up successfully")
            else:
                self.log(f"⚠️  Failed to clean up test customer: {result.get('error', 'Unknown error')}", "WARNING")
    
    def run_all_tests(self) -> Dict[str, bool]:
        """Run all customer CRM tests"""
        self.log("=" * 60)
        self.log("Starting Customer CRM Backend API Tests")
        self.log("=" * 60)
        
        test_results = {}
        
        # Test sequence as specified in requirements
        test_results["api_health"] = self.test_api_health()
        test_results["create_customer"] = self.test_create_customer()
        test_results["manual_credit_addition"] = self.test_manual_credit_addition()
        test_results["payment_recording"] = self.test_payment_recording()
        test_results["account_summary"] = self.test_account_summary()
        test_results["purchase_history"] = self.test_purchase_history()
        test_results["detailed_report"] = self.test_detailed_report()
        
        # Summary
        self.log("=" * 60)
        self.log("Test Results Summary:")
        self.log("=" * 60)
        
        passed_tests = sum(1 for result in test_results.values() if result)
        total_tests = len(test_results)
        
        for test_name, result in test_results.items():
            status = "✅ PASSED" if result else "❌ FAILED"
            self.log(f"{test_name.replace('_', ' ').title()}: {status}")
        
        self.log("=" * 60)
        self.log(f"Overall Result: {passed_tests}/{total_tests} tests passed")
        
        if passed_tests == total_tests:
            self.log("🎉 All tests passed successfully!")
        else:
            self.log(f"⚠️  {total_tests - passed_tests} test(s) failed")
        
        # Cleanup
        self.cleanup_test_data()
        
        return test_results

def main():
    """Main test execution function"""
    tester = CustomerCRMTester()
    
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