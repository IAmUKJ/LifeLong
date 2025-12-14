import React, { useState, useEffect } from 'react';
import api from '../../utils/api';

const FitnessTracker: React.FC = () => {
  const [activityType, setActivityType] = useState<'walking' | 'running' | 'breathing'>('walking');
  const [duration, setDuration] = useState('');
  const [distance, setDistance] = useState('');
  const [stats, setStats] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    fetchStats();
    fetchHistory();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/fitness/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await api.get('/fitness/history');
      setHistory(response.data);
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

  const logActivity = async () => {
    try {
      await api.post('/fitness/log', {
        activityType,
        duration: parseInt(duration),
        distance: distance ? parseFloat(distance) : undefined,
      });
      setDuration('');
      setDistance('');
      fetchStats();
      fetchHistory();
      alert('Activity logged successfully!');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to log activity');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-xl font-semibold mb-4">Log Activity</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-gray-700 mb-2">Activity Type</label>
            <select
              value={activityType}
              onChange={(e) => setActivityType(e.target.value as any)}
              className="w-full px-4 py-2 border rounded-lg"
            >
              <option value="walking">Walking</option>
              <option value="running">Running</option>
              <option value="breathing">Breathing Exercise</option>
            </select>
          </div>
          <div>
            <label className="block text-gray-700 mb-2">Duration (minutes)</label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>
          {(activityType === 'walking' || activityType === 'running') && (
            <div>
              <label className="block text-gray-700 mb-2">Distance (km)</label>
              <input
                type="number"
                step="0.1"
                value={distance}
                onChange={(e) => setDistance(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
          )}
          <button
            onClick={logActivity}
            className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Log Activity
          </button>
        </div>
      </div>

      {stats && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-semibold mb-4">Your Stats</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary-600">{stats.totalPoints}</p>
              <p className="text-gray-600">Total Points</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-primary-600">Level {stats.level}</p>
              <p className="text-gray-600">Current Level</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-xl font-semibold mb-4">Recent Activity</h3>
        <div className="space-y-2">
          {history.map((activity) => (
            <div key={activity._id} className="flex justify-between p-3 bg-gray-50 rounded">
              <div>
                <p className="font-semibold capitalize">{activity.activityType}</p>
                <p className="text-sm text-gray-600">
                  {activity.duration} minutes
                  {activity.distance && ` • ${activity.distance} km`}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-primary-600">+{activity.points} pts</p>
                <p className="text-xs text-gray-500">
                  {new Date(activity.date).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FitnessTracker;

