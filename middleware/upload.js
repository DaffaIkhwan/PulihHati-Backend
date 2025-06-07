const multer = require('multer');
const path = require('path');
const logger = require('../config/logger');

// Configure multer for memory storage (we'll upload directly to Cloudinary)
const storage = multer.memoryStorage();

// File filter function
const fileFilter = (req, file, cb) => {
  // Check if file is an image
  if (file.mimetype.startsWith('image/')) {
    // Allowed image types
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'), false);
    }
  } else {
    cb(new Error('Only image files are allowed.'), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1 // Only allow 1 file at a time
  }
});

// Middleware for single file upload
const uploadSingle = (fieldName = 'avatar') => {
  return (req, res, next) => {
    const uploadMiddleware = upload.single(fieldName);
    
    uploadMiddleware(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        logger.error(`Multer error: ${err.message}`);
        
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            message: 'File too large. Maximum size is 5MB.'
          });
        }
        
        if (err.code === 'LIMIT_FILE_COUNT') {
          return res.status(400).json({
            message: 'Too many files. Only 1 file is allowed.'
          });
        }
        
        return res.status(400).json({
          message: 'File upload error.',
          error: err.message
        });
      } else if (err) {
        logger.error(`Upload error: ${err.message}`);
        return res.status(400).json({
          message: err.message
        });
      }
      
      // Check if file was uploaded
      if (!req.file) {
        return res.status(400).json({
          message: 'No file uploaded. Please select an image file.'
        });
      }
      
      logger.info(`File uploaded: ${req.file.originalname}, Size: ${req.file.size} bytes`);
      next();
    });
  };
};

// Middleware for multiple file upload
const uploadMultiple = (fieldName = 'images', maxCount = 5) => {
  return (req, res, next) => {
    const uploadMiddleware = upload.array(fieldName, maxCount);
    
    uploadMiddleware(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        logger.error(`Multer error: ${err.message}`);
        
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            message: 'File too large. Maximum size is 5MB per file.'
          });
        }
        
        if (err.code === 'LIMIT_FILE_COUNT') {
          return res.status(400).json({
            message: `Too many files. Maximum ${maxCount} files allowed.`
          });
        }
        
        return res.status(400).json({
          message: 'File upload error.',
          error: err.message
        });
      } else if (err) {
        logger.error(`Upload error: ${err.message}`);
        return res.status(400).json({
          message: err.message
        });
      }
      
      // Check if files were uploaded
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          message: 'No files uploaded. Please select image files.'
        });
      }
      
      logger.info(`${req.files.length} files uploaded`);
      next();
    });
  };
};

module.exports = {
  uploadSingle,
  uploadMultiple
};
