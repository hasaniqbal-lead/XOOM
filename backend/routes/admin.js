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

// ============================================================================
// MAP PROVIDER MANAGEMENT
// ============================================================================
const pool = require('../config/database');
const mapService = require('../services/MapService');

/**
 * Get all system settings
 * GET /api/admin/settings
 */
router.get('/settings', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM system_settings ORDER BY key');
    res.json(result.rows);
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Update system setting
 * PUT /api/admin/settings/:key
 */
router.put('/settings/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    const result = await pool.query(
      `INSERT INTO system_settings (key, value, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (key)
       DO UPDATE SET value = $2, updated_at = NOW()
       RETURNING *`,
      [key, JSON.stringify(value)]
    );

    // If changing map provider, update MapService
    if (key === 'map_provider') {
      mapService.setPrimaryProvider(value);
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update setting error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get map provider configuration
 * GET /api/admin/map-providers
 */
router.get('/map-providers', async (req, res) => {
  try {
    const providers = mapService.getProvidersInfo();
    const health = await mapService.checkProvidersHealth();

    const combined = providers.map(provider => ({
      ...provider,
      health: health[provider.name],
    }));

    res.json(combined);
  } catch (error) {
    console.error('Get map providers error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Set primary map provider
 * POST /api/admin/map-providers/primary
 */
router.post('/map-providers/primary', async (req, res) => {
  try {
    const { provider } = req.body;

    if (!provider) {
      return res.status(400).json({ error: 'Provider name is required' });
    }

    const success = mapService.setPrimaryProvider(provider);

    if (success) {
      // Save to database
      await pool.query(
        `INSERT INTO system_settings (key, value, updated_at)
         VALUES ('map_provider', $1, NOW())
         ON CONFLICT (key)
         DO UPDATE SET value = $1, updated_at = NOW()`,
        [JSON.stringify(provider)]
      );

      res.json({ message: 'Primary provider updated', provider });
    } else {
      res.status(400).json({ error: 'Invalid provider name' });
    }
  } catch (error) {
    console.error('Set primary provider error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Update provider API key
 * POST /api/admin/map-providers/:name/api-key
 */
router.post('/map-providers/:name/api-key', async (req, res) => {
  try {
    const { name } = req.params;
    const { apiKey } = req.body;

    if (!apiKey) {
      return res.status(400).json({ error: 'API key is required' });
    }

    // Save to database
    const settingKey = `${name}_api_key`;
    await pool.query(
      `INSERT INTO system_settings (key, value, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (key)
       DO UPDATE SET value = $2, updated_at = NOW()`,
      [settingKey, JSON.stringify(apiKey)]
    );

    // Update provider configuration
    const config = { apiKey };
    mapService.updateProviderConfig(name, config);

    res.json({ message: 'API key updated', provider: name });
  } catch (error) {
    console.error('Update API key error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Test map provider
 * POST /api/admin/map-providers/:name/test
 */
router.post('/map-providers/:name/test', async (req, res) => {
  try {
    const { name } = req.params;

    // Try to geocode a test address
    const testAddress = 'Lahore, Pakistan';
    const result = await mapService.geocode(testAddress, name);

    res.json({
      success: true,
      provider: name,
      testAddress,
      result,
    });
  } catch (error) {
    res.json({
      success: false,
      provider: name,
      error: error.message,
    });
  }
});

module.exports = router;
