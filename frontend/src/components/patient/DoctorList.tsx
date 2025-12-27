import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

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
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-12 h-12 border-3 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-3" />
        <p className="text-gray-600">Loading doctors...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <AnimatePresence>
            {doctors.length > 0 ? (
              doctors.map((doctor) => {
                const isConnected = connectedDoctors.includes(doctor._id);
                const rating = doctor.rating?.average?.toFixed(1) || 'N/A';
                const reviewCount = doctor.rating?.count || 0;

                return (
                  <motion.div
                    key={doctor._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    whileHover={{ y: -4 }}
                    className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all border border-gray-100"
                  >
                    {/* Doctor Header */}
                    <div className="p-5 border-b border-gray-100">
                      <div className="flex items-start gap-4">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center text-white text-xl font-semibold flex-shrink-0">
                          {(doctor.userId?.name || 'Dr').charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-gray-900 truncate">
                            {'Dr. '+(doctor.userId?.name || 'Dr').charAt(0).toUpperCase()+doctor.userId?.name.substring(1) || 'Dr. Unknown'}
                          </h3>
                          <p className="text-sm text-gray-600 truncate">{doctor.specialization}</p>
                          {isConnected && (
                            <span className="inline-flex items-center gap-1 mt-2 px-2 py-1 bg-green-50 text-green-700 text-xs font-medium rounded">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              Connected
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Doctor Details */}
                    <div className="p-5 space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>{doctor.experience} years</span>
                        </div>
                        <div className="flex items-center gap-1 text-amber-600">
                          <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          <span className="font-medium">{rating}</span>
                          <span className="text-gray-500">({reviewCount})</span>
                        </div>
                      </div>

                      {doctor.bio && (
                        <p className="text-sm text-gray-600 line-clamp-2">{doctor.bio}</p>
                      )}

                      {/* Action Buttons */}
                      <div className="pt-2">
                        {isConnected ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => startChat(doctor)}
                              className="flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-md transition-colors flex items-center justify-center gap-2"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                              </svg>
                              Chat
                            </button>
                            <button
                              disabled
                              className="px-4 py-2.5 bg-gray-100 text-gray-400 text-sm font-medium rounded-md cursor-not-allowed"
                            >
                              Connected
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => connectDoctor(doctor._id)}
                            className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors flex items-center justify-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Connect
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="col-span-full text-center py-16"
              >
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No doctors found</h3>
                <p className="text-gray-600">Try adjusting your search criteria</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

export default DoctorList;