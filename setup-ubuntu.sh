#!/bin/bash
# XOOM Ride-Hailing App - Ubuntu/Linux Setup Script
# This script automates the complete setup process for Ubuntu/Debian-based systems

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}   XOOM Ride-Hailing App Setup${NC}"
    echo -e "${BLUE}   Ubuntu/Linux Installation Script${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_step() {
    echo -e "\n${YELLOW}[$1] $2${NC}"
}

print_success() {
    echo -e "${GREEN}[OK]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Check if running as root for system package installation
check_sudo() {
    if [ "$EUID" -eq 0 ]; then
        SUDO_CMD=""
    else
        SUDO_CMD="sudo"
    fi
}

print_header
check_sudo

# Step 1: Check and install Node.js
print_step "1/9" "Checking Node.js installation..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_success "Node.js is installed: $NODE_VERSION"
else
    print_error "Node.js is not installed"
    echo "Installing Node.js 18.x LTS..."

    # Install Node.js using NodeSource repository
    curl -fsSL https://deb.nodesource.com/setup_18.x | $SUDO_CMD -E bash -
    $SUDO_CMD apt-get install -y nodejs

    if command -v node &> /dev/null; then
        print_success "Node.js installed successfully: $(node --version)"
    else
        print_error "Failed to install Node.js"
        exit 1
    fi
fi

# Step 2: Check npm
print_step "2/9" "Checking npm installation..."
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    print_success "npm is installed: $NPM_VERSION"
else
    print_error "npm is not installed"
    exit 1
fi

# Step 3: Check and install PostgreSQL
print_step "3/9" "Checking PostgreSQL installation..."
if command -v psql &> /dev/null; then
    PG_VERSION=$(psql --version)
    print_success "PostgreSQL is installed: $PG_VERSION"
else
    print_error "PostgreSQL is not installed"
    echo "Installing PostgreSQL..."

    $SUDO_CMD apt-get update
    $SUDO_CMD apt-get install -y postgresql postgresql-contrib

    if command -v psql &> /dev/null; then
        print_success "PostgreSQL installed successfully"

        # Start PostgreSQL service
        $SUDO_CMD systemctl start postgresql
        $SUDO_CMD systemctl enable postgresql
        print_success "PostgreSQL service started"
    else
        print_error "Failed to install PostgreSQL"
        exit 1
    fi
fi

# Step 4: Check PostgreSQL service status
print_step "4/9" "Checking PostgreSQL service..."
if $SUDO_CMD systemctl is-active --quiet postgresql; then
    print_success "PostgreSQL service is running"
else
    print_info "Starting PostgreSQL service..."
    $SUDO_CMD systemctl start postgresql
    if $SUDO_CMD systemctl is-active --quiet postgresql; then
        print_success "PostgreSQL service started"
    else
        print_error "Failed to start PostgreSQL service"
        exit 1
    fi
fi

# Step 5: Install backend dependencies
print_step "5/9" "Installing backend dependencies..."
cd backend || exit 1

if [ -f "package.json" ]; then
    print_info "Installing npm packages..."
    npm install
    if [ $? -eq 0 ]; then
        print_success "Backend dependencies installed"
    else
        print_error "Failed to install backend dependencies"
        exit 1
    fi
else
    print_error "backend/package.json not found"
    exit 1
fi

cd ..

# Step 6: Install frontend dependencies
print_step "6/9" "Installing frontend dependencies..."
cd frontend || exit 1

if [ -f "package.json" ]; then
    print_info "Installing npm packages..."
    npm install
    if [ $? -eq 0 ]; then
        print_success "Frontend dependencies installed"
    else
        print_error "Failed to install frontend dependencies"
        exit 1
    fi
else
    print_error "frontend/package.json not found"
    exit 1
fi

cd ..

# Step 7: Setup environment files
print_step "7/9" "Setting up environment files..."

# Backend .env
if [ ! -f "backend/.env" ]; then
    print_info "Creating backend/.env from template..."
    cp backend/.env.example backend/.env 2>/dev/null
    if [ $? -eq 0 ]; then
        print_success "backend/.env created"
        print_info "Edit backend/.env to configure your database credentials"
    else
        print_error "Could not create backend/.env automatically"
        print_info "Please copy backend/.env.example to backend/.env manually"
    fi
else
    print_success "backend/.env already exists"
fi

# Frontend .env
if [ ! -f "frontend/.env" ]; then
    print_info "Creating frontend/.env..."
    echo "VITE_API_URL=http://localhost:3000" > frontend/.env
    print_success "frontend/.env created"
else
    print_success "frontend/.env already exists"
fi

# Step 8: Setup PostgreSQL user and permissions
print_step "8/9" "Configuring PostgreSQL..."

# Check if we can connect to PostgreSQL
if $SUDO_CMD -u postgres psql -c '\q' 2>/dev/null; then
    print_success "PostgreSQL connection verified"

    # Create database user and grant permissions
    print_info "Setting up database user..."
    $SUDO_CMD -u postgres psql << EOF
-- Create user if not exists
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_user WHERE usename = 'xoom_user') THEN
    CREATE USER xoom_user WITH PASSWORD 'xoom_password';
  END IF;
END
\$\$;

-- Create database if not exists
SELECT 'CREATE DATABASE xoom OWNER xoom_user'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'xoom');

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE xoom TO xoom_user;
EOF

    if [ $? -eq 0 ]; then
        print_success "PostgreSQL user and database configured"
    else
        print_error "Failed to configure PostgreSQL"
        print_info "You may need to run database setup manually"
    fi
else
    print_error "Cannot connect to PostgreSQL"
    print_info "Please check PostgreSQL installation and try again"
fi

# Step 9: Run database migrations
print_step "9/9" "Running database migrations..."

cd backend
export DB_SUPERUSER=postgres
export DB_SUPERUSER_PASSWORD=""

node scripts/setup-database.js

if [ $? -eq 0 ]; then
    print_success "Database migrations completed"
else
    print_error "Database migrations failed"
    print_info "You can run migrations manually with: node backend/scripts/setup-database.js"
fi

cd ..

# Final instructions
echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}   XOOM Setup Complete!${NC}"
echo -e "${GREEN}========================================${NC}\n"

echo -e "Next steps:\n"

echo -e "1. ${YELLOW}Review configuration files:${NC}"
echo -e "   - backend/.env  (Database and server settings)"
echo -e "   - frontend/.env (API URL)\n"

echo -e "2. ${YELLOW}Start the backend server:${NC}"
echo -e "   cd backend"
echo -e "   npm start\n"

echo -e "3. ${YELLOW}In a new terminal, start the frontend:${NC}"
echo -e "   cd frontend"
echo -e "   npm run dev\n"

echo -e "4. ${YELLOW}Open your browser to:${NC} http://localhost:5173\n"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   Default Configuration${NC}"
echo -e "${BLUE}========================================${NC}\n"

echo -e "Database: xoom"
echo -e "User: xoom_user"
echo -e "Password: xoom_password"
echo -e "\n${YELLOW}⚠️  IMPORTANT: Change the default password in production!${NC}\n"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   Test Accounts${NC}"
echo -e "${BLUE}========================================${NC}\n"

echo -e "After setup, create accounts via the signup page:"
echo -e "  - Rider: +923001234567"
echo -e "  - Driver: +923009876543"
echo -e "  - Password: test1234 (min 8 characters)\n"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   Troubleshooting${NC}"
echo -e "${BLUE}========================================${NC}\n"

echo -e "- If database connection fails, check backend/.env"
echo -e "- If frontend can't connect, check VITE_API_URL in frontend/.env"
echo -e "- Check PostgreSQL status: sudo systemctl status postgresql"
echo -e "- View backend logs for detailed error messages"
echo -e "- See docs/SETUP.md for detailed documentation\n"

echo -e "${GREEN}Setup script completed successfully!${NC}\n"
