#!/bin/bash
# CampusCare Quick Start Script
# This script helps set up and run the development environment

set -e  # Exit on error

echo "╔════════════════════════════════════════════════════════════════════╗"
echo "║                   CampusCare Quick Start Setup                     ║"
echo "╚════════════════════════════════════════════════════════════════════╝"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}►${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check Docker installation
print_status "Checking Docker installation..."
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version | awk '{print $3}' | cut -d',' -f1)
    print_success "Docker is installed (version $DOCKER_VERSION)"
else
    print_error "Docker is not installed"
    echo "Please install Docker from https://www.docker.com/"
    exit 1
fi

# Check Docker Compose installation
print_status "Checking Docker Compose installation..."
if command -v docker-compose &> /dev/null; then
    COMPOSE_VERSION=$(docker-compose --version | awk '{print $3}' | cut -d',' -f1)
    print_success "Docker Compose is installed (version $COMPOSE_VERSION)"
else
    print_error "Docker Compose is not installed"
    echo "Please install Docker Compose from https://docs.docker.com/compose/install/"
    exit 1
fi

# Check if .env file exists
print_status "Checking environment configuration..."
if [ -f .env ]; then
    print_success ".env file found"
else
    print_warning ".env file not found, creating from template..."
    if [ -f .env.docker.example ]; then
        cp .env.docker.example .env
        print_success "Created .env from template"
        print_warning "IMPORTANT: Please edit .env with your credentials:"
        echo ""
        echo "Required environment variables:"
        echo "  - FIREBASE_PROJECT_ID"
        echo "  - FIREBASE_PRIVATE_KEY"
        echo "  - FIREBASE_CLIENT_EMAIL"
        echo "  - GOOGLE_GEMINI_API_KEY"
        echo "  - NEXT_PUBLIC_FIREBASE_API_KEY"
        echo "  - NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"
        echo "  - NEXT_PUBLIC_FIREBASE_PROJECT_ID"
        echo ""
        read -p "Press Enter after updating .env file... "
    else
        print_error ".env.docker.example not found!"
        exit 1
    fi
fi

# Start services
print_status "Starting Docker services..."
echo ""
echo "Available options:"
echo "  1) Start development environment"
echo "  2) Start production environment"
echo "  3) Stop all services"
echo "  4) View service logs"
echo "  5) Clean up all (WARNING: removes volumes!)"
echo ""
read -p "Select option (1-5): " option

case $option in
    1)
        echo ""
        print_status "Starting development environment..."
        docker-compose up -d
        print_success "Development services started!"
        echo ""
        echo "Access URLs:"
        echo "  Frontend:  ${BLUE}http://localhost:3000${NC}"
        echo "  Backend:   ${BLUE}http://localhost:3001${NC}"
        echo "  ML API:    ${BLUE}http://localhost:5000${NC}"
        echo ""
        print_status "Waiting for services to be ready (this may take a minute)..."
        sleep 5
        
        # Check service health
        echo ""
        print_status "Service status:"
        docker-compose ps
        
        echo ""
        print_status "Viewing logs (press Ctrl+C to stop)..."
        docker-compose logs -f
        ;;
        
    2)
        echo ""
        print_status "Starting production environment..."
        docker-compose -f docker-compose.prod.yml up -d
        print_success "Production services started!"
        echo ""
        print_status "Service status:"
        docker-compose -f docker-compose.prod.yml ps
        ;;
        
    3)
        echo ""
        print_status "Stopping all services..."
        docker-compose down
        print_success "All services stopped!"
        ;;
        
    4)
        echo ""
        print_status "Available services:"
        echo "  1) Frontend"
        echo "  2) Backend"
        echo "  3) ML API"
        echo "  4) All services"
        read -p "Select service (1-4): " service_option
        
        case $service_option in
            1)
                docker-compose logs -f frontend
                ;;
            2)
                docker-compose logs -f backend
                ;;
            3)
                docker-compose logs -f ml-api
                ;;
            4)
                docker-compose logs -f
                ;;
            *)
                print_error "Invalid option"
                ;;
        esac
        ;;
        
    5)
        echo ""
        print_warning "This will remove all containers, images, and volumes!"
        read -p "Are you sure? (type 'yes' to continue): " confirm
        if [ "$confirm" = "yes" ]; then
            print_status "Cleaning up..."
            docker-compose down -v --rmi all
            print_success "Cleanup complete!"
        else
            print_warning "Cleanup cancelled"
        fi
        ;;
        
    *)
        print_error "Invalid option"
        exit 1
        ;;
esac

echo ""
print_success "Done!"
