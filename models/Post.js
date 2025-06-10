const { pool, getClient } = require('../config/db');
const logger = require('../config/logger');

class Post {
  // Create a new post
  static async create({ content, author_id, is_anonymous }) {
    try {
      logger.info(`Creating post with content: ${content.substring(0, 30)}...`);
      
      console.log('DEBUG isAnonymous dari FE:', is_anonymous, typeof is_anonymous);
      
      // Gunakan schema pulihHati (dengan H kapital)
      const result = await pool.query(`
        INSERT INTO "pulihHati".posts (content, author_id, is_anonymous) 
        VALUES ($1, $2, $3) 
        RETURNING id, content, author_id, is_anonymous, created_at, updated_at
      `, [content, author_id, is_anonymous]);
      
      logger.info(`Post created successfully with ID: ${result.rows[0].id}`);
      
      return result.rows[0];
    } catch (error) {
      logger.error(`Error in Post.create: ${error.message}`);
      logger.error(`Stack trace: ${error.stack}`);
      throw error;
    }
  }

  // Find all posts with comments and likes - OPTIMIZED VERSION
  static async findAll() {
    const client = await getClient();
    try {
      logger.info('Finding all posts with optimized query');
      
      // Get all posts in a single query
      const postsResult = await client.query(`
        SELECT 
          p.id, 
          p.content, 
          p.author_id, 
          p.is_anonymous,
          p.created_at, 
          p.updated_at,
          u.name as author_name,
          u.avatar as author_avatar,
          (SELECT COUNT(*) FROM "pulihHati".post_comments WHERE post_id = p.id) as comments_count,
          (SELECT COUNT(*) FROM "pulihHati".post_likes WHERE post_id = p.id) as likes_count
        FROM 
          "pulihHati".posts p
        LEFT JOIN 
          "pulihHati".users u ON p.author_id = u.id
        ORDER BY 
          p.created_at DESC
      `);
      
      logger.info(`Found ${postsResult.rows.length} posts`);
      
      // Format posts untuk frontend
      const posts = await Promise.all(postsResult.rows.map(async post => {
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
        `, [post.id]);
        
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
        `, [post.id]);
        
        return {
          _id: post.id,
          id: post.id,
          content: post.content,
          isAnonymous: post.is_anonymous,
          created_at: post.created_at,
          updated_at: post.updated_at,
          author: {
            _id: post.author_id,
            id: post.author_id,
            name: post.author_name || 'Anonymous',
            avatar: post.author_avatar || null
          },
          likes: likesResult.rows.map(like => ({
            user: like.user_id,
            _id: like.user_id,
            name: like.user_name
          })),
          comments: commentsResult.rows.map(comment => ({
            id: comment.id,
            content: comment.content,
            created_at: comment.created_at,
            author: {
              id: comment.author_id,
              _id: comment.author_id,
              name: comment.author_name || 'Anonymous',
              avatar: comment.author_avatar || null
            }
          })),
          likes_count: parseInt(post.likes_count) || 0,
          comments_count: parseInt(post.comments_count) || 0
        };
      }));
      
      return posts;
    } catch (error) {
      logger.error(`Error in Post.findAll: ${error.message}`);
      logger.error(`Stack trace: ${error.stack}`);
      return [];
    } finally {
      client.release();
    }
  }

  // Get bookmarked posts
  static async getBookmarkedPosts(userId) {
    const client = await getClient();
    try {
      logger.info(`Finding bookmarked posts for user ${userId}`);
      
      // Perbaiki schema menjadi "pulihHati" (dengan H kapital) untuk konsistensi
      const result = await client.query(`
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
        JOIN 
          "pulihHati".bookmarks b ON p.id = b.post_id
        LEFT JOIN 
          "pulihHati".users u ON p.author_id = u.id
        WHERE 
          b.user_id = $1
        ORDER BY 
          b.created_at DESC
      `, [userId]);
      
      logger.info(`Found ${result.rows.length} bookmarked posts for user ${userId}`);
      
      // Format posts untuk frontend
      const formattedPosts = result.rows.map(post => ({
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
        likes: [],
        comments: [],
        likes_count: 0,
        comments_count: 0
      }));
      
      return formattedPosts;
    } catch (error) {
      logger.error(`Error in Post.getBookmarkedPosts: ${error.message}`);
      logger.error(`Stack trace: ${error.stack}`);
      return [];
    } finally {
      client.release();
    }
  }

  // Find post by ID with comments and likes
  static async findById(id) {
    const client = await getClient();
    try {
      logger.info(`Finding post with ID: ${id}`);
      
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
      `, [id]);
      
      if (postResult.rows.length === 0) {
        logger.info(`Post with ID ${id} not found`);
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
      `, [id]);
      
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
      `, [id]);
      
      // Format post for frontend
      const formattedPost = {
        _id: post.id,
        id: post.id,
        content: post.content,
        isAnonymous: post.is_anonymous,
        created_at: post.created_at,
        updated_at: post.updated_at,
        author: {
          _id: post.author_id,
          id: post.author_id,
          name: post.author_name || 'Anonymous',
          avatar: post.author_avatar || null
        },
        likes: likesResult.rows.map(like => ({
          user: like.user_id,
          _id: like.user_id,
          name: like.user_name
        })),
        comments: commentsResult.rows.map(comment => ({
          id: comment.id,
          content: comment.content,
          created_at: comment.created_at,
          author: {
            id: comment.author_id,
            _id: comment.author_id,
            name: comment.author_name || 'Anonymous',
            avatar: comment.author_avatar || null
          }
        })),
        likes_count: likesResult.rows.length,
        comments_count: commentsResult.rows.length
      };
      
      logger.info(`Found post with ID ${id}, ${formattedPost.comments.length} comments, and ${formattedPost.likes.length} likes`);
      
      return formattedPost;
    } catch (error) {
      logger.error(`Error in Post.findById: ${error.message}`);
      logger.error(`Stack trace: ${error.stack}`);
      throw error;
    } finally {
      client.release();
    }
  }

  // Add comment to post
  static async addComment(postId, userId, content) {
    try {
      logger.info(`Adding comment to post ${postId} by user ${userId}`);
      
      // Create post_comments table if it doesn't exist
      try {
        await pool.query(`
          CREATE TABLE IF NOT EXISTS "pulihHati".post_comments (
            id SERIAL PRIMARY KEY,
            post_id INTEGER NOT NULL REFERENCES "pulihHati".posts(id) ON DELETE CASCADE,
            author_id INTEGER NOT NULL REFERENCES "pulihHati".users(id) ON DELETE CASCADE,
            content TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);
        logger.info('post_comments table checked/created successfully');
      } catch (err) {
        logger.error(`Error checking/creating post_comments table: ${err.message}`);
      }
      
      // Insert comment
      const result = await pool.query(`
        INSERT INTO "pulihHati".post_comments (post_id, author_id, content)
        VALUES ($1, $2, $3)
        RETURNING id, content, created_at
      `, [postId, userId, content]);
      
      const comment = result.rows[0];
      
      // Get user info
      const userResult = await pool.query(`
        SELECT name, avatar FROM "pulihHati".users WHERE id = $1
      `, [userId]);
      
      const user = userResult.rows[0] || { name: 'Anonymous', avatar: null };
      
      // Format comment
      const formattedComment = {
        id: comment.id,
        content: comment.content,
        created_at: comment.created_at,
        author: {
          id: userId,
          _id: userId,
          name: user.name,
          avatar: user.avatar
        }
      };
      
      logger.info(`Comment added successfully with ID: ${comment.id}`);
      
      return formattedComment;
    } catch (error) {
      logger.error(`Error in Post.addComment: ${error.message}`);
      logger.error(`Stack trace: ${error.stack}`);
      throw error;
    }
  }
}

module.exports = Post;
