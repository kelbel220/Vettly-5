/**
 * OpenAI Tip Generator Service
 * Handles the integration with OpenAI for generating weekly dating tips
 */

import { WeeklyTip, WeeklyTipStatus, WeeklyTipCategory, createWeeklyTip } from '../models/weeklyTip';

// OpenAI API configuration
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const OPENAI_MODEL = 'gpt-4-turbo'; // Using the latest model

/**
 * Interface for article source data
 */
export interface ArticleSource {
  content: string;
  url?: string;
  title?: string;
}

/**
 * Fetches content from a URL
 * @param url The URL to fetch content from
 * @returns The extracted content from the URL
 */
async function fetchUrlContent(url: string): Promise<string> {
  try {
    console.log(`Attempting to fetch content from URL: ${url}`);
    
    // Basic validation
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      throw new Error('Invalid URL format');
    }
    
    // Fetch the content
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
    }
    
    // Get the text content
    const html = await response.text();
    
    // Very basic HTML content extraction
    // This is a simple approach - in production, you might want to use a proper HTML parser
    let content = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove scripts
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')    // Remove styles
      .replace(/<[^>]+>/g, ' ')                                             // Remove HTML tags
      .replace(/\s+/g, ' ')                                                 // Normalize whitespace
      .trim();
    
    // Limit content length to avoid token issues with OpenAI
    if (content.length > 5000) {
      content = content.substring(0, 5000) + '... [content truncated]';
    }
    
    console.log(`Successfully fetched content from URL (${content.length} chars)`);
    return content;
  } catch (error: any) {
    console.error('Error fetching URL content:', error);
    const errorMessage = error?.message || 'Unknown error';
    return `Failed to fetch content from URL: ${errorMessage}`;
  }
}

/**
 * Generates a weekly dating tip using OpenAI
 * @param category Optional category for the tip
 * @param articleSource Optional article to use as source material
 */
export async function generateWeeklyTip(category?: WeeklyTipCategory, articleSource?: ArticleSource): Promise<WeeklyTip> {
  try {
    // Use a random category if none provided
    const tipCategory = category || getRandomCategory();
    
    // If we have a URL but no content, try to fetch the content
    if (articleSource?.url && !articleSource.content) {
      try {
        console.log('URL provided without content, attempting to fetch content...');
        const fetchedContent = await fetchUrlContent(articleSource.url);
        
        if (fetchedContent && !fetchedContent.startsWith('Failed to fetch')) {
          console.log('Successfully fetched content from URL');
          articleSource.content = fetchedContent;
        } else {
          console.log('Failed to fetch content from URL, proceeding with URL-only approach');
        }
      } catch (fetchError) {
        console.error('Error fetching URL content:', fetchError);
        // Continue with the URL-only approach if fetching fails
      }
    }
    
    // Create the prompt for OpenAI
    const prompt = createPromptForCategory(tipCategory, articleSource);
    
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
 * Creates a structured prompt for OpenAI based on the tip category and optional article source
 * @param category The category for the tip
 * @param articleSource Optional article to use as source material
 */
export function createPromptForCategory(category: WeeklyTipCategory, articleSource?: ArticleSource): string {
  // Create a single master prompt that works for all scenarios
  let masterPrompt = `Generate a weekly educational tip about relationships and dating. 

The tip should be structured with the following sections:
1. Title: A catchy, engaging title for the tip
2. Short Description: A brief 1-2 sentence summary of the tip
3. Main Content: Detailed explanation of the tip (2-3 paragraphs)
4. Why This Matters: Explain why this advice is important (1 paragraph)
5. Quick Tips: EXACTLY 5 actionable bullet points related to the main tip. Format each tip with a bullet point (•) at the start of a new line. Keep each tip concise (10-15 words). Example format:
   • First quick tip here
   • Second quick tip here
   • Third quick tip here
   • Fourth quick tip here
   • Fifth quick tip here
6. Did You Know: An interesting fact or statistic related to dating
7. Weekly Challenge: A simple action users can take this week

TARGET AUDIENCE:
- Educated professionals with advanced understanding of relationships
- Skip basic concepts they would already know
- Focus on evidence-based, scientifically-grounded content
- Provide sophisticated insights that go beyond common dating advice
- This is educational content, NOT promotional material for any service

IMPORTANT GUIDELINES:
- ABSOLUTELY DO NOT USE ANY TYPE OF DASHES in your content: no hyphens (-), no en dashes (–), no em dashes (—)
- DO NOT USE MARKDOWN FORMATTING like ### or ## between sections
- DO NOT include section separators like '###' or '---' in your content
- DO NOT mention matchmaking services or matchmakers anywhere in your content
- DO NOT use phrases like "When you meet someone through a matchmaking service" or similar
- DO NOT refer to how people are matched or how they meet their dates
- Instead of dashes, use periods, commas, or parentheses to separate thoughts
- Write like a human. Keep it professional but conversational
- Use Australian spelling (e.g., 'colour' not 'color', 'organisation' not 'organization')
- Use clear, direct language without flowery or overly poetic expressions
- Base your tips on relevant scientific research and evidence where possible
- Include references to psychology, relationship science, or behavioral studies when applicable
- Focus on practical advice for in-person dating and relationship development
- Provide advanced, nuanced perspectives on interpersonal dynamics

AVOID THESE WORDS AND PHRASES (they sound too much like AI writing):
embarked, delved, invaluable, relentless, groundbreaking, endeavour, enlightening, insights, esteemed, shed light, deep understanding, crucial, delving, elevate, resonate, enhance, expertise, offerings, valuable, leverage, intricate, tapestry, foster, systemic, inherent, treasure trove, testament, peril, landscape, delve, pertinent, synergy, explore, underscores, empower, unleash, unlock, elevate, intricate, folks, pivotal, adhere, amplify, cognizant, conceptualize, emphasize, complexity, recognize, adapt, promote, critique, comprehensive, implications, complementary, perspectives, holistic, discern, multifaceted, nuanced, underpinnings, cultivate, integral, profound, facilitate, encompass, elucidate, unravel, paramount, characterized, significant, streamlined, buzzwords, furthermore, tailor, nurture, journey, navigate

The tip should be in the category: ${getCategoryDisplayName(category)}.`;
  
  // Add source material information if available
  if (articleSource) {
    masterPrompt += '\n\nSOURCE MATERIAL:\n';
    
    // Add title if available
    if (articleSource.title) {
      masterPrompt += `TITLE: ${articleSource.title}\n`;
    }
    
    // Add URL if available
    if (articleSource.url) {
      masterPrompt += `SOURCE URL: ${articleSource.url}\n`;
      masterPrompt += `NOTE: You don't have direct access to browse this URL. Use the URL, title, and any provided content to create your tip.\n`;
    }
    
    // Add content if available
    if (articleSource.content) {
      masterPrompt += `\nCONTENT:\n${articleSource.content}\n`;
    }
    
    // Add unified instructions for handling the source material
    masterPrompt += `\nSOURCE MATERIAL INSTRUCTIONS:\n`;
    masterPrompt += `- Extract advanced insights and sophisticated concepts from the source material\n`;
    masterPrompt += `- Transform this information into a high-quality educational tip for educated professionals\n`;
    masterPrompt += `- Focus on scientific findings, research, and evidence-based approaches\n`;
    masterPrompt += `- Highlight any psychology, relationship science, or behavioral studies mentioned\n`;
    masterPrompt += `- Go beyond basic relationship advice to provide nuanced perspectives\n`;
    masterPrompt += `- Skip elementary concepts that educated professionals would already know\n`;
    masterPrompt += `- Do not directly copy large portions of text from the source material\n`;
    masterPrompt += `- If the source material doesn't have enough relevant content, supplement with advanced, science-based relationship principles\n`;
  }
  
  // Add category-specific focus to the prompt
  switch (category) {
    case WeeklyTipCategory.CONVERSATION_STARTERS:
      masterPrompt += `\n\nCATEGORY FOCUS:\nFocus on helping users start and maintain engaging in-person conversations during dates, including example questions, topics to discuss, and how to keep a conversation flowing naturally.`;
      break;
      
    case WeeklyTipCategory.DATE_IDEAS:
      masterPrompt += `\n\nCATEGORY FOCUS:\nFocus on creative and memorable date ideas for different stages of dating, considering various interests, budgets, and settings (virtual, outdoor, indoor).`;
      break;
      
    case WeeklyTipCategory.RELATIONSHIP_ADVICE:
      masterPrompt += `\n\nCATEGORY FOCUS:\nFocus on building healthy relationships, communication skills, understanding attachment styles, or navigating common relationship challenges.`;
      break;
      
    case WeeklyTipCategory.MATCHMAKING_INSIGHTS:
      masterPrompt += `\n\nCATEGORY FOCUS:\nFocus on what makes compatible relationships, psychological compatibility factors, and how people can make the most of their dates.`;
      break;
      
    case WeeklyTipCategory.SELF_IMPROVEMENT:
      masterPrompt += `\n\nCATEGORY FOCUS:\nFocus on personal growth topics that make someone a better partner, such as emotional intelligence, active listening, or building confidence.`;
      break;
  }
  
  return masterPrompt;
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
      
      // First try to match bullet points or numbered list items
      const bulletMatches = tipsText.match(/(?:^|\n)(?:[-•*]|\d+\.)\s*(.*?)(?=(?:\n(?:[-•*]|\d+\.)|$))/gs);
      
      if (bulletMatches && bulletMatches.length > 0) {
        console.log('Found bullet matches:', bulletMatches);
        quickTips = bulletMatches.map((tip: string) => 
          tip.replace(/^(?:\n)?(?:[-•*]|\d+\.)\s*/, '').trim()
        );
      } else {
        // Fallback: split by newlines if no bullet points found
        console.log('No bullet matches found, splitting by newlines');
        quickTips = tipsText.split('\n')
          .map((line: string) => line.trim())
          .filter((line: string) => line.length > 0);
      }
      
      // Log the extracted quick tips
      console.log('Extracted quick tips:', quickTips);
      
      // If we still don't have any quick tips, try a more aggressive approach
      if (quickTips.length === 0) {
        console.log('No quick tips found with standard methods, trying alternative parsing');
        // Try to extract anything that looks like a tip
        const alternativeTips = tipsText.split(/(?:\.|\n)\s*/).filter((tip: string) => 
          tip.trim().length > 10 && tip.trim().length < 200
        );
        if (alternativeTips.length > 0) {
          quickTips = alternativeTips.map((tip: string) => tip.trim());
          console.log('Alternative parsing found tips:', quickTips);
        }
      }
    }
    
    // Helper function to clean up text content
    const cleanContent = (text: string): string => {
      if (!text) return '';
      // Remove markdown separators (###)
      return text.replace(/\s*#{1,4}\s*(?=\n|$)/g, '').trim();
    };
    
    // Clean up quick tips
    quickTips = quickTips.map(tip => cleanContent(tip));
    
    // Create the weekly tip object
    const weeklyTip = createWeeklyTip({
      title: titleMatch ? cleanContent(titleMatch[1]) : 'Weekly Dating Tip',
      shortDescription: shortDescMatch ? cleanContent(shortDescMatch[1]) : '',
      content: mainContentMatch ? cleanContent(mainContentMatch[1]) : '',
      category,
      status: WeeklyTipStatus.PENDING,
      aiGenerated: true,
      quickTips: quickTips.slice(0, 5), // Limit to 5 tips
      didYouKnow: didYouKnowMatch ? cleanContent(didYouKnowMatch[1]) : '',
      weeklyChallenge: challengeMatch ? cleanContent(challengeMatch[1]) : '',
      whyMatters: whyMattersMatch ? cleanContent(whyMattersMatch[1]) : ''
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
