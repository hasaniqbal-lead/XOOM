const admin = require('firebase-admin');
const pool = require('../config/database');

// Initialize Firebase Admin (requires service account key)
// const serviceAccount = require('../firebase-service-account.json');
// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount)
// });

class PushNotificationService {
  constructor() {
    this.initialized = false;
    // Initialize Firebase Admin if credentials are available
    try {
      if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount)
        });
        this.initialized = true;
        console.log('✓ Firebase Admin initialized');
      }
    } catch (error) {
      console.log('⚠ Firebase Admin not initialized - Push notifications disabled');
    }
  }

  async saveToken(userId, token, deviceType = 'web') {
    try {
      await pool.query(
        `INSERT INTO push_tokens (user_id, token, device_type, updated_at)
        VALUES ($1, $2, $3, NOW())
        ON CONFLICT (user_id, token)
        DO UPDATE SET updated_at = NOW()`,
        [userId, token, deviceType]
      );
      return true;
    } catch (error) {
      console.error('Error saving push token:', error);
      return false;
    }
  }

  async removeToken(userId, token) {
    try {
      await pool.query(
        'DELETE FROM push_tokens WHERE user_id = $1 AND token = $2',
        [userId, token]
      );
      return true;
    } catch (error) {
      console.error('Error removing push token:', error);
      return false;
    }
  }

  async getUserTokens(userId) {
    try {
      const result = await pool.query(
        'SELECT token FROM push_tokens WHERE user_id = $1',
        [userId]
      );
      return result.rows.map(row => row.token);
    } catch (error) {
      console.error('Error getting user tokens:', error);
      return [];
    }
  }

  async sendToUser(userId, notification, data = {}) {
    if (!this.initialized) {
      console.log('Push notifications disabled');
      return false;
    }

    try {
      const tokens = await this.getUserTokens(userId);
      if (tokens.length === 0) {
        return false;
      }

      const message = {
        notification: {
          title: notification.title,
          body: notification.body,
          icon: notification.icon || '/icon-192x192.png',
          badge: notification.badge || '/badge-72x72.png',
        },
        data,
        tokens
      };

      const response = await admin.messaging().sendMulticast(message);
      console.log(`Sent ${response.successCount} notifications to user ${userId}`);

      // Remove invalid tokens
      if (response.failureCount > 0) {
        const tokensToRemove = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            tokensToRemove.push(tokens[idx]);
          }
        });

        for (const token of tokensToRemove) {
          await this.removeToken(userId, token);
        }
      }

      return true;
    } catch (error) {
      console.error('Error sending push notification:', error);
      return false;
    }
  }

  async sendNewRideNotification(driverId, ride) {
    return this.sendToUser(driverId, {
      title: 'سواری کی نئی درخواست / New Ride Request',
      body: `PKR ${ride.estimated_fare} - ${ride.distance_km} km`,
    }, {
      type: 'new_ride',
      ride_id: ride.id.toString()
    });
  }

  async sendRideAssignedNotification(riderId, driver) {
    return this.sendToUser(riderId, {
      title: 'ڈرائیور مل گیا / Driver Found',
      body: `${driver.name} آپ کے پاس آ رہا ہے / is on the way`,
    }, {
      type: 'ride_assigned',
      driver_id: driver.id.toString()
    });
  }

  async sendRideCompleteNotification(riderId, ride) {
    return this.sendToUser(riderId, {
      title: 'سفر مکمل / Ride Completed',
      body: `رقم: PKR ${ride.final_fare}`,
    }, {
      type: 'ride_completed',
      ride_id: ride.id.toString()
    });
  }

  async sendReviewNotification(userId, rating) {
    return this.sendToUser(userId, {
      title: 'نیا جائزہ / New Review',
      body: `آپ کو ${rating} ستارے ملے / You received ${rating} stars`,
    }, {
      type: 'new_review'
    });
  }
}

module.exports = new PushNotificationService();
