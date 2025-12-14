const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
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
  reportType: {
    type: String,
    enum: ['progress', 'medical', 'lab'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  observations: [{
    symptom: String,
    status: String, // e.g., "improved", "resolved", "worsened"
    notes: String
  }],
  fileUrl: {
    type: String // For uploaded reports
  },
  chatbotInsights: {
    summary: String,
    keyFindings: [String],
    recommendations: [String],
    analyzedAt: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Report', reportSchema);

