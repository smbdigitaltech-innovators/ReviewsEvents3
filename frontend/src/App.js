import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import HomePage from './pages/HomePage';
import UserMyEventsPage from './pages/UserMyEventsPage';
import ExplorePage from './pages/ExplorePage';
import ProfilePage from './pages/ProfilePage';
import EventDetailPage from './pages/EventDetailPage';
import NotificationsPage from './pages/NotificationsPage';
import AdminEventsPage from './pages/AdminEventsPage';
import AdminMyEventsPage from './pages/AdminMyEventsPage';
import AdminAnalyticsPage from './pages/AdminAnalyticsPage';
import './App.css';
import AdminRoute from './components/AdminRoute';
import UserRoute from './components/UserRoute';
// import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminDashboardPage from './pages/AdminDashboardPage';



function App() {
  const auth = useAuth();
  // Access properties directly without destructuring
  const isAuthenticated = auth?.isAuthenticated || false;
  const isAdmin = auth?.isAdmin || false;
  const [loading, setLoading] = React.useState(auth?.loading || true);

  // Add a timeout to prevent infinite loading
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) {
        console.log("Loading timeout reached, forcing app to render");
        setLoading(false);
      }
    }, 5000); // 5 second timeout
    
    return () => clearTimeout(timer);
  }, [loading]);

  // Update loading state when auth changes
  React.useEffect(() => {
    setLoading(auth?.loading || false);
  }, [auth?.loading]);

  // No imperative window.location redirects; routing will enforce role-based access

  React.useEffect(() => {
    function handleUnauthorized() {
      if (auth?.logout) auth.logout();
      window.location.href = '/login';
    }
    window.addEventListener('api:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('api:unauthorized', handleUnauthorized);
  }, [auth]);

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <Router>
      <Routes>
        {/* Public routes */}
  <Route path="/login" element={isAuthenticated ? <Navigate to={isAdmin ? "/admin/dashboard" : "/home"} /> : <LoginPage />} />
  <Route path="/register" element={isAuthenticated ? <Navigate to={isAdmin ? "/admin/dashboard" : "/home"} /> : <RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        
        {/* Protected user routes */}
  <Route path="/" element={<UserRoute><HomePage /></UserRoute>} />
  <Route path="/home" element={<UserRoute><HomePage /></UserRoute>} />
  <Route path="/explore" element={<UserRoute><ExplorePage /></UserRoute>} />
  <Route path="/profile" element={<UserRoute><ProfilePage /></UserRoute>} />
  <Route path="/events/:id" element={<UserRoute><EventDetailPage /></UserRoute>} />
  <Route path="/notifications" element={<UserRoute><NotificationsPage /></UserRoute>} />
  <Route path="/my-events" element={<UserRoute><UserMyEventsPage /></UserRoute>} />
        
        {/* Admin routes */}
  <Route path="/admin" element={<AdminRoute><AdminDashboardPage /></AdminRoute>}>
    <Route path="dashboard" element={<AdminEventsPage />} />
    <Route path="my-events" element={<AdminMyEventsPage />} />
    <Route path="analytics" element={<AdminAnalyticsPage />} />
    <Route index element={<Navigate to="dashboard" />} />
  </Route>
        
        {/* Default redirect */}
        <Route path="*" element={<Navigate to={isAuthenticated ? (isAdmin ? "/admin/dashboard" : "/home") : "/login"} />} />
      </Routes>
    </Router>
  );
}

export default App;