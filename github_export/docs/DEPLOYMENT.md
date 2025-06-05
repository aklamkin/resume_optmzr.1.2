# Deployment Guide

## Overview

Resume Optimizer 1.0 can be deployed using various methods. This guide covers the most popular deployment options.

---

## 🚀 Quick Deploy Options

### Option 1: Vercel + Railway (Recommended)

**Best for:** Production deployments with minimal setup

#### Deploy Backend to Railway

1. **Connect Repository**
   - Go to [Railway](https://railway.app)
   - Create new project from GitHub repo
   - Select your repository

2. **Configure Environment**
   ```env
   GEMINI_API_KEY=your_actual_api_key
   ```

3. **Deploy**
   - Railway will automatically detect the Python app
   - Copy the generated URL

#### Deploy Frontend to Vercel

1. **Connect Repository**
   - Go to [Vercel](https://vercel.com)
   - Import your GitHub repository
   - Select the `frontend` folder as root directory

2. **Configure Environment**
   ```env
   REACT_APP_BACKEND_URL=https://your-railway-app.railway.app
   ```

3. **Deploy**
   - Vercel will build and deploy automatically

---

### Option 2: Heroku (Full Stack)

**Best for:** Simple deployment with database included

#### Prepare for Heroku

1. **Install Heroku CLI**
   ```bash
   # macOS
   brew tap heroku/brew && brew install heroku
   
   # Ubuntu
   sudo snap install --classic heroku
   ```

2. **Create Heroku Apps**
   ```bash
   # Backend
   heroku create your-app-name-backend
   
   # Frontend  
   heroku create your-app-name-frontend
   ```

#### Deploy Backend

1. **Configure Backend**
   ```bash
   cd backend
   
   # Set environment variables
   heroku config:set GEMINI_API_KEY=your_api_key -a your-app-name-backend
   
   # Deploy
   git subtree push --prefix backend heroku main
   ```

2. **Create Procfile** (if not exists)
   ```bash
   echo "web: uvicorn server:app --host 0.0.0.0 --port \$PORT" > Procfile
   ```

#### Deploy Frontend

1. **Configure Frontend**
   ```bash
   cd frontend
   
   # Set backend URL
   heroku config:set REACT_APP_BACKEND_URL=https://your-app-name-backend.herokuapp.com -a your-app-name-frontend
   
   # Deploy
   git subtree push --prefix frontend heroku main
   ```

---

### Option 3: Docker Deployment

**Best for:** Containerized environments and local development

#### Using Docker Compose

1. **Clone Repository**
   ```bash
   git clone https://github.com/yourusername/resume_optimizer.1.0.git
   cd resume_optimizer.1.0
   ```

2. **Configure Environment**
   ```bash
   # Create environment file
   echo "GEMINI_API_KEY=your_api_key" > .env
   ```

3. **Deploy**
   ```bash
   cd deploy
   docker-compose up -d
   ```

#### Individual Docker Images

**Backend:**
```bash
cd backend
docker build -f ../deploy/Dockerfile.backend -t resume-optimizer-backend .
docker run -p 8001:8001 -e GEMINI_API_KEY=your_key resume-optimizer-backend
```

**Frontend:**
```bash
cd frontend
docker build -f ../deploy/Dockerfile.frontend -t resume-optimizer-frontend .
docker run -p 3000:3000 resume-optimizer-frontend
```

---

### Option 4: AWS Deployment

**Best for:** Enterprise deployments with scalability needs

#### Using AWS Elastic Beanstalk

1. **Install EB CLI**
   ```bash
   pip install awsebcli
   ```

2. **Deploy Backend**
   ```bash
   cd backend
   eb init resume-optimizer-backend
   eb create production
   eb setenv GEMINI_API_KEY=your_api_key
   eb deploy
   ```

3. **Deploy Frontend**
   ```bash
   cd frontend
   eb init resume-optimizer-frontend
   eb create production
   eb setenv REACT_APP_BACKEND_URL=your_backend_url
   eb deploy
   ```

---

### Option 5: DigitalOcean App Platform

**Best for:** Simple cloud deployment

1. **Connect Repository**
   - Go to DigitalOcean App Platform
   - Create new app from GitHub

2. **Configure Services**
   
   **Backend Service:**
   - Source: `/backend`
   - Build Command: `pip install -r requirements.txt`
   - Run Command: `uvicorn server:app --host 0.0.0.0 --port 8001`
   - Environment: `GEMINI_API_KEY=your_key`

   **Frontend Service:**
   - Source: `/frontend`
   - Build Command: `yarn build`
   - Environment: `REACT_APP_BACKEND_URL=backend_url`

---

## 🔧 Environment Variables

### Backend (.env)
```env
GEMINI_API_KEY=your_gemini_api_key_here
DEBUG=false
```

### Frontend (.env)
```env
REACT_APP_BACKEND_URL=https://your-backend-domain.com
```

---

## 🚨 Production Checklist

### Security
- [ ] Use HTTPS for all connections
- [ ] Set proper CORS origins (not `"*"`)
- [ ] Add rate limiting
- [ ] Implement API authentication if needed
- [ ] Use environment variables for all secrets

### Performance
- [ ] Enable gzip compression
- [ ] Set up CDN for static assets
- [ ] Implement caching strategies
- [ ] Monitor API response times

### Monitoring
- [ ] Set up error tracking (Sentry, Bugsnag)
- [ ] Configure logging
- [ ] Set up uptime monitoring
- [ ] Monitor API usage and costs

### Backup
- [ ] Regular database backups (if using database)
- [ ] Source code backup (GitHub)
- [ ] Environment variable backup

---

## 🐛 Troubleshooting

### Common Issues

**Build Failures:**
```bash
# Clear caches
docker system prune -f
yarn cache clean
pip cache purge
```

**Environment Variables Not Loading:**
```bash
# Check variable names match exactly
# Restart application after changes
# Verify platform-specific variable setting
```

**CORS Errors:**
```bash
# Update CORS origins in backend
# Ensure frontend URL is whitelisted
# Check protocol (http vs https)
```

**API Key Issues:**
```bash
# Verify API key is valid
# Check key permissions
# Test key with curl directly
```

---

## 📊 Monitoring and Analytics

### Recommended Tools

**Error Tracking:**
- Sentry (error monitoring)
- LogRocket (session replay)

**Performance:**
- Vercel Analytics
- Google Analytics
- Hotjar (user behavior)

**API Monitoring:**
- Postman Monitoring
- New Relic
- DataDog

---

## 💰 Cost Estimation

### Monthly Costs (USD)

**Free Tier:**
- Vercel: $0 (hobby plan)
- Railway: $5/month
- Total: ~$5/month

**Production:**
- Vercel Pro: $20/month
- Railway: $20/month  
- Custom domain: $10/year
- Total: ~$40/month

**Enterprise:**
- AWS/GCP: $100-500/month
- Custom features: Variable
- Support: Variable

---

For more deployment options or custom setups, please refer to the individual platform documentation or contact the maintainers.