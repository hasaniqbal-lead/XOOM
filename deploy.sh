#!/bin/bash
set -e

# XOOM Rides Production Deployment Script
# This script handles the complete deployment process for xoomrides.com
# Works alongside other apps on multi-app VPS

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║     XOOM Rides Production Deployment - xoomrides.com         ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_step() {
    echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

# Check if running as root (optional warning)
if [ "$EUID" -eq 0 ]; then
    print_warning "Running as root. Consider using a non-root user with sudo privileges."
fi

# Step 1: Check Prerequisites
print_step "STEP 1: Checking Prerequisites"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi
print_success "Docker is installed"

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi
print_success "Docker Compose is installed"

# Check if .env files exist
print_step "STEP 2: Checking Environment Files"

if [ ! -f backend/.env ]; then
    print_error "backend/.env not found!"
    print_info "Please create backend/.env from backend/.env.production.example"
    print_info "Run: cp backend/.env.production.example backend/.env"
    exit 1
fi
print_success "backend/.env found"

if [ ! -f frontend/.env.production ]; then
    print_error "frontend/.env.production not found!"
    print_info "Please create frontend/.env.production from frontend/.env.production.example"
    print_info "Run: cp frontend/.env.production.example frontend/.env.production"
    exit 1
fi
print_success "frontend/.env.production found"

# Check if sensitive values have been changed
if grep -q "CHANGE_THIS" backend/.env; then
    print_error "Found 'CHANGE_THIS' in backend/.env!"
    print_warning "Please set DB_PASSWORD and JWT_SECRET in backend/.env"
    exit 1
fi
print_success "Environment variables appear to be configured"

# Step 3: Build Frontend and Admin
print_step "STEP 3: Building Frontend Applications"

print_info "Installing main frontend dependencies..."
cd frontend
npm install --production=false

print_info "Building main user application..."
npm run build

if [ ! -d "dist" ]; then
    print_error "Frontend build failed - dist directory not found"
    cd ..
    exit 1
fi

print_success "Main frontend built successfully ($(du -sh dist | cut -f1))"
cd ..

print_info "Installing admin frontend dependencies..."
cd frontend-old-nawaride
npm install --production=false

print_info "Building admin dashboard..."
npm run build

if [ ! -d "dist" ]; then
    print_error "Admin build failed - dist directory not found"
    cd ..
    exit 1
fi

print_success "Admin dashboard built successfully ($(du -sh dist | cut -f1))"
cd ..

# Step 4: Prepare Backend
print_step "STEP 4: Preparing Backend"

# Create uploads directory if it doesn't exist
mkdir -p backend/uploads
print_success "Upload directory ready"

# Step 5: Stop Existing Containers
print_step "STEP 5: Stopping Existing Containers"

if docker-compose ps | grep -q "Up"; then
    print_info "Stopping running containers..."
    docker-compose down
    print_success "Containers stopped"
else
    print_info "No running containers found"
fi

# Step 6: Start Services
print_step "STEP 6: Starting Docker Services"

print_info "Building and starting containers..."
docker-compose up -d --build

# Step 7: Wait for Services
print_step "STEP 7: Waiting for Services to Start"

print_info "Waiting for database to be ready..."
sleep 5

# Wait for database to be healthy
RETRY_COUNT=0
MAX_RETRIES=30

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if docker-compose exec -T db pg_isready -U xoomrides_user -d xoomrides > /dev/null 2>&1; then
        print_success "Database is ready"
        break
    fi
    
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo -n "."
    sleep 2
    
    if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
        print_error "Database failed to start within timeout"
        docker-compose logs db
        exit 1
    fi
done

print_info "Waiting for backend to be ready..."
sleep 10

# Wait for backend to be healthy
RETRY_COUNT=0
while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if docker-compose exec -T backend wget --spider -q http://localhost:3000/health 2>/dev/null; then
        print_success "Backend is ready"
        break
    fi
    
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo -n "."
    sleep 2
    
    if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
        print_error "Backend failed to start within timeout"
        docker-compose logs backend
        exit 1
    fi
done

# Step 8: Run Database Migrations
print_step "STEP 8: Running Database Migrations"

print_info "Applying database schema..."

# Check if migrations directory exists
if [ ! -d "backend/migrations" ]; then
    print_error "Migrations directory not found"
    exit 1
fi

# Run each migration file
for migration in backend/migrations/*.sql; do
    if [ -f "$migration" ]; then
        filename=$(basename "$migration")
        print_info "Running migration: $filename"
        
        if docker-compose exec -T db psql -U xoomrides_user -d xoomrides -f "/docker-entrypoint-initdb.d/$filename" > /dev/null 2>&1; then
            print_success "Applied $filename"
        else
            print_warning "$filename may have already been applied (this is normal)"
        fi
    fi
done

print_success "Migrations completed"

# Step 9: Health Checks
print_step "STEP 9: Running Health Checks"

# Check container status
print_info "Container status:"
docker-compose ps

# Check backend health
print_info "\nChecking backend health..."
if curl -f http://localhost:3000/health > /dev/null 2>&1; then
    print_success "Backend health check passed"
else
    print_warning "Backend health check failed - backend may still be starting"
fi

# Check frontend containers
print_info "Checking frontend containers..."
if curl -f http://localhost:8080 > /dev/null 2>&1; then
    print_success "Main frontend responding"
else
    print_warning "Main frontend not responding yet"
fi

if curl -f http://localhost:8081 > /dev/null 2>&1; then
    print_success "Admin frontend responding"
else
    print_warning "Admin frontend not responding yet"
fi

# Step 10: Display Logs
print_step "STEP 10: Recent Logs"

print_info "Backend logs (last 20 lines):"
docker-compose logs --tail=20 backend

print_info "\nNginx logs (last 10 lines):"
docker-compose logs --tail=10 nginx

# Step 11: Summary
print_step "DEPLOYMENT COMPLETE! 🎉"

echo ""
print_success "XOOM Rides has been deployed successfully!"
echo ""
print_info "⚠️  IMPORTANT: Configure host-level Nginx to complete setup"
echo ""
print_info "1. Copy host Nginx config:"
echo "   sudo cp nginx-host-config.conf /etc/nginx/sites-available/xoomrides"
echo "   sudo ln -s /etc/nginx/sites-available/xoomrides /etc/nginx/sites-enabled/"
echo ""
print_info "2. Test and reload Nginx:"
echo "   sudo nginx -t"
echo "   sudo systemctl reload nginx"
echo ""
print_info "3. Get SSL certificates:"
echo "   sudo certbot --nginx -d xoomrides.com -d www.xoomrides.com -d admin.xoomrides.com"
echo ""
print_info "Access your applications at (after Nginx config):"
echo "   🌐 Main App:    https://xoomrides.com"
echo "   👨‍💼 Admin Panel: https://admin.xoomrides.com"
echo "   🔧 Health:      http://localhost:3000/health"
echo ""
print_info "Containers are running on localhost:"
echo "   📦 Backend:  localhost:3000"
echo "   📦 Frontend: localhost:8080"
echo "   📦 Admin:    localhost:8081"
echo ""
print_info "Useful commands:"
echo "   📋 View logs:       docker-compose logs -f"
echo "   📊 Container stats: docker-compose ps"
echo "   🔄 Restart:         docker-compose restart"
echo "   🛑 Stop:            docker-compose down"
echo ""
print_info "Next steps:"
echo "   1. Configure host Nginx (see above)"
echo "   2. Create admin user (see DEPLOYMENT_INSTRUCTIONS.md)"
echo "   3. Test rider and driver signup"
echo "   4. Configure automated backups (./backup.sh)"
echo ""

# Optional: Display container resource usage
print_info "Container resource usage:"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"

echo ""
print_success "Deployment script completed successfully!"
echo "╚═══════════════════════════════════════════════════════════════╝"

