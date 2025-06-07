const { pool } = require('../config/database');

class ChatSession {
  // Create a new chat session
  static async create(userId) {
    // Set all existing sessions to inactive
    await pool.query(
      'UPDATE "pulihHati".chat_sessions SET is_active = false WHERE user_id = $1',
      [userId]
    );
    
    // Create new active session
    const result = await pool.query(
      `INSERT INTO "pulihHati".chat_sessions (user_id, is_active) 
       VALUES ($1, true) 
       RETURNING id, user_id, is_active, created_at, updated_at`,
      [userId]
    );
    
    return result.rows[0];
  }
  
  // Find sessions by user
  static async findByUser(userId) {
    const result = await pool.query(`
      SELECT cs.id, cs.is_active, cs.created_at, cs.updated_at,
             COUNT(m.id) as message_count
      FROM "pulihHati".chat_sessions cs
      LEFT JOIN "pulihHati".messages m ON cs.id = m.session_id
      WHERE cs.user_id = $1
      GROUP BY cs.id
      ORDER BY cs.updated_at DESC
    `, [userId]);
    
    return result.rows.map(session => ({
      id: session.id,
      is_active: session.is_active,
      message_count: parseInt(session.message_count),
      created_at: session.created_at,
      updated_at: session.updated_at
    }));
  }
  
  // Find session by ID
  static async findById(id, userId) {
    // Get session details
    const sessionResult = await pool.query(`
      SELECT * FROM "pulihHati".chat_sessions
      WHERE id = $1 AND user_id = $2
    `, [id, userId]);
    
    if (sessionResult.rows.length === 0) {
      return null;
    }
    
    const session = sessionResult.rows[0];
    
    // Get messages
    const messagesResult = await pool.query(`
      SELECT * FROM "pulihHati".messages
      WHERE session_id = $1
      ORDER BY created_at ASC
    `, [id]);
    
    // Format the session
    return {
      id: session.id,
      is_active: session.is_active,
      messages: messagesResult.rows.map(msg => ({
        id: msg.id,
        content: msg.content,
        sender: msg.sender,
        created_at: msg.created_at
      })),
      created_at: session.created_at,
      updated_at: session.updated_at
    };
  }
  
  // Add message to session
  static async addMessage(sessionId, content, sender) {
    // Add message
    const result = await pool.query(
      `INSERT INTO "pulihHati".messages (session_id, content, sender) 
       VALUES ($1, $2, $3) 
       RETURNING id, content, sender, created_at`,
      [sessionId, content, sender]
    );
    
    // Update session timestamp
    await pool.query(
      'UPDATE "pulihHati".chat_sessions SET updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [sessionId]
    );
    
    return result.rows[0];
  }
  
  // Close session
  static async closeSession(id, userId) {
    const result = await pool.query(
      `UPDATE "pulihHati".chat_sessions 
       SET is_active = false 
       WHERE id = $1 AND user_id = $2
       RETURNING id`,
      [id, userId]
    );
    
    return result.rows.length > 0;
  }
}

module.exports = ChatSession;
