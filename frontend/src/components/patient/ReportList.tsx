import React, { useState, useEffect } from 'react';
import api from '../../utils/api';

const ReportList: React.FC = () => {
  const [reports, setReports] = useState<any[]>([]);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const response = await api.get('/reports/patient');
      setReports(response.data);
    } catch (error) {
      console.error('Error fetching reports:', error);
    }
  };

  const handleFileUpload = async (reportId: string, file: File) => {
    try {
      // In production, upload file to cloud storage first, then pass URL
      const fileUrl = URL.createObjectURL(file); // Temporary for demo
      await api.post('/reports/upload', { reportId, fileUrl });
      fetchReports();
      alert('Report uploaded and analyzed successfully!');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to upload report');
    }
  };

  return (
    <div className="space-y-4">
      {reports.map((report) => (
        <div key={report._id} className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-xl font-semibold">{report.title}</h3>
              <p className="text-gray-600">Type: {report.reportType}</p>
              <p className="text-sm text-gray-500">
                By: {report.doctorId?.userId?.name || 'Unknown Doctor'}
              </p>
              <p className="text-sm text-gray-500">
                Date: {new Date(report.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="mb-4">
            <p className="text-gray-700">{report.content}</p>
          </div>
          {report.observations && report.observations.length > 0 && (
            <div className="mb-4">
              <p className="font-semibold mb-2">Observations:</p>
              <ul className="list-disc list-inside space-y-1">
                {report.observations.map((obs: any, index: number) => (
                  <li key={index} className="text-gray-600">
                    {obs.symptom}: {obs.status} - {obs.notes}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {report.chatbotInsights && (
            <div className="mb-4 p-4 bg-blue-50 rounded-lg">
              <p className="font-semibold mb-2">AI Insights:</p>
              <p className="text-sm text-gray-700 mb-2">{report.chatbotInsights.summary}</p>
              {report.chatbotInsights.keyFindings && (
                <div>
                  <p className="font-semibold text-sm mb-1">Key Findings:</p>
                  <ul className="list-disc list-inside text-sm text-gray-600">
                    {report.chatbotInsights.keyFindings.map((finding: string, index: number) => (
                      <li key={index}>{finding}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-2">Upload Report File:</label>
            <input
              type="file"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(report._id, file);
              }}
              className="text-sm"
            />
          </div>
        </div>
      ))}
      {reports.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No reports yet.
        </div>
      )}
    </div>
  );
};

export default ReportList;

