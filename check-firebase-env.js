// Comprehensive environment check script
const fs = require('fs');
const path = require('path');

// Check for environment files
console.log('Checking for environment files:');
const envFiles = ['.env', '.env.local', '.env.development', '.env.production'];
envFiles.forEach(file => {
  const exists = fs.existsSync(path.join(process.cwd(), file));
  console.log(`${file}: ${exists ? 'Found' : 'Not found'}`);
});

// Try to load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

// Check Firebase environment variables
console.log('\nChecking Firebase environment variables:');
const firebaseVars = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
  'NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID'
];

let allFirebaseVarsAvailable = true;
firebaseVars.forEach(varName => {
  const isAvailable = !!process.env[varName];
  console.log(`${varName}: ${isAvailable ? 'Available (masked for security)' : 'Not available'}`);
  if (!isAvailable) {
    allFirebaseVarsAvailable = false;
  }
});

// Check other important environment variables
console.log('\nChecking other important environment variables:');
const otherVars = [
  'OPENAI_API_KEY',
  'DEEPGRAM_API_KEY',
  'STRIPE_SECRET_KEY'
];

otherVars.forEach(varName => {
  console.log(`${varName}: ${process.env[varName] ? 'Available (masked for security)' : 'Not available'}`);
});

console.log('\nSummary:');
if (allFirebaseVarsAvailable) {
  console.log('✅ All Firebase environment variables are available.');
  console.log('The changes we made to use environment variables instead of hard-coded values should work correctly.');
} else {
  console.log('❌ Some Firebase environment variables are missing.');
  console.log('You may need to add the missing variables to your .env.local file using the values from env-setup-instructions.md');
}
