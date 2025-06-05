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
        raise HTTPException(status_code=400, detail=f"Failed to fetch URL: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to scrape job description: {str(e)}")

# AI Integration using emergentintegrations
async def get_ai_response(job_description: str, resume_text: str):
    try:
        # Import the emergentintegrations library
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        
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
            raise HTTPException(status_code=500, detail="Gemini API key not configured")
            
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

        # Get AI response
        response = await chat.send_message(user_message)
        
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
        
        return cleaned_response
        
    except Exception as e:
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

@app.get("/")
async def root():
    return {
        "message": "Resume Optimizer API v1.0", 
        "status": "healthy",
        "endpoints": {
            "health": "/health",
            "analyze": "/analyze",
            "generate_cover_letter": "/generate-cover-letter"
        }
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "1.0.0"}

@app.post("/analyze")
async def analyze_resume(request: ResumeAnalysisRequest):
    """Analyze resume against job description using AI"""
    try:
        # Get AI analysis
        analysis_result = await get_ai_response(
            request.job_description, 
            request.resume_text
        )
        
        return {
            "analysis_id": str(uuid.uuid4()),
            "analysis": analysis_result,
            "original_resume": request.resume_text,
            "job_description": request.job_description,
            "created_at": datetime.utcnow()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate-cover-letter")
async def generate_cover_letter(request: ResumeAnalysisRequest):
    """Generate a cover letter based on resume and job description"""
    try:
        result = await get_cover_letter_response(
            request.job_description,
            request.resume_text
        )
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)