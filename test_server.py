
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import os
import uuid
import json
from datetime import datetime
import pdfplumber
from docx import Document
import io

app = FastAPI(
    title="Resume Optimizer API Test Server",
    description="Test server for Resume Optimizer API",
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

# Helper functions for file processing
def extract_text_from_pdf(file_content: bytes) -> str:
    """Extract text from PDF file"""
    try:
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
        docx_file = io.BytesIO(file_content)
        
        doc = Document(docx_file)
        text = ""
        
        for paragraph in doc.paragraphs:
            text += paragraph.text + "\n"
            
        return text.strip()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to extract text from DOCX: {str(e)}")

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

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "version": "1.0.0"}

@app.get("/api/test-ai")
async def test_ai():
    """Test AI integration"""
    return {"success": True, "response": "AI integration test successful"}

@app.post("/api/analyze")
async def analyze_resume(
    job_description: str = Form(...),
    resume_text: Optional[str] = Form(None),
    resume_file: Optional[UploadFile] = File(None)
):
    """Analyze resume against job description using AI - supports file upload and URL scraping"""
    try:
        # Process resume (file vs text)
        processed_resume_text = ""
        
        if resume_file:
            print(f"Processing uploaded file: {resume_file.filename}")
            
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
        if not job_description.strip():
            raise HTTPException(status_code=400, detail="Job description is required")
        
        if not processed_resume_text.strip():
            raise HTTPException(status_code=400, detail="Resume content is required")
        
        # Mock AI analysis result
        mock_analysis = {
            "skills_gap": ["MongoDB", "Docker", "Kubernetes"],
            "suggestions": [
                {
                    "section": "summary",
                    "current_text": "Software Engineer with experience in web development",
                    "suggested_text": "Software Engineer with 3+ years of experience in Python web development, specializing in RESTful API design and database integration",
                    "reason": "Aligns better with the job requirements and highlights relevant experience"
                },
                {
                    "section": "experience",
                    "current_text": "Developed web applications using Django",
                    "suggested_text": "Developed scalable web applications using Django, implementing RESTful APIs and integrating with PostgreSQL databases",
                    "reason": "Adds more specific technical details that match the job requirements"
                }
            ],
            "ats_keywords": ["Python", "FastAPI", "RESTful API", "MongoDB", "React"],
            "overall_score": "75/100 - Your resume matches many of the key requirements but could be improved by adding more specific technical details and highlighting experience with MongoDB and containerization technologies"
        }
        
        return {
            "analysis_id": str(uuid.uuid4()),
            "analysis": json.dumps(mock_analysis),
            "original_resume": processed_resume_text,
            "job_description": job_description,
            "created_at": datetime.utcnow(),
            "source_info": {
                "job_source": "url" if job_description.startswith("http") else "text",
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
        if not job_description.strip() or not processed_resume_text.strip():
            raise HTTPException(status_code=400, detail="Both job description and resume content are required")
        
        # Mock cover letter response
        return {
            "cover_letter_id": str(uuid.uuid4()),
            "short_version": "Dear Hiring Manager,\n\nI am writing to express my interest in the Senior Software Engineer position. With over 3 years of experience in Python development and expertise in RESTful API design, I am confident in my ability to contribute to your team.\n\nThank you for your consideration.\n\nSincerely,\nJohn Doe",
            "long_version": "Dear Hiring Manager,\n\nI am writing to express my interest in the Senior Software Engineer position at your company. With over 3 years of experience in Python development and expertise in RESTful API design, I am confident in my ability to contribute to your team.\n\nIn my current role at ABC Corp, I have developed web applications using Django and implemented RESTful APIs that have improved system efficiency by 30%. I have also worked extensively with PostgreSQL databases and have experience with frontend frameworks like React.\n\nI am particularly excited about the opportunity to work with MongoDB and containerization technologies like Docker and Kubernetes, as I am eager to expand my skillset in these areas.\n\nThank you for your consideration. I look forward to the opportunity to discuss how my skills and experience align with your needs.\n\nSincerely,\nJohn Doe",
            "created_at": datetime.utcnow()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
