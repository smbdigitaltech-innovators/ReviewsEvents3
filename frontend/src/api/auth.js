import axios from 'axios';
import { auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from '../firebase';

const API_URL = '/api/auth'; // Proxy is set up in package.json

export const registerUser = async (name, email, password, isAdmin) => {
  try {
    // 1. Register with Firebase Authentication (Web SDK)
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // 2. Send user data to backend for Firestore profile creation, including isAdmin flag
    const response = await axios.post(`${API_URL}/register`, {
      uid: user.uid,
      email: user.email,
      name: name,
      isAdmin: isAdmin, // Pass the isAdmin flag to the backend
    });
    return response.data;
  } catch (error) {
    console.error("Frontend registration error:", error);
    throw error.response?.data?.message || error.message;
  }
};

export const loginUser = async (email, password) => {
  try {
    // 1. Login with Firebase Authentication
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    if (!userCredential?.user) {
      throw new Error('Firebase authentication failed');
    }

    // 2. Get Firebase ID token
    const idToken = await userCredential.user.getIdToken();
    if (!idToken) {
      throw new Error('Failed to get Firebase token');
    }

    // 3. Call backend to get JWT and user profile
    const response = await axios.post(`${API_URL}/login`, {
      email: email,
      firebaseIdToken: idToken
    });

    // 4. Validate backend response
    if (!response?.data) {
      throw new Error('Invalid server response');
    }

    // 5. Store token and return data
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }

    return response.data;
  } catch (error) {
    console.error("Login error:", error);
    if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
      throw new Error('Invalid email or password');
    }
    throw new Error(error.response?.data?.message || error.message || 'Login failed');
  }
};

export const logoutUser = async () => {
  try {
    // Clear all auth-related storage
    localStorage.removeItem('token');
    sessionStorage.clear();
    
    // Sign out from Firebase
    await signOut(auth); // Using signOut from firebase/auth

    // Optional: Call backend to invalidate session if needed
    try {
      await axios.post(`${API_URL}/logout`);
    } catch (backendError) {
      console.warn('Backend logout failed, but continuing with client cleanup:', backendError);
    }

    // Clear any axios default headers
    delete axios.defaults.headers.common['Authorization'];
    
    return true;
  } catch (error) {
    console.error("Logout error:", error);
    // Even if there's an error, try to clean up what we can
    try {
      localStorage.removeItem('token');
      sessionStorage.clear();
      delete axios.defaults.headers.common['Authorization'];
    } catch (cleanupError) {
      console.warn('Cleanup during error failed:', cleanupError);
    }
    throw error;
  }
};