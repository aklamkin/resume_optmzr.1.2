#!/bin/bash

# ResumeAI Self-Contained App Builder
# Creates a complete .app bundle with all dependencies

APP_NAME="ResumeAI"
APP_BUNDLE="${APP_NAME}.app"
CONTENTS_DIR="${APP_BUNDLE}/Contents"
MACOS_DIR="${CONTENTS_DIR}/MacOS"
RESOURCES_DIR="${CONTENTS_DIR}/Resources"

echo "Building self-contained ResumeAI.app..."

# Clean previous build
rm -rf "${APP_BUNDLE}"

# Create app bundle structure
mkdir -p "${MACOS_DIR}"
mkdir -p "${RESOURCES_DIR}"
mkdir -p "${RESOURCES_DIR}/backend"
mkdir -p "${RESOURCES_DIR}/frontend"
mkdir -p "${RESOURCES_DIR}/python"
mkdir -p "${RESOURCES_DIR}/node"
mkdir -p "${RESOURCES_DIR}/mongodb"

# Create Info.plist
cat > "${CONTENTS_DIR}/Info.plist" << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleExecutable</key>
    <string>ResumeAI</string>
    <key>CFBundleIdentifier</key>
    <string>com.resumeai.app</string>
    <key>CFBundleName</key>
    <string>ResumeAI</string>
    <key>CFBundleVersion</key>
    <string>1.2</string>
    <key>CFBundleShortVersionString</key>
    <string>1.2</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleSignature</key>
    <string>????</string>
    <key>LSMinimumSystemVersion</key>
    <string>10.15</string>
    <key>LSUIElement</key>
    <false/>
    <key>NSHighResolutionCapable</key>
    <true/>
</dict>
</plist>
EOF

# Create the main executable script
cat > "${MACOS_DIR}/ResumeAI" << 'EOF'
#!/bin/bash

# ResumeAI Self-Contained App Launcher
# This script starts all services and opens the app

# Get the app bundle path
APP_BUNDLE="$(dirname "$(dirname "$(dirname "$0")")")"
RESOURCES_DIR="${APP_BUNDLE}/Contents/Resources"
BACKEND_DIR="${RESOURCES_DIR}/backend"
FRONTEND_DIR="${RESOURCES_DIR}/frontend"

# Create temp directory for runtime files
TEMP_DIR="/tmp/resumeai_$$"
mkdir -p "$TEMP_DIR"

# Cleanup function
cleanup() {
    echo "Shutting down ResumeAI..."
    
    # Kill all child processes
    if [ -n "$BACKEND_PID" ]; then
        kill "$BACKEND_PID" 2>/dev/null
    fi
    if [ -n "$FRONTEND_PID" ]; then
        kill "$FRONTEND_PID" 2>/dev/null
    fi
    if [ -n "$MONGO_PID" ]; then
        kill "$MONGO_PID" 2>/dev/null
    fi
    
    # Clean up temp directory
    rm -rf "$TEMP_DIR"
    
    exit 0
}

# Set up signal handlers
trap cleanup EXIT INT TERM

# Function to find available port
find_available_port() {
    local port=$1
    while lsof -i :$port >/dev/null 2>&1; do
        port=$((port + 1))
    done
    echo $port
}

# Find available ports
BACKEND_PORT=$(find_available_port 8001)
FRONTEND_PORT=$(find_available_port 3000)
MONGO_PORT=$(find_available_port 27017)

echo "Starting ResumeAI..."
echo "Backend Port: $BACKEND_PORT"
echo "Frontend Port: $FRONTEND_PORT"
echo "MongoDB Port: $MONGO_PORT"

# Start MongoDB
echo "Starting MongoDB..."
cd "$TEMP_DIR"
mkdir -p mongodb_data
"${RESOURCES_DIR}/mongodb/bin/mongod" --dbpath "./mongodb_data" --port $MONGO_PORT --quiet --logpath "./mongodb.log" &
MONGO_PID=$!

# Wait for MongoDB to start
sleep 3

# Set up environment for backend
export GEMINI_API_KEY="$(cat "${RESOURCES_DIR}/backend/.env" | grep GEMINI_API_KEY | cut -d'=' -f2)"
export MONGO_URL="mongodb://localhost:$MONGO_PORT/resumeai"
export HOST="0.0.0.0"
export PORT="$BACKEND_PORT"

# Start backend
echo "Starting backend..."
cd "$BACKEND_DIR"
"${RESOURCES_DIR}/python/bin/python" -m uvicorn server:app --host 0.0.0.0 --port $BACKEND_PORT &
BACKEND_PID=$!

# Wait for backend to start
sleep 5

# Set up environment for frontend
export REACT_APP_BACKEND_URL="http://localhost:$BACKEND_PORT"
export PORT="$FRONTEND_PORT"

# Start frontend
echo "Starting frontend..."
cd "$FRONTEND_DIR"
"${RESOURCES_DIR}/node/bin/node" "${RESOURCES_DIR}/node/lib/node_modules/yarn/bin/yarn.js" start &
FRONTEND_PID=$!

# Wait for frontend to start
sleep 8

# Open the app in default browser
echo "Opening ResumeAI in browser..."
open "http://localhost:$FRONTEND_PORT"

# Show status window
osascript << EOD
tell application "System Events"
    display dialog "ResumeAI is now running!

Frontend: http://localhost:$FRONTEND_PORT
Backend: http://localhost:$BACKEND_PORT

Click OK to continue using the app.
Close this terminal or quit the app to stop all services." buttons {"OK"} default button "OK" with title "ResumeAI Status"
end tell
EOD

# Keep the script running
echo "ResumeAI is running. Press Ctrl+C to stop."
wait
EOF

# Make executable
chmod +x "${MACOS_DIR}/ResumeAI"

# Create setup script for building the app
cat > "build_resumeai_app.sh" << 'EOF'
#!/bin/bash

# ResumeAI App Builder Setup Script
# Run this script to build the complete app bundle

set -e

APP_NAME="ResumeAI"
APP_BUNDLE="${APP_NAME}.app"
RESOURCES_DIR="${APP_BUNDLE}/Contents/Resources"

echo "Setting up ResumeAI app bundle..."

# Check if source directories exist
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo "Error: Please run this script from the resume_optmzr.1.2 directory"
    echo "Make sure both 'backend' and 'frontend' directories exist"
    exit 1
fi

# Copy application files
echo "Copying application files..."
cp -r backend/* "${RESOURCES_DIR}/backend/"
cp -r frontend/* "${RESOURCES_DIR}/frontend/"

# Download and setup Python
echo "Setting up Python environment..."
if ! command -v python3 &> /dev/null; then
    echo "Error: Python 3 is required. Please install Python 3.11 or higher."
    exit 1
fi

# Create Python virtual environment in the app
python3 -m venv "${RESOURCES_DIR}/python"
source "${RESOURCES_DIR}/python/bin/activate"

# Install Python dependencies
cd "${RESOURCES_DIR}/backend"
"${RESOURCES_DIR}/python/bin/pip" install -r requirements.txt
"${RESOURCES_DIR}/python/bin/pip" install emergentintegrations --extra-index-url https://d33sy5i8bnduwe.cloudfront.net/simple/

# Download and setup Node.js
echo "Setting up Node.js environment..."
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is required. Please install Node.js 18.x or higher."
    exit 1
fi

# Copy Node.js binaries
NODE_VERSION=$(node --version)
NODE_PATH=$(which node)
NODE_DIR=$(dirname "$NODE_PATH")
cp -r "$NODE_DIR"/* "${RESOURCES_DIR}/node/"

# Install frontend dependencies
cd "${RESOURCES_DIR}/frontend"
"${RESOURCES_DIR}/node/bin/node" "${RESOURCES_DIR}/node/lib/node_modules/npm/bin/npm-cli.js" install

# Download and setup MongoDB
echo "Setting up MongoDB..."
MONGO_VERSION="7.0.5"
MONGO_URL="https://fastdl.mongodb.org/osx/mongodb-macos-x86_64-${MONGO_VERSION}.tgz"

if [[ $(uname -m) == "arm64" ]]; then
    MONGO_URL="https://fastdl.mongodb.org/osx/mongodb-macos-arm64-${MONGO_VERSION}.tgz"
fi

cd "${RESOURCES_DIR}"
curl -L "$MONGO_URL" -o mongodb.tgz
tar -xzf mongodb.tgz
mv mongodb-macos-*/* mongodb/
rm -rf mongodb.tgz mongodb-macos-*

# Create .env file template
if [ ! -f "${RESOURCES_DIR}/backend/.env" ]; then
    cat > "${RESOURCES_DIR}/backend/.env" << 'ENVEOF'
GEMINI_API_KEY=your_gemini_api_key_here
MONGO_URL=mongodb://localhost:27017/resumeai
HOST=0.0.0.0
PORT=8001
ENVEOF
    echo "⚠️  Please edit ${RESOURCES_DIR}/backend/.env and add your Gemini API key"
fi

# Create app icon (optional)
cat > "${RESOURCES_DIR}/icon.png" << 'ICONEOF'
# This would contain base64 encoded icon data
# For now, using a placeholder
ICONEOF

echo "✅ ResumeAI.app has been created successfully!"
echo ""
echo "Next steps:"
echo "1. Edit ${RESOURCES_DIR}/backend/.env and add your Gemini API key"
echo "2. Double-click ResumeAI.app to launch"
echo ""
echo "The app is now self-contained and can be shared with others."
echo "All services will start automatically when the app is launched."
EOF

chmod +x "build_resumeai_app.sh"

# Create distribution script
cat > "create_distribution.sh" << 'EOF'
#!/bin/bash

# Create distributable ResumeAI app
echo "Creating distribution package..."

# Create DMG for distribution
hdiutil create -size 500m -fs HFS+ -volname "ResumeAI" temp_resumeai.dmg
hdiutil attach temp_resumeai.dmg

# Copy app to DMG
cp -r ResumeAI.app /Volumes/ResumeAI/

# Create Applications symlink
ln -s /Applications /Volumes/ResumeAI/Applications

# Add README
cat > /Volumes/ResumeAI/README.txt << 'READMEEOF'
ResumeAI Installation Instructions:

1. Drag ResumeAI.app to the Applications folder
2. Double-click ResumeAI.app to launch
3. The app will start all services automatically
4. Your browser will open to the ResumeAI interface

Requirements:
- macOS 10.15 or higher
- Internet connection for AI services

Support:
- Visit: https://github.com/aklamkin/resume_optmzr.1.2
READMEEOF

# Eject and finalize
hdiutil eject /Volumes/ResumeAI
hdiutil convert temp_resumeai.dmg -format UDZO -o ResumeAI_Installer.dmg
rm temp_resumeai.dmg

echo "✅ Distribution package created: ResumeAI_Installer.dmg"
EOF

chmod +x "create_distribution.sh"

echo "✅ App bundle structure created!"
echo ""
echo "To complete the build:"
echo "1. cd to your resume_optmzr.1.2 directory"
echo "2. Run: ./build_resumeai_app.sh"
echo "3. Edit the .env file with your Gemini API key"
echo "4. Double-click ResumeAI.app to test"
echo "5. Run: ./create_distribution.sh to create installer DMG"
EOF

# Make the main script executable
chmod +x "resumeai_app_builder.sh"

echo "✅ ResumeAI app builder created!"
echo ""
echo "Run this script from your resume_optmzr.1.2 directory to build the app."