const mongoose = require('mongoose');

const hospitalSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  hospitalName: {
    type: String,
    required: true
  },
  registrationId: {
    type: String,
    required: true,
    unique: true
  },
  registrationDocument: {
    type: String // URL to uploaded document
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  contact: {
    phone: String,
    email: String,
    emergency: String
  },
  ambulances: [{
    vehicleNumber: String,
    driverName: String,
    driverPhone: String,
    status: {
      type: String,
      enum: ['available', 'on-route', 'busy'],
      default: 'available'
    },
    currentLocation: {
      latitude: Number,
      longitude: Number
    }
  }],
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
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Hospital', hospitalSchema);

