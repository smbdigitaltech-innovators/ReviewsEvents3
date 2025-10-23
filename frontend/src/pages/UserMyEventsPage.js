import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import UserNavbar from '../components/UserNavbar';
import { getMyUserEvents, removeEventFromUser } from '../api/userApi';
import { useEventUpdates } from '../hooks/useEventUpdates';
import '../index.css';
import backgroundImage from '../assets/images/Event.jpeg';

const UserMyEventsPage = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Handle real-time updates
  useEventUpdates(({ type, id, data }) => {
    if (type === 'modified') {
      // Update the event in the list if user has it
      setEvents(prev => prev.map(event => 
        event.id === id ? { ...event, ...data } : event
      ));
    } else if (type === 'removed') {
      // Remove the event if it was deleted
      setEvents(prev => prev.filter(event => event.id !== id));
    }
  });
  const [busyMap, setBusyMap] = useState({});

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMyUserEvents();
      setEvents(data);
    } catch (e) {
      setError(e?.message || 'Failed to load your events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleRemove = async (eventId) => {
    if (!window.confirm('Remove this event from your list?')) return;
    try {
      setBusyMap(prev => ({ ...prev, [eventId]: true }));
      await removeEventFromUser(eventId);
      await load();
    } catch (e) {
      alert(e?.response?.data?.message || e.message || 'Failed to remove event');
    } finally {
      setBusyMap(prev => ({ ...prev, [eventId]: false }));
    }
  };

  if (loading) {
    return (
      <div className="relative flex min-h-screen w-full flex-col bg-slate-100 dark:bg-slate-900 overflow-x-hidden transition-colors duration-300">
        <UserNavbar />
        <div className="flex min-h-screen items-center justify-center text-slate-800 dark:text-white">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative flex min-h-screen w-full flex-col bg-slate-100 dark:bg-slate-900 overflow-x-hidden transition-colors duration-300">
        <UserNavbar />
        <div className="flex min-h-screen items-center justify-center text-red-500">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-slate-100 dark:bg-slate-900 overflow-x-hidden transition-colors duration-300">
      <UserNavbar />
      <main className="flex-1 p-4 sm:p-6 md:p-8 lg:p-12">
        <div className="max-w-7xl mx-auto">
          <div className="relative rounded-2xl overflow-hidden mb-12">
            {/* Background Image */}
            <div 
                className="absolute inset-0 bg-cover bg-center" 
                style={{
                    backgroundImage: `url(${backgroundImage})`,
                    filter: 'brightness(0.7)'
                }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/50" />
            
            <div className="relative text-center py-24">
                <h2 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">My Events</h2>
                <p className="mt-4 text-lg text-slate-200">Events you added from Explore.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {events.length ? events.map(event => (
              <div key={event.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden group flex flex-col shadow-sm">
                <div className="w-full aspect-video bg-cover bg-center overflow-hidden">
                  <div
                    className="w-full h-full bg-cover bg-center group-hover:scale-105 transition-transform duration-300"
                    style={{ backgroundImage: `url(${event.imageUrl || `https://source.unsplash.com/800x600/?${event.category}`})` }}
                  ></div>
                </div>
                <div className="p-4 flex flex-col flex-grow">
                  <h4 className="text-lg font-bold text-slate-800 dark:text-white mb-1">{event.name}</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 flex-grow">{event.description}</p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-[var(--primary-color)]">{new Date(event.date).toLocaleDateString()}</span>
                    <div className="flex items-center gap-2">
                      <button onClick={() => navigate(`/events/${event.id}`)} className="text-slate-400 dark:text-slate-500 group-hover:text-[var(--primary-color)] transition-colors">
                        <span className="material-symbols-outlined"> arrow_forward </span>
                      </button>
                      <button disabled={!!busyMap[event.id]} onClick={() => handleRemove(event.id)} className="btn-danger px-3 py-1 rounded-md text-xs">{busyMap[event.id] ? '...' : 'Remove'}</button>
                    </div>
                  </div>
                </div>
              </div>
            )) : (
              <p className="text-slate-500 dark:text-slate-400 col-span-full text-center">You haven't added any events yet. Browse Explore to add some!</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default UserMyEventsPage;


