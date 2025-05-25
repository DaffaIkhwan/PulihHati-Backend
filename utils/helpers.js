const jwt = require('jsonwebtoken');

// Generate JWT token
exports.generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// Format date
exports.formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Sanitize user data for response
exports.sanitizeUser = (user) => {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    role: user.role,
    createdAt: user.createdAt
  };
};

// Paginate results
exports.paginate = (data, page, limit) => {
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  
  const results = {};
  
  if (endIndex < data.length) {
    results.next = {
      page: page + 1,
      limit
    };
  }
  
  if (startIndex > 0) {
    results.previous = {
      page: page - 1,
      limit
    };
  }
  
  results.results = data.slice(startIndex, endIndex);
  
  return results;
};

// Calculate reading time
exports.calculateReadingTime = (text) => {
  const wordsPerMinute = 200;
  const words = text.trim().split(/\s+/).length;
  const time = Math.ceil(words / wordsPerMinute);
  
  return time === 0 ? 1 : time;
};

// Generate random string
exports.generateRandomString = (length) => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  
  return result;
};

// Check if object is empty
exports.isEmpty = (obj) => {
  return Object.keys(obj).length === 0;
};

// Deep clone an object
exports.deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

// Format error message
exports.formatError = (err) => {
  if (typeof err === 'string') {
    return { message: err };
  }
  
  if (err.message) {
    return { message: err.message };
  }
  
  return { message: 'An unknown error occurred' };
};