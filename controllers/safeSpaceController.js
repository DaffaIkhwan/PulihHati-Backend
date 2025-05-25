const Post = require('../models/Post');
const logger = require('../config/logger');
const { pool, getClient } = require('../config/db');

// @desc    Get all posts
// @route   GET /api/safespace/posts
// @access  Private
exports.getPosts = async (req, res) => {
  try {
    logger.info('Fetching all posts');
    
    // Create posts table if it doesn't exist
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS "pulihHati".posts (
          id SERIAL PRIMARY KEY,
          content TEXT NOT NULL,
          author_id INTEGER NOT NULL REFERENCES "pulihHati".users(id) ON DELETE CASCADE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      logger.info('Posts table checked/created successfully');
    } catch (err) {
      logger.error(`Error checking/creating posts table: ${err.message}`);
    }
    
    // Get all posts
    const posts = await Post.findAll();
    
    // Log for debugging
    logger.info(`Found ${posts.length} posts`);
    if (posts.length > 0) {
      logger.info(`First post sample: ${JSON.stringify(posts[0])}`);
    }
    
    // Return posts directly
    return res.status(200).json(posts);
  } catch (error) {
    logger.error(`Error fetching posts: ${error.message}`);
    logger.error(`Stack trace: ${error.stack}`);
    
    // Return empty array with status 200 to prevent frontend errors
    return res.status(200).json([]);
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
    
    // Coba buat post
    const post = await Post.create({
      content,
      author_id: req.user.id
    });
    
    logger.info(`Post created successfully with ID: ${post.id}`);
    
    // Format post untuk frontend
    const formattedPost = {
      _id: post.id, // Tambahkan _id untuk kompatibilitas frontend
      id: post.id,
      content: post.content,
      created_at: post.created_at,
      updated_at: post.updated_at,
      author: {
        _id: req.user.id,
        id: req.user.id,
        name: req.user.name || 'Anonymous',
        avatar: req.user.avatar || 'default-avatar.jpg'
      },
      likes: [],
      comments: [],
      likes_count: 0,
      comments_count: 0
    };
    
    logger.info(`Returning formatted post data`);
    return res.status(201).json(formattedPost);
  } catch (error) {
    logger.error(`Error in createPost: ${error.message}`);
    logger.error(`Stack trace: ${error.stack}`);
    
    // Kembalikan respons error
    return res.status(500).json({ 
      message: 'Failed to create post. Please try again.'
    });
  }
};

// @desc    Get a single post by ID
// @route   GET /api/safespace/posts/:id
// @access  Private
exports.getPostById = async (req, res) => {
  try {
    const postId = req.params.id;
    logger.info(`Fetching post with ID: ${postId}`);
    
    const post = await Post.findById(postId);
    
    if (!post) {
      logger.info(`Post with ID ${postId} not found`);
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Format post untuk frontend
    const formattedPost = {
      _id: post.id,
      id: post.id,
      content: post.content,
      created_at: post.created_at,
      updated_at: post.updated_at,
      author: {
        _id: post.author_id,
        id: post.author_id,
        name: post.author_name || 'Anonymous',
        avatar: post.author_avatar || 'default-avatar.jpg'
      },
      likes: post.likes || [],
      comments: post.comments || [],
      likes_count: post.likes ? post.likes.length : 0,
      comments_count: post.comments ? post.comments.length : 0
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
  const client = await getClient();
  try {
    const postId = req.params.id;
    const userId = req.user.id;
    
    logger.info(`User ${userId} toggling like on post ${postId}`);
    
    // Check if post exists
    const postCheck = await client.query(`
      SELECT id FROM "pulihHati".posts WHERE id = $1
    `, [postId]);
    
    if (postCheck.rows.length === 0) {
      logger.info(`Post with ID ${postId} not found`);
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Create post_likes table if it doesn't exist
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS "pulihHati".post_likes (
          id SERIAL PRIMARY KEY,
          post_id INTEGER REFERENCES "pulihHati".posts(id) ON DELETE CASCADE,
          user_id INTEGER REFERENCES "pulihHati".users(id) ON DELETE CASCADE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(post_id, user_id)
        )
      `);
      logger.info('post_likes table checked/created successfully');
    } catch (err) {
      logger.error(`Error checking/creating post_likes table: ${err.message}`);
    }
    
    // Check if user already liked the post
    const likeCheck = await client.query(`
      SELECT * FROM "pulihHati".post_likes 
      WHERE post_id = $1 AND user_id = $2
    `, [postId, userId]);
    
    if (likeCheck.rows.length > 0) {
      // User already liked the post, so unlike it
      await client.query(`
        DELETE FROM "pulihHati".post_likes 
        WHERE post_id = $1 AND user_id = $2
      `, [postId, userId]);
      
      logger.info(`User ${userId} unliked post ${postId}`);
    } else {
      // User hasn't liked the post yet, so like it
      await client.query(`
        INSERT INTO "pulihHati".post_likes (post_id, user_id)
        VALUES ($1, $2)
      `, [postId, userId]);
      
      logger.info(`User ${userId} liked post ${postId}`);
    }
    
    // Get all users who liked this post
    const likesResult = await client.query(`
      SELECT 
        pl.user_id,
        u.name
      FROM 
        "pulihHati".post_likes pl
      LEFT JOIN 
        "pulihHati".users u ON pl.user_id = u.id
      WHERE 
        pl.post_id = $1
    `, [postId]);
    
    // Format likes for frontend
    const likes = likesResult.rows.map(like => ({
      user: like.user_id,
      _id: like.user_id,
      name: like.name || 'Anonymous'
    }));
    
    logger.info(`Returning ${likes.length} likes for post ${postId}`);
    logger.info(`Likes data: ${JSON.stringify(likes)}`);
    
    return res.status(200).json(likes);
  } catch (error) {
    logger.error(`Error liking post: ${error.message}`);
    logger.error(`Stack trace: ${error.stack}`);
    return res.status(500).json({ message: 'Failed to like post. Please try again.' });
  } finally {
    client.release();
  }
};

// @desc    Add a comment to a post
// @route   POST /api/safespace/posts/:id/comments
// @access  Private
exports.addComment = async (req, res) => {
  const client = await getClient();
  try {
    const postId = req.params.id;
    const userId = req.user.id;
    const { content } = req.body;
    
    logger.info(`Adding comment to post ${postId} by user ${userId}: ${content}`);
    
    if (!content) {
      logger.info('Comment content is missing');
      return res.status(400).json({ message: 'Comment content is required' });
    }
    
    // Verify post exists
    const postCheck = await client.query(`
      SELECT id FROM "pulihHati".posts WHERE id = $1
    `, [postId]);
    
    if (postCheck.rows.length === 0) {
      logger.info(`Post with ID ${postId} not found`);
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Add comment to post_comments table
    const result = await client.query(`
      INSERT INTO "pulihHati".post_comments (post_id, author_id, content)
      VALUES ($1, $2, $3)
      RETURNING id, content, created_at
    `, [postId, userId, content]);
    
    const comment = result.rows[0];
    logger.info(`Comment added successfully with ID: ${comment.id}`);
    
    // Get user info for the comment author
    const userInfo = await client.query(`
      SELECT name, avatar FROM "pulihHati".users WHERE id = $1
    `, [userId]);
    
    // Format the new comment with complete author info
    const formattedComment = {
      id: comment.id,
      _id: comment.id, // Add _id field for frontend compatibility
      content: comment.content,
      created_at: comment.created_at,
      author: {
        id: userId,
        _id: userId, // Add _id field for frontend compatibility
        name: userInfo.rows[0]?.name || 'Anonymous',
        avatar: userInfo.rows[0]?.avatar || 'default-avatar.jpg'
      }
    };
    
    // Log the formatted comment for debugging
    logger.info(`Formatted comment: ${JSON.stringify(formattedComment)}`);
    
    // Return just the new comment instead of all comments
    return res.status(201).json([formattedComment]);
  } catch (error) {
    logger.error(`Error in addComment controller: ${error.message}`);
    logger.error(`Stack trace: ${error.stack}`);
    return res.status(500).json({ message: 'Failed to add comment. Please try again.' });
  } finally {
    client.release();
  }
};

// @desc    Toggle bookmark on a post
// @route   PUT /api/safespace/posts/:id/bookmark
// @access  Private
exports.toggleBookmark = async (req, res) => {
  const client = await getClient();
  try {
    const postId = req.params.id;
    const userId = req.user.id;
    
    logger.info(`User ${userId} toggling bookmark on post ${postId}`);
    
    // Check if post exists
    const postCheck = await client.query(`
      SELECT id FROM "pulihHati".posts WHERE id = $1
    `, [postId]);
    
    if (postCheck.rows.length === 0) {
      logger.info(`Post with ID ${postId} not found`);
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Create bookmarks table if it doesn't exist
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS "pulihHati".bookmarks (
          id SERIAL PRIMARY KEY,
          post_id INTEGER REFERENCES "pulihHati".posts(id) ON DELETE CASCADE,
          user_id INTEGER REFERENCES "pulihHati".users(id) ON DELETE CASCADE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(post_id, user_id)
        )
      `);
      logger.info('bookmarks table checked/created successfully');
    } catch (err) {
      logger.error(`Error checking/creating bookmarks table: ${err.message}`);
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
    
    // Get all posts bookmarked by this user
    const bookmarkedPostsResult = await client.query(`
      SELECT post_id FROM "pulihHati".bookmarks 
      WHERE user_id = $1
    `, [userId]);
    
    // Format bookmarked posts for frontend (just return the IDs)
    const bookmarkedPosts = bookmarkedPostsResult.rows.map(row => row.post_id);
    
    logger.info(`User ${userId} has ${bookmarkedPosts.length} bookmarked posts`);
    logger.info(`Bookmarked posts: ${JSON.stringify(bookmarkedPosts)}`);
    
    return res.status(200).json(bookmarkedPosts);
  } catch (error) {
    logger.error(`Error toggling bookmark: ${error.message}`);
    logger.error(`Stack trace: ${error.stack}`);
    return res.status(500).json({ message: 'Failed to bookmark post. Please try again.' });
  } finally {
    client.release();
  }
};

// @desc    Get bookmarked posts
// @route   GET /api/safespace/bookmarks
// @access  Private
exports.getBookmarkedPosts = async (req, res) => {
  try {
    const userId = req.user.id;
    logger.info(`Fetching bookmarked posts for user ${userId}`);
    
    // Gunakan model Post untuk mendapatkan bookmark
    const posts = await Post.getBookmarkedPosts(userId);
    
    logger.info(`Returning ${posts.length} formatted bookmarked posts`);
    return res.status(200).json(posts);
  } catch (error) {
    logger.error(`Error fetching bookmarked posts: ${error.message}`);
    logger.error(`Stack trace: ${error.stack}`);
    return res.status(200).json([]); // Return empty array on error
  } finally {
    client.release();
  }
};
