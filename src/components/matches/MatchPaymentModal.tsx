'use client';

import React, { useState } from 'react';
import { doc, updateDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase-init';
import { inter, playfair } from '@/app/fonts';
import StripeProvider from '@/app/components/payments/StripeProvider';
import MembershipPaymentForm from '@/app/components/payments/MembershipPaymentForm';

interface MatchPaymentModalProps {
  matchId: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface MembershipPlan {
  id: string;
  name: string;
  description: string;
  firstMonthPrice: number;
  monthlyPrice: number;
  features: string[];
}

const MatchPaymentModal: React.FC<MatchPaymentModalProps> = ({ matchId, onClose, onSuccess }) => {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<MembershipPlan | null>(null);

  const handlePaymentSuccess = async (paymentMethod: any, plan: MembershipPlan) => {
    setSelectedPlan(plan);
    try {
      setProcessing(true);
      setError(null);

      // Get the match document to find the user ID
      const matchRef = doc(db, 'matches', matchId);
      const matchDoc = await getDoc(matchRef);
      
      if (!matchDoc.exists()) {
        throw new Error('Match not found');
      }
      
      const matchData = matchDoc.data();
      const userId = matchData.userId || matchData.memberId;
      
      if (!userId) {
        throw new Error('User ID not found in match document');
      }
      
      // Update the user's membership information
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        'membership.status': 'active',
        'membership.tier': plan.id === 'standard' ? 'one_match' : 'two_matches',
        'membership.startDate': serverTimestamp(),
        'membership.matchesRemaining': plan.id === 'standard' ? 1 : 2,
        'membership.lastPaymentDate': serverTimestamp()
      });
      
      // Update the match document to mark payment as completed
      await updateDoc(matchRef, {
        paymentCompleted: true,
        paymentCompletedAt: new Date().toISOString(),
        paymentMethod: {
          id: paymentMethod.id,
          type: paymentMethod.type,
          card: {
            brand: paymentMethod.card.brand,
            last4: paymentMethod.card.last4,
            expMonth: paymentMethod.card.exp_month,
            expYear: paymentMethod.card.exp_year
          }
        },
        membershipPlan: {
          id: plan.id,
          name: plan.name,
          firstMonthPrice: plan.firstMonthPrice,
          monthlyPrice: plan.monthlyPrice
        }
      });

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (err) {
      console.error('Error processing payment:', err);
      setError('Failed to process payment. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 max-w-md w-full">
        {!success ? (
          <>
            <h3 className={`${playfair.className} text-2xl font-normal text-white mb-4`}>
              Complete Your Membership
            </h3>
            <p className={`${inter.className} text-white/80 mb-6`}>
              Congratulations on your match! To proceed with arranging your date, please complete your first month membership payment.
            </p>
            
            {error && (
              <div className="bg-red-500/20 backdrop-blur-sm rounded-xl p-4 mb-6 text-white">
                <p>{error}</p>
              </div>
            )}
            
            <StripeProvider>
              <MembershipPaymentForm 
                onSuccess={handlePaymentSuccess} 
                onCancel={onClose}
              />
            </StripeProvider>
          </>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className={`${playfair.className} text-2xl font-normal text-white mb-4`}>
              Payment Successful!
            </h3>
            <p className={`${inter.className} text-white/80 mb-6`}>
              Your {selectedPlan?.name} membership has been activated. You'll receive an email shortly with a link to schedule your virtual meeting with your matchmaker.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MatchPaymentModal;
