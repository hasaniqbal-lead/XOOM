# NawaRide Deployment Guide

Complete guide for deploying NawaRide to a Hostinger VPS.

## Prerequisites

- VPS with Ubuntu 20.04+ (Hostinger KVM)
- Domain name pointed to VPS IP
- SSH access to VPS
- Minimum 2GB RAM, 20GB storage

## Step 1: Initial VPS Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y curl git nginx postgresql postgresql-contrib certbot python3-certbot-nginx

# Install Node.js 18 LTS
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Verify installations
node --version
npm --version
psql --version
```

## Step 2: Setup PostgreSQL Database

```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE nawaride;
CREATE USER nawaride_user WITH ENCRYPTED PASSWORD 'your_secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE nawaride TO nawaride_user;
\q
```

## Step 3: Clone and Setup Application

```bash
# Create app directory
sudo mkdir -p /var/www/nawaride
sudo chown $USER:$USER /var/www/nawaride

# Clone repository
cd /var/www/nawaride
git clone https://github.com/yourusername/nawaride.git .

# Install dependencies
npm install

# Setup backend
cd backend
cp .env.example .env
nano .env  # Edit with your settings
```

### Backend .env Configuration

```env
NODE_ENV=production
PORT=3000
SOCKET_PORT=3000

DB_HOST=localhost
DB_PORT=5432
DB_USER=nawaride_user
DB_PASSWORD=your_secure_password_here
DB_NAME=nawaride

JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters_long
JWT_EXPIRES_IN=7d

FRONTEND_URL=https://nawaride.com
ADMIN_URL=https://admin.nawaride.com

UPLOAD_DIR=/var/www/nawaride/uploads
MAX_FILE_SIZE=5242880

RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Run Database Migrations

```bash
cd /var/www/nawaride/backend
npm run migrate
```

### Build Frontend

```bash
cd /var/www/nawaride/frontend
cp .env.example .env
nano .env  # Edit with production URLs

# Build
npm run build
```

### Frontend .env Configuration

```env
VITE_API_URL=https://nawaride.com
VITE_SOCKET_URL=https://nawaride.com
VITE_MAP_TILE_URL=https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png
VITE_OSRM_SERVER=http://router.project-osrm.org
```

## Step 4: Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/nawaride
```

Add this configuration:

```nginx
# Main Application
server {
    server_name nawaride.com;

    # Frontend
    location / {
        root /var/www/nawaride/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:3000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket for Socket.IO
    location /socket.io/ {
        proxy_pass http://localhost:3000/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Uploads
    location /uploads/ {
        alias /var/www/nawaride/uploads/;
    }

    client_max_body_size 10M;
}

# Admin Subdomain (Optional)
server {
    server_name admin.nawaride.com;

    location / {
        root /var/www/nawaride/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:3000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/nawaride /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Step 5: Setup SSL with Let's Encrypt

```bash
sudo certbot --nginx -d nawaride.com -d www.nawaride.com
# If using admin subdomain:
sudo certbot --nginx -d admin.nawaride.com
```

## Step 6: Start Application with PM2

```bash
cd /var/www/nawaride/backend

# Start server
pm2 start server.js --name nawaride-backend

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Run the command it outputs
```

## Step 7: Configure Firewall

```bash
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw enable
```

## Step 8: DNS Configuration (Hostinger)

In your Hostinger domain panel:

1. Add A record: `nawaride.com` → Your VPS IP
2. Add A record: `www.nawaride.com` → Your VPS IP
3. Add A record: `admin.nawaride.com` → Your VPS IP (if using)

## Step 9: Create Admin User

```bash
# Connect to PostgreSQL
sudo -u postgres psql nawaride

# Create admin user (replace with your details)
INSERT INTO users (name, phone, password_hash, role, is_verified)
VALUES (
  'Admin',
  '+923001234567',
  '$2b$10$...',  -- Generate using bcrypt
  'admin',
  true
);
\q
```

To generate password hash:

```bash
node -e "console.log(require('bcrypt').hashSync('YourPassword', 10))"
```

## Monitoring & Maintenance

### View Logs

```bash
# PM2 logs
pm2 logs nawaride-backend

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Restart Application

```bash
pm2 restart nawaride-backend
```

### Update Application

```bash
cd /var/www/nawaride
git pull origin main

# Backend
cd backend
npm install
pm2 restart nawaride-backend

# Frontend
cd ../frontend
npm install
npm run build
```

### Database Backup

```bash
# Create backup
sudo -u postgres pg_dump nawaride > backup_$(date +%Y%m%d).sql

# Restore backup
sudo -u postgres psql nawaride < backup_20231122.sql
```

## Performance Optimization

### Enable Gzip in Nginx

Add to nginx config:

```nginx
gzip on;
gzip_vary on;
gzip_min_length 10240;
gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
```

### PM2 Cluster Mode

```bash
pm2 start server.js --name nawaride-backend -i max
```

## Troubleshooting

### Server won't start

```bash
pm2 logs nawaride-backend
# Check for errors in logs
```

### Database connection issues

```bash
# Test database connection
sudo -u postgres psql nawaride

# Check PostgreSQL status
sudo systemctl status postgresql
```

### Nginx errors

```bash
sudo nginx -t  # Test configuration
sudo systemctl status nginx
```

## Security Best Practices

1. Change default PostgreSQL password
2. Use strong JWT secret (minimum 32 characters)
3. Keep system updated: `sudo apt update && sudo apt upgrade`
4. Setup automatic backups
5. Monitor logs regularly
6. Use rate limiting (already configured)
7. Enable firewall (UFW)
8. Regular security audits

## Support

For issues, check:
- PM2 logs: `pm2 logs`
- Nginx logs: `/var/log/nginx/`
- PostgreSQL logs: `/var/log/postgresql/`

## License

MIT
