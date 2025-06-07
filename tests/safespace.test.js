const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const User = require('../models/User');
const Post = require('../models/Post');

describe('SafeSpace API', () => {
  let token;
  let userId;
  let postId;

  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.MONGO_URI_TEST, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // Create a test user and get token
    const user = await User.create({
      name: 'SafeSpace Test User',
      email: 'safespace@example.com',
      password: 'password123',
    });

    userId = user._id;
    token = user.getSignedJwtToken();
  });

  afterAll(async () => {
    // Clear database and close connection
    await User.deleteMany({});
    await Post.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clear posts before each test
    await Post.deleteMany({});
  });

  describe('POST /api/safespace/posts', () => {
    it('should create a new post', async () => {
      const res = await request(app)
        .post('/api/safespace/posts')
        .set('Authorization', `Bearer ${token}`)
        .send({
          content: 'This is a test post',
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('_id');
      expect(res.body.content).toEqual('This is a test post');
      expect(res.body.author._id.toString()).toEqual(userId.toString());

      // Save post ID for later tests
      postId = res.body._id;
    });

    it('should not create a post without content', async () => {
      const res = await request(app)
        .post('/api/safespace/posts')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('message');
    });

    it('should not create a post without authentication', async () => {
      const res = await request(app)
        .post('/api/safespace/posts')
        .send({
          content: 'This is a test post',
        });

      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toEqual('Not authorized to access this route');
    });
  });

  describe('GET /api/safespace/posts', () => {
    it('should get all posts', async () => {
      // Create a post first
      await Post.create({
        content: 'Test post for get all',
        author: userId,
      });

      const res = await request(app)
        .get('/api/safespace/posts')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('should not get posts without authentication', async () => {
      const res = await request(app).get('/api/safespace/posts');

      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toEqual('Not authorized to access this route');
    });
  });

  describe('GET /api/safespace/posts/:id', () => {
    it('should get a single post by ID', async () => {
      // Create a post first
      const post = await Post.create({
        content: 'Test post for get by ID',
        author: userId,
      });

      const res = await request(app)
        .get(`/api/safespace/posts/${post._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('_id');
      expect(res.body.content).toEqual('Test post for get by ID');
    });

    it('should not get a post that does not exist', async () => {
      const fakeId = mongoose.Types.ObjectId();
      
      const res = await request(app)
        .get(`/api/safespace/posts/${fakeId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(404);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toEqual('Post not found');
    });
  });

  describe('PUT /api/safespace/posts/:id', () => {
    it('should update a post', async () => {
      // Create a post first
      const post = await Post.create({
        content: 'Original content',
        author: userId,
      });

      const res = await request(app)
        .put(`/api/safespace/posts/${post._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          content: 'Updated content',
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('_id');
      expect(res.body.content).toEqual('Updated content');
    });

    it('should not update a post that does not belong to the user', async () => {
      // Create another user
      const anotherUser = await User.create({
        name: 'Another User',
        email: 'another@example.com',
        password: 'password123',
      });

      // Create a post for the other user
      const post = await Post.create({
        content: 'Another user post',
        author: anotherUser._id,
      });

      const res = await request(app)
        .put(`/api/safespace/posts/${post._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          content: 'Trying to update',
        });

      expect(res.statusCode).toEqual(403);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toEqual('Not authorized to update this post');
    });
  });

  describe('DELETE /api/safespace/posts/:id', () => {
    it('should delete a post', async () => {
      // Create a post first
      const post = await Post.create({
        content: 'Post to delete',
        author: userId,
      });

      const res = await request(app)
        .delete(`/api/safespace/posts/${post._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toEqual('Post removed');

      // Verify post is deleted
      const deletedPost = await Post.findById(post._id);
      expect(deletedPost).toBeNull();
    });

    it('should not delete a post that does not belong to the user', async () => {
      // Create another user
      const anotherUser = await User.create({
        name: 'Another User',
        email: 'another@example.com',
        password: 'password123',
      });

      // Create a post for the other user
      const post = await Post.create({
        content: 'Another user post',
        author: anotherUser._id,
      });

      const res = await request(app)
        .delete(`/api/safespace/posts/${post._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(403);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toEqual('Not authorized to delete this post');
    });
  });

  describe('POST /api/safespace/posts/:id/comments', () => {
    it('should add a comment to a post', async () => {
      // Create a post first
      const post = await Post.create({
        content: 'Post for comment',
        author: userId,
      });

      const res = await request(app)
        .post(`/api/safespace/posts/${post._id}/comments`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          content: 'This is a test comment',
        });

      expect(res.statusCode).toEqual(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toEqual(1);
      expect(res.body[0].content).toEqual('This is a test comment');
      expect(res.body[0].author._id.toString()).toEqual(userId.toString());
    });
  });

  describe('PUT /api/safespace/posts/:id/like', () => {
    it('should like a post', async () => {
      // Create a post first
      const post = await Post.create({
        content: 'Post to like',
        author: userId,
      });

      const res = await request(app)
        .put(`/api/safespace/posts/${post._id}/like`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toEqual(1);
      expect(res.body[0].user.toString()).toEqual(userId.toString());
    });

    it('should unlike a post if already liked', async () => {
      // Create a post first
      const post = await Post.create({
        content: 'Post to unlike',
        author: userId,
        likes: [{ user: userId }],
      });

      const res = await request(app)
        .put(`/api/safespace/posts/${post._id}/like`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toEqual(0);
    });
  });

  describe('PUT /api/safespace/posts/:id/bookmark', () => {
    it('should bookmark a post', async () => {
      // Create a post first
      const post = await Post.create({
        content: 'Post to bookmark',
        author: userId,
      });

      const res = await request(app)
        .put(`/api/safespace/posts/${post._id}/bookmark`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toEqual(1);
      expect(res.body[0].toString()).toEqual(post._id.toString());
    });
  });

  describe('GET /api/safespace/bookmarks', () => {
    it('should get all bookmarked posts', async () => {
      // Create a post first
      const post = await Post.create({
        content: 'Bookmarked post',
        author: userId,
      });

      // Bookmark the post
      const user = await User.findById(userId);
      user.bookmarks.push(post._id);
      await user.save();

      const res = await request(app)
        .get('/api/safespace/bookmarks')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toEqual(1);
      expect(res.body[0]._id.toString()).toEqual(post._id.toString());
    });
  });
}); 