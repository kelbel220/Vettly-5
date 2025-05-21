'use client';

import React from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

// Replace with your actual publishable key
// In a real app, this would be stored in an environment variable
const stripePromise = loadStripe('pk_test_51OxmPcCGcWHDSZpVUWZGXlOLRXvvbkDPqVjcBCLxLYLWVVYFHZFGANKKpWaJLGnQUQJTUqpQrEA5fzGYxQRfnJ1a00gCdDYXww');

interface StripeProviderProps {
  children: React.ReactNode;
}

const StripeProvider: React.FC<StripeProviderProps> = ({ children }) => {
  return (
    <Elements stripe={stripePromise}>
      {children}
    </Elements>
  );
};

export default StripeProvider;
