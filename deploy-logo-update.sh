#!/bin/bash

# XOOM Logo Update Deployment Script
# This script deploys the new SVG logo integration to production

set -e

echo "🎨 XOOM Logo Update Deployment"
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
APP_DIR="/var/www/xoomrides"
BRANCH="main"

echo -e "${BLUE}📍 Navigating to application directory...${NC}"
cd "$APP_DIR"

echo -e "${BLUE}🔄 Pulling latest changes from Git...${NC}"
git fetch origin
git checkout "$BRANCH"
git pull origin "$BRANCH"

echo -e "${BLUE}📦 Rebuilding frontend with new logos...${NC}"
docker-compose build frontend

echo -e "${BLUE}🔄 Restarting services...${NC}"
docker-compose down
docker-compose up -d

echo -e "${BLUE}⏳ Waiting for services to start...${NC}"
sleep 10

echo -e "${BLUE}✅ Checking service status...${NC}"
docker-compose ps

echo ""
echo -e "${GREEN}✅ Logo update deployment complete!${NC}"
echo ""
echo -e "${YELLOW}📝 Next Steps:${NC}"
echo "1. Visit https://xoomrides.com"
echo "2. Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)"
echo "3. Check browser tab for XOOM favicon"
echo "4. Test PWA installation (Menu → Install XOOM)"
echo "5. Check iOS home screen icon (Safari → Share → Add to Home Screen)"
echo ""
echo -e "${GREEN}🎉 Your XOOM branding is now live!${NC}"
echo ""

