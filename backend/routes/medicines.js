const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const Medicine = require('../models/Medicine');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');

// Assign medicine (Doctor)
router.post('/assign', auth, authorize('doctor'), async (req, res) => {
  try {
    const {
      patientId,
      medicineName,
      dosage,
      frequency,
      timings,
      beforeAfterMeal,
      duration,
      instructions
    } = req.body;

    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found' });
    }

    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Verify connection
    const isConnected = patient.currentDoctors.some(
      doc => doc.doctorId.toString() === doctor._id.toString()
    );

    if (!isConnected) {
      return res.status(403).json({ message: 'Not connected with this patient' });
    }

    const medicine = new Medicine({
      patientId,
      doctorId: doctor._id,
      medicineName,
      dosage,
      frequency,
      timings: timings.map(t => ({ time: t, taken: false })),
      beforeAfterMeal,
      duration,
      instructions
    });

    await medicine.save();

    res.status(201).json(medicine);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get medicines for patient
router.get('/patient', auth, authorize('patient'), async (req, res) => {
  try {
    const patient = await Patient.findOne({ userId: req.user._id });
    if (!patient) {
      return res.status(404).json({ message: 'Patient profile not found' });
    }

    const medicines = await Medicine.find({
      patientId: patient._id,
      status: 'active'
    })
      .populate('doctorId', 'specialization')
      .populate({
        path: 'doctorId',
        populate: {
          path: 'userId',
          select: 'name'
        }
      })
      .sort({ assignedAt: -1 });

    res.json(medicines);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark medicine as taken
router.put('/:medicineId/taken', auth, authorize('patient'), async (req, res) => {
  try {
    const { time } = req.body; // Time slot to mark as taken

    const patient = await Patient.findOne({ userId: req.user._id });
    if (!patient) {
      return res.status(404).json({ message: 'Patient profile not found' });
    }

    const medicine = await Medicine.findById(req.params.medicineId);
    if (!medicine || medicine.patientId.toString() !== patient._id.toString()) {
      return res.status(404).json({ message: 'Medicine not found' });
    }

    const timing = medicine.timings.find(t => t.time === time);
    if (!timing) {
      return res.status(400).json({ message: 'Invalid time slot' });
    }

    timing.taken = true;
    timing.takenAt = new Date();

    await medicine.save();

    res.json(medicine);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get medicines assigned by doctor
router.get('/doctor/assigned', auth, authorize('doctor'), async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found' });
    }

    const medicines = await Medicine.find({ doctorId: doctor._id })
      .populate('patientId', null, 'Patient')
      .populate({
        path: 'patientId',
        populate: {
          path: 'userId',
          select: 'name email'
        }
      })
      .sort({ assignedAt: -1 });

    res.json(medicines);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

