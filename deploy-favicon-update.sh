#!/bin/bash

# XOOM Favicon Update Deployment Script
# Deploys new PNG favicon files to production

set -e

echo "🎨 XOOM Favicon Update Deployment"
echo "===================================="
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

echo -e "${BLUE}📦 Rebuilding frontend with new favicons...${NC}"
docker-compose build frontend

echo -e "${BLUE}🔄 Restarting services...${NC}"
docker-compose down
docker-compose up -d

echo -e "${BLUE}⏳ Waiting for services to start...${NC}"
sleep 10

echo -e "${BLUE}✅ Checking service status...${NC}"
docker-compose ps

echo ""
echo -e "${GREEN}✅ Favicon update deployment complete!${NC}"
echo ""
echo -e "${YELLOW}📝 New Favicon Files Deployed:${NC}"
echo "  • favicon.ico (15KB) - IE/Legacy browsers"
echo "  • favicon-16x16.png (476B) - Standard displays"
echo "  • favicon-32x32.png (1KB) - Retina displays"
echo "  • apple-touch-icon.png (8.2KB) - iOS home screen"
echo "  • android-chrome-192x192.png (9.1KB) - Android standard"
echo "  • android-chrome-512x512.png (31KB) - Android high-res"
echo ""
echo -e "${YELLOW}🧪 Testing Steps:${NC}"
echo "1. Visit https://xoomrides.com"
echo "2. Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)"
echo "3. Check browser tab for XOOM favicon"
echo "4. Test PWA installation (Menu → Install XOOM)"
echo "5. Check iOS home screen icon (Safari → Share → Add to Home Screen)"
echo "6. Check Android home screen icon (Chrome → Menu → Add to Home screen)"
echo ""
echo -e "${GREEN}🎉 Your XOOM favicons are now live across all platforms!${NC}"
echo ""

