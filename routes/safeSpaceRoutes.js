const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const safeSpaceController = require('../controllers/safeSpaceController');

// Get all posts
router.get('/posts', protect, safeSpaceController.getPosts);

// Create a new post
router.post('/posts', protect, safeSpaceController.createPost);

// Get a single post by ID
router.get('/posts/:id', protect, safeSpaceController.getPostById);

// Like a post
router.put('/posts/:id/like', protect, safeSpaceController.likePost);

// Add a comment to a post
router.post('/posts/:id/comments', protect, safeSpaceController.addComment);

// Bookmark a post
router.put('/posts/:id/bookmark', protect, safeSpaceController.toggleBookmark);

// Get bookmarked posts
router.get('/bookmarks', protect, safeSpaceController.getBookmarkedPosts);

module.exports = router;
