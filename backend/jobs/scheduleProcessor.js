const pool = require('../config/database');
const Driver = require('../models/Driver');

class ScheduleProcessor {
  constructor(io) {
    this.io = io;
    this.isRunning = false;
  }

  start() {
    if (this.isRunning) {
      console.log('Schedule processor already running');
      return;
    }

    this.isRunning = true;
    console.log('🕐 Schedule processor started');

    // Run every minute
    this.interval = setInterval(() => {
      this.processScheduledRides();
    }, 60000);

    // Run immediately on start
    this.processScheduledRides();
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.isRunning = false;
    console.log('🕐 Schedule processor stopped');
  }

  async processScheduledRides() {
    try {
      // Find rides scheduled for now (+/- 5 mins) that are still in scheduled status
      const result = await pool.query(`
        SELECT * FROM rides
        WHERE scheduled_for IS NOT NULL
          AND scheduled_for <= NOW() + INTERVAL '5 minutes'
          AND scheduled_for >= NOW() - INTERVAL '5 minutes'
          AND status = 'scheduled'
        ORDER BY scheduled_for ASC
      `);

      const ridesReady = result.rows;

      if (ridesReady.length > 0) {
        console.log(`📅 Processing ${ridesReady.length} scheduled rides`);
      }

      for (const ride of ridesReady) {
        await this.activateScheduledRide(ride);
      }
    } catch (error) {
      console.error('Schedule processor error:', error);
    }
  }

  async activateScheduledRide(ride) {
    try {
      console.log(`⏰ Activating scheduled ride #${ride.id}`);

      // Update ride status to requested
      await pool.query(
        'UPDATE rides SET status = $1, updated_at = NOW() WHERE id = $2',
        ['requested', ride.id]
      );

      // Find nearby drivers
      const nearbyDrivers = await Driver.getNearbyDrivers(
        ride.pickup_lat,
        ride.pickup_lng,
        5
      );

      if (nearbyDrivers.length === 0) {
        console.log(`⚠ No drivers found for scheduled ride #${ride.id}`);
        
        // Notify rider
        this.io.to(`user_${ride.rider_id}`).emit('scheduled_ride_status', {
          ride_id: ride.id,
          status: 'no_drivers',
          message: 'No drivers available at this time'
        });

        return;
      }

      // Emit ride requests to nearby drivers
      nearbyDrivers.forEach(driver => {
        this.io.to(`user_${driver.driver_id}`).emit('new_ride', {
          ride: {
            id: ride.id,
            pickup_lat: ride.pickup_lat,
            pickup_lng: ride.pickup_lng,
            drop_lat: ride.drop_lat,
            drop_lng: ride.drop_lng,
            estimated_fare: ride.estimated_fare,
            distance_km: ride.distance_km,
            scheduled: true
          }
        });
      });

      // Notify rider that ride is now active
      this.io.to(`user_${ride.rider_id}`).emit('scheduled_ride_activated', {
        ride_id: ride.id,
        message: 'Your scheduled ride is now active',
        nearby_drivers_count: nearbyDrivers.length
      });

      console.log(`✅ Scheduled ride #${ride.id} activated with ${nearbyDrivers.length} nearby drivers`);
    } catch (error) {
      console.error(`Failed to activate scheduled ride #${ride.id}:`, error);
    }
  }

  // Cleanup old scheduled rides that were never activated (e.g., more than 1 hour past scheduled time)
  async cleanupStaleScheduledRides() {
    try {
      const result = await pool.query(`
        UPDATE rides
        SET status = 'cancelled',
            cancellation_reason = 'System cancelled: scheduled time passed',
            cancelled_by = 'system',
            cancelled_at = NOW()
        WHERE status = 'scheduled'
          AND scheduled_for < NOW() - INTERVAL '1 hour'
        RETURNING id
      `);

      if (result.rows.length > 0) {
        console.log(`🧹 Cleaned up ${result.rows.length} stale scheduled rides`);
        
        // Notify riders
        result.rows.forEach(row => {
          this.io.to(`user_${row.rider_id}`).emit('ride_cancelled', {
            ride_id: row.id,
            reason: 'Scheduled time passed',
            cancelled_by: 'system'
          });
        });
      }
    } catch (error) {
      console.error('Cleanup stale scheduled rides error:', error);
    }
  }
}

module.exports = ScheduleProcessor;

