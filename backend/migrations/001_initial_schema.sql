-- NawaRide Database Schema

-- Users Table (Riders, Drivers, Admins)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('rider','driver','admin')),
  avatar TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  is_blocked BOOLEAN DEFAULT FALSE,
  registration_paid BOOLEAN DEFAULT FALSE,
  monthly_fee_paid BOOLEAN DEFAULT FALSE,
  subscription_expiry TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Driver Documents
CREATE TABLE IF NOT EXISTS driver_documents (
  id SERIAL PRIMARY KEY,
  driver_id INT REFERENCES users(id) ON DELETE CASCADE,
  cnic_front TEXT,
  cnic_back TEXT,
  license_front TEXT,
  license_back TEXT,
  vehicle_number TEXT,
  vehicle_type TEXT CHECK (vehicle_type IN ('bike','car','auto')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','verified','rejected')),
  rejection_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Driver Live Location
CREATE TABLE IF NOT EXISTS driver_locations (
  driver_id INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  is_online BOOLEAN DEFAULT FALSE,
  last_seen TIMESTAMP DEFAULT NOW()
);

-- Rides
CREATE TABLE IF NOT EXISTS rides (
  id SERIAL PRIMARY KEY,
  rider_id INT REFERENCES users(id),
  driver_id INT REFERENCES users(id),
  pickup_lat DOUBLE PRECISION NOT NULL,
  pickup_lng DOUBLE PRECISION NOT NULL,
  pickup_address TEXT,
  drop_lat DOUBLE PRECISION NOT NULL,
  drop_lng DOUBLE PRECISION NOT NULL,
  drop_address TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'requested' CHECK (
    status IN ('requested','assigned','accepted','arrived','on_trip','completed','cancelled')
  ),
  distance_km DOUBLE PRECISION,
  estimated_fare NUMERIC(10,2),
  final_fare NUMERIC(10,2),
  cancellation_reason TEXT,
  cancelled_by VARCHAR(20),
  rider_rating INT CHECK (rider_rating >= 1 AND rider_rating <= 5),
  driver_rating INT CHECK (driver_rating >= 1 AND driver_rating <= 5),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  cancelled_at TIMESTAMP
);

-- Fare Settings
CREATE TABLE IF NOT EXISTS fare_settings (
  id SERIAL PRIMARY KEY,
  base_fare NUMERIC(10,2) NOT NULL DEFAULT 50.00,
  per_km NUMERIC(10,2) NOT NULL DEFAULT 15.00,
  minimum_fare NUMERIC(10,2) NOT NULL DEFAULT 80.00,
  surge_multiplier DOUBLE PRECISION DEFAULT 1.0,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert default fare settings
INSERT INTO fare_settings (base_fare, per_km, minimum_fare)
VALUES (50.00, 15.00, 80.00)
ON CONFLICT DO NOTHING;

-- Rider Credits
CREATE TABLE IF NOT EXISTS rider_credits (
  id SERIAL PRIMARY KEY,
  rider_id INT REFERENCES users(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  reason TEXT,
  used BOOLEAN DEFAULT FALSE,
  ride_id INT REFERENCES rides(id),
  created_at TIMESTAMP DEFAULT NOW(),
  used_at TIMESTAMP
);

-- Driver Points
CREATE TABLE IF NOT EXISTS driver_points (
  id SERIAL PRIMARY KEY,
  driver_id INT REFERENCES users(id) ON DELETE CASCADE,
  points INT DEFAULT 0,
  month INT NOT NULL CHECK (month >= 1 AND month <= 12),
  year INT NOT NULL,
  total_rides INT DEFAULT 0,
  completed_rides INT DEFAULT 0,
  cancelled_rides INT DEFAULT 0,
  UNIQUE(driver_id, month, year)
);

-- Driver Warnings
CREATE TABLE IF NOT EXISTS driver_warnings (
  id SERIAL PRIMARY KEY,
  driver_id INT REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  warning_type VARCHAR(50),
  severity VARCHAR(20) CHECK (severity IN ('low','medium','high')),
  acknowledged BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Announcements
CREATE TABLE IF NOT EXISTS announcements (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type VARCHAR(20) CHECK (type IN ('popup','banner','inline')),
  target_role VARCHAR(20) CHECK (target_role IN ('all','rider','driver')),
  active BOOLEAN DEFAULT TRUE,
  priority INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP
);

-- Ride Limits
CREATE TABLE IF NOT EXISTS ride_limits (
  id SERIAL PRIMARY KEY,
  role VARCHAR(20) CHECK (role IN ('rider','driver')),
  daily_limit INT DEFAULT 10,
  weekly_limit INT DEFAULT 50,
  active BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert default ride limits
INSERT INTO ride_limits (role, daily_limit, weekly_limit)
VALUES ('rider', 5, 30), ('driver', 20, 100)
ON CONFLICT DO NOTHING;

-- Driver Subscription Payments
CREATE TABLE IF NOT EXISTS subscription_payments (
  id SERIAL PRIMARY KEY,
  driver_id INT REFERENCES users(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  payment_type VARCHAR(20) CHECK (payment_type IN ('registration','monthly')),
  payment_method VARCHAR(20) DEFAULT 'cash',
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','confirmed','failed')),
  confirmed_by INT REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  confirmed_at TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_rides_status ON rides(status);
CREATE INDEX IF NOT EXISTS idx_rides_rider ON rides(rider_id);
CREATE INDEX IF NOT EXISTS idx_rides_driver ON rides(driver_id);
CREATE INDEX IF NOT EXISTS idx_rides_created ON rides(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_driver_locations_online ON driver_locations(is_online);
CREATE INDEX IF NOT EXISTS idx_announcements_active ON announcements(active, created_at DESC);
