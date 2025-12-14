import React, { useState, useEffect } from 'react';
import api from '../../utils/api';

const ReportGeneration: React.FC = () => {
  const [patients, setPatients] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    patientId: '',
    reportType: 'progress',
    title: '',
    content: '',
    observations: [] as any[],
  });
  const [currentObservation, setCurrentObservation] = useState({
    symptom: '',
    status: '',
    notes: '',
  });

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const response = await api.get('/doctors/patients/list');
      setPatients(response.data);
    } catch (error) {
      console.error('Error fetching patients:', error);
    }
  };

  const addObservation = () => {
    if (currentObservation.symptom && currentObservation.status) {
      setFormData({
        ...formData,
        observations: [...formData.observations, { ...currentObservation }],
      });
      setCurrentObservation({ symptom: '', status: '', notes: '' });
    }
  };

  const removeObservation = (index: number) => {
    setFormData({
      ...formData,
      observations: formData.observations.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/reports/generate', formData);
      alert('Report generated successfully!');
      setFormData({
        patientId: '',
        reportType: 'progress',
        title: '',
        content: '',
        observations: [],
      });
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to generate report');
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-2xl font-semibold mb-6">Generate Patient Report</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-gray-700 mb-2">Patient</label>
          <select
            value={formData.patientId}
            onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg"
            required
          >
            <option value="">Select Patient</option>
            {patients.map((patient) => (
              <option key={patient._id} value={patient._id}>
                {patient.userId?.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-gray-700 mb-2">Report Type</label>
          <select
            value={formData.reportType}
            onChange={(e) => setFormData({ ...formData, reportType: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg"
          >
            <option value="progress">Progress Report</option>
            <option value="medical">Medical Report</option>
            <option value="lab">Lab Report</option>
          </select>
        </div>
        <div>
          <label className="block text-gray-700 mb-2">Title</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg"
            required
          />
        </div>
        <div>
          <label className="block text-gray-700 mb-2">Content</label>
          <textarea
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg"
            rows={5}
            required
          />
        </div>
        <div>
          <label className="block text-gray-700 mb-2">Observations</label>
          <div className="space-y-2 mb-2">
            <input
              type="text"
              placeholder="Symptom"
              value={currentObservation.symptom}
              onChange={(e) =>
                setCurrentObservation({ ...currentObservation, symptom: e.target.value })
              }
              className="w-full px-4 py-2 border rounded-lg"
            />
            <input
              type="text"
              placeholder="Status (e.g., improved, resolved, worsened)"
              value={currentObservation.status}
              onChange={(e) =>
                setCurrentObservation({ ...currentObservation, status: e.target.value })
              }
              className="w-full px-4 py-2 border rounded-lg"
            />
            <input
              type="text"
              placeholder="Notes"
              value={currentObservation.notes}
              onChange={(e) =>
                setCurrentObservation({ ...currentObservation, notes: e.target.value })
              }
              className="w-full px-4 py-2 border rounded-lg"
            />
            <button
              type="button"
              onClick={addObservation}
              className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
            >
              Add Observation
            </button>
          </div>
          <div className="space-y-2">
            {formData.observations.map((obs, index) => (
              <div
                key={index}
                className="p-3 bg-gray-50 rounded-lg flex justify-between items-center"
              >
                <div>
                  <p className="font-semibold">{obs.symptom}</p>
                  <p className="text-sm text-gray-600">
                    Status: {obs.status} {obs.notes && `- ${obs.notes}`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeObservation(index)}
                  className="text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
        <button
          type="submit"
          className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          Generate Report
        </button>
      </form>
    </div>
  );
};

export default ReportGeneration;

