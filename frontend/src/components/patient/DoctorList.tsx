import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

interface DoctorListProps {
  symptoms: string[];
  onStartChat?: (chatId: string) => void;
}

const DoctorList: React.FC<DoctorListProps> = ({ symptoms, onStartChat }) => {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [connectedDoctors, setConnectedDoctors] = useState<string[]>([]);

  useEffect(() => {
    fetchDoctors();
    fetchConnectedDoctors();
  }, [symptoms]);

  const fetchConnectedDoctors = async () => {
    try {
      const response = await api.get('/patients/doctors');
      const connected = response.data.map((conn: any) => conn.doctorId._id || conn.doctorId);
      setConnectedDoctors(connected);
    } catch (error) {
      console.error('Error fetching connected doctors:', error);
    }
  };

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      let response;
      if (symptoms.length > 0) {
        response = await api.post('/doctors/filter-by-symptoms', { symptoms });
      } else {
        response = await api.get('/doctors');
      }
      setDoctors(response.data);
    } catch (error) {
      console.error('Error fetching doctors:', error);
    } finally {
      setLoading(false);
    }
  };

  const connectDoctor = async (doctorId: string) => {
    if (!window.confirm('Are you sure you want to connect with this doctor?')) {
      return;
    }
    try {
      await api.post(`/patients/connect-doctor/${doctorId}`);
      alert('✅ Successfully connected with doctor! You can now chat with them.');
      fetchDoctors();
      fetchConnectedDoctors();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to connect');
    }
  };

  const startChat = async (doctor: any) => {
    try {
      const doctorUserId = doctor.userId?._id || doctor.userId?.id;
      if (!doctorUserId) {
        alert('Doctor information is incomplete. Please try again.');
        return;
      }
      
      const response = await api.post('/chat/room', { otherUserId: doctorUserId });
      if (onStartChat) {
        onStartChat(response.data.roomId);
      } else {
        alert('Chat room created! Go to Chat tab to start messaging.');
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to start chat');
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading doctors...</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {doctors.map((doctor) => (
        <div key={doctor._id} className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-semibold mb-2">
            {doctor.userId?.name || 'Dr. Unknown'}
          </h3>
          <p className="text-gray-600 mb-2">Specialization: {doctor.specialization}</p>
          <p className="text-gray-600 mb-2">Experience: {doctor.experience} years</p>
          <p className="text-gray-600 mb-2">
            Rating: {doctor.rating?.average?.toFixed(1) || 'N/A'} ({doctor.rating?.count || 0} reviews)
          </p>
          {doctor.bio && <p className="text-sm text-gray-500 mb-4">{doctor.bio}</p>}
          <div className="flex gap-2">
            {connectedDoctors.includes(doctor._id) ? (
              <>
                <button
                  onClick={() => startChat(doctor)}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  💬 Chat
                </button>
                <button
                  disabled
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-600 rounded-lg cursor-not-allowed"
                >
                  ✓ Connected
                </button>
              </>
            ) : (
              <button
                onClick={() => connectDoctor(doctor._id)}
                className="w-full px-4 py-2 bg-primary-600 bg-green-600 text-white rounded-lg hover:bg-green-700 hover:bg-primary-700"
              >
                Connect
              </button>
            )}
          </div>
        </div>
      ))}
      {doctors.length === 0 && (
        <div className="col-span-full text-center py-8 text-gray-500">
          No doctors found. Try adjusting your symptoms.
        </div>
      )}
    </div>
  );
};

export default DoctorList;

