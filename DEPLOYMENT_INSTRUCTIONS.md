# XOOM Production Deployment Instructions

## Quick Reference Guide for xoomrides.com

This guide will help you deploy XOOM to your VPS with the domain **xoomrides.com**.

---

## ⚠️ IMPORTANT: Before You Start

### 1. Create Environment Files from Examples

The `.env` files are in `.gitignore` for security. You need to create them:

```bash
# Backend environment file
cp backend/.env.production.example backend/.env

# Frontend environment file  
cp frontend/.env.production.example frontend/.env.production
```

### 2. Generate Strong Secrets

**Generate Database Password (16+ characters):**
```bash
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

**Generate JWT Secret (64+ characters):**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 3. Update backend/.env

Open `backend/.env` and replace:
- `DB_PASSWORD` - Use generated password from step 2
- `JWT_SECRET` - Use generated secret from step 2

### 4. Update frontend/.env.production

The file should already have correct values for xoomrides.com. Verify:
```env
VITE_API_URL=https://xoomrides.com
VITE_SOCKET_URL=https://xoomrides.com
```

---

## 🚀 Deployment Steps

### Phase 1: Local Preparation (5 minutes)

1. **Ensure environment files are created and configured** (see above)
2. **Test build locally:**
   ```bash
   cd frontend
   npm install
   npm run build
   cd ..
   ```
3. **Commit files to Git:**
   ```bash
   git add .
   git commit -m "Production deployment configuration"
   git push origin main
   ```

### Phase 2: VPS Initial Setup (15 minutes)

SSH into your VPS:
```bash
ssh root@YOUR_VPS_IP
```

Run these commands:
```bash
# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
apt install docker-compose -y

# Install Git and other tools
apt install git ufw -y

# Create deployment directory
mkdir -p /var/www/xoom
cd /var/www/xoom

# Clone your repository
git clone YOUR_GITHUB_REPO_URL .

# Copy environment files (you may need to create them on server)
# If you haven't committed .env files, create them now:
cp backend/.env.production.example backend/.env
cp frontend/.env.production.example frontend/.env.production

# Edit with your secrets
nano backend/.env
# (Paste the DB_PASSWORD and JWT_SECRET you generated)

# Make deploy script executable
chmod +x deploy.sh
chmod +x backup.sh
```

### Phase 3: DNS Configuration (5 minutes)

In your domain registrar (where you bought xoomrides.com):

1. Go to DNS settings
2. Add these A Records:
   ```
   Type: A    Name: @              Value: YOUR_VPS_IP
   Type: A    Name: www            Value: YOUR_VPS_IP
   ```
3. Wait 5-15 minutes for DNS propagation
4. Verify with: `nslookup xoomrides.com`

### Phase 4: SSL Certificate (10 minutes)

Get Let's Encrypt certificate:
```bash
cd /var/www/xoom

# First, ensure DNS is propagated (wait if needed)
# Then obtain certificate:
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

**Important:** Make sure port 80 is not in use when running this command.

### Phase 5: Deploy Application (20 minutes)

```bash
cd /var/www/xoom

# Set database password in environment
export DB_PASSWORD="your-generated-password-here"

# Run deployment
./deploy.sh
```

The script will:
- ✅ Build frontend
- ✅ Start Docker containers
- ✅ Run database migrations
- ✅ Start all services

### Phase 6: Configure Firewall (2 minutes)

```bash
# Allow SSH (IMPORTANT: Do this first!)
ufw allow 22/tcp

# Allow HTTP/HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Enable firewall
ufw enable
```

### Phase 7: Create Admin User (5 minutes)

```bash
cd /var/www/xoom

# Connect to database
docker-compose exec db psql -U xoom_production -d xoom_production
```

In the PostgreSQL prompt:
```sql
-- Generate password hash first (exit psql and run):
-- node -e "console.log(require('bcrypt').hashSync('YourAdminPassword123', 10))"

-- Then insert admin user:
INSERT INTO users (name, phone, password_hash, role, is_verified)
VALUES (
  'Admin',
  '+923001234567',
  '$2b$10$PASTE_YOUR_GENERATED_HASH_HERE',
  'admin',
  true
);

-- Verify
SELECT id, name, phone, role FROM users WHERE role = 'admin';

-- Exit
\q
```

### Phase 8: Setup Automated Backups (5 minutes)

```bash
# Add backup to crontab
crontab -e

# Add this line (runs daily at 2 AM):
0 2 * * * /var/www/xoom/backup.sh >> /var/log/xoom-backup.log 2>&1
```

---

## ✅ Verification Checklist

After deployment, verify:

1. **Frontend loads:**
   - Open https://xoomrides.com
   - Should see XOOM app interface
   - No console errors

2. **Backend is healthy:**
   - Visit https://xoomrides.com/api/health
   - Should return: `{"status":"ok", "timestamp":"...", "uptime":"..."}`

3. **Map providers working:**
   - Visit https://xoomrides.com/api/maps/providers/health
   - Should show provider status

4. **Admin login:**
   - Go to https://xoomrides.com/login
   - Login with admin credentials
   - Access admin dashboard

5. **Create test accounts:**
   - Signup as rider
   - Signup as driver
   - Test ride booking flow

---

## 🔍 Monitoring & Maintenance

### View Logs
```bash
cd /var/www/xoom

# All services
docker-compose logs -f

# Backend only
docker-compose logs -f backend

# Nginx only
docker-compose logs -f nginx

# Database only
docker-compose logs -f db
```

### Check Service Status
```bash
docker-compose ps
docker stats
```

### Restart Services
```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart backend
docker-compose restart nginx
```

### Update Application
```bash
cd /var/www/xoom
git pull origin main
./deploy.sh
```

### Manual Database Backup
```bash
cd /var/www/xoom
./backup.sh
```

### Restore from Backup
```bash
# Stop containers
docker-compose down

# Restore database
gunzip -c /var/backups/xoom/xoom_YYYYMMDD_HHMMSS.sql.gz | \
  docker-compose exec -T db psql -U xoom_production -d xoom_production

# Start containers
docker-compose up -d
```

---

## 🚨 Troubleshooting

### Issue: Frontend not loading

**Check Nginx logs:**
```bash
docker-compose logs nginx
```

**Verify frontend was built:**
```bash
ls -la frontend/dist/
```

**Rebuild frontend:**
```bash
cd frontend
npm run build
cd ..
docker-compose restart nginx
```

### Issue: Backend not responding

**Check backend logs:**
```bash
docker-compose logs backend
```

**Verify environment variables:**
```bash
docker-compose exec backend env | grep DB_
docker-compose exec backend env | grep JWT_
```

**Restart backend:**
```bash
docker-compose restart backend
```

### Issue: Database connection failed

**Check database is running:**
```bash
docker-compose ps db
```

**Check database logs:**
```bash
docker-compose logs db
```

**Verify credentials:**
```bash
docker-compose exec db psql -U xoom_production -d xoom_production -c "SELECT 1"
```

### Issue: SSL certificate errors

**Check certificate files:**
```bash
docker run --rm -v certbot-etc:/etc/letsencrypt alpine ls -la /etc/letsencrypt/live/xoomrides.com/
```

**Renew certificate:**
```bash
docker-compose run --rm certbot renew
docker-compose restart nginx
```

### Issue: WebSocket not connecting

**Check Socket.IO in logs:**
```bash
docker-compose logs backend | grep -i socket
```

**Verify Nginx WebSocket config:**
```bash
cat nginx-production.conf | grep -A 10 "socket.io"
```

---

## 🔒 Security Best Practices

- ✅ Change default database password
- ✅ Use strong JWT secret (64+ chars)
- ✅ Enable firewall (UFW)
- ✅ Keep SSL certificates auto-renewed
- ✅ Regular backups (automated)
- ✅ Monitor logs for suspicious activity
- ✅ Keep system updated: `apt update && apt upgrade`
- ✅ Limit SSH access (consider key-based auth only)
- ✅ Set up fail2ban for brute-force protection

---

## 📞 Support

- **Logs Location:** `/var/log/xoom-backup.log`
- **Backup Location:** `/var/backups/xoom/`
- **Application Directory:** `/var/www/xoom/`
- **Documentation:** Check `docs/` folder in project

---

## 🎯 Post-Launch Tasks

1. **Test all features thoroughly**
2. **Create test rider and driver accounts**
3. **Set up monitoring alerts** (optional: UptimeRobot, StatusCake)
4. **Configure Google Analytics** (if needed)
5. **Set up email service** (for notifications)
6. **Plan marketing launch**
7. **Prepare support documentation for users**
8. **Set up customer support system**

---

**Deployment Estimate:** 60-90 minutes total

Good luck with your launch! 🚀

