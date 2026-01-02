const express = require('express');
const { body } = require('express-validator');
const { validate } = require('../middleware/validation');
const { authMiddleware, requireRole, optionalAuth } = require('../middleware/auth');
const rideController = require('../controllers/rideController');

const router = express.Router();

// Create ride (Authenticated riders or Guest users)
router.post(
  '/',
  optionalAuth,
  [
    body('pickup_lat').isFloat(),
    body('pickup_lng').isFloat(),
    body('drop_lat').isFloat(),
    body('drop_lng').isFloat(),
    body('guest_name').optional().isString(),
    body('guest_contact').optional().isString(),
    validate
  ],
  rideController.createRide
);

// Accept ride (Driver only)
router.post(
  '/:id/accept',
  authMiddleware,
  requireRole('driver'),
  rideController.acceptRide
);

// Update ride status
router.post(
  '/:id/arrived',
  authMiddleware,
  requireRole('driver'),
  (req, res, next) => {
    req.body.status = 'arrived';
    next();
  },
  rideController.updateRideStatus
);

router.post(
  '/:id/start',
  authMiddleware,
  requireRole('driver'),
  (req, res, next) => {
    req.body.status = 'on_trip';
    next();
  },
  rideController.updateRideStatus
);

// Complete ride
router.post(
  '/:id/complete',
  authMiddleware,
  requireRole('driver'),
  [
    body('distance_km').isFloat(),
    body('fare').isFloat(),
    validate
  ],
  rideController.completeRide
);

// Cancel ride
router.post(
  '/:id/cancel',
  authMiddleware,
  rideController.cancelRide
);

// Get ride details
router.get(
  '/:id',
  authMiddleware,
  rideController.getRide
);

// Get ride history
router.get(
  '/history/me',
  authMiddleware,
  rideController.getRideHistory
);

// Get active ride for current user (rider or driver)
router.get(
  '/active/me',
  authMiddleware,
  rideController.getActiveRide
);

module.exports = router;
