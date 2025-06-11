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

// CORS Configuration
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://localhost:3000',
  'https://localhost:5173',
  // Add your deployed frontend URLs here
  'https://pulih-hati-frontend.vercel.app',
  'https://pulih-hati-frontend.netlify.app',
  'https://pulih-hati-frontend.onrender.com',
  'https://pulih-hati-frontend.up.railway.app'
];

// Add custom frontend URL from environment variable
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Check against regex patterns for deployment platforms
    const allowedPatterns = [
      /^https:\/\/.*\.vercel\.app$/,
      /^https:\/\/.*\.netlify\.app$/,
      /^https:\/\/.*\.onrender\.com$/,
      /^https:\/\/.*\.up\.railway\.app$/,
      /^https:\/\/.*\.github\.io$/,
      /^https:\/\/.*\.surge\.sh$/
    ];

    for (const pattern of allowedPatterns) {
      if (pattern.test(origin)) {
        return callback(null, true);
      }
    }

    // Log rejected origins for debugging
    console.log(`CORS: Rejected origin: ${origin}`);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));

// Handle preflight requests explicitly
app.options('*', cors(corsOptions));

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
