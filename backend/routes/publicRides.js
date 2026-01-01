const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const rateLimit = require('express-rate-limit');

// Rate limiter for public view (more permissive than authenticated endpoints)
const publicLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute per IP
  message: 'Too many requests from this IP, please slow down',
  standardHeaders: true,
  legacyHeaders: false,
});

// Get active ride requests (sanitized for public view)
router.get('/active-requests', publicLimiter, async (req, res) => {
  try {
    // Check if public view is enabled
    const settingResult = await pool.query(
      "SELECT setting_value FROM app_settings WHERE setting_key = 'public_driver_view_enabled'"
    );
    
    const isEnabled = settingResult.rows[0]?.setting_value === 'true';
    
    if (!isEnabled) {
      return res.status(403).json({ 
        success: false,
        error: 'Public driver view is currently disabled' 
      });
    }

    // Get active requests from view (already sanitized)
    const result = await pool.query(`
      SELECT * FROM public_active_requests
      LIMIT 50
    `);

    // Get timeout setting
    const timeoutResult = await pool.query(
      "SELECT setting_value FROM app_settings WHERE setting_key = 'ride_request_timeout'"
    );
    const requestTimeout = parseInt(timeoutResult.rows[0]?.setting_value || '120');

    res.json({
      success: true,
      requests: result.rows,
      request_timeout: requestTimeout,
      count: result.rows.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Public active requests error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch ride requests' 
    });
  }
});

// Get statistics (public, no sensitive data)
router.get('/stats', publicLimiter, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'requested' AND request_expires_at > NOW()) as active_requests,
        COUNT(*) FILTER (WHERE status = 'completed' AND completed_at > NOW() - INTERVAL '24 hours') as completed_today,
        COUNT(DISTINCT driver_id) FILTER (WHERE status = 'completed' AND completed_at > NOW() - INTERVAL '24 hours') as active_drivers_today
      FROM rides
    `);

    res.json({
      success: true,
      stats: result.rows[0],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Public stats error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch statistics' 
    });
  }
});

module.exports = router;

