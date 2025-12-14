const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  review: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

ratingSchema.index({ doctorId: 1, patientId: 1 }, { unique: true });

module.exports = mongoose.model('Rating', ratingSchema);

