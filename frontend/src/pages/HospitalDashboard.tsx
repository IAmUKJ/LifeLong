import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const HospitalDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [hospital, setHospital] = useState<any>(null);
  const [formData, setFormData] = useState({
    hospitalName: '',
    registrationId: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: '',
    },
    contact: {
      phone: '',
      email: '',
      emergency: '',
    },
  });

  useEffect(() => {
    fetchHospital();
  }, []);

  const fetchHospital = async () => {
    try {
      const response = await api.get('/hospitals/profile');
      setHospital(response.data);
      if (response.data) {
        setFormData({
          hospitalName: response.data.hospitalName || '',
          registrationId: response.data.registrationId || '',
          address: response.data.address || formData.address,
          contact: response.data.contact || formData.contact,
        });
      }
    } catch (error) {
      console.error('Error fetching hospital:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put('/hospitals/profile', formData);
      fetchHospital();
      alert('Profile updated successfully');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to update profile');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-primary-600">LifeLong - Hospital Portal</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">{user?.name}</span>
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
        {hospital && !hospital.isVerified && (
          <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6">
            <p className="font-bold">Registration Pending Verification</p>
            <p>Your hospital registration is pending admin verification.</p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-6">Hospital Profile</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-gray-700 mb-2">Hospital Name</label>
              <input
                type="text"
                value={formData.hospitalName}
                onChange={(e) => setFormData({ ...formData, hospitalName: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2">Registration ID</label>
              <input
                type="text"
                value={formData.registrationId}
                onChange={(e) => setFormData({ ...formData, registrationId: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2">Contact Phone</label>
              <input
                type="tel"
                value={formData.contact.phone}
                onChange={(e) => setFormData({
                  ...formData,
                  contact: { ...formData.contact, phone: e.target.value }
                })}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2">Emergency Contact</label>
              <input
                type="tel"
                value={formData.contact.emergency}
                onChange={(e) => setFormData({
                  ...formData,
                  contact: { ...formData.contact, emergency: e.target.value }
                })}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Update Profile
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default HospitalDashboard;

