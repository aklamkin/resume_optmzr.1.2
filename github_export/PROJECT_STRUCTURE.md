# 📁 ResumeAI Project Structure

This document explains the organization and purpose of each file and directory in the ResumeAI project.

## 🗂️ **Root Directory Structure**

```
resumeai/
├── 📋 README.md                 # Main project documentation
├── 📋 INSTALLATION.md           # Complete installation guide
├── 📋 TROUBLESHOOTING.md        # Problem-solving guide
├── 📋 DOCS_INDEX.md            # Documentation navigation
├── 📋 CONTRIBUTING.md          # Contribution guidelines
├── 📋 LICENSE                  # MIT License
├── 🔧 setup.sh                 # Automated installation script
├── 🔧 verify-package.sh        # Package verification script
├── 📁 backend/                 # Python FastAPI backend
├── 📁 frontend/                # React.js frontend
├── 📁 deploy/                  # Deployment configurations
├── 📁 docs/                    # Additional documentation
└── 📁 .github/                 # GitHub Actions & templates
```

## 🐍 **Backend Directory (`/backend/`)**

```
backend/
├── 📄 server.py               # Main FastAPI application
├── 📄 requirements.txt        # Python dependencies
├── 📄 .env.template          # Environment configuration template
└── 📁 (runtime files)        # Created during installation:
    ├── 📁 venv/              # Python virtual environment
    └── 📄 .env               # Actual environment variables
```

### **Backend Files Explained:**

#### **`server.py`** - Main Application
- FastAPI application with all API endpoints
- AI integration using Google Gemini
- File upload handling (PDF, DOCX)
- Resume analysis and cover letter generation
- Enhanced error handling with retry logic
- MongoDB integration for data storage

#### **`requirements.txt`** - Dependencies
- `fastapi` - Web framework
- `uvicorn` - ASGI server
- `emergentintegrations` - AI model integrations
- `pdfplumber` - PDF text extraction
- `python-docx` - DOCX file handling
- `beautifulsoup4` - HTML parsing for job URLs
- `requests` - HTTP client
- Additional utility libraries

#### **`.env.template`** - Configuration Template
- Template for environment variables
- Instructions for API key setup
- Database connection examples
- Copy to `.env` and customize

## ⚛️ **Frontend Directory (`/frontend/`)**

```
frontend/
├── 📄 package.json            # Node.js dependencies & scripts
├── 📄 yarn.lock              # Dependency lock file
├── 📄 tailwind.config.js     # Tailwind CSS configuration
├── 📄 postcss.config.js      # PostCSS configuration
├── 📄 .env.template          # Environment template
├── 📁 public/               # Static assets
│   ├── 📄 index.html        # HTML template
│   ├── 🖼️ favicon.ico       # Site icon
│   └── 📄 manifest.json     # PWA manifest
├── 📁 src/                  # React source code
│   ├── 📄 index.js          # Application entry point
│   ├── 📄 App.js            # Main React component
│   ├── 📄 App.css           # Component styles
│   └── 📄 index.css         # Global styles
└── 📁 (build files)         # Created during build:
    └── 📁 build/            # Production build output
```

### **Frontend Files Explained:**

#### **`src/App.js`** - Main React Component
- Complete application UI logic
- Resume upload and analysis workflow
- AI suggestions management with Apply/Remove functionality
- Skills and keywords rating system
- Cover letter generation interface
- Enhanced retry dialog system
- Download functionality (PDF, DOCX, TXT)
- Progress tracking and error handling

#### **`src/App.css`** - Styles
- Custom CSS for specific components
- Animations and transitions
- Print styles for downloads

#### **`src/index.js`** - Entry Point
- React DOM rendering
- Application initialization

#### **`package.json`** - Dependencies & Scripts
- React 19.x with modern features
- PDF generation (`jspdf`)
- DOCX creation (`docx`)
- HTTP client (`axios`)
- Routing (`react-router-dom`)
- Development tools and build scripts

## 🚀 **Deployment Directory (`/deploy/`)**

```
deploy/
├── 📄 docker-compose.yml      # Multi-container Docker setup
├── 📄 Dockerfile.backend     # Backend container
├── 📄 Dockerfile.frontend    # Frontend container
├── 📄 railway.toml           # Railway deployment config
└── 📄 vercel.json            # Vercel deployment config
```

### **Deployment Options:**

- **Docker**: Complete containerized deployment
- **Railway**: Cloud platform deployment
- **Vercel**: Frontend-focused deployment
- **Manual**: Traditional server deployment (see INSTALLATION.md)

## 📚 **Documentation Directory (`/docs/`)**

```
docs/
├── 📄 API.md                 # API endpoint documentation
└── 📄 DEPLOYMENT.md          # Advanced deployment guide
```

## 🔧 **Configuration Files**

### **Environment Variables**

#### **Backend Configuration (`.env`)**
```env
GEMINI_API_KEY=your_api_key        # Google Gemini API access
MONGO_URL=mongodb://localhost...   # Database connection
HOST=0.0.0.0                      # Server binding
PORT=8001                         # Server port
```

#### **Frontend Configuration (`.env`)**
```env
REACT_APP_BACKEND_URL=http://...   # Backend API URL
WDS_SOCKET_PORT=443               # Development socket
```

### **Build Configuration**

#### **Tailwind CSS (`tailwind.config.js`)**
- Utility-first CSS framework configuration
- Custom colors and styling
- Responsive design breakpoints

#### **PostCSS (`postcss.config.js`)**
- CSS processing pipeline
- Autoprefixer for browser compatibility
- Tailwind CSS integration

## 🗄️ **Data Flow & Architecture**

```
User Upload → Frontend → API → Backend → AI Service
     ↓           ↓        ↓       ↓         ↓
  Browser    React.js   /api/*  FastAPI   Gemini
     ↓           ↓        ↓       ↓         ↓
 Display ← JSON Response ← Processing ← Analysis
```

### **File Processing Flow:**
1. **Upload**: User selects PDF/DOCX or pastes text
2. **Extract**: Backend extracts text using pdfplumber/python-docx
3. **Analyze**: AI analyzes resume against job description
4. **Suggest**: Generate improvement suggestions
5. **Apply**: User applies/removes suggestions
6. **Download**: Export optimized resume in multiple formats

### **Error Handling Flow:**
1. **Detection**: API call fails (503, timeout, etc.)
2. **Classification**: Error type identification
3. **Dialog**: User-friendly retry interface
4. **Retry**: Exponential backoff with user configuration
5. **Resolution**: Success or final failure notification

## 🔒 **Security Considerations**

### **API Keys**
- Stored in environment variables only
- Never committed to version control
- Secured on server filesystem

### **File Uploads**
- Size limits enforced (10MB)
- Type validation (PDF, DOCX only)
- Temporary processing only

### **Network Security**
- CORS properly configured
- HTTPS enforcement in production
- API rate limiting

## 📦 **Build & Distribution**

### **Development Build**
```bash
# Frontend
yarn start          # Development server

# Backend
uvicorn server:app --reload  # Development server
```

### **Production Build**
```bash
# Frontend
yarn build          # Creates /build directory

# Backend
uvicorn server:app --host 0.0.0.0 --port 8001  # Production server
```

### **Dependencies**
- **Runtime**: Node.js 18+, Python 3.11+, MongoDB 7.0+
- **Build**: Yarn, pip, system libraries
- **Deployment**: Nginx, systemd services

---

**This structure ensures maintainability, scalability, and ease of deployment for the ResumeAI platform! 🚀**