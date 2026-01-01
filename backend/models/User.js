const pool = require('../config/database');

class User {
  static async create({ name, phone, password_hash, role }) {
    const result = await pool.query(
      'INSERT INTO users (name, phone, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, phone, password_hash, role]
    );
    return result.rows[0];
  }

  static async findByPhone(phone) {
    const result = await pool.query('SELECT * FROM users WHERE phone = $1', [phone]);
    return result.rows[0];
  }

  static async findById(id) {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0];
  }

  static async updateVerification(userId, isVerified) {
    const result = await pool.query(
      'UPDATE users SET is_verified = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [isVerified, userId]
    );
    return result.rows[0];
  }

  static async updateBlockStatus(userId, isBlocked) {
    const result = await pool.query(
      'UPDATE users SET is_blocked = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [isBlocked, userId]
    );
    return result.rows[0];
  }

  static async getAllByRole(role) {
    const result = await pool.query(
      'SELECT id, name, phone, role, is_verified, is_blocked, created_at FROM users WHERE role = $1 ORDER BY created_at DESC',
      [role]
    );
    return result.rows;
  }

  static async updateSubscription(userId, subscriptionExpiry, monthlyFeePaid) {
    const result = await pool.query(
      'UPDATE users SET subscription_expiry = $1, monthly_fee_paid = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
      [subscriptionExpiry, monthlyFeePaid, userId]
    );
    return result.rows[0];
  }

  // Add secondary role to user (for dual rider/driver accounts)
  static async addSecondaryRole(userId, secondaryRole) {
    const result = await pool.query(
      'UPDATE users SET secondary_role = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [secondaryRole, userId]
    );
    return result.rows[0];
  }

  // Switch active role between primary and secondary
  static async switchActiveRole(userId, activeRole) {
    const result = await pool.query(
      'UPDATE users SET active_role = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [activeRole, userId]
    );
    return result.rows[0];
  }

  // Check if user has a specific role (primary or secondary)
  static async hasRole(userId, role) {
    const result = await pool.query(
      'SELECT * FROM users WHERE id = $1 AND (role = $2 OR secondary_role = $2)',
      [userId, role]
    );
    return result.rows.length > 0;
  }

  // Get user's available roles
  static async getRoles(userId) {
    const result = await pool.query(
      'SELECT role, secondary_role, active_role FROM users WHERE id = $1',
      [userId]
    );
    if (result.rows.length === 0) return null;
    
    const user = result.rows[0];
    const roles = [user.role];
    if (user.secondary_role) {
      roles.push(user.secondary_role);
    }
    return {
      roles,
      activeRole: user.active_role || user.role
    };
  }

  // Update driver verification status
  static async updateDriverVerification(userId, isDriverVerified) {
    const result = await pool.query(
      'UPDATE users SET is_driver_verified = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [isDriverVerified, userId]
    );
    return result.rows[0];
  }
}

module.exports = User;
