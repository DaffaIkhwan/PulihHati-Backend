const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const safeSpaceController = require('../controllers/safeSpaceController');
const notificationController = require('../controllers/notificationController');
const uploadController = require('../controllers/uploadController');

// Test endpoint
router.get('/test', (req, res) => {
  res.json({ message: 'SafeSpace API is working', timestamp: new Date().toISOString() });
});

// Get all posts (public - read-only access)
router.get('/posts/public', safeSpaceController.getPublicPosts);

// Get all posts (authenticated users)
router.get('/posts', protect, safeSpaceController.getPosts);

// Create a new post
router.post('/posts', protect, safeSpaceController.createPost);

// Get a single post by ID (public - read-only access)
router.get('/posts/:id/public', safeSpaceController.getPublicPostById);

// Get a single post by ID (authenticated users)
router.get('/posts/:id', protect, safeSpaceController.getPostById);

// Update a post
router.put('/posts/:id', protect, safeSpaceController.updatePost);

// Delete a post
router.delete('/posts/:id', protect, safeSpaceController.deletePost);

// Like a post
router.put('/posts/:id/like', protect, safeSpaceController.likePost);

// Comment routes
router.get('/posts/:id/comments', protect, safeSpaceController.getPostComments);
router.post('/posts/:id/comments', protect, safeSpaceController.addComment);
router.put('/comments/:id', protect, safeSpaceController.updateComment);
router.delete('/comments/:id', protect, safeSpaceController.deleteComment);

// Bookmark a post
router.put('/posts/:id/bookmark', protect, safeSpaceController.toggleBookmark);

// Get bookmarked posts
router.get('/bookmarks', protect, safeSpaceController.getBookmarkedPosts);

// Notification routes (for frontend compatibility)
router.get('/notifications', protect, notificationController.getNotifications);
router.get('/notifications/unread-count', protect, notificationController.getUnreadCount);
router.put('/notifications/:id/read', protect, notificationController.markAsRead);
router.put('/notifications/mark-all-read', protect, notificationController.markAllAsRead);

// Profile routes (for frontend compatibility)
router.get('/profile-stats', protect, uploadController.getProfileStats);
router.put('/profile', protect, safeSpaceController.updateProfile);
router.post('/upload-avatar', protect, require('../middleware/upload').uploadSingle('avatar'), uploadController.uploadAvatar);
router.delete('/delete-avatar', protect, uploadController.deleteAvatar);

module.exports = router;
