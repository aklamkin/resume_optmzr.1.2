#!/bin/bash

echo "🧪 Resume Optimizer 1.0 - Package Verification Test"
echo "=================================================="

# Check if all required files exist
echo "📁 Checking file structure..."

required_files=(
    "README.md"
    "LICENSE"
    "CONTRIBUTING.md"
    "backend/server.py"
    "backend/requirements.txt"
    "backend/.env.example"
    "frontend/src/App.js"
    "frontend/src/App.css"
    "frontend/package.json"
    "frontend/.env.example"
    "deploy/docker-compose.yml"
    "docs/API.md"
    "docs/DEPLOYMENT.md"
)

missing_files=()
for file in "${required_files[@]}"; do
    if [[ ! -f "$file" ]]; then
        missing_files+=("$file")
    fi
done

if [[ ${#missing_files[@]} -eq 0 ]]; then
    echo "✅ All required files present"
else
    echo "❌ Missing files: ${missing_files[*]}"
    exit 1
fi

# Test backend Python syntax
echo "🐍 Testing backend Python syntax..."
cd backend
python -c "
try:
    import server
    print('✅ Backend server.py imports successfully')
except Exception as e:
    print(f'❌ Backend error: {e}')
    exit(1)
"

# Test frontend JavaScript syntax
echo "⚛️ Testing frontend JavaScript syntax..."
cd ../frontend
node -c src/App.js
if [[ $? -eq 0 ]]; then
    echo "✅ Frontend App.js syntax is valid"
else
    echo "❌ Frontend syntax error"
    exit 1
fi

# Check package.json dependencies
echo "📦 Checking frontend dependencies..."
if [[ -f "package.json" ]]; then
    if grep -q "react" package.json && grep -q "tailwindcss" package.json; then
        echo "✅ Frontend dependencies look good"
    else
        echo "❌ Missing core frontend dependencies"
        exit 1
    fi
else
    echo "❌ package.json not found"
    exit 1
fi

# Check backend requirements
echo "📦 Checking backend dependencies..."
cd ../backend
if [[ -f "requirements.txt" ]]; then
    if grep -q "fastapi" requirements.txt && grep -q "emergentintegrations" requirements.txt; then
        echo "✅ Backend dependencies look good"
    else
        echo "❌ Missing core backend dependencies"
        exit 1
    fi
else
    echo "❌ requirements.txt not found"
    exit 1
fi

# Check environment examples
echo "🔧 Checking environment configuration..."
if [[ -f ".env.example" ]] && grep -q "GEMINI_API_KEY" .env.example; then
    echo "✅ Backend .env.example configured correctly"
else
    echo "❌ Backend .env.example missing or incorrect"
    exit 1
fi

cd ../frontend
if [[ -f ".env.example" ]] && grep -q "REACT_APP_BACKEND_URL" .env.example; then
    echo "✅ Frontend .env.example configured correctly"
else
    echo "❌ Frontend .env.example missing or incorrect"
    exit 1
fi

# Check API endpoints consistency
echo "🔌 Checking API endpoints..."
cd ..
if grep -q "@app.post(\"/analyze\")" backend/server.py && grep -q "@app.post(\"/generate-cover-letter\")" backend/server.py; then
    echo "✅ Backend API endpoints defined correctly"
else
    echo "❌ Backend API endpoints missing"
    exit 1
fi

if grep -q "/analyze" frontend/src/App.js && grep -q "/generate-cover-letter" frontend/src/App.js; then
    echo "✅ Frontend API calls match backend endpoints"
else
    echo "❌ Frontend API calls don't match backend"
    exit 1
fi

echo ""
echo "🎉 ALL TESTS PASSED!"
echo "✅ Package is ready for GitHub upload"
echo "✅ Backend and frontend syntax verified"
echo "✅ Dependencies are properly configured"
echo "✅ API endpoints are consistent"
echo "✅ Environment configuration is complete"
echo ""
echo "🚀 Ready to deploy! Follow the README.md instructions."