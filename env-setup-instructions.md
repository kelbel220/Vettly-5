# Environment Setup Instructions

To ensure your application works correctly after removing the hard-coded Firebase configuration, you need to create a `.env` file with the following values:

```
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyBcN1r5zwzX2lDX9PajoHcdLK6Nl9vgtUg
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=vettlymatch.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=vettlymatch
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=vettlymatch.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=946180653225
NEXT_PUBLIC_FIREBASE_APP_ID=1:946180653225:web:bd33e5f7fe3dac1fdea9b8
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-F1T1EJBBCL

# Add your other environment variables below as needed
# (Copy from .env.example and fill in the actual values)
```

## Steps to complete:

1. Create a file named `.env` in the root of your project
2. Copy the above content into the file
3. Add any other environment variables your application needs

This file is already in your `.gitignore`, so it won't be committed to version control, which is good for security.

## Verify your setup

After creating the `.env` file, you can run the `env-check.js` script to verify that your environment variables are loaded correctly:

```
node env-check.js
```
