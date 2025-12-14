import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';

const PatientList: React.FC = () => {
  const [patients, setPatients] = useState<any[]>([]);
  const navigate = useNavigate();

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

  const startChat = async (patient: any) => {
    try {
      if (patient.chatId) {
        // Chat already exists, navigate to it
        window.location.href = '/dashboard?tab=chat&room=' + patient.chatId;
      } else {
        // Create new chat
        const response = await api.post('/chat/room', { otherUserId: patient.userId._id || patient.userId.id });
        window.location.href = '/dashboard?tab=chat&room=' + response.data.roomId;
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to start chat');
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {patients.map((patient) => (
        <div key={patient._id} className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-xl font-semibold mb-2">
                {patient.userId?.name || 'Unknown Patient'}
              </h3>
              <p className="text-gray-600 mb-1 text-sm">Email: {patient.userId?.email}</p>
              <p className="text-gray-600 mb-1 text-sm">Phone: {patient.userId?.phone || 'N/A'}</p>
            </div>
            {patient.unreadCount > 0 && (
              <div className="relative">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">{patient.unreadCount}</span>
                </div>
              </div>
            )}
          </div>
          {patient.bloodGroup && (
            <p className="text-gray-600 mb-2 text-sm">Blood Group: {patient.bloodGroup}</p>
          )}
          {patient.allergies && patient.allergies.length > 0 && (
            <div className="mb-4">
              <p className="text-sm font-semibold mb-1">Allergies:</p>
              <div className="flex flex-wrap gap-1">
                {patient.allergies.map((allergy: string, index: number) => (
                  <span key={index} className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">
                    {allergy}
                  </span>
                ))}
              </div>
            </div>
          )}
          <button
            onClick={() => startChat(patient)}
            className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center justify-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span>Chat</span>
            {patient.unreadCount > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-green-500 text-white text-xs rounded-full">
                {patient.unreadCount}
              </span>
            )}
          </button>
        </div>
      ))}
      {patients.length === 0 && (
        <div className="col-span-full text-center py-8 text-gray-500">
          No patients connected yet.
        </div>
      )}
    </div>
  );
};

export default PatientList;

