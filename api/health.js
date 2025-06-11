// Ultra-simple health check endpoint for Vercel
module.exports = (req, res) => {
  // Set CORS headers first
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Simple response without any complex operations
  res.status(200).json({
    status: 'ok',
    message: 'Vercel backend health check passed',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
};
