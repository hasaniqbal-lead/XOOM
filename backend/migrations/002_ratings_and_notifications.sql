-- Add rating columns to rides table
ALTER TABLE rides
ADD COLUMN IF NOT EXISTS rider_rating INT CHECK (rider_rating >= 1 AND rider_rating <= 5),
ADD COLUMN IF NOT EXISTS driver_rating INT CHECK (driver_rating >= 1 AND driver_rating <= 5),
ADD COLUMN IF NOT EXISTS rider_review TEXT,
ADD COLUMN IF NOT EXISTS driver_review TEXT;

-- Create reviews table for detailed feedback
CREATE TABLE IF NOT EXISTS reviews (
  id SERIAL PRIMARY KEY,
  ride_id INT REFERENCES rides(id) ON DELETE CASCADE,
  reviewer_id INT REFERENCES users(id),
  reviewee_id INT REFERENCES users(id),
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create index for reviews
CREATE INDEX IF NOT EXISTS idx_reviews_reviewee ON reviews(reviewee_id);
CREATE INDEX IF NOT EXISTS idx_reviews_ride ON reviews(ride_id);

-- Add average rating to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS total_ratings INT DEFAULT 0;

-- Create push notification tokens table
CREATE TABLE IF NOT EXISTS push_tokens (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  device_type VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, token)
);

CREATE INDEX IF NOT EXISTS idx_push_tokens_user ON push_tokens(user_id);
