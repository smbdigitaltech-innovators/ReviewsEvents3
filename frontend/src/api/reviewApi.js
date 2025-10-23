import client from './client';

const API_URL = '/api/reviews';

export const getReviewsForUser = async (userId) => {
  try {
    const response = await client.get(`${API_URL}/user/${userId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching user reviews:", error);
    throw error.response?.data?.message || error.message;
  }
};

export const addReview = async (reviewData) => {
  try {
    const response = await client.post(`${API_URL}/add`, reviewData);
    return response.data;
  } catch (error) {
    console.error("Error adding review:", error);
    throw error.response?.data?.message || error.message;
  }
};

export const getReviewsForEvent = async (eventId) => {
  try {
    const response = await client.get(`${API_URL}/event/${eventId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching event reviews:", error);
    throw error.response?.data?.message || error.message;
  }
};

export const replyToReview = async (reviewId, replyText) => {
  try {
    const response = await client.post(`${API_URL}/reply/${reviewId}`, { text: replyText });
    return response.data;
  } catch (error) {
    console.error("Error replying to review:", error);
    throw error.response?.data?.message || error.message;
  }
};

export const deleteReview = async (reviewId) => {
  try {
    const response = await client.delete(`${API_URL}/delete/${reviewId}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting review:", error);
    throw error.response?.data?.message || error.message;
  }
};
