require('dotenv').config();
const app = require('./app');
const { connectDB } = require('./config/database');
const { createTables } = require('./config/db-init');
const { checkDatabaseStatus } = require('./utils/db-checker');
const logger = require('./config/logger');

const PORT = process.env.PORT || 5000;

// Connect to database and initialize tables
const initializeApp = async () => {
  try {
    await connectDB();
    
    try {
      await createTables();
    } catch (tableError) {
      logger.error(`Table initialization error: ${tableError.message}`);
      logger.info('Continuing application startup despite table initialization error');
    }
    
    // Start server
    const server = app.listen(PORT, () => {
      logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err) => {
      logger.error(`Error: ${err.message}`);
      // Close server & exit process
      server.close(() => process.exit(1));
    });
    
    return server;
  } catch (error) {
    logger.error(`Server initialization error: ${error.message}`);
    process.exit(1);
  }
};

// Initialize the application
const server = initializeApp();

module.exports = server;
