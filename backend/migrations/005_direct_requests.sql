-- Add columns to rides table for direct requests
ALTER TABLE rides 
  ADD COLUMN IF NOT EXISTS request_type VARCHAR(20) DEFAULT 'broadcast',
  ADD COLUMN IF NOT EXISTS target_drivers INTEGER[],
  ADD COLUMN IF NOT EXISTS fallback_to_broadcast BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMP;

-- Create request_log table for analytics
CREATE TABLE IF NOT EXISTS ride_request_log (
  id SERIAL PRIMARY KEY,
  ride_id INTEGER REFERENCES rides(id) ON DELETE CASCADE,
  driver_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  request_type VARCHAR(20) CHECK (request_type IN ('direct','broadcast')),
  responded_at TIMESTAMP,
  response_type VARCHAR(20) CHECK (response_type IN ('accepted','declined','timeout')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_ride_request_log_ride_id ON ride_request_log(ride_id);
CREATE INDEX IF NOT EXISTS idx_ride_request_log_driver_id ON ride_request_log(driver_id);
CREATE INDEX IF NOT EXISTS idx_rides_scheduled_for ON rides(scheduled_for) WHERE scheduled_for IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_rides_request_type ON rides(request_type);

-- Add scheduled rides view
CREATE OR REPLACE VIEW scheduled_rides_ready AS
SELECT * FROM rides
WHERE scheduled_for IS NOT NULL
  AND scheduled_for <= NOW() + INTERVAL '5 minutes'
  AND scheduled_for >= NOW() - INTERVAL '5 minutes'
  AND status = 'scheduled';

