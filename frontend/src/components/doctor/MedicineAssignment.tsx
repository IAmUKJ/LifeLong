import React, { useState, useEffect } from 'react';
import api from '../../utils/api';

const MedicineAssignment: React.FC = () => {
  const [patients, setPatients] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    patientId: '',
    medicineName: '',
    dosage: '',
    frequency: '',
    timings: [] as string[],
    beforeAfterMeal: 'after',
    duration: {
      startDate: '',
      endDate: '',
    },
    instructions: '',
  });
  const [currentTime, setCurrentTime] = useState('');

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

  const addTiming = () => {
    if (currentTime && !formData.timings.includes(currentTime)) {
      setFormData({
        ...formData,
        timings: [...formData.timings, currentTime],
      });
      setCurrentTime('');
    }
  };

  const removeTiming = (time: string) => {
    setFormData({
      ...formData,
      timings: formData.timings.filter((t) => t !== time),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/medicines/assign', formData);
      alert('Medicine assigned successfully!');
      setFormData({
        patientId: '',
        medicineName: '',
        dosage: '',
        frequency: '',
        timings: [],
        beforeAfterMeal: 'after',
        duration: {
          startDate: '',
          endDate: '',
        },
        instructions: '',
      });
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to assign medicine');
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-2xl font-semibold mb-6">Assign Medicine</h2>
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
          <label className="block text-gray-700 mb-2">Medicine Name</label>
          <input
            type="text"
            value={formData.medicineName}
            onChange={(e) => setFormData({ ...formData, medicineName: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg"
            required
          />
        </div>
        <div>
          <label className="block text-gray-700 mb-2">Dosage</label>
          <input
            type="text"
            value={formData.dosage}
            onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
            placeholder="e.g., 500mg"
            className="w-full px-4 py-2 border rounded-lg"
            required
          />
        </div>
        <div>
          <label className="block text-gray-700 mb-2">Frequency</label>
          <input
            type="text"
            value={formData.frequency}
            onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
            placeholder="e.g., 2 times a day"
            className="w-full px-4 py-2 border rounded-lg"
            required
          />
        </div>
        <div>
          <label className="block text-gray-700 mb-2">Timings</label>
          <div className="flex gap-2 mb-2">
            <input
              type="time"
              value={currentTime}
              onChange={(e) => setCurrentTime(e.target.value)}
              className="px-4 py-2 border rounded-lg"
            />
            <button
              type="button"
              onClick={addTiming}
              className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
            >
              Add Time
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.timings.map((time) => (
              <span
                key={time}
                className="px-3 py-1 bg-primary-100 text-primary-800 rounded-full flex items-center gap-2"
              >
                {time}
                <button
                  type="button"
                  onClick={() => removeTiming(time)}
                  className="text-primary-600 hover:text-primary-800"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-gray-700 mb-2">Take Medicine</label>
          <select
            value={formData.beforeAfterMeal}
            onChange={(e) => setFormData({ ...formData, beforeAfterMeal: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg"
          >
            <option value="before">Before Meal</option>
            <option value="after">After Meal</option>
            <option value="with">With Meal</option>
            <option value="anytime">Anytime</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 mb-2">Start Date</label>
            <input
              type="date"
              value={formData.duration.startDate}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  duration: { ...formData.duration, startDate: e.target.value },
                })
              }
              className="w-full px-4 py-2 border rounded-lg"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-2">End Date</label>
            <input
              type="date"
              value={formData.duration.endDate}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  duration: { ...formData.duration, endDate: e.target.value },
                })
              }
              className="w-full px-4 py-2 border rounded-lg"
              required
            />
          </div>
        </div>
        <div>
          <label className="block text-gray-700 mb-2">Instructions</label>
          <textarea
            value={formData.instructions}
            onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg"
            rows={3}
          />
        </div>
        <button
          type="submit"
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Assign Medicine
        </button>
      </form>
    </div>
  );
};

export default MedicineAssignment;

