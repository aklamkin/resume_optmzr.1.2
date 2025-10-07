# ResumeAI - Synology NAS Deployment Guide

Complete guide to deploy ResumeAI on your Synology NAS using Docker Compose.

## 📋 Prerequisites

### Synology Requirements
- **DSM Version**: 7.0 or higher
- **RAM**: Minimum 4GB available
- **Storage**: At least 5GB free space
- **Package**: Container Manager (or Docker) installed

### What You'll Need
- Google Gemini API Key ([Get one free here](https://aistudio.google.com/))
- SSH access to your NAS (optional, but recommended)
- Basic familiarity with Synology DSM interface

---

## 🚀 Quick Start (3 Steps)

### Step 1: Prepare Files on Your Computer

1. **Download the repository** to your computer
2. **Copy the `.env.example` to `.env`**:
   ```bash
   cp .env.example .env
   ```

3. **Edit the `.env` file** with your settings:
   ```env
   GEMINI_API_KEY=AIzaSyAjCoNRO-JjV3BogCG-Z7mJipzbd7puXrw
   REACT_APP_BACKEND_URL=http://YOUR_NAS_IP:8080
   ```
   
   Replace `YOUR_NAS_IP` with your actual NAS IP address (e.g., `192.168.1.100`)

### Step 2: Upload to Synology NAS

**Option A: Using File Station (Recommended for beginners)**
1. Open **File Station** in DSM
2. Navigate to `/docker/` folder (create it if it doesn't exist)
3. Create a new folder: `/docker/resumeai/`
4. Upload all files from the repository to this folder
5. Ensure the `.env` file is uploaded correctly

**Option B: Using SSH**
```bash
# On your computer, navigate to the project folder
cd /path/to/resumeai

# Copy to NAS via SCP
scp -r . your_nas_username@YOUR_NAS_IP:/volume1/docker/resumeai/
```

### Step 3: Deploy with Container Manager

1. **Open Container Manager** in DSM
2. Go to **Project** tab
3. Click **Create**
4. Enter project details:
   - **Project Name**: `resumeai`
   - **Path**: Select `/docker/resumeai`
   - **Source**: Choose `docker-compose.yml`
5. Click **Next**
6. Review the services (should show: mongodb, backend, frontend, nginx)
7. Click **Done**
8. The containers will start building and deploying

---

## 🌐 Accessing Your Application

Once deployment is complete:

1. **Wait 2-3 minutes** for all services to start
2. **Open your browser** and go to:
   ```
   http://YOUR_NAS_IP:8080
   ```
   Example: `http://192.168.1.100:8080`

3. You should see the ResumeAI landing page!

---

## 📊 Monitoring & Management

### Check Container Status

In Container Manager:
1. Go to **Container** tab
2. You should see 4 containers:
   - ✅ `resumeai-nginx` (Running)
   - ✅ `resumeai-frontend` (Running)
   - ✅ `resumeai-backend` (Running)
   - ✅ `resumeai-mongodb` (Running)

### View Logs

To troubleshoot issues:
1. Select a container
2. Click **Details**
3. Go to **Log** tab
4. Check for any error messages

### Resource Usage

Monitor resource consumption:
1. Go to **Container** tab
2. View CPU and Memory usage for each container
3. Typical usage:
   - MongoDB: ~200-500 MB RAM
   - Backend: ~300-500 MB RAM
   - Frontend: ~100-200 MB RAM
   - Nginx: ~50-100 MB RAM

---

## ⚙️ Configuration

### Port Configuration

Default ports used:
- **8080**: Main application access (Nginx)
- **27017**: MongoDB (internal only)
- **8001**: Backend API (internal only)
- **3000**: Frontend dev server (internal only)

**To change the main port** (e.g., to 9000):
1. Stop the project in Container Manager
2. Edit `docker-compose.yml`
3. Change nginx ports from `"8080:80"` to `"9000:80"`
4. Update `.env` file: `REACT_APP_BACKEND_URL=http://YOUR_NAS_IP:9000`
5. Rebuild and start the project

### Environment Variables

Edit `.env` file for configuration:

```env
# Required: Your Google Gemini API Key
GEMINI_API_KEY=your_actual_api_key_here

# Required: Backend URL (use your NAS IP and port)
REACT_APP_BACKEND_URL=http://192.168.1.100:8080

# Optional: Database settings (usually no need to change)
MONGO_URL=mongodb://mongodb:27017/resumeai
DB_NAME=resumeai
```

---

## 🔄 Updates & Maintenance

### Updating the Application

1. **Stop the containers**:
   - Container Manager → Project → Select `resumeai` → Stop

2. **Update files**:
   - Upload new files via File Station
   - Or use `git pull` if using SSH

3. **Rebuild containers**:
   - Container Manager → Project → Select `resumeai` → Build
   - Wait for build to complete

4. **Start the project**:
   - Click Start

### Backup Your Data

MongoDB data is persisted in Docker volumes. To backup:

**Using Container Manager**:
1. Stop the project
2. Export the `mongodb_data` volume
3. Save the exported file to a safe location

**Using SSH**:
```bash
# Create backup directory
mkdir -p /volume1/backups/resumeai

# Backup MongoDB data
docker run --rm \
  -v resumeai_mongodb_data:/data \
  -v /volume1/backups/resumeai:/backup \
  alpine tar czf /backup/mongodb-backup-$(date +%Y%m%d).tar.gz -C /data .
```

### Restore from Backup

```bash
# Restore MongoDB data
docker run --rm \
  -v resumeai_mongodb_data:/data \
  -v /volume1/backups/resumeai:/backup \
  alpine sh -c "cd /data && tar xzf /backup/mongodb-backup-YYYYMMDD.tar.gz"
```

---

## 🆘 Troubleshooting

### Application Won't Start

**Check 1: Verify all containers are running**
```bash
# Via SSH
cd /volume1/docker/resumeai
docker-compose ps
```

**Check 2: View logs**
```bash
# Backend logs
docker logs resumeai-backend

# Frontend logs
docker logs resumeai-frontend

# MongoDB logs
docker logs resumeai-mongodb
```

**Check 3: Verify network connectivity**
- Ensure port 8080 is not blocked by firewall
- Check if another service is using port 8080

### "Cannot Connect to Backend" Error

1. **Verify backend is running**:
   ```bash
   docker logs resumeai-backend
   ```

2. **Check API health**:
   ```bash
   curl http://localhost:8001/api/health
   ```
   Should return: `{"status":"healthy"}`

3. **Verify environment variables**:
   - Check `.env` file has correct `REACT_APP_BACKEND_URL`
   - Should be: `http://YOUR_NAS_IP:8080` (not localhost)

### "AI Analysis Failed" Error

1. **Verify API key**:
   - Check `.env` file has correct `GEMINI_API_KEY`
   - Test key at [Google AI Studio](https://aistudio.google.com/)

2. **Check backend logs**:
   ```bash
   docker logs resumeai-backend --tail 100
   ```

3. **Verify internet connectivity**:
   - Backend needs internet access to reach Google AI API
   - Check NAS firewall settings

### MongoDB Connection Issues

1. **Check MongoDB is healthy**:
   ```bash
   docker exec resumeai-mongodb mongosh --eval "db.adminCommand('ping')"
   ```

2. **Verify MongoDB logs**:
   ```bash
   docker logs resumeai-mongodb
   ```

3. **Reset MongoDB** (last resort - will lose data):
   ```bash
   docker-compose down -v
   docker-compose up -d
   ```

### Out of Memory Errors

If containers crash due to memory:

1. **Increase Docker memory limit**:
   - DSM → Container Manager → Settings
   - Allocate at least 4GB to Docker

2. **Stop other containers** if needed

3. **Restart your NAS** to free up memory

### Port Already in Use

If port 8080 is already used:

1. **Find what's using the port**:
   ```bash
   sudo netstat -tulpn | grep :8080
   ```

2. **Change the port** in `docker-compose.yml`:
   - Edit nginx ports: `"9000:80"` instead of `"8080:80"`
   - Update `.env`: `REACT_APP_BACKEND_URL=http://YOUR_NAS_IP:9000`

---

## 🔒 Security Recommendations

### 1. HTTPS Setup (Recommended)

Use Synology's built-in reverse proxy:

1. **DSM → Control Panel → Login Portal → Advanced → Reverse Proxy**
2. Click **Create**
3. Configure:
   - **Source**: `https://resumeai.YOUR_DOMAIN.com` (port 443)
   - **Destination**: `http://localhost:8080`
4. Enable HTTPS and select your SSL certificate

### 2. API Key Security

- Never share your `.env` file
- Keep your Gemini API key private
- Monitor API usage at [Google Cloud Console](https://console.cloud.google.com/)

### 3. Network Access

**Internal Network Only** (Most Secure):
- Access only from local network
- No port forwarding needed
- Access via: `http://192.168.1.X:8080`

**External Access** (Less Secure):
- Set up reverse proxy with HTTPS
- Use Synology DDNS or your own domain
- Enable firewall rules
- Consider VPN access instead

### 4. Firewall Configuration

If you want external access:
1. **DSM → Control Panel → Security → Firewall**
2. Create rule to allow port 8080 (or your custom port)
3. Limit to specific IP ranges if possible

---

## 🎯 Performance Tips

### Optimize for Low-End NAS

If you have limited RAM (4GB):

1. **Edit `docker-compose.yml`** to add resource limits:
   ```yaml
   backend:
     ...
     deploy:
       resources:
         limits:
           memory: 512M
   ```

2. **Disable frontend development mode**:
   - The production build is already optimized

3. **Use SSD cache** if available:
   - DSM → Storage Manager → SSD Cache

### Optimize for High Performance

If you have plenty of resources:

1. **Increase MongoDB cache**:
   ```yaml
   mongodb:
     ...
     command: --wiredTigerCacheSizeGB 1
   ```

2. **Enable more worker processes**:
   - Edit `nginx.conf`: `worker_processes 2;`

---

## 📞 Getting Help

### Log Collection for Support

If you need help, collect these logs:

```bash
# Create diagnostic bundle
cd /volume1/docker/resumeai
docker-compose logs > diagnostic-logs.txt

# Include system info
docker-compose ps >> diagnostic-logs.txt
docker version >> diagnostic-logs.txt
```

### Common Resources

- **Test API Key**: [Google AI Studio](https://aistudio.google.com/)
- **MongoDB Check**: `docker exec resumeai-mongodb mongosh --eval "db.adminCommand('ping')"`
- **Backend Health**: `http://YOUR_NAS_IP:8080/api/health`

---

## ✅ Success Checklist

After deployment, verify:

- [ ] All 4 containers are running
- [ ] Web interface loads at `http://YOUR_NAS_IP:8080`
- [ ] Can upload a test resume file
- [ ] Can enter job description
- [ ] "Analyze Resume" button works
- [ ] Results are displayed
- [ ] Can generate cover letter
- [ ] Can download results

---

## 📊 System Requirements

**Minimum**:
- 2 CPU cores
- 4GB RAM
- 5GB storage
- DSM 7.0+

**Recommended**:
- 4 CPU cores
- 8GB RAM
- 10GB storage (for logs and data)
- SSD storage for Docker
- DSM 7.2+

---

## 🎉 Congratulations!

Your ResumeAI application should now be running smoothly on your Synology NAS!

**Access your app**: `http://YOUR_NAS_IP:8080`

**Questions?** Check the troubleshooting section above or review the logs.

---

**Made with ❤️ for Synology NAS users**
