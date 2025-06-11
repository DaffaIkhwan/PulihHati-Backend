const { transaction, query } = require('../config/db');
const logger = require('../config/logger');

// @desc    Get all notifications for a user
// @route   GET /api/notifications
// @access  Private
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    logger.info(`Fetching notifications for user ${userId}`);

    const result = await transaction(async (client) => {
      // Get notifications with actor info
      const notificationsResult = await client.query(`
        SELECT
          n.*,
          u.name as actor_name,
          u.avatar as actor_avatar,
          p.content as post_content
        FROM
          "pulihHati".notifications n
        LEFT JOIN
          "pulihHati".users u ON n.actor_id = u.id
        LEFT JOIN
          "pulihHati".posts p ON n.post_id = p.id
        WHERE
          n.user_id = $1
        ORDER BY
          n.created_at DESC
        LIMIT $2 OFFSET $3
      `, [userId, limit, offset]);

      // Format notifications for frontend
      return notificationsResult.rows.map(notification => ({
        _id: notification.id,
        id: notification.id,
        type: notification.type,
        message: notification.message,
        read: notification.read,
        created_at: notification.created_at,
        actor: notification.actor_id ? {
          _id: notification.actor_id,
          id: notification.actor_id,
          name: notification.actor_name || 'Anonymous',
          avatar: notification.actor_avatar || null
        } : null,
        post: notification.post_id ? {
          _id: notification.post_id,
          id: notification.post_id,
          content: notification.post_content
        } : null
      }));
    });

    res.json(result);
  } catch (error) {
    logger.error(`Error fetching notifications: ${error.message}`);
    logger.error(`Stack trace: ${error.stack}`);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get unread notifications count
// @route   GET /api/notifications/unread-count
// @access  Private
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await query(`
      SELECT COUNT(*) as count
      FROM "pulihHati".notifications
      WHERE user_id = $1 AND read = false
    `, [userId]);

    const count = parseInt(result.rows[0].count) || 0;

    res.json({ count });
  } catch (error) {
    logger.error(`Error fetching unread count: ${error.message}`);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
exports.markAsRead = async (req, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user.id;

    // Validate notificationId
    if (!notificationId || notificationId === 'undefined' || isNaN(parseInt(notificationId))) {
      logger.error(`Invalid notification ID received: ${notificationId}`);
      return res.status(400).json({ message: 'Invalid notification ID provided' });
    }

    logger.info(`Marking notification ${notificationId} as read for user ${userId}`);

    await transaction(async (client) => {
      // Update notification as read (only if it belongs to the user)
      const result = await client.query(`
        UPDATE "pulihHati".notifications
        SET read = true, updated_at = NOW()
        WHERE id = $1 AND user_id = $2
        RETURNING id
      `, [notificationId, userId]);

      if (result.rows.length === 0) {
        throw new Error('Notification not found or access denied');
      }
    });

    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    logger.error(`Error marking notification as read: ${error.message}`);

    if (error.message === 'Notification not found or access denied') {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/mark-all-read
// @access  Private
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    logger.info(`Marking all notifications as read for user ${userId}`);

    const result = await query(`
      UPDATE "pulihHati".notifications
      SET read = true, updated_at = NOW()
      WHERE user_id = $1 AND read = false
      RETURNING id
    `, [userId]);

    const updatedCount = result.rows.length;

    res.json({
      message: 'All notifications marked as read',
      updated_count: updatedCount
    });
  } catch (error) {
    logger.error(`Error marking all notifications as read: ${error.message}`);
    res.status(500).json({ message: 'Server error' });
  }
};

// Helper function to create notification
exports.createNotification = async (client, { userId, actorId, type, message, postId = null }) => {
  try {
    // Don't create notification if user is acting on their own content
    if (userId === actorId) {
      return null;
    }

    const wibTime = new Date(new Date().getTime() + (7 * 60 * 60 * 1000));
    const result = await client.query(`
      INSERT INTO "pulihHati".notifications (user_id, actor_id, type, message, post_id, created_at)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `, [userId, actorId, type, message, postId, wibTime]);

    logger.info(`Created notification for user ${userId} from actor ${actorId}: ${type}`);
    return result.rows[0];
  } catch (error) {
    logger.error(`Error creating notification: ${error.message}`);
    throw error;
  }
};

module.exports = exports;
