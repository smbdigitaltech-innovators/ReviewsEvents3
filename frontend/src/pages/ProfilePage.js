import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import UserNavbar from '../components/UserNavbar';
import { logoutUser } from '../api/auth';
import { getRecommendationsForUser } from '../api/recommendationApi';
import { getReviewsForUser } from '../api/reviewApi';
import { getEventDetails } from '../api/eventApi';
import { getCurrentUserProfile, updateUserProfile } from '../api/userApi';
import { auth } from '../firebase';
import EventCard from '../components/EventCard';
import '../index.css';

const ProfilePage = () => {
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState(null);
  const [userReviews, setUserReviews] = useState([]);
  const [recommendedEvents, setRecommendedEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    bio: '',
    interests: []
  });

  const hasFetchedRef = useRef(false);

  useEffect(() => {
    if (hasFetchedRef.current) {
      return;
    }
    hasFetchedRef.current = true;

    const fetchProfileData = async () => {
      setLoading(true);
      setError(null);
      try {
        const user = auth.currentUser;
        if (!user) {
          navigate('/login');
          return;
        }
        const userId = user.uid;

        // Fetch user profile from backend
        try {
          const profileData = await getCurrentUserProfile();
          setUserProfile(profileData);
          setEditForm({
            name: profileData.name || '',
            email: profileData.email || '',
            bio: profileData.bio || '',
            interests: profileData.interests || []
          });
        } catch (err) {
          console.log("User profile API not available, using Firebase auth data");
          // Fallback to Firebase auth data if API not available
          const displayName = user.displayName || 'User';
          const email = user.email || 'user@example.com';
          const fallbackProfile = {
            id: userId,
            name: displayName,
            email: email,
            username: `@${email.split('@')[0] || 'user'}`,
            bio: "Welcome to EventReviewAI! Share your event experiences and discover new ones.",
            interests: ['Music', 'Technology', 'Art'],
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=1193d4&color=fff&size=128`
          };
          setUserProfile(fallbackProfile);
          setEditForm({
            name: fallbackProfile.name,
            email: fallbackProfile.email,
            bio: fallbackProfile.bio,
            interests: fallbackProfile.interests
          });
        }

        // Fetch user reviews from backend and enrich with event details where missing
        try {
          const reviewsData = await getReviewsForUser(userId);
          const enriched = await Promise.all(reviewsData.map(async (r) => {
            const review = { ...r };
            // normalized fields expected: eventId, eventName, eventImage
            if ((!review.eventName || !review.eventImage) && review.eventId) {
              try {
                const ev = await getEventDetails(review.eventId);
                review.eventName = review.eventName || ev.name;
                review.eventImage = review.eventImage || ev.imageUrl || ev.image || null;
              } catch (e) {
                // ignore missing event details
              }
            }
            return review;
          }));
          setUserReviews(enriched);
        } catch (err) {
          console.log("Reviews API not available, using empty array");
          setUserReviews([]);
        }

        // Fetch personalized recommendations
        try {
          const recommendationsData = await getRecommendationsForUser(userId);
          setRecommendedEvents(recommendationsData);
        } catch (err) {
          console.log("Recommendations API not available, using empty array");
          setRecommendedEvents([]);
        }

      } catch (err) {
        console.error("Failed to fetch profile data:", err);
        setError(err.message || 'Failed to load profile. Please try again later.');
        if (err.message === 'No token, authorization denied' || err.message === 'Token is not valid') {
            logoutUser(); 
            navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [navigate]);

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    if (!isEditing) {
      // Reset form when starting to edit
      setEditForm({
        name: userProfile?.name || '',
        email: userProfile?.email || '',
        bio: userProfile?.bio || '',
        interests: userProfile?.interests || []
      });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleInterestChange = (e) => {
    const value = e.target.value;
    if (e.target.checked) {
      setEditForm(prev => ({
        ...prev,
        interests: [...prev.interests, value]
      }));
    } else {
      setEditForm(prev => ({
        ...prev,
        interests: prev.interests.filter(interest => interest !== value)
      }));
    }
  };

  const handleSaveProfile = async () => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('No user');
      const userId = user.uid;

      // Update profile in backend
      try {
        await updateUserProfile(userId, editForm);
        setUserProfile(prev => ({
          ...prev,
          ...editForm,
          username: `@${editForm.email.split('@')[0]}`
        }));
        setIsEditing(false);
      } catch (err) {
        console.log("Update API not available, updating locally");
        // Update locally if API not available
        setUserProfile(prev => ({
          ...prev,
          ...editForm,
          username: `@${editForm.email.split('@')[0]}`
        }));
        setIsEditing(false);
      }
    } catch (err) {
      console.error("Failed to update profile:", err);
      setError("Failed to update profile. Please try again.");
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
        return 'bg-green-200 dark:bg-green-800/50 text-green-700 dark:text-green-300';
      case 'Positive':
        return 'bg-green-200 dark:bg-green-800/50 text-green-700 dark:text-green-300';
      case 'Negative':
        return 'bg-red-200 dark:bg-red-800/50 text-red-700 dark:text-red-300';
      default:
        return 'bg-gray-200 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300';
    }
  };
  // getCategoryColor removed (unused) to satisfy lint rules

  const availableInterests = ['Music', 'Technology', 'Art', 'Sports', 'Food', 'Travel', 'Gaming', 'Education'];

  if (loading) {
    return (
      <div className="relative flex min-h-screen w-full flex-col bg-slate-100 dark:bg-slate-900 overflow-x-hidden transition-colors duration-300">
        <UserNavbar />
        <div className="flex min-h-screen items-center justify-center text-slate-800 dark:text-white">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary-color)] mx-auto mb-4"></div>
            <p>Loading Profile...</p>
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

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-slate-100 dark:bg-slate-900 overflow-x-hidden transition-colors duration-300">
      <UserNavbar />
      <main className="flex-1 p-4 sm:p-6 md:p-8 lg:p-12">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* User Profile Header */}
          <div className="rounded-lg bg-white dark:bg-slate-800 p-6 md:p-8 shadow-md relative">
            {/* Edit Button */}
            <button
              onClick={handleEditToggle}
              className="absolute top-4 right-4 flex items-center gap-2 px-4 py-2 bg-slate-800 dark:bg-[var(--primary-color)] text-white rounded-lg hover:bg-slate-700 dark:hover:bg-opacity-80 transition-colors text-sm font-medium"
            >
              <span className="material-symbols-outlined text-base">
                {isEditing ? 'close' : 'edit'}
              </span>
              {isEditing ? 'Cancel' : 'Edit Profile'}
            </button>

                <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="relative">
                <img 
                  alt="User avatar" 
                  className="w-32 h-32 rounded-full object-cover border-4 border-[var(--primary-color)]" 
                  src={userProfile?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(userProfile?.name || 'User')}&background=1193d4&color=fff&size=128`}
                  onError={(e) => {
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userProfile?.name || 'User')}&background=1193d4&color=fff&size=128`;
                  }}
                />
                {isEditing && (
                  <button className="absolute bottom-1 right-1 bg-white dark:bg-slate-700 p-1.5 rounded-full shadow-md hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors">
                    <span className="material-symbols-outlined text-base text-slate-600 dark:text-slate-300">camera_alt</span>
                  </button>
                )}
              </div>
              
              <div className="flex-1 text-center md:text-left flex flex-col justify-center">
                {isEditing ? (
                  <div className="space-y-4 w-full">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Name</label>
                      <input
                        type="text"
                        name="name"
                        value={editForm.name}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-200 focus:ring-2 focus:ring-[var(--primary-color)] focus:border-[var(--primary-color)]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
                      <input
                        type="email"
                        name="email"
                        value={editForm.email}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-200 focus:ring-2 focus:ring-[var(--primary-color)] focus:border-[var(--primary-color)]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Bio</label>
                      <textarea
                        name="bio"
                        value={editForm.bio}
                        onChange={handleInputChange}
                        rows="3"
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-200 focus:ring-2 focus:ring-[var(--primary-color)] focus:border-[var(--primary-color)]"
                        placeholder="Tell us about yourself..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Interests</label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {availableInterests.map(interest => (
                          <label key={interest} className="flex items-center space-x-2 text-sm">
                            <input
                              type="checkbox"
                              value={interest}
                              checked={editForm.interests.includes(interest)}
                              onChange={handleInterestChange}
                              className="rounded border-slate-300 text-[var(--primary-color)] focus:ring-[var(--primary-color)]"
                            />
                            <span className="text-slate-700 dark:text-slate-300">{interest}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveProfile}
                        className="btn-primary px-4 py-2 rounded-lg text-sm"
                      >
                        Save Changes
                      </button>
                      <button
                        onClick={handleEditToggle}
                        className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h1 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-white">{userProfile?.name || 'User'}</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">{userProfile?.username || '@user'}</p>
                    <p className="mt-3 text-slate-600 dark:text-slate-300 max-w-xl">{userProfile?.bio || 'No bio available.'}</p>
                    <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-2">
                      {userProfile?.interests?.map((interest, index) => (
                        <span key={index} className="bg-blue-100 dark:bg-blue-900/50 text-[var(--primary-color)] text-xs font-semibold px-3 py-1 rounded-full">
                          {interest}
                        </span>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Past Reviews Section */}
            <div className="lg:col-span-2 space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">Past Reviews</h2>
                <div className="space-y-6">
                  {userReviews.length > 0 ? userReviews.map((review) => (
                    <div key={review.id} className="rounded-lg bg-white dark:bg-slate-800 p-6 shadow-md">
                      <div className="flex items-start gap-4">
                        <img 
                          alt={review.eventName || 'Event'} 
                          className="w-20 h-20 object-cover rounded-lg" 
                          src={review.eventImage || review.eventImageUrl || review.imageUrl || `https://source.unsplash.com/80x80/?${encodeURIComponent(review.category || 'event')}`}
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-slate-800 dark:text-white">{review.eventName || review.event_name || 'Event Name'}</h3>
                            <div className="flex items-center gap-1 text-amber-400">
                              {renderStars(review.rating)}
                              <span className="text-sm font-bold ml-1 text-slate-600 dark:text-slate-400">({review.rating}/5)</span>
                            </div>
                          </div>
                          <p className="text-sm text-slate-500 dark:text-slate-400">Reviewed {review.reviewDate || 'Recently'}</p>
                          <p className="mt-3 text-slate-600 dark:text-slate-300 text-sm">{review.reviewText || review.text}</p>
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
                  )) : (
                    <div className="rounded-lg bg-white dark:bg-slate-800 p-8 shadow-md text-center">
                      <span className="material-symbols-outlined text-6xl text-slate-400 dark:text-slate-500 mb-4">rate_review</span>
                      <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">No Reviews Yet</h3>
                      <p className="text-slate-500 dark:text-slate-400 mb-4">Start exploring events and share your experiences!</p>
                      <button 
                        onClick={() => navigate('/explore')}
                        className="px-4 py-2 bg-[var(--primary-color)] text-white rounded-lg hover:bg-opacity-80 transition-colors text-sm font-medium"
                      >
                        Explore Events
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar with Recommendations */}
            <div className="lg:col-span-1 space-y-8">
              <div className="sticky top-28">
                <div className="rounded-lg bg-white dark:bg-slate-800 p-6 shadow-md">
                  <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Personalized Recommendations</h3>
                  <div className="space-y-4">
                    {recommendedEvents.length > 0 ? recommendedEvents.map(event => (
                      <EventCard key={event.id} event={event} small={true} onClick={() => navigate(`/events/${event.id}`)} />
                    )) : (
                      <div className="text-center py-4">
                        <span className="material-symbols-outlined text-4xl text-slate-400 dark:text-slate-500 mb-2">auto_awesome</span>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">No recommendations available yet.</p>
                        <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">Start reviewing events to get personalized suggestions!</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProfilePage;