const mongoose = require('mongoose');

const fitnessSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  activityType: {
    type: String,
    enum: ['walking', 'running', 'breathing'],
    required: true
  },
  duration: {
    type: Number, // in minutes
    required: true
  },
  distance: {
    type: Number // in km (for walking/running)
  },
  points: {
    type: Number,
    default: 0
  },
  level: {
    type: Number,
    default: 1
  },
  achievements: [{
    title: String,
    description: String,
    unlockedAt: Date
  }],
  date: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Fitness', fitnessSchema);

