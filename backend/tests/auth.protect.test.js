const request = require('supertest');
const express = require('express');

jest.mock('jsonwebtoken');
// Use a shared mock (name prefixed with 'mock') so jest.mock factory can reference it safely
const mockVerifyIdToken = jest.fn();
jest.mock('../config/firebase', () => ({
  admin: {
    auth: () => ({
      verifyIdToken: mockVerifyIdToken
    })
  }
}));

const jwt = require('jsonwebtoken');
const { admin } = require('../config/firebase');

// Bring in the protect middleware
const authController = require('../controllers/authController');

describe('authController.protect', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.get('/protected', authController.protect, (req, res) => res.json({ user: req.user, isAdmin: req.isAdmin }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('returns 401 when no token present', async () => {
    const res = await request(app).get('/protected');
    expect(res.statusCode).toBe(401);
    expect(res.body.message).toMatch(/No token/i);
  });

  test('accepts valid backend JWT', async () => {
    jwt.verify.mockImplementation(() => ({ id: 'test-user', isAdmin: true }));
    const res = await request(app).get('/protected').set('Authorization', 'Bearer validjwt');
    expect(res.statusCode).toBe(200);
    expect(res.body.user).toBe('test-user');
    expect(res.body.isAdmin).toBe(true);
  });

  test('falls back to firebase verify when jwt.verify throws', async () => {
  jwt.verify.mockImplementation(() => { throw new Error('bad jwt'); });
  // use the shared mock instance
  mockVerifyIdToken.mockResolvedValue({ uid: 'firebase-user' });

    // Mock User.findById to return a user
    jest.spyOn(require('../models/userModel'), 'findById').mockResolvedValue({ id: 'firebase-user', isAdmin: false });

    const res = await request(app).get('/protected').set('Authorization', 'Bearer firebaseToken');
    expect(res.statusCode).toBe(200);
    expect(res.body.user).toBe('firebase-user');
    expect(res.body.isAdmin).toBe(false);
  });
});
