const fs = require('fs');
const path = require('path');
const pool = require('../config/database');

async function runMigrations() {
  try {
    console.log('Running database migrations...');

    const migrationFiles = fs.readdirSync(__dirname)
      .filter(file => file.endsWith('.sql'))
      .sort();

    for (const file of migrationFiles) {
      console.log(`Executing: ${file}`);
      const sql = fs.readFileSync(path.join(__dirname, file), 'utf8');
      await pool.query(sql);
      console.log(`✓ ${file} completed`);
    }

    console.log('All migrations completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();
