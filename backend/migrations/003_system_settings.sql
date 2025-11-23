-- System Settings Table for Admin Configuration
-- Including Map Provider Management

CREATE TABLE IF NOT EXISTS system_settings (
  key VARCHAR(100) PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMP DEFAULT NOW(),
  updated_by INT REFERENCES users(id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(key);

-- Insert default settings
INSERT INTO system_settings (key, value, description) VALUES
('map_provider', '"nominatim"', 'Primary map provider (nominatim, mapbox, google)'),
('map_fallback_enabled', 'true', 'Enable automatic fallback to other providers'),
('app_name', '"XOOM"', 'Application name'),
('app_version', '"1.0.0"', 'Application version'),
('maintenance_mode', 'false', 'Enable maintenance mode'),
('registration_enabled', 'true', 'Allow new user registrations'),
('driver_verification_required', 'true', 'Require admin verification for drivers')
ON CONFLICT (key) DO NOTHING;

-- Add API key settings (values will be set by admin)
INSERT INTO system_settings (key, value, description) VALUES
('mapbox_api_key', '""', 'Mapbox API key for maps'),
('google_maps_api_key', '""', 'Google Maps API key')
ON CONFLICT (key) DO NOTHING;
