const { pool } = require('./database');
const logger = require('./logger');
const bcrypt = require('bcryptjs');

// SQL untuk membuat tabel
const createTables = async () => {
  try {
    // Periksa apakah schema pulihHati sudah ada
    const schemaCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.schemata 
        WHERE schema_name = 'pulihHati'
      );
    `);
    
    // Jika schema belum ada, buat schema
    if (!schemaCheck.rows[0].exists) {
      logger.info('Schema pulihHati does not exist, creating it...');
      await pool.query(`CREATE SCHEMA IF NOT EXISTS "pulihHati"`);
      logger.info('Schema pulihHati created successfully');
    }
    
    // Periksa apakah tabel users sudah ada
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'pulihHati' 
        AND table_name = 'users'
      );
    `);
    
    // Jika tabel sudah ada, skip pembuatan tabel
    if (tableCheck.rows[0].exists) {
      logger.info('Tables already exist, skipping table creation');
      return;
    }
    
    // Buat tabel users
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "pulihHati".users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(100) NOT NULL,
        avatar VARCHAR(255) DEFAULT 'default-avatar.jpg',
        role VARCHAR(20) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Buat tabel posts
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "pulihHati".posts (
        id SERIAL PRIMARY KEY,
        content TEXT NOT NULL,
        author_id INTEGER REFERENCES "pulihHati".users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Buat tabel post_likes jika belum ada
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "pulihHati".post_likes (
        id SERIAL PRIMARY KEY,
        post_id INTEGER REFERENCES "pulihHati".posts(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES "pulihHati".users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(post_id, user_id)
      )
    `);

    // Buat tabel post_comments jika belum ada
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

    // Buat tabel bookmarks jika belum ada
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "pulihHati".bookmarks (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES "pulihHati".users(id) ON DELETE CASCADE,
        post_id INTEGER REFERENCES "pulihHati".posts(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, post_id)
      )
    `);
    
    // Buat tabel chat_sessions
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "pulihHati".chat_sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES "pulihHati".users(id) ON DELETE CASCADE,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Buat tabel messages
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "pulihHati".messages (
        id SERIAL PRIMARY KEY,
        session_id INTEGER REFERENCES "pulihHati".chat_sessions(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        sender VARCHAR(20) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create comments table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "pulihHati".comments (
        id SERIAL PRIMARY KEY,
        post_id INTEGER NOT NULL REFERENCES "pulihHati".posts(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES "pulihHati".users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Buat tabel post_likes
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "pulihHati".post_likes (
        id SERIAL PRIMARY KEY,
        post_id INTEGER REFERENCES "pulihHati".posts(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES "pulihHati".users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(post_id, user_id)
      )
    `);
    
    // Buat admin user jika belum ada
    const adminCheck = await pool.query('SELECT * FROM "pulihHati".users WHERE email = $1', ['admin@pulihhati.com']);
    
    if (adminCheck.rows.length === 0) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      
      await pool.query(
        `INSERT INTO "pulihHati".users (name, email, password, role) 
         VALUES ($1, $2, $3, $4)`,
        ['Admin', 'admin@pulihhati.com', hashedPassword, 'admin']
      );
      
      logger.info('Admin user created');
    }

    logger.info('All tables created successfully');
  } catch (error) {
    logger.error(`Error creating tables: ${error.message}`);
    // Jangan throw error, biarkan aplikasi tetap berjalan
    logger.info('Continuing application startup despite table creation error');
  }
};

module.exports = { createTables };









