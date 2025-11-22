#!/usr/bin/env node
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function setupDatabase() {
  log('\n🚀 XOOM Database Setup Starting...\n', 'blue');

  // Step 1: Connect to postgres database to create xoom database and user
  log('Step 1: Connecting to PostgreSQL...', 'yellow');
  const superClient = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: 'postgres',
    user: process.env.DB_SUPERUSER || 'postgres',
    password: process.env.DB_SUPERUSER_PASSWORD || 'postgres',
  });

  try {
    await superClient.connect();
    log('✓ Connected to PostgreSQL', 'green');

    // Create user if not exists
    log('\nStep 2: Creating database user...', 'yellow');
    try {
      await superClient.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT FROM pg_catalog.pg_user WHERE usename = 'xoom_user') THEN
            CREATE USER xoom_user WITH PASSWORD 'xoom_password';
          END IF;
        END
        $$;
      `);
      log('✓ User xoom_user created/verified', 'green');
    } catch (err) {
      log(`⚠ User creation: ${err.message}`, 'yellow');
    }

    // Create database if not exists
    log('\nStep 3: Creating database...', 'yellow');
    try {
      const result = await superClient.query(
        "SELECT 1 FROM pg_database WHERE datname = 'xoom'"
      );
      if (result.rows.length === 0) {
        await superClient.query('CREATE DATABASE xoom OWNER xoom_user');
        log('✓ Database xoom created', 'green');
      } else {
        log('✓ Database xoom already exists', 'green');
      }
    } catch (err) {
      log(`⚠ Database creation: ${err.message}`, 'yellow');
    }

    // Grant privileges
    try {
      await superClient.query('GRANT ALL PRIVILEGES ON DATABASE xoom TO xoom_user');
      log('✓ Privileges granted', 'green');
    } catch (err) {
      log(`⚠ Privilege grant: ${err.message}`, 'yellow');
    }

    await superClient.end();

    // Step 2: Connect to xoom database and run migrations
    log('\nStep 4: Connecting to xoom database...', 'yellow');
    const xoomClient = new Client({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: 'xoom',
      user: 'xoom_user',
      password: 'xoom_password',
    });

    await xoomClient.connect();
    log('✓ Connected to xoom database', 'green');

    // Grant schema privileges
    try {
      await xoomClient.query('GRANT ALL ON SCHEMA public TO xoom_user');
      await xoomClient.query(
        'ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO xoom_user'
      );
      await xoomClient.query(
        'ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO xoom_user'
      );
      log('✓ Schema privileges configured', 'green');
    } catch (err) {
      log(`⚠ Schema privileges: ${err.message}`, 'yellow');
    }

    // Run migrations
    log('\nStep 5: Running migrations...', 'yellow');
    const migrationsDir = path.join(__dirname, '../migrations');
    const migrationFiles = fs
      .readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql') && file !== '000_db_init.sql')
      .sort();

    for (const file of migrationFiles) {
      try {
        log(`  → Running ${file}...`, 'blue');
        const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
        await xoomClient.query(sql);
        log(`  ✓ ${file} completed`, 'green');
      } catch (err) {
        log(`  ✗ ${file} failed: ${err.message}`, 'red');
        throw err;
      }
    }

    await xoomClient.end();

    log('\n✅ Database setup completed successfully!\n', 'green');
    log('Database: xoom', 'blue');
    log('User: xoom_user', 'blue');
    log('Password: xoom_password', 'blue');
    log('\n⚠️  IMPORTANT: Change the default password in production!\n', 'yellow');

  } catch (error) {
    log('\n❌ Database setup failed:', 'red');
    log(error.message, 'red');
    log('\nTroubleshooting:', 'yellow');
    log('1. Ensure PostgreSQL is installed and running', 'reset');
    log('2. Check connection credentials in .env file', 'reset');
    log('3. Verify PostgreSQL superuser credentials', 'reset');
    log('4. Check PostgreSQL logs for errors\n', 'reset');
    process.exit(1);
  }
}

// Run setup
setupDatabase();
