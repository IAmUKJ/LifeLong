const express = require("express");
const multer = require("multer");
const { analyzeSymptoms, analyzeReport, chatWithAI } = require("../controllers/aiController");
const { auth } = require("../middleware/auth");
const { AIChat } = require("../models/Chat");

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(), // Store files in memory
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  }
});

// Get chat history for a user
router.get("/chat-history", auth, async (req, res) => {
  try {
    const { sessionId } = req.query;
    const userId = req.user._id;

    let query = { userId };
    if (sessionId) {
      query.sessionId = sessionId;
    }

    const chats = await AIChat.find(query).sort({ updatedAt: -1 }).limit(sessionId ? 1 : 10);

    return res.status(200).json({
      chats: chats.map(chat => ({
        sessionId: chat.sessionId,
        messages: chat.messages,
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt
      }))
    });
  } catch (err) {
    console.error("Chat History ERROR:", err);
    return res.status(500).json({ message: "Failed to retrieve chat history" });
  }
});

router.post("/analyze", auth, analyzeSymptoms);
router.post("/analyze-report", auth, upload.single('report'), analyzeReport);
router.post("/chat", auth, chatWithAI);

module.exports = router;
