import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import DoctorList from '../components/patient/DoctorList';
import ChatList from '../components/patient/ChatList';
import MedicineList from '../components/patient/MedicineList';
import ReportList from '../components/patient/ReportList';
import FitnessTracker from '../components/patient/FitnessTracker';
import SymptomFilter from '../components/patient/SymptomFilter';
import Chatbot from '../components/patient/Chatbot';

const PatientDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('doctors');
  const [symptoms, setSymptoms] = useState<string[]>([]);

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-primary-600">LifeLong</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, {user?.name}</span>
              <button
                onClick={logout}
                className="px-4 py-2 text-red-600 hover:text-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {[
                { id: 'doctors', label: 'Find Doctors' },
                { id: 'medicines', label: 'Medicines' },
                { id: 'chat', label: 'Chat' },
                { id: 'reports', label: 'Reports' },
                { id: 'chatbot', label: 'AI Chatbot' },
                { id: 'fitness', label: 'Fitness' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-4 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        <div className="mt-6">
          {activeTab === 'doctors' && (
            <div>
              <SymptomFilter onFilter={setSymptoms} />
              <DoctorList symptoms={symptoms} />
            </div>
          )}
          {activeTab === 'medicines' && <MedicineList />}
          {activeTab === 'chat' && <ChatList />}
          {activeTab === 'reports' && <ReportList />}
          {activeTab === 'chatbot' && <Chatbot />}
          {activeTab === 'fitness' && <FitnessTracker />}
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;

