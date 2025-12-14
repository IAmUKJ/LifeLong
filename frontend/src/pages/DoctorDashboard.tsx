import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import PatientList from '../components/doctor/PatientList';
import ChatList from '../components/doctor/ChatList';
import MedicineAssignment from '../components/doctor/MedicineAssignment';
import ReportGeneration from '../components/doctor/ReportGeneration';
import DoctorProfile from '../components/doctor/DoctorProfile';

const DoctorDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('patients');
  const [doctorProfile, setDoctorProfile] = useState<any>(null);

  useEffect(() => {
    fetchDoctorProfile();
  }, []);

  const fetchDoctorProfile = async () => {
    try {
      const response = await api.get('/doctors/profile');
      setDoctorProfile(response.data);
    } catch (error) {
      console.error('Error fetching doctor profile:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-primary-600">LifeLong - Doctor Portal</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Dr. {user?.name}</span>
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
        {doctorProfile && !doctorProfile.isVerified && (
          <div className="bg-yellow-50 border-l-4 border-yellow-500 text-yellow-800 p-6 mb-6 rounded-lg shadow-md">
            <div className="flex items-start">
              <svg className="w-6 h-6 mr-3 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="font-bold text-lg mb-2">Profile Pending Verification</p>
                <p className="mb-2">Your profile is under review by our admin team. Please complete your profile with license image and registration number.</p>
                <p className="text-sm">Once verified, patients will be able to see and connect with you.</p>
              </div>
            </div>
          </div>
        )}
        {doctorProfile && doctorProfile.isVerified && (
          <div className="bg-green-50 border-l-4 border-green-500 text-green-800 p-6 mb-6 rounded-lg shadow-md">
            <div className="flex items-start">
              <svg className="w-6 h-6 mr-3 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="font-bold text-lg mb-2">✅ Verification Accepted!</p>
                <p>Your profile has been verified by admin. Patients can now see and connect with you.</p>
                {doctorProfile.verifiedAt && (
                  <p className="text-sm mt-2">Verified on: {new Date(doctorProfile.verifiedAt).toLocaleDateString()}</p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {[
                { id: 'profile', label: 'Profile' },
                { id: 'patients', label: 'Patients' },
                { id: 'chat', label: 'Chat' },
                { id: 'medicines', label: 'Assign Medicines' },
                { id: 'reports', label: 'Generate Reports' },
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
          {activeTab === 'profile' && <DoctorProfile onUpdate={fetchDoctorProfile} />}
          {activeTab === 'patients' && <PatientList />}
          {activeTab === 'chat' && <ChatList />}
          {activeTab === 'medicines' && <MedicineAssignment />}
          {activeTab === 'reports' && <ReportGeneration />}
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;

