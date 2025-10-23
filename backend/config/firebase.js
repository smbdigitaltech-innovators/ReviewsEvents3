const admin = require('firebase-admin');
const dotenv = require('dotenv');
const path = require('path');
const { existsSync } = require('fs');

// Only load dotenv in non-production environments and if a .env exists at project root
if (process.env.NODE_ENV !== 'production' && existsSync(path.join(__dirname, '../.env'))) {
  dotenv.config({ path: path.join(__dirname, '../.env') });
}

// Read the FIREBASE_SERVICE_ACCOUNT env var which should be the full JSON string.
let serviceAccount = null;
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  try {
    let candidate = null;
    try {
      const decoded = Buffer.from(raw, 'base64').toString('utf8');
      if (decoded.trim().startsWith('{')) candidate = decoded;
    } catch (e) {
      // not base64
    }
    const toParse = candidate || raw;
    serviceAccount = JSON.parse(toParse);
  } catch (err) {
    console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT. Ensure it is valid JSON or base64-encoded JSON.');
    throw err;
  }
} else {
  const localPath = path.join(__dirname, 'serviceAccountKey.json');
  if (process.env.NODE_ENV !== 'production' && existsSync(localPath)) {
    // Local fallback for development only
    serviceAccount = require(localPath);
  }
}

if (!serviceAccount) {
  console.error('FIREBASE_SERVICE_ACCOUNT is not set. Firebase Admin will not initialize.');
}

if (serviceAccount) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore ? admin.firestore() : null;

module.exports = { db, admin };