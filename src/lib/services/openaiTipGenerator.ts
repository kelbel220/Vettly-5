/**
 * OpenAI Tip Generator Service
 * Handles the integration with OpenAI for generating weekly dating tips
 */

import { WeeklyTip, WeeklyTipStatus, WeeklyTipCategory, createWeeklyTip } from '../models/weeklyTip';

// OpenAI API configuration
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const OPENAI_MODEL = 'gpt-4-turbo'; // Using the latest model

/**
 * Generates a weekly dating tip using OpenAI
 */
export async function generateWeeklyTip(category?: WeeklyTipCategory): Promise<WeeklyTip> {
  try {
    // Use a random category if none provided
    const tipCategory = category || getRandomCategory();
    
    // Create the prompt for OpenAI
    const prompt = createPromptForCategory(tipCategory);
    
    // Call OpenAI API
    const response = await callOpenAI(prompt);
    
    // Parse the response
    const parsedTip = parseOpenAIResponse(response, tipCategory);
    
    return parsedTip;
  } catch (error) {
    console.error('Error generating weekly tip:', error);
    throw new Error('Failed to generate weekly tip. Please try again later.');
  }
}

/**
 * Creates a structured prompt for OpenAI based on the tip category
 */
export function createPromptForCategory(category: WeeklyTipCategory): string {
  const basePrompt = `Generate a weekly dating tip for users of a matchmaking service. 
The tip should be structured with the following sections:
1. Title: A catchy, engaging title for the tip
2. Short Description: A brief 1-2 sentence summary of the tip
3. Main Content: Detailed explanation of the tip (2-3 paragraphs)
4. Why This Matters: Explain why this advice is important (1 paragraph)
5. Quick Tips: 5 actionable bullet points related to the main tip
6. Did You Know: An interesting fact or statistic related to dating
7. Weekly Challenge: A simple action users can take this week

IMPORTANT GUIDELINES:
- ABSOLUTELY DO NOT USE ANY TYPE OF DASHES in your content: no hyphens (-), no en dashes (–), no em dashes (—)
- Instead of dashes, use periods, commas, or parentheses to separate thoughts
- Use clear, direct language without flowery or overly poetic expressions
- Write for single users looking to find a match, not for people who already have partners
- Focus on practical advice for in-person dates arranged by matchmakers (users don't chat on the app)
- Tips should focus on preparing for and succeeding on in-person dates, not online interactions
- Remember that users don't choose their matches; professional matchmakers select compatible partners for them

The tip should be in the category: ${getCategoryDisplayName(category)}.`;

  // Add category-specific instructions
  switch (category) {
      
    case WeeklyTipCategory.CONVERSATION_STARTERS:
      return `${basePrompt}
Focus on helping users start and maintain engaging in-person conversations during their first date, including example questions, topics to discuss, and how to keep a conversation flowing naturally when meeting someone selected by a matchmaker.`;
      
    case WeeklyTipCategory.DATE_IDEAS:
      return `${basePrompt}
Focus on creative and memorable date ideas for different stages of dating, considering various interests, budgets, and settings (virtual, outdoor, indoor).`;
      
    case WeeklyTipCategory.RELATIONSHIP_ADVICE:
      return `${basePrompt}
Focus on building healthy relationships, communication skills, understanding attachment styles, or navigating common relationship challenges.`;
      
    case WeeklyTipCategory.MATCHMAKING_INSIGHTS:
      return `${basePrompt}
Focus on how the professional matchmaking process works, what makes compatible matches, how matchmakers select partners, and how users can make the most of their matchmaker-arranged dates.`;
      
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
async function callOpenAI(prompt: string): Promise<any> {
  const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
  
  if (!apiKey) {
    console.error('OpenAI API key is missing');
    throw new Error('OpenAI API key is missing. Please add NEXT_PUBLIC_OPENAI_API_KEY to your .env.local file and restart the server.');
  }
  
  // Log that we're using the API key (without showing the actual key)
  console.log('Using OpenAI API key:', apiKey.substring(0, 3) + '...' + apiKey.substring(apiKey.length - 4));
  
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
            content: 'You are an expert dating coach and relationship advisor for single people using a professional matchmaking service. Provide helpful, positive, and inclusive dating advice for people who are matched by professional matchmakers and meet directly in person (they do not chat on the app first). Focus on preparing for and succeeding on in-person dates. Use clear, direct language without flowery expressions. IMPORTANT: Do not use any type of dashes in your writing. No hyphens, no en dashes, no em dashes. Use periods, commas, or parentheses instead.'
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
 * Parses the OpenAI response into a structured WeeklyTip object
 */
export function parseOpenAIResponse(response: any, category: WeeklyTipCategory): WeeklyTip {
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
    let quickTips: string[] = [];
    if (quickTipsMatch && quickTipsMatch[1]) {
      // Look for bullet points or numbered list items
      const tipsText = quickTipsMatch[1].trim();
      const bulletMatches = tipsText.match(/(?:^|\n)(?:[-•*]|\d+\.)\s*(.*?)(?=(?:\n(?:[-•*]|\d+\.)|$))/g);
      
      if (bulletMatches) {
        quickTips = bulletMatches.map((tip: string) => 
          tip.replace(/^(?:\n)?(?:[-•*]|\d+\.)\s*/, '').trim()
        );
      } else {
        // Fallback: split by newlines if no bullet points found
        quickTips = tipsText.split('\n')
          .map((line: string) => line.trim())
          .filter((line: string) => line.length > 0);
      }
    }
    
    // Create the weekly tip object
    const weeklyTip = createWeeklyTip({
      title: titleMatch ? titleMatch[1].trim() : 'Weekly Dating Tip',
      shortDescription: shortDescMatch ? shortDescMatch[1].trim() : '',
      content: mainContentMatch ? mainContentMatch[1].trim() : '',
      category,
      status: WeeklyTipStatus.PENDING,
      aiGenerated: true,
      quickTips: quickTips.slice(0, 5), // Limit to 5 tips
      didYouKnow: didYouKnowMatch ? didYouKnowMatch[1].trim() : '',
      weeklyChallenge: challengeMatch ? challengeMatch[1].trim() : '',
      whyMatters: whyMattersMatch ? whyMattersMatch[1].trim() : ''
    });
    
    return weeklyTip;
  } catch (error) {
    console.error('Error parsing OpenAI response:', error);
    
    // Return a fallback tip if parsing fails
    return createWeeklyTip({
      title: 'Weekly Dating Tip',
      shortDescription: 'A helpful tip to improve your dating experience.',
      content: 'We had some trouble generating a custom tip this week. Please check back next week for a new tip!',
      category,
      status: WeeklyTipStatus.PENDING,
      aiGenerated: true,
      quickTips: ['Be authentic', 'Use recent photos', 'Ask open-ended questions', 'Listen actively', 'Be respectful']
    });
  }
}

/**
 * Gets a random tip category
 */
function getRandomCategory(): WeeklyTipCategory {
  const categories = Object.values(WeeklyTipCategory);
  const randomIndex = Math.floor(Math.random() * categories.length);
  return categories[randomIndex] as WeeklyTipCategory;
}

/**
 * Converts a category enum value to a display name
 */
function getCategoryDisplayName(category: WeeklyTipCategory): string {
  switch (category) {
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
