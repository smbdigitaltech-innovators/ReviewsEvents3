import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { currentUser, logout, isAdmin } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  return (
    <nav className="bg-indigo-600 text-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-3">
          {/* Logo and brand */}
          <div className="flex items-center space-x-2">
            <Link to="/" className="text-xl font-bold">EventHub</Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/home" className="hover:text-indigo-200 transition">Home</Link>
            <Link to="/explore" className="hover:text-indigo-200 transition">Explore</Link>
            {isAdmin ? (
              <>
                <Link to="/admin/dashboard" className="hover:text-indigo-200 transition">Dashboard</Link>
                <Link to="/admin/events" className="hover:text-indigo-200 transition">Manage Events</Link>
                <Link to="/admin/users" className="hover:text-indigo-200 transition">Users</Link>
                <Link to="/admin/analytics" className="hover:text-indigo-200 transition">Analytics</Link>
              </>
            ) : (
              <>
                <Link to="/my-events" className="hover:text-indigo-200 transition">My Events</Link>
                <Link to="/notifications" className="hover:text-indigo-200 transition">Notifications</Link>
              </>
            )}
            <div className="relative">
              <button 
                onClick={() => navigate('/profile')}
                className="flex items-center hover:text-indigo-200 transition"
              >
                <span className="mr-2">Profile</span>
                <div className="w-8 h-8 rounded-full bg-indigo-400 flex items-center justify-center">
                  {currentUser?.displayName?.charAt(0) || 'U'}
                </div>
              </button>
            </div>
            <button 
              onClick={handleLogout}
              className="bg-indigo-700 hover:bg-indigo-800 px-4 py-2 rounded-md transition"
            >
              Logout
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-white focus:outline-none"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden pb-4">
            <div className="flex flex-col space-y-3">
              <Link to="/home" className="hover:text-indigo-200 transition py-2">Home</Link>
              <Link to="/explore" className="hover:text-indigo-200 transition py-2">Explore</Link>
              {isAdmin ? (
                <>
                  <Link to="/admin/dashboard" className="hover:text-indigo-200 transition py-2">Dashboard</Link>
                  <Link to="/admin/events" className="hover:text-indigo-200 transition py-2">Manage Events</Link>
                  <Link to="/admin/users" className="hover:text-indigo-200 transition py-2">Users</Link>
                  <Link to="/admin/analytics" className="hover:text-indigo-200 transition py-2">Analytics</Link>
                </>
              ) : (
                <>
                  <Link to="/my-events" className="hover:text-indigo-200 transition py-2">My Events</Link>
                  <Link to="/notifications" className="hover:text-indigo-200 transition py-2">Notifications</Link>
                </>
              )}
              <Link to="/profile" className="hover:text-indigo-200 transition py-2">Profile</Link>
              <button 
                onClick={handleLogout}
                className="bg-indigo-700 hover:bg-indigo-800 px-4 py-2 rounded-md transition text-left"
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;