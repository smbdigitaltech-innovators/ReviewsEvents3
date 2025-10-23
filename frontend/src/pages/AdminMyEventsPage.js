import React, { useEffect, useState } from 'react';
import { getMyEvents, updateEvent, deleteEvent } from '../api/eventApi';
import { getReviewsForEvent, replyToReview, deleteReview } from '../api/reviewApi';
import '../index.css';
import { storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const AdminMyEventsPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);
  const [editForm, setEditForm] = useState({ date: '', location: '', description: '' });
  const [editImageFile, setEditImageFile] = useState(null);
  const [detailsOpenFor, setDetailsOpenFor] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [replyMap, setReplyMap] = useState({});
  const [actionBusy, setActionBusy] = useState({});

  // Event handlers
  const handleStartEdit = (ev) => startEdit(ev);
  const handleSaveEdit = (ev) => saveEdit(ev);
  const handleRemoveEvent = (id) => removeEvent(id);
  const handleToggleDetails = (id) => toggleDetails(id);
  const handleSendReply = (reviewId) => sendReply(reviewId);
  const handleRemoveReview = (reviewId) => removeReview(reviewId);

  const loadMyEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMyEvents();
      setEvents(data);
    } catch (e) {
      setError(e?.message || 'Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMyEvents();
  }, []);

  const startEdit = (ev) => {
    setEditingEvent(ev);
    setEditForm({ date: ev.date || '', location: ev.location || '', description: ev.description || '' });
    setEditImageFile(null);
  };

  const saveEdit = async () => {
    if (!editingEvent) return;
    try {
      let payload = { ...editForm };
      if (editImageFile) {
        const fileRef = ref(storage, `event-images/${Date.now()}-${editImageFile.name}`);
        const snapshot = await uploadBytes(fileRef, editImageFile);
        const downloadUrl = await getDownloadURL(snapshot.ref);
        payload.imageUrl = downloadUrl;
      }
      await updateEvent(editingEvent.id, payload);
      setEditingEvent(null);
      await loadMyEvents();
    } catch (e) {
      setError(e?.message || 'Update failed');
    }
  };

  const removeEvent = async (id) => {
    if (!window.confirm('Delete this event?')) return;
    try {
      await deleteEvent(id);
      await loadMyEvents();
    } catch (e) {
      setError(e?.message || 'Delete failed');
    }
  };

  const toggleDetails = async (id) => {
    if (detailsOpenFor === id) {
      setDetailsOpenFor(null);
      setReviews([]);
      return;
    }
    setDetailsOpenFor(id);
    try {
      const revs = await getReviewsForEvent(id);
      setReviews(revs);
    } catch (e) {
      setError(e?.message || 'Failed to load reviews');
    }
  };

  const sendReply = async (reviewId) => {
    const text = replyMap[reviewId];
    if (!text || !text.trim()) return;
    try {
      setActionBusy(prev => ({ ...prev, [reviewId]: true }));
      await replyToReview(reviewId, text.trim());
      const revs = await getReviewsForEvent(detailsOpenFor);
      setReviews(revs);
      setReplyMap(prev => ({ ...prev, [reviewId]: '' }));
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Failed to reply');
    } finally {
      setActionBusy(prev => ({ ...prev, [reviewId]: false }));
    }
  };

  const removeReview = async (reviewId) => {
    if (!window.confirm('Delete this review?')) return;
    try {
      setActionBusy(prev => ({ ...prev, [reviewId]: true }));
      await deleteReview(reviewId);
      const revs = await getReviewsForEvent(detailsOpenFor);
      setReviews(revs);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Failed to delete review');
    } finally {
      setActionBusy(prev => ({ ...prev, [reviewId]: false }));
    }
  };

  useEffect(() => {
    loadMyEvents();
  }, []);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans">Loading...</div>;
  }
  if (error) {
    return <div className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)] text-red-500 font-sans">Error: {error}</div>;
  }

  return (
    <div className="flex min-h-screen bg-[var(--bg-primary)] font-sans transition-colors duration-300">

      <main className="flex-1 p-6 lg:p-10">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold tracking-tight text-[var(--text-primary)] mb-6">My Events</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {events.length > 0 ? (
              events.map(ev => (
                <div key={ev.id} className="bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)] overflow-hidden">
                  {ev?.imageUrl && (
                    <div className="w-full aspect-video bg-cover bg-center" style={{ backgroundImage: `url('${ev.imageUrl}')` }} />
                  )}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-[var(--text-primary)]">{ev.name}</h3>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">{ev.date ? new Date(ev.date).toLocaleDateString() : ''} • {ev.location}</p>
                    <p className="mt-3 text-[var(--text-secondary)]">{ev.description}</p>
                    
                    <div className="mt-4 flex gap-2">
                      <button onClick={() => handleStartEdit(ev)} className="px-3 py-1 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600">
                        Edit
                      </button>
                      <button onClick={() => handleRemoveEvent(ev.id)} className="px-3 py-1 text-sm bg-red-500 text-white rounded-md hover:bg-red-600">
                        Delete
                      </button>
                      <button onClick={() => handleToggleDetails(ev.id)} className="px-3 py-1 text-sm bg-gray-500 text-white rounded-md hover:bg-gray-600">
                        {detailsOpenFor === ev.id ? 'Hide Reviews' : 'Show Reviews'}
                      </button>
                    </div>

                    {editingEvent && editingEvent.id === ev.id && (
                      <div className="mt-5 space-y-3">
                        <div className="grid grid-cols-1 gap-3">
                          <input 
                            value={editForm.date} 
                            onChange={e => setEditForm(prev => ({ ...prev, date: e.target.value }))} 
                            placeholder="Date (YYYY-MM-DD)" 
                            className="rounded-md bg-[var(--bg-secondary)] border border-[var(--border-color)] px-3 py-2" 
                          />
                          <input 
                            value={editForm.location} 
                            onChange={e => setEditForm(prev => ({ ...prev, location: e.target.value }))} 
                            placeholder="Location" 
                            className="rounded-md bg-[var(--bg-secondary)] border border-[var(--border-color)] px-3 py-2" 
                          />
                          <textarea 
                            value={editForm.description} 
                            onChange={e => setEditForm(prev => ({ ...prev, description: e.target.value }))} 
                            placeholder="Description" 
                            className="rounded-md bg-[var(--bg-secondary)] border border-[var(--border-color)] px-3 py-2" 
                          />
                          <button 
                            onClick={() => handleSaveEdit(ev.id)}
                            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                            disabled={actionBusy[ev.id]}
                          >
                            {actionBusy[ev.id] ? 'Saving...' : 'Save Changes'}
                          </button>
                        </div>
                      </div>
                    )}

                    {detailsOpenFor === ev.id && (
                      <div className="mt-4 space-y-4">
                        <h4 className="font-semibold text-[var(--text-primary)]">Reviews</h4>
                        {reviews.map(review => (
                          <div key={review.id} className="bg-[var(--bg-primary)] p-4 rounded-md">
                            <p className="text-[var(--text-primary)]">{review.text}</p>
                            {!review.reply && (
                              <div className="mt-2">
                                <textarea
                                  value={replyMap[review.id] || ''}
                                  onChange={e => setReplyMap(prev => ({ ...prev, [review.id]: e.target.value }))}
                                  placeholder="Write a reply..."
                                  className="w-full rounded-md bg-[var(--bg-secondary)] border border-[var(--border-color)] px-3 py-2"
                                />
                                <button
                                  onClick={() => handleSendReply(review.id)}
                                  className="mt-2 px-3 py-1 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600"
                                  disabled={actionBusy[review.id]}
                                >
                                  {actionBusy[review.id] ? 'Sending...' : 'Send Reply'}
                                </button>
                              </div>
                            )}
                            <button
                              onClick={() => handleRemoveReview(review.id)}
                              className="mt-2 px-3 py-1 text-sm bg-red-500 text-white rounded-md hover:bg-red-600"
                              disabled={actionBusy[review.id]}
                            >
                              {actionBusy[review.id] ? 'Deleting...' : 'Delete Review'}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {editingEvent && editingEvent.id === ev.id && (
                      <div className="mt-2">
                        <label className="block text-sm font-medium mb-1 text-[var(--text-secondary)]">Event Image</label>
                        {ev?.imageUrl && !editImageFile && (
                          <div className="mb-2">
                            <img src={ev.imageUrl} alt={ev.name} className="w-full max-h-48 object-cover rounded-md border border-[var(--border-color)]" />
                          </div>
                        )}
                        <input
                          type="file"
                          onChange={e => setEditImageFile(e.target.files[0])}
                          accept="image/*"
                          className="mt-1"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center text-[var(--text-secondary)]">You have not created any events.</div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminMyEventsPage;


