import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-init';
import { doc, getDoc, updateDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { logExplanationError, logExplanationEngagement } from '@/lib/monitoring/explanationMonitoring';

// Collection name for Vettly 2 notifications
const VETTLY2_NOTIFICATIONS_COLLECTION = 'vettly2Notifications';

/**
 * API route to send match notifications with generated explanations
 * This implements the "delayed notification" approach where we generate
 * the explanation first, then send notifications to members
 */
export async function POST(request: Request) {
  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400'
      }
    });
  }
  
  // Log the request headers for debugging
  console.log('Request headers:', Object.fromEntries(request.headers.entries()));
  // Define matchId at the top level so it's available in catch blocks
  let matchId: string = 'unknown';
  let startTime = Date.now();
  
  try {
    // For local development, we'll allow all requests without authentication
    // In production, you would want to implement proper authentication using environment variables
    const origin = request.headers.get('Origin') || '';
    const isLocalhost = origin.includes('localhost') || origin.includes('127.0.0.1');
    
    if (!isLocalhost) {
      // In production, you would check for a valid API key from environment variables
      // For now, we'll just log this and continue to allow the request
      console.log('Warning: Non-localhost request received from:', origin);
    }
    
    // Get match data from request body
    const requestData = await request.json();
    matchId = requestData.matchId;
    const { isResend = false, regenerateExplanation = false } = requestData;
    console.log('Send match with explanation request received:', requestData);
    
    if (!matchId) {
      return NextResponse.json({ error: 'Missing required data: matchId' }, { 
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      });
    }
    
    // Get the match data
    const matchRef = doc(db, 'matches', matchId);
    const matchDoc = await getDoc(matchRef);
    
    if (!matchDoc.exists()) {
      return NextResponse.json({ 
        error: 'Match not found',
        details: `Match with ID ${matchId} not found in database`
      }, { 
        status: 404,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      });
    }
    
    const matchData = matchDoc.data();
    
    // Get member data
    const [member1Doc, member2Doc] = await Promise.all([
      getDoc(doc(db, 'users', matchData.member1Id)),
      getDoc(doc(db, 'users', matchData.member2Id))
    ]);
    
    if (!member1Doc.exists() || !member2Doc.exists()) {
      return NextResponse.json({ 
        error: 'One or both members not found',
        details: `Member ${!member1Doc.exists() ? matchData.member1Id : matchData.member2Id} not found in database`
      }, { 
        status: 404,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      });
    }
    
    const member1Data = member1Doc.data();
    const member2Data = member2Doc.data();
    
    // Step 1: Generate or retrieve explanation
    let explanation = matchData.compatibilityExplanation;
    
    // If no explanation exists or this is a resend and we want a new explanation
    if (!explanation || (isResend && regenerateExplanation)) {
      console.log(`Generating explanation for match ${matchId}`);
      
      // Call the generate-explanation API
      const explanationResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || ''}/api/matches/generate-explanation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          matchId,
          member1Id: matchData.member1Id,
          member2Id: matchData.member2Id
        })
      });
      
      if (!explanationResponse.ok) {
        console.error(`Error generating explanation: ${explanationResponse.status}`);
        
        // Log the explanation generation error
        await logExplanationError(
          matchId,
          'explanation_generation_failed',
          `Failed to generate explanation: ${explanationResponse.status}`,
          explanationResponse.status
        );
        
        // Continue with a fallback explanation
        explanation = 'You and this match have complementary personalities and shared interests that our matchmakers believe could make for a great connection.';
      } else {
        const explanationData = await explanationResponse.json();
        explanation = explanationData.explanation;
        console.log('Explanation generated successfully');
      }
    }
    
    // Step 2: Get matchmaker data if available
    let matchmakerName = 'Your Matchmaker';
    if (matchData.matchmakerId) {
      try {
        const matchmakerRef = doc(db, 'users', matchData.matchmakerId);
        const matchmakerDoc = await getDoc(matchmakerRef);
        
        if (matchmakerDoc.exists()) {
          const matchmakerData = matchmakerDoc.data();
          if (matchmakerData.firstName) {
            matchmakerName = `${matchmakerData.firstName} ${matchmakerData.lastName || ''}`;
          }
        }
      } catch (err) {
        console.error('Error fetching matchmaker data:', err);
      }
    }
    
    // Step 3: Create notifications for both members with the explanation
    // Create notifications for both members
    const member1NotificationRef = await addDoc(collection(db, VETTLY2_NOTIFICATIONS_COLLECTION), {
      memberId: matchData.member1Id,
      matchId,
      matchData: {
        otherMemberId: matchData.member2Id,
        otherMemberName: `${member2Data.firstName || ''} ${member2Data.lastName || ''}`.trim(),
        otherMemberPhotoUrl: member2Data.profilePhotoUrl || member2Data.photoURL,
        compatibilityScore: matchData.compatibilityScore,
        compatibilityExplanation: explanation,
        matchingPoints: matchData.matchingPoints || [],
        approvedAt: matchData.approvedAt || new Date().toISOString(),
        matchmakerId: matchData.matchmakerId || '',
        matchmakerName: matchmakerName
      },
      status: 'pending',
      createdAt: new Date().toISOString(),
      metrics: {
        processingTimeMs: Date.now() - startTime,
        isResend,
        regeneratedExplanation: regenerateExplanation
      }
    });
    
    const member2NotificationRef = await addDoc(collection(db, VETTLY2_NOTIFICATIONS_COLLECTION), {
      memberId: matchData.member2Id,
      matchId,
      matchData: {
        otherMemberId: matchData.member1Id,
        otherMemberName: `${member1Data.firstName || ''} ${member1Data.lastName || ''}`.trim(),
        otherMemberPhotoUrl: member1Data.profilePhotoUrl || member1Data.photoURL,
        compatibilityScore: matchData.compatibilityScore,
        compatibilityExplanation: explanation,
        matchingPoints: matchData.matchingPoints || [],
        approvedAt: matchData.approvedAt || new Date().toISOString(),
        matchmakerId: matchData.matchmakerId || '',
        matchmakerName: matchmakerName
      },
      status: 'pending',
      createdAt: new Date().toISOString(),
      metrics: {
        processingTimeMs: Date.now() - startTime,
        isResend,
        regeneratedExplanation: regenerateExplanation
      }
    });
    
    // Log engagement for monitoring (notification creation)
    await Promise.all([
      logExplanationEngagement(matchId, matchData.member1Id, 'viewed'),
      logExplanationEngagement(matchId, matchData.member2Id, 'viewed')
    ]);
    
    // Step 4: Update the match record with notification IDs and tracking information
    const updateData: Record<string, any> = {
      vettly2NotificationIds: [member1NotificationRef.id, member2NotificationRef.id],
      sentToMemberAt: new Date().toISOString(),
      compatibilityExplanation: explanation,
      processingMetrics: {
        totalProcessingTimeMs: Date.now() - startTime,
        sentAt: new Date().toISOString(),
        isResend,
        regeneratedExplanation: regenerateExplanation
      }
    };
    
    // Add resend tracking if this is a resend
    if (isResend) {
      updateData.resendCount = (matchData.resendCount || 0) + 1;
      updateData.lastResendAt = new Date().toISOString();
    }
    
    await updateDoc(matchRef, updateData);
    
    return NextResponse.json({ 
      success: true,
      matchId,
      notificationIds: [member1NotificationRef.id, member2NotificationRef.id],
      explanation: explanation,
      metrics: {
        processingTimeMs: Date.now() - startTime
      }
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
    
  } catch (error: any) {
    console.error('Error sending match with explanation:', error);
    
    await logExplanationError(
      matchId,
      'send_match_error',
      error.message || 'Unknown error',
      500
    );
    
    return NextResponse.json({ error: 'Error sending match: ' + (error.message || 'Unknown error') }, { 
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  }
}
