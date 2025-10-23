import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEvents } from '../api/eventApi';
import { addEventToUser, getMyUserEvents } from '../api/userApi';
import UserNavbar from '../components/UserNavbar';
import { useEventUpdates } from '../hooks/useEventUpdates';
import '../index.css';
import backgroundImage from '../assets/images/Event.jpeg';

const ExplorePage = () => {
    const navigate = useNavigate();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // small helper to dedupe by id
    const dedupeById = (arr) => Array.from(new Map((arr || []).map(e => [e?.id, e])).values());

    // Handle real-time updates
    useEventUpdates(({ type, id, data }) => {
        if (type === 'modified') {
            // Update the event in the list
            setEvents(prev => prev.map(event => 
                event.id === id ? { ...event, ...data } : event
            ));
        } else if (type === 'added') {
            // Add new event to the list if it matches current filters
            setEvents(prev => {
                const combined = dedupeById([...(prev || []), data]);
                return combined.sort((a, b) => new Date(b?.date || 0) - new Date(a?.date || 0));
            });
        } else if (type === 'removed') {
            // Remove deleted event
            setEvents(prev => prev.filter(event => event.id !== id));
        }
    });
    const [filters, setFilters] = useState({
        search: '',
        category: 'All Categories',
        date: '',
        location: '',
    });
    const [sortOrder, setSortOrder] = useState('Popularity'); 
    const [myEventIds, setMyEventIds] = useState(new Set());

    useEffect(() => {
        const fetchEvents = async () => {
            setLoading(true);
            setError(null);
            try {
                const backendFilters = {
                    ...(filters.category !== 'All Categories' && { category: filters.category }),
                    ...(filters.date && { date: filters.date }),
                    ...(filters.location && { location: filters.location }),
                };

                const eventsData = await getEvents(backendFilters);
                const filteredBySearch = filters.search 
                    ? eventsData.filter(event => 
                        event.name.toLowerCase().includes(filters.search.toLowerCase()) || 
                        event.description.toLowerCase().includes(filters.search.toLowerCase())
                      )
                    : eventsData;
                
                // ensure unique events by id (sometimes realtime feed or backend may return duplicates)
                setEvents(dedupeById(filteredBySearch));

                // load user's current events to disable Add button
                try {
                    const mine = await getMyUserEvents();
                    setMyEventIds(new Set(mine.map(e => e.id)));
                } catch (e) {
                    // ignore silently if not logged in or error
                }
            } catch (err) {
                console.error("Failed to fetch events:", err);
                setError(err.message || 'Failed to load events. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchEvents();
    }, [filters]); 

    const handleFilterChange = (e) => {
        setFilters(prevFilters => ({
            ...prevFilters,
            [e.target.name]: e.target.value === '' ? null : e.target.value,
        }));
    };

    const handleSortChange = (e) => {
        setSortOrder(e.target.value);
    };

    const handleAddToMyEvents = async (eventId) => {
        try {
            await addEventToUser(eventId);
            setMyEventIds(prev => new Set([...prev, eventId]));
        } catch (e) {
            alert(e?.response?.data?.message || e.message || 'Failed to add event');
        }
    };

    if (loading) {
        return (
            <div className="relative flex min-h-screen w-full flex-col bg-slate-100 dark:bg-slate-900 overflow-x-hidden transition-colors duration-300">
                <UserNavbar />
                <div className="flex min-h-screen items-center justify-center text-slate-800 dark:text-white">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary-color)] mx-auto mb-4"></div>
                        <p>Loading Events...</p>
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
                                <h2 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">Explore Events</h2>
                                <p className="mt-4 text-lg text-slate-200">Find new experiences beyond your personalized recommendations.</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                            <aside className="lg:col-span-1 bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 h-fit">
                                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6">Filters</h3>
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-secondary-600 mb-2" htmlFor="search">Search Event</label>
                                        <div className="relative">
                                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400"> search </span>
                                            <input className="w-full pl-10 pr-4 py-2 border border-secondary-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 text-sm" id="search" placeholder="Event name or keyword" type="text" name="search" value={filters.search} onChange={handleFilterChange} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-secondary-600 mb-2" htmlFor="category">Category</label>
                                        <select className="w-full border border-secondary-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 text-sm" id="category" name="category" value={filters.category} onChange={handleFilterChange}>
                                            <option value="All Categories">All Categories</option>
                                            <option value="Music">Music</option>
                                            <option value="Art & Culture">Art & Culture</option>
                                            <option value="Technology">Technology</option>
                                            <option value="Food & Drink">Food & Drink</option>
                                            <option value="Sports">Sports</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-secondary-600 mb-2" htmlFor="date">Date</label>
                                        <input className="w-full border border-secondary-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 text-sm" id="date" type="date" name="date" value={filters.date} onChange={handleFilterChange} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-secondary-600 mb-2" htmlFor="location">Location</label>
                                        <div className="relative">
                                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400"> location_on </span>
                                            <input className="w-full pl-10 pr-4 py-2 border border-secondary-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 text-sm" id="location" placeholder="City or zip code" type="text" name="location" value={filters.location} onChange={handleFilterChange} />
                                        </div>
                                    </div>
                                </div>
                            </aside>
                            <div className="lg:col-span-3">
                                <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
                                    <p className="text-secondary-600">Showing <span className="font-bold text-secondary-800">{events.length}</span> results</p>
                                    <div className="flex items-center gap-2">
                                        <label className="text-sm font-medium text-secondary-600" htmlFor="sort">Sort by:</label>
                                        <select className="border border-secondary-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 text-sm pl-3 pr-8 py-1.5" id="sort" value={sortOrder} onChange={handleSortChange}>
                                            <option value="Popularity">Popularity</option>
                                            <option value="Trending">Trending</option>
                                            <option value="Date (Newest)">Date (Newest)</option>
                                            <option value="Date (Oldest)">Date (Oldest)</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                                    {events.length > 0 ? (events.map((event, idx) => (
                                        <div key={`${event?.id ?? 'evt'}-${idx}`} className="bg-white dark:bg-slate-800 rounded-2xl border border-secondary-200 dark:border-slate-700 overflow-hidden group flex flex-col shadow transition-shadow hover:shadow-xl">
                                            <div className="relative w-full aspect-video overflow-hidden">
                                                <img
                                                    src={event?.imageUrl || `https://source.unsplash.com/800x600/?${encodeURIComponent(event?.category || 'event')}`}
                                                    alt={event.name}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                />
                                                <span className="absolute top-3 left-3 bg-primary-500/80 text-white text-xs font-semibold px-3 py-1 rounded-full shadow">{event.category}</span>
                                            </div>
                                            <div className="p-5 flex flex-col flex-grow">
                                                <h4 className="text-xl font-bold text-secondary-900 dark:text-white mb-2">{event.name}</h4>
                                                <p className="text-sm text-secondary-500 dark:text-slate-300 mb-4 flex-grow line-clamp-3">{event.description}</p>
                                                <div className="flex items-center justify-between text-sm mt-auto">
                                                    <span className="font-semibold text-primary-600 dark:text-primary-400 flex items-center gap-1">
                                                        <span className="material-symbols-outlined text-base">calendar_today</span>
                                                        {new Date(event.date).toLocaleDateString()}
                                                    </span>
                                                    <div className="flex items-center gap-2">
                                                        <button 
                                                            onClick={() => navigate(`/events/${event.id}`)}
                                                            className="text-secondary-400 dark:text-primary-400 group-hover:text-primary-600 transition-colors"
                                                        >
                                                            <span className="material-symbols-outlined"> arrow_forward </span>
                                                        </button>
                                                        <button 
                                                            disabled={myEventIds.has(event.id)}
                                                            onClick={() => handleAddToMyEvents(event.id)}
                                                            className={`btn-primary px-3 py-1 rounded-md text-xs font-semibold ${myEventIds.has(event.id) ? 'opacity-60 cursor-not-allowed' : ''}`}
                                                        >
                                                            {myEventIds.has(event.id) ? 'Added' : 'Add'}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))) : (
                                        <p className="text-secondary-500 col-span-full text-center">No events found matching your criteria.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        
    );
};

export default ExplorePage;