-- Add guest support for rides
ALTER TABLE rides
  ADD COLUMN IF NOT EXISTS guest_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS guest_contact VARCHAR(50);

-- Add index for guest rides
CREATE INDEX IF NOT EXISTS idx_rides_guest 
  ON rides(guest_name, guest_contact) 
  WHERE rider_id IS NULL;

-- Add comment
COMMENT ON COLUMN rides.guest_name IS 'Guest rider name (when rider_id is null)';
COMMENT ON COLUMN rides.guest_contact IS 'Guest rider contact number (when rider_id is null)';

