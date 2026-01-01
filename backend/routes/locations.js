const express = require('express');
const { body } = require('express-validator');
const { validate } = require('../middleware/validation');
const { authMiddleware } = require('../middleware/auth');
const locationController = require('../controllers/locationController');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Get all saved locations
router.get('/', locationController.getLocations);

// Get default locations
router.get('/defaults', locationController.getDefaults);

// Create new saved location
router.post(
  '/',
  [
    body('label').notEmpty().trim().isLength({ max: 100 }),
    body('address').notEmpty().trim(),
    body('lat').isFloat({ min: -90, max: 90 }),
    body('lng').isFloat({ min: -180, max: 180 }),
    body('icon').optional().isString(),
    validate
  ],
  locationController.createLocation
);

// Update saved location
router.put(
  '/:id',
  [
    body('label').optional().trim().isLength({ max: 100 }),
    body('address').optional().trim(),
    body('lat').optional().isFloat({ min: -90, max: 90 }),
    body('lng').optional().isFloat({ min: -180, max: 180 }),
    body('icon').optional().isString(),
    validate
  ],
  locationController.updateLocation
);

// Delete saved location
router.delete('/:id', locationController.deleteLocation);

// Set as default pickup
router.post('/:id/default-pickup', locationController.setDefaultPickup);

// Set as default drop
router.post('/:id/default-drop', locationController.setDefaultDrop);

module.exports = router;

