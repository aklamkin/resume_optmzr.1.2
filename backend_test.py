
import requests
import sys
import json
import os
import uuid
from datetime import datetime

class ResumeOptimizerTester:
    def __init__(self, base_url="https://eb93ec35-6dfc-49bd-8e54-894b4d016531.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        
    def run_test(self, name, method, endpoint, expected_status, data=None, files=None, print_response=False):
        """Run a single API test"""
        url = f"{self.base_url}{endpoint}"
        
        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url)
            elif method == 'POST':
                if files:
                    response = requests.post(url, data=data, files=files)
                else:
                    response = requests.post(url, data=data)
            
            success = response.status_code == expected_status
            
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                if print_response:
                    try:
                        json_response = response.json()
                        # Print a truncated version of the response to avoid overwhelming output
                        truncated_response = self._truncate_response(json_response)
                        print(f"Response: {json.dumps(truncated_response, indent=2)}")
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
    
    def _truncate_response(self, json_obj, max_length=500):
        """Truncate long string values in JSON response"""
        if isinstance(json_obj, dict):
            return {k: self._truncate_response(v, max_length) for k, v in json_obj.items()}
        elif isinstance(json_obj, list):
            return [self._truncate_response(item, max_length) for item in json_obj]
        elif isinstance(json_obj, str) and len(json_obj) > max_length:
            return json_obj[:max_length] + "..."
        else:
            return json_obj

    def test_root_endpoint(self):
        """Test the root endpoint"""
        return self.run_test(
            "Root Endpoint",
            "GET",
            "/api/",
            200,
            print_response=True
        )

    def test_health_endpoint(self):
        """Test the health endpoint"""
        return self.run_test(
            "Health Endpoint",
            "GET",
            "/api/health",
            200,
            print_response=True
        )
    
    def test_ai_integration(self):
        """Test the AI integration endpoint"""
        return self.run_test(
            "AI Integration Test",
            "GET",
            "/api/test-ai",
            200,
            print_response=True
        )

    def test_analyze_with_text(self):
        """Test resume analysis with text inputs"""
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
        
        data = {
            "job_description": job_description,
            "resume_text": resume_text
        }
        
        return self.run_test(
            "Resume Analysis with Text Inputs",
            "POST",
            "/api/analyze",
            200,
            data=data,
            print_response=True
        )

    def test_analyze_with_pdf(self):
        """Test resume analysis with PDF file upload"""
        # Create a simple PDF file for testing
        pdf_content = b"%PDF-1.4\n1 0 obj\n<</Type/Catalog/Pages 2 0 R>>\nendobj\n2 0 obj\n<</Type/Pages/Kids[3 0 R]/Count 1>>\nendobj\n3 0 obj\n<</Type/Page/MediaBox[0 0 612 792]/Resources<<>>/Contents 4 0 R/Parent 2 0 R>>\nendobj\n4 0 obj\n<</Length 21>>\nstream\nBT\n/F1 12 Tf\n100 700 Td\n(John Doe - Software Engineer) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f\n0000000010 00000 n\n0000000053 00000 n\n0000000102 00000 n\n0000000192 00000 n\ntrailer\n<</Size 5/Root 1 0 R>>\nstartxref\n264\n%%EOF"
        
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
        
        # Create a temporary PDF file
        with open('/tmp/test_resume.pdf', 'wb') as f:
            f.write(pdf_content)
        
        # Prepare the multipart form data
        files = {
            'resume_file': ('test_resume.pdf', open('/tmp/test_resume.pdf', 'rb'), 'application/pdf')
        }
        
        data = {
            'job_description': job_description
        }
        
        result = self.run_test(
            "Resume Analysis with PDF Upload",
            "POST",
            "/api/analyze",
            200,
            data=data,
            files=files,
            print_response=True
        )
        
        # Clean up the temporary file
        os.remove('/tmp/test_resume.pdf')
        
        return result

    def test_analyze_with_url(self):
        """Test resume analysis with job description URL"""
        # Note: Using a URL that won't be blocked by the server
        job_description = "https://www.example.com/job-posting"
        
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
        
        data = {
            "job_description": job_description,
            "resume_text": resume_text
        }
        
        return self.run_test(
            "Resume Analysis with Job Description URL",
            "POST",
            "/api/analyze",
            200,  # This might return 400 if URL scraping fails, which is expected
            data=data,
            print_response=True
        )

    def test_analyze_missing_inputs(self):
        """Test resume analysis with missing inputs"""
        # Test with missing resume
        data = {
            "job_description": "Software Engineer job"
        }
        
        return self.run_test(
            "Resume Analysis with Missing Resume",
            "POST",
            "/api/analyze",
            400,  # Expect a 400 Bad Request
            data=data,
            print_response=True
        )

    def test_generate_cover_letter_with_text(self):
        """Test cover letter generation with text inputs"""
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
        
        data = {
            "job_description": job_description,
            "resume_text": resume_text
        }
        
        return self.run_test(
            "Cover Letter Generation with Text Inputs",
            "POST",
            "/api/generate-cover-letter",
            200,
            data=data,
            print_response=True
        )

    def test_generate_cover_letter_with_pdf(self):
        """Test cover letter generation with PDF file upload"""
        # Create a simple PDF file for testing
        pdf_content = b"%PDF-1.4\n1 0 obj\n<</Type/Catalog/Pages 2 0 R>>\nendobj\n2 0 obj\n<</Type/Pages/Kids[3 0 R]/Count 1>>\nendobj\n3 0 obj\n<</Type/Page/MediaBox[0 0 612 792]/Resources<<>>/Contents 4 0 R/Parent 2 0 R>>\nendobj\n4 0 obj\n<</Length 21>>\nstream\nBT\n/F1 12 Tf\n100 700 Td\n(John Doe - Software Engineer) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f\n0000000010 00000 n\n0000000053 00000 n\n0000000102 00000 n\n0000000192 00000 n\ntrailer\n<</Size 5/Root 1 0 R>>\nstartxref\n264\n%%EOF"
        
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
        
        # Create a temporary PDF file
        with open('/tmp/test_resume.pdf', 'wb') as f:
            f.write(pdf_content)
        
        # Prepare the multipart form data
        files = {
            'resume_file': ('test_resume.pdf', open('/tmp/test_resume.pdf', 'rb'), 'application/pdf')
        }
        
        data = {
            'job_description': job_description
        }
        
        result = self.run_test(
            "Cover Letter Generation with PDF Upload",
            "POST",
            "/api/generate-cover-letter",
            200,
            data=data,
            files=files,
            print_response=True
        )
        
        # Clean up the temporary file
        os.remove('/tmp/test_resume.pdf')
        
        return result

    def test_generate_cover_letter_missing_inputs(self):
        """Test cover letter generation with missing inputs"""
        # Test with missing resume
        data = {
            "job_description": "Software Engineer job"
        }
        
        return self.run_test(
            "Cover Letter Generation with Missing Resume",
            "POST",
            "/api/generate-cover-letter",
            400,  # Expect a 400 Bad Request
            data=data,
            print_response=True
        )

def main():
    print("=" * 80)
    print("RESUME OPTIMIZER API TEST SUITE")
    print("=" * 80)
    
    # Get the backend URL from environment or use default
    backend_url = os.environ.get('REACT_APP_BACKEND_URL', 'https://eb93ec35-6dfc-49bd-8e54-894b4d016531.preview.emergentagent.com/api')
    
    # Remove '/api' from the end if it exists, as our test methods add it
    if backend_url.endswith('/api'):
        backend_url = backend_url[:-4]
    
    print(f"Testing backend at: {backend_url}")
    tester = ResumeOptimizerTester(backend_url)
    
    # Basic API tests
    print("\n" + "=" * 80)
    print("TESTING BASIC API ENDPOINTS")
    print("=" * 80)
    tester.test_root_endpoint()
    tester.test_health_endpoint()
    tester.test_ai_integration()
    
    # Resume analysis tests
    print("\n" + "=" * 80)
    print("TESTING RESUME ANALYSIS ENDPOINT")
    print("=" * 80)
    tester.test_analyze_with_text()
    tester.test_analyze_with_pdf()
    tester.test_analyze_with_url()
    tester.test_analyze_missing_inputs()
    
    # Cover letter generation tests
    print("\n" + "=" * 80)
    print("TESTING COVER LETTER GENERATION ENDPOINT")
    print("=" * 80)
    tester.test_generate_cover_letter_with_text()
    tester.test_generate_cover_letter_with_pdf()
    tester.test_generate_cover_letter_missing_inputs()
    
    # Print results
    print("\n" + "=" * 80)
    print(f"TESTS PASSED: {tester.tests_passed}/{tester.tests_run}")
    print("=" * 80)
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())
