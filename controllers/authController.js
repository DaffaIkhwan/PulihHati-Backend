const User = require('../models/User');
const { validationResult } = require('express-validator');
const logger = require('../config/logger');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;

    // Check if user already exists
    let user = await User.findByEmail(email);
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create user
    user = await User.create({
      name,
      email,
      password
    });

    // Generate token
    const token = User.getSignedJwtToken(user.id);

    res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Debug
    console.log('User model methods:', Object.getOwnPropertyNames(User));

    // Check if password matches - PERBAIKAN: Ubah matchPassword menjadi comparePassword
    const isMatch = await User.comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = User.getSignedJwtToken(user.id);

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    next(error);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      role: user.role
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update current user profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { name, email } = req.body;

    logger.info(`User ${userId} updating their profile via auth endpoint`);

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
    const updateData = {};
    if (name !== undefined && name !== null && name.trim() !== '') {
      updateData.name = name.trim();
    }
    if (email !== undefined && email !== null && email.trim() !== '') {
      updateData.email = email.trim();
    }

    // If no fields to update, just return current user data
    if (Object.keys(updateData).length === 0) {
      logger.info(`No fields to update for user ${userId}, returning current data`);
      return res.status(200).json({
        message: 'Profile data retrieved successfully',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          role: user.role
        }
      });
    }

    logger.info(`Updating profile for user ${userId} with fields:`, updateData);

    // Update user profile using User model
    const updatedUser = await User.update(userId, updateData);

    if (!updatedUser) {
      throw new Error('Failed to update profile');
    }

    logger.info(`Profile updated successfully for user ${userId}`);

    res.status(200).json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        avatar: updatedUser.avatar,
        role: updatedUser.role
      }
    });
  } catch (error) {
    logger.error(`Error updating profile: ${error.message}`);
    logger.error(`Stack trace: ${error.stack}`);

    if (error.message.includes('duplicate key value violates unique constraint')) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    res.status(500).json({
      message: 'Failed to update profile. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
