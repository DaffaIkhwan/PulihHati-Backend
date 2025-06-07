const { Pool } = require('pg');
const dotenv = require('dotenv');
const logger = require('./logger');

dotenv.config();

// Log database connection info (tanpa password)
logger.info(`Database connection info: user=${process.env.PG_USER}, host=${process.env.PG_HOST}, database=${process.env.PG_DATABASE}, port=${process.env.PG_PORT}`);

const pool = new Pool({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
  ssl: false // Nonaktifkan SSL
});

// Function to connect to the database
const connectDB = async () => {
  try {
    const client = await pool.connect();
    
    // Log successful connection
    logger.info(`PostgreSQL Connected: ${process.env.PG_HOST}`);
    
    // Check current user
    const userResult = await client.query('SELECT current_user, current_database()');
    const currentUser = userResult.rows[0].current_user;
    const currentDB = userResult.rows[0].current_database;
    logger.info(`Current database user: ${currentUser}`);
    logger.info(`Current database: ${currentDB}`);
    
    // Coba dapatkan semua schema yang tersedia
    try {
      const schemasResult = await client.query(`
        SELECT schema_name 
        FROM information_schema.schemata 
        WHERE schema_name NOT LIKE 'pg_%' 
        AND schema_name != 'information_schema'
      `);
      
      if (schemasResult.rows.length > 0) {
        const schemas = schemasResult.rows.map(row => row.schema_name).join(', ');
        logger.info(`Available schemas: ${schemas}`);
        
        // Coba set search_path ke schema yang tersedia
        for (const row of schemasResult.rows) {
          try {
            await client.query(`SET search_path TO "${row.schema_name}"`);
            logger.info(`Successfully set search_path to: ${row.schema_name}`);
            break; // Keluar dari loop jika berhasil
          } catch (err) {
            logger.warn(`Failed to set search_path to ${row.schema_name}: ${err.message}`);
          }
        }
      } else {
        logger.warn('No accessible schemas found');
      }
    } catch (schemaError) {
      logger.error(`Error checking schemas: ${schemaError.message}`);
    }
    
    // Periksa search_path saat ini
    try {
      const searchPathResult = await client.query('SHOW search_path');
      logger.info(`Current search_path: ${searchPathResult.rows[0].search_path}`);
    } catch (searchPathError) {
      logger.error(`Error checking search_path: ${searchPathError.message}`);
    }
    
    client.release();
    return true;
  } catch (err) {
    logger.error(`Error connecting to database: ${err.message}`);
    throw err;
  }
};

module.exports = { pool, connectDB };
