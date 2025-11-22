const pool = require('../config/database');
const User = require('../models/User');
const Driver = require('../models/Driver');
const Ride = require('../models/Ride');

const adminController = {
  async getDashboard(req, res) {
    try {
      const stats = await pool.query(`
        SELECT
          (SELECT COUNT(*) FROM users WHERE role = 'rider') as total_riders,
          (SELECT COUNT(*) FROM users WHERE role = 'driver') as total_drivers,
          (SELECT COUNT(*) FROM rides WHERE created_at >= CURRENT_DATE) as rides_today,
          (SELECT COUNT(*) FROM driver_locations WHERE is_online = true) as active_drivers,
          (SELECT COALESCE(SUM(final_fare), 0) FROM rides
           WHERE status = 'completed' AND completed_at >= CURRENT_DATE) as revenue_today
      `);

      res.json(stats.rows[0]);
    } catch (error) {
      console.error('Dashboard error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  async getAllRiders(req, res) {
    try {
      const riders = await User.getAllByRole('rider');
      res.json(riders);
    } catch (error) {
      console.error('Get riders error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  async getAllDrivers(req, res) {
    try {
      const result = await pool.query(`
        SELECT u.*, dd.status as doc_status, dd.vehicle_type, dd.vehicle_number
        FROM users u
        LEFT JOIN driver_documents dd ON u.id = dd.driver_id
        WHERE u.role = 'driver'
        ORDER BY u.created_at DESC
      `);
      res.json(result.rows);
    } catch (error) {
      console.error('Get drivers error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  async verifyDriver(req, res) {
    try {
      const { id } = req.params;
      const { status, rejection_reason } = req.body;

      // Update document status
      await Driver.verifyDocuments(id, status, rejection_reason);

      // If verified, update user
      if (status === 'verified') {
        await User.updateVerification(id, true);
      }

      res.json({ message: 'Driver verification updated' });
    } catch (error) {
      console.error('Verify driver error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  async blockUser(req, res) {
    try {
      const { id } = req.params;
      await User.updateBlockStatus(id, true);
      res.json({ message: 'User blocked' });
    } catch (error) {
      console.error('Block user error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  async unblockUser(req, res) {
    try {
      const { id } = req.params;
      await User.updateBlockStatus(id, false);
      res.json({ message: 'User unblocked' });
    } catch (error) {
      console.error('Unblock user error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  async getFareSettings(req, res) {
    try {
      const result = await pool.query(
        'SELECT * FROM fare_settings WHERE active = true ORDER BY id DESC LIMIT 1'
      );
      res.json(result.rows[0] || {});
    } catch (error) {
      console.error('Get fare settings error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  async updateFareSettings(req, res) {
    try {
      const { base_fare, per_km, minimum_fare, surge_multiplier } = req.body;

      // Deactivate old settings
      await pool.query('UPDATE fare_settings SET active = false');

      // Insert new settings
      const result = await pool.query(
        `INSERT INTO fare_settings (base_fare, per_km, minimum_fare, surge_multiplier, active)
        VALUES ($1, $2, $3, $4, true)
        RETURNING *`,
        [base_fare, per_km, minimum_fare, surge_multiplier || 1.0]
      );

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Update fare settings error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  async grantCredit(req, res) {
    try {
      const { rider_id, amount, reason } = req.body;

      const result = await pool.query(
        'INSERT INTO rider_credits (rider_id, amount, reason) VALUES ($1, $2, $3) RETURNING *',
        [rider_id, amount, reason]
      );

      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Grant credit error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  async addDriverPoints(req, res) {
    try {
      const { id } = req.params;
      const { points } = req.body;
      const now = new Date();

      const result = await Driver.updatePoints(id, points, now.getMonth() + 1, now.getFullYear());
      res.json(result);
    } catch (error) {
      console.error('Add driver points error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  async addDriverWarning(req, res) {
    try {
      const { id } = req.params;
      const { message, warning_type, severity } = req.body;

      const result = await Driver.addWarning(id, message, warning_type, severity);

      // Emit warning via Socket.IO
      if (req.app.get('io')) {
        const io = req.app.get('io');
        io.to(`user_${id}`).emit('warning_received', result);
      }

      res.status(201).json(result);
    } catch (error) {
      console.error('Add driver warning error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  async createAnnouncement(req, res) {
    try {
      const { title, body, type, target_role, priority, expires_at } = req.body;

      const result = await pool.query(
        `INSERT INTO announcements (title, body, type, target_role, priority, expires_at)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *`,
        [title, body, type, target_role || 'all', priority || 0, expires_at]
      );

      // Broadcast announcement via Socket.IO
      if (req.app.get('io')) {
        const io = req.app.get('io');
        io.emit('announcement', result.rows[0]);
      }

      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Create announcement error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  async getActiveRides(req, res) {
    try {
      const rides = await Ride.getActiveRides();
      res.json(rides);
    } catch (error) {
      console.error('Get active rides error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  async updateRideLimit(req, res) {
    try {
      const { role, daily_limit, weekly_limit } = req.body;

      const result = await pool.query(
        `INSERT INTO ride_limits (role, daily_limit, weekly_limit, active)
        VALUES ($1, $2, $3, true)
        ON CONFLICT (role) DO UPDATE
        SET daily_limit = $2, weekly_limit = $3, updated_at = NOW()
        RETURNING *`,
        [role, daily_limit, weekly_limit]
      );

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Update ride limit error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
};

module.exports = adminController;
