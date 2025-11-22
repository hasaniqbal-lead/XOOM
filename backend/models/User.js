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
}

module.exports = User;
