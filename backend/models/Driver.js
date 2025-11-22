const pool = require('../config/database');

class Driver {
  static async updateLocation(driverId, lat, lng, isOnline = true) {
    const result = await pool.query(
      `INSERT INTO driver_locations (driver_id, lat, lng, is_online, last_seen)
      VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (driver_id)
      DO UPDATE SET lat = $2, lng = $3, is_online = $4, last_seen = NOW()
      RETURNING *`,
      [driverId, lat, lng, isOnline]
    );
    return result.rows[0];
  }

  static async getNearbyDrivers(lat, lng, radiusKm = 5) {
    // Simple distance calculation using Haversine formula
    const result = await pool.query(
      `SELECT dl.*, u.name, u.phone, u.is_verified
      FROM driver_locations dl
      JOIN users u ON dl.driver_id = u.id
      WHERE dl.is_online = true
        AND u.is_blocked = false
        AND u.is_verified = true
        AND u.monthly_fee_paid = true
        AND (
          6371 * acos(
            cos(radians($1)) * cos(radians(dl.lat)) *
            cos(radians(dl.lng) - radians($2)) +
            sin(radians($1)) * sin(radians(dl.lat))
          )
        ) <= $3
      ORDER BY (
        6371 * acos(
          cos(radians($1)) * cos(radians(dl.lat)) *
          cos(radians(dl.lng) - radians($2)) +
          sin(radians($1)) * sin(radians(dl.lat))
        )
      ) ASC
      LIMIT 10`,
      [lat, lng, radiusKm]
    );
    return result.rows;
  }

  static async setOnlineStatus(driverId, isOnline) {
    const result = await pool.query(
      `UPDATE driver_locations
      SET is_online = $1, last_seen = NOW()
      WHERE driver_id = $2
      RETURNING *`,
      [isOnline, driverId]
    );
    return result.rows[0];
  }

  static async uploadDocuments(driverId, documents) {
    const {
      cnic_front,
      cnic_back,
      license_front,
      license_back,
      vehicle_number,
      vehicle_type
    } = documents;

    const result = await pool.query(
      `INSERT INTO driver_documents (
        driver_id, cnic_front, cnic_back, license_front, license_back,
        vehicle_number, vehicle_type
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (driver_id)
      DO UPDATE SET
        cnic_front = $2, cnic_back = $3, license_front = $4,
        license_back = $5, vehicle_number = $6, vehicle_type = $7,
        status = 'pending', updated_at = NOW()
      RETURNING *`,
      [driverId, cnic_front, cnic_back, license_front, license_back, vehicle_number, vehicle_type]
    );
    return result.rows[0];
  }

  static async verifyDocuments(driverId, status, rejectionReason = null) {
    const result = await pool.query(
      `UPDATE driver_documents
      SET status = $1, rejection_reason = $2, updated_at = NOW()
      WHERE driver_id = $3
      RETURNING *`,
      [status, rejectionReason, driverId]
    );
    return result.rows[0];
  }

  static async getDocuments(driverId) {
    const result = await pool.query(
      'SELECT * FROM driver_documents WHERE driver_id = $1',
      [driverId]
    );
    return result.rows[0];
  }

  static async updatePoints(driverId, points, month, year) {
    const result = await pool.query(
      `INSERT INTO driver_points (driver_id, points, month, year)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (driver_id, month, year)
      DO UPDATE SET points = driver_points.points + $2
      RETURNING *`,
      [driverId, points, month, year]
    );
    return result.rows[0];
  }

  static async addWarning(driverId, message, warningType, severity = 'medium') {
    const result = await pool.query(
      `INSERT INTO driver_warnings (driver_id, message, warning_type, severity)
      VALUES ($1, $2, $3, $4)
      RETURNING *`,
      [driverId, message, warningType, severity]
    );
    return result.rows[0];
  }

  static async getWarnings(driverId) {
    const result = await pool.query(
      'SELECT * FROM driver_warnings WHERE driver_id = $1 ORDER BY created_at DESC LIMIT 10',
      [driverId]
    );
    return result.rows;
  }
}

module.exports = Driver;
