# XOOM Ride-Hailing App - Complete Setup Guide

Welcome to XOOM! This guide will help you set up the complete ride-hailing application on your local machine or VPS in minutes.

## 📋 Table of Contents

- [Quick Start](#-quick-start)
- [Prerequisites](#-prerequisites)
- [Automated Setup](#-automated-setup)
  - [Windows Setup](#windows-setup)
  - [Ubuntu/Linux Setup](#ubuntulinux-setup)
- [Manual Setup](#-manual-setup)
- [Configuration](#-configuration)
- [Running the Application](#-running-the-application)
- [Creating Test Accounts](#-creating-test-accounts)
- [Troubleshooting](#-troubleshooting)
- [Production Deployment](#-production-deployment)
- [Architecture Overview](#-architecture-overview)

---

## 🚀 Quick Start

The fastest way to get XOOM running:

```bash
# Clone the repository
git clone <repository-url>
cd zymo

# Run the setup script for your platform:

# Windows
setup-windows.bat

# Ubuntu/Linux
chmod +x setup-ubuntu.sh
./setup-ubuntu.sh

# Start the application (in separate terminals)
cd backend && npm start
cd frontend && npm run dev
```

Open http://localhost:5173 in your browser. Done! 🎉

---

## 📦 Prerequisites

Before setting up XOOM, ensure you have the following installed:

### Required Software

| Software | Minimum Version | Recommended Version | Download Link |
|----------|----------------|---------------------|---------------|
| Node.js | 16.x | 18.x LTS | [nodejs.org](https://nodejs.org/) |
| npm | 8.x | 9.x | Included with Node.js |
| PostgreSQL | 12.x | 14.x or higher | [postgresql.org](https://www.postgresql.org/download/) |
| Git | 2.x | Latest | [git-scm.com](https://git-scm.com/) |

### System Requirements

- **RAM:** 2GB minimum, 4GB recommended
- **Storage:** 500MB for application + database
- **OS:** Windows 10/11, Ubuntu 18.04+, macOS 10.15+

---

## 🤖 Automated Setup

### Windows Setup

1. **Download and Install Prerequisites:**
   - [Node.js](https://nodejs.org/) - Download and install the LTS version
   - [PostgreSQL](https://www.postgresql.org/download/windows/) - Remember your superuser password!
   - [Git](https://git-scm.com/download/win) - For cloning the repository

2. **Clone and Run Setup:**
   ```cmd
   git clone <repository-url>
   cd zymo
   setup-windows.bat
   ```

3. **Follow the prompts:**
   - The script will check all prerequisites
   - Install npm dependencies
   - Create environment files
   - Setup PostgreSQL database
   - Run migrations

4. **Start the application:**
   ```cmd
   # Terminal 1 - Backend
   cd backend
   npm start

   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

### Ubuntu/Linux Setup

1. **Update System and Clone Repository:**
   ```bash
   sudo apt-get update
   git clone <repository-url>
   cd zymo
   ```

2. **Run the Setup Script:**
   ```bash
   chmod +x setup-ubuntu.sh
   ./setup-ubuntu.sh
   ```

   The script will:
   - Install Node.js (if not present)
   - Install PostgreSQL (if not present)
   - Install all npm dependencies
   - Configure PostgreSQL user and database
   - Create environment files
   - Run database migrations

3. **Start the application:**
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm start

   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

---

## 🔧 Manual Setup

If you prefer manual setup or need more control:

### Step 1: Install Prerequisites

Install Node.js, PostgreSQL, and Git from the links above.

### Step 2: Clone Repository

```bash
git clone <repository-url>
cd zymo
```

### Step 3: Setup PostgreSQL Database

#### Option A: Using the setup script (Recommended)

```bash
cd backend
node scripts/setup-database.js
```

#### Option B: Manual SQL

```sql
-- Connect to PostgreSQL as superuser
psql -U postgres

-- Create user
CREATE USER xoom_user WITH PASSWORD 'xoom_password';

-- Create database
CREATE DATABASE xoom OWNER xoom_user;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE xoom TO xoom_user;

-- Exit
\q
```

### Step 4: Run Migrations

```bash
cd backend
node migrations/run.js
```

### Step 5: Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd frontend
npm install
```

### Step 6: Configure Environment Files

#### Backend `.env`

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
DATABASE_URL=postgresql://xoom_user:xoom_password@localhost:5432/xoom
DB_HOST=localhost
DB_PORT=5432
DB_USER=xoom_user
DB_PASSWORD=xoom_password
DB_NAME=xoom

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRES_IN=7d

# CORS Configuration
FRONTEND_URL=http://localhost:5173
```

#### Frontend `.env`

```bash
cd frontend
echo "VITE_API_URL=http://localhost:3000" > .env
```

---

## ⚙️ Configuration

### Environment Variables

#### Backend Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PORT` | Server port | 3000 | Yes |
| `NODE_ENV` | Environment mode | development | Yes |
| `DATABASE_URL` | PostgreSQL connection string | - | Yes |
| `DB_HOST` | Database host | localhost | Yes |
| `DB_PORT` | Database port | 5432 | Yes |
| `DB_USER` | Database user | xoom_user | Yes |
| `DB_PASSWORD` | Database password | - | Yes |
| `DB_NAME` | Database name | xoom | Yes |
| `JWT_SECRET` | JWT signing secret | - | Yes |
| `JWT_EXPIRES_IN` | Token expiration | 7d | Yes |
| `FRONTEND_URL` | Frontend URL for CORS | http://localhost:5173 | Yes |

#### Frontend Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `VITE_API_URL` | Backend API URL | http://localhost:3000 | Yes |

### Database Configuration

The default setup creates:
- **Database:** `xoom`
- **User:** `xoom_user`
- **Password:** `xoom_password`

**⚠️ IMPORTANT:** Change these credentials in production!

---

## 🏃 Running the Application

### Development Mode

#### Method 1: Separate Terminals (Recommended)

```bash
# Terminal 1 - Backend
cd backend
npm start
# Server runs on http://localhost:3000

# Terminal 2 - Frontend
cd frontend
npm run dev
# App runs on http://localhost:5173
```

#### Method 2: Using Process Managers

**Using tmux (Linux/Mac):**

```bash
# Start backend in tmux session
tmux new -s xoom-backend
cd backend && npm start
# Press Ctrl+B, then D to detach

# Start frontend in another tmux session
tmux new -s xoom-frontend
cd frontend && npm run dev
# Press Ctrl+B, then D to detach

# To reattach: tmux attach -t xoom-backend
```

**Using PM2 (All platforms):**

```bash
npm install -g pm2

# Start backend
cd backend
pm2 start npm --name "xoom-backend" -- start

# Start frontend
cd frontend
pm2 start npm --name "xoom-frontend" -- run dev

# View logs
pm2 logs

# Stop all
pm2 stop all
```

### Production Mode

See [Production Deployment](#-production-deployment) section below.

---

## 👤 Creating Test Accounts

### Via Signup Page

1. Navigate to http://localhost:5173
2. Click "Sign up"
3. Fill in the form:
   - **Name:** Your name
   - **Phone:** +923001234567 (or any valid format)
   - **Password:** Minimum 8 characters
   - **Role:** Choose Rider or Driver
4. Click "Create Account"

### Via Direct Database Insert

```sql
-- Connect to database
psql -U xoom_user -d xoom

-- Create a test rider
INSERT INTO users (name, phone, password_hash, role)
VALUES (
  'Test Rider',
  '+923001234567',
  '$2b$10$your_bcrypt_hashed_password',
  'rider'
);

-- Create a test driver
INSERT INTO users (name, phone, password_hash, role)
VALUES (
  'Test Driver',
  '+923009876543',
  '$2b$10$your_bcrypt_hashed_password',
  'driver'
);
```

### Recommended Test Accounts

Create these accounts for testing:

| Role | Phone | Password | Purpose |
|------|-------|----------|---------|
| Rider | +923001234567 | test1234 | Test ride booking |
| Driver | +923009876543 | test1234 | Test ride acceptance |
| Admin | +923000000000 | admin1234 | Test admin features |

---

## 🐛 Troubleshooting

### Common Issues and Solutions

#### 1. Database Connection Failed

**Error:** `ECONNREFUSED ::1:5432` or `Connection refused`

**Solutions:**

```bash
# Check if PostgreSQL is running
# Windows
pg_ctl status

# Linux/Mac
sudo systemctl status postgresql
# or
ps aux | grep postgres

# Start PostgreSQL if not running
# Windows
pg_ctl start

# Linux
sudo systemctl start postgresql

# Mac
brew services start postgresql
```

**Check connection settings:**

```bash
# Verify database exists
psql -U postgres -c "\l" | grep xoom

# Verify user exists
psql -U postgres -c "\du" | grep xoom_user

# Test connection
psql -U xoom_user -d xoom -c "SELECT 1"
```

#### 2. JWT Secret Error

**Error:** `JWT_SECRET is not defined`

**Solution:**

Edit `backend/.env` and add:

```env
JWT_SECRET=your_super_secret_key_at_least_32_characters_long
```

#### 3. Port Already in Use

**Error:** `EADDRINUSE: address already in use :::3000`

**Solutions:**

```bash
# Find process using port 3000
# Windows
netstat -ano | findstr :3000

# Linux/Mac
lsof -i :3000

# Kill the process
# Windows (replace PID with actual process ID)
taskkill /PID <PID> /F

# Linux/Mac
kill -9 <PID>

# Or change the port in backend/.env
PORT=3001
```

#### 4. Frontend Can't Connect to Backend

**Error:** Network error or CORS error in browser console

**Solutions:**

1. **Verify backend is running:**
   ```bash
   curl http://localhost:3000/api/health
   ```

2. **Check VITE_API_URL in frontend/.env:**
   ```env
   VITE_API_URL=http://localhost:3000
   ```

3. **Verify CORS settings in backend/.env:**
   ```env
   FRONTEND_URL=http://localhost:5173
   ```

4. **Restart both servers after .env changes**

#### 5. npm install Fails

**Error:** `EACCES` or permission errors

**Solutions:**

```bash
# Fix npm permissions (Linux/Mac)
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) /usr/local/lib/node_modules

# Clear npm cache
npm cache clean --force

# Try install again
npm install
```

#### 6. TypeScript Errors in Frontend

**Error:** Type errors during build

**Solutions:**

```bash
cd frontend

# Clear cache
rm -rf node_modules .vite
npm install

# Run type check
npm run type-check

# If errors persist, check for missing dependencies
npm install @types/react @types/react-dom
```

#### 7. Migration Errors

**Error:** Migration fails or table already exists

**Solutions:**

```bash
# Drop and recreate database (⚠️ DELETES ALL DATA)
psql -U postgres
DROP DATABASE IF EXISTS xoom;
CREATE DATABASE xoom OWNER xoom_user;
\q

# Run migrations
cd backend
node scripts/setup-database.js
```

#### 8. Socket.IO Connection Issues

**Error:** WebSocket connection failed

**Solutions:**

1. **Check backend logs for Socket.IO errors**
2. **Verify JWT token is valid in localStorage**
3. **Check CORS configuration**
4. **Ensure backend Socket.IO is initialized**

```bash
# Check in browser console
localStorage.getItem('token')
# Should return a JWT token

# Clear and re-login if expired
localStorage.clear()
```

---

## 🚀 Production Deployment

### Ubuntu VPS Deployment

#### 1. Server Setup

```bash
# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt-get install -y postgresql postgresql-contrib

# Install Nginx (for reverse proxy)
sudo apt-get install -y nginx

# Install PM2 (process manager)
sudo npm install -g pm2
```

#### 2. Clone and Setup Application

```bash
# Clone repository
cd /var/www
sudo git clone <repository-url> xoom
cd xoom
sudo chown -R $USER:$USER .

# Run setup script
chmod +x setup-ubuntu.sh
./setup-ubuntu.sh
```

#### 3. Configure Environment for Production

**Backend `.env`:**

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://xoom_user:STRONG_PASSWORD@localhost:5432/xoom
JWT_SECRET=STRONG_SECRET_AT_LEAST_64_CHARACTERS_RANDOM_STRING
FRONTEND_URL=https://yourdomain.com
```

**Frontend `.env`:**

```env
VITE_API_URL=https://api.yourdomain.com
```

#### 4. Build Frontend

```bash
cd frontend
npm run build
# Creates frontend/dist directory
```

#### 5. Setup PM2 for Backend

```bash
cd backend
pm2 start npm --name "xoom-api" -- start
pm2 save
pm2 startup
# Follow the command it outputs
```

#### 6. Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/xoom
```

Add configuration:

```nginx
# Backend API
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Socket.IO
    location /socket.io {
        proxy_pass http://localhost:3000/socket.io;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}

# Frontend
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    root /var/www/xoom/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

Enable site:

```bash
sudo ln -s /etc/nginx/sites-available/xoom /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 7. Setup SSL with Let's Encrypt

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com
```

#### 8. Configure Firewall

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

#### 9. Setup Database Backups

```bash
# Create backup script
sudo nano /usr/local/bin/backup-xoom-db.sh
```

Add:

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/xoom"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR
pg_dump -U xoom_user xoom | gzip > $BACKUP_DIR/xoom_$DATE.sql.gz
# Keep only last 7 days
find $BACKUP_DIR -name "xoom_*.sql.gz" -mtime +7 -delete
```

Make executable and add to cron:

```bash
sudo chmod +x /usr/local/bin/backup-xoom-db.sh
sudo crontab -e
# Add: 0 2 * * * /usr/local/bin/backup-xoom-db.sh
```

---

## 🏗 Architecture Overview

### Technology Stack

**Frontend:**
- React 18 with TypeScript
- Vite (build tool)
- TailwindCSS + Shadcn UI
- Leaflet.js (maps)
- Socket.IO Client
- Tanstack React Query
- React Router

**Backend:**
- Node.js + Express
- Socket.IO (real-time)
- PostgreSQL
- bcrypt (password hashing)
- JWT (authentication)

### Project Structure

```
zymo/
├── backend/
│   ├── config/          # Database configuration
│   ├── middleware/      # Auth, CORS, etc.
│   ├── routes/          # API endpoints
│   ├── migrations/      # Database migrations
│   ├── scripts/         # Setup scripts
│   ├── server.js        # Main server file
│   └── .env             # Environment variables
├── frontend/
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── contexts/    # Auth, Socket contexts
│   │   ├── pages/       # Route pages
│   │   ├── services/    # API services
│   │   └── lib/         # Utilities
│   ├── public/          # Static assets
│   └── .env             # Frontend config
├── docs/                # Documentation
├── setup-windows.bat    # Windows setup script
├── setup-ubuntu.sh      # Linux setup script
└── README.md            # Project overview
```

### API Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/signup` | Create new account | No |
| POST | `/api/auth/login` | Login user | No |
| GET | `/api/auth/me` | Get current user | Yes |
| POST | `/api/rides` | Create ride request | Yes |
| GET | `/api/rides` | Get user rides | Yes |
| GET | `/api/rides/:id` | Get ride details | Yes |
| PATCH | `/api/rides/:id/accept` | Accept ride (driver) | Yes |
| PATCH | `/api/rides/:id/start` | Start ride (driver) | Yes |
| PATCH | `/api/rides/:id/complete` | Complete ride (driver) | Yes |
| PATCH | `/api/rides/:id/cancel` | Cancel ride | Yes |
| POST | `/api/reviews` | Submit review | Yes |
| GET | `/api/reviews/user/:id` | Get user reviews | Yes |
| GET | `/api/users/profile` | Get profile | Yes |
| PATCH | `/api/users/profile` | Update profile | Yes |

### Socket.IO Events

**Client to Server:**
- `driver_location` - Driver sends location update
- `request_ride` - Rider requests a ride

**Server to Client:**
- `new_ride` - New ride available (to drivers)
- `ride_assigned` - Ride assigned to driver (to rider)
- `driver_accepted` - Driver accepted ride (to rider)
- `ride_started` - Driver started trip (to rider)
- `ride_completed` - Trip completed (to both)
- `ride_cancelled` - Ride cancelled (to both)
- `notification` - General notification
- `error` - Error message

---

## 📝 Additional Resources

- **Main README:** [../README.md](../README.md)
- **Deep Dive Analysis:** [DEEP_DIVE_ANALYSIS.md](DEEP_DIVE_ANALYSIS.md)
- **API Documentation:** Coming soon
- **Contributing Guide:** Coming soon

---

## 🆘 Getting Help

If you encounter issues not covered in this guide:

1. **Check the logs:**
   ```bash
   # Backend logs
   cd backend && npm start

   # Browser console for frontend errors
   ```

2. **Verify all prerequisites are installed and running**

3. **Check environment files are properly configured**

4. **Review the [Troubleshooting](#-troubleshooting) section**

5. **Create an issue on GitHub with:**
   - Steps to reproduce
   - Error messages/logs
   - Environment details (OS, versions)

---

## 📄 License

[Your License Here]

---

**Happy Coding with XOOM! 🚗💨**
