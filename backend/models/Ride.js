const pool = require('../config/database');

class Ride {
  static async create(rideData) {
    const {
      rider_id,
      pickup_lat,
      pickup_lng,
      pickup_address,
      drop_lat,
      drop_lng,
      drop_address,
      distance_km,
      estimated_fare,
      request_type = 'broadcast',
      target_drivers = null,
      scheduled_for = null,
      status = 'requested'
    } = rideData;

    const result = await pool.query(
      `INSERT INTO rides (
        rider_id, pickup_lat, pickup_lng, pickup_address,
        drop_lat, drop_lng, drop_address, distance_km, estimated_fare, 
        status, request_type, target_drivers, scheduled_for
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [rider_id, pickup_lat, pickup_lng, pickup_address, drop_lat, drop_lng, drop_address, 
       distance_km, estimated_fare, status, request_type, target_drivers, scheduled_for]
    );
    return result.rows[0];
  }

  static async findById(id) {
    const result = await pool.query('SELECT * FROM rides WHERE id = $1', [id]);
    return result.rows[0];
  }

  static async updateStatus(rideId, status) {
    const result = await pool.query(
      'UPDATE rides SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [status, rideId]
    );
    return result.rows[0];
  }

  static async assignDriver(rideId, driverId) {
    const result = await pool.query(
      'UPDATE rides SET driver_id = $1, status = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
      [driverId, 'assigned', rideId]
    );
    return result.rows[0];
  }

  static async complete(rideId, finalFare, distance_km) {
    const result = await pool.query(
      `UPDATE rides SET
        status = 'completed',
        final_fare = $1,
        distance_km = $2,
        completed_at = NOW(),
        updated_at = NOW()
      WHERE id = $3 RETURNING *`,
      [finalFare, distance_km, rideId]
    );
    return result.rows[0];
  }

  static async cancel(rideId, cancelledBy, reason) {
    const result = await pool.query(
      `UPDATE rides SET
        status = 'cancelled',
        cancelled_by = $1,
        cancellation_reason = $2,
        cancelled_at = NOW(),
        updated_at = NOW()
      WHERE id = $3 RETURNING *`,
      [cancelledBy, reason, rideId]
    );
    return result.rows[0];
  }

  static async getActiveRides() {
    const result = await pool.query(
      `SELECT r.*,
        u1.name as rider_name, u1.phone as rider_phone,
        u2.name as driver_name, u2.phone as driver_phone
      FROM rides r
      LEFT JOIN users u1 ON r.rider_id = u1.id
      LEFT JOIN users u2 ON r.driver_id = u2.id
      WHERE r.status IN ('requested', 'assigned', 'accepted', 'arrived', 'on_trip')
      ORDER BY r.created_at DESC`
    );
    return result.rows;
  }

  static async getRideHistory(userId, role) {
    const column = role === 'rider' ? 'rider_id' : 'driver_id';
    const result = await pool.query(
      `SELECT r.*,
        u1.name as rider_name,
        u2.name as driver_name
      FROM rides r
      LEFT JOIN users u1 ON r.rider_id = u1.id
      LEFT JOIN users u2 ON r.driver_id = u2.id
      WHERE r.${column} = $1
      ORDER BY r.created_at DESC
      LIMIT 50`,
      [userId]
    );
    return result.rows;
  }

  static async getDailyRideCount(userId) {
    const result = await pool.query(
      `SELECT COUNT(*) as count FROM rides
      WHERE rider_id = $1 AND created_at >= CURRENT_DATE`,
      [userId]
    );
    return parseInt(result.rows[0].count);
  }
}

module.exports = Ride;
