import { MatchingPoint } from '@/lib/types/matchmaking';

interface Member {
  id: string;
  firstName: string;
  lastName: string;
  questionnaireAnswers?: Record<string, any>;
  [key: string]: any;
}

interface CompatibilityExplanationResponse {
  explanation: string;
}

/**
 * Generates a personalized compatibility explanation for a match using OpenAI
 * @param member1 First member in the match
 * @param member2 Second member in the match
 * @param matchingPoints Array of matching points with scores
 * @param compatibilityScore Overall compatibility score
 * @returns A personalized explanation of why the match is compatible
 */
export async function generateCompatibilityExplanation(
  member1: Member,
  member2: Member,
  matchingPoints: MatchingPoint[],
  compatibilityScore: number
): Promise<string> {
  try {
    console.log(`Generating compatibility explanation for match between ${member1.firstName} and ${member2.firstName}`);
    
    // Extract relevant profile information
    const member1Data = extractProfileData(member1);
    const member2Data = extractProfileData(member2);
    
    // Format matching points for the prompt
    const formattedMatchingPoints = matchingPoints.map(point => 
      `${point.category}: ${point.score * 100}% - ${point.description}`
    ).join('\n');
    
    // Create the prompt for OpenAI
    const prompt = createCompatibilityPrompt(
      member1Data,
      member2Data,
      formattedMatchingPoints,
      compatibilityScore
    );
    
    // Call OpenAI API
    const response = await callOpenAI(prompt);
    
    console.log('Generated compatibility explanation:', response.explanation);
    return response.explanation;
  } catch (error) {
    console.error('Error generating compatibility explanation:', error);
    // Provide a fallback explanation if the API call fails
    return `${member1.firstName} and ${member2.firstName} have a ${compatibilityScore}% compatibility match based on their profiles. They appear to have complementary personalities and shared interests that could make for a great connection.`;
  }
}

/**
 * Extract relevant profile data for compatibility explanation
 */
function extractProfileData(member: Member): Record<string, any> {
  const { questionnaireAnswers = {} } = member;
  
  return {
    firstName: member.firstName,
    age: calculateAge(member),
    profession: questionnaireAnswers?.lifestyle_profession || 'Not specified',
    hobbies: questionnaireAnswers?.lifestyle_hobbiesTypes || [],
    values: questionnaireAnswers?.values_important || [],
    smoking: questionnaireAnswers?.lifestyle_smoking || 'Not specified',
    drinking: questionnaireAnswers?.lifestyle_alcohol || 'Not specified',
    children: member.hasChildren,
    relationshipGoals: questionnaireAnswers?.relationships_lookingFor || 'Not specified',
    communicationStyle: questionnaireAnswers?.communication_style || 'Not specified',
    personalityTraits: questionnaireAnswers?.personality_traits || []
  };
}

/**
 * Calculate age from DOB or use age field
 */
function calculateAge(member: Member): number {
  // Try to calculate age from DOB first
  const dob = member.dob || member.questionnaireAnswers?.personal_dob;
  if (dob) {
    // Parse Australian date format (DD.MM.YYYY)
    const parts = dob.split('.');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed in JS Date
      const year = parseInt(parts[2], 10);
      
      const birthDate = new Date(year, month, day);
      const today = new Date();
      
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      // Adjust age if birthday hasn't occurred yet this year
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      return age;
    }
  }
  
  // Fall back to age field if DOB calculation failed
  return member.questionnaireAnswers?.personal_age || member.age || 0;
}

/**
 * Create a prompt for OpenAI to generate a compatibility explanation
 */
function createCompatibilityPrompt(
  member1: Record<string, any>,
  member2: Record<string, any>,
  matchingPoints: string,
  compatibilityScore: number
): string {
  return `
You are a professional matchmaker assistant for Vettly, a high-end matchmaking service. 
Generate a personalized, warm, and engaging explanation of why two people are compatible for a match.

MATCH DETAILS:
- Person 1: ${member1.firstName}, ${member1.age} years old, ${member1.profession}
- Person 2: ${member2.firstName}, ${member2.age} years old, ${member2.profession}
- Overall Compatibility: ${compatibilityScore}%

PERSON 1 PROFILE:
- Hobbies: ${formatArray(member1.hobbies)}
- Values: ${formatArray(member1.values)}
- Lifestyle: ${member1.smoking} smoker, ${member1.drinking} drinker
- Has Children: ${member1.children ? 'Yes' : 'No'}
- Relationship Goals: ${member1.relationshipGoals}
- Communication Style: ${member1.communicationStyle}
- Personality Traits: ${formatArray(member1.personalityTraits)}

PERSON 2 PROFILE:
- Hobbies: ${formatArray(member2.hobbies)}
- Values: ${formatArray(member2.values)}
- Lifestyle: ${member2.smoking} smoker, ${member2.drinking} drinker
- Has Children: ${member2.children ? 'Yes' : 'No'}
- Relationship Goals: ${member2.relationshipGoals}
- Communication Style: ${member2.communicationStyle}
- Personality Traits: ${formatArray(member2.personalityTraits)}

MATCHING POINTS:
${matchingPoints}

INSTRUCTIONS:
1. Write a warm, personalized explanation (2-3 paragraphs) of why ${member1.firstName} and ${member2.firstName} are compatible
2. Highlight their complementary qualities and shared interests
3. Mention specific matching points from their profiles
4. Keep the tone positive, warm, and encouraging
5. Make it personal by using their names
6. Keep the explanation under 150 words
7. Do not mention the numerical compatibility score
8. Focus on what makes them uniquely compatible

Your response should be in the format:
{
  "explanation": "Your personalized explanation here..."
}
`;
}

/**
 * Format an array for display in the prompt
 */
function formatArray(arr: any[]): string {
  if (!arr || arr.length === 0) return 'Not specified';
  return arr.join(', ');
}

/**
 * Call OpenAI API to generate compatibility explanation
 */
async function callOpenAI(prompt: string): Promise<CompatibilityExplanationResponse> {
  const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OpenAI API key is not defined');
  }
  
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo', // Using the most affordable model
        messages: [
          {
            role: 'system',
            content: 'You are a professional matchmaker assistant that creates personalized compatibility explanations.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 300
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenAI API error: ${JSON.stringify(error)}`);
    }
    
    const data = await response.json();
    const content = data.choices[0].message.content;
    
    try {
      // Try to parse the JSON response
      return JSON.parse(content);
    } catch (e) {
      // If parsing fails, try to extract the explanation using regex
      const match = content.match(/"explanation"\s*:\s*"([^"]*)"/);
      if (match && match[1]) {
        return { explanation: match[1] };
      }
      
      // If all else fails, return the raw content
      return { explanation: content };
    }
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    throw error;
  }
}
