const User = require('../models/User');
const { query, transaction } = require('../config/db');
const logger = require('../config/logger');

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
exports.getUsers = async (req, res, next) => {
  try {
    const result = await query(
      'SELECT id, name, email, avatar, role, created_at FROM "pulihHati".users'
    );

    res.json(result.rows);
  } catch (error) {
    logger.error(`Error getting users: ${error.message}`);
    next(error);
  }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private
exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private
exports.updateUser = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const currentUserId = req.user.id;

    logger.info(`User ${currentUserId} attempting to update user ${userId}`);

    // Check if user exists
    const user = await User.findById(userId);

    if (!user) {
      logger.warn(`User ${userId} not found`);
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user is updating their own profile or is an admin
    if (currentUserId !== parseInt(userId) && req.user.role !== 'admin') {
      logger.warn(`User ${currentUserId} not authorized to update user ${userId}`);
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { name, email } = req.body;

    logger.info(`Updating user ${userId} with name: ${name}, email: ${email}`);

    // Update user
    const result = await query(
      `UPDATE "pulihHati".users
       SET name = COALESCE($1, name),
           email = COALESCE($2, email),
           updated_at = NOW()
       WHERE id = $3
       RETURNING id, name, email, avatar, role`,
      [name || user.name, email || user.email, userId]
    );

    if (result.rows.length === 0) {
      throw new Error('Failed to update user');
    }

    logger.info(`User ${userId} updated successfully`);
    res.json(result.rows[0]);
  } catch (error) {
    logger.error(`Error updating user: ${error.message}`);
    logger.error(`Stack trace: ${error.stack}`);
    next(error);
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res, next) => {
  try {
    const userId = req.params.id;

    // Check if user exists
    const user = await User.findById(userId);

    if (!user) {
      logger.warn(`User ${userId} not found for deletion`);
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete user
    await query('DELETE FROM "pulihHati".users WHERE id = $1', [userId]);

    logger.info(`User ${userId} deleted successfully`);
    res.json({ message: 'User removed' });
  } catch (error) {
    logger.error(`Error deleting user: ${error.message}`);
    next(error);
  }
};

// @desc    Update current user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { name, email } = req.body;

    logger.info(`User ${userId} updating their own profile`);

    // Allow empty updates (for cases like avatar-only updates)
    logger.info(`Update request - name: ${name ? 'provided' : 'not provided'}, email: ${email ? 'provided' : 'not provided'}`);

    // Check if user exists
    const user = await User.findById(userId);

    if (!user) {
      logger.warn(`User ${userId} not found`);
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if email is already taken by another user
    if (email && email !== user.email) {
      const existingUser = await User.findByEmail(email);
      if (existingUser && existingUser.id !== userId) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }

    // Prepare update data - only include fields that are provided
    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;

    if (name !== undefined && name !== null && name.trim() !== '') {
      updateFields.push(`name = $${paramIndex}`);
      updateValues.push(name.trim());
      paramIndex++;
    }

    if (email !== undefined && email !== null && email.trim() !== '') {
      updateFields.push(`email = $${paramIndex}`);
      updateValues.push(email.trim());
      paramIndex++;
    }

    // If no fields to update, just return current user data
    if (updateFields.length === 0) {
      logger.info(`No fields to update for user ${userId}, returning current data`);
      return res.status(200).json({
        message: 'Profile data retrieved successfully',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          role: user.role,
          created_at: user.created_at
        }
      });
    }

    // Add updated_at field
    updateFields.push(`updated_at = NOW()`);

    // Add user ID for WHERE clause
    updateValues.push(userId);

    logger.info(`Updating profile for user ${userId} with fields: ${updateFields.join(', ')}`);

    // Update user profile
    const result = await query(
      `UPDATE "pulihHati".users
       SET ${updateFields.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING id, name, email, avatar, role, created_at`,
      updateValues
    );

    if (result.rows.length === 0) {
      throw new Error('Failed to update profile');
    }

    logger.info(`Profile updated successfully for user ${userId}`);
    res.json({
      message: 'Profile updated successfully',
      user: result.rows[0]
    });
  } catch (error) {
    logger.error(`Error updating profile: ${error.message}`);
    logger.error(`Stack trace: ${error.stack}`);

    if (error.message.includes('duplicate key value violates unique constraint')) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    next(error);
  }
};