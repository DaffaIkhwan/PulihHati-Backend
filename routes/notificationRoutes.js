const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const notificationController = require('../controllers/notificationController');

// Get all notifications
router.get('/', protect, notificationController.getNotifications);

// Get unread notifications count
router.get('/unread-count', protect, notificationController.getUnreadCount);

// Mark notification as read
router.put('/:id/read', protect, notificationController.markAsRead);

// Mark all notifications as read
router.put('/mark-all-read', protect, notificationController.markAllAsRead);

module.exports = router;
