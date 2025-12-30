import React, { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import SymptomFilter from '../components/patient/SymptomFilter';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { assets } from '../assets/assets';
import  image  from '../assets/image.png'
// Lazy load heavy components for better performance
const DoctorList = lazy(() => import('../components/patient/DoctorList'));
const ChatList = lazy(() => import('../components/patient/ChatList'));
const MedicineList = lazy(() => import('../components/patient/MedicineList'));
const ReportList = lazy(() => import('../components/patient/ReportList'));
const FitnessTracker = lazy(() => import('../components/patient/FitnessTracker'));
const Chatbot = lazy(() => import('../components/patient/Chatbot'));

// Loading component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center py-16">
    <div className="w-10 h-10 border-3 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
  </div>
);

const PatientDashboard: React.FC = () => {
  const navigate = useNavigate()
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('doctors');
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [credits, setCredits] = useState<number>(0);
  const [loadingCredits, setLoadingCredits] = useState<boolean>(false);
  const [plan, setPlan] = useState<string | null>(null);
  const [loadingPlan, setLoadingPlan] = useState<boolean>(false);
  const [duration, setDuration] = useState<string | null>(null);
  const [loadingDuration, setLoadingDuration] = useState<boolean>(false);
  // Memoized tabs configuration to prevent re-creation
  const tabs = useMemo(() => [
    { 
      id: 'doctors', 
      label: 'Find Doctors',
      icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
    },
    { 
      id: 'medicines', 
      label: 'Medicines',
      icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z'
    },
    { 
      id: 'chat', 
      label: 'Chat',
      icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z'
    },
    { 
      id: 'reports', 
      label: 'Reports',
      icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
    },
    { 
      id: 'chatbot', 
      label: 'AI Assistant',
      icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'
    },
    { 
      id: 'fitness', 
      label: 'Fitness',
      icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z'
    },
  ], []);

  // Optimized user initial
  const userInitial = useMemo(() => 
    user?.name?.charAt(0).toUpperCase() || 'U', 
    [user?.name]
  );
  useEffect(() => {
  const fetchCredits = async () => {
    if (!user?.id) return;

    try {
      setLoadingCredits(true);

      const res = await api.get(
        `/payments/credits/${user.id}`,
        { withCredentials: true }
      );

      if (res.data?.success) {
        setCredits(res.data.credits);
      }
    } catch (err) {
      console.error("Failed to fetch credits", err);
    } finally {
      setLoadingCredits(false);
    }
  };

  fetchCredits();
}, [user?.id]);
useEffect(() => {
  const fetchPlan = async () => {
    if (!user?.id) return;

    try {
      setLoadingPlan(true);
      setLoadingDuration(true);
      const res = await api.get(
        `/payments/plan/${user.id}`,
        { withCredentials: true }
      );

      if (res.data?.success) {
        setPlan(res.data.plan);
        setDuration(res.data.duration)
      }
    } catch (err) {
      console.error("Failed to fetch credits", err);
    } finally {
      setLoadingPlan(false);
      setLoadingDuration(false);
    }
  };

  fetchPlan();
}, [user?.id]);
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-lg border-b-4 border-blue-600 sticky top-0 z-50">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-20">
                  {/* Logo Section */}
                  <div className="flex items-center space-x-4">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200 }}
                      className="w-12 h-12 bg-gradient-to-br rounded-2xl flex items-center justify-center shadow-lg"
                    >
                      <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
                      <img
                        src={image}
                        alt="LifeLong Medicare"
                        className="h-10 w-10 object-contain"
                      />
                    </div>
                    </motion.div>
                    <div>
                      <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
                        LifeLong
                      </span>
                      <p className="text-xs text-gray-500 font-medium">Patient Portal</p>
                    </div>
                  </div>
      
                  {/* Desktop User Menu */}
                  <div className="hidden md:flex items-center space-x-4">
                    <div>
                    {user ? (
                      <div className="flex items-center gap-2 sm:gap-3">
                        
                        {/* Subscription Button */}
                        <button
                          onClick={() => navigate("/subscription")}
                          className="flex items-center gap-2 bg-blue-100 px-4 sm:px-6 py-1.5 sm:py-3 rounded-full hover:scale-105 transition-all duration-700"
                        >
                          <img className="w-5" src={assets.credit_star} alt="" />
                          <div className="text-left leading-tight">
                          <p className="text-xs sm:text-sm font-semibold text-gray-800">
                            {plan ? `${plan} Plan` : "No Active Plan"}
                          </p>

                          {plan && (
                            <p className="text-[11px] sm:text-xs text-gray-600">
                              {credits} credits • {duration}
                            </p>
                          )}
                        </div>
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 sm:gap-5">
                        <p
                          onClick={() => navigate("/subscription")}
                          className="cursor-pointer"
                        >
                          Pricing
                        </p>

                        <button
                    
                          className="bg-zinc-800 text-white px-7 py-2 sm:px-10 text-sm rounded-full"
                        >
                          Login
                        </button>
                      </div>
                    )}
                  </div>
                    <div className="flex items-center space-x-3 px-4 py-2 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-md">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                      </div>
                    </div>
                    <button
                      onClick={logout}
                      className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 font-semibold transition-all shadow-md hover:shadow-lg flex items-center space-x-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      <span>Logout</span>
                    </button>
                  </div>
      
                  {/* Mobile Menu Button */}
                  <div className="md:hidden flex items-center">
                    <button
                      onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                      className="p-2 rounded-lg text-gray-700 hover:bg-gray-100"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {isMobileMenuOpen ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        )}
                      </svg>
                    </button>
                  </div>
                </div>
      
                {/* Mobile Menu */}
                <AnimatePresence>
                  {isMobileMenuOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="md:hidden border-t border-gray-200 py-4 space-y-2 overflow-hidden"
                    >
                      {/* Mobile Subscription Info */}
                      <div className="mx-4 mb-3 rounded-xl bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10  rounded-lg flex items-center justify-center">
                            <img src={assets.credit_star} alt="credits" className="w-5 h-5" />
                          </div>

                          <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-900">
                              {plan ? `${plan} Plan` : "No Active Plan"}
                            </p>

                            {plan ? (
                              <p className="text-xs text-gray-600">
                                {credits} credits • {duration}
                              </p>
                            ) : (
                              <p className="text-xs text-gray-500">
                                Subscribe to unlock features
                              </p>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            setIsMobileMenuOpen(false);
                            navigate("/subscription");
                          }}
                          className="mt-3 w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition"
                        >
                          {plan ? "Upgrade Plan" : "View Plans"}
                        </button>
                      </div>
                      <div className="flex items-center space-x-3 px-4 py-3 bg-blue-50 rounded-lg">
                        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{user?.name}</p>
                          <p className="text-xs text-gray-500">Medical Professional</p>
                        </div>
                      </div>
                      <button
                        onClick={logout}
                        className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold flex items-center justify-center space-x-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span>Logout</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Tabs Navigation */}
        <div className="bg-white rounded-lg shadow-sm mb-6 border border-gray-100">
          <nav className="flex overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                </svg>
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content Area with Lazy Loading */}
        <div className="min-h-[400px]">
          <Suspense fallback={<LoadingSpinner />}>
            {activeTab === 'doctors' && (
              <div className="space-y-6">
                
                  <SymptomFilter onFilter={setSymptoms} />
                
                <DoctorList symptoms={symptoms} />
              </div>
            )}
            {activeTab === 'medicines' && <MedicineList />}
            {activeTab === 'chat' && <ChatList />}
            {activeTab === 'reports' && <ReportList />}
            {activeTab === 'chatbot' && <Chatbot />}
            {activeTab === 'fitness' && <FitnessTracker />}
          </Suspense>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
    </div>
  );
};

export default PatientDashboard;