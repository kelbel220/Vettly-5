import { MatchingPoint } from '@/lib/types/matchmaking';

interface Member {
  id: string;
  firstName: string;
  lastName: string;
  questionnaireAnswers?: Record<string, any>;
  [key: string]: any;
}

interface MatchPoint {
  header: string;
  explanation: string;
}

interface CompatibilityExplanationResponse {
  // Legacy field, kept for backward compatibility
  explanation?: string;
  // Gender-specific explanations
  member1Explanation?: MatchPoint[];
  member2Explanation?: MatchPoint[];
}

/**
 * Generates gender-specific compatibility explanations for a match using OpenAI
 * @param member1 First member in the match (male)
 * @param member2 Second member in the match (female)
 * @param matchingPoints Array of matching points with scores
 * @param compatibilityScore Overall compatibility score
 * @returns Object containing gender-specific explanations for each member
 */
export async function generateCompatibilityExplanation(
  member1: Member,
  member2: Member,
  matchingPoints: MatchingPoint[],
  compatibilityScore: number
): Promise<{ member1Explanation: string, member2Explanation: string }> {
  try {
    console.log(`Generating gender-specific explanations for match between ${member1.firstName} and ${member2.firstName}`);
    
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
    
    // Convert the response arrays to JSON strings
    const member1Explanation = JSON.stringify(response.member1Explanation || []);
    const member2Explanation = JSON.stringify(response.member2Explanation || []);
    
    console.log('Generated member1 explanation:', member1Explanation);
    console.log('Generated member2 explanation:', member2Explanation);
    
    return { 
      member1Explanation, 
      member2Explanation 
    };
  } catch (error) {
    console.error('Error generating compatibility explanations:', error);
    // Provide fallback explanations if the API call fails
    const fallbackPoints = [
      {
        header: "Shared Values",
        explanation: `${member1.firstName} and ${member2.firstName} appear to have complementary values that could make for a strong connection.`
      },
      {
        header: "Lifestyle Compatibility",
        explanation: "Your lifestyles seem to align well, suggesting day-to-day compatibility."
      },
      {
        header: "Communication Styles",
        explanation: "Your communication approaches complement each other in ways that could lead to meaningful conversations."
      },
      {
        header: "Mutual Interests",
        explanation: "You share several interests that could provide a foundation for enjoyable time together."
      },
      {
        header: "Relationship Goals",
        explanation: "Your relationship goals appear aligned, suggesting you're looking for similar things."
      }
    ];
    
    return { 
      member1Explanation: JSON.stringify(fallbackPoints),
      member2Explanation: JSON.stringify(fallbackPoints)
    };
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
 * Create a prompt for OpenAI to generate gender-specific compatibility explanations
 */
function createCompatibilityPrompt(
  member1: Record<string, any>,
  member2: Record<string, any>,
  matchingPoints: string,
  compatibilityScore: number
): string {
  return `
You are a professional matchmaker assistant for Vettly, a high-end matchmaking service. 
Generate gender-specific explanations of why two people are compatible for a match.

MATCH DETAILS:
- Person 1 (Male): ${member1.firstName}, ${member1.age} years old, ${member1.profession}
- Person 2 (Female): ${member2.firstName}, ${member2.age} years old, ${member2.profession}
- Overall Compatibility: ${compatibilityScore}%

PERSON 1 PROFILE (MALE):
- Hobbies: ${formatArray(member1.hobbies)}
- Values: ${formatArray(member1.values)}
- Lifestyle: ${member1.smoking} smoker, ${member1.drinking} drinker
- Has Children: ${member1.children ? 'Yes' : 'No'}
- Relationship Goals: ${member1.relationshipGoals}
- Communication Style: ${member1.communicationStyle}
- Personality Traits: ${formatArray(member1.personalityTraits)}

PERSON 2 PROFILE (FEMALE):
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
You will generate TWO separate explanations - one tailored for the male and one for the female.
For each explanation:
1. Generate exactly 5 distinct points about why they are compatible
2. Each point must have a concise, specific header (2-5 words) followed by a brief explanation (1-2 sentences)
3. Focus on values, lifestyle compatibility, and specific questionnaire answers that make them a good match
4. Be warm and professional but not overly flowery or fuzzy
5. Make it personal by using their names
6. Be specific about what makes them uniquely compatible
7. Do not mention the numerical compatibility score
8. For the male explanation, emphasize aspects that would appeal more to him
9. For the female explanation, emphasize aspects that would appeal more to her

Your response should be in the format:
{
  "member1Explanation": [
    {
      "header": "Short, specific header for point 1",
      "explanation": "Brief explanation of point 1 tailored for ${member1.firstName}"
    },
    {
      "header": "Short, specific header for point 2",
      "explanation": "Brief explanation of point 2 tailored for ${member1.firstName}"
    },
    {
      "header": "Short, specific header for point 3",
      "explanation": "Brief explanation of point 3 tailored for ${member1.firstName}"
    },
    {
      "header": "Short, specific header for point 4",
      "explanation": "Brief explanation of point 4 tailored for ${member1.firstName}"
    },
    {
      "header": "Short, specific header for point 5",
      "explanation": "Brief explanation of point 5 tailored for ${member1.firstName}"
    }
  ],
  "member2Explanation": [
    {
      "header": "Short, specific header for point 1",
      "explanation": "Brief explanation of point 1 tailored for ${member2.firstName}"
    },
    {
      "header": "Short, specific header for point 2",
      "explanation": "Brief explanation of point 2 tailored for ${member2.firstName}"
    },
    {
      "header": "Short, specific header for point 3",
      "explanation": "Brief explanation of point 3 tailored for ${member2.firstName}"
    },
    {
      "header": "Short, specific header for point 4",
      "explanation": "Brief explanation of point 4 tailored for ${member2.firstName}"
    },
    {
      "header": "Short, specific header for point 5",
      "explanation": "Brief explanation of point 5 tailored for ${member2.firstName}"
    }
  ]
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
