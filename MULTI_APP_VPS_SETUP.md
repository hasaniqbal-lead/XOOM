# XOOM Rides - Multi-App VPS Deployment Guide

## Overview

This guide explains how to deploy XOOM Rides on a VPS that already hosts other applications. The key difference from a single-app deployment is that we use a **host-level Nginx** to route traffic to multiple applications, including XOOM Rides.

---

## Architecture

```
Internet
    ↓
Host Nginx (:80, :443) - Main reverse proxy for ALL apps
    ├── xoomrides.com → XOOM Frontend Container (:8080)
    ├── admin.xoomrides.com → XOOM Admin Container (:8081)
    ├── yourotherapp.com → Other App Container (different port)
    └── anotherapp.com → Another App Container (different port)

XOOM Docker Network (internal)
    ├── xoomrides-frontend (:8080) → xoomrides-backend (:3000)
    ├── xoomrides-admin (:8081) → xoomrides-backend (:3000)
    ├── xoomrides-backend (:3000) → xoomrides-db (:5432)
    └── xoomrides-db (:5432)
```

### Key Points:
- ✅ **Host Nginx handles SSL** for all domains
- ✅ **XOOM containers expose ports to localhost only** (127.0.0.1:port)
- ✅ **No port conflicts** with other apps
- ✅ **Each app isolated** in its own Docker network
- ✅ **Wildcard subdomain support** for future expansion

---

## Prerequisites

### On Your VPS:
1. ✅ Nginx installed and running (`sudo systemctl status nginx`)
2. ✅ Docker and Docker Compose installed
3. ✅ Other apps already running (no changes to them needed)
4. ✅ Ports 80 and 443 available for host Nginx
5. ✅ DNS wildcard configured (*.xoomrides.com → VPS IP)

### Check Current Setup:

```bash
# Check what's using ports
sudo netstat -tulpn | grep :80
sudo netstat -tulpn | grep :443

# Check Nginx status
sudo systemctl status nginx

# List existing Nginx sites
ls -la /etc/nginx/sites-enabled/

# Check Docker containers
docker ps

# Check Docker networks
docker network ls
```

---

## Step-by-Step Deployment

### Step 1: Prepare XOOM Files (10 minutes)

```bash
# Navigate to deployment directory
cd /var/www/xoomrides

# Create environment files
cp backend/.env.production.example backend/.env
cp frontend/.env.production.example frontend/.env.production

# Edit backend/.env with your secrets
nano backend/.env
# Set DB_PASSWORD and JWT_SECRET

# Build frontends
cd frontend
npm install
npm run build
cd ..

cd frontend-old-nawaride
npm install
npm run build
cd ..
```

### Step 2: Deploy XOOM Docker Containers (15 minutes)

```bash
cd /var/www/xoomrides

# Start XOOM containers
docker-compose up -d

# Wait for services to start (30 seconds)
sleep 30

# Check containers are running
docker-compose ps

# Should show:
# xoomrides-db        running    5432/tcp
# xoomrides-backend   running    127.0.0.1:3000->3000/tcp
# xoomrides-frontend  running    127.0.0.1:8080->80/tcp
# xoomrides-admin     running    127.0.0.1:8081->80/tcp
```

### Step 3: Test Container Access (5 minutes)

```bash
# Test backend (from VPS)
curl http://localhost:3000/health

# Test frontend
curl http://localhost:8080

# Test admin
curl http://localhost:8081

# All should respond successfully
```

### Step 4: Configure Host Nginx (10 minutes)

```bash
# Copy XOOM Nginx config to host
sudo cp /var/www/xoomrides/nginx-host-config.conf /etc/nginx/sites-available/xoomrides

# Enable the site
sudo ln -s /etc/nginx/sites-available/xoomrides /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# If test passes, reload Nginx
sudo systemctl reload nginx
```

**Expected output:**
```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

### Step 5: Obtain SSL Certificates (10 minutes)

```bash
# Get certificates for all XOOM subdomains
sudo certbot --nginx -d xoomrides.com -d www.xoomrides.com -d admin.xoomrides.com

# Follow the prompts:
# - Enter email address
# - Agree to Terms of Service
# - Choose to redirect HTTP to HTTPS (recommended)
```

Certbot will automatically update your Nginx config with SSL settings.

### Step 6: Test External Access (5 minutes)

From your local machine (or anywhere):

```bash
# Test main app
curl https://xoomrides.com

# Test admin
curl https://admin.xoomrides.com

# Test health check
curl https://xoomrides.com/api/health
```

Open in browser:
- https://xoomrides.com - Should load XOOM app
- https://admin.xoomrides.com - Should load admin dashboard

### Step 7: Create Admin User (5 minutes)

```bash
cd /var/www/xoomrides

# Connect to database
docker-compose exec db psql -U xoomrides_user -d xoomrides

# Generate password hash first (exit psql):
# node -e "console.log(require('bcrypt').hashSync('YourAdminPassword', 10))"

# Then in psql:
INSERT INTO users (name, phone, password_hash, role, is_verified)
VALUES (
  'Admin',
  '+923001234567',
  '$2b$10$YOUR_HASH_HERE',
  'admin',
  true
);

\q
```

### Step 8: Configure Automated Backups (5 minutes)

```bash
cd /var/www/xoomrides

# Make backup script executable
chmod +x backup.sh

# Create backup directory
sudo mkdir -p /var/backups/xoomrides
sudo chown $USER:$USER /var/backups/xoomrides

# Test backup
./backup.sh

# Add to cron (daily at 2 AM)
crontab -e

# Add this line:
0 2 * * * /var/www/xoomrides/backup.sh >> /var/log/xoomrides-backup.log 2>&1
```

---

## Verifying Everything Works

### 1. Check Docker Containers

```bash
cd /var/www/xoomrides
docker-compose ps

# All should be "Up" and "healthy"
```

### 2. Check Host Nginx

```bash
sudo nginx -t
sudo systemctl status nginx

# Check XOOM access logs
sudo tail -f /var/log/nginx/xoomrides_access.log
```

### 3. Check Other Apps Still Work

Visit your other apps to ensure XOOM deployment didn't affect them:
- http://yourotherapp.com
- http://anotherapp.com

All should still work normally.

### 4. Test XOOM Features

**Main App (xoomrides.com):**
- ✅ Homepage loads
- ✅ Can toggle rider/driver mode
- ✅ Map loads correctly
- ✅ Can signup as rider
- ✅ Can signup as driver

**Admin Dashboard (admin.xoomrides.com):**
- ✅ Admin login works
- ✅ Dashboard loads
- ✅ Can view users/rides

**Real-Time:**
- ✅ Socket.IO connects (check browser console)
- ✅ Driver location updates work
- ✅ Ride status updates in real-time

---

## Port Usage Summary

### Host Level (VPS):
- **80** - Nginx HTTP (redirects to HTTPS)
- **443** - Nginx HTTPS (routes to all apps)

### XOOM Containers (localhost only):
- **127.0.0.1:3000** - XOOM Backend API
- **127.0.0.1:8080** - XOOM Frontend
- **127.0.0.1:8081** - XOOM Admin

### Internal Docker Network:
- **5432** - PostgreSQL (not exposed to host)

### Your Other Apps:
- **Keep their existing ports** - No changes needed

---

## Managing Multiple Apps

### View All Running Containers

```bash
# All Docker containers on VPS
docker ps

# Just XOOM containers
cd /var/www/xoomrides && docker-compose ps
```

### Restart Individual Apps

```bash
# Restart XOOM
cd /var/www/xoomrides
docker-compose restart

# Restart specific XOOM service
docker-compose restart backend
docker-compose restart frontend
docker-compose restart admin

# Your other apps remain unaffected
```

### View Logs

```bash
# XOOM logs
cd /var/www/xoomrides
docker-compose logs -f

# Host Nginx logs
sudo tail -f /var/log/nginx/xoomrides_access.log
sudo tail -f /var/log/nginx/xoomrides_error.log

# Other app logs
cd /path/to/other/app && docker-compose logs -f
```

---

## Adding More Subdomains

### Future Subdomain: api.xoomrides.com

1. **Add DNS record:**
   ```
   A Record: api.xoomrides.com → YOUR_VPS_IP
   ```

2. **Update nginx-host-config.conf:**
   ```nginx
   server {
       listen 443 ssl http2;
       server_name api.xoomrides.com;
       
       ssl_certificate /etc/letsencrypt/live/xoomrides.com/fullchain.pem;
       ssl_certificate_key /etc/letsencrypt/live/xoomrides.com/privkey.pem;
       
       location / {
           proxy_pass http://127.0.0.1:3000;  # Direct to backend
           # ... headers ...
       }
   }
   ```

3. **Get SSL certificate:**
   ```bash
   sudo certbot --nginx -d api.xoomrides.com
   ```

4. **Reload Nginx:**
   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```

### Future Subdomain: mobile.xoomrides.com

Similar process - just change the `server_name` and `proxy_pass` to appropriate container.

---

## Troubleshooting

### Issue: Other apps stopped working after XOOM deployment

**Cause:** Port conflict or Nginx misconfiguration

**Fix:**
```bash
# Check what's using ports
sudo netstat -tulpn | grep :80
sudo netstat -tulpn | grep :443

# Test Nginx config
sudo nginx -t

# Check Nginx error log
sudo tail -50 /var/log/nginx/error.log

# Restart Nginx
sudo systemctl restart nginx
```

### Issue: XOOM containers can't be accessed

**Cause:** Containers not exposing ports correctly

**Fix:**
```bash
cd /var/www/xoomrides

# Check container ports
docker-compose ps

# Verify ports are bound to localhost
docker port xoomrides-frontend
docker port xoomrides-admin
docker port xoomrides-backend

# Test from VPS
curl http://localhost:8080
curl http://localhost:8081
curl http://localhost:3000/health
```

### Issue: SSL certificate error

**Cause:** Certificate not applied to subdomain

**Fix:**
```bash
# Check current certificates
sudo certbot certificates

# Add subdomain to certificate
sudo certbot --nginx -d xoomrides.com -d www.xoomrides.com -d admin.xoomrides.com

# Or renew all certificates
sudo certbot renew --force-renewal
```

### Issue: Database connection failed

**Cause:** Database not accessible or wrong credentials

**Fix:**
```bash
cd /var/www/xoomrides

# Check database container
docker-compose ps db

# Test database connection
docker-compose exec db psql -U xoomrides_user -d xoomrides -c "SELECT 1"

# Check backend environment
docker-compose exec backend env | grep DB_
```

---

## Maintenance

### Updating XOOM

```bash
cd /var/www/xoomrides

# Backup database first
./backup.sh

# Pull latest code
git pull origin main

# Rebuild frontends
cd frontend && npm install && npm run build && cd ..
cd frontend-old-nawaride && npm install && npm run build && cd ..

# Restart containers
docker-compose down
docker-compose up -d --build

# Check status
docker-compose ps
```

### Monitoring

```bash
# Check resource usage
docker stats

# Check disk space
df -h

# Check container health
docker-compose ps

# Check logs for errors
docker-compose logs --tail=100 | grep -i error
```

### Security Updates

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Update Docker images
cd /var/www/xoomrides
docker-compose pull
docker-compose up -d

# Restart Nginx (if needed)
sudo systemctl restart nginx
```

---

## Best Practices

### 1. **Isolate Each App**
- Each app in its own Docker network
- No direct container-to-container access between apps
- Each app has its own database

### 2. **Use localhost-only Ports**
- Containers expose ports to 127.0.0.1 only
- Only host Nginx has public ports (80, 443)
- Prevents direct external access to containers

### 3. **Separate Nginx Configs**
- One file per app in /etc/nginx/sites-available/
- Easy to enable/disable individual apps
- No conflicts between app configurations

### 4. **Monitor Everything**
- Check logs regularly
- Monitor resource usage
- Set up uptime monitoring (UptimeRobot, etc.)

### 5. **Regular Backups**
- Automated daily backups
- Test restore process
- Store backups off-site

---

## Quick Reference

### XOOM Services

| Service | Internal Port | External URL |
|---------|--------------|--------------|
| Frontend | localhost:8080 | https://xoomrides.com |
| Admin | localhost:8081 | https://admin.xoomrides.com |
| Backend | localhost:3000 | (via frontend/admin) |
| Database | internal:5432 | (not exposed) |

### Important Files

| File | Location | Purpose |
|------|----------|---------|
| Host Nginx | `/etc/nginx/sites-available/xoomrides` | Routes traffic |
| Frontend Nginx | `/var/www/xoomrides/nginx-frontend.conf` | Internal routing |
| Admin Nginx | `/var/www/xoomrides/nginx-admin.conf` | Internal routing |
| Docker Compose | `/var/www/xoomrides/docker-compose.yml` | Container config |
| Backups | `/var/backups/xoomrides/` | Database backups |

### Common Commands

```bash
# Deploy/Update
cd /var/www/xoomrides && ./deploy.sh

# Restart
cd /var/www/xoomrides && docker-compose restart

# Logs
cd /var/www/xoomrides && docker-compose logs -f

# Backup
cd /var/www/xoomrides && ./backup.sh

# Host Nginx
sudo nginx -t
sudo systemctl reload nginx
sudo tail -f /var/log/nginx/xoomrides_access.log
```

---

**Your XOOM Rides deployment is now running alongside your other apps!** 🎉

Both XOOM and your existing applications should work perfectly without interfering with each other.

