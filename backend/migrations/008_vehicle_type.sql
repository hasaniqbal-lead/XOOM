-- Migration: Add vehicle_type column to rides table
-- Date: 2026-01-01

-- Add vehicle_type column if not exists
ALTER TABLE rides 
ADD COLUMN IF NOT EXISTS vehicle_type VARCHAR(50) DEFAULT 'car';

-- Add index for vehicle_type for better query performance
CREATE INDEX IF NOT EXISTS idx_rides_vehicle_type ON rides(vehicle_type);

-- Comment for documentation
COMMENT ON COLUMN rides.vehicle_type IS 'Type of vehicle: car, ac-car, rickshaw, bike, chinchi';

