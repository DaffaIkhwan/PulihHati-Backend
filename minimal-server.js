const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Test endpoint
app.get('/test', (req, res) => {
  console.log('Test endpoint hit');
  res.json({ message: 'Backend is working!', timestamp: new Date().toISOString() });
});

// SafeSpace public posts endpoint
app.get('/api/safespace/posts/public', (req, res) => {
  console.log('Public posts endpoint hit');
  
  const mockPosts = [
    {
      _id: 'post-1',
      id: 'post-1',
      content: 'Selamat datang di SafeSpace! Ini adalah mode read-only. Anda bisa melihat posts tanpa perlu login.',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      author: {
        _id: 'user-1',
        id: 'user-1',
        name: 'Demo User',
        avatar: null
      },
      likes: [],
      comments: [],
      likes_count: 5,
      comments_count: 2,
      bookmarked: false,
      liked: false
    },
    {
      _id: 'post-2',
      id: 'post-2',
      content: 'Untuk berinteraksi dengan posts (like, comment, create post), silakan login terlebih dahulu. Mode read-only memungkinkan Anda menjelajahi konten tanpa autentikasi.',
      created_at: new Date(Date.now() - 3600000).toISOString(),
      updated_at: new Date(Date.now() - 3600000).toISOString(),
      author: {
        _id: 'anonymous',
        id: 'anonymous',
        name: 'Anonymous',
        avatar: null
      },
      likes: [],
      comments: [],
      likes_count: 12,
      comments_count: 8,
      bookmarked: false,
      liked: false
    },
    {
      _id: 'post-3',
      id: 'post-3',
      content: 'Backend sederhana ini mendemonstrasikan bagaimana SafeSpace bekerja dalam mode read-only. Data ini adalah contoh untuk testing.',
      created_at: new Date(Date.now() - 7200000).toISOString(),
      updated_at: new Date(Date.now() - 7200000).toISOString(),
      author: {
        _id: 'user-2',
        id: 'user-2',
        name: 'Test User',
        avatar: null
      },
      likes: [],
      comments: [],
      likes_count: 3,
      comments_count: 1,
      bookmarked: false,
      liked: false
    }
  ];
  
  res.json(mockPosts);
});

// Basic auth endpoints for testing
app.post('/api/auth/register', (req, res) => {
  console.log('Register endpoint hit');
  res.json({ message: 'Registration endpoint - not implemented in minimal server' });
});

app.post('/api/auth/login', (req, res) => {
  console.log('Login endpoint hit');
  res.json({ message: 'Login endpoint - not implemented in minimal server' });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  console.log(`404 - Route not found: ${req.method} ${req.url}`);
  res.status(404).json({ message: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`=================================`);
  console.log(`Minimal backend server running on port ${PORT}`);
  console.log(`Test endpoint: http://localhost:${PORT}/test`);
  console.log(`SafeSpace Posts: http://localhost:${PORT}/api/safespace/posts/public`);
  console.log(`=================================`);
});
