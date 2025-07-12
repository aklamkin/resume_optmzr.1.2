#!/bin/bash
# System requirements checker for ResumeAI

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

echo "======================================"
echo "    ResumeAI System Requirements"
echo "======================================"
echo ""

print_status "Checking system requirements..."
echo ""

# Check macOS version
OS_VERSION=$(sw_vers -productVersion)
OS_MAJOR=$(echo "$OS_VERSION" | cut -d'.' -f1)
OS_MINOR=$(echo "$OS_VERSION" | cut -d'.' -f2)

print_status "macOS Version: $OS_VERSION"

if [ "$OS_MAJOR" -ge 10 ] && [ "$OS_MINOR" -ge 14 ]; then
    print_success "✓ macOS version is compatible"
else
    print_error "✗ macOS 10.14 or later required"
fi

# Check available disk space
DISK_SPACE=$(df -h / | awk 'NR==2{print $4}')
DISK_SPACE_GB=$(df -g / | awk 'NR==2{print $4}')

print_status "Available Disk Space: $DISK_SPACE"

if [ "$DISK_SPACE_GB" -gt 2 ]; then
    print_success "✓ Sufficient disk space available"
else
    print_warning "✗ At least 2GB free space recommended"
fi

# Check if Xcode command line tools are installed
if xcode-select -p &> /dev/null; then
    print_success "✓ Xcode Command Line Tools: Installed"
else
    print_error "✗ Xcode Command Line Tools: Not installed"
    print_error "  Please run: xcode-select --install"
fi

# Check internet connectivity
if ping -c 1 google.com &> /dev/null; then
    print_success "✓ Internet Connection: Available"
else
    print_error "✗ Internet Connection: Not available"
    print_error "  Internet connection required for installation"
fi

# Check processor architecture
ARCH=$(uname -m)
print_status "Processor Architecture: $ARCH"

if [ "$ARCH" = "arm64" ] || [ "$ARCH" = "x86_64" ]; then
    print_success "✓ Processor architecture supported"
else
    print_warning "? Processor architecture may not be fully supported"
fi

# Check available memory
MEMORY_GB=$(sysctl -n hw.memsize | awk '{print int($1/1024/1024/1024)}')
print_status "Available Memory: ${MEMORY_GB}GB"

if [ "$MEMORY_GB" -gt 4 ]; then
    print_success "✓ Sufficient memory available"
else
    print_warning "? At least 4GB RAM recommended for optimal performance"
fi

echo ""
print_status "System check complete!"
echo ""

# Summary
echo "======================================"
echo "           Requirements Summary"
echo "======================================"

REQUIREMENTS_MET=true

if [ "$OS_MAJOR" -lt 10 ] || [ "$OS_MINOR" -lt 14 ]; then
    print_error "✗ macOS version too old"
    REQUIREMENTS_MET=false
fi

if [ "$DISK_SPACE_GB" -lt 2 ]; then
    print_error "✗ Insufficient disk space"
    REQUIREMENTS_MET=false
fi

if ! xcode-select -p &> /dev/null; then
    print_error "✗ Xcode Command Line Tools missing"
    REQUIREMENTS_MET=false
fi

if ! ping -c 1 google.com &> /dev/null; then
    print_error "✗ No internet connection"
    REQUIREMENTS_MET=false
fi

if [ "$REQUIREMENTS_MET" = true ]; then
    print_success "✓ All requirements met! Ready to install ResumeAI."
    echo ""
    print_status "To proceed with installation, run: ./install.sh"
else
    print_error "✗ Some requirements not met. Please address the issues above."
    echo ""
    print_status "Most common fixes:"
    print_status "1. Install Xcode Command Line Tools: xcode-select --install"
    print_status "2. Free up disk space (need at least 2GB)"
    print_status "3. Connect to internet"
fi

echo ""