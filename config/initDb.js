const { pool } = require('./db');
const logger = require('./logger');
const bcrypt = require('bcryptjs');

const initDb = async () => {
  try {
    logger.info('Checking database connection...');
    
    // Hanya periksa koneksi database tanpa membuat tabel
    await pool.query('SELECT NOW()');
    
    logger.info('Database connection successful');
    return true;
  } catch (error) {
    logger.error(`Database connection error: ${error.message}`);
    logger.error(`Stack trace: ${error.stack}`);
    return false;
  }
};

module.exports = initDb;
