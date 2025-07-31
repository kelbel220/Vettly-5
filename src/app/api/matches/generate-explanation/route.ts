import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { db } from '@/lib/firebase-init';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { logExplanationGeneration, logExplanationError } from '@/lib/monitoring/explanationMonitoring';

// Define types for match explanation points
type MatchPoint = {
  header: string;
  explanation: string;
};

// OpenAI API configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';

/**
 * API route to generate personalized match explanations using OpenAI
 * This is triggered when a match is sent from Vettly CRM to Vettly-2
 */
export async function POST(request: Request) {
  // Define matchId at the top level so it's available in catch blocks
  let matchId: string = 'unknown';
  let member1Id: string = '';
  let member2Id: string = '';
  
  try {
    console.log('Explanation generation request received');
    // Get match data from request body
    const requestData = await request.json();
    matchId = requestData.matchId;
    member1Id = requestData.member1Id; // Male ID
    member2Id = requestData.member2Id; // Female ID
    
    console.log('Received request with IDs:', { matchId, member1Id, member2Id });
    
    if (!matchId || !member1Id || !member2Id) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }
    
    // Verify API key is available
    if (!OPENAI_API_KEY) {
      console.log('No OpenAI API key found, returning error');
      return NextResponse.json({ 
        error: 'OpenAI API key is required but not configured',
        details: 'Please set the OPENAI_API_KEY environment variable with a valid API key'
      }, { status: 400 });
    }
    
    // Fetch user data for both members
    try {
      const startTime = Date.now();
      
      const [member1Doc, member2Doc] = await Promise.all([
        getDoc(doc(db, 'users', member1Id)),
        getDoc(doc(db, 'users', member2Id))
      ]);
      
      if (!member1Doc.exists() || !member2Doc.exists()) {
        const missingMemberId = !member1Doc.exists() ? member1Id : member2Id;
        await logExplanationError(
          matchId,
          'data_missing',
          `Member ${missingMemberId} not found in database`,
          404
        );
        
        return NextResponse.json({ 
          error: 'One or both members not found',
          details: `Member ${missingMemberId} not found in database`
        }, { status: 404 });
      }
      
      const member1Data = member1Doc.data();
      const member2Data = member2Doc.data();
      
      // Check for minimum required data
      const dataQualityScore = calculateDataQualityScore(member1Data, member2Data);
      console.log(`Data quality score: ${dataQualityScore}`);
      
      if (dataQualityScore < 40) {
        await logExplanationError(
          matchId,
          'low_data_quality',
          `Insufficient questionnaire data. Score: ${dataQualityScore}`,
          400
        );
        
        return NextResponse.json({ 
          error: 'Insufficient questionnaire data',
          details: 'Both members need to complete more of their questionnaires for a personalized explanation'
        }, { status: 400 });
      }
      
      // Format the questionnaire data for both members
      const member1FormattedData = formatUserDataForPrompt(member1Data);
      const member2FormattedData = formatUserDataForPrompt(member2Data);
      
      // Create the prompt for OpenAI
      const prompt = createGenderSpecificExplanationPrompt(member1FormattedData, member2FormattedData);
      
      console.log('Calling OpenAI API to generate gender-specific match explanations...');
      
      // Prepare the messages for the API call
      const messages = [
        {
          role: 'system' as const,
          content: 'You are an expert matchmaker with years of experience helping people find meaningful relationships. You create personalized, gender-specific explanations of why two people would be a great match based on their profiles and questionnaire answers.'
        },
        {
          role: 'user' as const,
          content: prompt
        }
      ];
      
      const requestBody = {
        model: 'gpt-4-turbo',
        messages: messages,
        max_tokens: 500,
        temperature: 0.7
      };
      
      // Use the standard OpenAI API endpoint
      const apiUrl = 'https://api.openai.com/v1/chat/completions';
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        let errorDetails = 'No error details available';
        try {
          const errorData = await response.text();
          errorDetails = errorData;
        } catch (parseError) {
          console.error('Could not parse error response:', parseError);
        }
        
        console.error('OpenAI API error response:', response.status);
        
        await logExplanationError(
          matchId,
          'openai_api_error',
          errorDetails,
          response.status
        );
        
        return NextResponse.json({ error: `API error: ${response.status}`, details: errorDetails }, { status: 500 });
      }
      
      const responseData = await response.json();
      console.log('OpenAI API response received successfully');
      const contentText = responseData.choices[0].message.content;
      
      // Calculate tokens used and generation time
      const tokensUsed = responseData.usage?.total_tokens || 0;
      const generationTimeMs = Date.now() - startTime;
      
      // Parse the response to extract gender-specific explanations
      let member1Explanation = '';
      let member2Explanation = '';
      let member1Points: MatchPoint[] = [];
      let member2Points: MatchPoint[] = [];
      
      try {
        // Try to parse the response as JSON
        console.log('Raw OpenAI response text:', contentText);
        
        // Sometimes OpenAI returns JSON with additional text before or after
        // Let's try to extract just the JSON part
        let jsonContent = contentText;
        
        // Try to find JSON content between curly braces
        const jsonMatch = contentText.match(/\{[\s\S]*\}/); 
        if (jsonMatch) {
          jsonContent = jsonMatch[0];
          console.log('Extracted JSON content from response');
        }
        
        // Parse the JSON content
        let parsedContent;
        try {
          parsedContent = JSON.parse(jsonContent);
          console.log('Successfully parsed JSON response');
        } catch (jsonError) {
          console.error('Error parsing JSON response:', jsonError);
          console.log('Attempting to fix malformed JSON...');
          
          // Try multiple approaches to fix JSON
          let fixedJson = jsonContent;
          
          // 1. Replace single quotes with double quotes
          fixedJson = fixedJson.replace(/'/g, '"');
          
          // 2. Remove newlines
          fixedJson = fixedJson.replace(/\n/g, ' ');
          
          // 3. Fix trailing commas
          fixedJson = fixedJson.replace(/,\s*}/g, '}').replace(/,\s*\]/g, ']');
          
          // 4. Try to fix unescaped quotes in strings
          fixedJson = fixedJson.replace(/"([^"]*?)(?<!\\)"([^"]*?)"/g, '"$1\\"$2"');
          
          try {
            parsedContent = JSON.parse(fixedJson);
            console.log('Successfully parsed fixed JSON');
          } catch (fixError) {
            console.error('Failed to fix JSON with standard fixes:', fixError);
            
            // Last resort: try to extract the arrays directly using regex
            try {
              console.log('Attempting to extract arrays directly with regex...');
              const member1Match = jsonContent.match(/"member1Explanation"\s*:\s*(\[[\s\S]*?\])/);
              const member2Match = jsonContent.match(/"member2Explanation"\s*:\s*(\[[\s\S]*?\])/);
              
              if (member1Match && member2Match) {
                const member1Json = member1Match[1].replace(/'/g, '"').replace(/,\s*\]/g, ']');
                const member2Json = member2Match[1].replace(/'/g, '"').replace(/,\s*\]/g, ']');
                
                try {
                  parsedContent = {
                    member1Explanation: JSON.parse(member1Json),
                    member2Explanation: JSON.parse(member2Json)
                  };
                  console.log('Successfully extracted arrays with regex');
                } catch (regexError) {
                  console.error('Failed to parse extracted arrays:', regexError);
                  throw new Error('Could not parse OpenAI response as JSON');
                }
              } else {
                throw new Error('Could not extract arrays from OpenAI response');
              }
            } catch (regexError) {
              console.error('Failed to extract with regex:', regexError);
              throw new Error('Could not parse OpenAI response as JSON');
            }
          }
        }
        
        console.log('Parsed OpenAI response:', JSON.stringify(parsedContent, null, 2));
        
        // Initialize points arrays
        member1Points = [];
        member2Points = [];
        
        // Process member1Explanation
        if (parsedContent.member1Explanation) {
          if (Array.isArray(parsedContent.member1Explanation)) {
            console.log('member1Explanation is an array with', parsedContent.member1Explanation.length, 'items');
            member1Points = parsedContent.member1Explanation as MatchPoint[];
          } else if (typeof parsedContent.member1Explanation === 'string') {
            // Try to parse it as JSON if it's a string
            console.log('member1Explanation is a string, attempting to parse as JSON');
            try {
              const parsedPoints = JSON.parse(parsedContent.member1Explanation);
              if (Array.isArray(parsedPoints)) {
                member1Points = parsedPoints;
              }
            } catch (e) {
              console.warn('Failed to parse member1Explanation string as JSON');
            }
          } else {
            console.warn('member1Explanation is not an array or string, type:', typeof parsedContent.member1Explanation);
          }
        } else {
          console.warn('No member1Explanation found in response');
        }
        
        // Process member2Explanation
        if (parsedContent.member2Explanation) {
          if (Array.isArray(parsedContent.member2Explanation)) {
            console.log('member2Explanation is an array with', parsedContent.member2Explanation.length, 'items');
            member2Points = parsedContent.member2Explanation as MatchPoint[];
          } else if (typeof parsedContent.member2Explanation === 'string') {
            // Try to parse it as JSON if it's a string
            console.log('member2Explanation is a string, attempting to parse as JSON');
            try {
              const parsedPoints = JSON.parse(parsedContent.member2Explanation);
              if (Array.isArray(parsedPoints)) {
                member2Points = parsedPoints;
              }
            } catch (e) {
              console.warn('Failed to parse member2Explanation string as JSON');
            }
          } else {
            console.warn('member2Explanation is not an array or string, type:', typeof parsedContent.member2Explanation);
          }
        } else {
          console.warn('No member2Explanation found in response');
        }
        
        // We don't need to store the raw explanations anymore
        member1Explanation = '';
        member2Explanation = '';
        
        console.log('Member1Points before validation:', JSON.stringify(member1Points));
        console.log('Member2Points before validation:', JSON.stringify(member2Points));
        
        // Validate and clean up the points arrays
        // For member1Points
        if (Array.isArray(member1Points)) {
          // Make sure we have exactly 5 points with header and explanation
          member1Points = member1Points
            .filter((point: MatchPoint | any) => (
              point && 
              typeof point === 'object' && 
              typeof point.header === 'string' && 
              typeof point.explanation === 'string' && 
              point.header.trim() !== '' && 
              point.explanation.trim() !== ''
            ))
            .slice(0, 5) // Limit to 5 points
            .map((point: any) => ({
              header: point.header.trim(),
              explanation: point.explanation.trim()
            }));
          
          // If we don't have 5 points, log a warning
          if (member1Points.length < 5) {
            console.warn(`Only got ${member1Points.length} valid points for member1, expected 5`);
          }
        } else {
          console.warn('member1Points is not an array, creating empty array');
          member1Points = [];
        }
        
        // For member2Points
        if (Array.isArray(member2Points)) {
          // Make sure we have exactly 5 points with header and explanation
          member2Points = member2Points
            .filter((point: MatchPoint | any) => (
              point && 
              typeof point === 'object' && 
              typeof point.header === 'string' && 
              typeof point.explanation === 'string' && 
              point.header.trim() !== '' && 
              point.explanation.trim() !== ''
            ))
            .slice(0, 5) // Limit to 5 points
            .map((point: any) => ({
              header: point.header.trim(),
              explanation: point.explanation.trim()
            }));
          
          // If we don't have 5 points, log a warning
          if (member2Points.length < 5) {
            console.warn(`Only got ${member2Points.length} valid points for member2, expected 5`);
          }
        } else {
          console.warn('member2Points is not an array, creating empty array');
          member2Points = [];
        }
          
          console.log('Member1Points structured as:', JSON.stringify(member1Points));
          console.log('Member2Points structured as:', JSON.stringify(member2Points));
          console.log('Successfully parsed gender-specific explanations');
      } catch (parseError) {
        // If parsing fails, use the raw content as a fallback
        console.warn('Failed to parse OpenAI response as JSON:', parseError);
        member1Explanation = contentText;
        member2Explanation = contentText;
        
        // Create fallback points
        member1Points = [{ header: "Why You're Compatible", explanation: contentText }] as MatchPoint[];
        member2Points = [{ header: "Why You're Compatible", explanation: contentText }] as MatchPoint[];
      }
      
      // Update the match document with the generated explanations
      try {
        const matchRef = doc(db, 'matches', matchId);
        // Log the final points before saving to Firebase
        console.log(`Final member1Points: ${member1Points.length} valid points`);
        console.log('member1Points structure:', JSON.stringify(member1Points, null, 2));
        console.log(`Final member2Points: ${member2Points.length} valid points`);
        console.log('member2Points structure:', JSON.stringify(member2Points, null, 2));
        
        // Ensure we're storing structured arrays, not strings
        console.log('Final member1Points type:', typeof member1Points);
        console.log('Final member2Points type:', typeof member2Points);
        
        // Convert to plain objects if they're not already
        const serializedMember1Points = member1Points.map(point => ({
          header: point.header,
          explanation: point.explanation
        }));
        
        const serializedMember2Points = member2Points.map(point => ({
          header: point.header,
          explanation: point.explanation
        }));
        
        console.log('Serialized member1Points:', JSON.stringify(serializedMember1Points));
        console.log('Serialized member2Points:', JSON.stringify(serializedMember2Points));
        
        // Update Firebase with the validated points
        await updateDoc(matchRef, {
          // Clear old fields
          compatibilityExplanation: null,
          member1Explanation: null,
          member2Explanation: null,
          
          // Add the validated points as structured arrays
          member1Points: serializedMember1Points,
          member2Points: serializedMember2Points,
          
          // Add timestamp and metrics
          explanationGeneratedAt: new Date().toISOString(),
          explanationMetrics: {
            tokensUsed,
            generationTimeMs,
            dataQualityScore: dataQualityScore || 0,
            model: 'gpt-4-turbo'
          }
        });
        
        console.log(`Updated match ${matchId} with gender-specific explanations`);
        
        // Log the successful generation for monitoring
        await logExplanationGeneration(
          matchId,
          tokensUsed,
          generationTimeMs,
          dataQualityScore
        );
      } catch (updateError) {
        console.error('Error updating match with explanations:', updateError);
        await logExplanationError(
          matchId,
          'firebase_update_error',
          String(updateError),
          500
        );
        // Continue anyway since we want to return the explanations
      }
      
      return NextResponse.json({ 
        matchId,
        member1Explanation,
        member2Explanation,
        member1Points,
        member2Points,
        generated: new Date().toISOString(),
        dataQualityScore,
        metrics: {
          tokensUsed,
          generationTimeMs
        }
      });
      
    } catch (error: any) {
      console.error('Error fetching user data:', error);
      
      await logExplanationError(
        matchId,
        'user_data_error',
        error.message || 'Unknown error',
        500
      );
      
      return NextResponse.json({ error: 'Error fetching user data: ' + (error.message || 'Unknown error') }, { status: 500 });
    }
  } catch (error) {
    console.error('Error generating match explanation:', error);
    console.error('Match ID:', matchId);
    console.error('Member IDs:', { member1Id, member2Id });
    
    // Get more detailed error information
    let errorMessage = 'Unknown error';
    let errorDetails = {};
    
    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = {
        name: error.name,
        stack: error.stack
      };
    } else {
      errorMessage = String(error);
    }
    
    console.error('Error details:', errorMessage, errorDetails);
    
    await logExplanationError(
      matchId,
      'server_error',
      errorMessage,
      500
    );
    
    return NextResponse.json({ 
      error: 'Failed to generate match explanation', 
      message: errorMessage,
      matchId,
      member1Id,
      member2Id
    }, { status: 500 });
  }
}

/**
 * Calculate a data quality score based on questionnaire completeness
 * Returns a score from 0-100
 */
function calculateDataQualityScore(member1Data: any, member2Data: any): number {
  // Define critical fields that should be present, based on the Firebase data structure
  // Using the structure from the memory about Vettly-2 profile page
  const criticalFields = [
    // Questionnaire fields with prefixes
    'lifestyle_profession',
    'lifestyle_smoking',
    'lifestyle_alcohol',
    'lifestyle_hobbiesTypes',
    'attraction_height',
    'relationships_children',
    'personal_maritalStatus',
    'personal_age',
    'personal_dob',
    'personal_educationLevel',
    'personal_religion',
    'values_familyImportance'
  ];
  
  // Root level fields that are important
  const rootFields = [
    'firstName',
    'lastName',
    'hasChildren',
    'maritalStatus',
    'dob',
    'location',
    'state',
    'suburb'
  ];
  
  // Count how many critical fields are present for each member
  let member1Score = 0;
  let member2Score = 0;
  let member1RootScore = 0;
  let member2RootScore = 0;
  
  // Check questionnaire fields
  criticalFields.forEach(field => {
    if (member1Data.questionnaireAnswers && member1Data.questionnaireAnswers[field]) {
      member1Score++;
    }
    
    if (member2Data.questionnaireAnswers && member2Data.questionnaireAnswers[field]) {
      member2Score++;
    }
  });
  
  // Check root level fields
  rootFields.forEach(field => {
    if (member1Data[field]) {
      member1RootScore++;
    }
    
    if (member2Data[field]) {
      member2RootScore++;
    }
  });
  
  // Calculate percentage of critical fields present (questionnaire fields weighted more)
  const member1Percentage = ((member1Score / criticalFields.length) * 0.7 + 
                            (member1RootScore / rootFields.length) * 0.3) * 100;
  const member2Percentage = ((member2Score / criticalFields.length) * 0.7 + 
                            (member2RootScore / rootFields.length) * 0.3) * 100;
  
  // Average the two scores
  return Math.round((member1Percentage + member2Percentage) / 2);
}

/**
 * Format user data for the OpenAI prompt
 */
function formatUserDataForPrompt(userData: any): string {
  if (!userData) return 'No data available';
  
  const { firstName, lastName, questionnaireAnswers = {}, hasChildren } = userData;
  
  // Start with basic profile information
  let formattedData = `Name: ${firstName || 'Unknown'} ${lastName || ''}\n`;
  
  // Add direct user fields
  formattedData += `Has Children: ${hasChildren ? 'Yes' : 'No'}\n`;
  formattedData += `Marital Status: ${userData.maritalStatus || questionnaireAnswers.personal_maritalStatus || 'Unknown'}\n`;
  
  // Calculate age using the same logic as in useProposedMatches hook
  let age;
  // Try to calculate age from DOB first
  const dob = userData.dob || questionnaireAnswers.personal_dob;
  
  if (dob) {
    // Parse Australian date format (DD.MM.YYYY)
    const parts = dob.split('.');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed in JS Date
      const year = parseInt(parts[2], 10);
      
      const birthDate = new Date(year, month, day);
      const today = new Date();
      
      let calculatedAge = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      // Adjust age if birthday hasn't occurred yet this year
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        calculatedAge--;
      }
      
      age = calculatedAge;
    }
  }
  
  // Fall back to age field if DOB calculation failed
  if (!age) {
    // Use personal_age from questionnaire first as per memory
    age = questionnaireAnswers.personal_age || userData.age;
  }
  formattedData += `Age: ${age || 'Unknown'}\n\n`;
  
  // Add questionnaire answers with proper handling of prefixed fields
  formattedData += 'Profile Information:\n';
  
  // Map specific fields based on the Firebase data structure with prefixes
  // Using the structure from the memory about Vettly-2 profile page
  const fieldMappings = [
    // Lifestyle section
    { key: 'lifestyle_profession', label: 'Profession' },
    { key: 'lifestyle_smoking', label: 'Smoking Habits' },
    { key: 'lifestyle_alcohol', label: 'Drinking Habits' },
    { key: 'lifestyle_hobbiesTypes', label: 'Hobbies & Interests', isArray: true },
    
    // Attraction section
    { key: 'attraction_height', label: 'Height' },
    
    // Relationships section
    { key: 'relationships_children', label: 'Open to Partner Having Children' },
    
    // Other important fields
    { key: 'personal_educationLevel', label: 'Education Level' },
    { key: 'personal_religion', label: 'Religion' },
    { key: 'personal_ethnicity', label: 'Ethnicity' },
    { key: 'personal_languages', label: 'Languages', isArray: true },
    
    // Values and preferences
    { key: 'values_familyImportance', label: 'Family Importance' },
    { key: 'values_religiousBeliefs', label: 'Religious Beliefs' },
    { key: 'values_politicalViews', label: 'Political Views' },
    { key: 'values_lifeGoals', label: 'Life Goals', isArray: true }
  ];
  
  // Add mapped fields to formatted data
  fieldMappings.forEach(mapping => {
    const value = questionnaireAnswers[mapping.key];
    if (value !== undefined && value !== null && value !== '') {
      let formattedValue = value;
      if (mapping.isArray && Array.isArray(value)) {
        formattedValue = value.join(', ');
      }
      formattedData += `${mapping.label}: ${formattedValue}\n`;
    }
  });
  
  // Group remaining answers by category for any fields not explicitly mapped
  formattedData += '\nAdditional Information:\n';
  
  // Group answers by category
  const categories: Record<string, string[]> = {};
  
  Object.entries(questionnaireAnswers).forEach(([key, value]) => {
    // Skip if this field was already handled in the mappings
    if (fieldMappings.some(mapping => mapping.key === key)) {
      return;
    }
    
    // Split the key to get section and question id
    const [sectionId, ...questionParts] = key.split('_');
    const questionId = questionParts.join('_');
    
    // Format the value (handle arrays, etc.)
    let formattedValue = value;
    if (Array.isArray(value)) {
      formattedValue = value.join(', ');
    }
    
    // Add to the appropriate category
    if (!categories[sectionId]) {
      categories[sectionId] = [];
    }
    
    categories[sectionId].push(`${questionId}: ${formattedValue}`);
  });
  
  // Add each category to the formatted data
  Object.entries(categories).forEach(([category, answers]) => {
    if (answers.length > 0) {
      formattedData += `\n${category.toUpperCase()}:\n`;
      formattedData += answers.join('\n');
      formattedData += '\n';
    }
  });
  
  return formattedData;
}

/**
 * Create a prompt for OpenAI to generate gender-specific match explanations
 * with exactly 5 structured points for each member
 */
function createGenderSpecificExplanationPrompt(member1Data: string, member2Data: string): string {
  return `You are a matchmaking expert for a dating app called Vettly. You need to generate personalized explanations for why two people are a great match.

MEMBER 1 PROFILE (MALE):
${member1Data}

MEMBER 2 PROFILE (FEMALE):
${member2Data}

Based on the information provided, generate two separate explanations:
1. An explanation for Member 1 (male) about why they are a great match with Member 2 (female)
2. An explanation for Member 2 (female) about why they are a great match with Member 1 (male)

IMPORTANT REQUIREMENTS:
- You MUST provide EXACTLY 5 distinct explanation points for each member
- Each point must have a concise header (3-7 words) and a detailed explanation (20-50 words)
- Points must be specific to the individuals, not generic dating advice
- Focus on compatibility factors, shared interests, complementary traits, and potential for a successful relationship
- Ensure each point is unique and highlights a different aspect of compatibility
- Use gender-appropriate language (he/him for Member 1, she/her for Member 2)
- Make it personal by using their names if available
- Be specific about what makes them uniquely compatible

Format your response as a JSON object with the following structure:
{
  "member1Explanation": [
    { "header": "Point 1 Header", "explanation": "Point 1 detailed explanation" },
    { "header": "Point 2 Header", "explanation": "Point 2 detailed explanation" },
    { "header": "Point 3 Header", "explanation": "Point 3 detailed explanation" },
    { "header": "Point 4 Header", "explanation": "Point 4 detailed explanation" },
    { "header": "Point 5 Header", "explanation": "Point 5 detailed explanation" }
  ],
  "member2Explanation": [
    { "header": "Point 1 Header", "explanation": "Point 1 detailed explanation" },
    { "header": "Point 2 Header", "explanation": "Point 2 detailed explanation" },
    { "header": "Point 3 Header", "explanation": "Point 3 detailed explanation" },
    { "header": "Point 4 Header", "explanation": "Point 4 detailed explanation" },
    { "header": "Point 5 Header", "explanation": "Point 5 detailed explanation" }
  ]
}

IMPORTANT: Your response MUST be valid JSON that can be parsed directly. Do not include any text before or after the JSON object. Ensure all quotes are properly escaped within strings.`;
}

/**
 * Legacy function for backward compatibility
 */
function createMatchExplanationPrompt(member1Data: string, member2Data: string): string {
  return `As an expert matchmaker, create a personalized explanation of why these two people would be a great match based on their profiles and questionnaire answers.

The explanation should:
- Be 2-3 paragraphs long (approximately 150-250 words)
- Highlight specific compatibility points based on their questionnaire answers
- Be warm and engaging
- Be positive and encouraging, but authentic and specific (not generic)
- Use natural, conversational language in Australian English
- Avoid mentioning the specific questions or questionnaire structure
- Focus on why they would connect well, not just listing their traits

MEMBER 1 PROFILE:
${member1Data}

MEMBER 2 PROFILE:
${member2Data}

Create a personalized "Why you're a great match" explanation that would appear on their match detail card.`;
}
