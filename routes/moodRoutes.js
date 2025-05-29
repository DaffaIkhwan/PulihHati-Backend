const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const moodController = require('../controllers/moodController');

// @desc    Get mood types
// @route   GET /api/mood/types
// @access  Public
router.get('/types', moodController.getMoodTypes);

// @desc    Save or update mood entry
// @route   POST /api/mood/entry
// @access  Private
router.post('/entry', protect, moodController.saveMoodEntry);

// @desc    Get today's mood
// @route   GET /api/mood/today
// @access  Private
router.get('/today', protect, moodController.getTodayMood);

// @desc    Get mood history for last 7 days
// @route   GET /api/mood/history/week
// @access  Private
router.get('/history/week', protect, moodController.getWeeklyMoodHistory);

// @desc    Get mood history for custom date range
// @route   GET /api/mood/history
// @access  Private
router.get('/history', protect, moodController.getMoodHistory);

// @desc    Get mood statistics
// @route   GET /api/mood/stats
// @access  Private
router.get('/stats', protect, moodController.getMoodStats);

// @desc    Delete mood entry
// @route   DELETE /api/mood/entry/:id
// @access  Private
router.delete('/entry/:id', protect, moodController.deleteMoodEntry);

module.exports = router;
