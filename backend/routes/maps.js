const express = require('express');
const router = express.Router();
const mapService = require('../services/MapService');
const { authMiddleware } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

// Rate limiter for public map APIs (by IP, not user)
// This prevents abuse while keeping maps accessible to non-authenticated users
const mapLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 minutes per IP
  message: 'Too many map requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  // Skip validation since we're behind a trusted Nginx proxy
  validate: false,
});

// Apply rate limiting to all map routes
router.use(mapLimiter);

/**
 * Geocode: Convert address to coordinates
 * POST /api/maps/geocode
 * Body: { address: string, provider?: string }
 * PUBLIC - No authentication required (uses OpenStreetMap)
 */
router.post('/geocode', async (req, res) => {
  try {
    const { address, provider } = req.body;

    if (!address) {
      return res.status(400).json({ error: 'Address is required' });
    }

    const result = await mapService.geocode(address, provider);
    res.json(result);
  } catch (error) {
    console.error('Geocode error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Reverse Geocode: Convert coordinates to address
 * POST /api/maps/reverse-geocode
 * Body: { lat: number, lng: number, provider?: string }
 * PUBLIC - No authentication required
 */
router.post('/reverse-geocode', async (req, res) => {
  try {
    const { lat, lng, provider } = req.body;

    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const result = await mapService.reverseGeocode(lat, lng, provider);
    res.json(result);
  } catch (error) {
    console.error('Reverse geocode error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Autocomplete: Get address suggestions
 * GET /api/maps/autocomplete
 * Query: { query: string, lat?: number, lng?: number, limit?: number, provider?: string }
 * PUBLIC - No authentication required
 */
router.get('/autocomplete', async (req, res) => {
  try {
    const { query, lat, lng, limit, provider } = req.query;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    const options = {
      limit: parseInt(limit) || 5,
    };

    if (lat && lng) {
      options.lat = parseFloat(lat);
      options.lng = parseFloat(lng);
    }

    const results = await mapService.autocomplete(query, options, provider);
    res.json(results);
  } catch (error) {
    console.error('Autocomplete error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get Route: Calculate route between waypoints
 * POST /api/maps/route
 * Body: { waypoints: [{lat, lng}], provider?: string }
 * PUBLIC - No authentication required
 */
router.post('/route', async (req, res) => {
  try {
    const { waypoints, provider } = req.body;

    if (!waypoints || !Array.isArray(waypoints) || waypoints.length < 2) {
      return res.status(400).json({ error: 'At least 2 waypoints are required' });
    }

    const result = await mapService.getRoute(waypoints, provider);
    res.json(result);
  } catch (error) {
    console.error('Route error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Distance Matrix: Calculate distances between multiple points
 * POST /api/maps/distance-matrix
 * Body: { origins: [{lat, lng}], destinations: [{lat, lng}], provider?: string }
 * PUBLIC - No authentication required
 */
router.post('/distance-matrix', async (req, res) => {
  try {
    const { origins, destinations, provider } = req.body;

    if (!origins || !destinations || !Array.isArray(origins) || !Array.isArray(destinations)) {
      return res.status(400).json({ error: 'Origins and destinations arrays are required' });
    }

    const result = await mapService.getDistanceMatrix(origins, destinations, provider);
    res.json(result);
  } catch (error) {
    console.error('Distance matrix error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get Provider Info: Get information about all available providers
 * GET /api/maps/providers
 * PROTECTED - Requires authentication (analytics/monitoring)
 */
router.get('/providers', authMiddleware, async (req, res) => {
  try {
    const providers = mapService.getProvidersInfo();
    res.json(providers);
  } catch (error) {
    console.error('Get providers error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Check Provider Health: Check health of all providers
 * GET /api/maps/providers/health
 * PROTECTED - Requires authentication (analytics/monitoring)
 */
router.get('/providers/health', authMiddleware, async (req, res) => {
  try {
    const health = await mapService.checkProvidersHealth();
    res.json(health);
  } catch (error) {
    console.error('Provider health check error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
