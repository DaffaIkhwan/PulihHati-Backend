const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const userController = require('../controllers/userController');

// Get all users - admin only
router.get('/', protect, authorize('admin'), userController.getUsers);

// Get user by ID
router.get('/:id', protect, userController.getUserById);

// Update user
router.put('/:id', protect, userController.updateUser);

// Delete user - admin only
router.delete('/:id', protect, authorize('admin'), userController.deleteUser);

module.exports = router;
