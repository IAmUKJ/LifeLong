const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const User = require('../models/User');

const createAdmin = async () => {
  try {
    // Connect to MongoDB
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/lifelong';
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('Admin account already exists!');
      console.log(`Email: ${existingAdmin.email}`);
      // Update password to plain text, let the model hash it
      existingAdmin.password = 'admin123';
      await existingAdmin.save();
      console.log('Password updated to admin123');
      process.exit(0);
    }

    // Default admin credentials (change these!)
    const adminData = {
      name: 'Admin',
      email: 'admin@lifelong.com',
      password: 'admin123', // Plain text, will be hashed by model
      role: 'admin',
      isVerified: true,
    };

    // No need to hash here, the model pre-save hook will do it

    // Create admin user
    const admin = new User(adminData);
    await admin.save();

    console.log('✅ Admin account created successfully!');
    console.log('\n📧 Admin Credentials:');
    console.log(`   Email: ${adminData.email}`);
    console.log(`   Password: admin123`);
    console.log('\n⚠️  IMPORTANT: Change the password after first login!');
    console.log('\n🔒 To change password, update it in the database or create a password change endpoint.');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin account:', error);
    process.exit(1);
  }
};

createAdmin();

