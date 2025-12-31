const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const Doctor = require('../models/Doctor');
const User = require('../models/User');
const Patient = require('../models/Patient');
const { Chat } = require('../models/Chat');
const { uploadToCloudinaryMiddleware } = require('../middleware/cloudinaryUpload');
const { upload } = require('../middleware/multer');
const redisClient = require('../utils/redis');

// Get all verified doctors
router.get('/', async (req, res) => {
  try {
    const { specialization, symptom } = req.query;

    const cacheKey = `doctors:list:${specialization || 'all'}:${symptom || 'all'}`;

    // 1️⃣ Check Redis
    const cachedDoctors = await redisClient.get(cacheKey);
    if (cachedDoctors) {
      console.log('⚡ Doctors list served from Redis');
      return res.json(JSON.parse(cachedDoctors));
    }

    let query = { isVerified: true };

    if (specialization) {
      query.specialization = new RegExp(specialization, 'i');
    }

    if (symptom) {
      query.symptoms = { $in: [new RegExp(symptom, 'i')] };
    }

    const doctors = await Doctor.find(query)
      .populate('userId', 'name email phone profilePicture')
      .select('-licenseDocument');

    // 2️⃣ Cache for 10 minutes
    await redisClient.setEx(
      cacheKey,
      600,
      JSON.stringify(doctors)
    );

    console.log('📦 Doctors list cached in Redis');
    res.json(doctors);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get doctor profile
router.get('/profile', auth, authorize('doctor'), async (req, res) => {
  try {
    const cacheKey = `doctor:profile:${req.user._id}`;

    const cachedDoctor = await redisClient.get(cacheKey);
    if (cachedDoctor) {
      console.log('⚡ Doctor profile served from Redis');
      return res.json(JSON.parse(cachedDoctor));
    }

    const doctor = await Doctor.findOne({ userId: req.user._id })
      .populate('userId', 'name email phone profilePicture');

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found' });
    }

    await redisClient.setEx(
      cacheKey,
      300,
      JSON.stringify(doctor)
    );

    console.log('📦 Doctor profile cached in Redis');
    res.json(doctor);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Complete doctor profile (after registration) with file upload
router.put(
  '/profile',
  auth,
  authorize('doctor'),
  upload.fields([
    { name: 'licenseDocument', maxCount: 1 },
    { name: 'profilePicture', maxCount: 1 }
  ]),
  uploadToCloudinaryMiddleware,
  async (req, res) => {
    try {

      const doctor = await Doctor.findOne({ userId: req.user._id });

      if (!doctor) {
        return res.status(404).json({ message: 'Doctor profile not found' });
      }

      const {
        specialization,
        experience,
        bio,
        consultationFee,
        qualifications,
        availability,
        symptoms
      } = req.body;

      if (specialization !== undefined && specialization !== '')
        doctor.specialization = specialization;

      if (experience !== undefined && experience !== '')
        doctor.experience = Number(experience);

      if (bio !== undefined)
        doctor.bio = bio;

      if (consultationFee !== undefined && consultationFee !== '')
        doctor.consultationFee = Number(consultationFee);

      if (qualifications) {
        doctor.qualifications =
          typeof qualifications === 'string'
            ? JSON.parse(qualifications)
            : qualifications;
      }

      if (availability) {
        doctor.availability =
          typeof availability === 'string'
            ? JSON.parse(availability)
            : availability;
      }

      if (symptoms) {
        doctor.symptoms =
          typeof symptoms === 'string'
            ? JSON.parse(symptoms)
            : symptoms;
      }

      if (req.licenseDocumentUrl){
        doctor.licenseDocument = req.licenseDocumentUrl;
      }
      if (req.profilePictureUrl){
        doctor.profilePicture = req.profilePictureUrl;
      }
      await doctor.save();
      await redisClient.del(`doctor:profile:${req.user._id}`);
      await redisClient.del(`doctor:public:${doctor._id}`);

      res.json({
        success: true,
        message: 'Doctor profile saved successfully',
        doctor
      });
    } catch (error) {
      console.error('PROFILE SAVE ERROR:', error);
      res.status(500).json({
        message: 'Server error',
        error: error.message
      });
    }
  }
);


// Get doctor's patients
router.get('/patients/list', auth, authorize('doctor'), async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    const patients = await Patient.find({
      'currentDoctors.doctorId': doctor._id,
      'currentDoctors.status': 'active'
    })
      .populate('userId', 'name email phone profilePicture')
      .populate('currentDoctors.doctorId', 'specialization');

    // Get chat info for each patient
    const patientsWithChat = await Promise.all(patients.map(async (patient) => {
      const chat = await Chat.findOne({
        $and: [
          { 'participants.userId': req.user._id },
          { 'participants.userId': patient.userId._id }
        ]
      });

      let unreadCount = 0;
      if (chat?.unreadCount) {
        if (chat.unreadCount instanceof Map) {
          unreadCount = chat.unreadCount.get(req.user._id.toString()) || 0;
        } else if (typeof chat.unreadCount === 'object') {
          unreadCount = chat.unreadCount[req.user._id.toString()] || 0;
        }
      }

      return {
        ...patient.toObject(),
        chatId: chat?._id,
        unreadCount
      };
    }));

    res.json(patientsWithChat);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Filter doctors by symptoms
router.post('/filter-by-symptoms', async (req, res) => {
  try {
    const { symptoms } = req.body; // Array of symptom strings

    if (!symptoms || !Array.isArray(symptoms)) {
      return res.status(400).json({ message: 'Symptoms array is required' });
    }

    const doctors = await Doctor.find({
      isVerified: true,
      symptoms: { $in: symptoms.map(s => new RegExp(s, 'i')) }
    })
      .populate('userId', 'name email phone profilePicture')
      .select('-licenseDocument')
      .sort({ 'rating.average': -1 });

    res.json(doctors);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get doctor by ID
router.get('/:id', async (req, res) => {
  try {
    const cacheKey = `doctor:public:${req.params.id}`;

    const cachedDoctor = await redisClient.get(cacheKey);
    if (cachedDoctor) {
      return res.json(JSON.parse(cachedDoctor));
    }

    const doctor = await Doctor.findById(req.params.id)
      .populate('userId', 'name email phone profilePicture')
      .select('-licenseDocument');

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    await redisClient.setEx(
      cacheKey,
      600,
      JSON.stringify(doctor)
    );

    res.json(doctor);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

