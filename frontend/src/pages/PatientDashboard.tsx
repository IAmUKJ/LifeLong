import React, { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import SymptomFilter from '../components/patient/SymptomFilter';
import { motion, AnimatePresence } from 'framer-motion';

// Lazy load heavy components for better performance
const DoctorList = lazy(() => import('../components/patient/DoctorList'));
const ChatList = lazy(() => import('../components/patient/ChatList'));
const MedicineList = lazy(() => import('../components/patient/MedicineList'));
const ReportList = lazy(() => import('../components/patient/ReportList'));
const FitnessTracker = lazy(() => import('../components/patient/FitnessTracker'));
const Chatbot = lazy(() => import('../components/patient/Chatbot'));

// Loading component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-96">
    <div className="relative w-16 h-16">
      <div className="absolute inset-0 rounded-full border-4 border-blue-100"></div>
      <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
    </div>
  </div>
);

const PatientDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('doctors');
  const [symptoms, setSymptoms] = useState<string[]>([]);

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

  // Reduced motion variants
  const pageVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      {/* Optimized Navigation */}
      <nav className="bg-white/90 backdrop-blur-sm shadow-sm sticky top-0 z-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-md">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">LifeLong</h1>
                <p className="text-xs text-gray-500">Patient Portal</p>
              </div>
            </div>

            {/* User Menu */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-3 px-3 py-2 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-sm">
                  {userInitial}
                </div>
                <div className="hidden md:block">
                  <p className="text-xs text-gray-600">Welcome back</p>
                  <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                </div>
              </div>
              <button
                onClick={logout}
                className="px-4 py-2 text-sm font-medium text-red-600 hover:text-white hover:bg-red-600 border border-red-600 rounded-lg transition-all duration-200"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Optimized Tabs Navigation */}
        <div className="bg-white rounded-xl shadow-md mb-6 border border-gray-200">
          <nav className="flex overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                </svg>
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content Area with Lazy Loading */}
        <div className="min-h-[500px]">
          <Suspense fallback={<LoadingSpinner />}>
            {activeTab === 'doctors' && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    Filter by Symptoms
                  </h2>
                  <SymptomFilter onFilter={setSymptoms} />
                </div>
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