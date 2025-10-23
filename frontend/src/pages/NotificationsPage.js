import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        // Mock data for now - would be replaced with actual API call
        const mockNotifications = [
          {
            id: 1,
            title: 'New event near you',
            message: 'There is a new event in your area that matches your interests.',
            date: new Date().toISOString(),
            read: false
          },
          {
            id: 2,
            title: 'Event reminder',
            message: 'Your registered event starts tomorrow!',
            date: new Date(Date.now() - 86400000).toISOString(),
            read: true
          }
        ];
        
        setNotifications(mockNotifications);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching notifications:', error);
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [currentUser]);

  const markAsRead = (id) => {
    setNotifications(notifications.map(notification => 
      notification.id === id ? { ...notification, read: true } : notification
    ));
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Notifications</h1>
        
        {loading ? (
          <div className="flex justify-center">
            <p>Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p>You have no notifications.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div 
                key={notification.id}
                className={`bg-white rounded-lg shadow p-4 ${!notification.read ? 'border-l-4 border-blue-500' : ''}`}
                onClick={() => markAsRead(notification.id)}
              >
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-lg">{notification.title}</h3>
                  <span className="text-sm text-gray-500">
                    {new Date(notification.date).toLocaleDateString()}
                  </span>
                </div>
                <p className="mt-2 text-gray-700">{notification.message}</p>
                {!notification.read && (
                  <div className="mt-2">
                    <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">New</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;