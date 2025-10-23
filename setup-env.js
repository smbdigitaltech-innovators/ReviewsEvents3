#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 EventReviewAI Setup Script');
console.log('=============================\n');

// Check if we're in the project root
if (!fs.existsSync('backend') || !fs.existsSync('frontend')) {
  console.error('❌ Please run this script from the project root directory');
  process.exit(1);
}

// Create backend .env file
const backendEnvPath = path.join('backend', '.env');
if (!fs.existsSync(backendEnvPath)) {
  const backendEnvContent = `# JWT Secret for token signing
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-${Date.now()}

# OpenAI API Key for AI services
OPENAI_API_KEY=your-openai-api-key-here

# Server Port
PORT=5000
`;

  fs.writeFileSync(backendEnvPath, backendEnvContent);
  console.log('✅ Created backend/.env file');
} else {
  console.log('ℹ️  backend/.env already exists');
}

// Check if service account key exists
const serviceAccountPath = path.join('backend', 'config', 'serviceAccountKey.json');
if (!fs.existsSync(serviceAccountPath)) {
  console.log('⚠️  Please add your Firebase service account key to backend/config/serviceAccountKey.json');
} else {
  console.log('✅ Firebase service account key found');
}

// Check if frontend Firebase config is updated
const frontendFirebasePath = path.join('frontend', 'src', 'firebase.js');
if (fs.existsSync(frontendFirebasePath)) {
  const content = fs.readFileSync(frontendFirebasePath, 'utf8');
  if (content.includes('your-project-id')) {
    console.log('⚠️  Please update Firebase configuration in frontend/src/firebase.js');
  } else {
    console.log('✅ Frontend Firebase configuration looks good');
  }
}

console.log('\n📋 Next Steps:');
console.log('1. Update backend/.env with your actual JWT_SECRET and OPENAI_API_KEY');
console.log('2. Add your Firebase service account key to backend/config/serviceAccountKey.json');
console.log('3. Update Firebase configuration in frontend/src/firebase.js');
console.log('4. Run "cd backend && npm install && npm start" to start the backend');
console.log('5. Run "cd frontend && npm install && npm start" to start the frontend');
console.log('\n🎉 Setup complete! Happy coding!');
