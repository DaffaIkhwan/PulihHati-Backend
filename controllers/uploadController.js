const { uploadImage, deleteImage, getAvatarUrl } = require('../config/cloudinary');
const { query, transaction } = require('../config/db');
const logger = require('../config/logger');
const User = require('../models/User');

// @desc    Upload user avatar
// @route   POST /api/upload/avatar
// @access  Private
exports.uploadAvatar = async (req, res) => {
  try {
    const userId = req.user.id;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    logger.info(`Uploading avatar for user ${userId}`);

    // Convert buffer to base64 data URL for Cloudinary
    const fileStr = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;

    const result = await transaction(async (client) => {
      // Get current user data to check if they have an existing avatar
      const userResult = await client.query(`
        SELECT avatar, cloudinary_public_id FROM "pulihHati".users WHERE id = $1
      `, [userId]);

      if (userResult.rows.length === 0) {
        throw new Error('User not found');
      }

      const currentUser = userResult.rows[0];

      // Delete old avatar from Cloudinary if exists
      if (currentUser.cloudinary_public_id) {
        try {
          await deleteImage(currentUser.cloudinary_public_id);
          logger.info(`Deleted old avatar: ${currentUser.cloudinary_public_id}`);
        } catch (deleteError) {
          logger.warn(`Failed to delete old avatar: ${deleteError.message}`);
          // Continue with upload even if deletion fails
        }
      }

      // Upload new avatar to Cloudinary with optimizations
      logger.info(`Starting Cloudinary upload for user ${userId}`);
      const uploadResult = await uploadImage(fileStr, {
        public_id: `user_${userId}_${Date.now()}`,
        folder: 'pulih-hati/avatars',
        transformation: [
          {
            width: 500,
            height: 500,
            crop: 'fill',
            gravity: 'face',
            quality: 'auto:good', // Automatic quality optimization
            fetch_format: 'auto'  // Automatic format optimization
          }
        ],
        eager: [
          {
            width: 100,
            height: 100,
            crop: 'fill',
            gravity: 'face',
            quality: 'auto:good'
          },
          {
            width: 300,
            height: 300,
            crop: 'fill',
            gravity: 'face',
            quality: 'auto:good'
          }
        ]
      });

      logger.info(`Cloudinary upload successful:`, {
        public_id: uploadResult.public_id,
        secure_url: uploadResult.secure_url,
        width: uploadResult.width,
        height: uploadResult.height
      });

      // Generate optimized avatar URLs
      const avatarUrls = {
        small: getAvatarUrl(uploadResult.public_id, 'small'),
        medium: getAvatarUrl(uploadResult.public_id, 'medium'),
        large: getAvatarUrl(uploadResult.public_id, 'large'),
        original: uploadResult.secure_url
      };

      // Update user avatar in database using direct query for better debugging
      logger.info(`Updating user ${userId} with avatar: ${avatarUrls.medium}`);
      logger.info(`Updating user ${userId} with public_id: ${uploadResult.public_id}`);

      const updateResult = await client.query(`
        UPDATE "pulihHati".users
        SET avatar = $1, cloudinary_public_id = $2, updated_at = NOW()
        WHERE id = $3
        RETURNING id, name, email, avatar, role, created_at, updated_at, cloudinary_public_id
      `, [avatarUrls.medium, uploadResult.public_id, userId]);

      if (updateResult.rows.length === 0) {
        throw new Error('Failed to update user avatar in database - user not found');
      }

      const updatedUser = updateResult.rows[0];
      logger.info(`User updated successfully:`, updatedUser);

      return {
        user: updatedUser,
        avatarUrls,
        cloudinaryResult: {
          public_id: uploadResult.public_id,
          secure_url: uploadResult.secure_url,
          width: uploadResult.width,
          height: uploadResult.height,
          format: uploadResult.format,
          bytes: uploadResult.bytes
        }
      };
    });

    logger.info(`Avatar uploaded successfully for user ${userId}`);

    res.status(200).json({
      message: 'Avatar uploaded successfully',
      user: result.user,
      avatar: result.avatarUrls,
      upload_info: result.cloudinaryResult
    });

  } catch (error) {
    logger.error(`Error uploading avatar: ${error.message}`);
    logger.error(`Stack trace: ${error.stack}`);
    res.status(500).json({
      message: 'Failed to upload avatar',
      error: error.message
    });
  }
};

// @desc    Delete user avatar
// @route   DELETE /api/upload/avatar
// @access  Private
exports.deleteAvatar = async (req, res) => {
  try {
    const userId = req.user.id;

    logger.info(`Deleting avatar for user ${userId}`);

    const result = await transaction(async (client) => {
      // Get current user data
      const userResult = await client.query(`
        SELECT avatar, cloudinary_public_id FROM "pulihHati".users WHERE id = $1
      `, [userId]);

      if (userResult.rows.length === 0) {
        throw new Error('User not found');
      }

      const currentUser = userResult.rows[0];

      // Delete avatar from Cloudinary if exists
      if (currentUser.cloudinary_public_id) {
        try {
          await deleteImage(currentUser.cloudinary_public_id);
          logger.info(`Deleted avatar from Cloudinary: ${currentUser.cloudinary_public_id}`);
        } catch (deleteError) {
          logger.warn(`Failed to delete avatar from Cloudinary: ${deleteError.message}`);
          // Continue with database update even if Cloudinary deletion fails
        }
      }

      // Update user to remove avatar using User model
      const updatedUser = await User.update(userId, {
        avatar: null,
        cloudinary_public_id: null
      });

      if (!updatedUser) {
        throw new Error('Failed to remove avatar from database');
      }

      return updatedUser;
    });

    logger.info(`Avatar deleted successfully for user ${userId}`);

    res.status(200).json({
      message: 'Avatar deleted successfully',
      user: result
    });

  } catch (error) {
    logger.error(`Error deleting avatar: ${error.message}`);
    logger.error(`Stack trace: ${error.stack}`);
    res.status(500).json({
      message: 'Failed to delete avatar',
      error: error.message
    });
  }
};

// @desc    Get user profile with stats
// @route   GET /api/upload/profile-stats
// @access  Private
exports.getProfileStats = async (req, res) => {
  try {
    const userId = req.user.id;

    logger.info(`Fetching profile stats for user ${userId}`);

    const result = await transaction(async (client) => {
      // Get user info with all fields
      const userResult = await client.query(`
        SELECT id, name, email, avatar, role, created_at, updated_at, cloudinary_public_id
        FROM "pulihHati".users WHERE id = $1
      `, [userId]);

      if (userResult.rows.length === 0) {
        throw new Error('User not found');
      }

      // Get posts count where user is author
      const postsResult = await client.query(`
        SELECT COUNT(*) as count FROM "pulihHati".posts WHERE author_id = $1
      `, [userId]);

      // Get comments count where user is author
      const commentsResult = await client.query(`
        SELECT COUNT(*) as count FROM "pulihHati".post_comments WHERE author_id = $1
      `, [userId]);

      // Get bookmarks count where user bookmarked posts
      const bookmarksResult = await client.query(`
        SELECT COUNT(*) as count FROM "pulihHati".bookmarks WHERE user_id = $1
      `, [userId]);

      const user = userResult.rows[0];

      return {
        user: {
          id: user.id,
          _id: user.id, // For frontend compatibility
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          role: user.role,
          created_at: user.created_at,
          updated_at: user.updated_at
        },
        stats: {
          posts: parseInt(postsResult.rows[0].count) || 0,
          comments: parseInt(commentsResult.rows[0].count) || 0,
          bookmarks: parseInt(bookmarksResult.rows[0].count) || 0
        }
      };
    });

    logger.info(`Profile stats fetched successfully for user ${userId}:`, result.stats);
    res.status(200).json(result);

  } catch (error) {
    logger.error(`Error fetching profile stats: ${error.message}`);
    logger.error(`Stack trace: ${error.stack}`);
    res.status(500).json({
      message: 'Failed to fetch profile stats',
      error: error.message
    });
  }
};

module.exports = exports;
