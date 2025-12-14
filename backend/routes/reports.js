const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const Report = require('../models/Report');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');

// Generate report (Doctor)
router.post('/generate', auth, authorize('doctor'), async (req, res) => {
  try {
    const {
      patientId,
      reportType,
      title,
      content,
      observations
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

    const report = new Report({
      patientId,
      doctorId: doctor._id,
      reportType,
      title,
      content,
      observations
    });

    await report.save();

    res.status(201).json(report);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get patient reports
router.get('/patient', auth, authorize('patient'), async (req, res) => {
  try {
    const patient = await Patient.findOne({ userId: req.user._id });
    if (!patient) {
      return res.status(404).json({ message: 'Patient profile not found' });
    }

    const reports = await Report.find({ patientId: patient._id })
      .populate('doctorId', 'specialization')
      .populate({
        path: 'doctorId',
        populate: {
          path: 'userId',
          select: 'name'
        }
      })
      .sort({ createdAt: -1 });

    res.json(reports);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Upload report and get chatbot insights
router.post('/upload', auth, authorize('patient'), async (req, res) => {
  try {
    const { reportId, fileUrl } = req.body;

    const patient = await Patient.findOne({ userId: req.user._id });
    if (!patient) {
      return res.status(404).json({ message: 'Patient profile not found' });
    }

    const report = await Report.findById(reportId);
    if (!report || report.patientId.toString() !== patient._id.toString()) {
      return res.status(404).json({ message: 'Report not found' });
    }

    report.fileUrl = fileUrl;

    // Simulate chatbot analysis (in production, integrate with AI service)
    const chatbotInsights = {
      summary: `Analysis of ${report.title}: Key findings include ${report.observations?.length || 0} observations.`,
      keyFindings: report.observations?.map(obs => `${obs.symptom}: ${obs.status}`) || [],
      recommendations: [
        'Continue current treatment plan',
        'Monitor symptoms regularly',
        'Follow up with doctor if symptoms worsen'
      ],
      analyzedAt: new Date()
    };

    report.chatbotInsights = chatbotInsights;
    await report.save();

    res.json(report);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get doctor's generated reports
router.get('/doctor/generated', auth, authorize('doctor'), async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found' });
    }

    const reports = await Report.find({ doctorId: doctor._id })
      .populate('patientId', null, 'Patient')
      .populate({
        path: 'patientId',
        populate: {
          path: 'userId',
          select: 'name email'
        }
      })
      .sort({ createdAt: -1 });

    res.json(reports);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

