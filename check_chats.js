const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });
const Chat = require('./backend/models/Chat');

async function checkChats() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const chats = await Chat.find({});
    console.log('Total chats:', chats.length);

    chats.forEach((chat, index) => {
      console.log(`Chat ${index + 1}:`, chat._id);
      chat.participants.forEach((p, i) => {
        console.log(`  Participant ${i + 1}:`, {
          userId: p.userId,
          role: p.role
        });
      });
    });

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

checkChats();