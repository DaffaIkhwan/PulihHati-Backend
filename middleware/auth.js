const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../config/logger');

// Middleware untuk melindungi rute
exports.protect = async (req, res, next) => {
  let token;
  
  // Cek apakah ada token di header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Ambil token dari header
      token = req.headers.authorization.split(' ')[1];
      
      // Verifikasi token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Cari user berdasarkan ID dari token
      try {
        const user = await User.findById(decoded.id);
        
        if (!user) {
          logger.warn(`User not found for token: ${token.substring(0, 10)}...`);
          return res.status(401).json({ message: 'Not authorized' });
        }
        
        // Tambahkan user ke request
        req.user = user;
        next();
      } catch (dbError) {
        logger.error(`Error in User.findById: ${dbError.message}`);
        logger.error(`Stack trace: ${dbError.stack}`);
        
        // Jika error koneksi database, kirim respons 503 Service Unavailable
        if (dbError.code === 'ECONNREFUSED' || 
            dbError.code === 'ETIMEDOUT' ||
            dbError.message.includes('Connection terminated unexpectedly') ||
            dbError.message.includes('Connection timeout') ||
            dbError.message.includes('Query timeout')) {
          return res.status(503).json({ 
            message: 'Database service unavailable, please try again later',
            error: 'database_unavailable'
          });
        }
        
        return res.status(401).json({ message: 'Not authorized' });
      }
    } catch (error) {
      logger.error(`Auth middleware error: ${error.message}`);
      
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ message: 'Invalid token' });
      }
      
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token expired' });
      }
      
      return res.status(401).json({ message: 'Not authorized' });
    }
  } else {
    logger.warn('No authorization token provided');
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

// Middleware untuk membatasi akses berdasarkan role
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    
    if (!roles.includes(req.user.role)) {
      logger.warn(`User ${req.user.id} (role: ${req.user.role}) attempted to access restricted route`);
      return res.status(403).json({ message: 'Not authorized for this role' });
    }
    
    next();
  };
};
