const { query, transaction } = require('../config/db');
const logger = require('../config/logger');
const { createNotification } = require('./notificationController');
const cache = require('../config/redis');

// @desc    Get all posts (public access - read-only)
// @route   GET /api/safespace/posts/public
// @access  Public
exports.getPublicPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Create cache key for public posts
    const cacheKey = `public_posts:${page}:${limit}`;

    // Try to get from cache first
    const cachedData = await cache.getCache(cacheKey);
    if (cachedData) {
      logger.info(`Cache hit for public posts page ${page}, limit ${limit}`);
      return res.json(cachedData);
    }

    logger.info(`Cache miss - Fetching public posts page ${page}, limit ${limit}`);

    const result = await transaction(async (client) => {
      // Count total posts
      const countResult = await client.query(`
        SELECT COUNT(*) FROM "pulihHati".posts
      `);

      const total = parseInt(countResult.rows[0].count);

      // Get posts without user-specific data
      const postsResult = await client.query(`
        SELECT
          p.id,
          p.content,
          p.author_id,
          p.is_anonymous,
          p.created_at,
          p.updated_at,
          u.name as author_name,
          u.avatar as author_avatar
        FROM "pulihHati".posts p
        LEFT JOIN "pulihHati".users u ON p.author_id = u.id
        ORDER BY p.created_at DESC
        LIMIT $1 OFFSET $2
      `, [limit, offset]);

      // Get post IDs for batch queries
      const postIds = postsResult.rows.map(post => post.id);

      if (postIds.length === 0) {
        return { posts: [], pagination: { page, limit, total: 0, pages: 0 } };
      }

      // Batch query for likes and comments count only (no user-specific data)
      const [likesResult, commentsResult] = await Promise.all([
        client.query(`
          SELECT post_id, COUNT(*) as like_count
          FROM "pulihHati".post_likes
          WHERE post_id = ANY($1)
          GROUP BY post_id
        `, [postIds]),

        client.query(`
          SELECT post_id, COUNT(*) as comment_count
          FROM "pulihHati".post_comments
          WHERE post_id = ANY($1)
          GROUP BY post_id
        `, [postIds])
      ]);

      // Create lookup maps
      const likesMap = {};
      const commentsMap = {};

      likesResult.rows.forEach(row => {
        likesMap[row.post_id] = parseInt(row.like_count);
      });

      commentsResult.rows.forEach(row => {
        commentsMap[row.post_id] = parseInt(row.comment_count);
      });

      // Format posts for public access (no user-specific data)
      const posts = postsResult.rows.map(post => ({
        _id: post.id,
        id: post.id,
        content: post.content,
        created_at: post.created_at,
        updated_at: post.updated_at,
        author: post.is_anonymous ? {
          _id: 'anonymous',
          id: 'anonymous',
          name: 'Anonymous',
          avatar: null
        } : {
          _id: post.author_id,
          id: post.author_id,
          name: post.author_name,
          avatar: post.author_avatar
        },
        likes: [], // Empty for public access
        comments: [], // Empty for public access
        likes_count: likesMap[post.id] || 0,
        comments_count: commentsMap[post.id] || 0,
        bookmarked: false, // Always false for public access
        liked: false // Always false for public access
      }));

      const pages = Math.ceil(total / limit);

      return {
        posts,
        pagination: {
          page,
          limit,
          total,
          pages,
          hasNext: page < pages,
          hasPrev: page > 1
        }
      };
    });

    // Cache the result for 5 minutes
    await cache.setCache(cacheKey, result, 300);

    logger.info(`Successfully fetched ${result.posts.length} public posts for page ${page}`);
    res.json(result); // Return full result with pagination info

  } catch (error) {
    logger.error(`Error in getPublicPosts: ${error.message}`);
    logger.error(`Stack trace: ${error.stack}`);
    res.status(500).json({
      message: 'Failed to fetch posts. Please try again later.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get all posts
// @route   GET /api/safespace/posts
// @access  Private
exports.getPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const userId = req.user.id;

    // Create cache key
    const cacheKey = `posts:${userId}:${page}:${limit}`;

    // Try to get from cache first
    const cachedData = await cache.getCache(cacheKey);
    if (cachedData) {
      logger.info(`Cache hit for posts page ${page}, limit ${limit}`);
      return res.json(cachedData);
    }

    logger.info(`Cache miss - Fetching posts page ${page}, limit ${limit}`);

    // Gunakan satu transaksi untuk semua query
    const result = await transaction(async (client) => {
      // Count total posts
      const countResult = await client.query(`
        SELECT COUNT(*) FROM "pulihHati".posts
      `);

      const total = parseInt(countResult.rows[0].count);

      // Optimized query - get posts first, then aggregate data
      const postsResult = await client.query(`
        SELECT
          p.id,
          p.content,
          p.author_id,
          p.is_anonymous,
          p.created_at,
          p.updated_at,
          u.name as author_name,
          u.avatar as author_avatar
        FROM "pulihHati".posts p
        LEFT JOIN "pulihHati".users u ON p.author_id = u.id
        ORDER BY p.created_at DESC
        LIMIT $1 OFFSET $2
      `, [limit, offset]);

      // Get post IDs for batch queries
      const postIds = postsResult.rows.map(post => post.id);

      if (postIds.length === 0) {
        return { posts: [], pagination: { page, limit, total: 0, pages: 0 } };
      }

      // Batch query for likes, comments, and bookmarks
      const [likesResult, commentsResult, bookmarksResult] = await Promise.all([
        client.query(`
          SELECT post_id, COUNT(*) as like_count
          FROM "pulihHati".post_likes
          WHERE post_id = ANY($1)
          GROUP BY post_id
        `, [postIds]),

        client.query(`
          SELECT post_id, COUNT(*) as comment_count
          FROM "pulihHati".post_comments
          WHERE post_id = ANY($1)
          GROUP BY post_id
        `, [postIds]),

        client.query(`
          SELECT post_id
          FROM "pulihHati".bookmarks
          WHERE post_id = ANY($1) AND user_id = $2
        `, [postIds, userId])
      ]);

      // Create lookup maps for O(1) access
      const likeCounts = new Map(likesResult.rows.map(row => [row.post_id, parseInt(row.like_count)]));
      const commentCounts = new Map(commentsResult.rows.map(row => [row.post_id, parseInt(row.comment_count)]));
      const bookmarkedSet = new Set(bookmarksResult.rows.map(row => row.post_id));

      // Get detailed likes and comments for each post
      const postsWithLikesAndComments = await Promise.all(postsResult.rows.map(async (post) => {
        // Use cached counts for performance
        const likeCount = likeCounts.get(post.id) || 0;
        const commentCount = commentCounts.get(post.id) || 0;
        const isBookmarked = bookmarkedSet.has(post.id);

        // Always get detailed likes and comments (even if empty) to ensure consistency
        const [likesDetailResult, commentsDetailResult] = await Promise.all([
          client.query(`
            SELECT pl.user_id, u.name as user_name
            FROM "pulihHati".post_likes pl
            LEFT JOIN "pulihHati".users u ON pl.user_id = u.id
            WHERE pl.post_id = $1
          `, [post.id]),

          client.query(`
            SELECT pc.id, pc.content, pc.author_id, pc.created_at, u.name as author_name, u.avatar as author_avatar
            FROM "pulihHati".post_comments pc
            LEFT JOIN "pulihHati".users u ON pc.author_id = u.id
            WHERE pc.post_id = $1
            ORDER BY pc.created_at ASC
          `, [post.id])
        ]);

        const detailedLikes = likesDetailResult.rows.map(like => ({
          user: like.user_id,
          _id: like.user_id,
          name: like.user_name || 'Anonymous'
        }));

        const detailedComments = commentsDetailResult.rows.map(comment => ({
          id: comment.id,
          _id: comment.id,
          content: comment.content,
          created_at: comment.created_at,
          author: {
            id: comment.author_id,
            _id: comment.author_id,
            name: comment.author_name || 'Anonymous',
            avatar: comment.author_avatar || null
          }
        }));

        return {
          ...post,
          like_count: likeCount,
          comment_count: commentCount,
          bookmarked: isBookmarked,
          likes: detailedLikes,
          comments: detailedComments
        };
      }));

      // Format posts for frontend
      const posts = postsWithLikesAndComments.map(post => ({
        _id: post.id,
        id: post.id,
        content: post.content,
        isAnonymous: post.is_anonymous,
        created_at: post.created_at,
        updated_at: post.updated_at,
        author: {
          _id: post.author_id,
          id: post.author_id,
          name: post.is_anonymous ? 'Anonim' : (post.author_name || 'Anonymous'),
          avatar: post.is_anonymous ? null : (post.author_avatar || null)
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

    // Cache the result for 2 minutes
    await cache.setCache(cacheKey, result.posts, 120);

    logger.info(`Returning ${result.posts.length} posts (cached for 2 minutes)`);
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
    // Accept both is_anonymous and isAnonymous for compatibility
    const { content, is_anonymous, isAnonymous } = req.body;
    const anonymousFlag = is_anonymous !== undefined ? is_anonymous : isAnonymous;

    console.log('DEBUG anonymous flag dari FE:', {
      is_anonymous,
      isAnonymous,
      anonymousFlag,
      type: typeof anonymousFlag
    });

    if (!content) {
      return res.status(400).json({ message: 'Content is required' });
    }

    logger.info(`Creating post with content: ${content.substring(0, 30)}... (anonymous: ${anonymousFlag})`);

    const post = await transaction(async (client) => {
      // Explicitly convert to boolean and handle various input types
      const isAnonymousPost = Boolean(anonymousFlag === true || anonymousFlag === 'true' || anonymousFlag === 1);

      // Create post with proper WIB timezone handling
      const wibTime = new Date(new Date().getTime() + (7 * 60 * 60 * 1000));
      const result = await client.query(`
        INSERT INTO "pulihHati".posts (content, author_id, is_anonymous, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $4)
        RETURNING id, content, author_id, created_at, updated_at, is_anonymous
      `, [content, req.user.id, isAnonymousPost, wibTime]);

      const newPost = result.rows[0];

      // Get user info
      const userResult = await client.query(`
        SELECT name, avatar FROM "pulihHati".users WHERE id = $1
      `, [req.user.id]);

      const user = userResult.rows[0] || { name: 'Anonymous', avatar: null };

      // Format post for frontend
      return {
        _id: newPost.id,
        id: newPost.id,
        content: newPost.content,
        isAnonymous: newPost.is_anonymous,
        created_at: newPost.created_at,
        updated_at: newPost.updated_at,
        author: {
          _id: req.user.id,
          id: req.user.id,
          name: newPost.is_anonymous ? 'Anonim' : user.name,
          avatar: newPost.is_anonymous ? null : user.avatar
        },
        likes: [],
        comments: [],
        likes_count: 0,
        comments_count: 0,
        bookmarked: false
      };
    });

    // Invalidate posts cache for all users since new post affects everyone
    await cache.invalidateCache('posts:*');

    logger.info(`Post created successfully with ID: ${post.id} (anonymous: ${post.isAnonymous})`);
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
          p.is_anonymous,
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
      isAnonymous: result.post.is_anonymous,
      created_at: result.post.created_at,
      updated_at: result.post.updated_at,
      author: {
        _id: result.post.author_id,
        id: result.post.author_id,
        name: result.post.is_anonymous ? 'Anonim' : (result.post.author_name || 'Anonymous'),
        avatar: result.post.is_anonymous ? null : (result.post.author_avatar || null)
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
          avatar: comment.author_avatar || null
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

// @desc    Get a single post by ID (public access - read-only)
// @route   GET /api/safespace/posts/:id/public
// @access  Public
exports.getPublicPostById = async (req, res) => {
  try {
    const postId = req.params.id;

    // Validate postId
    if (!postId || postId === 'undefined' || isNaN(parseInt(postId))) {
      logger.error(`Invalid post ID received: ${postId}`);
      return res.status(400).json({ message: 'Invalid post ID provided' });
    }

    logger.info(`Fetching public post with ID: ${postId}`);

    const result = await transaction(async (client) => {
      // Get post with author info
      const postResult = await client.query(`
        SELECT
          p.id,
          p.content,
          p.author_id,
          p.is_anonymous,
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

      // Get comments for this post (without user-specific data)
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

      // Get likes count only (no user-specific data)
      const likesCountResult = await client.query(`
        SELECT COUNT(*) as like_count
        FROM "pulihHati".post_likes
        WHERE post_id = $1
      `, [postId]);

      return {
        post,
        comments: commentsResult.rows,
        likes_count: parseInt(likesCountResult.rows[0].like_count)
      };
    });

    if (!result) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Format post for public access (no user-specific data)
    const formattedPost = {
      _id: result.post.id,
      id: result.post.id,
      content: result.post.content,
      isAnonymous: result.post.is_anonymous,
      created_at: result.post.created_at,
      updated_at: result.post.updated_at,
      author: result.post.is_anonymous ? {
        _id: 'anonymous',
        id: 'anonymous',
        name: 'Anonymous',
        avatar: null
      } : {
        _id: result.post.author_id,
        id: result.post.author_id,
        name: result.post.author_name || 'Anonymous',
        avatar: result.post.author_avatar || null
      },
      likes: [], // Empty for public access
      comments: result.comments.map(comment => ({
        id: comment.id,
        _id: comment.id,
        content: comment.content,
        created_at: comment.created_at,
        author: {
          id: comment.author_id,
          _id: comment.author_id,
          name: comment.author_name || 'Anonymous',
          avatar: comment.author_avatar || null
        }
      })),
      likes_count: result.likes_count,
      comments_count: result.comments.length,
      bookmarked: false, // Always false for public access
      liked: false // Always false for public access
    };

    logger.info(`Successfully fetched public post with ID: ${postId}`);
    return res.status(200).json(formattedPost);
  } catch (error) {
    logger.error(`Error fetching public post by ID: ${error.message}`);
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

    // Invalidate posts cache since likes have changed
    await cache.invalidateCache('posts:*');

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

      // Check for duplicate comments (same user, same post, same content within last 30 seconds)
      const duplicateCheck = await client.query(`
        SELECT id FROM "pulihHati".post_comments
        WHERE post_id = $1 AND author_id = $2 AND content = $3
        AND created_at > NOW() - INTERVAL '30 seconds'
        LIMIT 1
      `, [postId, userId, content]);

      if (duplicateCheck.rows.length > 0) {
        logger.warn(`Duplicate comment detected for user ${userId} on post ${postId}`);
        throw new Error('Duplicate comment detected. Please wait before commenting again.');
      }

      // Add comment to post_comments table with proper WIB timezone handling
      const wibTime = new Date(new Date().getTime() + (7 * 60 * 60 * 1000));
      const commentResult = await client.query(`
        INSERT INTO "pulihHati".post_comments (post_id, author_id, content, created_at)
        VALUES ($1, $2, $3, $4)
        RETURNING id, content, created_at
      `, [postId, userId, content, wibTime]);

      // Get commenter info
      const userResult = await client.query(`
        SELECT name, avatar FROM "pulihHati".users WHERE id = $1
      `, [userId]);

      const commenter = userResult.rows[0] || { name: 'Anonymous', avatar: null };

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
          avatar: comment.author_avatar || null
        }
      }));
    });

    // Invalidate posts cache since comments have changed
    await cache.invalidateCache('posts:*');

    return res.status(200).json(result);
  } catch (error) {
    logger.error(`Error adding comment: ${error.message}`);
    logger.error(`Stack trace: ${error.stack}`);

    if (error.message === 'Post not found') {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (error.message.includes('Duplicate comment detected')) {
      return res.status(429).json({ message: error.message });
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
          avatar: comment.author_avatar || null
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
              avatar: comment.author_avatar || null
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
          avatar: post.author_avatar || null
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

      // Update the post with WIB timezone
      const wibTime = new Date(new Date().getTime() + (7 * 60 * 60 * 1000));
      const updateResult = await client.query(`
        UPDATE "pulihHati".posts
        SET content = $1, updated_at = $2
        WHERE id = $3
        RETURNING id, content, author_id, created_at, updated_at, is_anonymous
      `, [content.trim(), wibTime, postId]);

      const updatedPost = updateResult.rows[0];

      // Get author info
      const userResult = await client.query(`
        SELECT name, avatar FROM "pulihHati".users WHERE id = $1
      `, [userId]);

      const user = userResult.rows[0] || { name: 'Anonymous', avatar: null };

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
        SELECT post_id FROM "pulihHati".post_likes WHERE post_id = $1 AND user_id = $2
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
          avatar: user.avatar || null
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

// @desc    Update a comment
// @route   PUT /api/safespace/comments/:id
// @access  Private
exports.updateComment = async (req, res) => {
  try {
    const commentId = req.params.id;
    const userId = req.user.id;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Comment content is required' });
    }

    logger.info(`User ${userId} updating comment ${commentId}`);

    const result = await transaction(async (client) => {
      // Check if comment exists and verify ownership
      const commentCheck = await client.query(`
        SELECT id, author_id, post_id, content FROM "pulihHati".post_comments WHERE id = $1
      `, [commentId]);

      if (commentCheck.rows.length === 0) {
        throw new Error('Comment not found');
      }

      const comment = commentCheck.rows[0];

      // Check if user is the author of the comment
      if (comment.author_id !== userId) {
        throw new Error('Not authorized to edit this comment');
      }

      // Update the comment with WIB timezone
      const wibTime = new Date(new Date().getTime() + (7 * 60 * 60 * 1000));
      const updateResult = await client.query(`
        UPDATE "pulihHati".post_comments
        SET content = $1, updated_at = $2
        WHERE id = $3
        RETURNING id, content, author_id, post_id, created_at, updated_at
      `, [content.trim(), wibTime, commentId]);

      const updatedComment = updateResult.rows[0];

      // Get user info
      const userResult = await client.query(`
        SELECT name, avatar FROM "pulihHati".users WHERE id = $1
      `, [userId]);

      const user = userResult.rows[0] || { name: 'Anonymous', avatar: null };

      return {
        id: updatedComment.id,
        _id: updatedComment.id,
        content: updatedComment.content,
        created_at: updatedComment.created_at,
        updated_at: updatedComment.updated_at,
        author: {
          id: updatedComment.author_id,
          _id: updatedComment.author_id,
          name: user.name,
          avatar: user.avatar
        }
      };
    });

    // Invalidate posts cache since comment has changed
    await cache.invalidateCache('posts:*');

    logger.info(`Comment ${commentId} updated successfully`);
    return res.status(200).json(result);
  } catch (error) {
    logger.error(`Error updating comment: ${error.message}`);

    if (error.message === 'Comment not found') {
      return res.status(404).json({ message: 'Comment not found' });
    }
    if (error.message === 'Not authorized to edit this comment') {
      return res.status(403).json({ message: 'Not authorized to edit this comment' });
    }

    return res.status(500).json({ message: 'Failed to update comment. Please try again.' });
  }
};

// @desc    Delete a comment
// @route   DELETE /api/safespace/comments/:id
// @access  Private
exports.deleteComment = async (req, res) => {
  try {
    const commentId = req.params.id;
    const userId = req.user.id;

    logger.info(`User ${userId} attempting to delete comment ${commentId}`);

    const result = await transaction(async (client) => {
      // Check if comment exists and get comment and post info
      const commentCheck = await client.query(`
        SELECT
          pc.id,
          pc.author_id,
          pc.post_id,
          p.author_id as post_author_id
        FROM "pulihHati".post_comments pc
        JOIN "pulihHati".posts p ON pc.post_id = p.id
        WHERE pc.id = $1
      `, [commentId]);

      if (commentCheck.rows.length === 0) {
        throw new Error('Comment not found');
      }

      const comment = commentCheck.rows[0];

      // Check if user is the author of the comment OR the owner of the post
      const isCommentAuthor = comment.author_id === userId;
      const isPostOwner = comment.post_author_id === userId;

      if (!isCommentAuthor && !isPostOwner) {
        throw new Error('Not authorized to delete this comment');
      }

      // Delete the comment
      await client.query(`
        DELETE FROM "pulihHati".post_comments WHERE id = $1
      `, [commentId]);

      return {
        success: true,
        commentId: commentId,
        postId: comment.post_id,
        deletedBy: isCommentAuthor ? 'author' : 'post_owner'
      };
    });

    // Invalidate posts cache since comment has been deleted
    await cache.invalidateCache('posts:*');

    logger.info(`Comment ${commentId} deleted successfully by ${result.deletedBy}`);
    return res.status(200).json(result);
  } catch (error) {
    logger.error(`Error deleting comment: ${error.message}`);

    if (error.message === 'Comment not found') {
      return res.status(404).json({ message: 'Comment not found' });
    }
    if (error.message === 'Not authorized to delete this comment') {
      return res.status(403).json({ message: 'Not authorized to delete this comment' });
    }

    return res.status(500).json({ message: 'Failed to delete comment. Please try again.' });
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
