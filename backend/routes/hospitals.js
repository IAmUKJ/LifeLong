const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const Hospital = require('../models/Hospital');
const User = require('../models/User');

// Get all verified hospitals
router.get('/', async (req, res) => {
  try {
    const hospitals = await Hospital.find({ isVerified: true })
      .populate('userId', 'name email phone')
      .select('-registrationDocument');

    res.json(hospitals);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Complete hospital profile
router.put('/profile', auth, authorize('hospital'), async (req, res) => {
  try {
    const {
      hospitalName,
      registrationId,
      address,
      contact,
      ambulances
    } = req.body;

    const hospital = await Hospital.findOne({ userId: req.user._id });
    if (!hospital) {
      return res.status(404).json({ message: 'Hospital profile not found' });
    }

    hospital.hospitalName = hospitalName || hospital.hospitalName;
    hospital.registrationId = registrationId || hospital.registrationId;
    if (address) hospital.address = address;
    if (contact) hospital.contact = contact;
    if (ambulances) hospital.ambulances = ambulances;

    await hospital.save();

    res.json(hospital);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Book ambulance
router.post('/ambulance/book', auth, async (req, res) => {
  try {
    const { hospitalId, patientLocation } = req.body;

    const hospital = await Hospital.findById(hospitalId);
    if (!hospital || !hospital.isVerified) {
      return res.status(404).json({ message: 'Hospital not found or not verified' });
    }

    // Find available ambulance
    const availableAmbulance = hospital.ambulances.find(
      amb => amb.status === 'available'
    );

    if (!availableAmbulance) {
      return res.status(400).json({ message: 'No ambulance available at the moment' });
    }

    // Update ambulance status
    availableAmbulance.status = 'on-route';
    availableAmbulance.currentLocation = patientLocation;

    await hospital.save();

    res.json({
      message: 'Ambulance booked successfully',
      ambulance: availableAmbulance,
      estimatedTime: '10-15 minutes' // Calculate based on distance
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get hospital profile
router.get('/profile', auth, authorize('hospital'), async (req, res) => {
  try {
    const hospital = await Hospital.findOne({ userId: req.user._id })
      .populate('userId', 'name email phone');

    if (!hospital) {
      return res.status(404).json({ message: 'Hospital profile not found' });
    }

    res.json(hospital);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

