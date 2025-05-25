const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const chatbotController = require('../controllers/chatbotController');

// Send message to chatbot
router.post('/message', protect, chatbotController.sendMessage);

// Get all sessions
router.get('/sessions', protect, chatbotController.getSessions);

// Get session by ID
router.get('/sessions/:id', protect, chatbotController.getSessionById);

module.exports = router;
