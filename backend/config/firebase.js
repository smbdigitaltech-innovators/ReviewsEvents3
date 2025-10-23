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

// 1) Railway and some platforms mount secrets as files (e.g., /secrets/FIREBASE_SERVICE_ACCOUNT)
// Only attempt to read a file if the path is explicitly provided via FIREBASE_SERVICE_ACCOUNT_FILE.
// Do NOT default to '/secrets/FIREBASE_SERVICE_ACCOUNT' because some build systems (Railpack)
// try to stat that path during build even when it isn't provided and that causes failures.
const possibleSecretFile = process.env.FIREBASE_SERVICE_ACCOUNT_FILE; // intentionally no default
if (possibleSecretFile && existsSync(possibleSecretFile)) {
  try {
    const raw = require('fs').readFileSync(possibleSecretFile, 'utf8');
    serviceAccount = JSON.parse(raw);
  } catch (err) {
    console.error('Failed to read/parse service account from file', possibleSecretFile, err.message);
    throw err;
  }
}

// 2) Fallback to FIREBASE_SERVICE_ACCOUNT env var (supports raw JSON or base64-encoded JSON)
if (!serviceAccount && process.env.FIREBASE_SERVICE_ACCOUNT) {
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
}

// 3) Local file fallback for development only
if (!serviceAccount) {
  const localPath = path.join(__dirname, 'serviceAccountKey.json');
  if (process.env.NODE_ENV !== 'production' && existsSync(localPath)) {
    serviceAccount = require(localPath);
  }
}

if (!serviceAccount) {
  console.error('FIREBASE_SERVICE_ACCOUNT is not set. Firebase Admin will not initialize.');
}

if (serviceAccount) {
  // Normalize private_key newlines in case the value was passed with literal "\\n"
  if (serviceAccount.private_key && typeof serviceAccount.private_key === 'string') {
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
  }

  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } catch (err) {
    // Log a clear error but do not crash the whole process. This allows the service
    // to start and report issues while still serving non-Firebase endpoints.
    console.error('Firebase admin initialization failed. Check your service account credentials:', err.message);
  }
}

const db = (admin.apps && admin.apps.length > 0) ? admin.firestore() : null;

module.exports = { db, admin };