const Ride = require('../models/Ride');
const Driver = require('../models/Driver');
const pool = require('../config/database');

const rideController = {
  async createRide(req, res) {
    try {
      const { 
        pickup_lat, pickup_lng, pickup_address, 
        drop_lat, drop_lng, drop_address,
        request_type = 'broadcast',
        target_driver_ids = [],
        scheduled_for = null,
        guest_name = null,
        guest_contact = null
      } = req.body;
      const rider_id = req.user ? req.user.id : null;
      const is_guest = !req.user;

      // Check daily ride limit (skip for guest users)
      if (!is_guest) {
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

        // Check for existing active ride (one active ride per user)
        const activeRideResult = await pool.query(
          `SELECT id FROM rides 
           WHERE rider_id = $1 
           AND status IN ('requested', 'assigned', 'accepted', 'arrived', 'on_trip')
           LIMIT 1`,
          [rider_id]
        );

        if (activeRideResult.rows.length > 0) {
          return res.status(409).json({
            error: 'You already have an active ride request',
            active_ride_id: activeRideResult.rows[0].id
          });
        }
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

      // Handle scheduled ride
      if (scheduled_for) {
        const scheduledTime = new Date(scheduled_for);
        const now = new Date();
        
        if (scheduledTime <= now) {
          return res.status(400).json({ error: 'Scheduled time must be in the future' });
        }
        
        if (scheduledTime > new Date(now.getTime() + 7*24*60*60*1000)) {
          return res.status(400).json({ error: 'Cannot schedule more than 7 days in advance' });
        }
      }

      // Get request timeout setting for expiry
      let requestExpiresAt = null;
      if (!scheduled_for) {
        const timeoutResult = await pool.query(
          "SELECT setting_value FROM app_settings WHERE setting_key = 'ride_request_timeout'"
        );
        const timeoutSeconds = parseInt(timeoutResult.rows[0]?.setting_value || '120');
        requestExpiresAt = new Date(Date.now() + timeoutSeconds * 1000);
      }

      // Create ride with request type
      const rideData = {
        rider_id,
        pickup_lat,
        pickup_lng,
        pickup_address,
        drop_lat,
        drop_lng,
        drop_address,
        distance_km,
        estimated_fare,
        request_type,
        target_drivers: target_driver_ids.length > 0 ? target_driver_ids : null,
        status: scheduled_for ? 'scheduled' : 'requested',
        scheduled_for: scheduled_for || null,
        request_expires_at: requestExpiresAt,
        passengers: req.body.passengers || 1,
        vehicle_type: req.body.vehicle_type || 'car',
        guest_name: is_guest ? guest_name : null,
        guest_contact: is_guest ? guest_contact : null
      };

      const ride = await Ride.create(rideData);

      // Emit to public driver view (sanitized)
      if (req.app.get('io') && !scheduled_for) {
        const io = req.app.get('io');
        
        const pickupArea = pickup_address ? pickup_address.split(',').slice(1).join(',').trim() || 'Pickup Area' : 'Pickup Area';
        const dropArea = drop_address ? drop_address.split(',').slice(1).join(',').trim() || 'Drop Area' : 'Drop Area';
        
        io.to('public_driver_view').emit('new_ride_public', {
          id: ride.id,
          rider_name_masked: 'R***',
          pickup_area: pickupArea,
          drop_area: dropArea,
          distance_km: ride.distance_km,
          estimated_fare: ride.estimated_fare,
          vehicle_type: req.body.vehicle_type || 'car',
          passengers: req.body.passengers || 1,
          request_expires_at: requestExpiresAt?.toISOString(),
          seconds_remaining: requestExpiresAt ? Math.floor((requestExpiresAt - new Date()) / 1000) : 120,
          created_at: ride.created_at
        });
      }

      // Don't notify drivers immediately if scheduled
      if (scheduled_for) {
        return res.status(201).json({ ...ride, message: 'Ride scheduled successfully' });
      }

      // Handle direct request
      if (request_type === 'direct' && target_driver_ids.length > 0) {
        if (req.app.get('io')) {
          const io = req.app.get('io');
          
          // Send to specific drivers
          target_driver_ids.forEach(driverId => {
            io.to(`user_${driverId}`).emit('direct_ride_request', {
              ride: {
                id: ride.id,
                pickup_lat: ride.pickup_lat,
                pickup_lng: ride.pickup_lng,
                drop_lat: ride.drop_lat,
                drop_lng: ride.drop_lng,
                estimated_fare: ride.estimated_fare,
                distance_km: ride.distance_km,
                priority: 'high',
                expires_at: Date.now() + 60000 // 60 seconds
              }
            });
          });

          // Log direct requests
          for (const driverId of target_driver_ids) {
            await pool.query(
              `INSERT INTO ride_request_log (ride_id, driver_id, request_type, created_at)
               VALUES ($1, $2, 'direct', NOW())`,
              [ride.id, driverId]
            );
          }

          // Set timeout for fallback to broadcast
          setTimeout(async () => {
            try {
              const rideCheck = await pool.query(
                'SELECT status FROM rides WHERE id = $1',
                [ride.id]
              );
              
              if (rideCheck.rows[0] && rideCheck.rows[0].status === 'requested') {
                // No one accepted, fallback to broadcast
                await pool.query(
                  'UPDATE rides SET request_type = $1, fallback_to_broadcast = true WHERE id = $2',
                  ['broadcast', ride.id]
                );
                
                const nearbyDrivers = await Driver.getNearbyDrivers(pickup_lat, pickup_lng, 5);
                nearbyDrivers.forEach(driver => {
                  if (!target_driver_ids.includes(driver.driver_id)) {
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
                  }
                });
              }
            } catch (error) {
              console.error('Fallback broadcast error:', error);
            }
          }, 60000); // 60 seconds
        }
      } else {
        // Broadcast to all nearby drivers
        const nearbyDrivers = await Driver.getNearbyDrivers(pickup_lat, pickup_lng, 5);

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

      // Check if driver already has an active ride
      const activeRideCheck = await pool.query(
        `SELECT id FROM rides 
         WHERE driver_id = $1 
         AND status IN ('assigned', 'accepted', 'arrived', 'on_trip')
         LIMIT 1`,
        [driver_id]
      );

      if (activeRideCheck.rows.length > 0) {
        return res.status(409).json({
          error: 'You already have an active ride. Complete it before accepting another.',
          active_ride_id: activeRideCheck.rows[0].id
        });
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
  },

  // Get active ride for current user (rider or driver)
  async getActiveRide(req, res) {
    try {
      const userId = req.user.id;
      const role = req.user.role;

      let query;
      if (role === 'driver') {
        // Driver: get ride they've accepted
        query = `
          SELECT * FROM rides 
          WHERE driver_id = $1 
          AND status IN ('accepted', 'arrived', 'on_trip')
          ORDER BY updated_at DESC 
          LIMIT 1
        `;
      } else {
        // Rider: get their active request
        query = `
          SELECT * FROM rides 
          WHERE rider_id = $1 
          AND status IN ('requested', 'assigned', 'accepted', 'arrived', 'on_trip')
          ORDER BY created_at DESC 
          LIMIT 1
        `;
      }

      const result = await pool.query(query, [userId]);
      
      if (result.rows.length === 0) {
        return res.json({ active_ride: null });
      }

      res.json({ active_ride: result.rows[0] });
    } catch (error) {
      console.error('Get active ride error:', error);
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
