import { NextApiRequest, NextApiResponse } from 'next';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase-init';
import { approveMatchForDate } from '@/lib/services/matchApprovalService';

/**
 * API handler for matchmaker to approve a member for a date
 * This endpoint should be called from the CRM when a matchmaker approves a member
 * after their virtual meeting
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { matchId, memberId, matchmakerId, notes } = req.body;

    // Validate required fields
    if (!matchId || !memberId || !matchmakerId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if match exists
    const matchRef = doc(db, 'matches', matchId);
    const matchDoc = await getDoc(matchRef);
    
    if (!matchDoc.exists()) {
      return res.status(404).json({ error: 'Match not found' });
    }
    
    const matchData = matchDoc.data();
    
    // Verify virtual meeting has been scheduled
    if (!matchData.virtualMeetingScheduled) {
      return res.status(400).json({ 
        error: 'Virtual meeting must be scheduled before approval' 
      });
    }

    // Update match document
    await updateDoc(matchRef, {
      virtualMeetingCompleted: true,
      virtualMeetingCompletedAt: new Date().toISOString(),
      matchmakerApproved: true,
      matchmakerApprovedAt: new Date().toISOString(),
      matchmakerNotes: notes || 'No notes provided',
      matchmakerId: matchmakerId
    });

    // Update user document
    const userRef = doc(db, 'users', memberId);
    await updateDoc(userRef, {
      hasCompletedFirstVirtualMeeting: true,
      firstVirtualMeetingCompletedAt: new Date().toISOString()
    });
    
    // Approve match for date
    await approveMatchForDate(matchId, matchmakerId);

    // Return success
    return res.status(200).json({ 
      success: true, 
      message: 'Member approved for date successfully' 
    });
  } catch (error: any) {
    console.error('Error approving member for date:', error);
    return res.status(500).json({ 
      error: 'Failed to approve member for date', 
      details: error.message 
    });
  }
}
