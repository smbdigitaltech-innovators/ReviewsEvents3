import client from './client';

const API_URL = '/api/recommendations';

export const getRecommendationsForUser = async (userId) => {
  try {
    const response = await client.get(`${API_URL}/${userId}`);
    return response.data;
  } catch (error) {
    const status = error?.response?.status;
    const message = error?.response?.data?.message || error.message;
    if (status === 401) {
      const err = new Error('No token, authorization denied');
      err.code = 401;
      throw err;
    }
    console.error("Error fetching recommendations:", error);
    throw message;
  }
};