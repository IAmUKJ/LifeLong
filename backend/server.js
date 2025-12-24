const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '.env') });
const http = require('http');
const socketIo = require('socket.io');
const aiRoutes = require("./routes/aiRoutes");
const ragService = require("./services/ragService");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: [
      "https://lifelong-1.netlify.app", 
      "http://localhost:3000"
    ],
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors({
  origin: [
    "https://lifelong-1.netlify.app",
    "http://localhost:3000"
  ],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser())
// Serve uploaded files
app.use('/uploads', express.static('backend/uploads'));

// Routes

app.use("/api/ai", aiRoutes);

app.use('/api/auth', require('./routes/auth'));
app.use('/api/doctors', require('./routes/doctors'));
app.use('/api/patients', require('./routes/patients'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/medicines', require('./routes/medicines'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/hospitals', require('./routes/hospitals'));
app.use('/api/fitness', require('./routes/fitness'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/ratings', require('./routes/ratings'));

// Socket.io for real-time chat
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room ${roomId}`);
  });

  socket.on('send-message', async (data) => {
    // Broadcast to all users in the room except sender
    socket.to(data.roomId).emit('receive-message', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// MongoDB Connection
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI)
.then(async () => {
  console.log('MongoDB Connected');

  // Initialize RAG Service
  try {
    await ragService.initialize();
    await ragService.loadMedicalDocuments();
    console.log('Medical RAG Service initialized and loaded');
  } catch (error) {
    console.error('Failed to initialize RAG service:', error);
    console.log('Continuing without RAG service - using fallback responses');
  }

  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
})
.catch((err) => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

module.exports = { app, io };

