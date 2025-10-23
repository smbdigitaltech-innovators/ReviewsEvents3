const request = require('supertest');
const express = require('express');

const Notification = require('../models/notificationModel');
const authController = require('../controllers/authController');

jest.mock('../controllers/authController');
jest.mock('../models/notificationModel');

describe('notifications routes', () => {
  let app;
  beforeEach(() => {
    app = express();
    app.get('/api/notifications/list/me', authController.protect, async (req, res) => {
      const items = await Notification.findByUser(req.user, 100);
      res.json(items);
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test('GET /api/notifications/list/me returns 200 for authenticated user', async () => {
    // mock protect to set req.user
    authController.protect.mockImplementation((req, res, next) => { req.user = 'user1'; next(); });
    Notification.findByUser.mockResolvedValue([{ id: 'n1', userId: 'user1' }]);

    const res = await request(app).get('/api/notifications/list/me');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].userId).toBe('user1');
  });
});
