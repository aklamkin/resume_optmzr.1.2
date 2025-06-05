# ResumeAI - Complete Installation Guide

This guide will walk you through setting up ResumeAI (Resume Optimizer) on your own Linux server from scratch. No prior technical knowledge required!

## 📋 **What You'll Need**

- A Linux server (Ubuntu 20.04+ or CentOS 8+ recommended)
- Root or sudo access to the server
- Internet connection
- Basic command line familiarity
- A Google Gemini API key (we'll show you how to get this)

## 🎯 **What This Application Does**

ResumeAI is an AI-powered resume optimization tool that:
- Analyzes your resume against job descriptions
- Provides improvement suggestions
- Generates ATS-optimized content
- Creates cover letters
- Supports PDF, DOCX, and text formats
- Includes retry logic for AI service reliability

---

## 🚀 **Step-by-Step Installation**

### **Step 1: Update Your System**

```bash
# Update package lists
sudo apt update && sudo apt upgrade -y

# Install essential tools
sudo apt install -y curl wget git unzip software-properties-common
```

### **Step 2: Install Node.js (for Frontend)**

```bash
# Add NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -

# Install Node.js
sudo apt install -y nodejs

# Verify installation
node --version  # Should show v18.x.x
npm --version   # Should show 9.x.x or higher
```

### **Step 3: Install Python 3.11+ (for Backend)**

```bash
# Install Python 3.11
sudo apt install -y python3.11 python3.11-venv python3.11-dev python3-pip

# Create symlink for easier usage
sudo ln -sf /usr/bin/python3.11 /usr/bin/python3

# Verify installation
python3 --version  # Should show Python 3.11.x
```

### **Step 4: Install MongoDB (Database)**

```bash
# Import MongoDB public key
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -

# Add MongoDB repository
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu $(lsb_release -cs)/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Update package list
sudo apt update

# Install MongoDB
sudo apt install -y mongodb-org

# Start and enable MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Verify MongoDB is running
sudo systemctl status mongod
```

### **Step 5: Install Nginx (Web Server)**

```bash
# Install Nginx
sudo apt install -y nginx

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Verify Nginx is running
sudo systemctl status nginx
```

### **Step 6: Install Yarn (Package Manager)**

```bash
# Add Yarn repository
curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | sudo apt-key add -
echo "deb https://dl.yarnpkg.com/debian/ stable main" | sudo tee /etc/apt/sources.list.d/yarn.list

# Update and install Yarn
sudo apt update && sudo apt install -y yarn

# Verify installation
yarn --version
```

---

## 📁 **Step 7: Download and Setup the Application**

### **7.1: Clone the Repository**

```bash
# Navigate to web directory
cd /var/www

# Clone the repository (replace with actual repo URL)
sudo git clone <YOUR_REPOSITORY_URL> resumeai
cd resumeai

# Set proper permissions
sudo chown -R $USER:$USER /var/www/resumeai
```

### **7.2: Setup Backend**

```bash
# Navigate to backend directory
cd /var/www/resumeai/backend

# Create Python virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Install emergentintegrations with special index
pip install emergentintegrations --extra-index-url https://d33sy5i8bnduwe.cloudfront.net/simple/

# Install other Python dependencies
pip install -r requirements.txt

# Deactivate virtual environment for now
deactivate
```

### **7.3: Setup Frontend**

```bash
# Navigate to frontend directory
cd /var/www/resumeai/frontend

# Install dependencies
yarn install

# Build production version
yarn build
```

---

## 🔑 **Step 8: Get Google Gemini API Key**

### **8.1: Create Google Cloud Account**
1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Sign in with your Google account
3. Accept the terms of service

### **8.2: Get API Key**
1. Click "Get API Key" in Google AI Studio
2. Select "Create API key in new project" or use existing project
3. Copy the API key (starts with `AIza...`)
4. **Important**: Keep this key secure and never share it publicly!

---

## ⚙️ **Step 9: Configure Environment Variables**

### **9.1: Backend Configuration**

```bash
# Navigate to backend directory
cd /var/www/resumeai/backend

# Create environment file
sudo nano .env
```

Add this content to the `.env` file:
```env
# Replace YOUR_GEMINI_API_KEY with the actual key from Step 8
GEMINI_API_KEY=YOUR_GEMINI_API_KEY

# MongoDB connection (leave as-is for local MongoDB)
MONGO_URL=mongodb://localhost:27017/resumeai

# Server configuration
HOST=0.0.0.0
PORT=8001
```

**Press `Ctrl+X`, then `Y`, then `Enter` to save**

### **9.2: Frontend Configuration**

```bash
# Navigate to frontend directory
cd /var/www/resumeai/frontend

# Create environment file
sudo nano .env
```

Add this content to the `.env` file:
```env
# Replace YOUR_DOMAIN with your actual domain or server IP
REACT_APP_BACKEND_URL=http://YOUR_DOMAIN

# For local testing, use:
# REACT_APP_BACKEND_URL=http://localhost

# Socket configuration
WDS_SOCKET_PORT=443
```

**Press `Ctrl+X`, then `Y`, then `Enter` to save**

---

## 🌐 **Step 10: Configure Nginx**

```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/resumeai
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name YOUR_DOMAIN;  # Replace with your domain or server IP

    # Serve frontend static files
    location / {
        root /var/www/resumeai/frontend/build;
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    # Proxy API requests to backend
    location /api/ {
        proxy_pass http://localhost:8001/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Handle file uploads
        client_max_body_size 10M;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Handle large file uploads
    client_max_body_size 10M;
}
```

**Press `Ctrl+X`, then `Y`, then `Enter` to save**

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/resumeai /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

---

## 🔄 **Step 11: Create System Services**

### **11.1: Backend Service**

```bash
# Create backend service file
sudo nano /etc/systemd/system/resumeai-backend.service
```

Add this content:
```ini
[Unit]
Description=ResumeAI Backend API
After=network.target mongodb.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/resumeai/backend
Environment=PATH=/var/www/resumeai/backend/venv/bin
ExecStart=/var/www/resumeai/backend/venv/bin/python -m uvicorn server:app --host 0.0.0.0 --port 8001
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

### **11.2: Enable and Start Services**

```bash
# Reload systemd
sudo systemctl daemon-reload

# Enable and start backend
sudo systemctl enable resumeai-backend
sudo systemctl start resumeai-backend

# Check status
sudo systemctl status resumeai-backend
```

---

## 🔧 **Step 12: Final Setup and Testing**

### **12.1: Set Proper Permissions**

```bash
# Set ownership
sudo chown -R www-data:www-data /var/www/resumeai

# Set permissions
sudo chmod -R 755 /var/www/resumeai
```

### **12.2: Test the Installation**

```bash
# Test backend health
curl http://localhost:8001/api/health

# Expected response: {"status":"healthy","version":"1.0.0"}

# Test frontend build
ls -la /var/www/resumeai/frontend/build/

# Should see index.html and other build files
```

### **12.3: Open Firewall Ports**

```bash
# Allow HTTP traffic
sudo ufw allow 80

# Allow HTTPS (if you plan to add SSL later)
sudo ufw allow 443

# Enable firewall if not already enabled
sudo ufw enable
```

---

## 🎉 **Step 13: Access Your Application**

1. Open your web browser
2. Go to `http://YOUR_SERVER_IP` or `http://YOUR_DOMAIN`
3. You should see the ResumeAI landing page!

---

## 🔒 **Step 14: Security Hardening (Recommended)**

### **14.1: Setup SSL Certificate (Optional but Recommended)**

```bash
# Install Certbot for Let's Encrypt
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate (replace YOUR_DOMAIN)
sudo certbot --nginx -d YOUR_DOMAIN

# Test automatic renewal
sudo certbot renew --dry-run
```

### **14.2: Additional Security**

```bash
# Create backup user for the application
sudo adduser resumeai-backup

# Setup log rotation
sudo nano /etc/logrotate.d/resumeai
```

Add to logrotate config:
```
/var/log/resumeai/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    copytruncate
}
```

---

## 📊 **Monitoring and Maintenance**

### **Check Service Status**
```bash
# Check all services
sudo systemctl status resumeai-backend nginx mongod

# View logs
sudo journalctl -u resumeai-backend -f
```

### **Update Application**
```bash
# Pull latest changes
cd /var/www/resumeai
sudo git pull

# Update backend
cd backend
source venv/bin/activate
pip install -r requirements.txt
deactivate
sudo systemctl restart resumeai-backend

# Update frontend
cd ../frontend
yarn install
yarn build
sudo systemctl reload nginx
```

---

## 🆘 **Troubleshooting Guide**

### **Common Issues and Solutions**

#### **1. "Cannot connect to backend"**
```bash
# Check backend service
sudo systemctl status resumeai-backend

# Check backend logs
sudo journalctl -u resumeai-backend -n 50

# Verify API key in .env file
cat /var/www/resumeai/backend/.env
```

#### **2. "Frontend not loading"**
```bash
# Check Nginx status
sudo systemctl status nginx

# Test Nginx configuration
sudo nginx -t

# Check frontend build
ls -la /var/www/resumeai/frontend/build/
```

#### **3. "AI analysis failing"**
- Verify your Gemini API key is correct
- Check if you have API quota remaining
- Ensure internet connectivity from server

#### **4. "File upload not working"**
- Check Nginx client_max_body_size setting
- Verify file permissions on upload directory

### **Log Locations**
- Backend logs: `sudo journalctl -u resumeai-backend`
- Nginx logs: `/var/log/nginx/access.log` and `/var/log/nginx/error.log`
- MongoDB logs: `/var/log/mongodb/mongod.log`

---

## 📞 **Support**

If you encounter issues:

1. Check the troubleshooting section above
2. Verify all services are running: `sudo systemctl status resumeai-backend nginx mongod`
3. Check logs for error messages
4. Ensure your API key is valid and has quota
5. Verify network connectivity and firewall settings

---

## 🎯 **System Requirements Summary**

**Minimum Requirements:**
- 2 CPU cores
- 4GB RAM
- 20GB disk space
- Ubuntu 20.04+ or CentOS 8+

**Recommended Requirements:**
- 4 CPU cores
- 8GB RAM
- 50GB disk space
- SSD storage

**Network Requirements:**
- Outbound internet access (for AI API calls)
- Inbound access on ports 80 and 443

---

## 📝 **Post-Installation Notes**

1. **API Costs**: Monitor your Google Gemini API usage to avoid unexpected charges
2. **Backups**: Consider setting up automated backups of your MongoDB database
3. **Updates**: Check for application updates regularly
4. **Monitoring**: Set up basic monitoring for service health
5. **Scaling**: For high traffic, consider load balancing and multiple backend instances

**Congratulations! Your ResumeAI application should now be running successfully! 🎉**