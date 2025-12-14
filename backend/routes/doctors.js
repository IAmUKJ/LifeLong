const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const Doctor = require('../models/Doctor');
const User = require('../models/User');
const Patient = require('../models/Patient');
const { Chat } = require('../models/Chat');
const { upload, uploadToCloudinaryMiddleware } = require('../middleware/cloudinaryUpload');

// Get all verified doctors
router.get('/', async (req, res) => {
  try {
    const { specialization, symptom } = req.query;
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

    res.json(doctors);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get doctor profile
router.get('/profile', auth, authorize('doctor'), async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user._id })
      .populate('userId', 'name email phone profilePicture');

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found' });
    }

    res.json(doctor);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Complete doctor profile (after registration) with file upload
router.put('/profile', 
  auth, 
  authorize('doctor'), 
  upload.single('licenseDocument'),
  uploadToCloudinaryMiddleware,
  async (req, res) => {
    try {
      const {
        specialization,
        qualifications,
        experience,
        practiceLicense,
        registrationNumber,
        bio,
        consultationFee,
        availability,
        symptoms
      } = req.body;

      const doctor = await Doctor.findOne({ userId: req.user._id });

      if (!doctor) {
        return res.status(404).json({ message: 'Doctor profile not found' });
      }

      doctor.specialization = specialization || doctor.specialization;
      doctor.qualifications = qualifications ? JSON.parse(qualifications) : doctor.qualifications;
      doctor.experience = experience || doctor.experience;
      doctor.practiceLicense = practiceLicense || doctor.practiceLicense;
      doctor.registrationNumber = registrationNumber || doctor.registrationNumber;
      doctor.bio = bio || doctor.bio;
      doctor.consultationFee = consultationFee || doctor.consultationFee;
      doctor.availability = availability ? JSON.parse(availability) : doctor.availability;
      doctor.symptoms = symptoms ? JSON.parse(symptoms) : doctor.symptoms;

      // Handle file upload to Cloudinary
      if (req.fileUrl) {
        doctor.licenseDocument = req.fileUrl;
      }

      await doctor.save();

      res.json(doctor);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
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
    const doctor = await Doctor.findById(req.params.id)
      .populate('userId', 'name email phone profilePicture')
      .select('-licenseDocument');

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    res.json(doctor);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

