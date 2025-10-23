import client from './client';
import { auth } from '../firebase';

const API_URL = '/api/events';

async function getIdToken() {
  const user = auth.currentUser;
  if (user) {
    return await user.getIdToken();
  }
  return localStorage.getItem('token');
}

export const getEvents = async (filters = {}) => {
  try {
    await getIdToken(); // Ensure token is available for interceptor
    const response = await client.get(`${API_URL}/list`, { params: filters });
    return response.data;
  } catch (error) {
    console.error("Error fetching events:", error);
    throw error.response?.data?.message || error.message;
  }
};

export const getEventDetails = async (id) => {
  try {
    await getIdToken(); // Ensure token is available for interceptor
    const response = await client.get(`${API_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching event details:", error);
    throw error.response?.data?.message || error.message;
  }
};

export const createEvent = async (eventData) => {
  try {
    await getIdToken(); // Ensure token is available for interceptor
    const response = await client.post(`${API_URL}/create`, eventData);
    return response.data;
  } catch (error) {
    console.error("Error creating event:", error);
    throw error.response?.data?.message || error.message;
  }
};

export const getMyEvents = async () => {
  // Allow any authenticated user (including admins) to fetch their own events.
  let token;
  try {
    token = await getIdToken(); // Ensure token is available for interceptor and keep for fallback
    const response = await client.get(`${API_URL}/mine`);
    return response.data;
  } catch (error) {
    // Fallback: if /mine is not available (404), fetch all and filter client-side by createdBy
    if (error?.response?.status === 404) {
      try {
        // Use the token we already got, or get it again if somehow it's not available
        if (!token) {
          token = await getIdToken();
        }
        const payload = token ? JSON.parse(atob(token.split('.')[1])) : null;
        const userId = payload?.id;
        const all = await getEvents();
        return userId ? all.filter(e => String(e.createdBy) === String(userId)) : [];
      } catch (fallbackError) {
        console.error("Fallback for my events failed:", fallbackError);
        throw fallbackError.response?.data?.message || fallbackError.message;
      }
    }
    console.error("Error fetching my events:", error);
    throw error.response?.data?.message || error.message;
  }
};

export const updateEvent = async (id, updateData) => {
  try {
    await getIdToken(); // Ensure token is available for interceptor
    const response = await client.put(`${API_URL}/update/${id}`, updateData);
    return response.data;
  } catch (error) {
    console.error("Error updating event:", error);
    throw error.response?.data?.message || error.message;
  }
};

export const deleteEvent = async (id) => {
  try {
    await getIdToken(); // Ensure token is available for interceptor
    const response = await client.delete(`${API_URL}/delete/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting event:", error);
    throw error.response?.data?.message || error.message;
  }
};