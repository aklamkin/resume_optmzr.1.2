from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import os
import uuid
from datetime import datetime

app = FastAPI()

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
    resume_text: str

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
        chat = LlmChat(
            api_key="AIzaSyAjCoNRO-JjV3BogCG-Z7mJipzbd7puXrw",
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

# API Routes

@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}

@app.post("/api/analyze")
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)