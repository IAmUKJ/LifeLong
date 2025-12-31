const express = require("express");
const multer = require("multer");
const { analyzeSymptoms, analyzeReport, chatWithAI } = require("../controllers/aiController");
const { auth } = require("../middleware/auth");
const { AIChat } = require("../models/Chat");
const redisClient = require("../utils/redis");
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

    const cacheKey = sessionId
      ? `ai:chat-history:${userId}:session:${sessionId}`
      : `ai:chat-history:${userId}:recent`;

    // 1️⃣ Try Redis first (SAFE)
    const cachedChats = await redisClient.get(cacheKey);
    if (cachedChats) {
      console.log("⚡ AI chat history served from Redis");
      return res.status(200).json(JSON.parse(cachedChats));
    }

    let query = { userId };
    if (sessionId) {
      query.sessionId = sessionId;
    }

    const chats = await AIChat.find(query)
      .sort({ updatedAt: -1 })
      .limit(sessionId ? 1 : 10);

    const response = {
      chats: chats.map(chat => ({
        sessionId: chat.sessionId,
        messages: chat.messages,
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt
      }))
    };

    // 2️⃣ Cache for SHORT time (60s)
    await redisClient.setEx(
      cacheKey,
      60,
      JSON.stringify(response)
    );

    return res.status(200).json(response);
  } catch (err) {
    console.error("Chat History ERROR:", err);
    return res.status(500).json({ message: "Failed to retrieve chat history" });
  }
});

router.post("/analyze", auth, analyzeSymptoms);
router.post("/analyze-report", auth, upload.single('report'), analyzeReport);
router.post("/chat", auth, chatWithAI);

module.exports = router;
