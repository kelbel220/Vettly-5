/**
 * Scheduled Jobs for Vettly
 * Contains all scheduled cloud functions that run on a timer
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const fetch = require('node-fetch');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const OPENAI_MODEL = 'gpt-4-turbo';

// Weekly Tip Status and Category enums
const WeeklyTipStatus = {
  PENDING: 'pending',
  APPROVED: 'approved',
  ACTIVE: 'active',
  ARCHIVED: 'archived',
  REJECTED: 'rejected'
};

const WeeklyTipCategory = {
  PROFILE_IMPROVEMENT: 'profile_improvement',
  CONVERSATION_STARTERS: 'conversation_starters',
  DATE_IDEAS: 'date_ideas',
  RELATIONSHIP_ADVICE: 'relationship_advice',
  MATCHMAKING_INSIGHTS: 'matchmaking_insights',
  SELF_IMPROVEMENT: 'self_improvement'
};

/**
 * Scheduled job that runs every Monday at 1 AM to generate a new weekly tip
 */
exports.generateWeeklyTip = functions.pubsub
  .schedule('0 1 * * 1') // Every Monday at 1 AM
  .timeZone('Australia/Sydney') // Adjust to your preferred timezone
  .onRun(async (context) => {
    try {
      console.log('Starting weekly tip generation job');
      
      // Get a random category for this week's tip
      const category = getRandomCategory();
      
      // Generate the tip using OpenAI
      const generatedTip = await generateWeeklyTip(category);
      
      // Save the tip to Firestore
      await saveTipToFirestore(generatedTip);
      
      console.log('Successfully generated and saved weekly tip');
      return null;
    } catch (error) {
      console.error('Error in generateWeeklyTip scheduled job:', error);
      return null;
    }
  });

/**
 * Generates a weekly dating tip using OpenAI
 */
async function generateWeeklyTip(category) {
  try {
    // Create the prompt for OpenAI
    const prompt = createPromptForCategory(category);
    
    // Call OpenAI API
    const response = await callOpenAI(prompt);
    
    // Parse the response
    return parseOpenAIResponse(response, category);
  } catch (error) {
    console.error('Error generating weekly tip:', error);
    throw error;
  }
}

/**
 * Creates a structured prompt for OpenAI based on the tip category
 */
function createPromptForCategory(category) {
  const basePrompt = `Generate a weekly dating tip for users of a dating app. 
The tip should be structured with the following sections:
1. Title - A catchy, engaging title for the tip
2. Short Description - A brief 1-2 sentence summary of the tip
3. Main Content - Detailed explanation of the tip (2-3 paragraphs)
4. Why This Matters - Explain why this advice is important (1 paragraph)
5. Quick Tips - 5 actionable bullet points related to the main tip
6. Did You Know - An interesting fact or statistic related to dating
7. Weekly Challenge - A simple action users can take this week

The tip should be in the category: ${getCategoryDisplayName(category)}.`;

  // Add category-specific instructions
  switch (category) {
    case WeeklyTipCategory.PROFILE_IMPROVEMENT:
      return `${basePrompt}
Focus on helping users improve their dating profiles with practical advice about photos, bio writing, and showcasing their personality effectively.`;
      
    case WeeklyTipCategory.CONVERSATION_STARTERS:
      return `${basePrompt}
Focus on helping users start and maintain engaging conversations, including example questions, topics to discuss, and how to keep a conversation flowing naturally.`;
      
    case WeeklyTipCategory.DATE_IDEAS:
      return `${basePrompt}
Focus on creative and memorable date ideas for different stages of dating, considering various interests, budgets, and settings (virtual, outdoor, indoor).`;
      
    case WeeklyTipCategory.RELATIONSHIP_ADVICE:
      return `${basePrompt}
Focus on building healthy relationships, communication skills, understanding attachment styles, or navigating common relationship challenges.`;
      
    case WeeklyTipCategory.MATCHMAKING_INSIGHTS:
      return `${basePrompt}
Focus on how the matchmaking process works, what makes compatible matches, and how users can improve their chances of finding meaningful connections.`;
      
    case WeeklyTipCategory.SELF_IMPROVEMENT:
      return `${basePrompt}
Focus on personal growth topics that make someone a better partner, such as emotional intelligence, active listening, or building confidence.`;
      
    default:
      return basePrompt;
  }
}

/**
 * Calls the OpenAI API with the given prompt
 */
async function callOpenAI(prompt) {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OpenAI API key is missing. Please check your environment variables.');
  }
  
  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are an expert dating coach and relationship advisor. Provide helpful, positive, and inclusive dating advice.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error calling OpenAI:', error);
    throw error;
  }
}

/**
 * Parses the OpenAI response into a structured tip object
 */
function parseOpenAIResponse(response, category) {
  try {
    // Extract the generated text from the response
    const generatedText = response.choices[0].message.content;
    
    // Use regex to extract the different sections
    const titleMatch = generatedText.match(/Title[:\-]\s*(.*?)(?:\n|$)/i);
    const shortDescMatch = generatedText.match(/Short Description[:\-]\s*(.*?)(?:\n\n|\n\d|$)/is);
    const mainContentMatch = generatedText.match(/Main Content[:\-]\s*(.*?)(?:Why This Matters|\d\.|$)/is);
    const whyMattersMatch = generatedText.match(/Why This Matters[:\-]\s*(.*?)(?:Quick Tips|\d\.|$)/is);
    const quickTipsMatch = generatedText.match(/Quick Tips[:\-]\s*(.*?)(?:Did You Know|\d\.|$)/is);
    const didYouKnowMatch = generatedText.match(/Did You Know[:\-]\s*(.*?)(?:Weekly Challenge|\d\.|$)/is);
    const challengeMatch = generatedText.match(/Weekly Challenge[:\-]\s*(.*?)(?:\n\n|\n\d|$)/is);
    
    // Extract quick tips as an array
    let quickTips = [];
    if (quickTipsMatch && quickTipsMatch[1]) {
      // Look for bullet points or numbered list items
      const tipsText = quickTipsMatch[1].trim();
      const bulletMatches = tipsText.match(/(?:^|\n)(?:[-•*]|\d+\.)\s*(.*?)(?=(?:\n(?:[-•*]|\d+\.)|$))/g);
      
      if (bulletMatches) {
        quickTips = bulletMatches.map(tip => 
          tip.replace(/^(?:\n)?(?:[-•*]|\d+\.)\s*/, '').trim()
        );
      } else {
        // Fallback: split by newlines if no bullet points found
        quickTips = tipsText.split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0);
      }
    }
    
    // Create the weekly tip object
    return {
      title: titleMatch ? titleMatch[1].trim() : 'Weekly Dating Tip',
      shortDescription: shortDescMatch ? shortDescMatch[1].trim() : '',
      content: mainContentMatch ? mainContentMatch[1].trim() : '',
      category,
      status: WeeklyTipStatus.PENDING,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      aiGenerated: true,
      quickTips: quickTips.slice(0, 5), // Limit to 5 tips
      didYouKnow: didYouKnowMatch ? didYouKnowMatch[1].trim() : '',
      weeklyChallenge: challengeMatch ? challengeMatch[1].trim() : '',
      viewCount: 0,
      uniqueViewCount: 0
    };
  } catch (error) {
    console.error('Error parsing OpenAI response:', error);
    
    // Return a fallback tip if parsing fails
    return {
      title: 'Weekly Dating Tip',
      shortDescription: 'A helpful tip to improve your dating experience.',
      content: 'We had some trouble generating a custom tip this week. Please check back next week for a new tip!',
      category,
      status: WeeklyTipStatus.PENDING,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      aiGenerated: true,
      quickTips: ['Be authentic', 'Use recent photos', 'Ask open-ended questions', 'Listen actively', 'Be respectful'],
      viewCount: 0,
      uniqueViewCount: 0
    };
  }
}

/**
 * Saves the generated tip to Firestore
 */
async function saveTipToFirestore(tipData) {
  try {
    const tipsCollection = db.collection('weeklyTips');
    const docRef = await tipsCollection.add(tipData);
    console.log(`Tip saved with ID: ${docRef.id}`);
    return docRef.id;
  } catch (error) {
    console.error('Error saving tip to Firestore:', error);
    throw error;
  }
}

/**
 * Gets a random tip category
 */
function getRandomCategory() {
  const categories = Object.values(WeeklyTipCategory);
  const randomIndex = Math.floor(Math.random() * categories.length);
  return categories[randomIndex];
}

/**
 * Converts a category enum value to a display name
 */
function getCategoryDisplayName(category) {
  switch (category) {
    case WeeklyTipCategory.PROFILE_IMPROVEMENT:
      return 'Profile Improvement';
    case WeeklyTipCategory.CONVERSATION_STARTERS:
      return 'Conversation Starters';
    case WeeklyTipCategory.DATE_IDEAS:
      return 'Date Ideas';
    case WeeklyTipCategory.RELATIONSHIP_ADVICE:
      return 'Relationship Advice';
    case WeeklyTipCategory.MATCHMAKING_INSIGHTS:
      return 'Matchmaking Insights';
    case WeeklyTipCategory.SELF_IMPROVEMENT:
      return 'Self Improvement';
    default:
      return 'Dating Tips';
  }
}
