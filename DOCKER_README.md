# ResumeAI - Docker Deployment

Quick reference guide for Docker deployment on any platform (Synology NAS, Linux servers, Docker Desktop, etc.)

## 🎯 What's Included

This Docker setup includes:
- **Backend**: FastAPI server with Google Gemini AI integration
- **Frontend**: React application with modern UI
- **Database**: MongoDB 7.x for data persistence
- **Proxy**: Nginx reverse proxy for routing
- **Volumes**: Persistent storage for database and cache

## 📦 Files Overview

```
├── docker-compose.yml          # Main orchestration file
├── .env                        # Environment configuration
├── .env.example               # Template for environment variables
├── backend/
│   ├── Dockerfile             # Backend container definition
│   └── requirements.txt       # Python dependencies
├── frontend/
│   ├── Dockerfile             # Frontend container definition
│   └── package.json           # Node dependencies
├── nginx.conf                 # Nginx configuration
├── deploy.sh                  # Automated deployment script
├── SYNOLOGY_DEPLOYMENT.md     # Synology NAS specific guide
└── DOCKER_README.md           # This file
```

## 🚀 Quick Start

### Prerequisites
- Docker installed (version 20.10+)
- Docker Compose (version 2.0+)
- 4GB+ RAM available
- 5GB+ disk space

### Deployment Steps

1. **Configure Environment**
   ```bash
   # Copy example environment file
   cp .env.example .env
   
   # Edit with your settings
   nano .env  # or use your preferred editor
   ```

2. **Update Configuration**
   Edit `.env` file:
   ```env
   GEMINI_API_KEY=your_api_key_here
   REACT_APP_BACKEND_URL=http://YOUR_IP:8080
   ```

3. **Deploy**
   
   **Option A: Using the deployment script (Recommended)**
   ```bash
   ./deploy.sh
   ```
   
   **Option B: Manual deployment**
   ```bash
   docker compose build
   docker compose up -d
   ```

4. **Access Application**
   ```
   http://YOUR_IP:8080
   ```

## 🔧 Management Commands

### Start Services
```bash
docker compose up -d
```

### Stop Services
```bash
docker compose down
```

### View Logs
```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f mongodb
```

### Restart Services
```bash
# All services
docker compose restart

# Specific service
docker compose restart backend
```

### Check Status
```bash
docker compose ps
```

### View Resource Usage
```bash
docker stats
```

## 📊 Service Details

### Port Mapping
- **8080**: Main application access (Nginx)
- **27017**: MongoDB (internal, not exposed externally)
- **8001**: Backend API (internal)
- **3000**: Frontend (internal)

### Containers
1. **resumeai-nginx**: Reverse proxy
   - Routes requests to frontend/backend
   - Handles file uploads
   - Manages timeouts

2. **resumeai-backend**: Python FastAPI server
   - AI processing with Gemini
   - File parsing (PDF, DOCX)
   - API endpoints

3. **resumeai-frontend**: React application
   - User interface
   - Real-time editing
   - File upload handling

4. **resumeai-mongodb**: Database
   - Stores analysis results
   - User data persistence

### Data Persistence
Data is stored in Docker volumes:
- `mongodb_data`: Database files
- `mongodb_config`: MongoDB configuration
- `backend_cache`: Python cache
- `frontend_modules`: Node modules

## 🔄 Updates & Maintenance

### Update Application
```bash
# Stop containers
docker compose down

# Pull latest code (if using git)
git pull

# Rebuild and start
docker compose build --no-cache
docker compose up -d
```

### Backup Database
```bash
# Create backup
docker compose exec mongodb mongodump --out /data/backup

# Copy backup to host
docker cp resumeai-mongodb:/data/backup ./mongodb-backup
```

### Restore Database
```bash
# Copy backup to container
docker cp ./mongodb-backup resumeai-mongodb:/data/backup

# Restore
docker compose exec mongodb mongorestore /data/backup
```

### Clean Up
```bash
# Remove stopped containers
docker compose down

# Remove volumes (WARNING: deletes all data)
docker compose down -v

# Remove images
docker compose down --rmi all

# Full cleanup
docker system prune -a
```

## 🐛 Troubleshooting

### Containers Won't Start
```bash
# Check Docker daemon
sudo systemctl status docker

# Check logs
docker compose logs

# Rebuild from scratch
docker compose down -v
docker compose build --no-cache
docker compose up -d
```

### Backend Issues
```bash
# Check backend logs
docker compose logs backend

# Check backend health
curl http://localhost:8001/api/health

# Restart backend
docker compose restart backend
```

### Frontend Issues
```bash
# Check frontend logs
docker compose logs frontend

# Verify build files
docker compose exec frontend ls -la /app/build

# Restart frontend
docker compose restart frontend
```

### Database Issues
```bash
# Check MongoDB logs
docker compose logs mongodb

# Verify MongoDB is running
docker compose exec mongodb mongosh --eval "db.adminCommand('ping')"

# Restart MongoDB (WARNING: may lose data if volume is corrupted)
docker compose restart mongodb
```

### Port Conflicts
If port 8080 is already in use:

1. Edit `docker-compose.yml`:
   ```yaml
   nginx:
     ports:
       - "9000:80"  # Change to any available port
   ```

2. Update `.env`:
   ```env
   REACT_APP_BACKEND_URL=http://YOUR_IP:9000
   ```

3. Rebuild:
   ```bash
   docker compose down
   docker compose up -d
   ```

## 📋 Environment Variables

### Required Variables
```env
GEMINI_API_KEY=          # Your Google Gemini API key
REACT_APP_BACKEND_URL=   # Frontend's backend URL
```

### Optional Variables
```env
MONGO_URL=               # MongoDB connection string (default: mongodb://mongodb:27017/resumeai)
DB_NAME=                 # Database name (default: resumeai)
```

## 🔒 Security Best Practices

1. **Keep API keys secure**
   - Never commit `.env` to git
   - Use `.gitignore` to exclude `.env`
   - Rotate keys regularly

2. **Network isolation**
   - Use Docker networks (already configured)
   - Don't expose internal ports unnecessarily

3. **Regular updates**
   - Update base images regularly
   - Keep Docker daemon updated
   - Monitor for security advisories

4. **HTTPS in production**
   - Use reverse proxy with SSL
   - Enable HSTS headers
   - Use valid certificates

## 🎯 Platform-Specific Guides

- **Synology NAS**: See [SYNOLOGY_DEPLOYMENT.md](SYNOLOGY_DEPLOYMENT.md)
- **Linux Server**: See [INSTALLATION.md](INSTALLATION.md)
- **Docker Desktop**: This guide works as-is

## 📈 Performance Tuning

### For Low-End Systems (4GB RAM)
Edit `docker-compose.yml` to add resource limits:
```yaml
backend:
  deploy:
    resources:
      limits:
        memory: 512M
      reservations:
        memory: 256M
```

### For High-End Systems (8GB+ RAM)
Increase MongoDB cache:
```yaml
mongodb:
  command: --wiredTigerCacheSizeGB 2
```

## ✅ Health Checks

### Manual Health Check
```bash
# Backend API
curl http://localhost:8001/api/health
# Expected: {"status":"healthy"}

# MongoDB
docker compose exec mongodb mongosh --eval "db.adminCommand('ping')"
# Expected: { ok: 1 }

# Frontend (check if serving)
curl -I http://localhost:3000
# Expected: HTTP/1.1 200 OK
```

### Automated Monitoring
Docker Compose includes built-in health checks:
```bash
docker compose ps
```
Look for "(healthy)" status.

## 📞 Getting Help

### Collect Diagnostic Information
```bash
# System information
docker version
docker compose version

# Container status
docker compose ps

# All logs
docker compose logs > diagnostic-logs.txt

# Resource usage
docker stats --no-stream >> diagnostic-logs.txt
```

### Common Issues

1. **"Cannot connect to database"**
   - Check MongoDB is healthy: `docker compose ps`
   - Verify network: `docker network ls`
   - Check logs: `docker compose logs mongodb`

2. **"AI analysis failed"**
   - Verify API key in `.env`
   - Check internet connectivity
   - View backend logs: `docker compose logs backend`

3. **"Out of memory"**
   - Increase Docker memory limit
   - Add resource constraints
   - Close other applications

## 🎉 Success Indicators

Your deployment is successful when:
- ✅ All 4 containers show "Up" status
- ✅ Backend health check returns `{"status":"healthy"}`
- ✅ Frontend loads at `http://YOUR_IP:8080`
- ✅ You can upload and analyze a resume
- ✅ AI analysis completes successfully

---

**Quick Reference Card**

```bash
# Start
docker compose up -d

# Stop
docker compose down

# Logs
docker compose logs -f

# Status
docker compose ps

# Update
docker compose pull && docker compose up -d --build

# Backup
docker compose exec mongodb mongodump --out /backup
```

---

**Made with ❤️ for containerized deployments**
