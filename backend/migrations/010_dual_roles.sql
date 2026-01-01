-- Migration: Add dual role support for users
-- Date: 2026-01-01
-- Purpose: Allow users to have both rider AND driver roles

-- Add secondary_role column (nullable - user may only have primary role)
ALTER TABLE users ADD COLUMN IF NOT EXISTS secondary_role VARCHAR(20);

-- Add is_driver_verified flag (separate verification for driver functionality)
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_driver_verified BOOLEAN DEFAULT false;

-- Add active_role column to track which role user is currently using
ALTER TABLE users ADD COLUMN IF NOT EXISTS active_role VARCHAR(20);

-- Set active_role to primary role for existing users
UPDATE users SET active_role = role WHERE active_role IS NULL;

-- Add constraint to ensure valid roles
ALTER TABLE users ADD CONSTRAINT check_secondary_role 
  CHECK (secondary_role IS NULL OR secondary_role IN ('rider', 'driver', 'admin'));

-- Add constraint to ensure active_role matches one of user's roles
-- (removed - too complex for now, will validate in application layer)

-- Comments for documentation
COMMENT ON COLUMN users.secondary_role IS 'Optional secondary role (e.g., user is both rider and driver)';
COMMENT ON COLUMN users.is_driver_verified IS 'Whether user is verified as a driver (separate from general verification)';
COMMENT ON COLUMN users.active_role IS 'Currently active role for the user session';

-- Create index for role queries
CREATE INDEX IF NOT EXISTS idx_users_roles ON users(role, secondary_role);

