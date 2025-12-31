const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');

dotenv.config({ path: path.join(__dirname, '.env') });
require("./utils/redis");

const aiRoutes = require("./routes/aiRoutes");
const ragService = require("./services/ragService");
const { Chat } = require('./models/Chat');

const app = express();
const server = http.createServer(app);

/* =========================
   SOCKET.IO SETUP
========================= */
const io = socketIo(server, {
  cors: {
    origin: [
      "https://lifelong-1.netlify.app",
      "http://localhost:3000"
    ],
    credentials: true
  }
});

// Make io available to routes (optional now, but useful)
app.set('io', io);

/* =========================
   MIDDLEWARE
========================= */
app.use(cors({
  origin: [
    "https://lifelong-1.netlify.app",
    "http://localhost:3000"
  ],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve uploaded files
app.use('/uploads', express.static('backend/uploads'));

/* =========================
   ROUTES (REST = HISTORY / META ONLY)
========================= */
app.use("/api/ai", aiRoutes);
app.use('/api/auth', require('./routes/auth'));
app.use('/api/doctors', require('./routes/doctors'));
app.use('/api/patients', require('./routes/patients'));
app.use('/api/chat', require('./routes/chat')); // history, room creation
app.use('/api/medicines', require('./routes/medicines'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/hospitals', require('./routes/hospitals'));
app.use('/api/fitness', require('./routes/fitness'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/ratings', require('./routes/ratings'));
app.use('/api/payments',require('./routes/transaction'))
/* =========================
   SOCKET.IO – REAL CHAT LOGIC
========================= */
io.on('connection', (socket) => {
  console.log('🟢 Socket connected:', socket.id);

  /* ---- Join chat room ---- */
  socket.on('joinRoom', (roomId) => {
    socket.join(roomId);
    console.log(`📥 Socket ${socket.id} joined room ${roomId}`);
  });

  /* ---- Send message (REAL SOURCE OF TRUTH) ---- */
  socket.on('sendMessage', async (payload) => {
    try {
      const { roomId, senderId, message, messageType = 'text' } = payload;

      const chat = await Chat.findById(roomId);
      if (!chat) return;

      const otherParticipant = chat.participants.find(
        p => p.userId.toString() !== senderId
      );
      const otherUserId = otherParticipant?.userId?.toString();

      const newMessage = {
        senderId,
        message,
        messageType,
        timestamp: new Date(),
        read: false,
        readBy: []
      };

      // Save message atomically
      await Chat.findByIdAndUpdate(roomId, {
        $push: { messages: newMessage },
        $set: {
          lastMessage:
            messageType === 'text'
              ? message
              : messageType === 'image'
              ? '📷 Image'
              : '📎 File',
          lastMessageTime: new Date()
        },
        ...(otherUserId && {
          $inc: { [`unreadCount.${otherUserId}`]: 1 }
        })
      });

      // 🔥 Emit to everyone in the room (including sender)
      io.to(roomId).emit('receiveMessage', {
        roomId,
        message: newMessage
      });

    } catch (err) {
      console.error('❌ sendMessage error:', err);
    }
  });

  socket.on('disconnect', () => {
    console.log('🔴 Socket disconnected:', socket.id);
  });
});

/* =========================
   DATABASE + SERVER START
========================= */
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('✅ MongoDB Connected');

    try {
      await ragService.initialize();
      await ragService.loadMedicalDocuments();
      console.log('✅ RAG Service Ready');
    } catch (err) {
      console.error('⚠️ RAG init failed, continuing without it');
    }

    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

module.exports = { app, io };
