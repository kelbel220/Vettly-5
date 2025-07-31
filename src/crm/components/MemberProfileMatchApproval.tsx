'use client';

import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase-init';
import MemberApproval from './MemberApproval';

interface MemberProfileMatchApprovalProps {
  memberId: string;
  matchmakerId: string;
}

interface PendingApprovalMatch {
  id: string;
  otherMemberId: string;
  otherMemberName: string;
  matchDate: string;
  virtualMeetingScheduled: boolean;
  virtualMeetingScheduledAt: string;
}

const MemberProfileMatchApproval: React.FC<MemberProfileMatchApprovalProps> = ({
  memberId,
  matchmakerId
}) => {
  const [pendingApprovalMatches, setPendingApprovalMatches] = useState<PendingApprovalMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch matches that need approval for this member
  useEffect(() => {
    const fetchPendingApprovalMatches = async () => {
      try {
        setLoading(true);
        setError(null);

        // Query matches where this member is involved and virtual meeting is scheduled but not completed
        const matchesRef = collection(db, 'matches');
        
        // Query for matches where member1 is this member
        const member1Query = query(
          matchesRef,
          where('member1Id', '==', memberId),
          where('virtualMeetingScheduled', '==', true),
          where('virtualMeetingCompleted', '==', false)
        );
        
        // Query for matches where member2 is this member
        const member2Query = query(
          matchesRef,
          where('member2Id', '==', memberId),
          where('virtualMeetingScheduled', '==', true),
          where('virtualMeetingCompleted', '==', false)
        );
        
        // Execute both queries
        const [member1Snapshot, member2Snapshot] = await Promise.all([
          getDocs(member1Query),
          getDocs(member2Query)
        ]);
        
        // Process results
        const matches: PendingApprovalMatch[] = [];
        
        // Process member1 matches
        member1Snapshot.forEach(doc => {
          const data = doc.data();
          matches.push({
            id: doc.id,
            otherMemberId: data.member2Id,
            otherMemberName: data.member2Name || 'Unknown Member',
            matchDate: data.createdAt || 'Unknown Date',
            virtualMeetingScheduled: data.virtualMeetingScheduled || false,
            virtualMeetingScheduledAt: data.virtualMeetingScheduledAt || ''
          });
        });
        
        // Process member2 matches
        member2Snapshot.forEach(doc => {
          const data = doc.data();
          matches.push({
            id: doc.id,
            otherMemberId: data.member1Id,
            otherMemberName: data.member1Name || 'Unknown Member',
            matchDate: data.createdAt || 'Unknown Date',
            virtualMeetingScheduled: data.virtualMeetingScheduled || false,
            virtualMeetingScheduledAt: data.virtualMeetingScheduledAt || ''
          });
        });
        
        setPendingApprovalMatches(matches);
      } catch (err) {
        console.error('Error fetching pending approval matches:', err);
        setError('Failed to load matches pending approval');
      } finally {
        setLoading(false);
      }
    };
    
    if (memberId) {
      fetchPendingApprovalMatches();
    }
  }, [memberId]);

  const handleApproveClick = (matchId: string) => {
    setSelectedMatchId(matchId);
    setShowApprovalModal(true);
  };

  const handleApprovalSuccess = () => {
    setShowApprovalModal(false);
    setSuccessMessage('Member approved for date successfully!');
    
    // Remove the approved match from the list
    setPendingApprovalMatches(prev => 
      prev.filter(match => match.id !== selectedMatchId)
    );
    
    // Clear success message after 5 seconds
    setTimeout(() => {
      setSuccessMessage(null);
    }, 5000);
  };

  const handleApprovalError = (errorMessage: string) => {
    setError(errorMessage);
    
    // Clear error after 5 seconds
    setTimeout(() => {
      setError(null);
    }, 5000);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">Pending Match Approvals</h2>
      
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {successMessage}
        </div>
      )}
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {loading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : pendingApprovalMatches.length === 0 ? (
        <div className="text-gray-500 py-4">No matches pending approval for this member.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Match With
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Match Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Virtual Meeting Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pendingApprovalMatches.map(match => (
                <tr key={match.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{match.otherMemberName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {new Date(match.matchDate).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {match.virtualMeetingScheduled 
                        ? new Date(match.virtualMeetingScheduledAt).toLocaleDateString() 
                        : 'Not scheduled'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleApproveClick(match.id)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      Approve for Date
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Approval Modal */}
      {showApprovalModal && selectedMatchId && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
            <div className="p-6">
              <MemberApproval
                memberId={memberId}
                matchId={selectedMatchId}
                matchmakerId={matchmakerId}
                onSuccess={handleApprovalSuccess}
                onError={handleApprovalError}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberProfileMatchApproval;
