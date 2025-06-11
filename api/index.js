// Vercel serverless function entry point
try {
  const app = require('../app');

  // Export the Express app as a serverless function
  module.exports = app;
} catch (error) {
  console.error('Error loading app:', error);

  // Fallback handler
  module.exports = (req, res) => {
    res.status(500).json({
      error: 'Server initialization failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  };
}
