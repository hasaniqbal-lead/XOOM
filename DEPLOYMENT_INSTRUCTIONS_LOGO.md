# 🚀 XOOM Logo Deployment Instructions

## Quick Deploy (Recommended)

### **Option 1: Automated Script**
```bash
# SSH into VPS
ssh root@45.80.181.139

# Navigate to app directory
cd /var/www/xoomrides

# Download and run deployment script
curl -O https://raw.githubusercontent.com/hasaniqbal-lead/XOOM/main/deploy-logo-update.sh
chmod +x deploy-logo-update.sh
./deploy-logo-update.sh
```

---

## Manual Deploy

### **Step 1: SSH into VPS**
```bash
ssh root@45.80.181.139
```

### **Step 2: Pull Latest Changes**
```bash
cd /var/www/xoomrides
git pull origin main
```

### **Step 3: Rebuild Frontend**
```bash
docker-compose build frontend
```

### **Step 4: Restart Services**
```bash
docker-compose down
docker-compose up -d
```

### **Step 5: Verify**
```bash
docker-compose ps
```

All services should show "Up" status.

---

## 🧪 Testing

### **1. Browser Favicon**
1. Visit `https://xoomrides.com`
2. Hard refresh: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
3. Check browser tab - should display XOOM logo

### **2. PWA Installation (Desktop)**
1. Chrome: Click menu (⋮) → "Install XOOM"
2. Check installed app icon
3. Should show orange XOOM logo

### **3. PWA Installation (Mobile)**

#### **Android:**
1. Open `https://xoomrides.com` in Chrome
2. Tap menu (⋮) → "Add to Home screen"
3. Check home screen icon - orange XOOM logo

#### **iOS:**
1. Open `https://xoomrides.com` in Safari
2. Tap Share button (□↑)
3. Tap "Add to Home Screen"
4. Check home screen icon - rounded orange XOOM logo

---

## 🔍 Troubleshooting

### **Favicon Not Updating**

**Problem:** Old favicon still showing
**Solution:**
```bash
# Clear browser cache
1. Hard refresh: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)
2. Or: Clear browsing data → Cached images and files
3. Or: Open in incognito/private mode
```

### **PWA Icon Not Updating**

**Problem:** Old icon on home screen
**Solution:**
```bash
# Remove and re-install PWA
1. Remove XOOM app from home screen
2. Visit https://xoomrides.com
3. Re-install PWA
4. New icon should appear
```

### **Services Not Starting**

**Problem:** Docker containers not running
**Solution:**
```bash
# Check logs
docker-compose logs frontend

# Rebuild from scratch
docker-compose down -v
docker-compose build --no-cache frontend
docker-compose up -d
```

---

## 📦 What Changed

### **Files Modified:**
- `frontend/index.html` - Updated favicon links to SVG
- `frontend/public/manifest.json` - Updated PWA icons to SVG

### **Files Added:**
- `frontend/public/favicon.svg` - Main favicon
- `frontend/public/icon.svg` - App icon (no background)
- `frontend/public/apple-touch-icon.svg` - iOS icon (rounded)
- `frontend/public/logo-icon/xoom-icon.svg` - Orange background version
- `frontend/public/logo-icon/xoom-icon-2.svg` - Black background version
- `frontend/public/logo-icon/xoom-rides-logo-2.svg` - Text only version

### **Theme Color:**
- Updated from `#FCC82B` to `#ffb33f` (XOOM orange)

---

## ✅ Verification Checklist

After deployment, verify:

- [ ] Browser tab shows XOOM favicon
- [ ] Hard refresh clears old favicon
- [ ] PWA installation shows orange XOOM icon
- [ ] iOS home screen shows rounded XOOM icon
- [ ] Android home screen shows XOOM icon
- [ ] Theme color is XOOM orange (#ffb33f)
- [ ] All services running (`docker-compose ps`)
- [ ] No console errors in browser

---

## 🎨 Logo Files Reference

### **Browser Favicon:**
- **File:** `/favicon.svg`
- **Size:** Scales automatically (16x16, 32x32, etc.)
- **Content:** XOOM text logo

### **PWA App Icon:**
- **File:** `/logo-icon/xoom-icon.svg`
- **Size:** Scales to any size
- **Content:** Orange background + black XOOM text

### **iOS Home Screen:**
- **File:** `/apple-touch-icon.svg`
- **Size:** Scales to 180x180
- **Content:** Rounded orange square + XOOM text

---

## 📞 Support

If you encounter any issues:

1. Check `docker-compose logs frontend`
2. Verify Git pull was successful
3. Ensure all SVG files are present in `frontend/public/`
4. Try rebuilding without cache: `docker-compose build --no-cache frontend`

---

## 🎉 Success!

Once deployed, your XOOM branding will be live across:
- ✅ Browser tabs (favicon)
- ✅ PWA installations (app icon)
- ✅ iOS home screen (apple-touch-icon)
- ✅ Android home screen (manifest icons)
- ✅ Desktop PWA (all platforms)

**Your XOOM brand is now fully integrated!** 🚀

---

*Last Updated: January 1, 2026*
*XOOM Rides - Your Ride, Your Way*

