# Firebase Setup for Push Notifications

Complete guide to configure Firebase Cloud Messaging for NawaRide.

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name: `nawaride`
4. Enable Google Analytics (optional)
5. Create project

## Step 2: Add Web App

1. In Firebase Console, click the web icon (</>) to add a web app
2. Enter app nickname: `NawaRide Web`
3. Check "Also set up Firebase Hosting" (optional)
4. Register app
5. Copy the config object - you'll need this later

## Step 3: Enable Cloud Messaging

1. In Firebase Console, go to Project Settings (gear icon)
2. Navigate to "Cloud Messaging" tab
3. Under "Web configuration", click "Generate key pair"
4. Copy the VAPID key

## Step 4: Set Up Service Account (Backend)

1. In Firebase Console, go to Project Settings
2. Navigate to "Service accounts" tab
3. Click "Generate new private key"
4. Download the JSON file
5. Save it securely - DO NOT commit to Git!

### Backend Environment Setup

Add to `backend/.env`:

```env
# Option 1: Use JSON string (recommended for production)
FIREBASE_SERVICE_ACCOUNT='{"type":"service_account","project_id":"...","private_key":"...","client_email":"..."}'

# Option 2: Use file path (for local development)
# Place the downloaded JSON file as backend/firebase-service-account.json
# Update backend/services/pushNotification.js to load from file
```

## Step 5: Frontend Configuration

Update `frontend/.env`:

```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=nawaride.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=nawaride
VITE_FIREBASE_STORAGE_BUCKET=nawaride.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=1234567890
VITE_FIREBASE_APP_ID=1:1234567890:web:abc123
VITE_FIREBASE_VAPID_KEY=BK...
```

## Step 6: Test Notifications

### Frontend Test

```javascript
// In browser console
import { requestNotificationPermission } from './services/firebase';

const token = await requestNotificationPermission();
console.log('FCM Token:', token);
```

### Backend Test

```javascript
// Test push notification
const pushService = require('./services/pushNotification');

await pushService.sendToUser(userId, {
  title: 'Test Notification',
  body: 'This is a test'
});
```

## Step 7: Deploy

### Production Checklist

- [ ] Firebase project created
- [ ] Web app registered
- [ ] VAPID key generated
- [ ] Service account JSON downloaded
- [ ] Backend environment variables configured
- [ ] Frontend environment variables configured
- [ ] Service worker registered
- [ ] Test notification sent successfully

### Security Notes

1. **Never commit** `firebase-service-account.json` to Git
2. Add to `.gitignore`: `firebase-service-account.json`
3. Use environment variables for production
4. Restrict API keys in Firebase Console to your domain
5. Enable App Check for additional security

## Notification Triggers

The following events trigger push notifications:

### For Riders:
- Driver assigned to ride
- Driver arrived at pickup
- Ride started
- Ride completed
- New review received

### For Drivers:
- New ride request nearby
- Ride cancelled by rider
- New review received
- Warning from admin
- Monthly target reminder

## Customizing Notifications

Edit `backend/services/pushNotification.js` to customize:

```javascript
async sendNewRideNotification(driverId, ride) {
  return this.sendToUser(driverId, {
    title: 'سواری کی نئی درخواست / New Ride Request',
    body: `PKR ${ride.estimated_fare} - ${ride.distance_km} km`,
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    actions: [
      { action: 'accept', title: 'Accept' },
      { action: 'decline', title: 'Decline' }
    ]
  }, {
    type: 'new_ride',
    ride_id: ride.id.toString()
  });
}
```

## Troubleshooting

### Notifications not working?

1. **Check browser permissions**
   ```javascript
   console.log('Permission:', Notification.permission);
   ```

2. **Verify service worker**
   - Open DevTools → Application → Service Workers
   - Ensure `firebase-messaging-sw.js` is active

3. **Check token registration**
   - Token should be saved to database
   - Verify in `push_tokens` table

4. **Test with Firebase Console**
   - Go to Cloud Messaging in Firebase Console
   - Send test notification using FCM token

5. **Check backend logs**
   ```bash
   pm2 logs nawaride-backend | grep -i firebase
   ```

### Common Issues

**Issue**: "Permission denied"
- **Solution**: User must grant notification permission in browser

**Issue**: "Service worker not found"
- **Solution**: Ensure `firebase-messaging-sw.js` is in `/public` directory

**Issue**: "Invalid VAPID key"
- **Solution**: Regenerate VAPID key in Firebase Console

**Issue**: "Token expired"
- **Solution**: Implement token refresh logic

## Best Practices

1. **Request permission at the right time**: Don't request immediately on app load
2. **Handle permission denial gracefully**: Provide fallback (Socket.IO only)
3. **Refresh tokens periodically**: Tokens can expire
4. **Handle offline users**: Queue notifications or use alternative methods
5. **Localize notification content**: Use user's preferred language
6. **Rate limit notifications**: Don't spam users
7. **Allow users to customize**: Let them choose which notifications to receive

## Analytics

Track notification effectiveness:

```sql
-- Notification delivery rate
SELECT
  DATE(created_at) as date,
  COUNT(*) as total_notifications,
  SUM(CASE WHEN delivered = true THEN 1 ELSE 0 END) as delivered
FROM notification_logs
GROUP BY DATE(created_at);
```

## References

- [Firebase Cloud Messaging Docs](https://firebase.google.com/docs/cloud-messaging)
- [Web Push Protocol](https://web.dev/push-notifications-overview/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
