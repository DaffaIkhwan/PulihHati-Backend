const express = require('express');
const cors = require('cors');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Simple in-memory storage for testing
const users = [];

// Test endpoint
app.get('/test', (req, res) => {
  res.json({ message: 'Backend is working!', timestamp: new Date().toISOString() });
});

// Register endpoint
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    console.log('Register attempt:', { name, email });
    
    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    // Check if user exists
    const existingUser = users.find(user => user.email === email);
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    // Hash password
    const hashedPassword = await bcryptjs.hash(password, 12);
    
    // Create user
    const user = {
      id: users.length + 1,
      name,
      email,
      password: hashedPassword,
      createdAt: new Date()
    };
    
    users.push(user);
    
    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      'test_jwt_secret',
      { expiresIn: '30d' }
    );
    
    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
    
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('Login attempt:', { email });
    
    // Validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    
    // Find user
    const user = users.find(user => user.email === email);
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Check password
    const isMatch = await bcryptjs.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      'test_jwt_secret',
      { expiresIn: '30d' }
    );
    
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Get users (for testing)
app.get('/api/users', (req, res) => {
  res.json({
    message: 'Users list',
    users: users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt
    }))
  });
});

// Simple SafeSpace posts endpoint
app.get('/api/safespace/posts/public', (req, res) => {
  const mockPosts = [
    {
      _id: 'test-1',
      id: 'test-1',
      content: 'Ini adalah post test untuk mode read-only. Backend sederhana berfungsi!',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      author: {
        _id: 'test-user',
        id: 'test-user',
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

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Simple backend server running on port ${PORT}`);
  console.log(`Test endpoint: http://localhost:${PORT}/test`);
  console.log(`Register: POST http://localhost:${PORT}/api/auth/register`);
  console.log(`Login: POST http://localhost:${PORT}/api/auth/login`);
  console.log(`SafeSpace Posts: GET http://localhost:${PORT}/api/safespace/posts/public`);
  console.log('Backend is ready to receive requests!');
});
