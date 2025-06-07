const { query } = require('../config/db');
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

      const result = await query(
        `INSERT INTO "pulihHati".users (name, email, password, avatar, role)
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

      const result = await query(
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

      const result = await query(
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
    try {
      logger.info(`Updating user ${id} with data:`, updateData);

      // Validate that we have data to update
      if (!updateData || Object.keys(updateData).length === 0) {
        logger.warn(`No update data provided for user ${id}`);
        return null;
      }

      // Build dynamic update query
      const updateFields = [];
      const updateValues = [];
      let paramIndex = 1;

      // Handle each possible field
      if (updateData.name !== undefined && updateData.name !== null) {
        updateFields.push(`name = $${paramIndex}`);
        updateValues.push(updateData.name);
        paramIndex++;
        logger.info(`Adding name update: ${updateData.name}`);
      }

      if (updateData.email !== undefined && updateData.email !== null) {
        updateFields.push(`email = $${paramIndex}`);
        updateValues.push(updateData.email);
        paramIndex++;
        logger.info(`Adding email update: ${updateData.email}`);
      }

      if (updateData.avatar !== undefined && updateData.avatar !== null) {
        updateFields.push(`avatar = $${paramIndex}`);
        updateValues.push(updateData.avatar);
        paramIndex++;
        logger.info(`Adding avatar update: ${updateData.avatar}`);
      }

      if (updateData.cloudinary_public_id !== undefined) {
        updateFields.push(`cloudinary_public_id = $${paramIndex}`);
        updateValues.push(updateData.cloudinary_public_id);
        paramIndex++;
        logger.info(`Adding cloudinary_public_id update: ${updateData.cloudinary_public_id}`);
      }

      if (updateData.role !== undefined && updateData.role !== null) {
        updateFields.push(`role = $${paramIndex}`);
        updateValues.push(updateData.role);
        paramIndex++;
        logger.info(`Adding role update: ${updateData.role}`);
      }

      // Check if we have any fields to update
      if (updateFields.length === 0) {
        logger.warn(`No valid fields to update for user ${id}`);
        return null;
      }

      // Always update updated_at
      updateFields.push(`updated_at = NOW()`);

      // Add user ID for WHERE clause
      updateValues.push(id);
      const whereParamIndex = paramIndex;

      logger.info(`Update fields: ${updateFields.join(', ')}`);
      logger.info(`Update values:`, updateValues);
      logger.info(`WHERE parameter index: $${whereParamIndex}`);

      const updateQuery = `UPDATE "pulihHati".users
         SET ${updateFields.join(', ')}
         WHERE id = $${whereParamIndex}
         RETURNING id, name, email, avatar, role, created_at, updated_at, cloudinary_public_id`;

      logger.info(`Executing query: ${updateQuery}`);

      const result = await query(updateQuery, updateValues);

      if (result.rows.length === 0) {
        logger.warn(`No user found with ID ${id} for update`);
        return null;
      }

      logger.info(`User ${id} updated successfully:`, result.rows[0]);
      return result.rows[0];
    } catch (error) {
      logger.error(`Error updating user ${id}: ${error.message}`);
      logger.error(`Stack trace: ${error.stack}`);
      throw error;
    }
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
