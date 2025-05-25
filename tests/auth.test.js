const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const User = require('../models/User');

describe('Auth API', () => {
  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.MONGO_URI_TEST, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });

  afterAll(async () => {
    // Clear database and close connection
    await User.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clear users collection before each test
    await User.deleteMany({});
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('_id');
      expect(res.body.name).toEqual('Test User');
      expect(res.body.email).toEqual('test@example.com');
    });

    it('should not register a user with existing email', async () => {
      // Create a user first
      await User.create({
        name: 'Existing User',
        email: 'existing@example.com',
        password: 'password123',
      });

      // Try to register with the same email
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'existing@example.com',
          password: 'password123',
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toEqual('User already exists');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login an existing user', async () => {
      // Create a user first
      await User.create({
        name: 'Login Test',
        email: 'login@example.com',
        password: 'password123',
      });

      // Login with the created user
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'password123',
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('_id');
      expect(res.body.name).toEqual('Login Test');
      expect(res.body.email).toEqual('login@example.com');
    });

    it('should not login with invalid credentials', async () => {
      // Create a user first
      await User.create({
        name: 'Login Test',
        email: 'login@example.com',
        password: 'password123',
      });

      // Try to login with wrong password
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'wrongpassword',
        });

      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toEqual('Invalid credentials');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should get current user profile', async () => {
      // Create a user first
      const user = await User.create({
        name: 'Profile Test',
        email: 'profile@example.com',
        password: 'password123',
      });

      // Get token
      const token = user.getSignedJwtToken();

      // Get current user profile
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('_id');
      expect(res.body.name).toEqual('Profile Test');
      expect(res.body.email).toEqual('profile@example.com');
    });

    it('should not access profile without token', async () => {
      const res = await request(app).get('/api/auth/me');

      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toEqual('Not authorized to access this route');
    });
  });
});