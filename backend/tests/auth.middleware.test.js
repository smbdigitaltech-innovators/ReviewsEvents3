const { isAdmin, isUser } = require('../middleware/adminAuth');

// Simple mocks for req/res/next
function makeMock(userDoc) {
  const req = { user: 'test-user' };
  const res = {
    status(code) {
      this._status = code; return this;
    },
    json(obj) { this._json = obj; }
  };
  const next = jest.fn();

  // Mock db.collection('users').doc(req.user).get()
  const db = require('../config/firebase').db;
  const original = db.collection;
  db.collection = () => ({ doc: () => ({ get: async () => ({ exists: !!userDoc, data: () => userDoc }) }) });

  return { req, res, next, restore: () => { db.collection = original; } };
}

test('isAdmin allows admin user', async () => {
  const { req, res, next, restore } = makeMock({ isAdmin: true });
  await isAdmin(req, res, next);
  expect(next).toHaveBeenCalled();
  restore();
});

test('isAdmin forbids non-admin user', async () => {
  const { req, res, next, restore } = makeMock({ isAdmin: false });
  await isAdmin(req, res, next);
  expect(res._status).toBe(403);
  restore();
});

test('isUser allows normal user', async () => {
  const { req, res, next, restore } = makeMock({ isAdmin: false });
  await isUser(req, res, next);
  expect(next).toHaveBeenCalled();
  restore();
});

test('isUser forbids admin user', async () => {
  const { req, res, next, restore } = makeMock({ isAdmin: true });
  await isUser(req, res, next);
  expect(res._status).toBe(403);
  restore();
});
