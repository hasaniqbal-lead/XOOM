const express = require('express');
const { body } = require('express-validator');
const { validate } = require('../middleware/validation');
const { authMiddleware, requireRole } = require('../middleware/auth');
const adminController = require('../controllers/adminController');
const driverController = require('../controllers/driverController');

const router = express.Router();

// All admin routes require admin role
router.use(authMiddleware);
router.use(requireRole('admin'));

// Dashboard
router.get('/dashboard', adminController.getDashboard);

// User management
router.get('/riders', adminController.getAllRiders);
router.get('/drivers', adminController.getAllDrivers);
router.post('/users/:id/block', adminController.blockUser);
router.post('/users/:id/unblock', adminController.unblockUser);

// Driver verification
router.post(
  '/drivers/:id/verify',
  [
    body('status').isIn(['verified', 'rejected']),
    validate
  ],
  adminController.verifyDriver
);

router.get('/drivers/:id/documents', driverController.getDocuments);

// Fare management
router.get('/fare', adminController.getFareSettings);
router.post(
  '/fare',
  [
    body('base_fare').isFloat({ min: 0 }),
    body('per_km').isFloat({ min: 0 }),
    body('minimum_fare').isFloat({ min: 0 }),
    validate
  ],
  adminController.updateFareSettings
);

// Credits
router.post(
  '/credits',
  [
    body('rider_id').isInt(),
    body('amount').isFloat({ min: 0 }),
    body('reason').notEmpty(),
    validate
  ],
  adminController.grantCredit
);

// Driver points
router.post(
  '/drivers/:id/points',
  [
    body('points').isInt(),
    validate
  ],
  adminController.addDriverPoints
);

// Driver warnings
router.post(
  '/drivers/:id/warnings',
  [
    body('message').notEmpty(),
    body('severity').optional().isIn(['low', 'medium', 'high']),
    validate
  ],
  adminController.addDriverWarning
);

// Announcements
router.post(
  '/announcements',
  [
    body('title').notEmpty(),
    body('body').notEmpty(),
    body('type').isIn(['popup', 'banner', 'inline']),
    validate
  ],
  adminController.createAnnouncement
);

// Rides
router.get('/rides/active', adminController.getActiveRides);

// Ride limits
router.post(
  '/settings/ridelimit',
  [
    body('role').isIn(['rider', 'driver']),
    body('daily_limit').isInt({ min: 0 }),
    validate
  ],
  adminController.updateRideLimit
);

module.exports = router;
