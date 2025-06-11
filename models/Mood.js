const { query } = require('../config/db');
const logger = require('../config/logger');

class Mood {
  // Create or update mood entry for a specific date
  static async createOrUpdate(userId, moodData) {
    const { mood_level, mood_label, mood_emoji, entry_date } = moodData;

    try {
      logger.info(`Creating/updating mood entry for user ${userId} on ${entry_date}`);

      // Use UPSERT (INSERT ... ON CONFLICT) to handle create or update
      const result = await query(`
        INSERT INTO "pulihHati".mood_entries (user_id, mood_level, mood_label, mood_emoji, entry_date, updated_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
        ON CONFLICT (user_id, entry_date)
        DO UPDATE SET
          mood_level = EXCLUDED.mood_level,
          mood_label = EXCLUDED.mood_label,
          mood_emoji = EXCLUDED.mood_emoji,
          updated_at = NOW()
        RETURNING *
      `, [userId, mood_level, mood_label, mood_emoji, entry_date]);

      logger.info(`Mood entry saved successfully for user ${userId}`);
      return result.rows[0];
    } catch (error) {
      logger.error(`Error creating/updating mood entry: ${error.message}`);
      throw error;
    }
  }

  // Get mood entries for a user within a date range
  static async getUserMoodHistory(userId, startDate, endDate) {
    try {
      logger.info(`Fetching mood history for user ${userId} from ${startDate} to ${endDate}`);

      const result = await query(`
        SELECT
          id,
          mood_level,
          mood_label,
          mood_emoji,
          entry_date,
          created_at,
          updated_at
        FROM "pulihHati".mood_entries
        WHERE user_id = $1
        AND entry_date >= $2
        AND entry_date <= $3
        ORDER BY entry_date ASC
      `, [userId, startDate, endDate]);

      logger.info(`Found ${result.rows.length} mood entries for user ${userId}`);
      return result.rows;
    } catch (error) {
      logger.error(`Error fetching mood history: ${error.message}`);
      throw error;
    }
  }

  // Get last 7 days mood data for a user
  static async getLast7DaysMood(userId) {
    try {
      // Calculate date range using consistent WIB timezone
      const wibToday = this.getWIBDate();
      const sixDaysAgo = new Date(wibToday);
      sixDaysAgo.setUTCDate(sixDaysAgo.getUTCDate() - 6);

      // Format dates as YYYY-MM-DD using WIB timezone
      const todayStr = this.formatWIBDate(wibToday);
      const sixDaysAgoStr = this.formatWIBDate(sixDaysAgo);

      console.log(`📊 Fetching mood data from ${sixDaysAgoStr} to ${todayStr} for user ${userId}`);

      const result = await query(`
        SELECT
          mood_level,
          mood_label,
          mood_emoji,
          entry_date,
          created_at,
          updated_at
        FROM "pulihHati".mood_entries
        WHERE user_id = $1
        AND entry_date >= $2
        AND entry_date <= $3
        ORDER BY entry_date ASC
      `, [userId, sixDaysAgoStr, todayStr]);

      console.log(`📊 Found ${result.rows.length} mood entries for user ${userId}`);
      return result.rows;
    } catch (error) {
      logger.error(`Error fetching last 7 days mood: ${error.message}`);
      throw error;
    }
  }

  // Get mood entry for a specific date
  static async getMoodByDate(userId, date) {
    try {
      logger.info(`Fetching mood for user ${userId} on ${date}`);

      const result = await query(`
        SELECT *
        FROM "pulihHati".mood_entries
        WHERE user_id = $1 AND entry_date = $2
      `, [userId, date]);

      return result.rows[0] || null;
    } catch (error) {
      logger.error(`Error fetching mood by date: ${error.message}`);
      throw error;
    }
  }

  // Get mood statistics for a user
  static async getMoodStats(userId, startDate, endDate) {
    try {
      logger.info(`Fetching mood statistics for user ${userId}`);

      const result = await query(`
        SELECT
          mood_level,
          mood_label,
          COUNT(*) as count,
          ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
        FROM "pulihHati".mood_entries
        WHERE user_id = $1
        AND entry_date >= $2
        AND entry_date <= $3
        GROUP BY mood_level, mood_label
        ORDER BY mood_level ASC
      `, [userId, startDate, endDate]);

      // Also get average mood
      const avgResult = await query(`
        SELECT
          ROUND(AVG(mood_level), 2) as average_mood,
          COUNT(*) as total_entries
        FROM "pulihHati".mood_entries
        WHERE user_id = $1
        AND entry_date >= $2
        AND entry_date <= $3
      `, [userId, startDate, endDate]);

      return {
        distribution: result.rows,
        average: avgResult.rows[0]
      };
    } catch (error) {
      logger.error(`Error fetching mood statistics: ${error.message}`);
      throw error;
    }
  }

  // Delete mood entry
  static async deleteMoodEntry(userId, entryId) {
    try {
      logger.info(`Deleting mood entry ${entryId} for user ${userId}`);

      const result = await query(`
        DELETE FROM "pulihHati".mood_entries
        WHERE id = $1 AND user_id = $2
        RETURNING *
      `, [entryId, userId]);

      if (result.rows.length === 0) {
        throw new Error('Mood entry not found or unauthorized');
      }

      logger.info(`Mood entry ${entryId} deleted successfully`);
      return result.rows[0];
    } catch (error) {
      logger.error(`Error deleting mood entry: ${error.message}`);
      throw error;
    }
  }

  // Get all mood types
  static async getMoodTypes() {
    try {
      const result = await query(`
        SELECT * FROM "pulihHati".mood_types ORDER BY id ASC
      `);

      return result.rows;
    } catch (error) {
      logger.error(`Error fetching mood types: ${error.message}`);
      throw error;
    }
  }

  // Helper function to get current WIB date consistently
  static getWIBDate() {
    const now = new Date();
    const wibTime = new Date(now.getTime() + (7 * 60 * 60 * 1000)); // Add 7 hours for WIB
    return wibTime;
  }

  // Helper function to format date as YYYY-MM-DD in WIB
  static formatWIBDate(date) {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Helper method to format mood data for frontend
  static formatMoodForChart(moodEntries) {
    // Mapping hari yang benar: 0=Minggu, 1=Senin, dst
    const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

    // Use consistent WIB date calculation
    const wibToday = this.getWIBDate();
    const todayStr = this.formatWIBDate(wibToday);
    const result = [];

    console.log(`🕐 Backend WIB time: ${wibToday.toISOString()}`);
    console.log(`📅 Backend today's date (WIB): ${todayStr}`);

    // Generate last 7 days (6 days ago to today)
    // i=6 means 6 days ago (leftmost), i=0 means today (rightmost)
    for (let i = 6; i >= 0; i--) {
      const date = new Date(wibToday);
      date.setUTCDate(date.getUTCDate() - i);

      const dateStr = this.formatWIBDate(date);
      const dayIndex = date.getUTCDay(); // 0=Sunday, 1=Monday, etc.
      const dayName = dayNames[dayIndex];

      // Check if this is today - compare with today's date string
      const isToday = dateStr === todayStr;

      // Find mood entry for this date with better matching
      const moodEntry = moodEntries.find(entry => {
        if (!entry || !entry.entry_date) return false;

        // Handle both Date objects and string dates
        let entryDateStr;
        if (entry.entry_date instanceof Date) {
          const entryYear = entry.entry_date.getFullYear();
          const entryMonth = String(entry.entry_date.getMonth() + 1).padStart(2, '0');
          const entryDay = String(entry.entry_date.getDate()).padStart(2, '0');
          entryDateStr = `${entryYear}-${entryMonth}-${entryDay}`;
        } else {
          entryDateStr = entry.entry_date.toString().split('T')[0];
        }

        const matches = entryDateStr === dateStr;
        return matches;
      });

      const chartItem = {
        day: dayName,
        date: dateStr,
        mood: moodEntry ? moodEntry.mood_level : null,
        emoji: moodEntry ? moodEntry.mood_emoji : null,
        label: moodEntry ? moodEntry.mood_label : null,
        hasEntry: !!moodEntry,
        isToday: isToday
      };

      result.push(chartItem);
    }

    // Debug: Log the order to verify today is at the end (rightmost)
    console.log('📊 Backend Mood Chart Order:', result.map((r, idx) => `${idx}:${r.day}(${r.date.split('-')[2]})${r.isToday ? '👈TODAY' : ''}`).join(' → '));

    return result;
  }
}

module.exports = Mood;
