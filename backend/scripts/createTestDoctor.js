const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const User = require('../models/User');
const Doctor = require('../models/Doctor');

const createTestDoctor = async () => {
  try {
    // Connect to MongoDB
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/lifelong';
    await mongoose.connect(MONGODB_URI);

    console.log('Connected to MongoDB');

    // Check if test doctor already exists
    const existingDoctor = await User.findOne({ email: 'doctor@test.com' });
    if (existingDoctor) {
      console.log('Test doctor exists, removing...');
      await Doctor.deleteOne({ userId: existingDoctor._id });
      await User.deleteOne({ _id: existingDoctor._id });
      console.log('Test doctor removed!');
      process.exit(0);
    }

    // Create test doctor user
    const doctorUser = new User({
      name: 'Dr. Test Doctor',
      email: 'doctor@test.com',
      password: 'doctor123', // Will be hashed by pre-save hook
      role: 'doctor',
      phone: '1234567890',
      isVerified: false
    });

    await doctorUser.save();

    // Create doctor profile
    const doctor = new Doctor({
      userId: doctorUser._id,
      specialization: 'General Medicine',
      qualifications: [{
        degree: 'MBBS',
        institution: 'Test Medical College',
        year: 2020
      }],
      experience: 3,
      practiceLicense: 'TEST12345',
      registrationNumber: 'REG67890',
      bio: 'Test doctor for verification',
      consultationFee: 500,
      availability: {
        days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        timeSlots: [{
          start: '09:00',
          end: '17:00'
        }]
      },
      isVerified: false
    });

    await doctor.save();

    console.log('✅ Test doctor created successfully!');
    console.log('\n📧 Doctor Credentials:');
    console.log(`   Email: doctor@test.com`);
    console.log(`   Password: doctor123`);
    console.log('\n⚠️  This is a test account for verification purposes');

  } catch (error) {
    console.error('Error creating test doctor:', error);
  } finally {
    mongoose.connection.close();
  }
};

createTestDoctor();