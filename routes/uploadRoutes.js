const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { uploadSingle } = require('../middleware/upload');
const uploadController = require('../controllers/uploadController');

// Upload avatar
router.post('/avatar', protect, uploadSingle('avatar'), uploadController.uploadAvatar);

// Delete avatar
router.delete('/avatar', protect, uploadController.deleteAvatar);

// Get profile stats
router.get('/profile-stats', protect, uploadController.getProfileStats);

module.exports = router;
