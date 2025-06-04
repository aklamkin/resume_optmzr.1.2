
import requests
import sys
import json
import uuid
from datetime import datetime

class ResumeOptimizerTester:
    def __init__(self, base_url="https://6fd0515b-042e-4ce3-9728-85db9a0c464b.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.user_id = None
        self.test_username = f"testuser_{uuid.uuid4().hex[:8]}"
        self.test_email = f"test_{uuid.uuid4().hex[:8]}@example.com"

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
            }
        )
        
        if success:
            print("Resume analysis completed successfully")
            # Check if the analysis contains expected fields
            if "analysis" in response:
                print("Analysis result received")
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

def main():
    print("=" * 50)
    print("RESUME OPTIMIZER API TEST SUITE")
    print("=" * 50)
    
    tester = ResumeOptimizerTester()
    
    # Test health endpoint
    tester.test_health_endpoint()
    
    # Test user creation and retrieval
    if tester.test_create_user():
        tester.test_get_user()
    
    # Test resume analysis
    tester.test_analyze_resume()
    
    # Test admin endpoints
    tester.test_admin_get_users()
    tester.test_admin_get_config()
    tester.test_admin_update_user_status()
    
    # Print results
    print("\n" + "=" * 50)
    print(f"TESTS PASSED: {tester.tests_passed}/{tester.tests_run}")
    print("=" * 50)
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())
