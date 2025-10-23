import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { logoutUser } from '../api/auth';
import '../index.css';

const AdminAnalyticsPage = () => {
  const navigate = useNavigate();
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await fetch('/api/analytics', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        if (!response.ok) {
          throw new Error('Failed to fetch analytics data');
        }

        const data = await response.json();
        setAnalyticsData(data);
      } catch (err) {
        console.error("Failed to fetch analytics:", err);
        setError(err.message || 'Failed to load analytics. Please try again later.');
        if (err.message === 'No token, authorization denied' || err.message === 'Token is not valid' || err.message === 'Forbidden: You do not have admin privileges.') {
          logoutUser();
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [navigate]);

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading analytics...</div>;
  }

  if (error) {
    return <div className="flex justify-center items-center h-screen text-red-500">{error}</div>;
  }

  return (
    <div className="max-w-7xl mx-auto p-6 lg:p-10">
      {analyticsData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-2">Total Events</h3>
            <p className="text-3xl font-bold">{analyticsData?.totals?.events || 0}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-2">Total Users</h3>
            <p className="text-3xl font-bold">{analyticsData?.totals?.users || 0}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-2">Total Reviews</h3>
            <p className="text-3xl font-bold">{analyticsData?.totals?.reviews || 0}</p>
          </div>
        </div>
      )}
      <h2 className="text-3xl font-bold tracking-tight text-[var(--text-primary)] mb-6">Analytics Dashboard</h2>
      <p className="text-lg text-[var(--text-secondary)] mb-4">Insights into event performance and user engagement.</p>
      
      {loading && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--text-primary)]"></div>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {analyticsData && !loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {/* Example analytics cards - adjust based on your actual data structure */}
          <div className="bg-[var(--bg-secondary)] p-6 rounded-lg shadow">
            <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">Total Events</h3>
            <p className="text-3xl font-bold text-[var(--text-primary)]">{analyticsData.totalEvents || 0}</p>
          </div>
          <div className="bg-[var(--bg-secondary)] p-6 rounded-lg shadow">
            <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">Active Users</h3>
            <p className="text-3xl font-bold text-[var(--text-primary)]">{analyticsData?.totals?.users || 0}</p>
          </div>
          <div className="bg-[var(--bg-secondary)] p-6 rounded-lg shadow">
            <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">Total Reviews</h3>
            <p className="text-3xl font-bold text-[var(--text-primary)]">{analyticsData?.totals?.reviews || 0}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminAnalyticsPage;
