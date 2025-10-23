import client from './client';
import { auth } from '../firebase';

const API_URL = '/api/users'; // We'll define this backend route

async function getIdToken() {
  const user = auth.currentUser;
  if (user) return await user.getIdToken();
  const fallback = localStorage.getItem('token');
  return fallback || null;
}

function getCurrentUid() {
  const user = auth.currentUser;
  if (user && user.uid) return user.uid;
  // Fallback: try to parse a stored token, prefer uid claim if present
  try {
    const token = localStorage.getItem('token');
    if (!token) return null;
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.uid || payload.user_id || payload.id || null;
  } catch (_) {
    return null;
  }
}

export const getUserProfile = async (userId) => {
  try {
    // Client will handle token automatically via interceptor
    const response = await client.get(`${API_URL}/${userId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    
    // Return mock data instead of throwing error in development
    if (process.env.NODE_ENV === 'development') {
      console.log("Using mock user profile data for development");
      return {
        id: userId || 'mock-user-id',
        name: 'Demo User',
        email: 'demo@example.com',
        bio: 'This is a mock user profile for development',
        isAdmin: false,
        createdEvents: [],
        attendingEvents: []
      };
    }
    
    throw error.response?.data?.message || error.message;
  }
};

export const updateUserProfile = async (userId, profileData) => {
  try {
    const token = await getIdToken();
    if (!token) throw new Error('No token found');
    const response = await client.put(`${API_URL}/${userId}`, profileData);
    return response.data;
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw error.response?.data?.message || error.message;
  }
};

export const getCurrentUserProfile = async () => {
  try {
    const token = await getIdToken();
    if (!token) throw new Error('No token found');
    const userId = getCurrentUid();
    if (!userId) throw new Error('No user id');
    return await getUserProfile(userId);
  } catch (error) {
    console.error("Error getting current user profile:", error);
    
    // Return mock data instead of throwing error in development
    if (process.env.NODE_ENV === 'development') {
      console.log("Using mock current user profile data for development");
      const mockUserId = getCurrentUid() || 'mock-user-id';
      return {
        id: mockUserId,
        name: 'Demo User',
        email: 'demo@example.com',
        bio: 'This is a mock user profile for development',
        isAdmin: false,
        createdEvents: [],
        attendingEvents: []
      };
    }
    
    throw error.response?.data?.message || error.message;
  }
};

export const addEventToUser = async (eventId) => {
  const token = await getIdToken();
  if (!token) throw new Error('No token found');
  const userId = getCurrentUid();
  if (!userId) throw new Error('No user id');
  const res = await client.post(`${API_URL}/${userId}/events/${eventId}`);
  return res.data;
};

export const removeEventFromUser = async (eventId) => {
  const token = await getIdToken();
  if (!token) throw new Error('No token found');
  const userId = getCurrentUid();
  if (!userId) throw new Error('No user id');
  const res = await client.delete(`${API_URL}/${userId}/events/${eventId}`);
  return res.data;
};

export const getMyUserEvents = async () => {
  const token = await getIdToken();
  if (!token) throw new Error('No token found');
  const userId = getCurrentUid();
  if (!userId) throw new Error('No user id');
  const res = await client.get(`${API_URL}/${userId}/events`);
  return res.data;
};