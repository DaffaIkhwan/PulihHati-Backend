const { v2: cloudinary } = require('cloudinary');
const logger = require('./logger');

// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dzrd37naa',
  api_key: process.env.CLOUDINARY_API_KEY || '812676562385731',
  api_secret: process.env.CLOUDINARY_API_SECRET // This should be set in .env file
});

// Test cloudinary connection
const testCloudinaryConnection = async () => {
  try {
    const result = await cloudinary.api.ping();
    logger.info('Cloudinary connection successful');
    return result;
  } catch (error) {
    logger.error(`Cloudinary connection failed: ${error.message}`);
    throw error;
  }
};

// Upload image to cloudinary
const uploadImage = async (file, options = {}) => {
  try {
    const defaultOptions = {
      folder: 'pulih-hati/avatars',
      transformation: [
        {
          width: 500,
          height: 500,
          crop: 'fill',
          gravity: 'face'
        }
      ],
      format: 'jpg',
      quality: 'auto'
    };

    const uploadOptions = { ...defaultOptions, ...options };
    
    const result = await cloudinary.uploader.upload(file, uploadOptions);
    
    logger.info(`Image uploaded successfully: ${result.public_id}`);
    return result;
  } catch (error) {
    logger.error(`Image upload failed: ${error.message}`);
    throw error;
  }
};

// Delete image from cloudinary
const deleteImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    logger.info(`Image deleted successfully: ${publicId}`);
    return result;
  } catch (error) {
    logger.error(`Image deletion failed: ${error.message}`);
    throw error;
  }
};

// Generate optimized URL
const getOptimizedUrl = (publicId, options = {}) => {
  const defaultOptions = {
    fetch_format: 'auto',
    quality: 'auto',
    width: 500,
    height: 500,
    crop: 'fill',
    gravity: 'face'
  };

  const urlOptions = { ...defaultOptions, ...options };
  return cloudinary.url(publicId, urlOptions);
};

// Generate avatar URL with different sizes
const getAvatarUrl = (publicId, size = 'medium') => {
  const sizes = {
    small: { width: 100, height: 100 },
    medium: { width: 300, height: 300 },
    large: { width: 500, height: 500 }
  };

  const sizeOptions = sizes[size] || sizes.medium;

  return cloudinary.url(publicId, {
    ...sizeOptions,
    crop: 'fill',
    gravity: 'face',
    fetch_format: 'auto',
    quality: 'auto'
  });
};

module.exports = {
  cloudinary,
  testCloudinaryConnection,
  uploadImage,
  deleteImage,
  getOptimizedUrl,
  getAvatarUrl
};
