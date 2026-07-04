const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '..', '.env'), override: true });

const required = ['DB_HOST', 'DB_USER', 'DB_NAME'];
for (const key of required) {
  if (!process.env[key]) {
    console.error(`Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

const migrationsDir = path.resolve(__dirname, '..', 'database', 'migrations');
const isLocal = process.env.DB_HOST === 'localhost' || process.env.DB_HOST === '127.0.0.1';
const listOnly = process.argv.includes('--list') || process.argv.includes('--status');

async function main() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME,
    multipleStatements: !listOnly,
    ...(isLocal ? {} : { ssl: { rejectUnauthorized: false } }),
  });

  try {
    console.log(`Database: ${process.env.DB_USER}@${process.env.DB_HOST}:${process.env.DB_PORT || 3306}/${process.env.DB_NAME}`);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        filename VARCHAR(255) NOT NULL,
        executed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (filename)
      )
    `);

    const [rows] = await connection.query('SELECT filename FROM schema_migrations ORDER BY filename');
    const applied = new Set(rows.map((row) => row.filename));
    const files = fs
      .readdirSync(migrationsDir)
      .filter((file) => file.endsWith('.sql'))
      .sort();

    const pending = files.filter((file) => !applied.has(file));

    if (listOnly) {
      console.log(`\nApplied (${applied.size}):`);
      for (const file of files.filter((f) => applied.has(f))) console.log(`  ✓ ${file}`);
      console.log(`\nPending (${pending.length}):`);
      for (const file of pending) console.log(`  • ${file}`);
      if (!pending.length) console.log('  (none — database is up to date)');
      return;
    }

    for (const file of files) {
      if (applied.has(file)) {
        console.log(`Skipping migration ${file}`);
        continue;
      }

      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8').trim();
      if (!sql) {
        console.log(`Skipping empty migration ${file}`);
        await connection.query('INSERT IGNORE INTO schema_migrations (filename) VALUES (?)', [file]);
        continue;
      }

      console.log(`Running migration ${file}`);
      await connection.query(sql);
      await connection.query('INSERT INTO schema_migrations (filename) VALUES (?)', [file]);
    }

    console.log('Migrations complete');
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
