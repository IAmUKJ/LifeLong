const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const Fitness = require('../models/Fitness');
const Patient = require('../models/Patient');

// Log fitness activity
router.post('/log', auth, authorize('patient'), async (req, res) => {
  try {
    const { activityType, duration, distance } = req.body;

    const patient = await Patient.findOne({ userId: req.user._id });
    if (!patient) {
      return res.status(404).json({ message: 'Patient profile not found' });
    }

    // Calculate points based on activity
    let points = 0;
    if (activityType === 'walking') {
      points = Math.floor(duration / 5); // 1 point per 5 minutes
    } else if (activityType === 'running') {
      points = Math.floor(duration / 3); // 1 point per 3 minutes
    } else if (activityType === 'breathing') {
      points = Math.floor(duration / 10); // 1 point per 10 minutes
    }

    const fitness = new Fitness({
      patientId: patient._id,
      activityType,
      duration,
      distance,
      points
    });

    await fitness.save();

    // Calculate level based on total points
    const totalPoints = await Fitness.aggregate([
      { $match: { patientId: patient._id } },
      { $group: { _id: null, total: { $sum: '$points' } } }
    ]);

    const level = Math.floor((totalPoints[0]?.total || 0) / 100) + 1;
    fitness.level = level;
    await fitness.save();

    res.status(201).json(fitness);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get fitness stats
router.get('/stats', auth, authorize('patient'), async (req, res) => {
  try {
    const patient = await Patient.findOne({ userId: req.user._id });
    if (!patient) {
      return res.status(404).json({ message: 'Patient profile not found' });
    }

    const stats = await Fitness.aggregate([
      { $match: { patientId: patient._id } },
      {
        $group: {
          _id: '$activityType',
          totalDuration: { $sum: '$duration' },
          totalDistance: { $sum: '$distance' },
          totalPoints: { $sum: '$points' },
          count: { $sum: 1 }
        }
      }
    ]);

    const totalPoints = await Fitness.aggregate([
      { $match: { patientId: patient._id } },
      { $group: { _id: null, total: { $sum: '$points' } } }
    ]);

    const level = Math.floor((totalPoints[0]?.total || 0) / 100) + 1;

    res.json({
      stats,
      totalPoints: totalPoints[0]?.total || 0,
      level,
      achievements: [] // Can be implemented later
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get fitness history
router.get('/history', auth, authorize('patient'), async (req, res) => {
  try {
    const patient = await Patient.findOne({ userId: req.user._id });
    if (!patient) {
      return res.status(404).json({ message: 'Patient profile not found' });
    }

    const history = await Fitness.find({ patientId: patient._id })
      .sort({ date: -1 })
      .limit(30);

    res.json(history);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

