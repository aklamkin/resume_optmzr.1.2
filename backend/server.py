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

# Enhanced error response models
class APIError(BaseModel):
    error_type: str  # "service_unavailable", "timeout", "rate_limit", "authentication", "unknown"
    message: str
    retryable: bool
    retry_after_seconds: Optional[int] = None
    details: Optional[str] = None

class RetryableResponse(BaseModel):
    success: bool
    data: Optional[dict] = None
    error: Optional[APIError] = None

# AI Integration using emergentintegrations with enhanced error handling
async def get_ai_response_with_retry(job_description: str, resume_text: str, max_retries: int = 3, retry_delay: int = 5):
    """
    Get AI response with built-in retry logic for handling service overloads
    """
    for attempt in range(max_retries + 1):
        try:
            print(f"🤖 AI Analysis Attempt {attempt + 1}/{max_retries + 1}")
            response = await get_ai_response(job_description, resume_text)
            return RetryableResponse(success=True, data={"analysis": response})
            
        except Exception as e:
            error_str = str(e).lower()
            
            # Classify the error type
            if "overloaded" in error_str or "503" in error_str or "unavailable" in error_str:
                error_type = "service_unavailable"
                retryable = True
                retry_after = retry_delay * (attempt + 1)  # Exponential backoff
                message = "AI service is currently overloaded. Please try again in a few moments."
            elif "timeout" in error_str or "timed out" in error_str:
                error_type = "timeout"
                retryable = True
                retry_after = retry_delay
                message = "Request timed out. The service may be experiencing high load."
            elif "rate limit" in error_str or "429" in error_str:
                error_type = "rate_limit"
                retryable = True
                retry_after = 60  # Wait longer for rate limits
                message = "Rate limit exceeded. Please wait a moment before trying again."
            elif "unauthorized" in error_str or "401" in error_str or "invalid api key" in error_str:
                error_type = "authentication"
                retryable = False
                retry_after = None
                message = "Authentication failed. Please check API key configuration."
            else:
                error_type = "unknown"
                retryable = attempt < max_retries  # Only retry for unknown errors if we have attempts left
                retry_after = retry_delay
                message = f"AI service error: {str(e)}"
            
            error_response = APIError(
                error_type=error_type,
                message=message,
                retryable=retryable,
                retry_after_seconds=retry_after,
                details=str(e)
            )
            
            # If this is our last attempt or error is not retryable, return the error
            if attempt >= max_retries or not retryable:
                print(f"❌ Final attempt failed: {error_response.message}")
                return RetryableResponse(success=False, error=error_response)
            
            # If retryable, wait and try again
            if retryable and attempt < max_retries:
                print(f"⏳ Retrying in {retry_after} seconds... (Attempt {attempt + 1}/{max_retries + 1})")
                await asyncio.sleep(retry_after)
                continue
                
    # Should never reach here, but just in case
    return RetryableResponse(
        success=False, 
        error=APIError(
            error_type="unknown",
            message="Maximum retries exceeded",
            retryable=False
        )
    )

async def get_ai_response(job_description: str, resume_text: str):
    try:
        # Import the emergentintegrations library
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        
        print(f"🤖 Starting AI analysis - Job desc: {len(job_description)} chars, Resume: {len(resume_text)} chars")
        
        system_prompt = """You are Elena Rodriguez, a Senior Resume Optimization Specialist with 15+ years of experience at Fortune 500 companies and top recruiting firms. You've personally reviewed over 10,000 resumes and have deep expertise in ATS systems, hiring manager psychology, and industry-specific optimization strategies.

## YOUR MISSION
Conduct a comprehensive resume analysis against the target job description to identify specific, actionable optimization opportunities that will significantly increase the candidate's interview potential.

## ANALYSIS FRAMEWORK

### PHASE 1: STRATEGIC ASSESSMENT
- Map resume content against job requirements with precision scoring
- Identify critical gaps that disqualify candidates vs. enhancement opportunities
- Assess ATS compatibility and keyword optimization potential

### PHASE 2: TACTICAL OPTIMIZATION
- Provide specific text improvements with clear before/after examples
- Prioritize changes by impact level (High/Medium/Low)
- Ensure recommendations maintain authenticity while maximizing relevance

### PHASE 3: COMPETITIVE POSITIONING
- Highlight differentiating factors that set candidate apart
- Suggest quantification opportunities for achievements
- Recommend strategic keyword placement for maximum ATS impact

## OUTPUT REQUIREMENTS

Provide analysis in this exact JSON structure:

```json
{
  "skills_gap": [
    "List specific skills from job description missing or underrepresented in resume"
  ],
  "suggestions": [
    {
      "section": "summary|experience|skills|achievements|education",
      "current_text": "exact text from resume or null if adding new content",
      "suggested_text": "optimized replacement text with specific improvements",
      "reason": "detailed explanation of why this change increases interview potential",
      "impact_level": "High|Medium|Low",
      "priority": 1-10
    }
  ],
  "ats_keywords": [
    "prioritized list of keywords from job description to incorporate"
  ],
  "overall_score": "X/100 - Current resume strength with specific reasoning and improvement potential"
}
```

## OPTIMIZATION PRINCIPLES
1. **Relevance First**: Every suggestion must directly address job requirements
2. **Quantify Impact**: Include numbers, percentages, and measurable outcomes
3. **ATS Intelligence**: Strategic keyword placement without stuffing
4. **Authentic Enhancement**: Improve existing accomplishments rather than fabricating
5. **Hiring Manager Perspective**: Consider what decision-makers actually want to see

## QUALITY STANDARDS
- Suggestions must be specific and immediately actionable
- Replacements should be professional, industry-appropriate, and compelling
- Each recommendation includes clear reasoning tied to job requirements
- Priority ranking helps candidate focus on highest-impact changes

Analyze with the precision of a top recruiting firm and the insight of an industry expert."""

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

async def get_cover_letter_response_with_retry(job_description: str, resume_text: str, max_retries: int = 3, retry_delay: int = 5):
    """
    Get cover letter response with built-in retry logic for handling service overloads
    """
    for attempt in range(max_retries + 1):
        try:
            print(f"📝 Cover Letter Generation Attempt {attempt + 1}/{max_retries + 1}")
            response = await get_cover_letter_response(job_description, resume_text)
            return RetryableResponse(success=True, data=response)
            
        except Exception as e:
            error_str = str(e).lower()
            
            # Classify the error type (same logic as AI analysis)
            if "overloaded" in error_str or "503" in error_str or "unavailable" in error_str:
                error_type = "service_unavailable"
                retryable = True
                retry_after = retry_delay * (attempt + 1)
                message = "AI service is currently overloaded. Please try again in a few moments."
            elif "timeout" in error_str or "timed out" in error_str:
                error_type = "timeout"
                retryable = True
                retry_after = retry_delay
                message = "Request timed out. The service may be experiencing high load."
            elif "rate limit" in error_str or "429" in error_str:
                error_type = "rate_limit"
                retryable = True
                retry_after = 60
                message = "Rate limit exceeded. Please wait a moment before trying again."
            elif "unauthorized" in error_str or "401" in error_str or "invalid api key" in error_str:
                error_type = "authentication"
                retryable = False
                retry_after = None
                message = "Authentication failed. Please check API key configuration."
            else:
                error_type = "unknown"
                retryable = attempt < max_retries
                retry_after = retry_delay
                message = f"Cover letter generation error: {str(e)}"
            
            error_response = APIError(
                error_type=error_type,
                message=message,
                retryable=retryable,
                retry_after_seconds=retry_after,
                details=str(e)
            )
            
            if attempt >= max_retries or not retryable:
                print(f"❌ Cover letter generation final attempt failed: {error_response.message}")
                return RetryableResponse(success=False, error=error_response)
            
            if retryable and attempt < max_retries:
                print(f"⏳ Retrying cover letter generation in {retry_after} seconds...")
                await asyncio.sleep(retry_after)
                continue
                
    return RetryableResponse(
        success=False, 
        error=APIError(
            error_type="unknown",
            message="Maximum retries exceeded",
            retryable=False
        )
    )

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
        
        # Get AI analysis with retry capability
        ai_result = await get_ai_response_with_retry(
            processed_job_desc, 
            processed_resume_text
        )
        
        # Check if AI analysis was successful
        if not ai_result.success:
            # Return detailed error information for frontend to handle
            raise HTTPException(
                status_code=503,  # Service Unavailable
                detail={
                    "error_type": ai_result.error.error_type,
                    "message": ai_result.error.message,
                    "retryable": ai_result.error.retryable,
                    "retry_after_seconds": ai_result.error.retry_after_seconds,
                    "details": ai_result.error.details
                }
            )
        
        return {
            "analysis_id": str(uuid.uuid4()),
            "analysis": ai_result.data["analysis"],
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
        
        # Generate cover letter with retry capability
        result = await get_cover_letter_response_with_retry(
            processed_job_desc,
            processed_resume_text
        )
        
        # Check if cover letter generation was successful
        if not result.success:
            # Return detailed error information for frontend to handle
            raise HTTPException(
                status_code=503,  # Service Unavailable
                detail={
                    "error_type": result.error.error_type,
                    "message": result.error.message,
                    "retryable": result.error.retryable,
                    "retry_after_seconds": result.error.retry_after_seconds,
                    "details": result.error.details
                }
            )
        
        return result.data
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)