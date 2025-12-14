const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const Doctor = require('../models/Doctor');
const Hospital = require('../models/Hospital');

// Verify doctor
router.put('/verify-doctor/:doctorId', auth, authorize('admin'), async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.doctorId);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    doctor.isVerified = true;
    doctor.verifiedBy = req.user._id;
    doctor.verifiedAt = new Date();

    await doctor.save();

    res.json({ message: 'Doctor verified successfully', doctor });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reject doctor
router.put('/reject-doctor/:doctorId', auth, authorize('admin'), async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.doctorId);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    doctor.isVerified = false;
    await doctor.save();

    res.json({ message: 'Doctor rejected', doctor });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Verify hospital
router.put('/verify-hospital/:hospitalId', auth, authorize('admin'), async (req, res) => {
  try {
    const hospital = await Hospital.findById(req.params.hospitalId);
    if (!hospital) {
      return res.status(404).json({ message: 'Hospital not found' });
    }

    hospital.isVerified = true;
    hospital.verifiedBy = req.user._id;
    hospital.verifiedAt = new Date();

    await hospital.save();

    res.json({ message: 'Hospital verified successfully', hospital });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get pending verifications
router.get('/pending', auth, authorize('admin'), async (req, res) => {
  try {
    const pendingDoctors = await Doctor.find({ isVerified: false })
      .populate('userId', 'name email phone');

    const pendingHospitals = await Hospital.find({ isVerified: false })
      .populate('userId', 'name email phone');

    res.json({
      doctors: pendingDoctors,
      hospitals: pendingHospitals
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

