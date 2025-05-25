const User = require('../models/User');
const { pool } = require('../config/database');

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
exports.getUsers = async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, avatar, role, created_at FROM users'
    );
    
    res.json(result.rows);
  } catch (error) {
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
    // Check if user exists
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if user is updating their own profile or is an admin
    if (req.user.id !== req.params.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    const { name, email } = req.body;
    
    // Update user
    const result = await pool.query(
      `UPDATE users 
       SET name = COALESCE($1, name), 
           email = COALESCE($2, email),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING id, name, email, avatar, role`,
      [name || user.name, email || user.email, req.params.id]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res, next) => {
  try {
    // Check if user exists
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Delete user
    await pool.query('DELETE FROM users WHERE id = $1', [req.params.id]);
    
    res.json({ message: 'User removed' });
  } catch (error) {
    next(error);
  }
};
