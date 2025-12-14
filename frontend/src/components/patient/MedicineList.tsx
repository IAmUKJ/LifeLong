import React, { useState, useEffect } from 'react';
import api from '../../utils/api';

const MedicineList: React.FC = () => {
  const [medicines, setMedicines] = useState<any[]>([]);

  useEffect(() => {
    fetchMedicines();
  }, []);

  const fetchMedicines = async () => {
    try {
      const response = await api.get('/medicines/patient');
      setMedicines(response.data);
    } catch (error) {
      console.error('Error fetching medicines:', error);
    }
  };

  const markAsTaken = async (medicineId: string, time: string) => {
    try {
      await api.put(`/medicines/${medicineId}/taken`, { time });
      fetchMedicines();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to mark as taken');
    }
  };

  return (
    <div className="space-y-4">
      {medicines.map((medicine) => (
        <div key={medicine._id} className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-xl font-semibold">{medicine.medicineName}</h3>
              <p className="text-gray-600">Dosage: {medicine.dosage}</p>
              <p className="text-gray-600">Frequency: {medicine.frequency}</p>
              <p className="text-gray-600">
                Take: {medicine.beforeAfterMeal === 'before' ? 'Before' : 
                      medicine.beforeAfterMeal === 'after' ? 'After' : 
                      medicine.beforeAfterMeal === 'with' ? 'With' : 'Anytime'} meal
              </p>
              <p className="text-sm text-gray-500">
                Assigned by: {medicine.doctorId?.userId?.name || 'Unknown Doctor'}
              </p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm ${
              medicine.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
            }`}>
              {medicine.status}
            </span>
          </div>
          <div className="border-t pt-4">
            <p className="font-semibold mb-2">Timings:</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {medicine.timings.map((timing: any, index: number) => (
                <button
                  key={index}
                  onClick={() => !timing.taken && markAsTaken(medicine._id, timing.time)}
                  disabled={timing.taken}
                  className={`px-4 py-2 rounded-lg ${
                    timing.taken
                      ? 'bg-green-500 text-white cursor-not-allowed'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  {timing.time} {timing.taken && '✓'}
                </button>
              ))}
            </div>
          </div>
        </div>
      ))}
      {medicines.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No medicines assigned yet.
        </div>
      )}
    </div>
  );
};

export default MedicineList;

