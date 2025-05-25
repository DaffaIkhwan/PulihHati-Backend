const { validationResult, body } = require('express-validator');

// Middleware to validate request
exports.validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Validation rules for user registration
exports.registerValidation = [
  body('name', 'Name is required').not().isEmpty(),
  body('email', 'Please include a valid email').isEmail(),
  body('password', 'Password must be at least 6 characters').isLength({ min: 6 })
];

// Validation rules for user login
exports.loginValidation = [
  body('email', 'Please include a valid email').isEmail(),
  body('password', 'Password is required').exists()
];

// Validation rules for creating a post
exports.postValidation = [
  body('content', 'Content is required').not().isEmpty()
];

// Validation rules for creating a comment
exports.commentValidation = [
  body('content', 'Content is required').not().isEmpty()
];