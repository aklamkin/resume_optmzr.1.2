
import requests
import sys
import json
import uuid
from datetime import datetime

class ResumeOptimizerTester:
    def __init__(self, base_url="https://392743ab-18eb-4c10-94ab-0a87d0b0f4b6.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.user_id = None
        self.analysis_id = None
        self.test_username = f"testuser_{uuid.uuid4().hex[:8]}"
        self.test_email = f"test_{uuid.uuid4().hex[:8]}@example.com"
        self.test_relationship_code = None
        
    def run_test(self, name, method, endpoint, expected_status, data=None, print_response=False):
        """Run a single API test"""
        url = f"{self.base_url}{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            
            success = response.status_code == expected_status
            
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                if print_response:
                    try:
                        print(f"Response: {json.dumps(response.json(), indent=2)}")
                    except:
                        print(f"Response: {response.text[:200]}...")
                return True, response.json() if response.text else {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"Response: {response.text[:200]}...")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_health_endpoint(self):
        """Test the health endpoint"""
        return self.run_test(
            "Health Endpoint",
            "GET",
            "/api/health",
            200
        )

    def test_create_user(self):
        """Test user creation"""
        success, response = self.run_test(
            "User Creation",
            "POST",
            "/api/users",
            200,
            data={"username": self.test_username, "email": self.test_email},
            print_response=True
        )
        
        if success and "user_id" in response:
            self.user_id = response["user_id"]
            print(f"Created test user with ID: {self.user_id}")
            return True
        return False

    def test_get_user(self):
        """Test getting user details"""
        if not self.user_id:
            print("❌ Cannot test get user - no user created")
            return False
            
        return self.run_test(
            "Get User Details",
            "GET",
            f"/api/users/{self.user_id}",
            200,
            print_response=True
        )[0]

    def test_analyze_resume(self):
        """Test resume analysis"""
        if not self.user_id:
            print("❌ Cannot test resume analysis - no user created")
            return False
            
        job_description = """
        Senior Software Engineer
        
        Requirements:
        - 5+ years of experience in Python development
        - Experience with FastAPI, Django, or Flask
        - Strong knowledge of RESTful API design
        - Experience with MongoDB or other NoSQL databases
        - Familiarity with React or other frontend frameworks
        - Experience with Docker and Kubernetes
        """
        
        resume_text = """
        John Doe
        Software Engineer
        
        Experience:
        - Software Engineer at ABC Corp (2018-Present)
          * Developed web applications using Django
          * Implemented RESTful APIs
          * Worked with PostgreSQL databases
        
        Skills:
        - Python, JavaScript
        - Django, Flask
        - SQL, PostgreSQL
        - Git, GitHub
        """
        
        success, response = self.run_test(
            "Resume Analysis",
            "POST",
            f"/api/users/{self.user_id}/analyze-resume",
            200,
            data={
                "job_description": job_description,
                "resume_text": resume_text
            },
            print_response=True
        )
        
        if success:
            print("Resume analysis completed successfully")
            # Check if the analysis contains expected fields
            if "analysis_id" in response:
                self.analysis_id = response["analysis_id"]
                print(f"Analysis ID: {self.analysis_id}")
                return True
        return False

    def test_admin_get_users(self):
        """Test admin endpoint to get all users"""
        return self.run_test(
            "Admin - Get All Users",
            "GET",
            "/api/admin/users",
            200,
            print_response=True
        )[0]

    def test_admin_get_config(self):
        """Test admin endpoint to get configuration"""
        return self.run_test(
            "Admin - Get Configuration",
            "GET",
            "/api/admin/config",
            200,
            print_response=True
        )[0]

    def test_admin_update_user_status(self):
        """Test admin endpoint to update user status"""
        if not self.user_id:
            print("❌ Cannot test user status update - no user created")
            return False
            
        return self.run_test(
            "Admin - Update User Status",
            "PUT",
            f"/api/admin/users/{self.user_id}/status",
            200,
            data={"is_free": True},
            print_response=True
        )[0]
        
    # New tests for relationship codes
    def test_admin_create_relationship_code(self):
        """Test creating a relationship code"""
        code = f"TEST{uuid.uuid4().hex[:2].upper()}"
        success, response = self.run_test(
            "Admin - Create Relationship Code",
            "POST",
            "/api/admin/relationship-codes",
            200,
            data={
                "code": code,
                "description": "Test relationship code",
                "is_active": True
            },
            print_response=True
        )
        
        if success:
            self.test_relationship_code = code
            print(f"Created test relationship code: {code}")
            return True
        return False
        
    def test_get_relationship_codes(self):
        """Test getting all relationship codes"""
        return self.run_test(
            "Admin - Get Relationship Codes",
            "GET",
            "/api/admin/relationship-codes",
            200,
            print_response=True
        )[0]
        
    def test_check_relationship_code(self):
        """Test checking a relationship code"""
        if not self.test_relationship_code:
            print("❌ Cannot test relationship code check - no code created")
            return False
            
        return self.run_test(
            "Check Relationship Code",
            "POST",
            "/api/relationship-codes/check",
            200,
            data={"code": self.test_relationship_code},
            print_response=True
        )[0]
        
    def test_apply_relationship_code(self):
        """Test applying a relationship code to a user"""
        if not self.user_id or not self.test_relationship_code:
            print("❌ Cannot test applying relationship code - missing user or code")
            return False
            
        return self.run_test(
            "Apply Relationship Code",
            "POST",
            f"/api/users/{self.user_id}/apply-relationship-code",
            200,
            data={"code": self.test_relationship_code},
            print_response=True
        )[0]
        
    def test_login_with_specific_email(self):
        """Test login with the specific test@example.com email"""
        specific_email = "test@example.com"
        print(f"\n🔍 Testing Login with specific email: {specific_email}...")
        
        success, response = self.run_test(
            "Login with specific email",
            "POST",
            "/api/auth/login",
            200,
            data={"identifier": specific_email},
            print_response=True
        )
        
        if success and response.get("success"):
            print(f"✅ Successfully logged in with email: {specific_email}")
            self.user_id = response["user"]["id"]
            return True, response["user"]
        else:
            print(f"❌ Failed to log in with email: {specific_email}")
            return False, None
            
    # Tests for Apple Pay and download eligibility
    def test_apple_pay_validate_merchant(self):
        """Test Apple Pay merchant validation"""
        return self.run_test(
            "Apple Pay - Validate Merchant",
            "POST",
            "/api/apple-pay/validate-merchant",
            200,
            data={"validationURL": "https://apple-pay-gateway.apple.com/paymentservices/validatemerchant"},
            print_response=True
        )[0]
        
    def test_apple_pay_process_payment(self):
        """Test Apple Pay payment processing"""
        if not self.user_id or not self.analysis_id:
            print("❌ Cannot test payment processing - missing user or analysis ID")
            return False
            
        return self.run_test(
            "Apple Pay - Process Payment",
            "POST",
            "/api/apple-pay/process-payment",
            200,
            data={
                "payment_token": {
                    "paymentData": "mock_payment_data",
                    "paymentMethod": {
                        "displayName": "Visa 1234",
                        "network": "Visa",
                        "type": "credit"
                    },
                    "transactionIdentifier": "mock_transaction_id"
                },
                "amount": 1.00,
                "currency": "USD",
                "user_id": self.user_id,
                "analysis_id": self.analysis_id
            },
            print_response=True
        )[0]
        
    def test_check_download_eligibility(self):
        """Test checking download eligibility"""
        if not self.user_id or not self.analysis_id:
            print("❌ Cannot test download eligibility - missing user or analysis ID")
            return False
            
        return self.run_test(
            "Check Download Eligibility",
            "GET",
            f"/api/users/{self.user_id}/can-download/{self.analysis_id}",
            200,
            print_response=True
        )[0]
        
    def test_existing_relationship_code(self):
        """Test using the existing TEST01 relationship code"""
        if not self.user_id:
            print("❌ Cannot test existing relationship code - no user created")
            return False
            
        return self.run_test(
            "Apply Existing Relationship Code (TEST01)",
            "POST",
            f"/api/users/{self.user_id}/apply-relationship-code",
            200,
            data={"code": "TEST01"},
            print_response=True
        )[0]
        
    def test_existing_free_user(self):
        """Test the existing free user with TEST01 code"""
        return self.run_test(
            "Get Existing Free User",
            "GET",
            "/api/users/34848618-b48a-420e-be1e-5cb95ae70bf5",
            200,
            print_response=True
        )[0]

def test_login_with_specific_email(self):
    """Test login with the specific test@example.com email"""
    specific_email = "test@example.com"
    print(f"\n🔍 Testing Login with specific email: {specific_email}...")
    
    success, response = self.run_test(
        "Login with specific email",
        "POST",
        "/api/auth/login",
        200,
        data={"identifier": specific_email},
        print_response=True
    )
    
    if success and response.get("success"):
        print(f"✅ Successfully logged in with email: {specific_email}")
        self.user_id = response["user"]["id"]
        return True, response["user"]
    else:
        print(f"❌ Failed to log in with email: {specific_email}")
        return False, None

def main():
    print("=" * 50)
    print("RESUME OPTIMIZER API TEST SUITE")
    print("=" * 50)
    
    tester = ResumeOptimizerTester()
    
    # Test health endpoint
    tester.test_health_endpoint()
    
    # Test login with specific email (test@example.com)
    print("\n" + "=" * 50)
    print("TESTING LOGIN WITH SPECIFIC EMAIL")
    print("=" * 50)
    login_success, user = tester.test_login_with_specific_email()
    
    if not login_success:
        print("Creating a new test user since login with specific email failed")
        if tester.test_create_user():
            tester.test_get_user()
    
    # Test resume analysis
    print("\n" + "=" * 50)
    print("TESTING RESUME ANALYSIS & RESULTS SCREEN")
    print("=" * 50)
    
    tester.test_analyze_resume()
    
    # Print results
    print("\n" + "=" * 50)
    print(f"TESTS PASSED: {tester.tests_passed}/{tester.tests_run}")
    print("=" * 50)
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())
