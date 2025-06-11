const express = require('express');
const compression = require('compression');
const cors = require('cors');
const morgan = require('morgan');
const { errorHandler } = require('./middleware/errorHandler');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const chatbotRoutes = require('./routes/chatbotRoutes');
const safeSpaceRoutes = require('./routes/safeSpaceRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const moodRoutes = require('./routes/moodRoutes');
const { closePool } = require('./config/db');

// Initialize express app
const app = express();

// Enable compression
app.use(compression());

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Serve static files for avatars and other assets
app.use('/static', express.static('public'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/safespace', safeSpaceRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/mood', moodRoutes);

// Health check routes (both /health and /api/health)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Root API endpoint
app.get('/api', (req, res) => {
  res.status(200).json({
    message: 'PulihHati Backend API',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      users: '/api/users',
      chatbot: '/api/chatbot',
      safespace: '/api/safespace',
      mood: '/api/mood',
      upload: '/api/upload',
      notifications: '/api/notifications'
    }
  });
});

// Error handling middleware
app.use(errorHandler);

// Cleanup koneksi database saat aplikasi shutdown
process.on('SIGINT', () => {
  console.log('Application shutting down, closing database connections...');
  closePool().then(() => {
    console.log('Database connections closed');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('Application terminated, closing database connections...');
  closePool().then(() => {
    console.log('Database connections closed');
    process.exit(0);
  });
});

module.exports = app;
