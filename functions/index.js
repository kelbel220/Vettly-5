const { onRequest } = require('firebase-functions/v2/https');
const { onDocumentUpdated } = require('firebase-functions/v2/firestore');
const admin = require('firebase-admin');

admin.initializeApp();

/**
 * Simple test function to verify deployment is working
 */
exports.helloWorld = onRequest((request, response) => {
  response.send('Hello from Firebase! Compatibility analysis is coming soon.');
});

/**
 * Cloud function that triggers when a user completes or updates their questionnaire
 * Analyzes compatibility with other users and stores results
 */
exports.analyzeCompatibility = onDocumentUpdated('users/{userId}', async (event) => {
  const userId = event.params.userId;
  const afterData = event.data.after;
  const beforeData = event.data.before;

  console.log(`Received update for user ${userId}`);

  // Only run if questionnaire data has changed
  if (JSON.stringify(beforeData.questionnaireAnswers) === JSON.stringify(afterData.questionnaireAnswers)) {
    console.log('No changes to questionnaire answers, skipping compatibility analysis');
    return null;
  }

  // Check if questionnaire is completed
  if (!afterData.questionnaireCompleted) {
    console.log('Questionnaire not completed, skipping compatibility analysis');
    return null;
  }

  console.log(`Running compatibility analysis for user ${userId}`);
  return calculateMatchesForUser(userId);
});

/**
 * Main function to calculate compatibility matches for a user
 * @param {string} userId - The ID of the user to calculate matches for
 */
async function calculateMatchesForUser(userId) {
  try {
    const db = admin.firestore();
    
    // Get the user's data
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      console.error(`User ${userId} not found`);
      return null;
    }
    
    // Get all potential matches (users who have completed the questionnaire)
    const potentialMatches = await db.collection('users')
      .where('questionnaireCompleted', '==', true)
      .get();
    
    console.log(`Found ${potentialMatches.size} potential matches`);
    
    const userData = userDoc.data();
    const compatibilityResults = [];
    
    // Process each potential match
    for (const matchDoc of potentialMatches.docs) {
      const matchId = matchDoc.id;
      
      // Skip self
      if (matchId === userId) continue;
      
      const matchData = matchDoc.data();
      
      // Calculate compatibility score
      const score = calculateCompatibilityScore(userData, matchData);
      
      // Add to results
      compatibilityResults.push({
        userId: matchId,
        compatible: score.compatible,
        score: score.overall,
        breakdown: score.breakdown,
        reason: score.reason
      });
    }
    
    // Sort results by score (highest first)
    compatibilityResults.sort((a, b) => b.score - a.score);
    
    // Store the results in the user's document
    await db.collection('users').doc(userId).collection('matches')
      .doc('compatibilityScores').set({
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
        matches: compatibilityResults
      });
    
    console.log(`Completed compatibility analysis for user ${userId}`);
    return compatibilityResults;
  } catch (error) {
    console.error(`Error in calculateMatchesForUser for ${userId}:`, error);
    throw error;
  }
}

/**
 * Calculate compatibility score between two users
 * @param {Object} user1 - First user's data
 * @param {Object} user2 - Second user's data
 * @returns {Object} Compatibility score and breakdown
 */
function calculateCompatibilityScore(user1, user2) {
  try {
    // Get questionnaire answers
    const answers1 = user1.questionnaireAnswers || {};
    const answers2 = user2.questionnaireAnswers || {};
    
    // Initialize score breakdown
    const breakdown = {
      values: 0,
      lifestyle: 0,
      emotional: 0,
      loveLanguage: 0,
      attraction: 0
    };
    
    // SECOND PASS: Check deal-breakers
    // Example: Children preferences
    const childrenPref1 = answers1['values_children'];
    const childrenPref2 = answers2['values_children'];
    
    if (childrenPref1 && childrenPref2) {
      if (
        (childrenPref1 === 'I want children' && childrenPref2 === 'I don\'t want children') ||
        (childrenPref1 === 'I don\'t want children' && childrenPref2 === 'I want children')
      ) {
        return {
          compatible: false,
          overall: 0,
          breakdown,
          reason: 'children_preferences'
        };
      }
    }
    
    // Example: Marriage preferences
    const marriagePref1 = answers1['values_marriage'];
    const marriagePref2 = answers2['values_marriage'];
    
    if (marriagePref1 && marriagePref2) {
      if (
        (marriagePref1 === 'I want to get married' && marriagePref2 === 'I don\'t want to get married') ||
        (marriagePref1 === 'I don\'t want to get married' && marriagePref2 === 'I want to get married')
      ) {
        return {
          compatible: false,
          overall: 0,
          breakdown,
          reason: 'marriage_preferences'
        };
      }
    }
    
    // THIRD PASS: Calculate compatibility scores for each dimension
    
    // Values compatibility (30% weight)
    const valueQuestions = [
      'values_religion', 'values_politics', 'values_family',
      'values_career', 'values_education'
    ];
    
    breakdown.values = calculateDimensionScore(answers1, answers2, valueQuestions);
    
    // Lifestyle compatibility (25% weight)
    const lifestyleQuestions = [
      'lifestyle_activity', 'lifestyle_socializing', 'lifestyle_travel',
      'lifestyle_spending', 'lifestyle_cleanliness'
    ];
    
    breakdown.lifestyle = calculateDimensionScore(answers1, answers2, lifestyleQuestions);
    
    // Emotional compatibility (20% weight)
    const emotionalQuestions = [
      'emotional_communication', 'emotional_conflict', 'emotional_support',
      'emotional_independence', 'emotional_expression'
    ];
    
    breakdown.emotional = calculateDimensionScore(answers1, answers2, emotionalQuestions);
    
    // Love language compatibility (15% weight)
    const loveLanguageQuestions = [
      'love_physical', 'love_gifts', 'love_service',
      'love_quality', 'love_affirmation'
    ];
    
    breakdown.loveLanguage = calculateDimensionScore(answers1, answers2, loveLanguageQuestions);
    
    // Attraction compatibility (10% weight)
    const attractionQuestions = [
      'attraction_physical', 'attraction_intellectual', 'attraction_emotional'
    ];
    
    breakdown.attraction = calculateDimensionScore(answers1, answers2, attractionQuestions);
    
    // Calculate overall score with weighted dimensions
    const overall = (
      breakdown.values * 0.3 +
      breakdown.lifestyle * 0.25 +
      breakdown.emotional * 0.2 +
      breakdown.loveLanguage * 0.15 +
      breakdown.attraction * 0.1
    );
    
    return {
      compatible: true,
      overall: parseFloat(overall.toFixed(2)),
      breakdown: {
        values: parseFloat(breakdown.values.toFixed(2)),
        lifestyle: parseFloat(breakdown.lifestyle.toFixed(2)),
        emotional: parseFloat(breakdown.emotional.toFixed(2)),
        loveLanguage: parseFloat(breakdown.loveLanguage.toFixed(2)),
        attraction: parseFloat(breakdown.attraction.toFixed(2))
      }
    };
  } catch (error) {
    console.error('Error in calculateCompatibilityScore:', error);
    // Return a default score in case of error
    return {
      compatible: true,
      overall: 0.5,
      breakdown: {
        values: 0.5,
        lifestyle: 0.5,
        emotional: 0.5,
        loveLanguage: 0.5,
        attraction: 0.5
      }
    };
  }
}

/**
 * Calculate compatibility score for a specific dimension
 * @param {Object} answers1 - First user's answers
 * @param {Object} answers2 - Second user's answers
 * @param {Array} questions - List of question keys to compare
 * @returns {number} Dimension score between 0 and 1
 */
function calculateDimensionScore(answers1, answers2, questions) {
  let totalQuestions = 0;
  let matchingAnswers = 0;
  
  for (const question of questions) {
    const answer1 = answers1[question];
    const answer2 = answers2[question];
    
    // Skip if either user didn't answer this question
    if (!answer1 || !answer2) continue;
    
    totalQuestions++;
    
    // Simple exact match for now
    if (answer1 === answer2) {
      matchingAnswers++;
    } else {
      // Partial match based on answer similarity
      // This is a simplified example - in a real app, you'd have a more sophisticated
      // algorithm to determine how similar different answers are
      matchingAnswers += 0.5;
    }
  }
  
  // Return score between 0 and 1, defaulting to 0.5 if no questions were answered
  return totalQuestions > 0 ? matchingAnswers / totalQuestions : 0.5;
}
