const ChatSession = require('../models/ChatSession');

// @desc    Send message to chatbot
// @route   POST /api/chatbot/message
// @access  Private
exports.sendMessage = async (req, res, next) => {
  try {
    const { message } = req.body;
    const userId = req.user.id;
    
    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }
    
    // Find active session or create new one
    let sessions = await ChatSession.findByUser(userId);
    let activeSession = sessions.find(s => s.is_active);
    
    if (!activeSession) {
      activeSession = await ChatSession.create(userId);
    }
    
    // Add user message
    await ChatSession.addMessage(activeSession.id, message, 'user');
    
    // Generate bot response (this would be replaced with actual AI logic)
    const botResponse = generateBotResponse(message);
    
    // Add bot response
    await ChatSession.addMessage(activeSession.id, botResponse, 'bot');
    
    // Get updated session
    const updatedSession = await ChatSession.findById(activeSession.id, userId);
    
    res.json({
      sessionId: updatedSession.id,
      message: botResponse,
      messages: updatedSession.messages
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all chat sessions
// @route   GET /api/chatbot/sessions
// @access  Private
exports.getSessions = async (req, res, next) => {
  try {
    const sessions = await ChatSession.findByUser(req.user.id);
    res.json(sessions);
  } catch (error) {
    next(error);
  }
};

// @desc    Get chat session by ID
// @route   GET /api/chatbot/sessions/:id
// @access  Private
exports.getSessionById = async (req, res, next) => {
  try {
    const session = await ChatSession.findById(req.params.id, req.user.id);
    
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }
    
    res.json(session);
  } catch (error) {
    next(error);
  }
};

// Helper function to generate bot responses
// This would be replaced with actual AI/NLP logic
function generateBotResponse(message) {
  const responses = [
    "I understand how you're feeling. Would you like to talk more about it?",
    "That sounds challenging. How has this been affecting you?",
    "Thank you for sharing that with me. What do you think might help in this situation?",
    "I'm here to listen. Would you like to explore some coping strategies together?",
    "It's okay to feel that way. Many people experience similar emotions."
  ];
  
  return responses[Math.floor(Math.random() * responses.length)];
}
