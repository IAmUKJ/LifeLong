const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const User = require('../models/User');

// Get patient profile
router.get('/profile', auth, authorize('patient'), async (req, res) => {
  try {
    const patient = await Patient.findOne({ userId: req.user._id })
      .populate('currentDoctors.doctorId', 'specialization')
      .populate('currentDoctors.doctorId', null, 'Doctor')
      .populate('userId', 'name email phone dateOfBirth gender profilePicture');

    if (!patient) {
      return res.status(404).json({ message: 'Patient profile not found' });
    }

    res.json(patient);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update patient profile
router.put('/profile', auth, authorize('patient'), async (req, res) => {
  try {
    const { bloodGroup, allergies, medicalHistory } = req.body;

    const patient = await Patient.findOne({ userId: req.user._id });
    if (!patient) {
      return res.status(404).json({ message: 'Patient profile not found' });
    }

    if (bloodGroup) patient.bloodGroup = bloodGroup;
    if (allergies) patient.allergies = allergies;
    if (medicalHistory) patient.medicalHistory = medicalHistory;

    await patient.save();

    res.json(patient);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Connect with doctor
router.post('/connect-doctor/:doctorId', auth, authorize('patient'), async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.doctorId);
    if (!doctor || !doctor.isVerified) {
      return res.status(404).json({ message: 'Doctor not found or not verified' });
    }

    const patient = await Patient.findOne({ userId: req.user._id });
    if (!patient) {
      return res.status(404).json({ message: 'Patient profile not found' });
    }

    // Check if already connected
    const existingConnection = patient.currentDoctors.find(
      doc => doc.doctorId.toString() === req.params.doctorId
    );

    if (existingConnection) {
      return res.status(400).json({ message: 'Already connected with this doctor' });
    }

    patient.currentDoctors.push({
      doctorId: req.params.doctorId,
      status: 'active'
    });

    await patient.save();

    res.json({ message: 'Successfully connected with doctor', patient });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get connected doctors
router.get('/doctors', auth, authorize('patient'), async (req, res) => {
  try {
    const patient = await Patient.findOne({ userId: req.user._id })
      .populate({
        path: 'currentDoctors.doctorId',
        populate: {
          path: 'userId',
          select: 'name email phone profilePicture'
        }
      });

    if (!patient) {
      return res.status(404).json({ message: 'Patient profile not found' });
    }

    res.json(patient.currentDoctors);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

