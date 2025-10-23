import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';
import { logoutUser } from '../api/auth';
import '../index.css';

const AdminReviewModerationPage = () => {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, pending, approved, flagged

  useEffect(() => {
    const fetchReviews = async () => {
      setLoading(true);
      setError(null);
      try {
        // This would need a backend endpoint to fetch all reviews for moderation
        // For now, we'll show a placeholder
        setReviews([]);
      } catch (err) {
        console.error("Failed to fetch reviews for moderation:", err);
        setError(err.message || 'Failed to load reviews. Please try again later.');
        if (err.message === 'No token, authorization denied' || err.message === 'Token is not valid' || err.message === 'Forbidden: You do not have admin privileges.') {
          logoutUser();
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [navigate]);

  const handleLogout = async () => {
    await logoutUser();
    navigate('/login');
  };

  const handleModerateReview = async (reviewId, action) => {
    try {
      // This would need a backend endpoint to moderate reviews
      console.log(`Moderating review ${reviewId} with action: ${action}`);
      // Update local state
      setReviews(prev => prev.map(review => 
        review.id === reviewId 
          ? { ...review, moderationStatus: action }
          : review
      ));
    } catch (err) {
      console.error("Failed to moderate review:", err);
      alert('Failed to moderate review. Please try again.');
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved': return 'status-approved';
      case 'pending': return 'status-pending';
      case 'flagged': return 'status-flagged';
      default: return 'status-pending';
    }
  };

  const getStatusText = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved': return 'Approved';
      case 'pending': return 'Pending';
      case 'flagged': return 'Flagged';
      default: return 'Pending';
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary-color)] mx-auto mb-4"></div>
          <p>Loading Reviews...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)] text-red-500 font-sans">
        <div className="text-center">
          <span className="material-symbols-outlined text-6xl mb-4">error</span>
          <p>Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[var(--bg-primary)] font-sans transition-colors duration-300">
      <aside className="flex w-64 flex-col border-r border-[var(--border-color)] bg-[var(--bg-secondary)] p-6 transition-colors duration-300">
        <div className="flex items-center gap-3 text-slate-800 dark:text-white">
          <svg className="h-6 w-6 text-[var(--primary-color)]" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><path d="M44 4H30.6666V17.3334H17.3334V30.6666H4V44H44V4Z" fill="currentColor"></path></svg>
          <h2 className="text-xl font-bold tracking-tight">EventReviewAI</h2>
        </div>
        <nav className="mt-8 flex flex-1 flex-col gap-2">
          <Link className="flex items-center gap-3 rounded-md px-3 py-2 text-[var(--text-secondary)] transition-colors hover:bg-primary-500/10 hover:text-primary-400" to="/admin/dashboard">
            <span className="material-symbols-outlined">explore</span>
            <span className="font-medium">Explore Events</span>
          </Link>
          <Link className="flex items-center gap-3 rounded-md bg-primary-500/10 px-3 py-2 text-primary-400 transition-colors hover:bg-primary-500/20" to="/admin/reviews">
            <span className="material-symbols-outlined">rate_review</span>
            <span className="font-medium">Review Moderation</span>
          </Link>
          <Link className="flex items-center gap-3 rounded-md px-3 py-2 text-[var(--text-secondary)] transition-colors hover:bg-primary-500/10 hover:text-primary-400" to="/admin/analytics">
            <span className="material-symbols-outlined">analytics</span>
            <span className="font-medium">Analytics</span>
          </Link>
        </nav>
        <div className="mt-auto flex flex-col gap-4">
          <div className="flex items-center justify-between rounded-md bg-[var(--bg-primary)] p-2">
            <span className="text-sm font-medium text-[var(--text-secondary)]">Mode</span>
            <div className="flex items-center gap-1 rounded-md bg-[var(--bg-secondary)] p-1">
              <ThemeToggle />
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-3 rounded-md px-3 py-2 text-[var(--text-secondary)] transition-colors hover:bg-primary-500/10 hover:text-primary-400">
            <span className="material-symbols-outlined">logout</span>
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>
      <main className="flex-1 p-6 lg:p-10">
        <div className="max-w-7xl mx-auto">
          <header className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-8">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">Review Moderation</h2>
              <p className="text-lg text-[var(--text-secondary)] mt-1">Moderate user reviews and ensure content quality.</p>
            </div>
            <div className="flex items-center gap-4">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="rounded-md bg-[var(--bg-secondary)] border border-[var(--border-color)] px-3 py-2 text-[var(--text-primary)] focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors duration-300"
              >
                <option value="all">All Reviews</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="flagged">Flagged</option>
              </select>
            </div>
          </header>

          <div className="space-y-6">
            {reviews.length > 0 ? (
              reviews.map((review) => (
                <div key={review.id} className="bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)] p-6 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="h-10 w-10 rounded-full bg-[var(--primary-color)] flex items-center justify-center text-white font-bold">
                          {review.userName ? review.userName.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <p className="font-semibold text-[var(--text-primary)]">{review.userName || 'Anonymous User'}</p>
                          <p className="text-sm text-[var(--text-secondary)]">{new Date(review.timestamp).toLocaleDateString()}</p>
                        </div>
                        <span className={`status-badge ${getStatusBadgeClass(review.moderationStatus)}`}>
                          {getStatusText(review.moderationStatus)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-amber-400 mb-2">
                        {Array.from({ length: 5 }, (_, i) => (
                          <span key={i} className={`material-symbols-outlined text-lg ${i < review.rating ? 'text-amber-400' : 'text-slate-300'}`}>
                            star
                          </span>
                        ))}
                        <span className="text-sm font-bold ml-1 text-[var(--text-primary)]">({review.rating}/5)</span>
                      </div>
                      <p className="text-[var(--text-primary)] mb-4">{review.text}</p>
                      {review.summary && (
                        <div className="p-4 rounded-lg bg-[var(--bg-primary)] border-l-4 border-green-500">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="bg-green-200 dark:bg-green-800/50 text-green-700 dark:text-green-300 text-xs font-semibold px-2 py-0.5 rounded-full">
                              {review.sentiment}
                            </span>
                            <p className="text-sm font-semibold text-[var(--text-primary)]">AI Summary</p>
                          </div>
                          <p className="text-sm text-[var(--text-secondary)]">{review.summary}</p>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 ml-4">
                      <button
                        onClick={() => handleModerateReview(review.id, 'approved')}
                        className="px-3 py-1.5 text-xs font-semibold text-green-700 bg-green-100 hover:bg-green-200 rounded-md transition-colors"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleModerateReview(review.id, 'flagged')}
                        className="px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-100 hover:bg-red-200 rounded-md transition-colors"
                      >
                        Flag
                      </button>
                      <button
                        onClick={() => handleModerateReview(review.id, 'pending')}
                        className="px-3 py-1.5 text-xs font-semibold text-yellow-700 bg-yellow-100 hover:bg-yellow-200 rounded-md transition-colors"
                      >
                        Pending
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)] p-8 text-center">
                <span className="material-symbols-outlined text-6xl text-[var(--text-secondary)] mb-4">rate_review</span>
                <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">No Reviews to Moderate</h3>
                <p className="text-[var(--text-secondary)]">All reviews are up to date!</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminReviewModerationPage;
