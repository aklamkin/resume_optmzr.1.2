#!/usr/bin/env python3
import requests
import json
import os
import time
from pathlib import Path
import io
from fpdf import FPDF

# Configuration
BASE_URL = "http://localhost:8001"
SAMPLE_RESUME = """
John Doe
Software Engineer
john.doe@example.com | (123) 456-7890 | linkedin.com/in/johndoe

SUMMARY
Experienced software engineer with 5+ years of experience in full-stack development, 
specializing in Python, JavaScript, and cloud technologies. Proven track record of 
delivering high-quality applications with a focus on scalability and performance.

SKILLS
Programming: Python, JavaScript, TypeScript, Java
Web Technologies: React, Node.js, FastAPI, Django, Flask
Cloud: AWS (EC2, S3, Lambda), Docker, Kubernetes
Databases: PostgreSQL, MongoDB, Redis
Tools: Git, CI/CD, Jira, Confluence

EXPERIENCE
Senior Software Engineer | TechCorp Inc. | Jan 2020 - Present
- Led development of a microservices-based e-commerce platform using Python and FastAPI
- Implemented CI/CD pipelines reducing deployment time by 40%
- Optimized database queries resulting in 30% performance improvement
- Mentored junior developers and conducted code reviews

Software Engineer | DataSystems LLC | Mar 2018 - Dec 2019
- Developed RESTful APIs using Django and PostgreSQL
- Created responsive web interfaces with React and Redux
- Implemented automated testing increasing code coverage to 85%
- Collaborated with product managers to define and prioritize features

EDUCATION
Bachelor of Science in Computer Science
University of Technology | 2014 - 2018
"""

SAMPLE_JOB_DESCRIPTION = """
Senior Full Stack Developer

About the Role:
We are seeking an experienced Full Stack Developer to join our growing team. The ideal candidate will have strong experience with React, Node.js, and cloud technologies, particularly AWS. You will be responsible for developing and maintaining our web applications, collaborating with cross-functional teams, and contributing to the architecture and design of new features.

Requirements:
- 5+ years of experience in software development
- Strong proficiency in JavaScript/TypeScript, React, and Node.js
- Experience with cloud services (AWS preferred)
- Knowledge of database systems (PostgreSQL, MongoDB)
- Familiarity with CI/CD pipelines and DevOps practices
- Excellent problem-solving and communication skills
- Bachelor's degree in Computer Science or related field

Responsibilities:
- Develop and maintain web applications using React and Node.js
- Design and implement RESTful APIs
- Optimize applications for performance and scalability
- Collaborate with product managers, designers, and other developers
- Participate in code reviews and mentor junior developers
- Stay up-to-date with emerging trends and technologies

Benefits:
- Competitive salary and benefits package
- Remote work options
- Professional development opportunities
- Collaborative and innovative work environment
"""

def print_separator():
    print("\n" + "="*80 + "\n")

def test_health_endpoint():
    print("Testing /api/health endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/api/health")
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200 and response.json().get("status") == "healthy":
            print("✅ Health check passed!")
            return True
        else:
            print("❌ Health check failed!")
            return False
    except Exception as e:
        print(f"❌ Error testing health endpoint: {str(e)}")
        return False

def test_ai_integration():
    print("Testing /api/test-ai endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/api/test-ai")
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code == 200 and response.json().get("success") == True:
            print("✅ AI integration test passed!")
            return True
        else:
            print("❌ AI integration test failed!")
            return False
    except Exception as e:
        print(f"❌ Error testing AI integration: {str(e)}")
        return False

def test_analyze_endpoint_with_text():
    print("Testing /api/analyze endpoint with text input...")
    try:
        data = {
            "job_description": SAMPLE_JOB_DESCRIPTION,
            "resume_text": SAMPLE_RESUME
        }
        
        response = requests.post(
            f"{BASE_URL}/api/analyze",
            data=data
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"Analysis ID: {result.get('analysis_id')}")
            print(f"Source Info: {result.get('source_info')}")
            print("Analysis result sample (truncated):")
            analysis_str = result.get('analysis', '')
            print(analysis_str[:500] + "..." if len(analysis_str) > 500 else analysis_str)
            
            # Try to parse the analysis as JSON to verify it's valid
            try:
                analysis_json = json.loads(analysis_str)
                print("\nAnalysis JSON structure validation:")
                print(f"- skills_gap: {'✅ Present' if 'skills_gap' in analysis_json else '❌ Missing'}")
                print(f"- suggestions: {'✅ Present' if 'suggestions' in analysis_json else '❌ Missing'}")
                print(f"- ats_keywords: {'✅ Present' if 'ats_keywords' in analysis_json else '❌ Missing'}")
                print(f"- overall_score: {'✅ Present' if 'overall_score' in analysis_json else '❌ Missing'}")
            except json.JSONDecodeError:
                print("❌ Analysis result is not valid JSON")
                
            print("✅ Analyze endpoint with text input test passed!")
            return True
        else:
            print(f"❌ Analyze endpoint test failed with status code: {response.status_code}")
            if hasattr(response, 'text'):
                print(f"Error response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error testing analyze endpoint with text: {str(e)}")
        return False

def create_sample_pdf():
    """Create a sample PDF file for testing file upload"""
    try:
        pdf = FPDF()
        pdf.add_page()
        pdf.set_font("Arial", size=12)
        
        # Split the resume into lines and add to PDF
        for line in SAMPLE_RESUME.split('\n'):
            pdf.cell(200, 10, txt=line, ln=True)
        
        # Save to a BytesIO object instead of a file
        pdf_buffer = io.BytesIO()
        pdf.output(pdf_buffer)
        pdf_buffer.seek(0)
        
        print("✅ Created sample PDF in memory for testing")
        return pdf_buffer
    except Exception as e:
        print(f"❌ Error creating sample PDF: {str(e)}")
        return None

def test_analyze_endpoint_with_file():
    print("Testing /api/analyze endpoint with file upload...")
    
    # Create a PDF in memory
    pdf_buffer = create_sample_pdf()
    if not pdf_buffer:
        print("❌ Failed to create sample PDF. Skipping file upload test.")
        return False
    
    try:
        files = {
            'resume_file': ('sample_resume.pdf', pdf_buffer, 'application/pdf')
        }
        
        data = {
            'job_description': SAMPLE_JOB_DESCRIPTION
        }
        
        response = requests.post(
            f"{BASE_URL}/api/analyze",
            files=files,
            data=data
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"Analysis ID: {result.get('analysis_id')}")
            print(f"Source Info: {result.get('source_info')}")
            print("Analysis result sample (truncated):")
            analysis_str = result.get('analysis', '')
            print(analysis_str[:500] + "..." if len(analysis_str) > 500 else analysis_str)
            
            print("✅ Analyze endpoint with file upload test passed!")
            return True
        else:
            print(f"❌ Analyze endpoint with file upload test failed with status code: {response.status_code}")
            if hasattr(response, 'text'):
                print(f"Error response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error testing analyze endpoint with file: {str(e)}")
        return False

def test_cover_letter_generation():
    print("Testing /api/generate-cover-letter endpoint...")
    try:
        data = {
            "job_description": SAMPLE_JOB_DESCRIPTION,
            "resume_text": SAMPLE_RESUME
        }
        
        response = requests.post(
            f"{BASE_URL}/api/generate-cover-letter",
            data=data
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"Cover Letter ID: {result.get('cover_letter_id')}")
            
            # Print short version sample
            short_version = result.get('short_version', '')
            print("\nShort Version Sample (truncated):")
            print(short_version[:300] + "..." if len(short_version) > 300 else short_version)
            
            # Print long version sample
            long_version = result.get('long_version', '')
            print("\nLong Version Sample (truncated):")
            print(long_version[:300] + "..." if len(long_version) > 300 else long_version)
            
            print("✅ Cover letter generation test passed!")
            return True
        else:
            print(f"❌ Cover letter generation test failed with status code: {response.status_code}")
            if hasattr(response, 'text'):
                print(f"Error response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error testing cover letter generation: {str(e)}")
        return False

def run_all_tests():
    print_separator()
    print("RESUME OPTIMIZER API TESTING")
    print_separator()
    
    results = {}
    
    # Test 1: Health Check
    print_separator()
    results["health_check"] = test_health_endpoint()
    
    # Test 2: AI Integration
    print_separator()
    results["ai_integration"] = test_ai_integration()
    
    # Test 3: Analyze Endpoint with Text
    print_separator()
    results["analyze_text"] = test_analyze_endpoint_with_text()
    
    # Test 4: Analyze Endpoint with File Upload
    print_separator()
    results["analyze_file"] = test_analyze_endpoint_with_file()
    
    # Test 5: Cover Letter Generation
    print_separator()
    results["cover_letter"] = test_cover_letter_generation()
    
    # Summary
    print_separator()
    print("TEST RESULTS SUMMARY")
    print_separator()
    print(f"Health Check: {'✅ PASSED' if results['health_check'] else '❌ FAILED'}")
    print(f"AI Integration: {'✅ PASSED' if results['ai_integration'] else '❌ FAILED'}")
    print(f"Analyze Endpoint (Text): {'✅ PASSED' if results['analyze_text'] else '❌ FAILED'}")
    print(f"Analyze Endpoint (File): {'✅ PASSED' if results['analyze_file'] else '❌ FAILED'}")
    print(f"Cover Letter Generation: {'✅ PASSED' if results['cover_letter'] else '❌ FAILED'}")
    
    return results

if __name__ == "__main__":
    run_all_tests()