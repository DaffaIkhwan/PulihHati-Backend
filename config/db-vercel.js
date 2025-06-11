// Simplified database configuration for Vercel
const { Pool } = require('pg');

let pool = null;

// Create pool only if environment variables are available
const createPool = () => {
  if (!process.env.PG_HOST || !process.env.PG_USER || !process.env.PG_PASSWORD) {
    console.log('Database environment variables not configured');
    return null;
  }

  try {
    return new Pool({
      user: process.env.PG_USER,
      host: process.env.PG_HOST,
      database: process.env.PG_DATABASE,
      password: process.env.PG_PASSWORD,
      port: parseInt(process.env.PG_PORT) || 5432,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 1,
      min: 0,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 10000,
      allowExitOnIdle: true
    });
  } catch (error) {
    console.error('Failed to create database pool:', error.message);
    return null;
  }
};

// Initialize pool
pool = createPool();

// Simple query function with fallback
const query = async (text, params = []) => {
  if (!pool) {
    throw new Error('Database not configured');
  }

  try {
    const result = await pool.query(text, params);
    return result;
  } catch (error) {
    console.error('Database query error:', error.message);
    throw error;
  }
};

// Simple health check
const checkHealth = async () => {
  if (!pool) {
    return {
      status: 'unavailable',
      message: 'Database not configured'
    };
  }

  try {
    const result = await query('SELECT NOW()');
    return {
      status: 'healthy',
      timestamp: result.rows[0].now
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message
    };
  }
};

// Close pool
const closePool = async () => {
  if (pool) {
    try {
      await pool.end();
      console.log('Database pool closed');
    } catch (error) {
      console.error('Error closing pool:', error.message);
    }
  }
};

module.exports = { query, checkHealth, closePool };
