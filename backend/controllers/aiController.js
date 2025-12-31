const { extractSymptoms } = require("../services/aiService");
const ragService = require("../services/ragService");
const { findDoctorsBySpecialization } = require("../services/doctorMatchingService");
const { AIChat } = require("../models/Chat");
const redisClient = require("../utils/redis");

const analyzeSymptoms = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ message: "Symptoms text is required" });
    }

    const { symptoms, specializations } = await extractSymptoms(text);
    const doctors = await findDoctorsBySpecialization(specializations);

    return res.status(200).json({
      extractedSymptoms: symptoms,
      recommendedDoctors: doctors
    });
  } catch (err) {
    console.error("AI ERROR:", err);
    return res.status(500).json({ message: "AI analysis failed" });
  }
};

const analyzeReport = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Report file is required" });
    }

    const analysis = await ragService.analyzeMedicalReport(req.file);

    // Store report analysis in chat history if user is authenticated
    if (req.user && req.user._id) {
      try {
        const sessionId = req.body.sessionId || `session_${Date.now()}`;

        // Store user action (file upload)
        await AIChat.findOneAndUpdate(
          { userId: req.user._id, sessionId },
          {
            $push: {
              messages: {
                role: 'user',
                content: `Uploaded and analyzed medical report: ${req.file.originalname}`,
                timestamp: new Date()
              }
            },
            updatedAt: new Date()
          },
          { upsert: true, new: true }
        );

        // Store AI analysis response
        await AIChat.findOneAndUpdate(
          { userId: req.user._id, sessionId },
          {
            $push: {
              messages: {
                role: 'assistant',
                content: analysis,
                timestamp: new Date()
              }
            },
            updatedAt: new Date()
          },
          { upsert: true, new: true }
        );
        // 🔥 Invalidate cached AI chat history
        await redisClient.del(`ai:chat-history:${req.user._id}:recent`);
        await redisClient.del(`ai:chat-history:${req.user._id}:session:${sessionId}`);

      } catch (dbError) {
        console.error('Error storing report analysis in chat history:', dbError);
        // Don't fail the request if database storage fails
      }
    }

    return res.status(200).json({
      analysis: analysis,
      fileName: req.file.originalname,
      sessionId: req.body.sessionId || `session_${Date.now()}`
    });
  } catch (err) {
    console.error("Report Analysis ERROR:", err);
    return res.status(500).json({ message: "Report analysis failed" });
  }
};

const chatWithAI = async (req, res) => {
  try {
    const { message, context, sessionId } = req.body;

    if (!message) {
      return res.status(400).json({ message: "Message is required" });
    }

    // Get user ID from authenticated request
    const userId = req.user ? req.user._id : null;

    const result = await ragService.queryMedicalKnowledge(message, context || []);

    // Store conversation in database if user is authenticated
    if (userId) {
      try {
        const chatSessionId = sessionId || `session_${Date.now()}`;

        // Store user message
        await AIChat.findOneAndUpdate(
          { userId, sessionId: chatSessionId },
          {
            $push: {
              messages: {
                role: 'user',
                content: message,
                timestamp: new Date()
              }
            },
            updatedAt: new Date()
          },
          { upsert: true, new: true }
        );

        // Store AI response
        await AIChat.findOneAndUpdate(
          { userId, sessionId: chatSessionId },
          {
            $push: {
              messages: {
                role: 'assistant',
                content: result.answer,
                sources: result.sourceDocuments,
                fallback: result.fallback || false,
                timestamp: new Date()
              }
            },
            updatedAt: new Date()
          },
          { upsert: true, new: true }
        );
        // 🔥 Invalidate cached AI chat history
        await redisClient.del(`ai:chat-history:${userId}:recent`);
        await redisClient.del(`ai:chat-history:${userId}:session:${chatSessionId}`);

      } catch (dbError) {
        console.error('Error storing chat history:', dbError);
        // Don't fail the request if database storage fails
      }
    }

    return res.status(200).json({
      response: result.answer,
      sources: result.sourceDocuments,
      fallback: result.fallback || false,
      sessionId: sessionId || `session_${Date.now()}`
    });
  } catch (err) {
    console.error("Chat AI ERROR:", err);
    return res.status(500).json({ message: "AI chat failed" });
  }
};

module.exports = {
  analyzeSymptoms,
  analyzeReport,
  chatWithAI
};
