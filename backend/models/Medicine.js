const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema({
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
  medicineName: {
    type: String,
    required: true
  },
  dosage: {
    type: String,
    required: true
  },
  frequency: {
    type: String, // e.g., "2 times a day", "once daily"
    required: true
  },
  timings: [{
    time: {
      type: String, // e.g., "09:00", "21:00"
      required: true
    },
    taken: {
      type: Boolean,
      default: false
    },
    takenAt: {
      type: Date
    }
  }],
  beforeAfterMeal: {
    type: String,
    enum: ['before', 'after', 'with', 'anytime'],
    required: true
  },
  duration: {
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    }
  },
  instructions: {
    type: String
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'stopped'],
    default: 'active'
  },
  assignedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Medicine', medicineSchema);

