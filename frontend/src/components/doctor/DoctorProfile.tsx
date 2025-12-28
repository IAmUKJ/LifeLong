import React, { useState, useEffect } from 'react';
import api from '../../utils/api';

interface DoctorProfileProps {
  onUpdate: () => void;
}

const DoctorProfile: React.FC<DoctorProfileProps> = ({ onUpdate }) => {
  const [formData, setFormData] = useState({
    specialization: '',
    qualifications: [] as any[],
    experience: '',
    practiceLicense: '',
    registrationNumber: '',
    bio: '',
    consultationFee: '',
    availability: {
      days: [] as string[],
      timeSlots: [] as any[],
    },
    symptoms: [] as string[],
  });
  const [profilePic, setProfilePic] = useState<File | null>(null);
  const [profilePicPreview, setProfilePicPreview] = useState<string>('');
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [licensePreview, setLicensePreview] = useState<string>('');
  const [currentQualification, setCurrentQualification] = useState({
    degree: '',
    institution: '',
    year: '',
  });
  const [currentSymptom, setCurrentSymptom] = useState('');
  const [currentTimeSlot, setCurrentTimeSlot] = useState({ start: '', end: '' });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/doctors/profile');
      if (response.data) {
        setFormData({
          specialization: response.data.specialization || '',
          qualifications: response.data.qualifications || [],
          experience: response.data.experience || '',
          practiceLicense: response.data.practiceLicense || '',
          registrationNumber: response.data.registrationNumber || '',
          bio: response.data.bio || '',
          consultationFee: response.data.consultationFee || '',
          availability: response.data.availability || { days: [], timeSlots: [] },
          symptoms: response.data.symptoms || [],
        });

        if (response.data.licenseDocument) {
          setLicensePreview(response.data.licenseDocument);
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLicenseFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setLicensePreview(reader.result as string);
    reader.readAsDataURL(file);
  };
  const handleProfilePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setProfilePic(file);
    const reader = new FileReader();
    reader.onloadend = () => setProfilePicPreview(reader.result as string);
    reader.readAsDataURL(file);
  };
  const addQualification = () => {
    if (!currentQualification.degree || !currentQualification.institution) return;

    setFormData(prev => ({
      ...prev,
      qualifications: [
        ...prev.qualifications,
        {
          ...currentQualification,
          year: parseInt(currentQualification.year) || new Date().getFullYear(),
        },
      ],
    }));

    setCurrentQualification({ degree: '', institution: '', year: '' });
  };

  const addSymptom = () => {
    if (!currentSymptom || formData.symptoms.includes(currentSymptom)) return;

    setFormData(prev => ({
      ...prev,
      symptoms: [...prev.symptoms, currentSymptom],
    }));

    setCurrentSymptom('');
  };

  const addTimeSlot = () => {
    if (!currentTimeSlot.start || !currentTimeSlot.end) return;

    setFormData(prev => ({
      ...prev,
      availability: {
        ...prev.availability,
        timeSlots: [...prev.availability.timeSlots, currentTimeSlot],
      },
    }));

    setCurrentTimeSlot({ start: '', end: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 🔴 IMPORTANT: manual validation (instead of HTML required)
    if (!licenseFile && !licensePreview) {
      alert('License document is required');
      return;
    }

    setUploading(true);

    try {
      const fd = new FormData();

      fd.append('specialization', formData.specialization);
      fd.append('experience', formData.experience);
      fd.append('bio', formData.bio);
      fd.append('consultationFee', formData.consultationFee);

      if (formData.qualifications.length > 0)
        fd.append('qualifications', JSON.stringify(formData.qualifications));

      if (
        formData.availability.days.length > 0 ||
        formData.availability.timeSlots.length > 0
      ) {
        fd.append('availability', JSON.stringify(formData.availability));
      }

      if (formData.symptoms.length > 0)
        fd.append('symptoms', JSON.stringify(formData.symptoms));

      if (licenseFile)
        fd.append('licenseDocument', licenseFile);

      if (profilePic)
        fd.append('profilePicture', profilePic);
      await api.put('/doctors/profile', fd);

      alert('Profile updated successfully! Your license is being reviewed.');
      setLicenseFile(null);
      onUpdate();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setUploading(false);
    }
  };


  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-2xl font-semibold mb-6">Complete Your Profile</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-gray-700 mb-2">Specialization *</label>
          <input
            type="text"
            value={formData.specialization}
            onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg"
            required
          />
        </div>
        <div>
          <label className="block text-gray-700 mb-2">Experience (years) *</label>
          <input
            type="number"
            value={formData.experience}
            onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg"
            required
          />
        </div>
        <div>
          <label className="block text-gray-700 mb-2">Practice License Number</label>
          <input
            type="text"
            value={formData.practiceLicense}
            readOnly
            className="w-full px-4 py-2 border rounded-lg bg-gray-100"
          />
        </div>
        <div>
          <label className="block text-gray-700 mb-2">Registration Number</label>
          <input
            type="text"
            value={formData.registrationNumber}
            readOnly
            className="w-full px-4 py-2 border rounded-lg bg-gray-100"
          />
        </div>
        <div>
          <label className="block text-gray-700 mb-2">Upload Profile Picture *</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleProfilePicChange}
            className="w-full px-4 py-2 border rounded-lg"
            required={!profilePicPreview}
          />
          {profilePicPreview && (
            <div className="mt-2">
              <img
                src={profilePicPreview}
                alt="Profile preview"
                className="w-32 h-32 object-cover rounded-full border"
              />
            </div>
          )}

          <p className="text-xs text-gray-500 mt-1">Upload your clear image (Max 5MB)</p>
        </div>
        <div>
          <label className="block text-gray-700 mb-2">Upload License Document *</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="w-full px-4 py-2 border rounded-lg"
            required={!licensePreview}
          />
          {licensePreview && (
            <div className="mt-2">
              <img src={licensePreview} alt="License preview" className="max-w-xs border rounded-lg" />
            </div>
          )}
          <p className="text-xs text-gray-500 mt-1">Upload a clear image of your medical license (Max 5MB)</p>
        </div>
        <div>
          <label className="block text-gray-700 mb-2">Bio</label>
          <textarea
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg"
            rows={3}
          />
        </div>
        <div>
          <label className="block text-gray-700 mb-2">Consultation Fee</label>
          <input
            type="number"
            value={formData.consultationFee}
            onChange={(e) => setFormData({ ...formData, consultationFee: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>
        <div>
          <label className="block text-gray-700 mb-2">Symptoms You Treat</label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={currentSymptom}
              onChange={(e) => setCurrentSymptom(e.target.value)}
              className="flex-1 px-4 py-2 border rounded-lg"
              placeholder="e.g., fever, headache"
            />
            <button
              type="button"
              onClick={addSymptom}
              className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.symptoms.map((symptom, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-primary-100 text-primary-800 rounded-full"
              >
                {symptom}
              </span>
            ))}
          </div>
        </div>
        <button
          type="submit"
          disabled={uploading}
          className="w-20% px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          {uploading ? (
            <>
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Uploading...</span>
            </>
          ) : (
            'Update Profile'
          )}
        </button>
      </form>
    </div>
  );
};

export default DoctorProfile;

