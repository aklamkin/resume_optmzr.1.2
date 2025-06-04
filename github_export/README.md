# Resume Optimizer 1.0

🎯 **AI-Powered Resume Optimization Tool**

A free, professional resume optimization tool that uses AI to analyze your resume against job descriptions and provides actionable suggestions for improvement. Features include real-time editing, cover letter generation, and comprehensive ATS keyword analysis.

![Resume Optimizer Demo](https://via.placeholder.com/800x400/3B82F6/FFFFFF?text=Resume+Optimizer+1.0)

## ✨ Features

- **🤖 AI-Powered Analysis**: Advanced resume analysis using Google Gemini AI
- **📊 Interactive Ratings**: Skills gap analysis, ATS keyword scoring, and overall resume rating
- **✏️ Real-Time Editing**: Apply/remove AI suggestions with live preview
- **📝 Cover Letter Generation**: Generate both short (250 words) and long (full-page) cover letters
- **🎨 Resizable Interface**: Drag-to-resize panels for optimal viewing
- **🔍 Keyword Analysis**: Color-coded keywords showing what's missing vs. already present
- **📱 Responsive Design**: Works on desktop, tablet, and mobile devices
- **💰 Completely Free**: No accounts, no payments, no restrictions

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v16 or higher)
- **Python** (v3.8 or higher)
- **MongoDB** (local or cloud instance)
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
   
   # Create .env file
   echo "MONGO_URL=mongodb://localhost:27017" > .env
   echo "GEMINI_API_KEY=your_gemini_api_key_here" >> .env
   ```

3. **Setup Frontend**
   ```bash
   cd ../frontend
   yarn install
   
   # Create .env file
   echo "REACT_APP_BACKEND_URL=http://localhost:8001" > .env
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

## 🛠️ Configuration

### Environment Variables

**Backend (.env):**
```env
MONGO_URL=mongodb://localhost:27017
GEMINI_API_KEY=your_actual_gemini_api_key
```

**Frontend (.env):**
```env
REACT_APP_BACKEND_URL=http://localhost:8001
```

### API Keys Setup

1. **Google Gemini API Key**:
   - Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create a new API key
   - Add it to `backend/.env`

## 📁 Project Structure

```
resume_optimizer.1.0/
├── backend/
│   ├── server.py              # FastAPI main application
│   ├── requirements.txt       # Python dependencies
│   └── .env                   # Environment variables
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
│   └── .env                  # Environment variables
├── docs/                     # Documentation
├── deploy/                   # Deployment scripts
└── README.md                 # This file
```

## 🎯 How to Use

1. **Enter Job Description**: Paste the job posting in the left textarea
2. **Enter Your Resume**: Paste your current resume text in the right textarea
3. **Click "Analyze Resume"**: AI will analyze and provide suggestions
4. **Review Ratings**: Click on Skills Gap, ATS Keywords, or Overall Score for details
5. **Apply Suggestions**: Toggle individual suggestions on/off with live preview
6. **Generate Cover Letter**: Create professional cover letters in two lengths
7. **Download Results**: Save your optimized resume and cover letter

## 🚀 Deployment

### Option 1: Vercel + Railway (Recommended)

**Frontend (Vercel):**
1. Push code to GitHub
2. Connect Vercel to your repository
3. Set environment variable: `REACT_APP_BACKEND_URL=your_railway_backend_url`
4. Deploy

**Backend (Railway):**
1. Connect Railway to your repository
2. Set environment variables: `MONGO_URL` and `GEMINI_API_KEY`
3. Deploy

### Option 2: Heroku

```bash
# Install Heroku CLI, then:
heroku create your-app-name
heroku config:set GEMINI_API_KEY=your_key
heroku config:set MONGO_URL=your_mongo_url
git push heroku main
```

### Option 3: Docker

```bash
# Build and run with Docker
docker-compose up --build
```

See `/deploy/` folder for detailed deployment scripts and configurations.

## 🔧 Development

### Adding New AI Providers

1. Update `backend/server.py` AI configuration
2. Add new provider logic in `get_ai_response()` function
3. Update frontend if needed for provider-specific features

### Customizing UI

- Edit `frontend/src/App.css` for styling
- Modify `frontend/tailwind.config.js` for theme changes
- Update `frontend/src/App.js` for functionality

### Database Schema

The application uses MongoDB with the following collections:
- No persistent storage required (stateless design)
- All data processed in real-time

## 🐛 Troubleshooting

### Common Issues

**"Analysis failed" error:**
- Check your Gemini API key is valid
- Ensure backend is running on port 8001
- Verify internet connection for AI API calls

**Frontend won't load:**
- Check if backend is running
- Verify REACT_APP_BACKEND_URL points to correct backend
- Try clearing browser cache

**"Module not found" errors:**
- Run `yarn install` in frontend directory
- Run `pip install -r requirements.txt` in backend directory

### Debug Mode

Enable debug logging by setting environment variable:
```bash
export DEBUG=1
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Google Gemini AI** for powerful resume analysis
- **Tailwind CSS** for beautiful, responsive design
- **FastAPI** for robust backend framework
- **React** for dynamic user interface

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/resume_optimizer.1.0/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/resume_optimizer.1.0/discussions)
- **Email**: your-email@example.com

## 🎉 Version History

- **v1.0.0** - Initial release with full functionality
  - AI-powered resume analysis
  - Interactive rating system
  - Cover letter generation
  - Resizable interface
  - Keyword analysis

---

**Made with ❤️ for job seekers everywhere**