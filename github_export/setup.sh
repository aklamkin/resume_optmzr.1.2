#!/bin/bash

# ResumeAI Quick Setup Script
# This script automates the installation process for Ubuntu/Debian systems

set -e  # Exit on any error

echo "🚀 ResumeAI Installation Script"
echo "================================"
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root"
   exit 1
fi

# Check for sudo access
if ! sudo -n true 2>/dev/null; then
    print_error "This script requires sudo access"
    exit 1
fi

print_status "Starting ResumeAI installation..."

# Update system
print_status "Updating system packages..."
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git unzip software-properties-common

# Install Node.js
print_status "Installing Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install Python 3.11
print_status "Installing Python 3.11..."
sudo apt install -y python3.11 python3.11-venv python3.11-dev python3-pip

# Install MongoDB
print_status "Installing MongoDB..."
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu $(lsb_release -cs)/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt update
sudo apt install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod

# Install Nginx
print_status "Installing Nginx..."
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Install Yarn
print_status "Installing Yarn..."
curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | sudo apt-key add -
echo "deb https://dl.yarnpkg.com/debian/ stable main" | sudo tee /etc/apt/sources.list.d/yarn.list
sudo apt update && sudo apt install -y yarn

# Create application directory
print_status "Setting up application directory..."
sudo mkdir -p /var/www/resumeai
sudo chown -R $USER:$USER /var/www/resumeai

# Get user input for configuration
echo ""
print_status "Configuration Setup"
echo "===================="

# Get Gemini API key
echo ""
print_warning "You need a Google Gemini API key to use this application."
print_status "Get one at: https://aistudio.google.com/"
echo ""
read -p "Enter your Gemini API key: " GEMINI_API_KEY

if [[ -z "$GEMINI_API_KEY" ]]; then
    print_error "Gemini API key is required!"
    exit 1
fi

# Get domain/IP
echo ""
read -p "Enter your domain name or server IP [localhost]: " DOMAIN
DOMAIN=${DOMAIN:-localhost}

# Setup backend
print_status "Setting up backend..."
cd /var/www/resumeai

# Create backend directory structure
mkdir -p backend
cd backend

# Create virtual environment
python3.11 -m venv venv
source venv/bin/activate

# Install Python dependencies
print_status "Installing Python dependencies..."
pip install --upgrade pip

# Install emergentintegrations
pip install emergentintegrations --extra-index-url https://d33sy5i8bnduwe.cloudfront.net/simple/

# Install other dependencies
pip install fastapi==0.104.1 uvicorn==0.24.0 python-multipart==0.0.6 pydantic==2.5.0 python-dotenv==1.0.0 beautifulsoup4==4.12.2 requests==2.31.0 pdfplumber==0.10.3 python-docx==1.1.0

# Create .env file
print_status "Creating backend configuration..."
cat > .env << EOF
GEMINI_API_KEY=$GEMINI_API_KEY
MONGO_URL=mongodb://localhost:27017/resumeai
HOST=0.0.0.0
PORT=8001
EOF

deactivate

# Note: User needs to copy the actual server.py file here
print_warning "Please copy your server.py file to /var/www/resumeai/backend/"

# Setup frontend
print_status "Setting up frontend..."
cd /var/www/resumeai
mkdir -p frontend
cd frontend

# Create package.json
cat > package.json << 'EOF'
{
  "name": "frontend",
  "version": "0.1.0",
  "private": true,
  "dependencies": {
    "axios": "^1.8.4",
    "cra-template": "1.2.0",
    "docx": "^9.5.0",
    "html2canvas": "^1.4.1",
    "jspdf": "^3.0.1",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-router-dom": "^7.5.1",
    "react-scripts": "5.0.1"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  },
  "devDependencies": {
    "@eslint/js": "9.23.0",
    "autoprefixer": "^10.4.20",
    "eslint": "9.23.0",
    "eslint-plugin-import": "2.31.0",
    "eslint-plugin-jsx-a11y": "6.10.2",
    "eslint-plugin-react": "7.37.4",
    "globals": "15.15.0",
    "postcss": "^8.4.49",
    "tailwindcss": "^3.4.17"
  }
}
EOF

# Install frontend dependencies
print_status "Installing frontend dependencies..."
yarn install

# Create frontend .env
print_status "Creating frontend configuration..."
cat > .env << EOF
REACT_APP_BACKEND_URL=http://$DOMAIN
WDS_SOCKET_PORT=443
EOF

print_warning "Please copy your frontend source files to /var/www/resumeai/frontend/src/"

# Configure Nginx
print_status "Configuring Nginx..."
sudo tee /etc/nginx/sites-available/resumeai > /dev/null << EOF
server {
    listen 80;
    server_name $DOMAIN;

    # Serve frontend static files
    location / {
        root /var/www/resumeai/frontend/build;
        try_files \$uri \$uri/ /index.html;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    # Proxy API requests to backend
    location /api/ {
        proxy_pass http://localhost:8001/api/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # Handle file uploads
        client_max_body_size 10M;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Handle large file uploads
    client_max_body_size 10M;
}
EOF

sudo ln -sf /etc/nginx/sites-available/resumeai /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx

# Create systemd service
print_status "Creating system service..."
sudo tee /etc/systemd/system/resumeai-backend.service > /dev/null << EOF
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
EOF

# Set permissions
print_status "Setting permissions..."
sudo chown -R www-data:www-data /var/www/resumeai
sudo chmod -R 755 /var/www/resumeai

# Configure firewall
print_status "Configuring firewall..."
sudo ufw allow 80
sudo ufw allow 443

print_success "Installation completed!"
echo ""
echo "📋 Next Steps:"
echo "=============="
echo "1. Copy your application source files:"
echo "   - Backend: Copy server.py to /var/www/resumeai/backend/"
echo "   - Frontend: Copy src/ directory to /var/www/resumeai/frontend/"
echo ""
echo "2. Build the frontend:"
echo "   cd /var/www/resumeai/frontend"
echo "   yarn build"
echo ""
echo "3. Start the backend service:"
echo "   sudo systemctl daemon-reload"
echo "   sudo systemctl enable resumeai-backend"
echo "   sudo systemctl start resumeai-backend"
echo ""
echo "4. Access your application:"
echo "   http://$DOMAIN"
echo ""
echo "🔧 Useful Commands:"
echo "=================="
echo "Check backend status: sudo systemctl status resumeai-backend"
echo "View backend logs:    sudo journalctl -u resumeai-backend -f"
echo "Restart services:     sudo systemctl restart resumeai-backend nginx"
echo ""
print_success "Setup complete! Copy your source files and follow the next steps above."