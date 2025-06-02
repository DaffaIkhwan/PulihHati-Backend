const { query, transaction } = require('../config/db');
const logger = require('../config/logger');
const { createNotification } = require('./notificationController');

// @desc    Get all posts
// @route   GET /api/safespace/posts
// @access  Private
exports.getPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const userId = req.user.id;

    logger.info(`Fetching posts page ${page}, limit ${limit}`);

    // Gunakan satu transaksi untuk semua query
    const result = await transaction(async (client) => {
      // Count total posts
      const countResult = await client.query(`
        SELECT COUNT(*) FROM "pulihHati".posts
      `);

      const total = parseInt(countResult.rows[0].count);

      // Get posts with pagination and all related data in one query
      const postsResult = await client.query(`
        SELECT
          p.*,
          u.name as author_name,
          u.avatar as author_avatar,
          (SELECT COUNT(*) FROM "pulihHati".post_likes WHERE post_id = p.id) as like_count,
          (SELECT COUNT(*) FROM "pulihHati".post_comments WHERE post_id = p.id) as comment_count,
          EXISTS(
            SELECT 1 FROM "pulihHati".bookmarks
            WHERE post_id = p.id AND user_id = $3
          ) as bookmarked
        FROM "pulihHati".posts p
        JOIN "pulihHati".users u ON p.author_id = u.id
        ORDER BY p.created_at DESC
        LIMIT $1 OFFSET $2
      `, [limit, offset, userId]);

      // Get likes and comments for each post separately
      const postsWithLikesAndComments = await Promise.all(postsResult.rows.map(async (post) => {
        // Get likes
        const likesResult = await client.query(`
          SELECT
            pl.user_id,
            u.name as user_name
          FROM
            "pulihHati".post_likes pl
          LEFT JOIN
            "pulihHati".users u ON pl.user_id = u.id
          WHERE
            pl.post_id = $1
        `, [post.id]);

        // Get comments
        const commentsResult = await client.query(`
          SELECT
            pc.id,
            pc.content,
            pc.author_id,
            pc.created_at,
            u.name as author_name,
            u.avatar as author_avatar
          FROM
            "pulihHati".post_comments pc
          LEFT JOIN
            "pulihHati".users u ON pc.author_id = u.id
          WHERE
            pc.post_id = $1
          ORDER BY
            pc.created_at ASC
        `, [post.id]);

        return {
          ...post,
          likes: likesResult.rows.map(like => ({
            user: like.user_id,
            _id: like.user_id,
            name: like.user_name || 'Anonymous'
          })),
          comments: commentsResult.rows.map(comment => ({
            id: comment.id,
            _id: comment.id,
            content: comment.content,
            created_at: comment.created_at,
            author: {
              id: comment.author_id,
              _id: comment.author_id,
              name: comment.author_name || 'Anonymous',
              avatar: comment.author_avatar || '/static/default-avatar.svg'
            }
          }))
        };
      }));

      // Format posts for frontend
      const posts = postsWithLikesAndComments.map(post => ({
        _id: post.id,
        id: post.id,
        content: post.content,
        created_at: post.created_at,
        updated_at: post.updated_at,
        author: {
          _id: post.author_id,
          id: post.author_id,
          name: post.author_name || 'Anonymous',
          avatar: post.author_avatar || '/static/default-avatar.svg'
        },
        likes: post.likes || [],
        comments: post.comments || [], // Now includes actual comments from database
        likes_count: parseInt(post.like_count) || 0,
        comments_count: parseInt(post.comment_count) || 0,
        bookmarked: post.bookmarked || false
      }));

      return {
        posts,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    });

    logger.info(`Returning ${result.posts.length} posts`);
    res.json(result.posts); // Return just the posts array to match frontend expectations
  } catch (error) {
    logger.error(`Error fetching posts: ${error.message}`);
    logger.error(`Stack trace: ${error.stack}`);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create a new post
// @route   POST /api/safespace/posts
// @access  Private
exports.createPost = async (req, res) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ message: 'Content is required' });
    }

    logger.info(`Creating post with content: ${content.substring(0, 30)}...`);

    const post = await transaction(async (client) => {
      // Create post
      const result = await client.query(`
        INSERT INTO "pulihHati".posts (content, author_id)
        VALUES ($1, $2)
        RETURNING id, content, author_id, created_at, updated_at
      `, [content, req.user.id]);

      const newPost = result.rows[0];

      // Get user info
      const userResult = await client.query(`
        SELECT name, avatar FROM "pulihHati".users WHERE id = $1
      `, [req.user.id]);

      const user = userResult.rows[0] || { name: 'Anonymous', avatar: '/static/default-avatar.svg' };

      // Format post for frontend
      return {
        _id: newPost.id,
        id: newPost.id,
        content: newPost.content,
        created_at: newPost.created_at,
        updated_at: newPost.updated_at,
        author: {
          _id: req.user.id,
          id: req.user.id,
          name: user.name,
          avatar: user.avatar
        },
        likes: [],
        comments: [],
        likes_count: 0,
        comments_count: 0,
        bookmarked: false
      };
    });

    logger.info(`Post created successfully with ID: ${post.id}`);
    return res.status(201).json(post);
  } catch (error) {
    logger.error(`Error creating post: ${error.message}`);
    logger.error(`Stack trace: ${error.stack}`);
    return res.status(500).json({ message: 'Failed to create post. Please try again.' });
  }
};

// @desc    Get a single post by ID
// @route   GET /api/safespace/posts/:id
// @access  Private
exports.getPostById = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user.id;

    // Validate postId
    if (!postId || postId === 'undefined' || isNaN(parseInt(postId))) {
      logger.error(`Invalid post ID received: ${postId}`);
      return res.status(400).json({ message: 'Invalid post ID provided' });
    }

    logger.info(`Fetching post with ID: ${postId}`);

    const result = await transaction(async (client) => {
      // Get post with author info
      const postResult = await client.query(`
        SELECT
          p.id,
          p.content,
          p.author_id,
          p.created_at,
          p.updated_at,
          u.name as author_name,
          u.avatar as author_avatar
        FROM
          "pulihHati".posts p
        LEFT JOIN
          "pulihHati".users u ON p.author_id = u.id
        WHERE
          p.id = $1
      `, [postId]);

      if (postResult.rows.length === 0) {
        logger.info(`Post with ID ${postId} not found`);
        return null;
      }

      const post = postResult.rows[0];

      // Get comments for this post
      const commentsResult = await client.query(`
        SELECT
          pc.id,
          pc.content,
          pc.author_id,
          pc.created_at,
          u.name as author_name,
          u.avatar as author_avatar
        FROM
          "pulihHati".post_comments pc
        LEFT JOIN
          "pulihHati".users u ON pc.author_id = u.id
        WHERE
          pc.post_id = $1
        ORDER BY
          pc.created_at ASC
      `, [postId]);

      // Get likes for this post
      const likesResult = await client.query(`
        SELECT
          pl.user_id,
          u.name as user_name
        FROM
          "pulihHati".post_likes pl
        LEFT JOIN
          "pulihHati".users u ON pl.user_id = u.id
        WHERE
          pl.post_id = $1
      `, [postId]);

      // Check if user has bookmarked this post
      const bookmarkResult = await client.query(`
        SELECT EXISTS(
          SELECT 1 FROM "pulihHati".bookmarks
          WHERE post_id = $1 AND user_id = $2
        ) as bookmarked
      `, [postId, userId]);

      return {
        post,
        comments: commentsResult.rows,
        likes: likesResult.rows,
        bookmarked: bookmarkResult.rows[0].bookmarked
      };
    });

    if (!result) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Format post for frontend
    const formattedPost = {
      _id: result.post.id,
      id: result.post.id,
      content: result.post.content,
      created_at: result.post.created_at,
      updated_at: result.post.updated_at,
      author: {
        _id: result.post.author_id,
        id: result.post.author_id,
        name: result.post.author_name || 'Anonymous',
        avatar: result.post.author_avatar || '/static/default-avatar.svg'
      },
      likes: result.likes.map(like => ({
        user: like.user_id,
        _id: like.user_id,
        name: like.user_name || 'Anonymous'
      })),
      comments: result.comments.map(comment => ({
        id: comment.id,
        _id: comment.id,
        content: comment.content,
        created_at: comment.created_at,
        author: {
          id: comment.author_id,
          _id: comment.author_id,
          name: comment.author_name || 'Anonymous',
          avatar: comment.author_avatar || '/static/default-avatar.svg'
        }
      })),
      likes_count: result.likes.length,
      comments_count: result.comments.length,
      bookmarked: result.bookmarked
    };

    logger.info(`Successfully fetched post with ID: ${postId}`);
    return res.status(200).json(formattedPost);
  } catch (error) {
    logger.error(`Error fetching post by ID: ${error.message}`);
    logger.error(`Stack trace: ${error.stack}`);
    return res.status(500).json({ message: 'Failed to fetch post. Please try again.' });
  }
};

// @desc    Like a post
// @route   PUT /api/safespace/posts/:id/like
// @access  Private
exports.likePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user.id;

    // Validate postId
    if (!postId || postId === 'undefined' || isNaN(parseInt(postId))) {
      logger.error(`Invalid post ID received: ${postId}`);
      return res.status(400).json({ message: 'Invalid post ID provided' });
    }

    logger.info(`User ${userId} liking post ${postId}`);

    const result = await transaction(async (client) => {
      // Check if post exists and get post author
      const postResult = await client.query(`
        SELECT * FROM "pulihHati".posts WHERE id = $1
      `, [postId]);

      if (postResult.rows.length === 0) {
        return res.status(404).json({ message: 'Post not found' });
      }

      const post = postResult.rows[0];
      const postAuthorId = post.author_id;

      // Check if user already liked the post
      const likeResult = await client.query(`
        SELECT * FROM "pulihHati".post_likes
        WHERE post_id = $1 AND user_id = $2
      `, [postId, userId]);

      let isLiking = false;

      if (likeResult.rows.length > 0) {
        // User already liked the post, so unlike it
        await client.query(`
          DELETE FROM "pulihHati".post_likes
          WHERE post_id = $1 AND user_id = $2
        `, [postId, userId]);

        logger.info(`User ${userId} unliked post ${postId}`);
      } else {
        // User hasn't liked the post, so like it
        await client.query(`
          INSERT INTO "pulihHati".post_likes (post_id, user_id)
          VALUES ($1, $2)
        `, [postId, userId]);

        isLiking = true;
        logger.info(`User ${userId} liked post ${postId}`);

        // Create notification for post author (only if not liking own post)
        if (userId !== postAuthorId) {
          // Get liker's name for notification message
          const likerResult = await client.query(`
            SELECT name FROM "pulihHati".users WHERE id = $1
          `, [userId]);

          const likerName = likerResult.rows[0]?.name || 'Someone';

          await createNotification(client, {
            userId: postAuthorId,
            actorId: userId,
            type: 'like',
            message: `${likerName} liked your post`,
            postId: postId
          });
        }
      }

      // Get updated likes for this post
      const updatedLikesResult = await client.query(`
        SELECT
          pl.user_id,
          u.name as user_name
        FROM
          "pulihHati".post_likes pl
        LEFT JOIN
          "pulihHati".users u ON pl.user_id = u.id
        WHERE
          pl.post_id = $1
      `, [postId]);

      // Format likes for frontend
      return updatedLikesResult.rows.map(like => ({
        user: like.user_id,
        _id: like.user_id,
        name: like.user_name || 'Anonymous'
      }));
    });

    return res.status(200).json(result);
  } catch (error) {
    logger.error(`Error liking post: ${error.message}`);
    logger.error(`Stack trace: ${error.stack}`);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Add a comment to a post
// @route   POST /api/safespace/posts/:id/comments
// @access  Private
exports.addComment = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user.id;
    const { content } = req.body;

    // Validate postId
    if (!postId || postId === 'undefined' || isNaN(parseInt(postId))) {
      logger.error(`Invalid post ID received: ${postId}`);
      return res.status(400).json({ message: 'Invalid post ID provided' });
    }

    if (!content) {
      return res.status(400).json({ message: 'Comment content is required' });
    }

    logger.info(`Adding comment to post ${postId} by user ${userId}: ${content.substring(0, 30)}...`);

    const result = await transaction(async (client) => {
      // Check if post exists and get post author
      const postCheck = await client.query(`
        SELECT id, author_id FROM "pulihHati".posts WHERE id = $1
      `, [postId]);

      if (postCheck.rows.length === 0) {
        throw new Error('Post not found');
      }

      const post = postCheck.rows[0];
      const postAuthorId = post.author_id;

      // Add comment to post_comments table
      const commentResult = await client.query(`
        INSERT INTO "pulihHati".post_comments (post_id, author_id, content)
        VALUES ($1, $2, $3)
        RETURNING id, content, created_at
      `, [postId, userId, content]);

      // Get commenter info
      const userResult = await client.query(`
        SELECT name, avatar FROM "pulihHati".users WHERE id = $1
      `, [userId]);

      const commenter = userResult.rows[0] || { name: 'Anonymous', avatar: '/static/default-avatar.svg' };

      // Create notification for post author (only if not commenting on own post)
      if (userId !== postAuthorId) {
        await createNotification(client, {
          userId: postAuthorId,
          actorId: userId,
          type: 'comment',
          message: `${commenter.name} commented on your post`,
          postId: postId
        });
      }

      // Get all comments for this post
      const commentsResult = await client.query(`
        SELECT
          pc.id,
          pc.content,
          pc.author_id,
          pc.created_at,
          u.name as author_name,
          u.avatar as author_avatar
        FROM
          "pulihHati".post_comments pc
        LEFT JOIN
          "pulihHati".users u ON pc.author_id = u.id
        WHERE
          pc.post_id = $1
        ORDER BY
          pc.created_at ASC
      `, [postId]);

      // Format all comments for frontend
      return commentsResult.rows.map(comment => ({
        id: comment.id,
        _id: comment.id,
        content: comment.content,
        created_at: comment.created_at,
        author: {
          id: comment.author_id,
          _id: comment.author_id,
          name: comment.author_name || 'Anonymous',
          avatar: comment.author_avatar || '/static/default-avatar.svg'
        }
      }));
    });

    return res.status(200).json(result);
  } catch (error) {
    logger.error(`Error adding comment: ${error.message}`);
    logger.error(`Stack trace: ${error.stack}`);

    if (error.message === 'Post not found') {
      return res.status(404).json({ message: 'Post not found' });
    }

    return res.status(500).json({ message: 'Failed to add comment. Please try again.' });
  }
};

// @desc    Get comments for a specific post
// @route   GET /api/safespace/posts/:id/comments
// @access  Private
exports.getPostComments = async (req, res) => {
  try {
    const postId = req.params.id;

    // Validate postId
    if (!postId || postId === 'undefined' || isNaN(parseInt(postId))) {
      logger.error(`Invalid post ID received: ${postId}`);
      return res.status(400).json({ message: 'Invalid post ID provided' });
    }

    logger.info(`Fetching comments for post ${postId}`);

    const result = await transaction(async (client) => {
      // Check if post exists first
      const postCheck = await client.query(`
        SELECT id FROM "pulihHati".posts WHERE id = $1
      `, [postId]);

      if (postCheck.rows.length === 0) {
        throw new Error('Post not found');
      }

      // Get all comments for this post
      const commentsResult = await client.query(`
        SELECT
          pc.id,
          pc.content,
          pc.author_id,
          pc.created_at,
          u.name as author_name,
          u.avatar as author_avatar
        FROM
          "pulihHati".post_comments pc
        LEFT JOIN
          "pulihHati".users u ON pc.author_id = u.id
        WHERE
          pc.post_id = $1
        ORDER BY
          pc.created_at ASC
      `, [postId]);

      // Format all comments for frontend
      return commentsResult.rows.map(comment => ({
        id: comment.id,
        _id: comment.id,
        content: comment.content,
        created_at: comment.created_at,
        author: {
          id: comment.author_id,
          _id: comment.author_id,
          name: comment.author_name || 'Anonymous',
          avatar: comment.author_avatar || '/static/default-avatar.svg'
        }
      }));
    });

    return res.status(200).json(result);
  } catch (error) {
    logger.error(`Error fetching comments: ${error.message}`);
    logger.error(`Stack trace: ${error.stack}`);

    if (error.message === 'Post not found') {
      return res.status(404).json({ message: 'Post not found' });
    }

    return res.status(500).json({ message: 'Failed to fetch comments. Please try again.' });
  }
};

// @desc    Toggle bookmark on a post
// @route   PUT /api/safespace/posts/:id/bookmark
// @access  Private
exports.toggleBookmark = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user.id;

    // Validate postId
    if (!postId || postId === 'undefined' || isNaN(parseInt(postId))) {
      logger.error(`Invalid post ID received: ${postId}`);
      return res.status(400).json({ message: 'Invalid post ID provided' });
    }

    logger.info(`User ${userId} toggling bookmark on post ${postId}`);

    const result = await transaction(async (client) => {
      // Check if post exists
      const postCheck = await client.query(`
        SELECT id FROM "pulihHati".posts WHERE id = $1
      `, [postId]);

      if (postCheck.rows.length === 0) {
        throw new Error('Post not found');
      }

      // Check if user already bookmarked the post
      const bookmarkCheck = await client.query(`
        SELECT * FROM "pulihHati".bookmarks
        WHERE post_id = $1 AND user_id = $2
      `, [postId, userId]);

      if (bookmarkCheck.rows.length > 0) {
        // User already bookmarked the post, so remove bookmark
        await client.query(`
          DELETE FROM "pulihHati".bookmarks
          WHERE post_id = $1 AND user_id = $2
        `, [postId, userId]);

        logger.info(`User ${userId} removed bookmark from post ${postId}`);
      } else {
        // User hasn't bookmarked the post yet, so add bookmark
        await client.query(`
          INSERT INTO "pulihHati".bookmarks (post_id, user_id)
          VALUES ($1, $2)
        `, [postId, userId]);

        logger.info(`User ${userId} bookmarked post ${postId}`);
      }

      // Get all bookmarked post IDs for this user
      const bookmarksResult = await client.query(`
        SELECT post_id FROM "pulihHati".bookmarks WHERE user_id = $1
      `, [userId]);

      return bookmarksResult.rows.map(row => row.post_id);
    });

    logger.info(`User ${userId} has ${result.length} bookmarked posts`);
    return res.status(200).json(result);
  } catch (error) {
    logger.error(`Error toggling bookmark: ${error.message}`);
    logger.error(`Stack trace: ${error.stack}`);

    if (error.message === 'Post not found') {
      return res.status(404).json({ message: 'Post not found' });
    }

    return res.status(500).json({ message: 'Failed to toggle bookmark. Please try again.' });
  }
};

// @desc    Get bookmarked posts
// @route   GET /api/safespace/bookmarks
// @access  Private
exports.getBookmarkedPosts = async (req, res) => {
  try {
    const userId = req.user.id;
    logger.info(`Fetching bookmarked posts for user ${userId}`);

    const result = await transaction(async (client) => {
      const bookmarksResult = await client.query(`
        SELECT
          p.*,
          u.name as author_name,
          u.avatar as author_avatar,
          (SELECT COUNT(*) FROM "pulihHati".post_likes WHERE post_id = p.id) as like_count,
          (SELECT COUNT(*) FROM "pulihHati".post_comments WHERE post_id = p.id) as comment_count
        FROM "pulihHati".bookmarks b
        JOIN "pulihHati".posts p ON b.post_id = p.id
        JOIN "pulihHati".users u ON p.author_id = u.id
        WHERE b.user_id = $1
        ORDER BY b.created_at DESC
      `, [userId]);

      // Get likes and comments for each bookmarked post separately
      const postsWithLikesAndComments = await Promise.all(bookmarksResult.rows.map(async (post) => {
        // Get likes
        const likesResult = await client.query(`
          SELECT
            pl.user_id,
            u.name as user_name
          FROM
            "pulihHati".post_likes pl
          LEFT JOIN
            "pulihHati".users u ON pl.user_id = u.id
          WHERE
            pl.post_id = $1
        `, [post.id]);

        // Get comments
        const commentsResult = await client.query(`
          SELECT
            pc.id,
            pc.content,
            pc.author_id,
            pc.created_at,
            u.name as author_name,
            u.avatar as author_avatar
          FROM
            "pulihHati".post_comments pc
          LEFT JOIN
            "pulihHati".users u ON pc.author_id = u.id
          WHERE
            pc.post_id = $1
          ORDER BY
            pc.created_at ASC
        `, [post.id]);

        return {
          ...post,
          likes: likesResult.rows.map(like => ({
            user: like.user_id,
            _id: like.user_id,
            name: like.user_name || 'Anonymous'
          })),
          comments: commentsResult.rows.map(comment => ({
            id: comment.id,
            _id: comment.id,
            content: comment.content,
            created_at: comment.created_at,
            author: {
              id: comment.author_id,
              _id: comment.author_id,
              name: comment.author_name || 'Anonymous',
              avatar: comment.author_avatar || '/static/default-avatar.svg'
            }
          }))
        };
      }));

      // Format posts for frontend
      return postsWithLikesAndComments.map(post => ({
        _id: post.id,
        id: post.id,
        content: post.content,
        created_at: post.created_at,
        updated_at: post.updated_at,
        author: {
          _id: post.author_id,
          id: post.author_id,
          name: post.author_name || 'Anonymous',
          avatar: post.author_avatar || '/static/default-avatar.svg'
        },
        likes: post.likes || [],
        comments: post.comments || [], // Now includes actual comments from database
        likes_count: parseInt(post.like_count) || 0,
        comments_count: parseInt(post.comment_count) || 0,
        bookmarked: true // All these posts are bookmarked by definition
      }));
    });

    res.json(result);
  } catch (error) {
    logger.error(`Error fetching bookmarked posts: ${error.message}`);
    logger.error(`Stack trace: ${error.stack}`);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update a post
// @route   PUT /api/safespace/posts/:id
// @access  Private
exports.updatePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user.id;
    const { content } = req.body;

    // Validate postId
    if (!postId || postId === 'undefined' || isNaN(parseInt(postId))) {
      logger.error(`Invalid post ID received: ${postId}`);
      return res.status(400).json({ message: 'Invalid post ID provided' });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Content is required' });
    }

    logger.info(`User ${userId} updating post ${postId}`);

    const result = await transaction(async (client) => {
      // Check if post exists and verify ownership
      const postCheck = await client.query(`
        SELECT id, author_id, content FROM "pulihHati".posts WHERE id = $1
      `, [postId]);

      if (postCheck.rows.length === 0) {
        throw new Error('Post not found');
      }

      const post = postCheck.rows[0];

      // Check if user is the author of the post
      if (post.author_id !== userId) {
        throw new Error('Not authorized to edit this post');
      }

      // Update the post
      const updateResult = await client.query(`
        UPDATE "pulihHati".posts
        SET content = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING id, content, author_id, created_at, updated_at
      `, [content.trim(), postId]);

      const updatedPost = updateResult.rows[0];

      // Get author info
      const userResult = await client.query(`
        SELECT name, avatar FROM "pulihHati".users WHERE id = $1
      `, [userId]);

      const user = userResult.rows[0] || { name: 'Anonymous', avatar: '/static/default-avatar.svg' };

      // Get likes count
      const likesResult = await client.query(`
        SELECT COUNT(*) as count FROM "pulihHati".post_likes WHERE post_id = $1
      `, [postId]);

      // Get comments count
      const commentsResult = await client.query(`
        SELECT COUNT(*) as count FROM "pulihHati".post_comments WHERE post_id = $1
      `, [postId]);

      // Check if current user liked this post
      const userLikeResult = await client.query(`
        SELECT id FROM "pulihHati".post_likes WHERE post_id = $1 AND user_id = $2
      `, [postId, userId]);

      // Check if current user bookmarked this post
      const userBookmarkResult = await client.query(`
        SELECT id FROM "pulihHati".bookmarks WHERE post_id = $1 AND user_id = $2
      `, [postId, userId]);

      // Format post for frontend
      return {
        _id: updatedPost.id,
        id: updatedPost.id,
        content: updatedPost.content,
        created_at: updatedPost.created_at,
        updated_at: updatedPost.updated_at,
        author: {
          _id: userId,
          id: userId,
          name: user.name,
          avatar: user.avatar
        },
        likes: [],
        comments: [],
        likes_count: parseInt(likesResult.rows[0].count),
        comments_count: parseInt(commentsResult.rows[0].count),
        bookmarked: userBookmarkResult.rows.length > 0,
        liked: userLikeResult.rows.length > 0
      };
    });

    logger.info(`Post ${postId} updated successfully by user ${userId}`);
    return res.status(200).json(result);
  } catch (error) {
    logger.error(`Error updating post: ${error.message}`);
    logger.error(`Stack trace: ${error.stack}`);

    if (error.message === 'Post not found') {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (error.message === 'Not authorized to edit this post') {
      return res.status(403).json({ message: 'Not authorized to edit this post' });
    }

    return res.status(500).json({ message: 'Failed to update post. Please try again.' });
  }
};

// @desc    Delete a post
// @route   DELETE /api/safespace/posts/:id
// @access  Private
exports.deletePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user.id;

    // Validate postId
    if (!postId || postId === 'undefined' || isNaN(parseInt(postId))) {
      logger.error(`Invalid post ID received: ${postId}`);
      return res.status(400).json({ message: 'Invalid post ID provided' });
    }

    logger.info(`User ${userId} attempting to delete post ${postId}`);

    const result = await transaction(async (client) => {
      // Check if post exists and verify ownership
      const postCheck = await client.query(`
        SELECT id, author_id FROM "pulihHati".posts WHERE id = $1
      `, [postId]);

      if (postCheck.rows.length === 0) {
        throw new Error('Post not found');
      }

      const post = postCheck.rows[0];

      // Check if user is the author of the post
      if (post.author_id !== userId) {
        throw new Error('Not authorized to delete this post');
      }

      // Delete related data first (foreign key constraints)
      // Delete comments
      await client.query(`
        DELETE FROM "pulihHati".post_comments WHERE post_id = $1
      `, [postId]);

      // Delete likes
      await client.query(`
        DELETE FROM "pulihHati".post_likes WHERE post_id = $1
      `, [postId]);

      // Delete bookmarks
      await client.query(`
        DELETE FROM "pulihHati".bookmarks WHERE post_id = $1
      `, [postId]);

      // Delete notifications related to this post
      await client.query(`
        DELETE FROM "pulihHati".notifications WHERE post_id = $1
      `, [postId]);

      // Finally delete the post
      await client.query(`
        DELETE FROM "pulihHati".posts WHERE id = $1
      `, [postId]);

      return { success: true };
    });

    logger.info(`Post ${postId} deleted successfully by user ${userId}`);
    return res.status(200).json({ message: 'Post deleted successfully' });
  } catch (error) {
    logger.error(`Error deleting post: ${error.message}`);
    logger.error(`Stack trace: ${error.stack}`);

    if (error.message === 'Post not found') {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (error.message === 'Not authorized to delete this post') {
      return res.status(403).json({ message: 'Not authorized to delete this post' });
    }

    return res.status(500).json({ message: 'Failed to delete post. Please try again.' });
  }
};

// @desc    Update user profile (name, email, avatar)
// @route   PUT /api/safespace/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, email } = req.body;

    logger.info(`User ${userId} updating profile via safespace endpoint`);

    // Get current user data using User model
    const User = require('../models/User');
    const currentUser = await User.findById(userId);

    if (!currentUser) {
      logger.warn(`User ${userId} not found`);
      return res.status(404).json({ message: 'User not found' });
    }

    // Prepare update data - only include fields that are provided and not empty
    const updateData = {};

    logger.info(`Received update request - name: "${name}", email: "${email}"`);

    if (name !== undefined && name !== null && name.toString().trim() !== '') {
      updateData.name = name.toString().trim();
      logger.info(`Name will be updated to: "${updateData.name}"`);
    }

    if (email !== undefined && email !== null && email.toString().trim() !== '') {
      const trimmedEmail = email.toString().trim();
      updateData.email = trimmedEmail;
      logger.info(`Email will be updated to: "${updateData.email}"`);

      // Check if email is already taken by another user
      if (trimmedEmail !== currentUser.email) {
        const existingUser = await User.findByEmail(trimmedEmail);
        if (existingUser && existingUser.id !== userId) {
          logger.warn(`Email ${trimmedEmail} already in use by user ${existingUser.id}`);
          return res.status(400).json({ message: 'Email already in use' });
        }
      }
    }

    // If no fields to update, return current user data with stats
    if (Object.keys(updateData).length === 0) {
      logger.info(`No fields to update for user ${userId}, returning current data`);

      // Get fresh profile stats
      const result = await transaction(async (client) => {
        // Get posts count
        const postsResult = await client.query(`
          SELECT COUNT(*) as count FROM "pulihHati".posts WHERE author_id = $1
        `, [userId]);

        // Get comments count
        const commentsResult = await client.query(`
          SELECT COUNT(*) as count FROM "pulihHati".post_comments WHERE author_id = $1
        `, [userId]);

        // Get bookmarks count
        const bookmarksResult = await client.query(`
          SELECT COUNT(*) as count FROM "pulihHati".bookmarks WHERE user_id = $1
        `, [userId]);

        return {
          user: {
            id: currentUser.id,
            _id: currentUser.id,
            name: currentUser.name,
            email: currentUser.email,
            avatar: currentUser.avatar,
            role: currentUser.role
          },
          stats: {
            posts: parseInt(postsResult.rows[0].count) || 0,
            comments: parseInt(commentsResult.rows[0].count) || 0,
            bookmarks: parseInt(bookmarksResult.rows[0].count) || 0
          }
        };
      });

      return res.status(200).json({
        message: 'Profile data retrieved successfully',
        ...result
      });
    }

    logger.info(`Updating profile for user ${userId} with fields:`, updateData);

    // Update user profile
    const updatedUser = await User.update(userId, updateData);

    if (!updatedUser) {
      throw new Error('Failed to update profile');
    }

    // Get fresh profile stats after update
    const result = await transaction(async (client) => {
      // Get posts count
      const postsResult = await client.query(`
        SELECT COUNT(*) as count FROM "pulihHati".posts WHERE author_id = $1
      `, [userId]);

      // Get comments count
      const commentsResult = await client.query(`
        SELECT COUNT(*) as count FROM "pulihHati".post_comments WHERE author_id = $1
      `, [userId]);

      // Get bookmarks count
      const bookmarksResult = await client.query(`
        SELECT COUNT(*) as count FROM "pulihHati".bookmarks WHERE user_id = $1
      `, [userId]);

      return {
        user: {
          id: updatedUser.id,
          _id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          avatar: updatedUser.avatar,
          role: updatedUser.role
        },
        stats: {
          posts: parseInt(postsResult.rows[0].count) || 0,
          comments: parseInt(commentsResult.rows[0].count) || 0,
          bookmarks: parseInt(bookmarksResult.rows[0].count) || 0
        }
      };
    });

    logger.info(`Profile updated successfully for user ${userId}`);

    res.status(200).json({
      message: 'Profile updated successfully',
      ...result
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
