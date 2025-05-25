const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { jwtSecret, jwtExpire } = require('../config/auth');
const logger = require('../config/logger');

class User {
  // Create a new user
  static async create(userData) {
    const { name, email, password, avatar = 'default-avatar.jpg', role = 'user' } = userData;
    
    try {
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      
      const result = await pool.query(
        `INSERT INTO pulihhati.users (name, email, password, avatar, role) 
         VALUES ($1, $2, $3, $4, $5) 
         RETURNING id, name, email, avatar, role, created_at`,
        [name, email, hashedPassword, avatar, role]
      );
      
      return result.rows[0];
    } catch (error) {
      logger.error(`Error in User.create: ${error.message}`);
      logger.error(`Stack trace: ${error.stack}`);
      throw error;
    }
  }
  
  // Find user by ID
  static async findById(id) {
    try {
      logger.info(`Finding user by ID: ${id}`);
      
      const result = await pool.query(
        'SELECT * FROM "pulihHati".users WHERE id = $1',
        [id]
      );
      
      if (result.rows.length === 0) {
        logger.info(`No user found with ID: ${id}`);
        return null;
      }
      
      const user = result.rows[0];
      logger.info(`User found with ID: ${id}`);
      
      // Add methods to user object
      user.getSignedJwtToken = function() {
        return jwt.sign({ id: this.id }, process.env.JWT_SECRET, {
          expiresIn: process.env.JWT_EXPIRE
        });
      };
      
      user.matchPassword = async function(enteredPassword) {
        return await bcrypt.compare(enteredPassword, this.password);
      };
      
      return user;
    } catch (error) {
      logger.error(`Error in User.findById: ${error.message}`);
      logger.error(`Stack trace: ${error.stack}`);
      return null;
    }
  }
  
  // Find user by email
  static async findByEmail(email) {
    try {
      logger.info(`Finding user by email: ${email}`);
      
      const result = await pool.query(
        'SELECT * FROM "pulihHati".users WHERE email = $1',
        [email]
      );
      
      if (result.rows.length === 0) {
        logger.info(`No user found with email: ${email}`);
        return null;
      }
      
      const user = result.rows[0];
      logger.info(`User found with ID: ${user.id}`);
      
      // Add methods to user object
      user.getSignedJwtToken = function() {
        return jwt.sign({ id: this.id }, process.env.JWT_SECRET, {
          expiresIn: process.env.JWT_EXPIRE
        });
      };
      
      user.matchPassword = async function(enteredPassword) {
        return await bcrypt.compare(enteredPassword, this.password);
      };
      
      return user;
    } catch (error) {
      logger.error(`Error in User.findByEmail: ${error.message}`);
      logger.error(`Stack trace: ${error.stack}`);
      return null;
    }
  }
  
  // Update user
  static async update(id, updateData) {
    const { name, email, avatar, role } = updateData;
    
    const result = await pool.query(
      `UPDATE pulihhati.users 
       SET name = $1, email = $2, avatar = $3, role = $4, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $5 
       RETURNING id, name, email, avatar, role, created_at, updated_at`,
      [name, email, avatar, role, id]
    );
    
    return result.rows[0];
  }
  
  // Update password
  static async updatePassword(id, newPassword) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    await pool.query(
      `UPDATE pulihhati.users 
       SET password = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2`,
      [hashedPassword, id]
    );
    
    return true;
  }
  
  // Delete user
  static async delete(id) {
    await pool.query('DELETE FROM pulihhati.users WHERE id = $1', [id]);
    return true;
  }
  
  // Compare password
  static async comparePassword(candidatePassword, hashedPassword) {
    return await bcrypt.compare(candidatePassword, hashedPassword);
  }
  
  // Generate JWT token
  static getSignedJwtToken(id) {
    return jwt.sign({ id }, jwtSecret, {
      expiresIn: jwtExpire
    });
  }
}

module.exports = User;
