-- XOOM Database Initialization Script
-- Run this script as PostgreSQL superuser to create the database and user

-- Create database user if not exists
DO
$$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_user WHERE usename = 'xoom_user') THEN
    CREATE USER xoom_user WITH PASSWORD 'xoom_password';
  END IF;
END
$$;

-- Create database if not exists
SELECT 'CREATE DATABASE xoom OWNER xoom_user'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'xoom')\gexec

-- Grant all privileges
GRANT ALL PRIVILEGES ON DATABASE xoom TO xoom_user;

-- Connect to xoom database and grant schema privileges
\c xoom

-- Grant schema privileges to user
GRANT ALL ON SCHEMA public TO xoom_user;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO xoom_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO xoom_user;

-- Success message
SELECT 'Database initialization completed successfully!' AS status;
