// Ultra-simple test endpoint for Vercel
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

  // Simple response without complex operations
  res.status(200).json({
    message: 'Vercel backend is working!',
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    version: '1.0.0'
  });
};
