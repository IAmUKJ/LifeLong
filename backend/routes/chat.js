const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { auth } = require('../middleware/auth');
const { Chat } = require('../models/Chat');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const { uploadToCloudinaryMiddleware } = require('../middleware/cloudinaryUpload');
const { upload } = require('../middleware/multer');
const redisClient = require('../utils/redis');

/* =========================
   CREATE / GET CHAT ROOM
========================= */
router.post('/room', auth, async (req, res) => {
  try {
    const { otherUserId } = req.body;

    let chat = await Chat.findOne({
      'participants.userId': { $all: [req.user._id, otherUserId] }
    });

    if (!chat) {
      const currentUser = await User.findById(req.user._id);
      const otherUser = await User.findById(otherUserId);
      if (!otherUser) return res.status(404).json({ message: 'User not found' });

      if (currentUser.role !== otherUser.role) {
        const patientUserId =
          currentUser.role === 'patient' ? req.user._id : otherUserId;
        const doctorUserId =
          currentUser.role === 'doctor' ? req.user._id : otherUserId;

        const patient = await Patient.findOne({ userId: patientUserId });
        const doctor = await Doctor.findOne({ userId: doctorUserId });

        if (!patient || !doctor) {
          return res.status(404).json({ message: 'Profile not found' });
        }

        const isConnected = patient.currentDoctors.some(
          d => d.doctorId.toString() === doctor._id.toString()
        );

        if (!isConnected) {
          return res.status(403).json({ message: 'Not connected' });
        }
      } else {
        return res.status(403).json({ message: 'Invalid chat participants' });
      }

      chat = await Chat.create({
        participants: [
          { userId: req.user._id, role: currentUser.role },
          { userId: otherUserId, role: otherUser.role }
        ],
        unreadCount: {
          [req.user._id]: 0,
          [otherUserId]: 0
        }
      });
    }

    res.json({ roomId: chat._id, chat });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

/* =========================
   GET CHAT LIST
========================= */
router.get('/list', auth, async (req, res) => {
  try {
    const cacheKey = `chat:list:${req.user._id}`;

    // 1️⃣ Redis check
    const cachedChats = await redisClient.get(cacheKey);
    if (cachedChats) {
      console.log('⚡ Chat list served from Redis');
      return res.json(JSON.parse(cachedChats));
    }

    const chats = await Chat.find({
      'participants.userId': req.user._id
    })
      .populate('participants.userId', 'name email profilePicture role')
      .sort({ lastMessageTime: -1 });

    const result = chats.map(chat => {
      const obj = chat.toObject();
      return {
        ...obj,
        unreadCount: obj.unreadCount?.[req.user._id.toString()] || 0
      };
    });

    // 2️⃣ Cache for SHORT time (60 seconds)
    await redisClient.setEx(
      cacheKey,
      60,
      JSON.stringify(result)
    );

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

/* =========================
   GET CHAT MESSAGES
========================= */
router.get('/:roomId/messages', auth, async (req, res) => {
  try {
    const cacheKey = `chat:messages:${req.params.roomId}`;

    const cachedMessages = await redisClient.get(cacheKey);
    if (cachedMessages) {
      return res.json(JSON.parse(cachedMessages));
    }

    const chat = await Chat.findById(req.params.roomId);
    if (!chat) return res.status(404).json({ message: 'Chat not found' });

    const isParticipant = chat.participants.some(
      p => p.userId.toString() === req.user._id.toString()
    );
    if (!isParticipant) return res.status(403).json({ message: 'Access denied' });

    await redisClient.setEx(
      cacheKey,
      30, // VERY short TTL
      JSON.stringify(chat.messages)
    );

    res.json(chat.messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

/* =========================
   SEND MESSAGE (REAL-TIME FIXED)
========================= */
router.post(
  '/:roomId/message',
  upload.single('file'),
  uploadToCloudinaryMiddleware,
  auth,
  async (req, res) => {
    try {
      const { message = '', messageType = 'text', fileName = '' } = req.body;
      const roomId = req.params.roomId;

      const chat = await Chat.findById(roomId);
      if (!chat) return res.status(404).json({ message: 'Chat not found' });

      const isParticipant = chat.participants.some(
        p => p.userId.toString() === req.user._id.toString()
      );
      if (!isParticipant) return res.status(403).json({ message: 'Access denied' });

      const otherParticipant = chat.participants.find(
        p => p.userId.toString() !== req.user._id.toString()
      );
      const otherUserId = otherParticipant.userId.toString();

      const newMessage = {
        _id: new mongoose.Types.ObjectId(),
        senderId: req.user._id,
        message,
        messageType,
        fileUrl: req.fileUrl || '',
        fileName,
        timestamp: new Date(),
        read: false,
        readBy: []
      };

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
        $inc: {
          [`unreadCount.${otherUserId}`]: 1
        }
      });
      await redisClient.del(`chat:list:${req.user._id}`);
      await redisClient.del(`chat:list:${otherUserId}`);
      await redisClient.del(`chat:messages:${roomId}`);

      // 🔥 REAL-TIME EMIT (THIS WAS THE MISSING PIECE)
      const io = req.app.get('io');
      io.to(roomId).emit('receiveMessage', {
        roomId,
        message: newMessage
      });

      res.json(newMessage);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

/* =========================
   MARK MESSAGES AS READ
========================= */
router.put('/:roomId/read', auth, async (req, res) => {
  try {
    await Chat.updateOne(
      { _id: req.params.roomId, 'participants.userId': req.user._id },
      {
        $set: {
          'messages.$[msg].read': true,
          [`unreadCount.${req.user._id}`]: 0
        },
        $addToSet: {
          'messages.$[msg].readBy': {
            userId: req.user._id,
            readAt: new Date()
          }
        }
      },
      {
        arrayFilters: [
          {
            'msg.senderId': { $ne: req.user._id },
            'msg.read': false
          }
        ]
      }
    );

    res.json({ message: 'Messages marked as read' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
