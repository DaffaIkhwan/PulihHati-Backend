require('dotenv').config();
const { Pool } = require('pg');

console.log('Testing database connection...');
console.log('DB Config:', {
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  port: process.env.PG_PORT
});

const pool = new Pool({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: parseInt(process.env.PG_PORT),
  ssl: false,
  connectionTimeoutMillis: 10000
});

async function testConnection() {
  try {
    console.log('Attempting to connect...');
    const client = await pool.connect();
    console.log('Connected successfully!');
    
    const result = await client.query('SELECT NOW()');
    console.log('Query result:', result.rows[0]);
    
    client.release();
    await pool.end();
    console.log('Test completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Connection failed:', error.message);
    console.error('Error code:', error.code);
    process.exit(1);
  }
}

testConnection();
