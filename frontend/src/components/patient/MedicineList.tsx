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
    <div className="space-y-6">
      {medicines.length > 0 ? (
        medicines.map((medicine) => (
          <div
            key={medicine._id}
            className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow"
          >
            {/* Header Section */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6">
              <div className="flex justify-between items-start">
                <div className="flex items-start space-x-4">
                  <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-1">{medicine.medicineName}</h3>
                    <p className="text-blue-100 text-sm">Prescribed by {medicine.doctorId?.userId?.name || 'Unknown Doctor'}</p>
                  </div>
                </div>
                <span 
                  className={`px-4 py-2 rounded-xl text-sm font-semibold shadow-lg ${
                    medicine.status === 'active' 
                      ? 'bg-green-500 text-white' 
                      : 'bg-gray-300 text-gray-700'
                  }`}
                >
                  {medicine.status}
                </span>
              </div>
            </div>

            {/* Details Section */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200 hover:shadow-md transition-shadow">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs text-blue-600 font-medium">Dosage</p>
                      <p className="text-sm font-bold text-gray-900">{medicine.dosage}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200 hover:shadow-md transition-shadow">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs text-green-600 font-medium">Frequency</p>
                      <p className="text-sm font-bold text-gray-900">{medicine.frequency}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200 hover:shadow-md transition-shadow">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs text-purple-600 font-medium">With Meal</p>
                      <p className="text-sm font-bold text-gray-900">
                        {medicine.beforeAfterMeal === 'before' ? 'Before' : 
                         medicine.beforeAfterMeal === 'after' ? 'After' : 
                         medicine.beforeAfterMeal === 'with' ? 'With' : 'Anytime'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Timings Section */}
              <div className="border-t border-gray-200 pt-6">
                <div className="flex items-center space-x-2 mb-4">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="font-bold text-gray-900 text-lg">Daily Schedule</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {medicine.timings.map((timing: any, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => !timing.taken && markAsTaken(medicine._id, timing.time)}
                      disabled={timing.taken}
                      className={`px-4 py-3 rounded-xl font-semibold text-sm transition-all shadow-md hover:shadow-lg ${
                        timing.taken
                          ? 'bg-gradient-to-r from-green-500 to-green-600 text-white cursor-not-allowed'
                          : 'bg-white border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 text-gray-900'
                      }`}
                    >
                      <div className="flex items-center justify-center space-x-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{timing.time}</span>
                        {timing.taken && (
                          <svg 
                            className="w-5 h-5" 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-20 px-6">
          <div className="w-32 h-32 bg-gradient-to-br from-blue-100 to-blue-200 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-16 h-16 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">No Medicines Yet</h3>
          <p className="text-gray-500 max-w-md mx-auto">
            Your prescribed medications will appear here. Connect with a doctor to get started with your treatment.
          </p>
        </div>
      )}
    </div>
  );
};

export default MedicineList;