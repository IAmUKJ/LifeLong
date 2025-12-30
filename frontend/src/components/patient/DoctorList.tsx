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
  const {hasActivePlan} = useAuth();
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
  if (!hasActivePlan) {
    alert("⚠️ You need an active subscription to connect with a doctor.");
    return;
  }

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
  if (!hasActivePlan) {
    alert("⛔ Your plan has expired. Please renew to chat.");
    return;
  }

  try {
    const doctorUserId = doctor.userId?._id || doctor.userId?.id;
    if (!doctorUserId) {
      alert('Doctor information is incomplete.');
      return;
    }

    const response = await api.post('/chat/room', { otherUserId: doctorUserId });

    if (onStartChat) {
      onStartChat(response.data.roomId);
    } else {
      alert('Chat room created! Go to Chat tab.');
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
        <p className="text-lg font-semibold text-gray-700">Loading doctors...</p>
      </div>
    );
  }

  return (
    <motion.div 
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
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
                variants={cardVariants}
                layout
                whileHover={{ y: -4 }}
                className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow"
              >
                {/* Header with Gradient Background and Decorative Shapes */}
                <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 p-5 relative overflow-hidden">
                  {/* Decorative circles */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400/30 rounded-full -mr-16 -mt-16" />
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-800/30 rounded-full -ml-12 -mb-12" />
                  <div className="absolute top-1/2 right-1/4 w-20 h-20 bg-white/10 rounded-full" />

                  <div className="relative z-10 flex items-start space-x-3">
                    {/* Profile Picture */}
                    <div className="w-16 h-16 bg-white/25 backdrop-blur-sm rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0 shadow-lg border-2 border-white/30">
                      {doctor?.profilePicture ? (
                        <img
                          src={doctor.profilePicture}
                          alt="Doctor Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      )}
                    </div>

                    {/* Name and Specialization */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-bold text-white mb-1 truncate">
                        {'Dr. ' + (doctor.userId?.name?.charAt(0).toUpperCase() + doctor.userId?.name.substring(1) || 'Unknown')}
                      </h3>
                      <p className="text-blue-100 text-sm font-medium truncate">
                        {doctor.specialization}
                      </p>
                    </div>
                  </div>

                  {/* Connected Badge */}
                  {isConnected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-4 right-4 z-20"
                    >
                      <div className="px-2.5 py-1 bg-green-500 rounded-full flex items-center space-x-1 shadow-md border-2 border-white">
                        <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-white text-xs font-bold">Connected</span>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Content Section */}
                <div className="p-6 space-y-4 bg-gray-50">
                  

                  {/* Experience & Rating Row */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-teal-50 rounded-xl border border-teal-100">
                      <div className="flex items-center space-x-2 mb-1">
                        <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-xs text-teal-700 font-semibold">Experience</p>
                      </div>
                      <p className="text-lg font-bold text-gray-900">{doctor.experience} years</p>
                    </div>

                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                      <div className="flex items-center space-x-2 mb-1">
                        <svg className="w-4 h-4 text-amber-600 fill-current" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <p className="text-xs text-amber-700 font-semibold">Rating</p>
                      </div>
                      <p className="text-lg font-bold text-gray-900">
                        {rating} <span className="text-xs text-gray-500 font-normal">({reviewCount})</span>
                      </p>
                    </div>
                  </div>

                  {/* Bio */}
                  {doctor.bio && (
                    <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                      <p className="text-xs text-indigo-700 font-semibold mb-1">About</p>
                      <p className="text-sm text-gray-700 line-clamp-2">{doctor.bio}</p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="pt-2">
                    {isConnected ?(<button
                      onClick={() => startChat(doctor)}
                      disabled={!hasActivePlan}
                      className={`w-full px-6 py-4 rounded-2xl font-bold text-base transition-all flex items-center justify-center space-x-2
                        ${
                          hasActivePlan
                            ? "bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-md hover:shadow-lg"
                            : "bg-gray-300 text-gray-500 cursor-not-allowed"
                        }
                      `}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        />
                      </svg>
                      <span>{hasActivePlan ? "Chat" : "Plan Required"}</span>
                    </button>)
                    : (
                      <button
                        onClick={() => connectDoctor(doctor._id)}
                        disabled={!hasActivePlan}
                        className={`w-full px-6 py-4 rounded-2xl font-bold text-base transition-all flex items-center justify-center space-x-2
                          ${
                            hasActivePlan
                              ? "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md hover:shadow-lg"
                              : "bg-gray-300 text-gray-500 cursor-not-allowed"
                          }
                        `}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span>{hasActivePlan ? "Connect" : "Subscription Required"}</span>
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
              className="w-32 h-32 bg-gradient-to-br from-blue-100 to-blue-200 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg"
            >
              <svg className="w-16 h-16 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </motion.div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No doctors found</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              Try adjusting your search criteria or check back later for available doctors.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default DoctorList;