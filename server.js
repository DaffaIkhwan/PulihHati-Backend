require('dotenv').config();
const app = require('./app');
const logger = require('./config/logger');
const { query, closePool, checkHealth } = require('./config/db');

// Tambahkan health check endpoint
app.get('/health', async (req, res) => {
  try {
    const dbHealth = await checkHealth();
    res.status(dbHealth.status === 'healthy' ? 200 : 500).json({
      status: 'ok',
      database: dbHealth,
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message,
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    });
  }
});

// Start server
const startServer = async () => {
  try {
    // Test database connection
    await query('SELECT NOW()');
    logger.info('Database connection successful');
    
    // Start server
    const PORT = process.env.PORT || 5000;
    const server = app.listen(PORT, () => {
      logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    });
    
    // Handle server errors
    server.on('error', (error) => {
      logger.error(`Server error: ${error.message}`);
      if (error.code === 'EADDRINUSE') {
        logger.error(`Port ${PORT} is already in use`);
        process.exit(1);
      }
    });
    
    // Unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error(`Unhandled Promise Rejection: ${reason}`);
      // Don't exit the process, just log the error
    });
    
    return server;
  } catch (error) {
    logger.error(`Server startup error: ${error.message}`);
    logger.error(`Stack trace: ${error.stack}`);
    
    // Wait before exiting to allow logs to be written
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  }
};

// Start the server
const server = startServer();

// Handle graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Application shutting down...');
  try {
    await closePool();
    if (server) {
      server.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });
      
      // Force close after 5 seconds
      setTimeout(() => {
        logger.info('Forcing shutdown after timeout');
        process.exit(0);
      }, 5000);
    } else {
      process.exit(0);
    }
  } catch (error) {
    logger.error(`Error during shutdown: ${error.message}`);
    process.exit(1);
  }
});

process.on('SIGTERM', async () => {
  logger.info('Application terminated...');
  try {
    await closePool();
    if (server) {
      server.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });
      
      // Force close after 5 seconds
      setTimeout(() => {
        logger.info('Forcing shutdown after timeout');
        process.exit(0);
      }, 5000);
    } else {
      process.exit(0);
    }
  } catch (error) {
    logger.error(`Error during termination: ${error.message}`);
    process.exit(1);
  }
});
