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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        type: "spring" as const,
        stiffness: 300,
        damping: 24
      }
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4" />
        <p className="text-lg font-semibold text-gray-700">Finding the best doctors for you...</p>
      </div>
    );
  }

  return (
    <motion.div 
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <AnimatePresence>
        {doctors.length > 0 ? (
          doctors.map((doctor, index) => {
            const isConnected = connectedDoctors.includes(doctor._id);
            const rating = doctor.rating?.average?.toFixed(1) || 'N/A';
            const reviewCount = doctor.rating?.count || 0;

            return (
              <motion.div
                key={doctor._id}
                variants={cardVariants}
                layout
                whileHover={{ y: -8 }}
                className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-2xl transition-shadow group"
              >
                {/* Header with Gradient Background */}
                <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 p-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
                  <div className="relative z-10 flex items-start space-x-4">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                      <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-bold text-white mb-1 truncate">
                        {doctor.userId?.name || 'Dr. Unknown'}
                      </h3>
                      {isConnected && (
                        <span className="inline-flex items-center space-x-1 px-3 py-1 bg-green-500 text-white text-xs font-semibold rounded-full">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span>Connected</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                  {/* Specialization */}
                  <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-blue-600 font-medium">Specialization</p>
                      <p className="text-sm font-bold text-gray-900 truncate">{doctor.specialization}</p>
                    </div>
                  </div>

                  {/* Experience & Rating Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-green-50 rounded-xl border border-green-100">
                      <div className="flex items-center space-x-2 mb-1">
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                        </svg>
                        <p className="text-xs text-green-600 font-medium">Experience</p>
                      </div>
                      <p className="text-lg font-bold text-gray-900">{doctor.experience} years</p>
                    </div>

                    <div className="p-3 bg-yellow-50 rounded-xl border border-yellow-100">
                      <div className="flex items-center space-x-2 mb-1">
                        <svg className="w-4 h-4 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <p className="text-xs text-yellow-600 font-medium">Rating</p>
                      </div>
                      <p className="text-lg font-bold text-gray-900">{rating} <span className="text-xs text-gray-500">({reviewCount})</span></p>
                    </div>
                  </div>

                  {/* Bio */}
                  {doctor.bio && (
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <p className="text-sm text-gray-600 line-clamp-3">{doctor.bio}</p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-2">
                    {isConnected ? (
                      <>
                        <button
                          onClick={() => startChat(doctor)}
                          className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 font-semibold transition-all shadow-md hover:shadow-lg flex items-center justify-center space-x-2"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                          <span>Chat Now</span>
                        </button>
                        <button
                          disabled
                          className="flex-1 px-4 py-3 bg-gray-100 text-gray-500 rounded-xl font-semibold cursor-not-allowed flex items-center justify-center space-x-2 border-2 border-gray-200"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span>Connected</span>
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => connectDoctor(doctor._id)}
                        className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 font-semibold transition-all shadow-md hover:shadow-lg flex items-center justify-center space-x-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span>Connect Doctor</span>
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="col-span-full text-center py-20 px-6"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-32 h-32 bg-gradient-to-br from-blue-100 to-blue-200 rounded-3xl flex items-center justify-center mx-auto mb-6"
            >
              <svg className="w-16 h-16 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </motion.div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No Doctors Found</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              Try adjusting your symptoms or search criteria to find the perfect doctor for your needs.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default DoctorList;