-- Migration: Create saved_locations table for user-defined location bookmarks
-- Date: 2026-01-01

-- Create saved_locations table
CREATE TABLE IF NOT EXISTS saved_locations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label VARCHAR(100) NOT NULL,  -- Custom label: "Home", "Work", "Mom's House", etc.
  address TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  is_default_pickup BOOLEAN DEFAULT false,
  is_default_drop BOOLEAN DEFAULT false,
  icon VARCHAR(50) DEFAULT 'pin',  -- Icon name for UI: home, work, hospital, school, etc.
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for faster user lookups
CREATE INDEX IF NOT EXISTS idx_saved_locations_user_id ON saved_locations(user_id);

-- Unique constraint to prevent duplicate labels per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_saved_locations_user_label ON saved_locations(user_id, LOWER(label));

-- Comments for documentation
COMMENT ON TABLE saved_locations IS 'User-saved locations with custom labels for quick selection';
COMMENT ON COLUMN saved_locations.label IS 'Custom name for the location (Home, Work, etc.)';
COMMENT ON COLUMN saved_locations.is_default_pickup IS 'If true, this location is pre-selected as pickup';
COMMENT ON COLUMN saved_locations.is_default_drop IS 'If true, this location is pre-selected as drop-off';
COMMENT ON COLUMN saved_locations.icon IS 'UI icon identifier for visual differentiation';

