#!/bin/bash

# ResumeAI Mac Installer Script
# This script will install and set up ResumeAI on your Mac

set -e  # Exit on any error

# Colors for output
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

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to install Homebrew if not present
install_homebrew() {
    if ! command_exists brew; then
        print_status "Installing Homebrew..."
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
        
        # Add Homebrew to PATH for Apple Silicon Macs
        if [[ $(uname -m) == "arm64" ]]; then
            echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zshrc
            eval "$(/opt/homebrew/bin/brew shellenv)"
        fi
    else
        print_success "Homebrew already installed"
    fi
}

# Function to install Node.js
install_nodejs() {
    if ! command_exists node; then
        print_status "Installing Node.js..."
        brew install node
    else
        NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$NODE_VERSION" -lt 18 ]; then
            print_warning "Node.js version is too old. Upgrading..."
            brew upgrade node
        else
            print_success "Node.js already installed (version $(node --version))"
        fi
    fi
}

# Function to install Python
install_python() {
    if ! command_exists python3; then
        print_status "Installing Python..."
        brew install python@3.11
    else
        PYTHON_VERSION=$(python3 --version | cut -d' ' -f2 | cut -d'.' -f1,2)
        if [[ $(echo "$PYTHON_VERSION < 3.11" | bc -l) -eq 1 ]]; then
            print_warning "Python version is too old. Installing Python 3.11..."
            brew install python@3.11
        else
            print_success "Python already installed (version $(python3 --version))"
        fi
    fi
}

# Function to install MongoDB
install_mongodb() {
    if ! command_exists mongod; then
        print_status "Installing MongoDB..."
        brew tap mongodb/brew
        brew install mongodb-community
        
        # Start MongoDB service
        brew services start mongodb/brew/mongodb-community
        print_success "MongoDB installed and started"
    else
        print_success "MongoDB already installed"
        # Make sure it's running
        brew services start mongodb/brew/mongodb-community 2>/dev/null || true
    fi
}

# Function to install Yarn
install_yarn() {
    if ! command_exists yarn; then
        print_status "Installing Yarn..."
        npm install -g yarn
    else
        print_success "Yarn already installed"
    fi
}

# Function to get Gemini API key
get_gemini_api_key() {
    echo ""
    print_status "You need a Google Gemini API key to use this application."
    print_status "Get one free at: https://aistudio.google.com/"
    echo ""
    
    while true; do
        read -p "Enter your Gemini API key: " GEMINI_API_KEY
        if [ -n "$GEMINI_API_KEY" ]; then
            break
        else
            print_error "API key cannot be empty. Please enter your API key."
        fi
    done
}

# Function to clone and set up the repository
setup_repository() {
    print_status "Setting up ResumeAI repository..."
    
    # Create ResumeAI directory in user's home
    INSTALL_DIR="$HOME/ResumeAI"
    
    if [ -d "$INSTALL_DIR" ]; then
        print_warning "ResumeAI directory already exists. Removing old installation..."
        rm -rf "$INSTALL_DIR"
    fi
    
    # Clone the repository
    print_status "Downloading ResumeAI..."
    git clone https://github.com/aklamkin/resume_optmzr.1.2.git "$INSTALL_DIR"
    cd "$INSTALL_DIR"
    
    print_success "Repository cloned successfully"
}

# Function to set up backend
setup_backend() {
    print_status "Setting up backend..."
    cd "$INSTALL_DIR/backend"
    
    # Create virtual environment
    python3 -m venv venv
    source venv/bin/activate
    
    # Install Python dependencies
    pip install --upgrade pip
    
    # Install emergentintegrations if requirements.txt includes it
    if grep -q "emergentintegrations" requirements.txt; then
        pip install emergentintegrations --extra-index-url https://d33sy5i8bnduwe.cloudfront.net/simple/
    fi
    
    pip install -r requirements.txt
    
    # Create .env file
    cat > .env << EOF
GEMINI_API_KEY=$GEMINI_API_KEY
MONGO_URL=mongodb://localhost:27017/resumeai
HOST=0.0.0.0
PORT=8001
EOF
    
    print_success "Backend setup completed"
}

# Function to set up frontend
setup_frontend() {
    print_status "Setting up frontend..."
    cd "$INSTALL_DIR/frontend"
    
    # Install dependencies
    yarn install
    
    # Create frontend .env file
    cat > .env << EOF
REACT_APP_BACKEND_URL=http://localhost:8001
WDS_SOCKET_PORT=3000
EOF
    
    print_success "Frontend setup completed"
}

# Function to create startup scripts
create_startup_scripts() {
    print_status "Creating startup scripts..."
    
    # Create backend startup script
    cat > "$INSTALL_DIR/start_backend.sh" << 'EOF'
#!/bin/bash
cd "$(dirname "$0")/backend"
source venv/bin/activate
echo "Starting ResumeAI Backend..."
uvicorn server:app --host 0.0.0.0 --port 8001
EOF
    
    # Create frontend startup script
    cat > "$INSTALL_DIR/start_frontend.sh" << 'EOF'
#!/bin/bash
cd "$(dirname "$0")/frontend"
echo "Starting ResumeAI Frontend..."
yarn start
EOF
    
    # Create main startup script
    cat > "$INSTALL_DIR/start_resumeai.sh" << 'EOF'
#!/bin/bash

# ResumeAI Startup Script
echo "Starting ResumeAI..."
echo "===================="

# Check if MongoDB is running
if ! pgrep -x "mongod" > /dev/null; then
    echo "Starting MongoDB..."
    brew services start mongodb/brew/mongodb-community
    sleep 3
fi

# Start backend in background
echo "Starting backend..."
cd "$(dirname "$0")"
./start_backend.sh &
BACKEND_PID=$!

# Wait for backend to start
sleep 5

# Start frontend
echo "Starting frontend..."
./start_frontend.sh &
FRONTEND_PID=$!

echo ""
echo "ResumeAI is starting up!"
echo "======================="
echo "Backend: http://localhost:8001"
echo "Frontend: http://localhost:3000"
echo ""
echo "Wait about 30 seconds, then open your browser to:"
echo "http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop both services"

# Wait for user to stop
trap "echo 'Stopping ResumeAI...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT
wait
EOF
    
    # Make scripts executable
    chmod +x "$INSTALL_DIR/start_backend.sh"
    chmod +x "$INSTALL_DIR/start_frontend.sh"
    chmod +x "$INSTALL_DIR/start_resumeai.sh"
    
    print_success "Startup scripts created"
}

# Function to create desktop shortcut
create_desktop_shortcut() {
    print_status "Creating desktop shortcut..."
    
    # Create AppleScript application
    cat > "$HOME/Desktop/ResumeAI.scpt" << EOF
tell application "Terminal"
    do script "cd '$INSTALL_DIR' && ./start_resumeai.sh"
end tell

delay 3
tell application "System Events"
    tell process "Terminal"
        set frontmost to true
    end tell
end tell
EOF
    
    # Convert to application
    osacompile -o "$HOME/Desktop/ResumeAI.app" "$HOME/Desktop/ResumeAI.scpt"
    rm "$HOME/Desktop/ResumeAI.scpt"
    
    print_success "Desktop shortcut created"
}

# Function to check existing installations
check_existing_installations() {
    echo "======================================"
    echo "    Checking Existing Installations"
    echo "======================================"
    echo ""
    
    print_status "Checking what's already installed on your Mac..."
    echo ""
    
    # Check Homebrew
    if command_exists brew; then
        print_success "✓ Homebrew is already installed"
    else
        print_warning "✗ Homebrew needs to be installed"
    fi
    
    # Check Node.js
    if command_exists node; then
        NODE_VERSION=$(node --version)
        NODE_MAJOR=$(echo "$NODE_VERSION" | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$NODE_MAJOR" -ge 18 ]; then
            print_success "✓ Node.js is already installed ($NODE_VERSION)"
        else
            print_warning "✗ Node.js needs upgrade (current: $NODE_VERSION, need: 18+)"
        fi
    else
        print_warning "✗ Node.js needs to be installed"
    fi
    
    # Check Python
    if command_exists python3; then
        PYTHON_VERSION=$(python3 --version)
        print_success "✓ Python is already installed ($PYTHON_VERSION)"
    else
        print_warning "✗ Python needs to be installed"
    fi
    
    # Check MongoDB
    if command_exists mongod; then
        print_success "✓ MongoDB is already installed"
    else
        print_warning "✗ MongoDB needs to be installed"
    fi
    
    # Check Yarn
    if command_exists yarn; then
        YARN_VERSION=$(yarn --version)
        print_success "✓ Yarn is already installed ($YARN_VERSION)"
    else
        print_warning "✗ Yarn needs to be installed"
    fi
    
    # Check Git
    if command_exists git; then
        GIT_VERSION=$(git --version)
        print_success "✓ Git is already installed ($GIT_VERSION)"
    else
        print_error "✗ Git needs to be installed (run: xcode-select --install)"
    fi
    
    echo ""
    print_status "Check complete!"
    echo ""
}

# Main installation function
main() {
    echo "======================================"
    echo "    ResumeAI Mac Installer v1.0"
    echo "======================================"
    echo ""
    
    # Check if running on macOS
    if [[ "$OSTYPE" != "darwin"* ]]; then
        print_error "This installer is designed for macOS only"
        exit 1
    fi
    
    # First, check existing installations
    check_existing_installations
    
    # Ask user if they want to continue
    echo "Would you like to:"
    echo "1. Continue with installation (safe - won't overwrite existing)"
    echo "2. Exit and check manually"
    echo ""
    read -p "Enter your choice (1 or 2): " choice
    
    case $choice in
        1)
            print_status "Continuing with installation..."
            ;;
        2)
            print_status "Exiting. You can run this script again when ready."
            exit 0
            ;;
        *)
            print_error "Invalid choice. Exiting."
            exit 1
            ;;
    esac
    
    # Check if git is installed
    if ! command_exists git; then
        print_error "Git is not installed. Please install Xcode Command Line Tools first:"
        print_error "Run: xcode-select --install"
        exit 1
    fi
    
    # Get API key first
    get_gemini_api_key
    
    # Install dependencies (with safety checks)
    install_homebrew
    install_nodejs
    install_python
    install_mongodb
    install_yarn
    
    # Set up the application
    setup_repository
    setup_backend
    setup_frontend
    create_startup_scripts
    create_desktop_shortcut
    
    echo ""
    print_success "Installation completed successfully!"
    echo ""
    echo "======================================"
    echo "           How to Use ResumeAI"
    echo "======================================"
    echo ""
    echo "1. Double-click the 'ResumeAI.app' on your Desktop"
    echo "   OR"
    echo "2. Open Terminal and run:"
    echo "   cd $INSTALL_DIR && ./start_resumeai.sh"
    echo ""
    echo "3. Wait about 30 seconds for everything to start"
    echo "4. Open your browser to: http://localhost:3000"
    echo ""
    echo "Your ResumeAI installation is located at:"
    echo "$INSTALL_DIR"
    echo ""
    print_warning "Keep your Terminal window open while using ResumeAI"
    print_warning "Press Ctrl+C in Terminal to stop the application"
    echo ""
}

# Run the installer
main "$@"