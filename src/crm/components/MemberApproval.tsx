'use client';

import React, { useState } from 'react';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase-init';
import { approveMatchForDate } from '@/lib/services/matchApprovalService';

interface MemberApprovalProps {
  memberId: string;
  matchId: string;
  matchmakerId: string;
  onSuccess: () => void;
  onError: (error: string) => void;
}

const MemberApproval: React.FC<MemberApprovalProps> = ({
  memberId,
  matchId,
  matchmakerId,
  onSuccess,
  onError
}) => {
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleApprove = async () => {
    try {
      setLoading(true);

      // 1. Check if virtual meeting has been scheduled
      const matchRef = doc(db, 'matches', matchId);
      const matchDoc = await getDoc(matchRef);
      
      if (!matchDoc.exists()) {
        throw new Error('Match not found');
      }
      
      const matchData = matchDoc.data();
      
      if (!matchData.virtualMeetingScheduled) {
        throw new Error('Virtual meeting must be scheduled before approval');
      }

      // 2. Update the match document to mark virtual meeting as completed
      await updateDoc(matchRef, {
        virtualMeetingCompleted: true,
        virtualMeetingCompletedAt: new Date().toISOString(),
        matchmakerApproved: true,
        matchmakerApprovedAt: new Date().toISOString(),
        matchmakerNotes: notes || 'No notes provided',
        matchmakerId: matchmakerId
      });

      // 3. Update the user document to mark that they've had their first virtual meeting
      const userRef = doc(db, 'users', memberId);
      await updateDoc(userRef, {
        hasCompletedFirstVirtualMeeting: true,
        firstVirtualMeetingCompletedAt: new Date().toISOString()
      });
      
      // 4. Use the match approval service to approve the match for date
      await approveMatchForDate(matchId, matchmakerId);

      onSuccess();
    } catch (err: any) {
      console.error('Error approving member:', err);
      onError(err.message || 'Failed to approve member');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-semibold mb-4">Approve Member for Date</h3>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Matchmaker Notes
        </label>
        <textarea
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          rows={4}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add any notes about the virtual meeting or special instructions for the date..."
        />
      </div>
      
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          onClick={() => onSuccess()} // Just close without saving
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="button"
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          onClick={handleApprove}
          disabled={loading}
        >
          {loading ? 'Processing...' : 'Approve for Date'}
        </button>
      </div>
    </div>
  );
};

export default MemberApproval;
