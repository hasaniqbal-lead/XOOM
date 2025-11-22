const express = require('express');
const pool = require('../config/database');

const router = express.Router();

// Get active announcements (public endpoint)
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, title, body, type, target_role, priority
      FROM announcements
      WHERE active = true
        AND (expires_at IS NULL OR expires_at > NOW())
      ORDER BY priority DESC, created_at DESC
      LIMIT 10`
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get announcements error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
