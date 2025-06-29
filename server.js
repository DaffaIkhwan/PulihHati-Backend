require('dotenv').config();
const axios = require('axios');
const app = require('./app');
const logger = require('./config/logger');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const swaggerDocument = YAML.load('./docs/swagger.yaml');

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Use simplified database for Vercel
let query, closePool, checkHealth;
try {
  if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
    const db = require('./config/db-vercel');
    query = db.query;
    closePool = db.closePool;
    checkHealth = db.checkHealth;
  } else {
    const db = require('./config/db');
    query = db.query;
    closePool = db.closePool;
    checkHealth = db.checkHealth;
  }
} catch (error) {
  console.log('Database functions not available:', error.message);
}

// Tambahkan health check endpoint
app.get('/health', async (req, res) => {
  try {
    let dbHealth = { status: 'unknown', message: 'Database check not available' };

    if (checkHealth) {
      dbHealth = await checkHealth();
    }

    res.status(200).json({
      status: 'ok',
      database: dbHealth,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
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

// Proxy ke chatbot Flask dengan session management
app.post('/api/chatbot', async (req, res) => {
  const { message, sessionId } = req.body;

  // Generate session ID jika tidak ada (untuk user yang tidak login)
  const userSessionId = sessionId || `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  try {
    const response = await axios.post(
      'https://flaskchatbotmodel-production-c729.up.railway.app/chat',
      {
        message: message,
        session_id: userSessionId,
        user_id: req.user?.id || null // Jika user login, kirim user ID
      }
    );

    res.json({
      reply: response.data.response,
      sessionId: userSessionId
    });
  } catch (error) {
    logger.error(`Gagal menghubungi chatbot Flask: ${error.message}`);

    // Fallback ke response sederhana jika Flask tidak tersedia
    const fallbackResponses = [
      "Maaf, saya sedang mengalami gangguan. Silakan coba lagi dalam beberapa saat.",
      "Terima kasih sudah menghubungi saya. Saat ini sistem sedang dalam pemeliharaan.",
      "Saya akan segera kembali untuk membantu Anda. Mohon bersabar ya!"
    ];

    const fallbackReply = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];

    res.json({
      reply: fallbackReply,
      sessionId: userSessionId,
      fallback: true
    });
  }
});

// Start server
const startServer = async () => {
  try {
    // Test database connection only if not in Vercel
    if (!process.env.VERCEL && query) {
      try {
        await query('SELECT NOW()');
        logger.info('Database connection successful');
      } catch (dbError) {
        logger.warn('Database connection failed, but continuing:', dbError.message);
      }
    }

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

// Start the server (for local development and Render)
// Skip only for Vercel serverless environment
if (!process.env.VERCEL) {
  const server = startServer();
}

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
    if (closePool) {
      await closePool();
    }
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

// Export app for Vercel
module.exports = app;
