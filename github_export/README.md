# Resume Optimizer 1.0

🎯 **AI-Powered Resume Optimization Tool**

A free, professional resume optimization tool that uses AI to analyze your resume against job descriptions and provides actionable suggestions for improvement. Features include real-time editing, cover letter generation, and comprehensive ATS keyword analysis.

## ✨ Features

- **🤖 AI-Powered Analysis**: Advanced resume analysis using Google Gemini AI
- **📊 Interactive Ratings**: Skills gap analysis, ATS keyword scoring, and overall resume rating
- **📁 Smart File Upload**: Upload PDF or DOCX resume files with automatic text extraction
- **🌐 URL Scraping**: Paste job posting URLs for automatic job description extraction
- **✏️ Hybrid Input**: Choose between file upload OR text paste for maximum flexibility
- **🔍 Keyword Analysis**: Color-coded keywords showing what's missing vs. already present
- **✨ Real-Time Editing**: Apply/remove AI suggestions with live preview
- **📝 Cover Letter Generation**: Generate both short (250 words) and long (full-page) cover letters
- **🎨 Resizable Interface**: Drag-to-resize panels for optimal viewing
- **📱 Responsive Design**: Works on desktop, tablet, and mobile devices
- **💰 Completely Free**: No accounts, no payments, no restrictions

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v16 or higher)
- **Python** (v3.8 or higher)
- **Google Gemini API Key** ([Get one here](https://makersuite.google.com/app/apikey))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/resume_optimizer.1.0.git
   cd resume_optimizer.1.0
   ```

2. **Setup Backend**
   ```bash
   cd backend
   pip install -r requirements.txt
   
   # Copy and configure environment
   cp .env.example .env
   # Edit .env file and add your Gemini API key
   ```

3. **Setup Frontend**
   ```bash
   cd ../frontend
   yarn install
   
   # Copy and configure environment
   cp .env.example .env
   # Edit .env file if needed (default should work for local development)
   ```

4. **Start the Application**
   ```bash
   # Terminal 1 - Backend
   cd backend
   python server.py
   
   # Terminal 2 - Frontend
   cd frontend
   yarn start
   ```

5. **Open your browser** to `http://localhost:3000`

## 🎯 How to Use

1. **Enter Job Description**: Paste the job posting in the left textarea
2. **Enter Your Resume**: Paste your current resume text in the right textarea
3. **Click "Analyze Resume"**: AI will analyze and provide suggestions
4. **Review Ratings**: Click on Skills Gap, ATS Keywords, or Overall Score for details
5. **Apply Suggestions**: Toggle individual suggestions on/off with live preview
6. **Generate Cover Letter**: Create professional cover letters in two lengths
7. **Download Results**: Save your optimized resume and cover letter

## 📁 Project Structure

```
resume_optimizer.1.0/
├── backend/
│   ├── server.py              # FastAPI main application
│   ├── requirements.txt       # Python dependencies
│   ├── .env.example          # Environment template
│   └── .env                   # Your environment (create from example)
├── frontend/
│   ├── src/
│   │   ├── App.js            # Main React component
│   │   ├── App.css           # Application styles
│   │   ├── index.js          # React entry point
│   │   └── index.css         # Global styles
│   ├── public/               # Static files
│   ├── package.json          # Node.js dependencies
│   ├── tailwind.config.js    # Tailwind configuration
│   ├── postcss.config.js     # PostCSS configuration
│   ├── .env.example          # Environment template
│   └── .env                  # Your environment (create from example)
├── deploy/                   # Deployment configurations
├── docs/                     # Additional documentation
└── README.md                 # This file
```

## 🚀 Deployment

### Vercel + Railway (Recommended)

**Frontend (Vercel):**
1. Push code to GitHub
2. Connect Vercel to your repository
3. Set environment variable: `REACT_APP_BACKEND_URL=your_railway_backend_url`
4. Deploy

**Backend (Railway):**
1. Connect Railway to your repository
2. Set environment variable: `GEMINI_API_KEY=your_key`
3. Deploy

### Environment Variables

**Backend (.env):**
```env
GEMINI_API_KEY=your_actual_gemini_api_key
```

**Frontend (.env):**
```env
REACT_APP_BACKEND_URL=http://localhost:8001
```

## 🔧 Troubleshooting

**"Analysis failed" error:**
- Check your Gemini API key is valid
- Ensure backend is running on port 8001
- Verify internet connection for AI API calls

**Frontend won't load:**
- Check if backend is running
- Verify REACT_APP_BACKEND_URL points to correct backend
- Try clearing browser cache

## 📄 License

This project is licensed under the MIT License.

## 🎉 Version History

- **v1.0.0** - Initial release with full functionality
  - AI-powered resume analysis
  - Interactive rating system
  - Cover letter generation
  - Resizable interface
  - Keyword analysis

---

**Made with ❤️ for job seekers everywhere**