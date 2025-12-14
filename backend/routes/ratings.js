const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const Rating = require('../models/Rating');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');

// Rate doctor
router.post('/rate-doctor', auth, authorize('patient'), async (req, res) => {
  try {
    const { doctorId, rating, review } = req.body;

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    const patient = await Patient.findOne({ userId: req.user._id });
    if (!patient) {
      return res.status(404).json({ message: 'Patient profile not found' });
    }

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    // Check if already rated
    let existingRating = await Rating.findOne({
      patientId: patient._id,
      doctorId: doctor._id
    });

    if (existingRating) {
      // Update existing rating
      existingRating.rating = rating;
      existingRating.review = review;
      await existingRating.save();
    } else {
      // Create new rating
      existingRating = new Rating({
        patientId: patient._id,
        doctorId: doctor._id,
        rating,
        review
      });
      await existingRating.save();
    }

    // Update doctor's average rating
    const ratings = await Rating.find({ doctorId: doctor._id });
    const averageRating = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;

    doctor.rating.average = averageRating;
    doctor.rating.count = ratings.length;
    await doctor.save();

    res.json(existingRating);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get doctor ratings
router.get('/doctor/:doctorId', async (req, res) => {
  try {
    const ratings = await Rating.find({ doctorId: req.params.doctorId })
      .populate('patientId', null, 'Patient')
      .populate({
        path: 'patientId',
        populate: {
          path: 'userId',
          select: 'name profilePicture'
        }
      })
      .sort({ createdAt: -1 });

    res.json(ratings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

