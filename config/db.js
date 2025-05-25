const { Pool } = require('pg');
const logger = require('./logger');

// Create a connection pool with SSL disabled
const pool = new Pool({
  user: process.env.PG_USER || 'postgres',
  host: process.env.PG_HOST || 'localhost',
  database: process.env.PG_DATABASE || 'pulihhati',
  password: process.env.PG_PASSWORD || 'password',
  port: process.env.PG_PORT || 5432,
  ssl: false // Disable SSL
});

// Log connection details (without password)
logger.info(`Database connection details: user=${process.env.PG_USER}, host=${process.env.PG_HOST}, database=${process.env.PG_DATABASE}, port=${process.env.PG_PORT}, ssl=false`);

// Test the database connection
pool.on('connect', () => {
  logger.info('Connected to the database successfully');
});

pool.on('error', (err) => {
  logger.error(`Unexpected error on idle client: ${err.message}`);
  // Don't exit the process, just log the error
});

// Get a client from the pool
const getClient = async () => {
  try {
    const client = await pool.connect();
    return client;
  } catch (error) {
    logger.error(`Error getting client from pool: ${error.message}`);
    throw error;
  }
};

// Export the pool and getClient function
module.exports = { pool, getClient };


