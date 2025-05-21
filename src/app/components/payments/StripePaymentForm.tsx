'use client';

import React, { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { inter } from '../../fonts';

interface StripePaymentFormProps {
  onSuccess: (paymentMethod: any) => void;
  onCancel: () => void;
}

const StripePaymentForm: React.FC<StripePaymentFormProps> = ({ onSuccess, onCancel }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js has not loaded yet. Make sure to disable form submission until Stripe.js has loaded.
      return;
    }

    setProcessing(true);

    const cardElement = elements.getElement(CardElement);
    
    if (!cardElement) {
      setError('Card element not found');
      setProcessing(false);
      return;
    }

    const { error, paymentMethod } = await stripe.createPaymentMethod({
      type: 'card',
      card: cardElement,
    });

    if (error) {
      setError(error.message || 'An error occurred');
      setProcessing(false);
    } else if (paymentMethod) {
      setError(null);
      onSuccess(paymentMethod);
      setProcessing(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-auto">
      <h3 className={`text-xl font-bold text-gray-800 mb-4 ${inter.className}`}>Add Payment Method</h3>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <label className={`block text-gray-700 mb-2 ${inter.className}`}>Card Information</label>
          <div className="p-3 border border-gray-300 rounded-lg">
            <CardElement 
              options={{
                style: {
                  base: {
                    fontSize: '16px',
                    color: '#424770',
                    '::placeholder': {
                      color: '#aab7c4',
                    },
                  },
                  invalid: {
                    color: '#9e2146',
                  },
                },
              }}
            />
          </div>
          {error && <div className="text-red-500 mt-2 text-sm">{error}</div>}
        </div>
        
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className={`flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 ${inter.className}`}
            disabled={processing}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!stripe || processing}
            className={`flex-1 py-2 px-4 bg-[#3B00CC] rounded-lg text-white hover:bg-[#3B00CC]/90 ${inter.className}`}
          >
            {processing ? 'Processing...' : 'Add Card'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default StripePaymentForm;
