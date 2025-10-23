import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import UserNavbar from '../components/UserNavbar';
import { getEventDetails } from '../api/eventApi';
import { getReviewsForEvent, addReview } from '../api/reviewApi';
// import { getUserProfile } from '../api/userApi';
import { logoutUser } from '../api/auth';
import '../index.css';

const EventDetailPage = () => {
  const { id: eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reviewForm, setReviewForm] = useState({
    rating: 0,
    text: ''
  });
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    const fetchEventData = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        // Fetch event details
        const eventData = await getEventDetails(eventId);
        setEvent(eventData);

        // Fetch reviews for this event
        const reviewsData = await getReviewsForEvent(eventId);
        setReviews(reviewsData);

      } catch (err) {
        console.error("Failed to fetch event data:", err);
        setError(err.message || 'Failed to load event details. Please try again later.');
        if (err.message === 'No token, authorization denied' || err.message === 'Token is not valid') {
          logoutUser();
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    if (eventId) {
      fetchEventData();
    }
  }, [eventId, navigate]);

  const handleRatingChange = (rating) => {
    setReviewForm(prev => ({ ...prev, rating: parseInt(rating) }));
  };

  const handleReviewTextChange = (e) => {
    setReviewForm(prev => ({ ...prev, text: e.target.value }));
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (reviewForm.rating === 0 || !reviewForm.text.trim()) {
      alert('Please provide both a rating and review text.');
      return;
    }

    setSubmittingReview(true);
    try {
      await addReview({
        eventId: eventId,
        rating: reviewForm.rating,
        text: reviewForm.text
      });

      // Refresh reviews after successful submission
      const reviewsData = await getReviewsForEvent(eventId);
      setReviews(reviewsData);

      // Reset form
      setReviewForm({ rating: 0, text: '' });
      alert('Review submitted successfully!');
    } catch (err) {
      console.error("Failed to submit review:", err);
      alert('Failed to submit review. Please try again.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} className={`material-symbols-outlined text-base ${i <= rating ? 'text-amber-400' : 'text-slate-300 dark:text-slate-600'}`}>
          star
        </span>
      );
    }
    return stars;
  };

  const getSentimentColor = (sentiment) => {
    switch (sentiment) {
      case 'Very Positive':
      case 'Positive':
        return 'bg-green-200 dark:bg-green-800/50 text-green-700 dark:text-green-300';
      case 'Negative':
        return 'bg-red-200 dark:bg-red-800/50 text-red-700 dark:text-red-300';
      default:
        return 'bg-gray-200 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300';
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'Music Festival':
      case 'Music':
        return 'bg-blue-100 dark:bg-blue-900/50 text-[var(--primary-color)]';
      case 'Conference':
      case 'Tech':
        return 'bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-300';
      case 'Art Exhibition':
      case 'Art':
        return 'bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300';
      default:
        return 'bg-gray-100 dark:bg-gray-900/50 text-gray-600 dark:text-gray-300';
    }
  };

  const calculateAverageRating = () => {
    if (reviews.length === 0) return 0;
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    return (totalRating / reviews.length).toFixed(1);
  };

  if (loading) {
    return (
      <div className="relative flex min-h-screen w-full flex-col bg-slate-100 dark:bg-slate-900 overflow-x-hidden transition-colors duration-300">
        <UserNavbar />
        <div className="flex min-h-screen items-center justify-center text-slate-800 dark:text-white">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary-color)] mx-auto mb-4"></div>
            <p>Loading Event Details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative flex min-h-screen w-full flex-col bg-slate-100 dark:bg-slate-900 overflow-x-hidden transition-colors duration-300">
        <UserNavbar />
        <div className="flex min-h-screen items-center justify-center text-red-500">
          <div className="text-center">
            <span className="material-symbols-outlined text-6xl mb-4">error</span>
            <p>Error: {error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 px-4 py-2 bg-[var(--primary-color)] text-white rounded-lg hover:bg-opacity-80 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="relative flex min-h-screen w-full flex-col bg-slate-100 dark:bg-slate-900 overflow-x-hidden transition-colors duration-300">
        <UserNavbar />
        <div className="flex min-h-screen items-center justify-center text-slate-800 dark:text-white">
          <div className="text-center">
            <span className="material-symbols-outlined text-6xl mb-4">event_busy</span>
            <p>Event not found</p>
            <button 
              onClick={() => navigate('/home')} 
              className="mt-4 px-4 py-2 bg-[var(--primary-color)] text-white rounded-lg hover:bg-opacity-80 transition-colors"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-slate-100 dark:bg-slate-900 overflow-x-hidden transition-colors duration-300">
      <UserNavbar />
      <main className="flex-1 p-4 sm:p-6 md:p-8 lg:p-12">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Event Details */}
            <div className="rounded-lg bg-white dark:bg-slate-800 p-6 md:p-8 shadow-md">
              <div className="flex flex-col md:flex-row gap-6">
                <img 
                  alt={event.name} 
                  className="w-full md:w-1/3 h-64 md:h-auto object-cover rounded-lg" 
                  src={event?.imageUrl || `https://source.unsplash.com/800x600/?${event.category || 'event'}`}
                  onError={(e) => { e.currentTarget.src = `https://source.unsplash.com/800x600/?${event.category || 'event'}`; }}
                />
                <div className="flex-1 space-y-4">
                  <span className={`inline-block ${getCategoryColor(event.category)} text-xs font-semibold px-3 py-1 rounded-full`}>
                    {event.category}
                  </span>
                  <h1 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-white">{event.name}</h1>
                  <div className="flex items-center text-slate-500 dark:text-slate-400 gap-4">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-lg">calendar_today</span>
                      <span>{new Date(event.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-lg">location_on</span>
                      <span>{event.location}</span>
                    </div>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300">
                    {event.description}
                  </p>
                  
                  {/* Event Rating Summary */}
                  {reviews.length > 0 && (
                    <div className="flex items-center gap-4 pt-2">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 text-amber-400">
                          {renderStars(Math.round(calculateAverageRating()))}
                        </div>
                        <span className="text-lg font-bold text-slate-800 dark:text-white">{calculateAverageRating()}</span>
                        <span className="text-sm text-slate-500 dark:text-slate-400">({reviews.length} review{reviews.length !== 1 ? 's' : ''})</span>
                      </div>
                    </div>
                  )}
                  
                  <div className="pt-2">
                    <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-2">AI Recommendations</h3>
                    <div className="flex flex-wrap gap-2">
                      <span className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium px-2.5 py-1 rounded-full">#{event.category}</span>
                      <span className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium px-2.5 py-1 rounded-full">#Recommended</span>
                      <span className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium px-2.5 py-1 rounded-full">#Popular</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Reviews Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Reviews</h2>
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                  <span className="material-symbols-outlined text-lg">rate_review</span>
                  <span className="text-sm font-medium">{reviews.length} review{reviews.length !== 1 ? 's' : ''}</span>
                </div>
              </div>
              {reviews.length > 0 ? (
                reviews.map((review) => (
                  <div key={review.id} className="rounded-lg bg-white dark:bg-slate-800 p-6 shadow-md">
                    <div className="flex items-start gap-4">
                      <div className="relative">
                        {review.userAvatar ? (
                          <img 
                            src={review.userAvatar} 
                            alt={review.userName || 'User'} 
                            className="h-12 w-12 rounded-full object-cover border-2 border-slate-200 dark:border-slate-600"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div 
                          className={`h-12 w-12 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-500 dark:text-slate-400 ${review.userAvatar ? 'hidden' : 'flex'}`}
                        >
                          {review.userName ? review.userName.charAt(0).toUpperCase() : 'U'}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-slate-800 dark:text-white">{review.userName || 'Anonymous User'}</p>
                            {review.userEmail && (
                              <p className="text-xs text-slate-500 dark:text-slate-400">{review.userEmail}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-amber-400">
                            {renderStars(review.rating)}
                            <span className="text-sm font-bold ml-1 text-slate-600 dark:text-slate-400">({review.rating}/5)</span>
                          </div>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                          {review.timestamp ? new Date(review.timestamp).toLocaleDateString() : 'Recently'}
                        </p>
                        <p className="mt-3 text-slate-600 dark:text-slate-300">{review.text}</p>
                        {review.summary && (
                          <div className="mt-4 p-4 rounded-lg bg-slate-100 dark:bg-slate-900/50 border-l-4 border-green-500">
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`inline-block ${getSentimentColor(review.sentiment)} text-xs font-semibold px-2 py-0.5 rounded-full`}>
                                {review.sentiment}
                              </span>
                              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">AI Summary</p>
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-400">{review.summary}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-lg bg-white dark:bg-slate-800 p-8 shadow-md text-center">
                  <span className="material-symbols-outlined text-6xl text-slate-400 dark:text-slate-500 mb-4">rate_review</span>
                  <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">No Reviews Yet</h3>
                  <p className="text-slate-500 dark:text-slate-400">Be the first to share your experience!</p>
                </div>
              )}
            </div>
          </div>

          {/* Review Form Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-28 rounded-lg bg-white dark:bg-slate-800 p-6 shadow-md">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Leave a Review</h3>
              <form className="space-y-4" onSubmit={handleSubmitReview}>
                <div>
                  <label className="block text-sm font-medium text-slate-800 dark:text-slate-200 mb-1">Your Rating</label>
                  <div className="star-rating flex flex-row-reverse justify-end items-center text-3xl">
                    <input id="star5" name="rating" type="radio" value="5" checked={reviewForm.rating === 5} onChange={(e) => handleRatingChange(e.target.value)} />
                    <label htmlFor="star5" title="5 stars"><span className="material-symbols-outlined">star</span></label>
                    <input id="star4" name="rating" type="radio" value="4" checked={reviewForm.rating === 4} onChange={(e) => handleRatingChange(e.target.value)} />
                    <label htmlFor="star4" title="4 stars"><span className="material-symbols-outlined">star</span></label>
                    <input id="star3" name="rating" type="radio" value="3" checked={reviewForm.rating === 3} onChange={(e) => handleRatingChange(e.target.value)} />
                    <label htmlFor="star3" title="3 stars"><span className="material-symbols-outlined">star</span></label>
                    <input id="star2" name="rating" type="radio" value="2" checked={reviewForm.rating === 2} onChange={(e) => handleRatingChange(e.target.value)} />
                    <label htmlFor="star2" title="2 stars"><span className="material-symbols-outlined">star</span></label>
                    <input id="star1" name="rating" type="radio" value="1" checked={reviewForm.rating === 1} onChange={(e) => handleRatingChange(e.target.value)} />
                    <label htmlFor="star1" title="1 star"><span className="material-symbols-outlined">star</span></label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-800 dark:text-slate-200" htmlFor="review">Your Review</label>
                  <div className="mt-1">
                    <textarea 
                      className="form-textarea block w-full appearance-none rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 placeholder-slate-400 dark:placeholder-slate-500 shadow-sm focus:border-[var(--primary-color)] focus:outline-none focus:ring-[var(--primary-color)] sm:text-sm text-slate-800 dark:text-slate-200 transition-colors duration-300" 
                      id="review" 
                      name="review" 
                      placeholder="Share your experience..." 
                      rows="5"
                      value={reviewForm.text}
                      onChange={handleReviewTextChange}
                    />
                  </div>
                </div>
                <div>
                  <button 
                    type="submit" 
                    disabled={submittingReview}
                    className="btn-primary flex w-full justify-center rounded-md py-2 px-4 text-sm disabled:opacity-50"
                  >
                    {submittingReview ? 'Submitting...' : 'Submit Review'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default EventDetailPage;
