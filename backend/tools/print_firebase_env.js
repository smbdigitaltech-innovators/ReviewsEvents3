// Simple helper: reads backend/serviceAccountKey.json and prints a single-line escaped JSON
// Usage: node tools/print_firebase_env.js
const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'config', 'serviceAccountKey.json');
if (!fs.existsSync(file)) {
  console.error('Please place your service account JSON at', file);
  process.exit(1);
}
const raw = fs.readFileSync(file, 'utf8');
// Ensure it's valid JSON
let obj;
try {
  obj = JSON.parse(raw);
} catch (err) {
  console.error('Invalid JSON in', file, err.message);
  process.exit(1);
}
// Replace newlines in private_key with literal \n so it can be pasted safely
if (obj.private_key && typeof obj.private_key === 'string') {
  obj.private_key = obj.private_key.replace(/\n/g, '\\n');
}
const singleLine = JSON.stringify(obj);
console.log(singleLine);
