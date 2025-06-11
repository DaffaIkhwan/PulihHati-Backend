const Mood = require('../models/Mood');
const logger = require('../config/logger');

// Mood types configuration - aligned with frontend
const MOOD_TYPES = {
  1: { emoji: '😊', label: 'Sangat Baik' },
  2: { emoji: '🙂', label: 'Baik' },
  3: { emoji: '😐', label: 'Biasa' },
  4: { emoji: '😔', label: 'Buruk' },
  5: { emoji: '😢', label: 'Sangat Buruk' }
};

// @desc    Save or update mood entry
// @route   POST /api/mood/entry
// @access  Private
exports.saveMoodEntry = async (req, res) => {
  try {
    const userId = req.user.id;
    const { mood_level, entry_date } = req.body;

    // Validation
    if (!mood_level || mood_level < 1 || mood_level > 5) {
      return res.status(400).json({
        message: 'Mood level harus antara 1-5'
      });
    }

    // Get mood type info
    const moodType = MOOD_TYPES[mood_level];
    if (!moodType) {
      return res.status(400).json({
        message: 'Mood level tidak valid'
      });
    }

    // Use today's date if not provided (using local timezone)
    let targetDate = entry_date;
    if (!targetDate) {
      const now = new Date();
      // Get local date in YYYY-MM-DD format
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      targetDate = `${year}-${month}-${day}`;
    }

    // Get day info for debugging
    const date = new Date(targetDate);
    const dayIndex = date.getDay();
    const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const dayName = dayNames[dayIndex];

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) {
      return res.status(400).json({
        message: 'Format tanggal tidak valid (YYYY-MM-DD)'
      });
    }

    logger.info(`Saving mood entry for user ${userId}: level ${mood_level} on ${targetDate} (${dayName}, day index: ${dayIndex})`);

    const moodData = {
      mood_level: parseInt(mood_level),
      mood_label: moodType.label,
      mood_emoji: moodType.emoji,
      entry_date: targetDate
    };

    const savedMood = await Mood.createOrUpdate(userId, moodData);

    res.status(200).json({
      message: 'Mood berhasil disimpan',
      data: savedMood
    });

  } catch (error) {
    logger.error(`Error saving mood entry: ${error.message}`);
    res.status(500).json({
      message: 'Gagal menyimpan mood',
      error: error.message
    });
  }
};

// @desc    Get mood history for last 7 days
// @route   GET /api/mood/history/week
// @access  Private
exports.getWeeklyMoodHistory = async (req, res) => {
  try {
    const userId = req.user.id;

    logger.info(`Fetching weekly mood history for user ${userId}`);

    const moodEntries = await Mood.getLast7DaysMood(userId);
    const formattedData = Mood.formatMoodForChart(moodEntries);

    res.status(200).json({
      message: 'Data mood 7 hari terakhir berhasil diambil',
      data: formattedData,
      raw_entries: moodEntries
    });

  } catch (error) {
    logger.error(`Error fetching weekly mood history: ${error.message}`);
    res.status(500).json({
      message: 'Gagal mengambil data mood',
      error: error.message
    });
  }
};

// @desc    Get mood history for custom date range
// @route   GET /api/mood/history
// @access  Private
exports.getMoodHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { start_date, end_date } = req.query;

    // Default to last 30 days if no dates provided
    const endDate = end_date || new Date().toISOString().split('T')[0];
    const startDate = start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    logger.info(`Fetching mood history for user ${userId} from ${startDate} to ${endDate}`);

    const moodEntries = await Mood.getUserMoodHistory(userId, startDate, endDate);

    res.status(200).json({
      message: 'Data mood berhasil diambil',
      data: moodEntries,
      period: {
        start_date: startDate,
        end_date: endDate
      }
    });

  } catch (error) {
    logger.error(`Error fetching mood history: ${error.message}`);
    res.status(500).json({
      message: 'Gagal mengambil data mood',
      error: error.message
    });
  }
};

// @desc    Get mood statistics
// @route   GET /api/mood/stats
// @access  Private
exports.getMoodStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const { start_date, end_date } = req.query;

    // Default to last 30 days if no dates provided
    const endDate = end_date || new Date().toISOString().split('T')[0];
    const startDate = start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    logger.info(`Fetching mood statistics for user ${userId} from ${startDate} to ${endDate}`);

    const stats = await Mood.getMoodStats(userId, startDate, endDate);

    res.status(200).json({
      message: 'Statistik mood berhasil diambil',
      data: stats,
      period: {
        start_date: startDate,
        end_date: endDate
      }
    });

  } catch (error) {
    logger.error(`Error fetching mood statistics: ${error.message}`);
    res.status(500).json({
      message: 'Gagal mengambil statistik mood',
      error: error.message
    });
  }
};

// @desc    Get today's mood
// @route   GET /api/mood/today
// @access  Private
exports.getTodayMood = async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date().toISOString().split('T')[0];

    logger.info(`Fetching today's mood for user ${userId}`);

    const todayMood = await Mood.getMoodByDate(userId, today);

    res.status(200).json({
      message: 'Data mood hari ini berhasil diambil',
      data: todayMood,
      date: today
    });

  } catch (error) {
    logger.error(`Error fetching today's mood: ${error.message}`);
    res.status(500).json({
      message: 'Gagal mengambil mood hari ini',
      error: error.message
    });
  }
};

// @desc    Delete mood entry
// @route   DELETE /api/mood/entry/:id
// @access  Private
exports.deleteMoodEntry = async (req, res) => {
  try {
    const userId = req.user.id;
    const entryId = req.params.id;

    logger.info(`Deleting mood entry ${entryId} for user ${userId}`);

    const deletedMood = await Mood.deleteMoodEntry(userId, entryId);

    res.status(200).json({
      message: 'Mood entry berhasil dihapus',
      data: deletedMood
    });

  } catch (error) {
    logger.error(`Error deleting mood entry: ${error.message}`);
    res.status(500).json({
      message: 'Gagal menghapus mood entry',
      error: error.message
    });
  }
};

// @desc    Get mood types
// @route   GET /api/mood/types
// @access  Public
exports.getMoodTypes = async (req, res) => {
  try {
    logger.info('Fetching mood types');

    // Return hardcoded mood types for consistency
    const moodTypes = Object.entries(MOOD_TYPES).map(([id, data]) => ({
      id: parseInt(id),
      emoji: data.emoji,
      label: data.label,
      color: getMoodColor(parseInt(id)),
      chartColor: getMoodChartColor(parseInt(id))
    }));

    res.status(200).json({
      message: 'Mood types berhasil diambil',
      data: moodTypes
    });

  } catch (error) {
    logger.error(`Error fetching mood types: ${error.message}`);
    res.status(500).json({
      message: 'Gagal mengambil mood types',
      error: error.message
    });
  }
};

// Helper functions - aligned with frontend mapping
const getMoodColor = (moodLevel) => {
  const colors = {
    1: 'bg-green-100 text-green-700 border-green-300',      // Sangat Baik
    2: 'bg-emerald-100 text-emerald-700 border-emerald-300', // Baik
    3: 'bg-yellow-100 text-yellow-700 border-yellow-300',   // Biasa
    4: 'bg-orange-100 text-orange-700 border-orange-300',   // Buruk
    5: 'bg-red-100 text-red-700 border-red-300'             // Sangat Buruk
  };
  return colors[moodLevel] || colors[3];
};

const getMoodChartColor = (moodLevel) => {
  const colors = {
    1: '#22C55E',  // Green - Sangat Baik
    2: '#10B981',  // Emerald - Baik
    3: '#EAB308',  // Yellow - Biasa
    4: '#F97316',  // Orange - Buruk
    5: '#EF4444'   // Red - Sangat Buruk
  };
  return colors[moodLevel] || colors[3];
};

module.exports = exports;
