const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  specialization: {
    type: String,
    required: false
  },
  qualifications: [{
    degree: String,
    institution: String,
    year: Number
  }],
  experience: {
    type: Number,
    required: false
  },
  practiceLicense: {
    type: String,
    required: true,
    unique: true
  },
  registrationNumber: {
    type: String,
    required: true,
    unique: true
  },
  profilePicture: {
    type: String // URL to uploaded document
  },

  licenseDocument: {
    type: String // URL to uploaded document
  },
  bio: {
    type: String
  },
  consultationFee: {
    type: Number,
    default: 0
  },
  availability: {
    days: [{
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    }],
    timeSlots: [{
      start: String,
      end: String
    }]
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verifiedAt: {
    type: Date
  },
  rating: {
    average: {
      type: Number,
      default: 0
    },
    count: {
      type: Number,
      default: 0
    }
  },
  symptoms: [{
    type: String // Symptoms this doctor can treat
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Doctor', doctorSchema);

