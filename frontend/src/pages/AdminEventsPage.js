import React, { useState, useEffect, useCallback } from 'react';
import AddEventModal from '../components/AddEventModal';
import { getEvents, getEventDetails } from '../api/eventApi';
import { getReviewsForEvent } from '../api/reviewApi';
import { getUserProfile } from '../api/userApi';
import '../index.css';

const AdminEventsPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [showEventDetailsModal, setShowEventDetailsModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedEventPoster, setSelectedEventPoster] = useState(null);
  const [selectedEventReviews, setSelectedEventReviews] = useState([]);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState(null);

  const getSentimentBadgeClass = (sentiment) => {
    switch ((sentiment || '').toLowerCase()) {
      case 'very positive':
      case 'positive':
        return 'bg-green-200/60 dark:bg-green-800/40 text-green-700 dark:text-green-300';
      case 'negative':
        return 'bg-red-200/60 dark:bg-red-800/40 text-red-700 dark:text-red-300';
      default:
        return 'bg-slate-200/60 dark:bg-slate-700/40 text-slate-700 dark:text-slate-300';
    }
  };

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const eventsData = await getEvents();
      setEvents(eventsData);
    } catch (err) {
      setError(err.message || 'Failed to load events. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const openEventDetails = async (eventId) => {
    setDetailsLoading(true);
    setDetailsError(null);
    setSelectedEvent(null);
    setSelectedEventPoster(null);
    setSelectedEventReviews([]);
    setShowEventDetailsModal(true);
    try {
      const event = await getEventDetails(eventId);
      setSelectedEvent(event);
      if (event?.createdBy) {
        try {
          const poster = await getUserProfile(event.createdBy);
          setSelectedEventPoster(poster);
        } catch (e) {
          setSelectedEventPoster(null);
        }
      }
      const reviews = await getReviewsForEvent(eventId);
      setSelectedEventReviews(reviews);
    } catch (e) {
      setDetailsError(e?.message || 'Failed to load event details');
    } finally {
      setDetailsLoading(false);
    }
  };

  const getEventStatus = (eventDate) => {
    const now = new Date();
    const event = new Date(eventDate);
    if (event < now) {
      return 'Completed';
    } else if (event.toDateString() === now.toDateString()) {
      return 'Active';
    } else {
      return 'Upcoming';
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status.toLowerCase()) {
      case 'active': return 'status-approved';
      case 'upcoming': return 'status-pending';
      case 'completed': return 'status-flagged';
      default: return '';
    }
  };

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans">Loading...</div>;
  }

  if (error) {
    return <div className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)] text-red-500 font-sans">Error: {error}</div>;
  }

  return (
    <div className="max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">Events Management</h2>
          <p className="text-lg text-[var(--text-secondary)] mt-1">Discover and get insights on events worldwide.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative w-full md:w-64">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]">search</span>
            <input className="w-full pl-10 pr-4 py-2 rounded-md bg-[var(--bg-secondary)] border border-[var(--border-color)] focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors duration-300" placeholder="Search events..." type="text"/>
          </div>
          <button onClick={() => setShowAddEventModal(true)} className="btn-primary flex items-center gap-2 rounded-md px-4 py-2 text-sm">
            <span className="material-symbols-outlined text-base">add</span>
            New Event
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {events.length > 0 ? (events.map(event => {
          const status = getEventStatus(event.date);
          return (
          <div key={event.id} className="bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)] overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300">
            <div className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold text-[var(--text-primary)]">{event.name}</h3>
                  <p className="text-sm text-[var(--text-secondary)] mt-1">{new Date(event.date).toLocaleDateString()}</p>
                </div>
                <span className={`status-badge ${getStatusBadgeClass(status)}`}>{status}</span>
              </div>
              <p className="mt-4 text-[var(--text-secondary)]">{event.description}</p>
              <div className="mt-6 flex items-center justify-between">
                <div className="flex items-center gap-2 text-yellow-400">
                  <span className="material-symbols-outlined text-lg">star</span>
                  <span className="font-bold text-lg text-[var(--text-primary)]">N/A</span>
                  <span className="text-sm text-[var(--text-secondary)]">(0 reviews)</span>
                </div>
                <button 
                  onClick={() => openEventDetails(event.id)}
                  className="font-medium text-primary-400 border border-primary-400/40 rounded-md px-3 py-1.5 transition-all hover:text-primary-300 hover:border-primary-300 hover:shadow-[0_0_0_3px_rgba(17,147,212,0.2)]"
                >
                  View Details
                </button>
              </div>
            </div>
          </div>
        );})) : (
          <p className="text-[var(--text-secondary)] col-span-full text-center">No events found.</p>
        )}
      </div>

      <AddEventModal 
        isOpen={showAddEventModal} 
        onClose={() => setShowAddEventModal(false)} 
        onEventAdded={fetchEvents}
      />

      {showEventDetailsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm">
          <div className="relative w-full max-w-5xl bg-white dark:bg-slate-800 rounded-xl shadow-2xl m-4">
            <div className="p-6 md:p-8">
              <div className="flex items-start justify-between">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Event Details</h2>
                <button onClick={() => setShowEventDetailsModal(false)} className="text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full p-1">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              {detailsLoading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary-color)]"></div>
                </div>
              ) : detailsError ? (
                <div className="text-red-500 py-6">{detailsError}</div>
              ) : selectedEvent ? (
                <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center gap-3">
                      <span className="inline-block bg-blue-100 dark:bg-blue-900/50 text-[var(--primary-color)] text-xs font-semibold px-3 py-1 rounded-full">{selectedEvent.category}</span>
                      <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <span className="material-symbols-outlined text-base">calendar_today</span>
                        {new Date(selectedEvent.date).toLocaleDateString()}
                      </span>
                      <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <span className="material-symbols-outlined text-base">location_on</span>
                        {selectedEvent.location}
                      </span>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{selectedEvent.name}</h3>
                    <p className="text-slate-600 dark:text-slate-300">{selectedEvent.description}</p>

                    <div className="mt-4 p-4 rounded-lg bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700">
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Posted by</p>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-[var(--primary-color)] text-white flex items-center justify-center font-bold">
                          {(selectedEventPoster?.name || selectedEventPoster?.email || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-slate-800 dark:text-white font-medium">{selectedEventPoster?.name || 'Unknown User'}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{selectedEventPoster?.email || ''}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-1">
                    <h4 className="text-lg font-bold text-slate-800 dark:text-white mb-3">Reviews</h4>
                    <div className="space-y-4 max-h-[420px] overflow-auto pr-2">
                      {selectedEventReviews.length > 0 ? selectedEventReviews.map((review) => (
                        <div key={review.id} className="rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4">
                          <div className="flex items-start gap-3">
                            {review.userAvatar ? (
                              <img src={review.userAvatar} alt={review.userName || 'User'} className="h-8 w-8 rounded-full object-cover" />
                            ) : (
                              <div className="h-8 w-8 rounded-full bg-slate-300 dark:bg-slate-600 flex items-center justify-center text-xs font-bold text-white">
                                {(review.userName || 'U').charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-semibold text-slate-800 dark:text-white">{review.userName || 'Anonymous User'}</p>
                                <div className="flex items-center gap-1 text-amber-400">
                                  {Array.from({ length: 5 }, (_, i) => (
                                    <span key={i} className={`material-symbols-outlined text-sm ${i < review.rating ? 'text-amber-400' : 'text-slate-300 dark:text-slate-600'}`}>star</span>
                                  ))}
                                </div>
                              </div>
                              <p className="text-xs text-slate-500 dark:text-slate-400">{review.timestamp ? new Date(review.timestamp).toLocaleDateString() : ''}</p>
                              <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{review.text}</p>
                              {review.summary && (
                                <div className="mt-3 p-3 rounded-md bg-slate-50 dark:bg-slate-900/40 border-l-4 border-green-500">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className={`inline-block ${getSentimentBadgeClass(review.sentiment)} text-xs font-semibold px-2 py-0.5 rounded-full`}>
                                      {review.sentiment || 'neutral'}
                                    </span>
                                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">AI Summary</p>
                                  </div>
                                  <p className="text-xs text-slate-600 dark:text-slate-400">{review.summary}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )) : (
                        <p className="text-slate-500 dark:text-slate-400">No reviews for this event yet.</p>
                      )}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminEventsPage;
