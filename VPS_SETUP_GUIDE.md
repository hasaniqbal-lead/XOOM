# XOOM VPS Setup Guide for xoomrides.com

## Complete Server Setup Instructions

This guide provides step-by-step instructions for setting up your VPS for XOOM deployment.

---

## Prerequisites

- VPS with Ubuntu 20.04 or 22.04 LTS
- Minimum 4GB RAM, 2 CPU cores, 40GB storage (Medium VPS)
- Root or sudo access
- Domain name (xoomrides.com) pointed to your VPS IP

---

## Step 1: Initial VPS Configuration (15 minutes)

### 1.1 Connect to Your VPS

```bash
ssh root@YOUR_VPS_IP
```

If you have a non-root user:
```bash
ssh your-username@YOUR_VPS_IP
```

### 1.2 Update System Packages

```bash
# Update package lists
sudo apt update

# Upgrade installed packages
sudo apt upgrade -y

# Install basic utilities
sudo apt install -y curl wget git vim htop net-tools ufw
```

### 1.3 Create a Deployment User (Optional but Recommended)

If you're logged in as root, create a non-root user:

```bash
# Create user
adduser xoom

# Add to sudo group
usermod -aG sudo xoom

# Switch to new user
su - xoom
```

### 1.4 Set Up SSH Key Authentication (Recommended)

On your local machine:
```bash
ssh-keygen -t ed25519 -C "xoom-deployment"
ssh-copy-id xoom@YOUR_VPS_IP
```

Test connection:
```bash
ssh xoom@YOUR_VPS_IP
```

---

## Step 2: Install Docker (10 minutes)

### 2.1 Install Docker Engine

```bash
# Remove old Docker versions (if any)
sudo apt remove docker docker-engine docker.io containerd runc

# Install prerequisites
sudo apt install -y apt-transport-https ca-certificates curl software-properties-common

# Add Docker's official GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Set up the stable repository
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

### 2.2 Configure Docker Permissions

```bash
# Add current user to docker group
sudo usermod -aG docker $USER

# Apply group changes (logout and login again, or run):
newgrp docker

# Verify Docker is running
sudo systemctl status docker

# Test Docker
docker run hello-world
```

### 2.3 Install Docker Compose (Standalone)

```bash
# Download Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# Make executable
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker-compose --version
```

**Expected output:** `Docker Compose version v2.24.0` (or similar)

---

## Step 3: Configure Firewall (5 minutes)

### 3.1 Setup UFW (Uncomplicated Firewall)

```bash
# Check UFW status
sudo ufw status

# Allow SSH (IMPORTANT: Do this BEFORE enabling firewall!)
sudo ufw allow 22/tcp
sudo ufw allow OpenSSH

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Optional: Allow PostgreSQL for remote access (NOT recommended)
# sudo ufw allow 5432/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status verbose
```

**Expected output:**
```
Status: active

To                         Action      From
--                         ------      ----
22/tcp                     ALLOW       Anywhere
80/tcp                     ALLOW       Anywhere
443/tcp                    ALLOW       Anywhere
```

### 3.2 Verify Ports

```bash
# Check listening ports
sudo netstat -tulpn | grep LISTEN
```

---

## Step 4: Create Deployment Directory (2 minutes)

### 4.1 Setup Directory Structure

```bash
# Create main directory
sudo mkdir -p /var/www/xoom

# Change ownership to current user
sudo chown -R $USER:$USER /var/www/xoom

# Navigate to directory
cd /var/www/xoom

# Verify permissions
ls -la /var/www/
```

### 4.2 Clone Repository

**Option A: Via Git (if you have a repository)**
```bash
cd /var/www/xoom
git clone https://github.com/YOUR_USERNAME/xoom.git .
```

**Option B: Via SCP/SFTP (upload from local machine)**

On your local machine:
```bash
# From your XOOM project directory
scp -r * xoom@YOUR_VPS_IP:/var/www/xoom/
```

**Option C: Via rsync (recommended for updates)**
```bash
# From your local XOOM project directory
rsync -avz --exclude 'node_modules' --exclude '.git' --exclude 'frontend/dist' ./ xoom@YOUR_VPS_IP:/var/www/xoom/
```

### 4.3 Verify Files

```bash
cd /var/www/xoom
ls -la

# You should see:
# - backend/
# - frontend/
# - docker-compose.yml
# - nginx-production.conf
# - deploy.sh
# - backup.sh
# - etc.
```

---

## Step 5: Create Environment Files (10 minutes)

### 5.1 Generate Secrets

```bash
# Generate strong database password
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"

# Generate JWT secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**Save these values!** You'll need them in the next step.

### 5.2 Create Backend Environment File

```bash
cd /var/www/xoom

# Create .env from example
cp backend/.env.production.example backend/.env

# Edit with your secrets
nano backend/.env
```

Update these values:
```env
DB_PASSWORD=YOUR_GENERATED_PASSWORD_HERE
JWT_SECRET=YOUR_GENERATED_JWT_SECRET_HERE
```

Save and exit (Ctrl+X, then Y, then Enter)

### 5.3 Create Frontend Environment File

```bash
# Create frontend .env.production
cp frontend/.env.production.example frontend/.env.production

# Verify it has correct values
cat frontend/.env.production
```

Should show:
```env
VITE_API_URL=https://xoomrides.com
VITE_SOCKET_URL=https://xoomrides.com
```

### 5.4 Verify Environment Files

```bash
# Check backend .env (don't print secrets!)
ls -la backend/.env

# Verify it doesn't contain CHANGE_THIS
grep -i "CHANGE_THIS" backend/.env
# (Should return nothing if configured correctly)
```

---

## Step 6: Configure System Resources (Optional)

### 6.1 Increase Swap Space (if RAM < 4GB)

```bash
# Check current swap
free -h

# Create 2GB swap file
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Make permanent
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Verify
free -h
```

### 6.2 Optimize Docker Logging

```bash
# Create Docker daemon config
sudo mkdir -p /etc/docker
sudo nano /etc/docker/daemon.json
```

Add:
```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

Restart Docker:
```bash
sudo systemctl restart docker
```

---

## Step 7: Setup Automated Backups (5 minutes)

### 7.1 Make Backup Script Executable

```bash
cd /var/www/xoom
chmod +x backup.sh
```

### 7.2 Test Backup Script

```bash
# Create backup directory
sudo mkdir -p /var/backups/xoom
sudo chown $USER:$USER /var/backups/xoom

# Test backup (will fail until database is running)
./backup.sh
```

### 7.3 Schedule Daily Backups

```bash
# Open crontab
crontab -e

# Add this line (runs daily at 2 AM)
0 2 * * * /var/www/xoom/backup.sh >> /var/log/xoom-backup.log 2>&1

# Save and exit
```

Verify cron job:
```bash
crontab -l
```

---

## Step 8: Install Additional Monitoring Tools (Optional)

### 8.1 Install System Monitoring

```bash
# Install monitoring tools
sudo apt install -y htop iotop nethogs

# Install log viewer
sudo apt install -y lnav
```

### 8.2 Install Docker Monitoring

```bash
# Lazy docker (container management UI)
curl https://raw.githubusercontent.com/jesseduffield/lazydocker/master/scripts/install_update_linux.sh | bash
```

Usage:
```bash
lazydocker
```

---

## Step 9: Security Hardening (Optional but Recommended)

### 9.1 Disable Root SSH Login

```bash
sudo nano /etc/ssh/sshd_config
```

Find and set:
```
PermitRootLogin no
PasswordAuthentication no
```

Restart SSH:
```bash
sudo systemctl restart sshd
```

### 9.2 Install Fail2Ban

```bash
# Install fail2ban
sudo apt install -y fail2ban

# Configure
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
sudo nano /etc/fail2ban/jail.local

# Enable and start
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# Check status
sudo fail2ban-client status
```

### 9.3 Setup Automatic Security Updates

```bash
sudo apt install -y unattended-upgrades

# Configure
sudo dpkg-reconfigure -plow unattended-upgrades
```

---

## Step 10: Pre-Flight Checklist

Before deploying, verify:

- ✅ Docker and Docker Compose installed
- ✅ Firewall configured (ports 22, 80, 443)
- ✅ Deployment directory created (/var/www/xoom)
- ✅ Project files uploaded/cloned
- ✅ Environment files created and configured
- ✅ Secrets generated (DB password, JWT secret)
- ✅ Backup script configured
- ✅ System resources optimized (if needed)

Check system status:
```bash
# Docker status
docker --version
docker-compose --version
sudo systemctl status docker

# Firewall status
sudo ufw status

# Disk space
df -h

# Memory
free -h

# Verify files
ls -la /var/www/xoom/
```

---

## Troubleshooting

### Docker Permission Denied

```bash
sudo usermod -aG docker $USER
newgrp docker
# Or logout and login again
```

### Firewall Locked Out

If you accidentally locked yourself out:
```bash
# From VPS console (not SSH):
sudo ufw disable
sudo ufw allow 22/tcp
sudo ufw enable
```

### Disk Space Issues

```bash
# Check disk usage
df -h

# Clean Docker resources
docker system prune -a --volumes
```

### Port Already in Use

```bash
# Check what's using port 80
sudo lsof -i :80

# Kill process if needed
sudo kill -9 <PID>
```

---

## Next Steps

✅ VPS is now ready for deployment!

**Continue to DNS Configuration:**
- See `DEPLOYMENT_INSTRUCTIONS.md` - Phase 3: DNS Configuration
- Configure A records for xoomrides.com

**Then proceed with SSL and Deployment:**
- Obtain Let's Encrypt certificate
- Run `./deploy.sh`

---

## Quick Reference

### Important Directories
```
/var/www/xoom/          - Application directory
/var/backups/xoom/      - Database backups
/etc/letsencrypt/       - SSL certificates
/var/log/               - System logs
```

### Important Commands
```bash
# View logs
docker-compose logs -f

# Restart services
docker-compose restart

# Check status
docker-compose ps

# System resources
htop
docker stats
```

### Emergency Commands
```bash
# Stop all containers
docker-compose down

# Remove all containers and volumes (DANGER!)
docker-compose down -v

# Restore from backup
./backup.sh  # (see restore instructions in script)
```

---

**VPS Setup Complete! ✅**

Your server is now ready for XOOM deployment. Proceed to DNS configuration and SSL certificate setup.

