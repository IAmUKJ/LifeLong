const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { Chat } = require('../models/Chat');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const { upload, uploadToCloudinaryMiddleware } = require('../middleware/cloudinaryUpload');

// Get or create chat room
router.post('/room', auth, async (req, res) => {
  try {
    const { otherUserId } = req.body;

    // Find existing chat
    let chat = await Chat.findOne({
      $and: [
        { 'participants.userId': req.user._id },
        { 'participants.userId': otherUserId }
      ]
    });

    if (!chat) {
      // Get roles
      const currentUser = await User.findById(req.user._id);
      const otherUser = await User.findById(otherUserId);

      if (!otherUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Verify connection (patient-doctor relationship)
      if (currentUser.role === 'patient' && otherUser.role === 'doctor') {
        const patient = await Patient.findOne({ userId: req.user._id });
        const doctor = await Doctor.findOne({ userId: otherUserId });

        if (!patient || !doctor) {
          return res.status(404).json({ message: 'Profile not found' });
        }

        const isConnected = patient.currentDoctors.some(
          doc => doc.doctorId.toString() === doctor._id.toString()
        );

        if (!isConnected) {
          return res.status(403).json({ message: 'Not connected with this doctor' });
        }
      } else if (currentUser.role === 'doctor' && otherUser.role === 'patient') {
        const doctor = await Doctor.findOne({ userId: req.user._id });
        const patient = await Patient.findOne({ userId: otherUserId });

        if (!patient || !doctor) {
          return res.status(404).json({ message: 'Profile not found' });
        }

        const isConnected = patient.currentDoctors.some(
          doc => doc.doctorId.toString() === doctor._id.toString()
        );

        if (!isConnected) {
          return res.status(403).json({ message: 'Not connected with this patient' });
        }
      } else {
        return res.status(403).json({ message: 'Invalid chat participants' });
      }

      // Create new chat
      chat = new Chat({
        participants: [
          { userId: req.user._id, role: currentUser.role },
          { userId: otherUserId, role: otherUser.role }
        ]
      });
      await chat.save();
    }

    res.json({ roomId: chat._id, chat });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all chats for user with unread counts
router.get('/list', auth, async (req, res) => {
  try {
    const chats = await Chat.find({
      'participants.userId': req.user._id
    })
      .populate('participants.userId', 'name email profilePicture role')
      .sort({ lastMessageTime: -1 });

    // Filter out chats where participants are not properly populated
    const validChats = chats.filter(chat => 
      chat.participants.every(p => p.userId && p.userId._id)
    );

    // Add unread count for each chat
    const chatsWithUnread = validChats.map(chat => {
      let unreadCount = 0;
      const chatObj = chat.toObject();
      if (chatObj.unreadCount) {
        if (typeof chatObj.unreadCount === 'object') {
          // Handle as plain object
          unreadCount = chatObj.unreadCount[req.user._id.toString()] || 0;
        }
      }
      return {
        ...chatObj,
        unreadCount
      };
    });

    res.json(chatsWithUnread);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get chat messages
router.get('/:roomId/messages', auth, async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.roomId);

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Verify user is participant
    const isParticipant = chat.participants.some(
      p => p.userId.toString() === req.user._id.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(chat.messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Send message (handled by socket.io, but keeping REST endpoint for backup)
router.post('/:roomId/message', 
  upload.single('file'),
  uploadToCloudinaryMiddleware,
  auth, 
  async (req, res) => {
    try {
      const { message, messageType = 'text', fileName } = req.body;
      const chat = await Chat.findById(req.params.roomId);

      if (!chat) {
        return res.status(404).json({ message: 'Chat not found' });
      }

      // Verify user is participant
      const isParticipant = chat.participants.some(
        p => p.userId.toString() === req.user._id.toString()
      );

      if (!isParticipant) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const newMessage = {
        senderId: req.user._id,
        message: message || '',
        messageType: messageType,
        fileUrl: req.fileUrl || '',
        fileName: fileName || '',
        timestamp: new Date(),
        read: false,
        readBy: []
      };

      chat.messages.push(newMessage);
      chat.lastMessage = messageType === 'text' ? message : (messageType === 'image' ? '📷 Image' : '📎 File');
      chat.lastMessageTime = new Date();
      chat.updatedAt = new Date();

      // Update unread count for other participant
      const otherParticipant = chat.participants.find(
        p => p.userId.toString() !== req.user._id.toString()
      );
      if (otherParticipant) {
        if (!chat.unreadCount) {
          chat.unreadCount = {};
        }
        const currentUnread = chat.unreadCount[otherParticipant.userId.toString()] || 0;
        chat.unreadCount[otherParticipant.userId.toString()] = currentUnread + 1;
      }

      await chat.save();

      res.json(chat.messages[chat.messages.length - 1]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Mark messages as read
router.put('/:roomId/read', auth, async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.roomId);

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Verify user is participant
    const isParticipant = chat.participants.some(
      p => p.userId.toString() === req.user._id.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Mark all messages as read for this user
    chat.messages.forEach(msg => {
      if (msg.senderId.toString() !== req.user._id.toString() && !msg.read) {
        msg.read = true;
        if (!msg.readBy) {
          msg.readBy = [];
        }
        msg.readBy.push({
          userId: req.user._id,
          readAt: new Date()
        });
      }
    });

    // Reset unread count
    if (!chat.unreadCount) {
      chat.unreadCount = {};
    }
    chat.unreadCount[req.user._id.toString()] = 0;

    await chat.save();

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

