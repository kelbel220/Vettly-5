'use client';

import React, { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { inter, playfair } from '../../fonts';

interface MembershipOption {
  id: string;
  name: string;
  description: string;
  firstMonthPrice: number;
  monthlyPrice: number;
  features: string[];
}

interface MembershipPaymentFormProps {
  onSuccess: (paymentMethod: any, selectedPlan: MembershipOption) => void;
  onCancel: () => void;
}

const MembershipPaymentForm: React.FC<MembershipPaymentFormProps> = ({ onSuccess, onCancel }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>('standard');

  // Membership options
  const membershipOptions: Record<string, MembershipOption> = {
    standard: {
      id: 'standard',
      name: 'Standard Matchmaker',
      description: 'For those wanting to explore matchmaking.',
      firstMonthPrice: 69,
      monthlyPrice: 39,
      features: [
        '1 x personalised match provided monthly',
        'Completely hands off service, simply turn up to your date',
        'No endless messaging, just face to face date',
        'No public profiles',
        'Every match is vetted, including a virtual interview',
        'Dedicated matchmaker',
        'Apply & join for free',
        'Cancel & pause anytime'
      ]
    },
    priority: {
      id: 'priority',
      name: 'Priority Matchmaker',
      description: 'For those serious about intentional dating.',
      firstMonthPrice: 79,
      monthlyPrice: 49,
      features: [
        '2 x personalised matches provided monthly',
        'Completely hands off service, simply turn up to your date',
        'No endless messaging, just face to face dates',
        'Priority access to matches before standard members',
        'No public profiles',
        'Dedicated matchmaker',
        'Every match is vetted, including a virtual interview',
        'Apply & join for free',
        'Cancel & pause anytime'
      ]
    }
  };

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
      onSuccess(paymentMethod, membershipOptions[selectedPlan]);
      setProcessing(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-auto">
      <h3 className={`text-xl font-bold text-gray-800 mb-4 ${inter.className}`}>Your Monthly Plan</h3>
      
      <div className="mb-6 space-y-4">
        {/* Membership options */}
        <div className="flex flex-col space-y-4">
          {Object.values(membershipOptions).map((plan) => (
            <div 
              key={plan.id}
              className={`border rounded-lg p-4 cursor-pointer transition-all ${
                selectedPlan === plan.id 
                  ? 'border-[#3B00CC] bg-[#3B00CC]/5' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedPlan(plan.id)}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className={`${playfair.className} text-lg font-medium`}>{plan.name}</h4>
                  <p className="text-gray-600 text-sm">{plan.description}</p>
                  
                  <div className="mt-3">
                    <div className="flex items-baseline">
                      <span className="text-2xl font-bold">${plan.monthlyPrice}</span>
                      <span className="text-gray-600 ml-1">/mo</span>
                    </div>
                    <p className="text-sm text-gray-500">Per month</p>
                  </div>
                  
                  <div className="mt-2 text-sm text-gray-600">
                    <p>First month is ${plan.firstMonthPrice}, which includes your one-time screening interview.</p>
                  </div>
                </div>
                
                <div className="h-6 w-6 rounded-full border border-gray-300 flex items-center justify-center">
                  {selectedPlan === plan.id && (
                    <div className="h-4 w-4 rounded-full bg-[#3B00CC]"></div>
                  )}
                </div>
              </div>
              
              <div className="mt-4 space-y-2">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-start">
                    <span className="text-[#3B00CC] mr-2">+</span>
                    <span className="text-sm text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      
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
            {processing ? 'Processing...' : `Pay $${membershipOptions[selectedPlan].firstMonthPrice}`}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MembershipPaymentForm;
