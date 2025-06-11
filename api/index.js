// Simplified Vercel serverless function entry point
module.exports = (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Simple API info response
  res.status(200).json({
    message: 'PulihHati Backend API - Simplified Vercel Version',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    note: 'This is a simplified version for Vercel deployment testing',
    availableEndpoints: {
      health: '/api/health',
      test: '/api/test',
      main: '/api'
    }
  });
};
