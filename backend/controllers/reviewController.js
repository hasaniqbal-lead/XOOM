const Review = require('../models/Review');
const Ride = require('../models/Ride');

const reviewController = {
  async createReview(req, res) {
    try {
      const { ride_id, reviewee_id, rating, review_text } = req.body;
      const reviewer_id = req.user.id;

      // Verify ride exists and user is part of it
      const ride = await Ride.findById(ride_id);
      if (!ride) {
        return res.status(404).json({ error: 'Ride not found' });
      }

      if (ride.status !== 'completed') {
        return res.status(400).json({ error: 'Can only review completed rides' });
      }

      // Verify user is part of the ride
      if (ride.rider_id !== reviewer_id && ride.driver_id !== reviewer_id) {
        return res.status(403).json({ error: 'Not authorized to review this ride' });
      }

      // Verify reviewee is the other party
      const expectedReviewee = ride.rider_id === reviewer_id ? ride.driver_id : ride.rider_id;
      if (expectedReviewee !== reviewee_id) {
        return res.status(400).json({ error: 'Invalid reviewee' });
      }

      // Check if already reviewed
      const existing = await pool.query(
        'SELECT id FROM reviews WHERE ride_id = $1 AND reviewer_id = $2',
        [ride_id, reviewer_id]
      );

      if (existing.rows.length > 0) {
        return res.status(409).json({ error: 'Already reviewed this ride' });
      }

      const review = await Review.create(ride_id, reviewer_id, reviewee_id, rating, review_text);

      // Send notification to reviewee
      if (req.app.get('io')) {
        const io = req.app.get('io');
        io.to(`user_${reviewee_id}`).emit('new_review', {
          rating,
          reviewer_id,
          ride_id
        });
      }

      res.status(201).json(review);
    } catch (error) {
      console.error('Create review error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  async getUserReviews(req, res) {
    try {
      const userId = req.params.id || req.user.id;
      const reviews = await Review.getByUserId(userId);
      res.json(reviews);
    } catch (error) {
      console.error('Get reviews error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  async getUserStats(req, res) {
    try {
      const userId = req.params.id || req.user.id;
      const stats = await Review.getUserStats(userId);
      res.json(stats);
    } catch (error) {
      console.error('Get stats error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
};

module.exports = reviewController;
