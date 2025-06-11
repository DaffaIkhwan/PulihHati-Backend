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
      logger.info(`Fetching last 7 days mood data for user ${userId}`);

      // Calculate date range using local timezone
      const today = new Date();
      const sixDaysAgo = new Date(today);
      sixDaysAgo.setDate(today.getDate() - 6);

      // Format dates as YYYY-MM-DD
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      const sixDaysAgoStr = `${sixDaysAgo.getFullYear()}-${String(sixDaysAgo.getMonth() + 1).padStart(2, '0')}-${String(sixDaysAgo.getDate()).padStart(2, '0')}`;

      logger.info(`Date range: ${sixDaysAgoStr} to ${todayStr}`);

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

      logger.info(`Found ${result.rows.length} mood entries in last 7 days for user ${userId}`);

      // Log each found entry with detailed info
      result.rows.forEach(row => {
        const entryDateStr = row.entry_date instanceof Date
          ? row.entry_date.toISOString().split('T')[0]
          : row.entry_date.toString().split('T')[0];
        logger.info(`Mood entry found: ${entryDateStr} - Level ${row.mood_level} (${row.mood_emoji})`);
      });

      // Also check if we have today's entry specifically
      const todayCheck = await query(`
        SELECT * FROM "pulihHati".mood_entries
        WHERE user_id = $1 AND entry_date = $2
      `, [userId, todayStr]);

      if (todayCheck.rows.length > 0) {
        logger.info(`✅ Today's entry exists: ${todayStr} - Level ${todayCheck.rows[0].mood_level}`);
      } else {
        logger.warn(`❌ No entry found for today: ${todayStr}`);
      }

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

  // Helper method to format mood data for frontend
  static formatMoodForChart(moodEntries) {
    // Mapping hari yang benar: 0=Minggu, 1=Senin, dst
    const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    const today = new Date();
    const result = [];

    logger.info(`Formatting mood chart data. Received ${moodEntries.length} entries`);

    // Generate last 7 days (6 days ago to today)
    // i=6 means 6 days ago (leftmost), i=0 means today (rightmost)
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      // Get local date in YYYY-MM-DD format (avoid timezone issues)
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      // Get correct day name using JavaScript getDay()
      const dayIndex = date.getDay(); // 0=Minggu, 1=Senin, dst
      const dayName = dayNames[dayIndex];

      // Check if this is today
      const isToday = i === 0;

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

      // Log chart data for debugging
      logger.info(`Chart day ${i}: ${dateStr} (${dayName}) - Mood: ${chartItem.mood}, HasEntry: ${chartItem.hasEntry}, IsToday: ${isToday}`);
    }

    logger.info(`Formatted chart data (${result.length} days):`, result.map(r => `${r.day}(${r.date.split('-')[2]})`).join(' -> '));
    return result;
  }
}

module.exports = Mood;
