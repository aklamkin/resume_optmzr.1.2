from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import os
import uuid
import json
import re
from datetime import datetime
import requests
from bs4 import BeautifulSoup
import pdfplumber
from docx import Document
from dotenv import load_dotenv
import time
import asyncio

# Load environment variables
load_dotenv()

# Debug: Check if API key is loaded
api_key_check = os.environ.get('GEMINI_API_KEY')
print(f"🔑 API Key loaded at startup: {bool(api_key_check)}")
if api_key_check:
    print(f"🔑 API Key starts with: {api_key_check[:10]}...")

app = FastAPI(
    title="Resume Optimizer API",
    description="AI-powered resume optimization backend",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class ResumeAnalysisRequest(BaseModel):
    job_description: str
    resume_text: Optional[str] = None

# Helper functions for file processing
def extract_text_from_pdf(file_content: bytes) -> str:
    """Extract text from PDF file"""
    try:
        import io
        pdf_file = io.BytesIO(file_content)
        
        text = ""
        with pdfplumber.open(pdf_file) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
        
        return text.strip()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to extract text from PDF: {str(e)}")

def extract_text_from_docx(file_content: bytes) -> str:
    """Extract text from DOCX file"""
    try:
        import io
        docx_file = io.BytesIO(file_content)
        
        doc = Document(docx_file)
        text = ""
        
        for paragraph in doc.paragraphs:
            text += paragraph.text + "\n"
            
        return text.strip()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to extract text from DOCX: {str(e)}")

def is_url_only(text: str) -> bool:
    """Check if text is a single URL"""
    text = text.strip()
    # Check if it's a single URL (starts with http/https, no spaces, no newlines)
    url_pattern = r'^https?://[^\s\n]+$'
    return bool(re.match(url_pattern, text))

def scrape_job_description(url: str) -> str:
    """Scrape job description from URL"""
    try:
        # Check for known problematic sites
        if 'linkedin.com' in url.lower():
            raise HTTPException(status_code=400, detail="LinkedIn blocks automated access. Please copy and paste the job description text directly instead of using the URL.")
        
        if 'indeed.com' in url.lower():
            raise HTTPException(status_code=400, detail="Indeed may block automated access. If this fails, please copy and paste the job description text directly.")
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Remove script and style elements
        for script in soup(["script", "style"]):
            script.decompose()
        
        # Try to find job description in common elements
        job_content = ""
        
        # Common job posting selectors
        selectors = [
            '[class*="job-description"]',
            '[class*="job-details"]', 
            '[class*="description"]',
            '[id*="job-description"]',
            '[id*="description"]',
            'main',
            '.content',
            '#content'
        ]
        
        for selector in selectors:
            element = soup.select_one(selector)
            if element:
                job_content = element.get_text(strip=True, separator='\n')
                if len(job_content) > 200:  # If we found substantial content
                    break
        
        # If no specific element found, get all text
        if not job_content or len(job_content) < 200:
            job_content = soup.get_text(strip=True, separator='\n')
        
        # Clean up the text
        lines = [line.strip() for line in job_content.split('\n') if line.strip()]
        cleaned_text = '\n'.join(lines)
        
        # Limit to reasonable length (first 5000 characters)
        if len(cleaned_text) > 5000:
            cleaned_text = cleaned_text[:5000] + "..."
            
        return cleaned_text
        
    except requests.exceptions.RequestException as e:
        if "403" in str(e) or "Forbidden" in str(e):
            raise HTTPException(status_code=400, detail=f"Website blocks automated access. Please copy and paste the job description text directly instead of using the URL.")
        elif "404" in str(e) or "Not Found" in str(e):
            raise HTTPException(status_code=400, detail=f"Job posting not found at this URL. Please check the URL or copy and paste the job description text directly.")
        else:
            raise HTTPException(status_code=400, detail=f"Failed to fetch URL: {str(e)}. Try copying and pasting the job description text directly.")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to scrape job description: {str(e)}. Please copy and paste the job description text directly instead of using the URL.")

# AI Integration using emergentintegrations
async def get_ai_response(job_description: str, resume_text: str):
    try:
        # Import the emergentintegrations library
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        
        print(f"🤖 Starting AI analysis - Job desc: {len(job_description)} chars, Resume: {len(resume_text)} chars")
        
        system_prompt = """You are an expert resume optimization assistant. Your task is to analyze a resume against a specific job description and provide detailed, actionable suggestions for improvement.

Please analyze both the resume and job description, then provide:

1. **Key Skills Gap Analysis**: What skills mentioned in the job description are missing or underrepresented in the resume?

2. **Content Optimization Suggestions**: Specific recommendations for:
   - Headline/summary improvements
   - Experience descriptions that better match the role
   - Skills section enhancements
   - Achievement quantification opportunities

3. **ATS Optimization**: Keywords and phrases from the job description that should be incorporated to pass automated screening systems.

4. **Specific Text Suggestions**: For each major section, provide:
   - Current text (if applicable)
   - Suggested replacement text
   - Reason for the change

Format your response as JSON with the following structure:
{
  "skills_gap": ["skill1", "skill2"],
  "suggestions": [
    {
      "section": "summary|experience|skills|achievements",
      "current_text": "existing text or null",
      "suggested_text": "improved version",
      "reason": "explanation for change"
    }
  ],
  "ats_keywords": ["keyword1", "keyword2"],
  "overall_score": "score out of 100 with explanation"
}"""

        # Create AI chat instance
        api_key = os.environ.get('GEMINI_API_KEY')
        if not api_key:
            print("❌ Gemini API key not found")
            raise HTTPException(status_code=500, detail="Gemini API key not configured")
            
        print("🔑 API key found, creating chat instance...")
        chat = LlmChat(
            api_key=api_key,
            session_id=f"resume_analysis_{uuid.uuid4()}",
            system_message=system_prompt
        ).with_model("gemini", "gemini-2.0-flash")

        # Create user message
        user_message = UserMessage(
            text=f"""
            JOB DESCRIPTION:
            {job_description}
            
            CURRENT RESUME:
            {resume_text}
            
            Please analyze and provide optimization suggestions in the specified JSON format.
            """
        )

        print("📤 Sending message to AI...")
        # Get AI response
        response = await chat.send_message(user_message)
        print("📥 Received AI response")
        
        # Clean up the response - remove markdown code blocks if present
        cleaned_response = str(response)
        if "```json" in cleaned_response:
            # Extract JSON from markdown code blocks
            start_marker = "```json"
            end_marker = "```"
            start_index = cleaned_response.find(start_marker) + len(start_marker)
            end_index = cleaned_response.find(end_marker, start_index)
            if end_index > start_index:
                cleaned_response = cleaned_response[start_index:end_index].strip()
        
        print("✅ AI analysis completed successfully")
        return cleaned_response
        
    except Exception as e:
        print(f"❌ AI analysis error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"AI analysis failed: {str(e)}")

async def get_cover_letter_response(job_description: str, resume_text: str):
    try:
        # Import the emergentintegrations library
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        
        system_prompt = """You are an expert career consultant and professional cover letter writer. Your task is to create TWO compelling, personalized cover letters that demonstrate the candidate's fit for the specific role.

COVER LETTER BEST PRACTICES:
1. **Professional Structure**: Opening paragraph, body paragraphs, closing paragraph
2. **Personalization**: Address specific company and role requirements
3. **Value Proposition**: Clearly articulate what the candidate brings to the role
4. **Evidence-Based**: Use specific examples and quantifiable achievements from the resume
5. **Cultural Fit**: Show understanding of company values and culture when possible
6. **Professional Tone**: Confident but not arrogant, enthusiastic but professional
7. **Call to Action**: End with a clear next step request

GENERATE TWO VERSIONS:

**VERSION 1 - CONCISE (250 words):**
- Opening paragraph: Position mention + top qualification
- One strong body paragraph: Most critical requirement with quantified example
- Closing paragraph: Interest + call to action
- Focus on impact and brevity

**VERSION 2 - COMPREHENSIVE (450-600 words):**
- Opening paragraph: Position mention + compelling hook
- Body paragraph 1: Address most critical job requirement with detailed examples
- Body paragraph 2: Address 2-3 additional requirements with specific achievements
- Body paragraph 3: Cultural fit, company knowledge, and enthusiasm
- Closing paragraph: Strong value proposition + professional call to action

Both versions should be:
- Specific to the job requirements
- Professional yet personable
- Focused on value and fit
- Ready to use with minimal editing

Format the response as JSON with this structure:
{
  "short_version": "Complete 250-word cover letter text",
  "long_version": "Complete 450-600 word cover letter text"
}"""

        # Create AI chat instance
        api_key = os.environ.get('GEMINI_API_KEY')
        if not api_key:
            raise HTTPException(status_code=500, detail="Gemini API key not configured")
            
        chat = LlmChat(
            api_key=api_key,
            session_id=f"cover_letter_{uuid.uuid4()}",
            system_message=system_prompt
        ).with_model("gemini", "gemini-2.0-flash")

        # Create user message
        user_message = UserMessage(
            text=f"""
            JOB DESCRIPTION:
            {job_description}
            
            CANDIDATE'S RESUME:
            {resume_text}
            
            Please generate TWO professional cover letters (short and long versions) that specifically address the requirements in the job description and highlight the most relevant qualifications from the resume. Make them compelling, specific, and professional.
            
            Return the response in JSON format with both versions.
            """
        )

        # Get AI response
        response = await chat.send_message(user_message)
        
        # Clean up the response
        cleaned_response = str(response).strip()
        
        # Try to parse as JSON first
        try:
            if "```json" in cleaned_response:
                # Extract JSON from markdown code blocks
                start_marker = "```json"
                end_marker = "```"
                start_index = cleaned_response.find(start_marker) + len(start_marker)
                end_index = cleaned_response.find(end_marker, start_index)
                if end_index > start_index:
                    cleaned_response = cleaned_response[start_index:end_index].strip()
            
            parsed_response = json.loads(cleaned_response)
            
            return {
                "cover_letter_id": str(uuid.uuid4()),
                "short_version": parsed_response.get("short_version", ""),
                "long_version": parsed_response.get("long_version", ""),
                "created_at": datetime.utcnow()
            }
        except json.JSONDecodeError:
            # Fallback: treat as single cover letter
            return {
                "cover_letter_id": str(uuid.uuid4()),
                "short_version": cleaned_response[:1000] + "..." if len(cleaned_response) > 1000 else cleaned_response,
                "long_version": cleaned_response,
                "created_at": datetime.utcnow()
            }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Cover letter generation failed: {str(e)}")

# API Routes

@app.get("/api/")
async def root():
    return {
        "message": "Resume Optimizer API v1.0", 
        "status": "healthy",
        "endpoints": {
            "health": "/api/health",
            "analyze": "/api/analyze",
            "generate_cover_letter": "/api/generate-cover-letter"
        }
    }

@app.get("/api/test-ai")
async def test_ai():
    """Test AI integration"""
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        
        api_key = os.environ.get('GEMINI_API_KEY')
        if not api_key:
            return {"error": "API key not found"}
        
        chat = LlmChat(
            api_key=api_key,
            session_id="test_session",
            system_message="You are a helpful assistant. Respond with JSON: {\"test\": \"working\"}"
        ).with_model("gemini", "gemini-2.0-flash")
        
        user_message = UserMessage(text="Test message")
        response = await chat.send_message(user_message)
        
        return {"success": True, "response": str(response)}
        
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "version": "1.0.0"}

@app.post("/api/analyze")
async def analyze_resume(
    job_description: str = Form(...),
    resume_text: Optional[str] = Form(None),
    resume_file: Optional[UploadFile] = File(None)
):
    """Analyze resume against job description using AI - supports file upload and URL scraping"""
    try:
        # Process job description (detect URL vs text)
        processed_job_desc = job_description
        if is_url_only(job_description):
            print(f"🌐 Detected URL, scraping job description from: {job_description}")
            processed_job_desc = scrape_job_description(job_description)
        
        # Process resume (file vs text)
        processed_resume_text = ""
        
        if resume_file:
            print(f"📁 Processing uploaded file: {resume_file.filename}")
            
            # Validate file type
            if not resume_file.filename:
                raise HTTPException(status_code=400, detail="No filename provided")
            
            file_ext = resume_file.filename.lower().split('.')[-1]
            if file_ext not in ['pdf', 'docx']:
                raise HTTPException(status_code=400, detail="Only PDF and DOCX files are supported")
            
            # Read file content
            file_content = await resume_file.read()
            
            # Extract text based on file type
            if file_ext == 'pdf':
                processed_resume_text = extract_text_from_pdf(file_content)
            elif file_ext == 'docx':
                processed_resume_text = extract_text_from_docx(file_content)
            
            if not processed_resume_text.strip():
                raise HTTPException(status_code=400, detail="No text could be extracted from the uploaded file")
                
        elif resume_text:
            processed_resume_text = resume_text.strip()
        else:
            raise HTTPException(status_code=400, detail="Either resume_text or resume_file must be provided")
        
        # Validate we have both job description and resume
        if not processed_job_desc.strip():
            raise HTTPException(status_code=400, detail="Job description is required")
        
        if not processed_resume_text.strip():
            raise HTTPException(status_code=400, detail="Resume content is required")
        
        print(f"✅ Processing analysis - Job desc: {len(processed_job_desc)} chars, Resume: {len(processed_resume_text)} chars")
        
        # Get AI analysis
        analysis_result = await get_ai_response(
            processed_job_desc, 
            processed_resume_text
        )
        
        return {
            "analysis_id": str(uuid.uuid4()),
            "analysis": analysis_result,
            "original_resume": processed_resume_text,
            "job_description": processed_job_desc,
            "created_at": datetime.utcnow(),
            "source_info": {
                "job_source": "url" if is_url_only(job_description) else "text",
                "resume_source": "file" if resume_file else "text",
                "file_type": resume_file.filename.split('.')[-1] if resume_file else None
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/generate-cover-letter")
async def generate_cover_letter(
    job_description: str = Form(...),
    resume_text: Optional[str] = Form(None),
    resume_file: Optional[UploadFile] = File(None)
):
    """Generate a cover letter based on resume and job description - supports file upload and URL scraping"""
    try:
        # Process job description (detect URL vs text)
        processed_job_desc = job_description
        if is_url_only(job_description):
            processed_job_desc = scrape_job_description(job_description)
        
        # Process resume (file vs text)
        processed_resume_text = ""
        
        if resume_file:
            # Validate file type
            if not resume_file.filename:
                raise HTTPException(status_code=400, detail="No filename provided")
            
            file_ext = resume_file.filename.lower().split('.')[-1]
            if file_ext not in ['pdf', 'docx']:
                raise HTTPException(status_code=400, detail="Only PDF and DOCX files are supported")
            
            # Read file content
            file_content = await resume_file.read()
            
            # Extract text based on file type
            if file_ext == 'pdf':
                processed_resume_text = extract_text_from_pdf(file_content)
            elif file_ext == 'docx':
                processed_resume_text = extract_text_from_docx(file_content)
                
        elif resume_text:
            processed_resume_text = resume_text.strip()
        else:
            raise HTTPException(status_code=400, detail="Either resume_text or resume_file must be provided")
        
        # Validate we have content
        if not processed_job_desc.strip() or not processed_resume_text.strip():
            raise HTTPException(status_code=400, detail="Both job description and resume content are required")
        
        result = await get_cover_letter_response(
            processed_job_desc,
            processed_resume_text
        )
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)