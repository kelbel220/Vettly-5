'use client';

import React, { useState, useEffect } from 'react';
import { OrbField } from '@/app/components/gradients/OrbField';
import { inter, playfair } from '@/app/fonts';
import { MatchesList } from '@/components/matches/MatchesList';
import { useProposedMatches } from '@/hooks/useProposedMatches';
import { useMatchNotifications } from '@/hooks/useMatchNotifications';
import { useAuth } from '@/context/AuthContext'; // Import useAuth hook
import Image from 'next/image';
import Link from 'next/link';
import MatchPaymentModal from '@/components/matches/MatchPaymentModal';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase-init';
import { sendCalendarBookingEmail, sendPaymentConfirmationEmail } from '@/lib/services/emailService';

export default function MatchesPage() {
  const { matches, loading: matchesLoading, error: matchesError, acceptMatch, declineMatch, undoDeclineMatch } = useProposedMatches();
  const { notifications, loading: notificationsLoading, error: notificationsError, markAsViewed } = useMatchNotifications();
  const { currentUser } = useAuth(); // Extract currentUser from useAuth hook
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ type: 'accept' | 'decline', matchId: string } | null>(null);
  
  // State for payment modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [currentPaymentMatchId, setCurrentPaymentMatchId] = useState<string | null>(null);
  
  // State for success messages
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Combined loading and error states
  const loading = matchesLoading || notificationsLoading;
  const error = matchesError || notificationsError;
  
  // Log notifications for debugging
  useEffect(() => {
    if (notifications.length > 0) {
      console.log('Received notifications:', notifications);
    }
  }, [notifications]);
  
  // Check for matches requiring payment
  useEffect(() => {
    if (matches.length > 0 && currentUser) {
      const matchRequiringPayment = matches.find(match => 
        match.status === 'approved' && 
        match.paymentRequired && 
        !match.paymentCompleted
      );
      
      if (matchRequiringPayment) {
        setCurrentPaymentMatchId(matchRequiringPayment.id);
        setShowPaymentModal(true);
      }
    }
  }, [matches, currentUser]);
  
  // Handle payment completion
  const handlePaymentSuccess = async () => {
    if (!currentUser || !currentPaymentMatchId) return;
    
    try {
      // Get the match data
      const matchRef = doc(db, 'matches', currentPaymentMatchId);
      const matchDoc = await getDoc(matchRef);
      
      if (!matchDoc.exists()) {
        throw new Error('Match not found');
      }
      
      const matchData = matchDoc.data();
      
      // Get user data for email
      const userDocRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const email = userData.email;
        const memberName = userData.displayName || `${userData.firstName || ''} ${userData.lastName || ''}`.trim();
        
        // Send payment confirmation email
        await sendPaymentConfirmationEmail(
          email,
          memberName,
          currentPaymentMatchId,
          currentUser.uid
        );
        
        // Send calendar booking email
        await sendCalendarBookingEmail(
          email,
          memberName,
          currentPaymentMatchId,
          currentUser.uid
        );
        
        // Trigger virtual meeting creation
        try {
          // Import dynamically to avoid SSR issues
          const { createVirtualMeeting } = await import('@/lib/services/calendarService');
          await createVirtualMeeting(currentPaymentMatchId);
          console.log('Virtual meeting creation initiated for match:', currentPaymentMatchId);
        } catch (meetingError) {
          console.error('Error creating virtual meeting:', meetingError);
          // Don't block the main flow if meeting creation fails
        }
        
        setSuccessMessage(
          'Thank you! You will receive an email shortly with a link to book your virtual meeting. ' +
          'Once you have been verified, your match will be approved. ' +
          'You only need to complete this verification once.'
        );
        
        // Close the payment modal
        setShowPaymentModal(false);
        setCurrentPaymentMatchId(null);
        
        // Clear success message after 5 seconds
        setTimeout(() => {
          setSuccessMessage(null);
        }, 5000);
      }
    } catch (err) {
      console.error('Error handling payment success:', err);
    }
  };
  
  // Handle viewing a notification
  const handleViewNotification = async (notificationId: string) => {
    try {
      await markAsViewed(notificationId);
      setSuccessMessage('Match viewed successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err) {
      console.error('Error viewing notification:', err);
    }
  };

  // Handle match acceptance
  const handleAcceptMatch = (matchId: string) => {
    setPendingAction({ type: 'accept', matchId });
    setShowConfirmModal(true);
  };

  // Handle match decline
  const handleDeclineMatch = (matchId: string, reason?: string) => {
    // We don't need to show the confirmation modal anymore since it's handled in MatchDetailCard
    if (reason) {
      // If reason is provided, it means the user has already gone through the two-step process
      declineMatch(matchId, reason);
    }
  };

  // Confirm action
  const confirmAction = async () => {
    if (!pendingAction) return;

    if (pendingAction.type === 'accept') {
      await acceptMatch(pendingAction.matchId);
    }
    // We don't handle decline here anymore as it's handled in the MatchDetailCard with the two-step process

    setShowConfirmModal(false);
    setPendingAction(null);
  };

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden">
      {/* Background container with fixed position to cover entire viewport */}
      <div className="fixed inset-0 w-full h-full" style={{ background: 'linear-gradient(to bottom right, #2800A3, #34D8F1)', zIndex: -10 }}>
        <div className="absolute inset-0 bg-gradient-to-br from-[#34D8F1]/20 via-transparent to-[#34D8F1]/20" />
        <div className="absolute inset-0 overflow-hidden">
          <OrbField />
        </div>
      </div>

      {/* Main Content */}
      <main className="relative z-10 min-h-screen pb-20">
        <div className="container mx-auto px-4 py-8">
          {/* Header with Logo */}
          <div className="flex justify-between items-center mb-8">
            <Link href="/dashboard">
              <Image
                src="/vettly-logo.png"
                alt="Vettly Logo"
                width={120}
                height={30}
                priority
              />
            </Link>
            <Link 
              href="/dashboard"
              className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg text-white hover:bg-white/20 transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>

          {/* Page Title */}
          <div className="text-center mb-12">
            <h1 className={`${playfair.className} text-4xl md:text-5xl font-normal tracking-tight mb-4 text-white`}>
              Your Proposed Matches
            </h1>
            <p className={`${inter.className} text-xl font-extralight tracking-wide text-[#3B00CC]/65`}>
              Discover connections handpicked just for you
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/20 backdrop-blur-sm rounded-xl p-4 mb-8 text-white">
              <p>{error}</p>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="bg-green-500/20 backdrop-blur-sm rounded-xl p-4 mb-8 text-white">
              <p>{successMessage}</p>
            </div>
          )}
          


          {/* Matches List */}
          <div className="max-w-4xl mx-auto">
            <MatchesList
              matches={matches}
              notifications={notifications}
              onAcceptMatch={handleAcceptMatch}
              onDeclineMatch={handleDeclineMatch}
              onUndoDeclineMatch={undoDeclineMatch}
              onViewNotification={handleViewNotification}
              isLoading={loading}
            />
          </div>
        </div>
      </main>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 max-w-md w-full">
            <h3 className={`${playfair.className} text-2xl font-normal text-white mb-4`}>
              {pendingAction?.type === 'accept' ? 'Accept Match' : 'Decline Match'}
            </h3>
            <p className={`${inter.className} text-white/80 mb-6`}>
              {pendingAction?.type === 'accept'
                ? 'Are you sure you want to accept this match? Your matchmaker will be notified and can help arrange your first meeting.'
                : 'Are you sure you want to decline this match? This action cannot be undone.'}
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 border border-white/20 rounded-lg text-white/70 hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmAction}
                className={`px-6 py-2 rounded-lg text-white ${
                  pendingAction?.type === 'accept'
                    ? 'bg-gradient-to-r from-[#73FFF6] to-[#3B00CC]'
                    : 'bg-red-500/80'
                } hover:opacity-90 transition-opacity`}
              >
                {pendingAction?.type === 'accept' ? 'Accept' : 'Decline'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Payment Modal */}
      {showPaymentModal && currentPaymentMatchId && (
        <MatchPaymentModal
          matchId={currentPaymentMatchId}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}
