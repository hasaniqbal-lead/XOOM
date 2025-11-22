const Ride = require('../models/Ride');
const Driver = require('../models/Driver');
const pool = require('../config/database');

const rideController = {
  async createRide(req, res) {
    try {
      const { pickup_lat, pickup_lng, pickup_address, drop_lat, drop_lng, drop_address } = req.body;
      const rider_id = req.user.id;

      // Check daily ride limit
      const dailyRides = await Ride.getDailyRideCount(rider_id);
      const limitResult = await pool.query(
        "SELECT daily_limit FROM ride_limits WHERE role = 'rider' AND active = true"
      );

      if (limitResult.rows[0] && dailyRides >= limitResult.rows[0].daily_limit) {
        return res.status(429).json({
          error: 'Daily ride limit reached',
          limit: limitResult.rows[0].daily_limit
        });
      }

      // Calculate distance (simple Haversine formula)
      const distance_km = calculateDistance(pickup_lat, pickup_lng, drop_lat, drop_lng);

      // Get fare settings and calculate estimated fare
      const fareResult = await pool.query(
        'SELECT * FROM fare_settings WHERE active = true ORDER BY id DESC LIMIT 1'
      );
      const fareSettings = fareResult.rows[0] || { base_fare: 50, per_km: 15, minimum_fare: 80 };

      let estimated_fare = fareSettings.base_fare + (distance_km * fareSettings.per_km);
      estimated_fare = Math.max(estimated_fare, fareSettings.minimum_fare);
      estimated_fare = parseFloat(estimated_fare.toFixed(2));

      // Create ride
      const ride = await Ride.create({
        rider_id,
        pickup_lat,
        pickup_lng,
        pickup_address,
        drop_lat,
        drop_lng,
        drop_address,
        distance_km,
        estimated_fare
      });

      // Find nearby drivers and notify them via Socket.IO
      const nearbyDrivers = await Driver.getNearbyDrivers(pickup_lat, pickup_lng, 5);

      // Emit to Socket.IO (will be handled by socket service)
      if (req.app.get('io')) {
        const io = req.app.get('io');
        nearbyDrivers.forEach(driver => {
          io.to(`user_${driver.driver_id}`).emit('new_ride', {
            ride: {
              id: ride.id,
              pickup_lat: ride.pickup_lat,
              pickup_lng: ride.pickup_lng,
              drop_lat: ride.drop_lat,
              drop_lng: ride.drop_lng,
              estimated_fare: ride.estimated_fare,
              distance_km: ride.distance_km
            }
          });
        });
      }

      res.status(201).json(ride);
    } catch (error) {
      console.error('Create ride error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  async acceptRide(req, res) {
    const client = await pool.connect();
    try {
      const { id } = req.params;
      const driver_id = req.user.id;

      // Verify driver is verified and paid
      const driverCheck = await pool.query(
        'SELECT is_verified, monthly_fee_paid FROM users WHERE id = $1 AND role = $2',
        [driver_id, 'driver']
      );

      if (!driverCheck.rows[0]?.is_verified || !driverCheck.rows[0]?.monthly_fee_paid) {
        return res.status(403).json({ error: 'Driver not verified or subscription expired' });
      }

      // Atomic assignment
      await client.query('BEGIN');

      const result = await client.query(
        `UPDATE rides
        SET driver_id = $1, status = 'assigned', updated_at = NOW()
        WHERE id = $2 AND status = 'requested'
        RETURNING *`,
        [driver_id, id]
      );

      if (result.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(409).json({ error: 'Ride already accepted by another driver' });
      }

      await client.query('COMMIT');
      const ride = result.rows[0];

      // Notify rider
      if (req.app.get('io')) {
        const io = req.app.get('io');
        const driverInfo = await pool.query(
          'SELECT id, name, phone FROM users WHERE id = $1',
          [driver_id]
        );

        io.to(`user_${ride.rider_id}`).emit('ride_assigned', {
          ride_id: ride.id,
          driver: driverInfo.rows[0],
          status: 'assigned'
        });
      }

      res.json(ride);
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Accept ride error:', error);
      res.status(500).json({ error: 'Server error' });
    } finally {
      client.release();
    }
  },

  async updateRideStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const user_id = req.user.id;

      // Verify ride belongs to user
      const ride = await Ride.findById(id);
      if (!ride) {
        return res.status(404).json({ error: 'Ride not found' });
      }

      if (ride.driver_id !== user_id && ride.rider_id !== user_id) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      // Update status
      const updatedRide = await Ride.updateStatus(id, status);

      // Emit update via Socket.IO
      if (req.app.get('io')) {
        const io = req.app.get('io');
        io.to(`user_${ride.rider_id}`).emit('ride_update', {
          ride_id: id,
          status,
          timestamp: new Date()
        });
        if (ride.driver_id) {
          io.to(`user_${ride.driver_id}`).emit('ride_update', {
            ride_id: id,
            status,
            timestamp: new Date()
          });
        }
      }

      res.json(updatedRide);
    } catch (error) {
      console.error('Update ride status error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  async completeRide(req, res) {
    try {
      const { id } = req.params;
      const { distance_km, fare } = req.body;
      const driver_id = req.user.id;

      const ride = await Ride.findById(id);
      if (!ride) {
        return res.status(404).json({ error: 'Ride not found' });
      }

      if (ride.driver_id !== driver_id) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      const completedRide = await Ride.complete(id, fare, distance_km);

      // Update driver points
      const now = new Date();
      await Driver.updatePoints(driver_id, 10, now.getMonth() + 1, now.getFullYear());

      // Emit completion
      if (req.app.get('io')) {
        const io = req.app.get('io');
        io.to(`user_${ride.rider_id}`).emit('ride_completed', {
          ride_id: id,
          fare,
          completed_at: completedRide.completed_at
        });
      }

      res.json(completedRide);
    } catch (error) {
      console.error('Complete ride error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  async cancelRide(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const user_id = req.user.id;
      const role = req.user.role;

      const ride = await Ride.findById(id);
      if (!ride) {
        return res.status(404).json({ error: 'Ride not found' });
      }

      if (ride.driver_id !== user_id && ride.rider_id !== user_id && role !== 'admin') {
        return res.status(403).json({ error: 'Not authorized' });
      }

      const cancelledRide = await Ride.cancel(id, role, reason);

      // Emit cancellation
      if (req.app.get('io')) {
        const io = req.app.get('io');
        io.to(`user_${ride.rider_id}`).emit('ride_cancelled', { ride_id: id, reason });
        if (ride.driver_id) {
          io.to(`user_${ride.driver_id}`).emit('ride_cancelled', { ride_id: id, reason });
        }
      }

      res.json(cancelledRide);
    } catch (error) {
      console.error('Cancel ride error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  async getRide(req, res) {
    try {
      const { id } = req.params;
      const ride = await Ride.findById(id);

      if (!ride) {
        return res.status(404).json({ error: 'Ride not found' });
      }

      res.json(ride);
    } catch (error) {
      console.error('Get ride error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  async getRideHistory(req, res) {
    try {
      const user_id = req.user.id;
      const role = req.user.role;

      const rides = await Ride.getRideHistory(user_id, role);
      res.json(rides);
    } catch (error) {
      console.error('Get ride history error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
};

// Haversine formula to calculate distance
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees) {
  return degrees * (Math.PI / 180);
}

module.exports = rideController;
