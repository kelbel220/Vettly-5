// Simple script to check if environment variables are loaded
require('dotenv').config({ path: '.env.local' });

console.log('Environment variables check:');
console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'Available (masked for security)' : 'Not available');
console.log('NEXT_PUBLIC_FIREBASE_API_KEY:', process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? 'Available (masked for security)' : 'Not available');
console.log('DEEPGRAM_API_KEY:', process.env.DEEPGRAM_API_KEY ? 'Available (masked for security)' : 'Not available');
