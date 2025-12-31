# XOOM Rides Multi-App VPS Deployment Checklist

## ✅ Complete Pre-Deployment Checklist

Use this checklist to ensure everything is properly configured before going live.

---

## Phase 1: Pre-Deployment Setup

### Environment Preparation
- [ ] VPS provisioned with Ubuntu 20.04/22.04
- [ ] Minimum 4GB RAM, 2 CPU cores, 40GB storage
- [ ] SSH access configured
- [ ] Domain xoomrides.com purchased
- [ ] Wildcard DNS configured (*.xoomrides.com → VPS IP)

### Local Preparation
- [ ] Node.js 18+ installed locally
- [ ] Project files downloaded/cloned
- [ ] Secrets generated:
  - [ ] Database password (16+ characters)
  - [ ] JWT secret (64+ characters)
  - [ ] Admin password hash generated

### Environment Files Created
- [ ] `backend/.env` created from `.env.production.example`
- [ ] `backend/.env` configured with:
  - [ ] DB_USER=xoomrides_user
  - [ ] DB_PASSWORD=<your_generated_password>
  - [ ] DB_NAME=xoomrides
  - [ ] JWT_SECRET=<your_generated_secret>
- [ ] `frontend/.env.production` created from example
- [ ] `frontend-old-nawaride/.env` configured for admin build

---

## Phase 2: VPS Initial Setup

### System Updates
- [ ] `sudo apt update && sudo apt upgrade -y` executed
- [ ] System rebooted if kernel updated

### Docker Installation
- [ ] Docker installed (`docker --version` works)
- [ ] Docker Compose installed (`docker-compose --version` works)
- [ ] Current user added to docker group
- [ ] Docker service running (`sudo systemctl status docker`)

### Nginx Installation (If Not Already Installed)
- [ ] Nginx installed (`nginx -v` works)
- [ ] Nginx running (`sudo systemctl status nginx`)
- [ ] Default site disabled if needed

### Firewall Configuration
- [ ] UFW installed
- [ ] Port 22 allowed (SSH)
- [ ] Port 80 allowed (HTTP)
- [ ] Port 443 allowed (HTTPS)
- [ ] UFW enabled
- [ ] Firewall status verified (`sudo ufw status`)

### Project Files
- [ ] `/var/www/xoomrides` directory created
- [ ] Project files uploaded/cloned to VPS
- [ ] Correct ownership set (`chown $USER:$USER`)
- [ ] Environment files copied to VPS

---

## Phase 3: DNS Configuration

### DNS Records Added
- [ ] A Record: `xoomrides.com` → VPS IP
- [ ] A Record: `www.xoomrides.com` → VPS IP
- [ ] A Record: `admin.xoomrides.com` → VPS IP
- [ ] Wildcard: `*.xoomrides.com` → VPS IP (optional)

### DNS Verification
- [ ] `nslookup xoomrides.com` shows VPS IP
- [ ] `nslookup www.xoomrides.com` shows VPS IP
- [ ] `nslookup admin.xoomrides.com` shows VPS IP
- [ ] DNS propagation complete (wait 15 minutes if needed)

---

## Phase 4: Build Applications

### Main Frontend Build
- [ ] `cd /var/www/xoomrides/frontend`
- [ ] `npm install` successful
- [ ] `npm run build` successful
- [ ] `frontend/dist` directory exists
- [ ] `frontend/dist/index.html` exists

### Admin Frontend Build
- [ ] `cd /var/www/xoomrides/frontend-old-nawaride`
- [ ] `npm install` successful
- [ ] `npm run build` successful
- [ ] `frontend-old-nawaride/dist` directory exists
- [ ] `frontend-old-nawaride/dist/index.html` exists

---

## Phase 5: Docker Deployment

### Container Startup
- [ ] `cd /var/www/xoomrides`
- [ ] `docker-compose up -d` successful
- [ ] No error messages in output

### Container Health Check
- [ ] `docker-compose ps` shows all containers "Up"
- [ ] `xoomrides-db` - healthy
- [ ] `xoomrides-backend` - healthy  
- [ ] `xoomrides-frontend` - healthy
- [ ] `xoomrides-admin` - healthy

### Port Verification
- [ ] Backend: `curl http://localhost:3000/health` works
- [ ] Frontend: `curl http://localhost:8080` returns HTML
- [ ] Admin: `curl http://localhost:8081` returns HTML

### Database Verification
- [ ] Can connect to database:
  ```bash
  docker-compose exec db psql -U xoomrides_user -d xoomrides -c "SELECT 1"
  ```
- [ ] Migrations applied successfully
- [ ] Tables created (check with `\dt` in psql)

---

## Phase 6: Host Nginx Configuration

### Nginx Config Installation
- [ ] Config copied: `sudo cp nginx-host-config.conf /etc/nginx/sites-available/xoomrides`
- [ ] Symlink created: `sudo ln -s /etc/nginx/sites-available/xoomrides /etc/nginx/sites-enabled/`
- [ ] Config test passed: `sudo nginx -t`
- [ ] Nginx reloaded: `sudo systemctl reload nginx`

### HTTP Access Test (Before SSL)
- [ ] `curl http://xoomrides.com` redirects to HTTPS
- [ ] `curl http://admin.xoomrides.com` redirects to HTTPS

---

## Phase 7: SSL Certificate

### Certificate Acquisition
- [ ] Certbot installed
- [ ] Command executed:
  ```bash
  sudo certbot --nginx -d xoomrides.com -d www.xoomrides.com -d admin.xoomrides.com
  ```
- [ ] Email provided to Let's Encrypt
- [ ] Terms of Service accepted
- [ ] Certificates obtained successfully

### SSL Verification
- [ ] Certificates exist: `sudo ls /etc/letsencrypt/live/xoomrides.com/`
- [ ] Should see: `cert.pem`, `chain.pem`, `fullchain.pem`, `privkey.pem`
- [ ] Nginx auto-updated by Certbot
- [ ] Nginx reloaded successfully

### HTTPS Access Test
- [ ] `curl https://xoomrides.com` returns HTML (no SSL errors)
- [ ] `curl https://admin.xoomrides.com` returns HTML
- [ ] Browser shows green padlock for both URLs
- [ ] No certificate warnings

---

## Phase 8: Application Configuration

### Admin User Creation
- [ ] Connected to database
- [ ] Admin password hash generated
- [ ] Admin user inserted into database
- [ ] Admin user verified: 
  ```sql
  SELECT id, name, phone, role FROM users WHERE role = 'admin';
  ```

### Test Logins
- [ ] Can access https://xoomrides.com
- [ ] Can access https://admin.xoomrides.com
- [ ] Admin login works with created credentials
- [ ] Can create rider account
- [ ] Can create driver account

---

## Phase 9: Automated Backups

### Backup Setup
- [ ] Backup directory created: `sudo mkdir -p /var/backups/xoomrides`
- [ ] Ownership set: `sudo chown $USER:$USER /var/backups/xoomrides`
- [ ] `backup.sh` executable: `chmod +x backup.sh`
- [ ] Test backup successful: `./backup.sh`
- [ ] Backup file created in `/var/backups/xoomrides/`

### Cron Configuration
- [ ] Crontab edited: `crontab -e`
- [ ] Daily backup added: `0 2 * * * /var/www/xoomrides/backup.sh >> /var/log/xoomrides-backup.log 2>&1`
- [ ] Cron job verified: `crontab -l`

---

## Phase 10: Testing & Verification

### Frontend Testing (xoomrides.com)
- [ ] Homepage loads without errors
- [ ] No console errors in browser dev tools
- [ ] Map displays correctly
- [ ] Can toggle rider/driver mode
- [ ] Can click on map to set locations
- [ ] Current location button works
- [ ] Vehicle selector works
- [ ] Fare estimate displays

### Admin Testing (admin.xoomrides.com)
- [ ] Admin login page loads
- [ ] Can login with admin credentials
- [ ] Dashboard displays
- [ ] Can view users list
- [ ] Can view rides list
- [ ] Can view drivers list
- [ ] Fare settings page works

### Real-Time Features
- [ ] Socket.IO connects (check browser console)
- [ ] Driver location updates working
- [ ] Ride status updates in real-time
- [ ] No WebSocket errors

### End-to-End Ride Flow
- [ ] Rider can create account
- [ ] Driver can create account
- [ ] Driver can go online
- [ ] Rider can request ride
- [ ] Driver receives ride request
- [ ] Driver can accept ride
- [ ] Rider sees driver assigned
- [ ] Driver can mark arrived
- [ ] Driver can start trip
- [ ] Driver can complete trip
- [ ] Both can rate each other

### Performance Check
- [ ] Page load time < 3 seconds
- [ ] Map tiles load quickly
- [ ] API responses < 500ms
- [ ] No memory leaks (check over time)

---

## Phase 11: Monitoring Setup

### Log Verification
- [ ] Backend logs accessible: `docker-compose logs backend`
- [ ] Frontend logs accessible: `docker-compose logs frontend`
- [ ] Admin logs accessible: `docker-compose logs admin`
- [ ] Nginx logs accessible: `sudo tail -f /var/log/nginx/xoomrides_access.log`

### Health Checks
- [ ] Backend health: `curl https://xoomrides.com/api/health`
- [ ] Map providers health: `curl https://xoomrides.com/api/maps/providers/health`

### Resource Monitoring
- [ ] `docker stats` shows reasonable resource usage
- [ ] `df -h` shows sufficient disk space
- [ ] `free -h` shows sufficient memory
- [ ] `htop` shows normal CPU usage

---

## Phase 12: Other Apps Verification

### Existing Apps Still Working
- [ ] Other App 1: Still accessible
- [ ] Other App 2: Still accessible
- [ ] Other App N: Still accessible
- [ ] No interference between apps
- [ ] All apps' SSL certificates working

---

## Phase 13: Security Verification

### Security Checklist
- [ ] Strong database password used (16+ chars)
- [ ] Strong JWT secret used (64+ chars)
- [ ] SSL/TLS enabled and working
- [ ] HTTPS redirect working
- [ ] Security headers present (check browser dev tools)
- [ ] Firewall enabled and configured
- [ ] No database port exposed externally
- [ ] Container ports only on localhost
- [ ] Admin access requires authentication
- [ ] Rate limiting enabled

### Security Headers Check
Visit https://securityheaders.com/?q=xoomrides.com
- [ ] HSTS header present
- [ ] X-Frame-Options present
- [ ] X-Content-Type-Options present
- [ ] X-XSS-Protection present
- [ ] Security score A or better

---

## Phase 14: Documentation

### Documentation Review
- [ ] `MULTI_APP_VPS_SETUP.md` reviewed
- [ ] `DEPLOYMENT_INSTRUCTIONS.md` available
- [ ] `README_DEPLOYMENT.md` available
- [ ] Admin credentials documented (secure location)
- [ ] VPS IP documented
- [ ] DNS settings documented

### Runbook Created
- [ ] How to restart services
- [ ] How to view logs
- [ ] How to backup database
- [ ] How to restore from backup
- [ ] How to update application
- [ ] Emergency contacts listed

---

## Phase 15: Go Live

### Final Checks Before Launch
- [ ] All above items completed
- [ ] Test accounts created and working
- [ ] All features tested
- [ ] Performance acceptable
- [ ] Security verified
- [ ] Backups working
- [ ] Monitoring in place
- [ ] Documentation complete

### Launch
- [ ] Announce to team
- [ ] Monitor closely for 24 hours
- [ ] Check logs frequently
- [ ] Watch resource usage
- [ ] Be ready to respond to issues

### Post-Launch (First 24 Hours)
- [ ] No critical errors in logs
- [ ] Performance stable
- [ ] Resource usage normal
- [ ] Backups running successfully
- [ ] User signups working
- [ ] Ride booking working
- [ ] Real-time features working

---

## Maintenance Checklist (Ongoing)

### Daily
- [ ] Check application accessibility
- [ ] Review error logs
- [ ] Verify backups ran successfully

### Weekly
- [ ] Review resource usage trends
- [ ] Check disk space
- [ ] Review SSL certificate expiry (auto-renews)
- [ ] Test restore from backup

### Monthly
- [ ] Update system packages: `sudo apt update && sudo apt upgrade`
- [ ] Update Docker images: `docker-compose pull`
- [ ] Review and archive old backups
- [ ] Security audit
- [ ] Performance optimization review

---

## Troubleshooting Quick Reference

### If Main App Not Loading
1. Check Docker containers: `docker-compose ps`
2. Check host Nginx: `sudo nginx -t && sudo systemctl status nginx`
3. Check logs: `docker-compose logs frontend`
4. Test direct access: `curl http://localhost:8080`

### If Admin Not Loading
1. Check admin container: `docker-compose ps admin`
2. Check logs: `docker-compose logs admin`
3. Test direct access: `curl http://localhost:8081`

### If Real-Time Not Working
1. Check backend logs: `docker-compose logs backend | grep -i socket`
2. Check browser console for WebSocket errors
3. Verify Nginx WebSocket config in host Nginx

### If Database Connection Fails
1. Check database container: `docker-compose ps db`
2. Test connection: `docker-compose exec db psql -U xoomrides_user -d xoomrides -c "SELECT 1"`
3. Check backend environment: `docker-compose exec backend env | grep DB_`

---

## Success Criteria

✅ **Deployment is successful when:**
- All containers healthy
- Both xoomrides.com and admin.xoomrides.com accessible via HTTPS
- Can create rider and driver accounts
- Can complete end-to-end ride flow
- Real-time updates working
- No errors in logs
- Backups running
- Other apps still working
- Performance acceptable
- Security verified

---

## Sign-Off

- [ ] **Technical Lead:** Deployment verified and approved
- [ ] **DevOps:** Infrastructure stable and monitored
- [ ] **QA:** All features tested and working
- [ ] **Product:** Ready for user onboarding

**Deployment Date:** _______________
**Deployed By:** _______________
**Version:** v1.0.0

---

**Congratulations! XOOM Rides is now live on xoomrides.com! 🚀**

