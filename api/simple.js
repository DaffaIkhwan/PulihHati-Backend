// Absolute minimal test endpoint for Vercel
module.exports = (req, res) => {
  res.status(200).json({ message: 'Hello from Vercel!' });
};
