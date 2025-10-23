import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getEvents } from '../api/eventApi';
import { getMyUserEvents } from '../api/userApi';
import { getRecommendationsForUser } from '../api/recommendationApi';
import { createEventReminder } from '../api/notificationApi';
import UserNavbar from '../components/UserNavbar';
import { useEventUpdates } from '../hooks/useEventUpdates';
import EventCard from '../components/EventCard';
import '../index.css';
import backgroundImage from '../assets/images/Event.jpeg';

const HomePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [recommendedEvents, setRecommendedEvents] = useState([]);
  const [myUserEvents, setMyUserEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Handle real-time updates
  useEventUpdates(({ type, id, data }) => {
    if (type === 'modified') {
      // Update the event in myUserEvents if it exists there
      setMyUserEvents(prev => prev.map(event => 
        event.id === id ? { ...event, ...data } : event
      ));
      // Update in recommendedEvents if it exists there
      setRecommendedEvents(prev => prev.map(event => 
        event.id === id ? { ...event, ...data } : event
      ));
    } else if (type === 'added') {
      // Could add new events to recommendations if they match user's interests
      setRecommendedEvents(prev => {
        const combined = [...(prev || [])];
        if (!combined.find(e => e?.id === data?.id)) {
          combined.push(data);
        }
        return combined.slice(0, 6);
      });
    } else if (type === 'removed') {
      // Remove the event if it was deleted
      setMyUserEvents(prev => prev.filter(event => event.id !== id));
      setRecommendedEvents(prev => prev.filter(event => event.id !== id));
    }
  });
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showEventDetails, setShowEventDetails] = useState(false);

  const hasFetchedRef = useRef(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (hasFetchedRef.current) {
      return;
    }
    hasFetchedRef.current = true;
    const fetchEventsAndRecommendations = async () => {
      try {
        const eventsData = await getEvents();

        try {
          const mine = await getMyUserEvents();
          setMyUserEvents(mine);
        } catch (e) {
          setMyUserEvents([]);
        }

        const uid = user?.uid;
        const recommendationsData = uid ? await getRecommendationsForUser(uid) : [];
        // Fallback: if no personalized recommendations, show recent events as AI Recommended
        const recs = Array.isArray(recommendationsData) && recommendationsData.length > 0
          ? recommendationsData
          : (eventsData || []).slice(0, 6);
        // dedupe by id
        const deduped = Array.from(new Map((recs || []).map(e => [e?.id, e])).values());
        setRecommendedEvents(deduped.slice(0, 6));
        
      } catch (err) {
        setError('Failed to fetch events or recommendations.');
      } finally {
        setLoading(false);
      }
    };
    fetchEventsAndRecommendations();
  }, [user, navigate]);

  // Check for upcoming events and create reminders
  useEffect(() => {
    const checkEventReminders = async () => {
      const now = new Date();
      for (const event of myUserEvents) {
        const eventDate = new Date(event.date);
        const timeDiff = eventDate.getTime() - now.getTime();
        // Remove unused recommendations and userEvents assignments
        if ((timeDiff > 0 && timeDiff <= 24 * 60 * 60 * 1000) || 
            (timeDiff > 24 * 60 * 60 * 1000 && timeDiff <= 7 * 24 * 60 * 60 * 1000) ||
            (timeDiff > 0 && timeDiff <= 2 * 60 * 60 * 1000)) {
          try {
            await createEventReminder(event.id, event.name, event.date);
            console.log(`Created reminder for event "${event.name}"`);
          } catch (error) {
            console.error('Error creating reminder:', error);
          }
        }
      }
    };
    if (myUserEvents.length > 0 && user) {
      checkEventReminders();
    }
  }, [myUserEvents, user]);

  // Helper function to get events for a specific date
  function getEventsForDate(day) {
    if (!day) return [];
    const currentDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    currentDate.setHours(0, 0, 0, 0);
    return myUserEvents.filter(event => {
      const eventDate = new Date(event.date);
      eventDate.setHours(0, 0, 0, 0);
      return eventDate.getTime() === currentDate.getTime();
    });
  };

  // Calendar logic
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay(); 
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];

    for (let i = 0; i < firstDay; i++) { days.push(null); }
    for (let i = 1; i <= daysInMonth; i++) { days.push(i); }
    return days;
  };

  const days = getDaysInMonth(currentMonth);
  const monthYear = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

  const goToPreviousMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  if (loading) {
    return (
      <div className="relative flex min-h-screen w-full flex-col bg-slate-100 dark:bg-slate-900 overflow-x-hidden transition-colors duration-300">
        <UserNavbar />
        <div className="flex min-h-screen items-center justify-center text-slate-800 dark:text-white">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary-color)] mx-auto mb-4"></div>
            <p>Loading...</p>
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
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-slate-100 dark:bg-slate-900 overflow-x-hidden transition-colors duration-300">
      <UserNavbar />
      <main className="flex-1 p-4 sm:p-6 md:p-8 lg:p-12">
        <div className="max-w-7xl mx-auto">
            <div className="relative flex flex-col items-center gap-4 w-full mb-12 py-24 px-4 overflow-hidden width-100%">
              {/* Background Image */}
              <div 
                className="absolute inset-0 bg-cover bg-center" 
                style={{
                  backgroundImage: `url(${backgroundImage})`,

                  filter: 'brightness(0.7)'
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/50" />
              
              <div className="relative text-center">
                <h2 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">Find Your Next Event</h2>
                <p className="mt-3 text-lg text-slate-200">Discover events tailored to your interests.</p>
              </div>
              <div className="relative w-full max-w-4xl">
                <div className="flex flex-col gap-6 rounded-xl bg-white/10 backdrop-blur-md p-6 shadow-lg border border-white/10">
                  <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-slate-800/50 dark:bg-white/50 backdrop-blur-sm border border-slate-700/50 dark:border-slate-200/50">
                    <span className="material-symbols-outlined text-white dark:text-slate-900"> search </span>
                    <input 
                      className="w-full text-white dark:text-slate-900 bg-transparent focus:outline-none focus:ring-0 border-none placeholder:text-white/70 dark:placeholder:text-slate-900/70" 
                      placeholder="Search for events, artists, or venues" 
                      type="text"
                    />
                    <button className="flex items-center gap-2 px-6 py-2 text-sm font-medium rounded-lg bg-[var(--primary-color)] text-white hover:bg-opacity-90 transition-colors">
                      Search
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap justify-center gap-4 mt-6">
                  <button className="flex items-center gap-2 rounded-lg bg-slate-800/50 dark:bg-white/50 backdrop-blur-sm border border-slate-700/50 dark:border-slate-200/50 px-4 py-2 text-sm font-medium text-white dark:text-slate-900 hover:bg-slate-800/70 dark:hover:bg-white/70 transition-all">
                    <span className="material-symbols-outlined text-lg"> location_on </span>
                    <span>Location</span>
                    <span className="material-symbols-outlined text-lg"> arrow_drop_down </span>
                  </button>
                  <button className="flex items-center gap-2 rounded-lg bg-slate-800/50 dark:bg-white/50 backdrop-blur-sm border border-slate-700/50 dark:border-slate-200/50 px-4 py-2 text-sm font-medium text-white dark:text-slate-900 hover:bg-slate-800/70 dark:hover:bg-white/70 transition-all">
                    <span className="material-symbols-outlined text-lg"> category </span>
                    <span>Category</span>
                    <span className="material-symbols-outlined text-lg"> arrow_drop_down </span>
                  </button>
                  <button className="flex items-center gap-2 rounded-lg bg-slate-800/50 dark:bg-white/50 backdrop-blur-sm border border-slate-700/50 dark:border-slate-200/50 px-4 py-2 text-sm font-medium text-white dark:text-slate-900 hover:bg-slate-800/70 dark:hover:bg-white/70 transition-all">
                    <span className="material-symbols-outlined text-lg"> calendar_today </span>
                    <span>Date</span>
                    <span className="material-symbols-outlined text-lg"> arrow_drop_down </span>
                  </button>
                </div>
              </div>
            </div>
            <div className="w-full mb-16">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white">Upcoming Events</h3>
                <div className="flex gap-2 rounded-lg bg-slate-100 dark:bg-slate-800 p-1">
                  <button className="btn-primary flex items-center gap-2 px-4 py-1.5 text-sm rounded-md">
                    <span className="material-symbols-outlined text-lg"> calendar_view_month </span>
                    <span>Calendar</span>
                  </button>
                  <button className="flex items-center gap-2 px-4 py-1.5 text-sm font-medium text-slate-500 dark:text-slate-400 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
                    <span className="material-symbols-outlined text-lg"> list </span>
                    <span>List</span>
                  </button>
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <button onClick={goToPreviousMonth} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                    <span className="material-symbols-outlined text-slate-500 dark:text-slate-400"> chevron_left </span>
                  </button>
                  <p className="text-slate-800 dark:text-white text-lg font-bold">{monthYear}</p>
                  <button onClick={goToNextMonth} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                    <span className="material-symbols-outlined text-slate-500 dark:text-slate-400"> chevron_right </span>
                  </button>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center">
                  <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold py-2">S</p>
                  <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold py-2">M</p>
                  <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold py-2">T</p>
                  <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold py-2">W</p>
                  <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold py-2">T</p>
                  <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold py-2">F</p>
                  <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold py-2">S</p>
                  {days.map((day, index) => {
                    const eventsForDay = getEventsForDate(day);
                    const isToday = day === new Date().getDate() && 
                                   currentMonth.getMonth() === new Date().getMonth() && 
                                   currentMonth.getFullYear() === new Date().getFullYear();
                    
                    return day === null ? (
                      <div key={'empty-' + index} className="h-12 w-full"></div>
                    ) : (
                      <div 
                        key={day} 
                        className={`relative h-20 w-full text-sm font-medium flex flex-col items-center justify-start rounded-lg cursor-pointer transition-all p-2 ${
                          isToday 
                            ? 'bg-[var(--primary-color)] text-white font-bold' 
                            : eventsForDay.length > 0 
                              ? 'dark:bg-white bg-slate-900 dark:text-slate-900 text-white hover:bg-opacity-90 dark:hover:bg-opacity-90' 
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                        onClick={() => {
                          setSelectedDate(day);
                          setShowEventDetails(eventsForDay.length > 0);
                        }}>
                        <span className="text-base mb-1">{day}</span>
                        {eventsForDay.length > 0 && (
                          <div className="flex flex-col items-center gap-1 w-full">
                            <span className="text-xs leading-tight line-clamp-2 text-center">
                              {eventsForDay[0].name}
                            </span>
                            {eventsForDay.length > 1 && (
                              <span className="text-xs bg-black/20 dark:bg-white/20 px-1.5 py-0.5 rounded-full">
                                +{eventsForDay.length - 1} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="w-full">
              <div className="flex items-center gap-4 mb-6">
                <span className="material-symbols-outlined text-[var(--primary-color)] text-3xl"> auto_awesome </span>
                <h3 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white">AI Recommended For You</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {recommendedEvents.length > 0 ? (recommendedEvents.map((event, idx) => (
                  <EventCard key={`${event?.id ?? 'rec'}-${idx}`} event={event} onClick={() => navigate(`/events/${event.id}`)} />
                )) ) : (
                  <p className="text-slate-500 dark:text-slate-400">No recommendations found for you yet. Explore some events!</p>
                )}
              </div>
            </div>
          </div>
        </main>
        
        {/* Event Details Modal */}
        {showEventDetails && selectedDate && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl max-w-md w-full max-h-[80vh] overflow-hidden shadow-xl">
              <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
                <div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                    Events on {new Date(currentMonth.getFullYear(), currentMonth.getMonth(), selectedDate).toLocaleDateString('en-US', { 
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    {getEventsForDate(selectedDate).length} event{getEventsForDate(selectedDate).length !== 1 ? 's' : ''}
                  </p>
                </div>
                <button 
                  onClick={() => setShowEventDetails(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <div className="p-6 max-h-[calc(80vh-6rem)] overflow-y-auto">
                {getEventsForDate(selectedDate).length > 0 ? (
                  <div className="space-y-4">
                    {getEventsForDate(selectedDate).map(event => (
                      <div key={event.id} className="flex flex-col gap-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600">
                        <div>
                          <h4 className="text-lg font-bold text-slate-800 dark:text-white">{event.name}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="material-symbols-outlined text-sm text-slate-400 dark:text-slate-500">schedule</span>
                            <span className="text-sm text-slate-500 dark:text-slate-400">
                              {new Date(event.date).toLocaleTimeString([], { 
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: true
                              })}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-300">{event.description}</p>
                        <div className="flex items-center justify-between pt-2">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                              <span className="material-symbols-outlined text-sm">category</span>
                              {event.category}
                            </span>
                          </div>
                          <button 
                            onClick={() => {
                              navigate(`/events/${event.id}`);
                              setShowEventDetails(false);
                            }}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[var(--primary-color)] rounded-lg hover:bg-opacity-90 transition-colors"
                          >
                            View Details
                            <span className="material-symbols-outlined text-sm">arrow_forward</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <span className="material-symbols-outlined text-4xl text-slate-400 dark:text-slate-500 mb-2">event_busy</span>
                    <p className="text-slate-500 dark:text-slate-400">No events scheduled for this day</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
  );
};

export default HomePage;