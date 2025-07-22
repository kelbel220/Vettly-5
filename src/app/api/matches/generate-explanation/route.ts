import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { db } from '@/lib/firebase-init';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { logExplanationGeneration, logExplanationError } from '@/lib/monitoring/explanationMonitoring';

// OpenAI API configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';

/**
 * API route to generate personalized match explanations using OpenAI
 * This is triggered when a match is sent from Vettly CRM to Vettly-2
 */
export async function POST(request: Request) {
  // Define matchId at the top level so it's available in catch blocks
  let matchId: string = 'unknown';
  
  try {
    // Get match data from request body
    const requestData = await request.json();
    matchId = requestData.matchId;
    const { member1Id, member2Id } = requestData;
    
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
      const prompt = createMatchExplanationPrompt(member1FormattedData, member2FormattedData);
      
      console.log('Calling OpenAI API to generate match explanation...');
      
      // Prepare the messages for the API call
      const messages = [
        {
          role: 'system' as const,
          content: 'You are an expert matchmaker with years of experience helping people find meaningful relationships. You create personalized explanations of why two people would be a great match based on their profiles and questionnaire answers.'
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
      const explanation = responseData.choices[0].message.content;
      
      // Calculate tokens used and generation time
      const tokensUsed = responseData.usage?.total_tokens || 0;
      const generationTimeMs = Date.now() - startTime;
      
      // Update the match document with the generated explanation
      try {
        const matchRef = doc(db, 'matches', matchId);
        await updateDoc(matchRef, {
          compatibilityExplanation: explanation,
          explanationGeneratedAt: new Date().toISOString(),
          explanationMetrics: {
            tokensUsed,
            generationTimeMs,
            dataQualityScore,
            model: 'gpt-4-turbo'
          }
        });
        
        console.log(`Updated match ${matchId} with generated explanation`);
        
        // Log the successful generation for monitoring
        await logExplanationGeneration(
          matchId,
          tokensUsed,
          generationTimeMs,
          dataQualityScore
        );
      } catch (updateError) {
        console.error('Error updating match with explanation:', updateError);
        await logExplanationError(
          matchId,
          'firebase_update_error',
          String(updateError),
          500
        );
        // Continue anyway since we want to return the explanation
      }
      
      return NextResponse.json({ 
        matchId,
        explanation,
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
  } catch (error: any) {
    console.error('Error generating match explanation:', error);
    
    await logExplanationError(
      matchId || 'unknown',
      'general_error',
      error.message || 'Unknown error',
      500
    );
    
    return NextResponse.json({ error: 'Internal server error: ' + (error.message || 'Unknown error') }, { status: 500 });
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
 * Create a prompt for OpenAI to generate a match explanation
 */
function createMatchExplanationPrompt(member1Data: string, member2Data: string): string {
  return `As an expert matchmaker, create a personalized explanation of why these two people would be a great match based on their profiles and questionnaire answers.

The explanation should:
- Be 2-3 paragraphs long (approximately 150-250 words)
- Highlight specific compatibility points based on their questionnaire answers
- Focus on shared values, complementary traits, and potential for connection
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
