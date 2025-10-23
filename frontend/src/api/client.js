import axios from 'axios';
import { auth } from '../firebase';

const client = axios.create({
  // Use relative base URL so CRA proxy handles CORS in development
  baseURL: process.env.REACT_APP_API_URL || '',
  withCredentials: true, // Important for CORS
  headers: {
    'Content-Type': 'application/json',
  }
});

// Request interceptor: attach latest Firebase ID token (or fallback token)
client.interceptors.request.use(async (config) => {
  try {
    const user = auth.currentUser;
    let token = null;
    
    if (user) {
      try {
        // Try to get a fresh token
        token = await user.getIdToken(true);
        localStorage.setItem('token', token);
      } catch (e) {
        // If refresh fails, use existing token
        token = localStorage.getItem('token');
      }
    } else {
      token = localStorage.getItem('token');
    }

    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) {
    console.error('Error in request interceptor:', e);
  }
  return config;
}, (error) => Promise.reject(error));

// Response interceptor: handle 401 centrally
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      // Clear stored token to avoid repeated 401s
      try { localStorage.removeItem('token'); } catch (e) {}
      // Optionally: dispatch an event so app can react (e.g., logout)
      const ev = new CustomEvent('api:unauthorized', { detail: error });
      window.dispatchEvent(ev);
    }
    return Promise.reject(error);
  }
);

export default client;
