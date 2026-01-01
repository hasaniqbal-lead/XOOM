const express = require('express');
const { body, query } = require('express-validator');
const { validate } = require('../middleware/validation');
const { authMiddleware, requireRole } = require('../middleware/auth');
const driverController = require('../controllers/driverController');
const Driver = require('../models/Driver');
const rateLimit = require('express-rate-limit');

const router = express.Router();

// Rate limiter for public nearby drivers endpoint
const nearbyLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute per IP
  message: 'Too many requests for nearby drivers',
  standardHeaders: true,
  legacyHeaders: false,
});

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

// Get driver stats
router.get(
  '/stats',
  authMiddleware,
  requireRole('driver'),
  async (req, res) => {
    try {
      const driverId = req.user.id;
      
      // Get total completed rides
      const totalRidesResult = await require('../config/database').query(
        'SELECT COUNT(*) as total FROM rides WHERE driver_id = $1 AND status = $2',
        [driverId, 'completed']
      );
      
      // Get today's earnings (completed rides from today)
      const earningsResult = await require('../config/database').query(
        `SELECT COALESCE(SUM(final_fare), 0) as earnings 
         FROM rides 
         WHERE driver_id = $1 
         AND status = $2 
         AND DATE(completed_at) = CURRENT_DATE`,
        [driverId, 'completed']
      );
      
      res.json({
        success: true,
        stats: {
          total_rides: parseInt(totalRidesResult.rows[0].total),
          earnings_today: parseFloat(earningsResult.rows[0].earnings)
        }
      });
    } catch (error) {
      console.error('Driver stats error:', error);
      res.status(500).json({ error: 'Failed to fetch driver stats' });
    }
  }
);

// Public endpoint: Get nearby drivers (no auth required)
router.get(
  '/nearby',
  nearbyLimiter,
  [
    query('lat').isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
    query('lng').isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
    query('radius').optional().isFloat({ min: 0.5, max: 50 }).withMessage('Radius must be between 0.5 and 50 km'),
    query('vehicle_type').optional().isString(),
    validate
  ],
  async (req, res) => {
    try {
      const { lat, lng, radius = 5, vehicle_type } = req.query;
      
      let drivers = await Driver.getNearbyDrivers(
        parseFloat(lat), 
        parseFloat(lng), 
        parseFloat(radius)
      );

      // Filter by vehicle type if provided
      if (vehicle_type) {
        drivers = drivers.filter(d => d.vehicle_type === vehicle_type);
      }
      
      // Return sanitized driver data (no personal info like phone)
      const sanitizedDrivers = drivers.map(d => ({
        id: d.driver_id,
        lat: d.lat,
        lng: d.lng,
        vehicle_type: d.vehicle_type || 'car',
        is_online: d.is_online,
        is_verified: d.is_verified,
        // Calculate distance in km
        distance_km: parseFloat((
          6371 * Math.acos(
            Math.cos(parseFloat(lat) * Math.PI / 180) * 
            Math.cos(d.lat * Math.PI / 180) *
            Math.cos((d.lng - parseFloat(lng)) * Math.PI / 180) +
            Math.sin(parseFloat(lat) * Math.PI / 180) * 
            Math.sin(d.lat * Math.PI / 180)
          )
        ).toFixed(2))
      }));

      res.json({
        success: true,
        count: sanitizedDrivers.length,
        drivers: sanitizedDrivers
      });
    } catch (error) {
      console.error('Nearby drivers error:', error);
      res.status(500).json({ error: 'Failed to fetch nearby drivers' });
    }
  }
);

module.exports = router;
