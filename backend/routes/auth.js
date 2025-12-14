const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const Hospital = require('../models/Hospital');
const { auth } = require('../middleware/auth');
const { upload, uploadToCloudinaryMiddleware } = require('../middleware/cloudinaryUpload');

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'your_jwt_secret_key_here', {
    expiresIn: '30d'
  });
};

// Register User
router.post('/register', 
  upload.single('licenseDocument'),
  uploadToCloudinaryMiddleware,
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('name').trim().notEmpty(),
    body('role').isIn(['patient', 'doctor', 'hospital'])
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, email, password, role, phone, dateOfBirth, gender, practiceLicense, registrationNumber } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }

      // Validate doctor registration
      if (role === 'doctor') {
        if (!practiceLicense || !registrationNumber) {
          return res.status(400).json({ message: 'Practice license and registration number are required for doctors' });
        }
        // Temporarily remove file requirement for testing
        // if (!req.file && !req.fileUrl) {
        //   return res.status(400).json({ message: 'License document image is required for doctors' });
        // }
      }

      // Create user
      const user = new User({
        name,
        email,
        password,
        role,
        phone,
        dateOfBirth,
        gender,
        isVerified: role === 'patient' // Patients are auto-verified
      });

      await user.save();

      // Create role-specific profile
    try {
      if (role === 'patient') {
        const patient = new Patient({ userId: user._id });
        await patient.save();
      } else if (role === 'doctor') {
        const doctor = new Doctor({ 
          userId: user._id,
          practiceLicense: practiceLicense,
          registrationNumber: registrationNumber,
          licenseDocument: req.fileUrl || '',
          isVerified: false // Doctors need admin verification
        });
        await doctor.save();
      } else if (role === 'hospital') {
        const hospital = new Hospital({ userId: user._id });
        await hospital.save();
      }
    } catch (profileError) {
      console.error('Profile creation error:', profileError);
      // Delete the user if profile creation fails
      await User.findByIdAndDelete(user._id);
      return res.status(500).json({ message: 'Failed to create profile', error: profileError.message });
    }

    const token = generateToken(user._id);

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      message: role === 'doctor' ? 'Registration successful! Your license is under review by admin.' : 'Registration successful!'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login User
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user._id);

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get Current User
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
