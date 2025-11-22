const express = require('express');
const { body } = require('express-validator');
const { validate } = require('../middleware/validation');
const { authMiddleware } = require('../middleware/auth');
const pushNotificationService = require('../services/pushNotification');

const router = express.Router();

// Save FCM token
router.post(
  '/token',
  authMiddleware,
  [
    body('token').notEmpty(),
    body('device_type').optional().isIn(['web', 'android', 'ios']),
    validate
  ],
  async (req, res) => {
    try {
      const { token, device_type } = req.body;
      const userId = req.user.id;

      const success = await pushNotificationService.saveToken(userId, token, device_type || 'web');

      if (success) {
        res.json({ message: 'Token saved successfully' });
      } else {
        res.status(500).json({ error: 'Failed to save token' });
      }
    } catch (error) {
      console.error('Save token error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// Remove FCM token
router.delete(
  '/token',
  authMiddleware,
  [
    body('token').notEmpty(),
    validate
  ],
  async (req, res) => {
    try {
      const { token } = req.body;
      const userId = req.user.id;

      await pushNotificationService.removeToken(userId, token);
      res.json({ message: 'Token removed successfully' });
    } catch (error) {
      console.error('Remove token error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

module.exports = router;
