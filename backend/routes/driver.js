const express = require('express');
const { body } = require('express-validator');
const { validate } = require('../middleware/validation');
const { authMiddleware, requireRole } = require('../middleware/auth');
const driverController = require('../controllers/driverController');

const router = express.Router();

// Update location
router.post(
  '/location',
  authMiddleware,
  requireRole('driver'),
  [
    body('lat').isFloat(),
    body('lng').isFloat(),
    validate
  ],
  driverController.updateLocation
);

// Set online/offline status
router.post(
  '/status',
  authMiddleware,
  requireRole('driver'),
  [
    body('is_online').isBoolean(),
    validate
  ],
  driverController.setOnlineStatus
);

// Upload documents
router.post(
  '/documents',
  authMiddleware,
  requireRole('driver'),
  driverController.upload.fields([
    { name: 'cnic_front', maxCount: 1 },
    { name: 'cnic_back', maxCount: 1 },
    { name: 'license_front', maxCount: 1 },
    { name: 'license_back', maxCount: 1 }
  ]),
  driverController.uploadDocuments
);

// Get own documents
router.get(
  '/documents',
  authMiddleware,
  requireRole('driver'),
  driverController.getDocuments
);

// Get warnings
router.get(
  '/warnings',
  authMiddleware,
  requireRole('driver'),
  driverController.getWarnings
);

module.exports = router;
