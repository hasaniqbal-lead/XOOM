-- Pakistan POI (Points of Interest) Database
CREATE TABLE IF NOT EXISTS pakistan_poi (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL, -- market, mall, hospital, landmark, etc.
  address TEXT NOT NULL,
  city VARCHAR(100) NOT NULL,
  area VARCHAR(100),
  lat DECIMAL(10, 8) NOT NULL,
  lng DECIMAL(11, 8) NOT NULL,
  verified BOOLEAN DEFAULT false,
  added_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  vote_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_poi_city ON pakistan_poi(city);
CREATE INDEX idx_poi_category ON pakistan_poi(category);
CREATE INDEX idx_poi_location ON pakistan_poi(lat, lng);
CREATE INDEX idx_poi_name_search ON pakistan_poi USING gin(to_tsvector('english', name));

-- Seed initial Karachi POI data
INSERT INTO pakistan_poi (name, category, address, city, area, lat, lng, verified) VALUES
('NEPA Chowrangi', 'landmark', 'University Road, Gulshan-e-Iqbal', 'Karachi', 'Gulshan-e-Iqbal', 24.9246, 67.0940, true),
('Saddar', 'area', 'Saddar Town', 'Karachi', 'Saddar', 24.8607, 67.0011, true),
('Clifton Beach', 'landmark', 'Clifton', 'Karachi', 'Clifton', 24.8053, 67.0263, true),
('Dolmen Mall Clifton', 'mall', 'HC-3, Block 4, Clifton', 'Karachi', 'Clifton', 24.8103, 67.0297, true),
('Jinnah International Airport', 'airport', 'Airport Road', 'Karachi', 'Airport', 24.9065, 67.1608, true),
('Empress Market', 'market', 'Saddar Town', 'Karachi', 'Saddar', 24.8615, 67.0127, true),
('Bahria Town Karachi', 'area', 'Bahria Town', 'Karachi', 'Bahria Town', 24.8975, 67.2061, true),
('DHA Phase 8', 'area', 'Defence Housing Authority', 'Karachi', 'DHA', 24.8230, 67.0742, true),
('Gulistan-e-Johar', 'area', 'Gulistan-e-Johar', 'Karachi', 'Gulistan-e-Johar', 24.9165, 67.1318, true),
('North Nazimabad', 'area', 'North Nazimabad', 'Karachi', 'North Nazimabad', 24.9304, 67.0433, true);

-- Seed Lahore POI data
INSERT INTO pakistan_poi (name, category, address, city, area, lat, lng, verified) VALUES
('MM Alam Road', 'area', 'Gulberg III', 'Lahore', 'Gulberg', 31.5111, 74.3478, true),
('Liberty Market', 'market', 'Gulberg', 'Lahore', 'Gulberg', 31.5091, 74.3447, true),
('Packages Mall', 'mall', 'Walton Road', 'Lahore', 'Walton', 31.4758, 74.2735, true),
('Emporium Mall', 'mall', 'Abdul Haque Road', 'Lahore', 'Johar Town', 31.4692, 74.2654, true),
('Allama Iqbal International Airport', 'airport', 'Airport Road', 'Lahore', 'Airport', 31.5217, 74.4036, true),
('Anarkali Bazaar', 'market', 'Anarkali', 'Lahore', 'Old City', 31.5642, 74.3143, true),
('DHA Phase 5', 'area', 'Defence Housing Authority', 'Lahore', 'DHA', 31.4717, 74.4004, true),
('Model Town', 'area', 'Model Town', 'Lahore', 'Model Town', 31.4814, 74.3149, true),
('Fortress Stadium', 'landmark', 'Fortress Stadium, Lahore Cantt', 'Lahore', 'Cantt', 31.5049, 74.3396, true);

-- Seed Islamabad POI data
INSERT INTO pakistan_poi (name, category, address, city, area, lat, lng, verified) VALUES
('Blue Area', 'area', 'Jinnah Avenue', 'Islamabad', 'Blue Area', 33.7182, 73.0649, true),
('F-6 Markaz', 'market', 'F-6', 'Islamabad', 'F-6', 33.7180, 73.0782, true),
('Centaurus Mall', 'mall', 'Jinnah Avenue', 'Islamabad', 'F-8', 33.7102, 73.0502, true),
('Islamabad International Airport', 'airport', 'Islamabad-Fateh Jang Road', 'Islamabad', 'Airport', 33.5492, 72.8256, true),
('Faisal Mosque', 'landmark', 'Shah Faisal Avenue', 'Islamabad', 'E-7', 33.7297, 73.0372, true),
('Bahria Town Islamabad', 'area', 'Bahria Town Phase 7', 'Islamabad', 'Bahria Town', 33.5271, 73.1088, true),
('G-11 Markaz', 'market', 'G-11', 'Islamabad', 'G-11', 33.6688, 73.0464, true),
('I-8 Markaz', 'market', 'I-8', 'Islamabad', 'I-8', 33.6665, 73.0759, true);

-- Table for API usage tracking
CREATE TABLE IF NOT EXISTS map_api_usage (
  id SERIAL PRIMARY KEY,
  provider VARCHAR(50) NOT NULL, -- nominatim, mapbox, google
  region VARCHAR(100), -- city or area
  endpoint VARCHAR(100) NOT NULL, -- geocode, reverse, autocomplete, route
  request_count INTEGER DEFAULT 0,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(provider, region, endpoint, date)
);

CREATE INDEX idx_api_usage_date ON map_api_usage(date);
CREATE INDEX idx_api_usage_provider ON map_api_usage(provider);
CREATE INDEX idx_api_usage_region ON map_api_usage(region);

-- Table for regional provider settings
CREATE TABLE IF NOT EXISTS map_provider_settings (
  id SERIAL PRIMARY KEY,
  region VARCHAR(100) NOT NULL UNIQUE, -- city name or 'default'
  provider_order JSONB NOT NULL, -- ["google", "mapbox", "nominatim"]
  google_monthly_limit INTEGER DEFAULT 28000, -- ~$200 credit
  mapbox_monthly_limit INTEGER DEFAULT 50000,
  auto_switch_enabled BOOLEAN DEFAULT true,
  switch_threshold_percent INTEGER DEFAULT 80,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default settings
INSERT INTO map_provider_settings (region, provider_order, auto_switch_enabled) VALUES
('default', '["nominatim", "mapbox", "google"]', true),
('Karachi', '["google", "mapbox", "nominatim"]', true),
('Lahore', '["google", "mapbox", "nominatim"]', true),
('Islamabad', '["google", "mapbox", "nominatim"]', true)
ON CONFLICT (region) DO NOTHING;
