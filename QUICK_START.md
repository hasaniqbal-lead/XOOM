# XOOM Quick Start - Deploy to xoomrides.com in 60 Minutes

## 📋 Overview

This quick start guide will get XOOM live on **xoomrides.com** in approximately 60 minutes.

---

## ⚡ Prerequisites (5 minutes)

### What You Need

1. **VPS Server**
   - Ubuntu 20.04/22.04 LTS
   - 4GB RAM, 2 CPU cores minimum
   - 40GB storage
   - Root/sudo access

2. **Domain**
   - xoomrides.com (purchased and ready)
   - Access to DNS settings

3. **Local Machine**
   - Node.js 18+ installed
   - Git installed
   - SSH client

### Get VPS IP Address
```bash
# Note your VPS IP address
echo "My VPS IP: YOUR_VPS_IP_HERE"
```

---

## 🚀 Step-by-Step Deployment

### Step 1: Prepare Locally (10 minutes)

#### 1.1 Generate Secrets

```bash
# Generate database password
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
# Save this as: DB_PASSWORD

# Generate JWT secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
# Save this as: JWT_SECRET
```

#### 1.2 Create Environment Files

```bash
# Backend environment
cp backend/.env.production.example backend/.env

# Edit backend/.env and replace:
# - DB_PASSWORD with generated value
# - JWT_SECRET with generated value
```

```bash
# Frontend environment (already configured)
cp frontend/.env.production.example frontend/.env.production
```

#### 1.3 Test Build Locally (optional but recommended)

```bash
cd frontend
npm install
npm run build
cd ..
```

---

### Step 2: Setup VPS (15 minutes)

#### 2.1 SSH into VPS

```bash
ssh root@YOUR_VPS_IP
```

#### 2.2 Run Quick Setup Script

```bash
# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
apt install docker-compose -y

# Install Git and utilities
apt install -y git ufw

# Setup firewall
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
ufw status

# Create directory
mkdir -p /var/www/xoom
cd /var/www/xoom
```

#### 2.3 Upload Files

**Option A: Clone from GitHub**
```bash
git clone https://github.com/YOUR_USERNAME/xoom.git .
```

**Option B: Upload via rsync (from local machine)**
```bash
# From your local XOOM directory
rsync -avz --exclude 'node_modules' --exclude '.git' ./ root@YOUR_VPS_IP:/var/www/xoom/
```

**Option C: Upload via SCP**
```bash
# From your local XOOM directory
scp -r * root@YOUR_VPS_IP:/var/www/xoom/
```

#### 2.4 Create Environment Files on Server

```bash
cd /var/www/xoom

# Create backend/.env with your secrets
nano backend/.env
```

Paste and configure:
```env
NODE_ENV=production
PORT=3000
DB_HOST=db
DB_PORT=5432
DB_USER=xoom_production
DB_PASSWORD=YOUR_GENERATED_DB_PASSWORD
DB_NAME=xoom_production
JWT_SECRET=YOUR_GENERATED_JWT_SECRET
FRONTEND_URL=https://xoomrides.com
ADMIN_URL=https://xoomrides.com
UPLOAD_DIR=/app/uploads
MAX_FILE_SIZE=5242880
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
MAP_PROVIDER=nominatim
MAP_USER_AGENT=XOOM-RideHailing/1.0
SOCKET_PORT=3000
```

Save and exit (Ctrl+X, Y, Enter)

```bash
# Create frontend/.env.production
nano frontend/.env.production
```

Paste:
```env
VITE_API_URL=https://xoomrides.com
VITE_SOCKET_URL=https://xoomrides.com
VITE_MAP_TILE_URL=https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png
VITE_OSRM_SERVER=https://router.project-osrm.org
```

Save and exit.

---

### Step 3: Configure DNS (5 minutes)

#### 3.1 Update DNS Records

Go to your domain registrar (where you bought xoomrides.com):

1. Find DNS settings / DNS management
2. Add these A records:

```
Type: A      Name: @        Value: YOUR_VPS_IP      TTL: 3600
Type: A      Name: www      Value: YOUR_VPS_IP      TTL: 3600
```

3. Save changes

#### 3.2 Verify DNS Propagation

Wait 5-15 minutes, then check:

```bash
# On your local machine or VPS
nslookup xoomrides.com
nslookup www.xoomrides.com

# Should show your VPS IP
```

---

### Step 4: Get SSL Certificate (10 minutes)

#### 4.1 Obtain Certificate

On your VPS:

```bash
cd /var/www/xoom

# Make sure DNS has propagated first!
# Then run:
docker run -it --rm \
  -v certbot-etc:/etc/letsencrypt \
  -v certbot-var:/var/lib/letsencrypt \
  -v certbot-www:/var/www/certbot \
  -p 80:80 \
  certbot/certbot certonly --standalone \
  --email your-email@example.com \
  --agree-tos \
  --no-eff-email \
  -d xoomrides.com \
  -d www.xoomrides.com
```

#### 4.2 Verify Certificate

```bash
docker run --rm -v certbot-etc:/etc/letsencrypt alpine ls -la /etc/letsencrypt/live/xoomrides.com/
```

Should show certificate files.

---

### Step 5: Deploy Application (20 minutes)

#### 5.1 Run Deployment Script

```bash
cd /var/www/xoom

# Make scripts executable
chmod +x deploy.sh backup.sh

# Run deployment
./deploy.sh
```

#### 5.2 Monitor Deployment

Watch the deployment progress. It will:
- ✅ Check prerequisites
- ✅ Build frontend
- ✅ Start Docker containers
- ✅ Run database migrations
- ✅ Perform health checks

Wait for success message!

#### 5.3 Verify Services

```bash
# Check containers
docker-compose ps

# Should show:
# xoom-production-db   running
# xoom-backend         running
# xoom-nginx           running
# xoom-certbot         running
```

---

### Step 6: Create Admin User (5 minutes)

#### 6.1 Generate Password Hash

```bash
# Generate bcrypt hash for your admin password
node -e "console.log(require('bcrypt').hashSync('YourAdminPassword123', 10))"
```

Copy the hash output (starts with `$2b$10$...`)

#### 6.2 Create Admin Account

```bash
# Connect to database
docker-compose exec db psql -U xoom_production -d xoom_production
```

In PostgreSQL prompt:
```sql
INSERT INTO users (name, phone, password_hash, role, is_verified)
VALUES (
  'Admin',
  '+923001234567',
  '$2b$10$YOUR_GENERATED_HASH_HERE',
  'admin',
  true
);

-- Verify
SELECT id, name, phone, role FROM users WHERE role = 'admin';

-- Exit
\q
```

---

### Step 7: Verify & Test (10 minutes)

#### 7.1 Access Application

Open in browser:
- **Main App:** https://xoomrides.com
- **Health Check:** https://xoomrides.com/health
- **Map Providers:** https://xoomrides.com/api/maps/providers/health

#### 7.2 Test Admin Login

1. Go to https://xoomrides.com/login
2. Login with admin credentials:
   - Phone: +923001234567
   - Password: YourAdminPassword123
3. Should see admin dashboard

#### 7.3 Create Test Accounts

1. **Sign up as Rider:**
   - Click "Sign Up"
   - Enter name, phone, password
   - Select "Rider" role
   - Create account

2. **Sign up as Driver:**
   - Logout
   - Sign up again
   - Select "Driver" role
   - Complete registration

#### 7.4 Test Basic Flow

**As Rider:**
- Click on map to set pickup location
- Click on map to set drop location
- Select vehicle type
- View fare estimate
- Request ride

**As Driver (in another browser/incognito):**
- Go online
- Should see ride request
- Accept ride
- Mark arrived
- Start trip
- Complete trip

#### 7.5 Test Real-time Features

- Driver location should update every 10 seconds
- Ride status should update in real-time
- Socket.IO connection should be established

---

### Step 8: Setup Monitoring (5 minutes)

#### 8.1 Configure Backup Cron Job

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * /var/www/xoom/backup.sh >> /var/log/xoom-backup.log 2>&1

# Save and exit
```

#### 8.2 Verify Logs

```bash
# View backend logs
docker-compose logs -f backend

# View nginx logs
docker-compose logs -f nginx

# View all logs
docker-compose logs -f
```

#### 8.3 Setup Log Rotation (optional)

```bash
sudo nano /etc/logrotate.d/xoom
```

Add:
```
/var/log/xoom-*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 root root
}
```

---

## ✅ Deployment Complete!

### Your XOOM Application is Now Live! 🎉

**URLs:**
- Frontend: https://xoomrides.com
- Health Check: https://xoomrides.com/health
- API: https://xoomrides.com/api/

**Admin Access:**
- Phone: +923001234567
- Password: (your admin password)

---

## 📊 Post-Deployment Checklist

- ✅ Application accessible at xoomrides.com
- ✅ SSL certificate working (https)
- ✅ Admin login successful
- ✅ Rider signup working
- ✅ Driver signup working
- ✅ Map loading correctly
- ✅ Real-time updates working (Socket.IO)
- ✅ Database backups configured
- ✅ Firewall configured
- ✅ Health checks passing

---

## 🔧 Useful Commands

### View Application Status
```bash
cd /var/www/xoom
docker-compose ps
docker stats --no-stream
```

### View Logs
```bash
# All services
docker-compose logs -f

# Backend only
docker-compose logs -f backend

# Last 100 lines
docker-compose logs --tail=100
```

### Restart Services
```bash
# Restart all
docker-compose restart

# Restart backend only
docker-compose restart backend
```

### Update Application
```bash
cd /var/www/xoom
git pull origin main
./deploy.sh
```

### Manual Backup
```bash
cd /var/www/xoom
./backup.sh
```

### Check Certificate Expiry
```bash
docker run --rm -v certbot-etc:/etc/letsencrypt alpine \
  cat /etc/letsencrypt/live/xoomrides.com/cert.pem | openssl x509 -noout -dates
```

---

## 🚨 Troubleshooting

### Application Not Loading

```bash
# Check containers
docker-compose ps

# Check Nginx logs
docker-compose logs nginx

# Check if frontend was built
ls -la frontend/dist/
```

### Database Connection Failed

```bash
# Check database logs
docker-compose logs db

# Test database connection
docker-compose exec db psql -U xoom_production -d xoom_production -c "SELECT 1"
```

### SSL Certificate Issues

```bash
# Check certificate
docker run --rm -v certbot-etc:/etc/letsencrypt alpine ls -la /etc/letsencrypt/live/xoomrides.com/

# Renew certificate manually
docker-compose run --rm certbot renew
docker-compose restart nginx
```

### Socket.IO Not Connecting

```bash
# Check backend logs for Socket.IO errors
docker-compose logs backend | grep -i socket

# Verify WebSocket proxy in Nginx
cat nginx-production.conf | grep -A 10 "socket.io"
```

---

## 📞 Support

For issues:
1. Check logs: `docker-compose logs -f`
2. Check health: https://xoomrides.com/health
3. Review documentation in `docs/` folder
4. Check DEPLOYMENT_INSTRUCTIONS.md for detailed troubleshooting

---

## 🎯 Next Steps

1. **Test thoroughly** - Create test rider and driver accounts
2. **Configure monitoring** - Setup uptime monitoring (UptimeRobot, etc.)
3. **Setup analytics** - Add Google Analytics if needed
4. **Plan marketing** - Prepare launch campaign
5. **User documentation** - Create user guides
6. **Support system** - Setup customer support

---

**Congratulations! XOOM is now live on xoomrides.com! 🚀**

Your ride-hailing platform is ready to accept riders and drivers. Start marketing and onboarding users!

