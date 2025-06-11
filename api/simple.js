// Absolute minimal test endpoint for Vercel
module.exports = (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.status(200).end('{"message":"Hello from Vercel!","status":"ok"}');
};
