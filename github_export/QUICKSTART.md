# 🚀 Quick Start Guide for Developers

Get ResumeAI running on your local development environment in minutes!

## ⚡ **Prerequisites**

- **Node.js** 18+ ([Download here](https://nodejs.org/))
- **Python** 3.11+ ([Download here](https://www.python.org/downloads/))
- **MongoDB** 7.0+ ([Download here](https://www.mongodb.com/try/download/community))
- **Google Gemini API Key** ([Get one here](https://aistudio.google.com/))

## 🏃‍♂️ **Quick Setup (5 minutes)**

### **1. Clone & Navigate**
```bash
git clone <your-repo-url>
cd resumeai
```

### **2. Backend Setup**
```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # Linux/Mac
# OR
venv\Scripts\activate     # Windows

# Install dependencies
pip install emergentintegrations --extra-index-url https://d33sy5i8bnduwe.cloudfront.net/simple/
pip install -r requirements.txt

# Configure environment
cp .env.template .env
# Edit .env and add your GEMINI_API_KEY

# Start backend
uvicorn server:app --reload --host 0.0.0.0 --port 8001
```

### **3. Frontend Setup (New Terminal)**
```bash
cd frontend

# Install dependencies
yarn install

# Configure environment
cp .env.template .env
# Edit .env: REACT_APP_BACKEND_URL=http://localhost

# Start frontend
yarn start
```

### **4. Start MongoDB**
```bash
# Linux/Mac
sudo systemctl start mongod

# Mac with Homebrew
brew services start mongodb-community

# Windows
net start MongoDB
```

## 🎯 **Access Your App**

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8001
- **API Health**: http://localhost:8001/api/health

## 🔧 **Development Commands**

### **Backend**
```bash
# Start development server
uvicorn server:app --reload --host 0.0.0.0 --port 8001

# Run tests
python -m pytest

# Check API health
curl http://localhost:8001/api/health
```

### **Frontend**
```bash
# Start development server
yarn start

# Build for production
yarn build

# Run tests
yarn test

# Check dependencies
yarn audit
```

## 🧪 **Test Your Setup**

1. **Upload a resume** (PDF, DOCX, or text)
2. **Enter a job description**
3. **Click "Analyze Resume"**
4. **Verify AI suggestions appear**
5. **Test Apply/Remove buttons**
6. **Generate a cover letter**

## 🛠️ **Development Tips**

### **Hot Reload**
- Frontend automatically reloads on file changes
- Backend reloads with `--reload` flag
- MongoDB doesn't need restart for code changes

### **Debugging**
```bash
# Backend logs
tail -f backend.log

# Frontend browser console
F12 → Console tab

# MongoDB logs
tail -f /var/log/mongodb/mongod.log
```

### **Environment Variables**
```bash
# Backend (.env)
GEMINI_API_KEY=your_key_here
MONGO_URL=mongodb://localhost:27017/resumeai
HOST=0.0.0.0
PORT=8001

# Frontend (.env)
REACT_APP_BACKEND_URL=http://localhost
WDS_SOCKET_PORT=443
```

## 🐛 **Common Issues**

### **"Module not found: emergentintegrations"**
```bash
pip install emergentintegrations --extra-index-url https://d33sy5i8bnduwe.cloudfront.net/simple/
```

### **"Cannot connect to MongoDB"**
```bash
# Check if MongoDB is running
sudo systemctl status mongod

# Start MongoDB
sudo systemctl start mongod
```

### **"API calls failing"**
- Check backend is running on port 8001
- Verify GEMINI_API_KEY is set correctly
- Check frontend .env has correct REACT_APP_BACKEND_URL

### **"Frontend won't start"**
```bash
# Clear node_modules and reinstall
rm -rf node_modules yarn.lock
yarn install
```

## 📂 **Project Structure Quick Reference**

```
resumeai/
├── backend/
│   ├── server.py          # Main FastAPI app
│   ├── requirements.txt   # Python deps
│   └── .env              # Your config
├── frontend/
│   ├── src/App.js        # Main React component
│   ├── package.json      # Node.js deps
│   └── .env              # Your config
└── docs/                 # Documentation
```

## 🚢 **Ready for Production?**

See our complete guides:
- **[INSTALLATION.md](INSTALLATION.md)** - Production deployment
- **[deploy/](deploy/)** - Docker & cloud deployment
- **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** - Problem solving

## 💡 **Next Steps**

1. **Customize the UI** - Edit `frontend/src/App.js` and `App.css`
2. **Add features** - Extend the API in `backend/server.py`
3. **Deploy** - Use our deployment guides for production
4. **Contribute** - See [CONTRIBUTING.md](CONTRIBUTING.md)

---

**Happy coding! 🎉 Need help? Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md)**