const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { google } = require('googleapis');
const path = require('path');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

// Get service account credentials
const getServiceAccountCredentials = () => {
  try {
    // First try to get from Firebase config (production)
    if (functions.config().google && functions.config().google.credentials) {
      console.log('Using service account from Firebase config');
      return JSON.parse(Buffer.from(functions.config().google.credentials, 'base64').toString());
    }
    
    // Fall back to file (local development)
    const SERVICE_ACCOUNT_KEY_PATH = path.join(__dirname, '../../service-account-key.json');
    console.log('Using service account from local file:', SERVICE_ACCOUNT_KEY_PATH);
    return require(SERVICE_ACCOUNT_KEY_PATH);
  } catch (error) {
    console.error('Error loading service account credentials:', error);
    throw new functions.https.HttpsError('internal', 'Failed to load service account credentials', error);
  }
};

exports.createVirtualMeeting = functions.https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in');
  }

  const { matchId } = data;
  const memberId = context.auth.uid;
  
  console.log(`Creating virtual meeting for match ${matchId} and member ${memberId}`);
  
  try {
    // 1. Get match data
    const matchRef = admin.firestore().collection('matches').doc(matchId);
    const matchDoc = await matchRef.get();
    
    if (!matchDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Match not found');
    }
    
    const matchData = matchDoc.data();
    const matchmakerId = matchData.matchmakerId;
    
    console.log(`Retrieved match data. Matchmaker ID: ${matchmakerId}`);
    
    // 2. Get member and matchmaker data for emails
    const [memberDoc, matchmakerDoc] = await Promise.all([
      admin.firestore().collection('users').doc(memberId).get(),
      admin.firestore().collection('users').doc(matchmakerId).get()
    ]);
    
    if (!memberDoc.exists || !matchmakerDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'User data not found');
    }
    
    const memberData = memberDoc.data();
    const matchmakerData = matchmakerDoc.data();
    
    console.log(`Retrieved user data for member ${memberData.email} and matchmaker ${matchmakerData.email || 'unknown'}`);
    
    // 3. Set up Google Calendar client with service account
    const credentials = getServiceAccountCredentials();
    
    // Create JWT auth client
    const auth = new google.auth.JWT(
      credentials.client_email,
      null,
      credentials.private_key,
      ['https://www.googleapis.com/auth/calendar']
    );
    
    const calendar = google.calendar({ version: 'v3', auth });
    
    // 4. Create a Google Calendar event with Google Meet
    const startTime = new Date();
    startTime.setDate(startTime.getDate() + 3); // Schedule 3 days from now as example
    startTime.setHours(10, 0, 0, 0); // 10:00 AM
    
    const endTime = new Date(startTime);
    endTime.setMinutes(startTime.getMinutes() + 15); // 15 minute meeting
    
    const event = {
      summary: `Vettly Virtual Meeting: ${memberData.firstName} and Matchmaker`,
      description: `15-minute virtual meeting for Vettly match #${matchId}`,
      start: {
        dateTime: startTime.toISOString(),
        timeZone: 'Australia/Sydney',
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: 'Australia/Sydney',
      },
      attendees: [
        { email: memberData.email },
        { email: matchmakerData.email || 'kschulter88@gmail.com' }
      ],
      conferenceData: {
        createRequest: {
          requestId: `vettly-meeting-${matchId}-${Date.now()}`,
          conferenceSolutionKey: { type: 'hangoutsMeet' }
        }
      },
      sendUpdates: 'all'
    };
    
    console.log(`Creating calendar event with Google Meet`);
    
    // 5. Insert the event
    const createdEvent = await calendar.events.insert({
      calendarId: 'primary', // Use matchmaker's primary calendar
      resource: event,
      conferenceDataVersion: 1,
      sendNotifications: true
    });
    
    console.log(`Calendar event created with ID: ${createdEvent.data.id}`);
    
    // 6. Get the Google Meet link
    const meetLink = createdEvent.data.conferenceData?.entryPoints?.find(
      e => e.entryPointType === 'video'
    )?.uri || '';
    
    console.log(`Google Meet link: ${meetLink}`);
    
    // 7. Store event in Firestore for member's dashboard calendar
    const calendarEvent = {
      id: createdEvent.data.id,
      title: event.summary,
      start: event.start.dateTime,
      end: event.end.dateTime,
      type: 'virtual-meeting',
      meetLink: meetLink,
      matchId: matchId,
      allDay: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    // Add to member's calendar events
    await admin.firestore().collection('users').doc(memberId)
      .collection('calendarEvents').add(calendarEvent);
    
    console.log(`Added event to member's calendar events collection`);
    
    // 8. Update match document
    await matchRef.update({
      virtualMeetingScheduled: true,
      virtualMeetingScheduledAt: admin.firestore.FieldValue.serverTimestamp(),
      virtualMeetingDetails: {
        googleEventId: createdEvent.data.id,
        meetLink: meetLink,
        startTime: event.start.dateTime,
        endTime: event.end.dateTime
      }
    });
    
    console.log(`Updated match document with meeting details`);
    
    return {
      success: true,
      meetingDetails: {
        googleEventId: createdEvent.data.id,
        meetLink: meetLink,
        startTime: event.start.dateTime,
        endTime: event.end.dateTime
      }
    };
  } catch (error) {
    console.error('Error creating virtual meeting:', error);
    throw new functions.https.HttpsError('internal', 'Failed to create virtual meeting', error);
  }
});
