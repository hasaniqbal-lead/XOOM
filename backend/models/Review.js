const pool = require('../config/database');

class Review {
  static async create(rideId, reviewerId, revieweeId, rating, reviewText) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Insert review
      const reviewResult = await client.query(
        `INSERT INTO reviews (ride_id, reviewer_id, reviewee_id, rating, review_text)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *`,
        [rideId, reviewerId, revieweeId, rating, reviewText]
      );

      // Update user's average rating
      const avgResult = await client.query(
        `SELECT AVG(rating)::DECIMAL(3,2) as avg_rating, COUNT(*) as total
        FROM reviews
        WHERE reviewee_id = $1`,
        [revieweeId]
      );

      await client.query(
        `UPDATE users
        SET average_rating = $1, total_ratings = $2
        WHERE id = $3`,
        [avgResult.rows[0].avg_rating, avgResult.rows[0].total, revieweeId]
      );

      await client.query('COMMIT');
      return reviewResult.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async getByUserId(userId, limit = 20) {
    const result = await pool.query(
      `SELECT r.*, u.name as reviewer_name, u.role as reviewer_role
      FROM reviews r
      JOIN users u ON r.reviewer_id = u.id
      WHERE r.reviewee_id = $1
      ORDER BY r.created_at DESC
      LIMIT $2`,
      [userId, limit]
    );
    return result.rows;
  }

  static async getUserStats(userId) {
    const result = await pool.query(
      `SELECT
        average_rating,
        total_ratings,
        (SELECT COUNT(*) FROM reviews WHERE reviewee_id = $1 AND rating = 5) as five_star,
        (SELECT COUNT(*) FROM reviews WHERE reviewee_id = $1 AND rating = 4) as four_star,
        (SELECT COUNT(*) FROM reviews WHERE reviewee_id = $1 AND rating = 3) as three_star,
        (SELECT COUNT(*) FROM reviews WHERE reviewee_id = $1 AND rating = 2) as two_star,
        (SELECT COUNT(*) FROM reviews WHERE reviewee_id = $1 AND rating = 1) as one_star
      FROM users
      WHERE id = $1`,
      [userId]
    );
    return result.rows[0];
  }
}

module.exports = Review;
