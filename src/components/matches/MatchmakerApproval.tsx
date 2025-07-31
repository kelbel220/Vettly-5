'use client';

import React, { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase-init';
import { inter, playfair } from '@/app/fonts';
import { approveMatchForDate } from '@/lib/services/matchApprovalService';

interface MatchmakerApprovalProps {
  matchId: string;
  memberId: string;
  memberName: string;
  onApprove: () => void;
  onCancel: () => void;
}

const MatchmakerApproval: React.FC<MatchmakerApprovalProps> = ({
  matchId,
  memberId,
  memberName,
  onApprove,
  onCancel
}) => {
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleApprove = async () => {
    try {
      setLoading(true);
      setError(null);

      // Update the match document to mark virtual meeting as completed
      const matchRef = doc(db, 'matches', matchId);
      await updateDoc(matchRef, {
        virtualMeetingCompleted: true,
        virtualMeetingCompletedAt: new Date().toISOString(),
        matchmakerApproved: true,
        matchmakerApprovedAt: new Date().toISOString(),
        matchmakerNotes: notes || 'No notes provided'
      });

      // Also update the user document to mark that they've had their first virtual meeting
      const userRef = doc(db, 'users', memberId);
      await updateDoc(userRef, {
        hasCompletedFirstVirtualMeeting: true,
        firstVirtualMeetingCompletedAt: new Date().toISOString()
      });
      
      // Use the match approval service to approve the match for date
      // This will update the match status and send notifications to both members
      await approveMatchForDate(matchId, 'matchmaker-id'); // In a real app, use the actual matchmaker ID

      onApprove();
    } catch (err) {
      console.error('Error approving member:', err);
      setError('Failed to approve member. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-auto">
      <h3 className={`text-xl font-bold text-gray-800 mb-4 ${inter.className}`}>
        Approve Member for Date
      </h3>
      
      <p className={`text-gray-600 mb-4 ${inter.className}`}>
        You are about to approve <strong>{memberName}</strong> for their date after completing the virtual meeting.
      </p>
      
      <div className="mb-6">
        <label className={`block text-gray-700 mb-2 ${inter.className}`}>Matchmaker Notes (Optional)</label>
        <textarea
          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B00CC]"
          rows={4}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add any notes about the virtual meeting or special instructions for the date..."
        />
      </div>
      
      {error && <div className="text-red-500 mb-4 text-sm">{error}</div>}
      
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className={`flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 ${inter.className}`}
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleApprove}
          disabled={loading}
          className={`flex-1 py-2 px-4 bg-[#3B00CC] rounded-lg text-white hover:bg-[#3B00CC]/90 ${inter.className}`}
        >
          {loading ? 'Processing...' : 'Approve for Date'}
        </button>
      </div>
    </div>
  );
};

export default MatchmakerApproval;
