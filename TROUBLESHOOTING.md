# 🛠️ ResumeAI Troubleshooting Guide

This guide helps you diagnose and fix common issues with your ResumeAI installation.

## 🔍 **Quick Diagnostic Commands**

Run these commands to check your system status:

```bash
# Check all services
sudo systemctl status resumeai-backend nginx mongod

# Check if ports are open
sudo netstat -tlnp | grep -E ':(80|8001|27017)'

# Test API endpoints
curl http://localhost:8001/api/health
curl http://localhost/api/health

# Check logs
sudo journalctl -u resumeai-backend -n 20
sudo tail -n 20 /var/log/nginx/error.log
```

---

## 🚨 **Common Issues & Solutions**

### **1. "Cannot connect to backend" / "Network Error"**

**Symptoms:**
- Frontend loads but API calls fail
- Error: "Network Error" or "Connection refused"

**Diagnosis:**
```bash
# Check if backend is running
sudo systemctl status resumeai-backend

# Check backend logs
sudo journalctl -u resumeai-backend -n 50

# Test backend directly
curl http://localhost:8001/api/health
```

**Solutions:**

#### **A. Backend not running:**
```bash
# Start the backend
sudo systemctl start resumeai-backend

# Enable auto-start
sudo systemctl enable resumeai-backend

# Check for errors
sudo journalctl -u resumeai-backend -f
```

#### **B. Wrong API configuration:**
```bash
# Check frontend .env file
cat /var/www/resumeai/frontend/.env

# Should contain:
# REACT_APP_BACKEND_URL=http://your-domain
```

#### **C. Nginx configuration issue:**
```bash
# Test Nginx config
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx

# Check Nginx is proxying correctly
curl -v http://localhost/api/health
```

---

### **2. "AI analysis failed" / "Gemini API Error"**

**Symptoms:**
- Resume upload works but analysis fails
- Error mentioning API key or authorization

**Diagnosis:**
```bash
# Check backend environment
cat /var/www/resumeai/backend/.env

# Check backend logs for API errors
sudo journalctl -u resumeai-backend | grep -i error
```

**Solutions:**

#### **A. Invalid API Key:**
```bash
# Update your API key in backend .env
sudo nano /var/www/resumeai/backend/.env

# Add or update:
# GEMINI_API_KEY=your_correct_api_key_here

# Restart backend
sudo systemctl restart resumeai-backend
```

#### **B. API Quota Exceeded:**
- Check your Google Cloud Console for API usage
- Verify billing is enabled if needed
- Wait for quota reset or upgrade plan

#### **C. Network connectivity:**
```bash
# Test outbound connectivity
curl -s https://generativelanguage.googleapis.com

# Check firewall rules
sudo ufw status
```

---

### **3. "Frontend won't load" / "404 Not Found"**

**Symptoms:**
- Browser shows 404 or default Nginx page
- Static files not loading

**Diagnosis:**
```bash
# Check if frontend is built
ls -la /var/www/resumeai/frontend/build/

# Check Nginx configuration
sudo nginx -t

# Check Nginx logs
sudo tail -n 20 /var/log/nginx/error.log
```

**Solutions:**

#### **A. Frontend not built:**
```bash
cd /var/www/resumeai/frontend
yarn build

# Verify build completed
ls -la build/
```

#### **B. Wrong Nginx document root:**
```bash
# Check Nginx site config
sudo nano /etc/nginx/sites-available/resumeai

# Verify root path:
# root /var/www/resumeai/frontend/build;
```

#### **C. Permission issues:**
```bash
# Fix permissions
sudo chown -R www-data:www-data /var/www/resumeai
sudo chmod -R 755 /var/www/resumeai
```

---

### **4. "File upload fails" / "Request Entity Too Large"**

**Symptoms:**
- Large PDF files fail to upload
- 413 error in browser network tab

**Solutions:**

#### **A. Increase Nginx upload limit:**
```bash
# Edit Nginx config
sudo nano /etc/nginx/sites-available/resumeai

# Add or increase:
# client_max_body_size 50M;

# Reload Nginx
sudo systemctl reload nginx
```

#### **B. Backend timeout:**
```bash
# Check backend logs during upload
sudo journalctl -u resumeai-backend -f

# Increase timeout in Nginx config:
# proxy_read_timeout 300s;
```

---

### **5. "Database connection failed"**

**Symptoms:**
- Backend fails to start
- MongoDB connection errors in logs

**Diagnosis:**
```bash
# Check MongoDB status
sudo systemctl status mongod

# Check MongoDB logs
sudo tail -n 20 /var/log/mongodb/mongod.log

# Test MongoDB connection
mongo --eval "db.runCommand({connectionStatus : 1})"
```

**Solutions:**

#### **A. MongoDB not running:**
```bash
# Start MongoDB
sudo systemctl start mongod

# Enable auto-start
sudo systemctl enable mongod
```

#### **B. Wrong connection string:**
```bash
# Check backend .env
cat /var/www/resumeai/backend/.env

# Should be:
# MONGO_URL=mongodb://localhost:27017/resumeai
```

---

### **6. "Python dependencies missing"**

**Symptoms:**
- Backend fails to start with import errors
- ModuleNotFoundError in logs

**Solutions:**

```bash
# Activate virtual environment
cd /var/www/resumeai/backend
source venv/bin/activate

# Install missing dependencies
pip install emergentintegrations --extra-index-url https://d33sy5i8bnduwe.cloudfront.net/simple/
pip install -r requirements.txt

# Restart backend
sudo systemctl restart resumeai-backend
```

---

### **7. "SSL/HTTPS Issues"**

**Symptoms:**
- Mixed content warnings
- SSL certificate errors

**Solutions:**

#### **A. Setup SSL with Let's Encrypt:**
```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d your-domain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

#### **B. Force HTTPS redirect:**
```bash
# Add to Nginx config
sudo nano /etc/nginx/sites-available/resumeai

# Add this server block:
# server {
#     listen 80;
#     server_name your-domain.com;
#     return 301 https://$server_name$request_uri;
# }
```

---

## 📊 **Performance Issues**

### **Slow response times:**

```bash
# Check system resources
htop
df -h
free -h

# Check MongoDB performance
mongo --eval "db.stats()"

# Optimize MongoDB (if needed)
mongo --eval "db.runCommand({compact: 'your_collection'})"
```

### **High memory usage:**

```bash
# Check process memory
ps aux | grep -E '(python|node|nginx|mongod)'

# Restart services if needed
sudo systemctl restart resumeai-backend
```

---

## 📝 **Log Locations**

- **Backend logs**: `sudo journalctl -u resumeai-backend`
- **Nginx access logs**: `/var/log/nginx/access.log`
- **Nginx error logs**: `/var/log/nginx/error.log`
- **MongoDB logs**: `/var/log/mongodb/mongod.log`
- **System logs**: `/var/log/syslog`

---

## 🔧 **Maintenance Commands**

### **Restart all services:**
```bash
sudo systemctl restart resumeai-backend nginx mongod
```

### **Update application:**
```bash
# Pull latest code
cd /var/www/resumeai
git pull

# Update backend
cd backend
source venv/bin/activate
pip install -r requirements.txt
deactivate
sudo systemctl restart resumeai-backend

# Update frontend
cd frontend
yarn install
yarn build
sudo systemctl reload nginx
```

### **Check disk space:**
```bash
df -h
sudo du -sh /var/www/resumeai/*
sudo du -sh /var/log/*
```

### **Clean up logs:**
```bash
# Clean old logs
sudo journalctl --vacuum-time=7d
sudo find /var/log -name "*.log" -mtime +7 -delete
```

---

## 🆘 **Emergency Recovery**

### **Complete service restart:**
```bash
sudo systemctl stop resumeai-backend nginx mongod
sleep 5
sudo systemctl start mongod nginx resumeai-backend
sudo systemctl status resumeai-backend nginx mongod
```

### **Reset to known good state:**
```bash
# Backup current config
sudo cp -r /var/www/resumeai /var/www/resumeai.backup

# Reset permissions
sudo chown -R www-data:www-data /var/www/resumeai
sudo chmod -R 755 /var/www/resumeai

# Restart everything
sudo systemctl restart resumeai-backend nginx mongod
```

### **Database issues:**
```bash
# Stop backend
sudo systemctl stop resumeai-backend

# Restart MongoDB
sudo systemctl restart mongod

# Check database
mongo resumeai --eval "db.stats()"

# Start backend
sudo systemctl start resumeai-backend
```

---

## 📞 **Getting Help**

If none of these solutions work:

1. **Gather diagnostic information:**
   ```bash
   # Create diagnostic report
   echo "=== System Info ===" > diagnostic.txt
   uname -a >> diagnostic.txt
   echo "=== Service Status ===" >> diagnostic.txt
   sudo systemctl status resumeai-backend nginx mongod >> diagnostic.txt
   echo "=== Backend Logs ===" >> diagnostic.txt
   sudo journalctl -u resumeai-backend -n 50 >> diagnostic.txt
   echo "=== Nginx Logs ===" >> diagnostic.txt
   sudo tail -n 20 /var/log/nginx/error.log >> diagnostic.txt
   ```

2. **Check configuration files:**
   - `/var/www/resumeai/backend/.env`
   - `/var/www/resumeai/frontend/.env`
   - `/etc/nginx/sites-available/resumeai`

3. **Verify network connectivity:**
   ```bash
   curl -v http://localhost:8001/api/health
   curl -v http://localhost/api/health
   ```

4. **Document your exact error messages and steps to reproduce**

---

**Remember: Most issues are configuration-related. Double-check your environment variables and file permissions first!** 🔧