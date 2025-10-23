import client from './client';

const API_URL = '/api/notifications';

export const getMyNotifications = async () => {
  const res = await client.get(`${API_URL}/list/me`);
  return res.data;
};

export const markAllNotificationsRead = async () => {
  const res = await client.post(`${API_URL}/read`);
  return res.data;
};

export const markNotificationRead = async (id) => {
  const res = await client.post(`${API_URL}/read/${id}`);
  return res.data;
};

export const createEventReminder = async (eventId, eventName, eventDate) => {
  const res = await client.post(`${API_URL}/reminder`, {
    eventId,
    eventName,
    eventDate
  });
  return res.data;
};


