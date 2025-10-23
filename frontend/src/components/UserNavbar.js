import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import { getMyNotifications, markAllNotificationsRead, markNotificationRead } from '../api/notificationApi';
import { logoutUser } from '../api/auth';
import { useAuth } from '../context/AuthContext';

const UserNavbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [userNameInitial, setUserNameInitial] = useState('U');
  const [userProfile, setUserProfile] = useState(null);
  const [showInitials, setShowInitials] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const [showNotif, setShowNotif] = useState(false);
  const [selectedNotif, setSelectedNotif] = useState(null);

  useEffect(() => {
    if (user) {
      const displayName = user.displayName || '';
      const email = user.email || '';
      const initials = displayName ? displayName.split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2) : email.charAt(0).toUpperCase();
      setUserNameInitial(initials);
      setUserProfile({ name: displayName, email, avatar: null });
      setShowInitials(true);
      return;
    }

    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const userEmail = payload.email || '';
        const initials = payload.name ? payload.name.split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2) : userEmail.charAt(0).toUpperCase();
        setUserNameInitial(initials);
        const computedProfile = { name: payload.name || '', email: payload.email || '', avatar: payload.avatar || null };
        setUserProfile(computedProfile);
        setShowInitials(!computedProfile.avatar);
      } catch (e) {
        console.error('Error decoding token for user initial:', e);
      }
    }
  }, [user]);

  useEffect(() => {
    // Only fetch notifications if user is authenticated or we have a stored token
    if (!user && !localStorage.getItem('token')) return;

    const loadNotifications = async () => {
      try {
        // If we have a firebase user, try to refresh token before fetching notifications
        if (user && typeof user.getIdToken === 'function') {
          try {
            const token = await user.getIdToken(true);
            localStorage.setItem('token', token);
          } catch (tErr) {
            // If refresh fails, use existing token
            console.warn('Token refresh failed in navbar, will proceed with existing token', tErr);
          }
        }

        // Fetch notifications for the current authenticated identity (client attaches token)
        const data = await getMyNotifications();
        setNotifs(data);
      } catch (e) {
        if (e?.response?.status === 401 || e?.response?.status === 403) {
          console.error('Failed to load notifications due to auth error:', e);
          try { localStorage.removeItem('token'); } catch (_) {}
          const ev = new CustomEvent('api:unauthorized', { detail: e });
          window.dispatchEvent(ev);
        } else {
          setNotifs([]);
          console.error('Error loading notifications:', e);
        }
      }
    };

    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const getNavLinkClass = (path) => {
    const baseClass = 'text-secondary-500 text-sm font-medium leading-normal hover:text-primary-600 transition-colors';
    const activeClass = 'text-primary-600 text-base font-semibold';
    return location.pathname === path ? activeClass : baseClass;
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      // Clear any user-specific state
      setUserProfile(null);
      setUserNameInitial('U');
      setShowInitials(false);
      setNotifs([]);
      // Navigate to login page
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      // Force navigate to login even if logout fails
      navigate('/login');
    }
  };

  return (
    <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-secondary-200 px-4 sm:px-6 lg:px-8 py-4 bg-white dark:bg-slate-900/80 backdrop-blur-sm sticky top-0 z-20">
      <div className="flex items-center gap-10">
        <div className="flex items-center gap-3 text-slate-800 dark:text-white">
          <svg className="h-6 w-6 text-[var(--primary-color)]" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><path d="M44 4H30.6666V17.3334H17.3334V30.6666H4V44H44V4Z" fill="currentColor"></path></svg>
          <h2 className="text-xl font-bold tracking-tight">EventReviewAI</h2>
        </div>
        <nav className="hidden md:flex items-center gap-8">
          <Link className={getNavLinkClass('/home')} to="/home">Home</Link>
          <Link className={getNavLinkClass('/explore')} to="/explore">Explore</Link>
          <Link className={getNavLinkClass('/my-events')} to="/my-events">My Events</Link>
        </nav>
      </div>
      <div className="flex items-center gap-4">
        <ThemeToggle />
        <div className="relative">
          <button onClick={() => setShowNotif(v => !v)} className="relative text-slate-500 dark:text-slate-400 hover:text-[var(--primary-color)] transition-colors">
            <span className="material-symbols-outlined"> notifications </span>
            {notifs?.some(n => !n.read) && (
              <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-xs font-bold text-white bg-red-500 rounded-full">
                {notifs.filter(n => !n.read).length}
              </span>
            )}
          </button>
          {showNotif && (
            <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg p-2 z-50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-[var(--text-primary)]">Notifications</span>
                <button onClick={async () => { await markAllNotificationsRead(); setNotifs(prev => prev.map(n => ({ ...n, read: true }))); }} className="text-xs text-[var(--primary-color)]">Mark all read</button>
              </div>
              {notifs && notifs.length ? notifs.slice(0, 10).map(n => (
                <div key={n.id} className={`w-full p-3 rounded-md mb-2 cursor-pointer transition-all hover:bg-slate-100 dark:hover:bg-slate-700 ${n.read ? 'opacity-70' : 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500'}`}>
                  <div className="flex items-start justify-between">
                      <div className="flex-1" onClick={async () => { 
                      // Open a modal with detailed info
                      setSelectedNotif(n);
                      setShowNotif(false);
                      try { await markNotificationRead(n.id); } catch (e) { /* ignore */ }
                      setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x)); 
                    }}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-sm font-semibold ${n.read ? 'text-slate-600 dark:text-slate-400' : 'text-slate-800 dark:text-white'}`}>
                          {n.title} {n.meta?.eventName ? `/ ${n.meta.eventName}` : ''}
                        </span>
                        {!n.read && <span className="w-2 h-2 bg-blue-500 rounded-full"></span>}
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-400 mb-1">{n.message}</div>
                      {(n.createdAt || n.timestamp) && (
                        <div className="text-xs text-slate-500 dark:text-slate-500">
                          {new Date(n.createdAt || n.timestamp).toLocaleDateString()} at {new Date(n.createdAt || n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      )}
                    </div>
                    <button 
                      onClick={async () => { 
                        await markNotificationRead(n.id); 
                        setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x)); 
                      }}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 ml-2"
                    >
                      <span className="material-symbols-outlined text-sm">check_circle</span>
                    </button>
                  </div>
                </div>
              )) : (
                <div className="text-center text-sm text-slate-500 dark:text-slate-400 p-4">No notifications yet</div>
              )}
              {notifs && notifs.length > 10 && (
                <div className="pt-1 text-right">
                  <button onClick={() => navigate('/notifications')} className="text-xs text-[var(--primary-color)]">View All</button>
                </div>
              )}

                {/* Notification detail modal */}
                {selectedNotif && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black opacity-40" onClick={() => setSelectedNotif(null)}></div>
                    <div className="relative bg-white dark:bg-slate-800 rounded-lg shadow-lg max-w-xl w-full p-6 z-50">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-[var(--text-primary)]">{selectedNotif.title}</h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400">{selectedNotif.meta?.eventName ? `Event: ${selectedNotif.meta.eventName}` : ''}</p>
                        </div>
                        <button onClick={() => setSelectedNotif(null)} className="text-slate-400 hover:text-slate-600">✕</button>
                      </div>
                      <div className="mb-4">
                        <p className="text-sm text-slate-700 dark:text-slate-300">{selectedNotif.message}</p>
                      </div>
                      {selectedNotif.meta?.changes && selectedNotif.meta.changes.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium mb-2">Changes</h4>
                          <ul className="list-disc list-inside text-sm text-slate-700 dark:text-slate-300">
                            {selectedNotif.meta.changes.map((c, idx) => (
                              <li key={idx}>{c.detail || c}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {selectedNotif.meta?.updatedBy && (
                        <div className="text-xs text-slate-500 dark:text-slate-400">Updated by: {selectedNotif.meta.updatedBy}</div>
                      )}
                      <div className="mt-4 text-right">
                        <button onClick={() => { setSelectedNotif(null); if (selectedNotif.meta?.eventId) navigate(`/events/${selectedNotif.meta.eventId}`); }} className="px-4 py-2 bg-[var(--primary-color)] text-white rounded">View Event</button>
                      </div>
                    </div>
                  </div>
                )}
            </div>
          )}
        </div>
        <button 
          onClick={handleLogout} 
          className="relative text-slate-500 dark:text-slate-400 hover:text-[var(--primary-color)] transition-colors"
          title="Logout"
          aria-label="Logout"
        >
          <span className="material-symbols-outlined"> logout </span>
        </button>
        <Link 
          to="/profile" 
          className="h-10 w-10 rounded-full border-2 border-black bg-[var(--primary-color)] flex items-center justify-center text-white font-bold cursor-pointer transition-all hover:ring-2 hover:ring-primary-600 overflow-hidden group relative"
          title={`${userProfile?.name || 'User'} - View Profile`}
          aria-label="Profile"
        >
          {userProfile?.avatar && !showInitials && (
            <img 
              src={userProfile.avatar} 
              alt={userProfile.name || 'User'} 
              className="w-full h-full object-cover"
              onError={() => setShowInitials(true)}
            />
          )}
          {(!userProfile?.avatar || showInitials) && (
            <span className="text-sm font-semibold text-black dark:text-white">{userNameInitial}</span>
          )}
        </Link>
      </div>
    </header>
  );
};

export default UserNavbar;