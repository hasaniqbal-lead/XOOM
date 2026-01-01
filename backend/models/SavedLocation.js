const pool = require('../config/database');

class SavedLocation {
  static async create(locationData) {
    const {
      user_id,
      label,
      address,
      lat,
      lng,
      is_default_pickup = false,
      is_default_drop = false,
      icon = 'pin'
    } = locationData;

    const result = await pool.query(
      `INSERT INTO saved_locations (
        user_id, label, address, lat, lng, is_default_pickup, is_default_drop, icon
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [user_id, label, address, lat, lng, is_default_pickup, is_default_drop, icon]
    );
    return result.rows[0];
  }

  static async findById(id) {
    const result = await pool.query(
      'SELECT * FROM saved_locations WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  static async findByUserId(userId) {
    const result = await pool.query(
      `SELECT * FROM saved_locations 
       WHERE user_id = $1 
       ORDER BY 
         CASE 
           WHEN LOWER(label) = 'home' THEN 1
           WHEN LOWER(label) = 'work' THEN 2
           ELSE 3
         END,
         created_at DESC`,
      [userId]
    );
    return result.rows;
  }

  static async update(id, userId, updates) {
    const { label, address, lat, lng, is_default_pickup, is_default_drop, icon } = updates;
    
    const result = await pool.query(
      `UPDATE saved_locations SET
        label = COALESCE($1, label),
        address = COALESCE($2, address),
        lat = COALESCE($3, lat),
        lng = COALESCE($4, lng),
        is_default_pickup = COALESCE($5, is_default_pickup),
        is_default_drop = COALESCE($6, is_default_drop),
        icon = COALESCE($7, icon),
        updated_at = NOW()
      WHERE id = $8 AND user_id = $9
      RETURNING *`,
      [label, address, lat, lng, is_default_pickup, is_default_drop, icon, id, userId]
    );
    return result.rows[0];
  }

  static async delete(id, userId) {
    const result = await pool.query(
      'DELETE FROM saved_locations WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, userId]
    );
    return result.rows[0];
  }

  static async setDefaultPickup(id, userId) {
    // First clear any existing default pickup
    await pool.query(
      'UPDATE saved_locations SET is_default_pickup = false WHERE user_id = $1',
      [userId]
    );
    // Then set the new default
    const result = await pool.query(
      'UPDATE saved_locations SET is_default_pickup = true WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, userId]
    );
    return result.rows[0];
  }

  static async setDefaultDrop(id, userId) {
    // First clear any existing default drop
    await pool.query(
      'UPDATE saved_locations SET is_default_drop = false WHERE user_id = $1',
      [userId]
    );
    // Then set the new default
    const result = await pool.query(
      'UPDATE saved_locations SET is_default_drop = true WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, userId]
    );
    return result.rows[0];
  }

  static async getDefaults(userId) {
    const result = await pool.query(
      `SELECT * FROM saved_locations 
       WHERE user_id = $1 AND (is_default_pickup = true OR is_default_drop = true)`,
      [userId]
    );
    return {
      pickup: result.rows.find(l => l.is_default_pickup) || null,
      drop: result.rows.find(l => l.is_default_drop) || null
    };
  }
}

module.exports = SavedLocation;

