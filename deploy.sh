#!/bin/bash

# ResumeAI Docker Compose Deployment Script
# For Synology NAS and other Docker-enabled systems

set -e

echo "================================================"
echo "ResumeAI - Docker Compose Deployment"
echo "================================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed or not in PATH${NC}"
    echo "Please install Docker first"
    exit 1
fi

# Check if Docker Compose is available
if ! docker compose version &> /dev/null && ! docker-compose --version &> /dev/null; then
    echo -e "${RED}Error: Docker Compose is not installed${NC}"
    echo "Please install Docker Compose first"
    exit 1
fi

# Use docker compose (newer) or docker-compose (older)
if docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
else
    DOCKER_COMPOSE="docker-compose"
fi

echo -e "${GREEN}✓ Docker and Docker Compose are installed${NC}"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}Warning: .env file not found${NC}"
    echo "Creating .env from .env.example..."
    if [ -f .env.example ]; then
        cp .env.example .env
        echo -e "${GREEN}✓ Created .env file${NC}"
        echo -e "${YELLOW}Please edit .env and add your configuration before continuing${NC}"
        echo ""
        echo "Required changes:"
        echo "1. GEMINI_API_KEY - Your Google Gemini API key"
        echo "2. REACT_APP_BACKEND_URL - Your server IP (e.g., http://192.168.1.100:8080)"
        echo ""
        read -p "Press Enter after you've edited .env file..."
    else
        echo -e "${RED}Error: .env.example not found${NC}"
        exit 1
    fi
fi

echo "Current configuration:"
echo "----------------------------------------"
grep -v '^#' .env | grep -v '^$'
echo "----------------------------------------"
echo ""

read -p "Is this configuration correct? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Please edit .env file and run this script again"
    exit 1
fi

echo ""
echo "Starting deployment..."
echo ""

# Stop existing containers if any
echo "→ Stopping existing containers (if any)..."
$DOCKER_COMPOSE down 2>/dev/null || true

# Pull latest images
echo ""
echo "→ Pulling latest base images..."
$DOCKER_COMPOSE pull mongodb nginx 2>/dev/null || true

# Build containers
echo ""
echo "→ Building application containers..."
$DOCKER_COMPOSE build --no-cache

# Start containers
echo ""
echo "→ Starting containers..."
$DOCKER_COMPOSE up -d

# Wait for services to be ready
echo ""
echo "→ Waiting for services to start..."
sleep 10

# Check container status
echo ""
echo "Container Status:"
echo "----------------------------------------"
$DOCKER_COMPOSE ps

# Check if all containers are running
RUNNING_CONTAINERS=$($DOCKER_COMPOSE ps --services --filter "status=running" | wc -l)
TOTAL_CONTAINERS=$($DOCKER_COMPOSE ps --services | wc -l)

echo "----------------------------------------"
echo ""

if [ "$RUNNING_CONTAINERS" -eq "$TOTAL_CONTAINERS" ]; then
    echo -e "${GREEN}✓ All containers are running!${NC}"
    echo ""
    echo "================================================"
    echo -e "${GREEN}Deployment Successful!${NC}"
    echo "================================================"
    echo ""
    
    # Get the backend URL from .env
    BACKEND_URL=$(grep REACT_APP_BACKEND_URL .env | cut -d '=' -f2)
    
    echo "Access your application:"
    echo "→ ${BACKEND_URL}"
    echo ""
    echo "To check logs:"
    echo "→ $DOCKER_COMPOSE logs -f"
    echo ""
    echo "To stop the application:"
    echo "→ $DOCKER_COMPOSE down"
    echo ""
    echo "To restart the application:"
    echo "→ $DOCKER_COMPOSE restart"
    echo ""
    
    # Try to check backend health
    echo "Checking backend health..."
    sleep 5
    if curl -f http://localhost:8001/api/health &> /dev/null; then
        echo -e "${GREEN}✓ Backend is healthy${NC}"
    else
        echo -e "${YELLOW}⚠ Backend health check failed (may need more time to start)${NC}"
        echo "Check logs with: $DOCKER_COMPOSE logs backend"
    fi
else
    echo -e "${RED}✗ Some containers failed to start${NC}"
    echo ""
    echo "Check logs with:"
    echo "→ $DOCKER_COMPOSE logs"
    echo ""
    echo "Container details:"
    $DOCKER_COMPOSE ps -a
    exit 1
fi

echo ""
echo "================================================"
