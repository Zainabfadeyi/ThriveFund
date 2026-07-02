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

const seedFile = path.resolve(__dirname, '..', 'database', 'seed.sql');
const isLocal = process.env.DB_HOST === 'localhost' || process.env.DB_HOST === '127.0.0.1';

async function main() {
  const sql = fs.readFileSync(seedFile, 'utf8');
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME,
    multipleStatements: true,
    ...(isLocal ? {} : { ssl: { rejectUnauthorized: false } }),
  });

  try {
    console.log(`Seeding ${process.env.DB_NAME} from database/seed.sql ...`);
    await connection.query(sql);
    console.log('Seed complete.');
    console.log('');
    console.log('Admin UI login:');
    console.log('  Email:    admin@thrivefund.ng');
    console.log('  Password: DemoPass123!');
    console.log('  URL:      http://localhost:3000/admin');
    console.log('');
    console.log('Demo org owner login:');
    console.log('  Email:    adebayo@thrivefund.ng');
    console.log('  Password: DemoPass123!');
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
