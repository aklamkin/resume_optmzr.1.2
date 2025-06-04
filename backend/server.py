from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import os
import json
import uuid
import asyncio
from datetime import datetime
import motor.motor_asyncio
from pathlib import Path
import shutil

# Create necessary directories
os.makedirs("uploads", exist_ok=True)
os.makedirs("downloads", exist_ok=True)

app = FastAPI()

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB connection
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URL)
db = client.resume_optimizer

# Pydantic models
class UserCreate(BaseModel):
    username: str
    email: str

class UserUpdate(BaseModel):
    relationship_code: Optional[str] = None
    is_free: Optional[bool] = None

class ResumeAnalysisRequest(BaseModel):
    job_description: str
    resume_text: str

class AIConfig(BaseModel):
    provider: str = "gemini"
    model: str = "gemini-2.0-flash"
    api_key: str
    system_prompt: Optional[str] = None

class AdminConfig(BaseModel):
    ai_configs: Dict[str, AIConfig]
    default_provider: str = "gemini"

# AI Integration using emergentintegrations
async def get_ai_response(job_description: str, resume_text: str, provider: str = "gemini", model: str = "gemini-2.0-flash", api_key: str = None):
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
            api_key=api_key,
            session_id=f"resume_analysis_{uuid.uuid4()}",
            system_message=system_prompt
        ).with_model(provider, model)

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
        return response
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI analysis failed: {str(e)}")

# API Routes

@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}

@app.post("/api/users")
async def create_user(user: UserCreate):
    """Create a new user account"""
    try:
        user_data = {
            "id": str(uuid.uuid4()),
            "username": user.username,
            "email": user.email,
            "is_free": False,  # Default to PAID
            "relationship_code": None,
            "created_at": datetime.utcnow(),
            "resume_versions": []
        }
        
        await db.users.insert_one(user_data)
        return {"message": "User created successfully", "user_id": user_data["id"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/users/{user_id}")
async def get_user(user_id: str):
    """Get user details"""
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Remove MongoDB _id from response
    user.pop("_id", None)
    return user

@app.put("/api/users/{user_id}")
async def update_user(user_id: str, update: UserUpdate):
    """Update user details (for relationship codes and admin changes)"""
    try:
        update_data = {}
        
        if update.relationship_code is not None:
            # Validate relationship code format (6 chars, caps and numbers)
            if len(update.relationship_code) == 6 and update.relationship_code.isalnum() and update.relationship_code.isupper():
                update_data["relationship_code"] = update.relationship_code
            else:
                raise HTTPException(status_code=400, detail="Invalid relationship code format (must be 6 characters, uppercase letters and numbers)")
        
        if update.is_free is not None:
            update_data["is_free"] = update.is_free
        
        if update_data:
            await db.users.update_one({"id": user_id}, {"$set": update_data})
        
        return {"message": "User updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/users/{user_id}/analyze-resume")
async def analyze_resume(user_id: str, request: ResumeAnalysisRequest):
    """Analyze resume against job description using AI"""
    try:
        # Get user to check if they're free
        user = await db.users.find_one({"id": user_id})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Get AI configuration
        config = await db.admin_config.find_one({"type": "ai_config"})
        if not config:
            # Use default Gemini config
            api_key = "AIzaSyAjCoNRO-JjV3BogCG-Z7mJipzbd7puXrw"
            provider = "gemini"
            model = "gemini-2.0-flash"
        else:
            default_provider = config.get("default_provider", "gemini")
            ai_configs = config.get("ai_configs", {})
            if default_provider in ai_configs:
                ai_config = ai_configs[default_provider]
                api_key = ai_config["api_key"]
                provider = ai_config["provider"]
                model = ai_config["model"]
            else:
                api_key = "AIzaSyAjCoNRO-JjV3BogCG-Z7mJipzbd7puXrw"
                provider = "gemini"
                model = "gemini-2.0-flash"
        
        # Get AI analysis
        analysis_result = await get_ai_response(
            request.job_description, 
            request.resume_text,
            provider=provider,
            model=model,
            api_key=api_key
        )
        
        # Save analysis to user's history
        analysis_data = {
            "id": str(uuid.uuid4()),
            "job_description": request.job_description,
            "original_resume": request.resume_text,
            "analysis_result": analysis_result,
            "created_at": datetime.utcnow(),
            "is_downloaded": False
        }
        
        await db.users.update_one(
            {"id": user_id},
            {"$push": {"resume_versions": analysis_data}}
        )
        
        return {
            "analysis_id": analysis_data["id"],
            "analysis": analysis_result,
            "can_download_free": user["is_free"]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/users/{user_id}/analyses")
async def get_user_analyses(user_id: str):
    """Get all resume analyses for a user"""
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "analyses": user.get("resume_versions", []),
        "is_free": user.get("is_free", False)
    }

# Admin Routes
@app.get("/api/admin/users")
async def get_all_users():
    """Get all users (admin only)"""
    users = []
    async for user in db.users.find({}):
        user.pop("_id", None)
        users.append(user)
    return {"users": users}

@app.put("/api/admin/users/{user_id}/status")
async def update_user_status(user_id: str, update: UserUpdate):
    """Update user status (admin only)"""
    return await update_user(user_id, update)

@app.get("/api/admin/config")
async def get_admin_config():
    """Get admin configuration"""
    config = await db.admin_config.find_one({"type": "ai_config"})
    if not config:
        # Return default config
        return {
            "ai_configs": {
                "gemini": {
                    "provider": "gemini",
                    "model": "gemini-2.0-flash",
                    "api_key": "AIzaSyAjCoNRO-JjV3BogCG-Z7mJipzbd7puXrw"
                }
            },
            "default_provider": "gemini"
        }
    
    config.pop("_id", None)
    return config

@app.put("/api/admin/config")
async def update_admin_config(config: AdminConfig):
    """Update admin configuration"""
    try:
        config_data = {
            "type": "ai_config",
            "ai_configs": dict(config.ai_configs),
            "default_provider": config.default_provider,
            "updated_at": datetime.utcnow()
        }
        
        await db.admin_config.replace_one(
            {"type": "ai_config"},
            config_data,
            upsert=True
        )
        
        return {"message": "Configuration updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)