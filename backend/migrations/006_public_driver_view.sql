-- Add admin settings table for configurable app settings
CREATE TABLE IF NOT EXISTS app_settings (
  id SERIAL PRIMARY KEY,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  description TEXT,
  updated_by INTEGER REFERENCES users(id),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Default settings
INSERT INTO app_settings (setting_key, setting_value, description) 
VALUES 
  ('ride_request_timeout', '120', 'Ride request timeout in seconds (visible to all)'),
  ('public_driver_view_enabled', 'true', 'Enable public driver view for non-authenticated users')
ON CONFLICT (setting_key) DO NOTHING;

-- Add request expiry and passengers to rides table
ALTER TABLE rides 
  ADD COLUMN IF NOT EXISTS request_expires_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS passengers INTEGER DEFAULT 1;

-- Update existing requested rides with expiry (2 minutes from created_at)
UPDATE rides 
SET request_expires_at = created_at + INTERVAL '120 seconds'
WHERE status = 'requested' AND request_expires_at IS NULL;

-- Index for active requests query optimization
CREATE INDEX IF NOT EXISTS idx_rides_active_requests 
  ON rides(status, request_expires_at) 
  WHERE status = 'requested';

-- Index for expired requests cleanup
CREATE INDEX IF NOT EXISTS idx_rides_expired_requests
  ON rides(request_expires_at)
  WHERE request_expires_at IS NOT NULL;

-- Function to auto-cancel expired requests
CREATE OR REPLACE FUNCTION cancel_expired_ride_requests()
RETURNS void AS $$
BEGIN
  UPDATE rides
  SET 
    status = 'cancelled',
    cancellation_reason = 'Request timeout - no driver accepted',
    cancelled_by = 'system',
    cancelled_at = NOW(),
    updated_at = NOW()
  WHERE status = 'requested'
    AND request_expires_at IS NOT NULL
    AND request_expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Create view for active public requests
CREATE OR REPLACE VIEW public_active_requests AS
SELECT 
  r.id,
  SUBSTRING(u.name, 1, 1) || '***' as rider_name_masked,
  r.pickup_lat,
  r.pickup_lng,
  r.drop_lat,
  r.drop_lng,
  -- Mask addresses to show only area/neighborhood (everything after first comma)
  CASE 
    WHEN r.pickup_address IS NOT NULL AND POSITION(',' IN r.pickup_address) > 0
    THEN SUBSTRING(r.pickup_address FROM POSITION(',' IN r.pickup_address) + 1)
    ELSE 'Pickup Area'
  END as pickup_area,
  CASE 
    WHEN r.drop_address IS NOT NULL AND POSITION(',' IN r.drop_address) > 0
    THEN SUBSTRING(r.drop_address FROM POSITION(',' IN r.drop_address) + 1)
    ELSE 'Drop Area'
  END as drop_area,
  r.distance_km,
  r.estimated_fare,
  COALESCE(dd.vehicle_type, 'car') as vehicle_type,
  r.passengers,
  r.request_expires_at,
  EXTRACT(EPOCH FROM (r.request_expires_at - NOW()))::INTEGER as seconds_remaining,
  r.created_at
FROM rides r
JOIN users u ON r.rider_id = u.id
LEFT JOIN driver_documents dd ON r.driver_id = dd.driver_id
WHERE r.status = 'requested'
  AND r.request_expires_at IS NOT NULL
  AND r.request_expires_at > NOW()
ORDER BY r.created_at DESC;

