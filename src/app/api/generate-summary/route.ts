import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// OpenAI API configuration
// Using environment variable for the API key
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';

// Log whether API key is available
console.log('Using API key from environment variable:', OPENAI_API_KEY ? 'Available' : 'Not available');

export async function POST(request: Request) {
  try {
    // Get questionnaire answers and user info from request body
    const requestData = await request.json();
    console.log('Request data received:', requestData);
    
    const { questionnaireAnswers, firstName } = requestData;
    console.log('firstName received:', firstName);
    
    if (!questionnaireAnswers) {
      return NextResponse.json({ error: 'No questionnaire data provided' }, { status: 400 });
    }
    
    // Use the provided name or a default if not available
    const userName = firstName || 'Bob';
    console.log('Using userName:', userName);

    console.log('API Key status:', OPENAI_API_KEY ? 'Available (masked for security)' : 'Not available');
    
    // If no API key is available, return an error instead of using the mock generator
    if (!OPENAI_API_KEY) {
      console.error('No OpenAI API key found, returning error');
      return NextResponse.json({ error: 'OpenAI API key is required but not configured' }, { status: 400 });
    }
    
    // Format the questionnaire data for the API
    const formattedData = formatQuestionnaireData(questionnaireAnswers);
    
    // Create the prompt for GPT-4
    const prompt = createGPTPrompt(userName, formattedData);
    
    try {
      console.log('Attempting to use OpenAI API...');
      console.log('API Key available:', OPENAI_API_KEY ? 'Yes' : 'No');
      
      // Check if we have an API key
      if (!OPENAI_API_KEY || OPENAI_API_KEY.trim() === '') {
        console.error('No API key found');
        return NextResponse.json({ error: 'OpenAI API key is required but not configured' }, { status: 400 });
      }
      
      // Use direct fetch request instead of OpenAI client
      console.log('Using direct fetch request instead of OpenAI client...');
      
      // Prepare the messages for the API call with proper typing
      const messages = [
        {
          role: 'system' as const,
          content: 'You are an expert matchmaker with years of experience helping people find meaningful relationships. You create personalized dating profile summaries that make users feel understood and accurately represented.'
        },
        {
          role: 'user' as const,
          content: prompt
        }
      ];
      
      const requestBody = {
        model: 'gpt-4',
        messages: messages,
        max_tokens: 500,
        temperature: 0.7
      };
      
      console.log('Sending direct fetch request to OpenAI API...');
      
      try {
        console.log('Attempting to connect to OpenAI API...');
        
        // Try using a different API endpoint that might be compatible with your key
        const apiUrl = 'https://api.openai.com/v1/chat/completions';
        console.log('Using API URL:', apiUrl);
        
        // Log request details (without showing the full API key)
        console.log('Request headers:', {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer sk-****' // Masked for security
        });
        console.log('Request body:', JSON.stringify(requestBody, null, 2));
        
        // Make the fetch request with a timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
        
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId); // Clear the timeout if the request completes
        
        console.log('Response received. Status:', response.status);
        
        if (!response.ok) {
          // Try to get the error details
          let errorDetails = 'No error details available';
          try {
            const errorData = await response.text();
            errorDetails = errorData;
            console.error('OpenAI API error response text:', errorDetails);
          } catch (parseError) {
            console.error('Could not parse error response:', parseError);
          }
          
          console.error('OpenAI API error response:', response.status);
          return NextResponse.json({ error: `API error: ${response.status}`, details: errorDetails }, { status: 500 });
        }
        
        const responseData = await response.json();
        console.log('OpenAI API response received successfully');
        const summary = responseData.choices[0].message.content;
        return NextResponse.json({ summary });
      } catch (fetchError: any) {
        console.error('Fetch error:', fetchError);
        console.error('Fetch error stack:', fetchError.stack);
        
        // Check for specific types of errors
        let errorType = 'unknown';
        let errorDetails = '';
        
        if (fetchError.name === 'AbortError') {
          errorType = 'timeout';
          errorDetails = 'Request timed out after 30 seconds';
        } else if (fetchError.message && fetchError.message.includes('network')) {
          errorType = 'network';
          errorDetails = 'Network connection issue';
        } else if (fetchError.message && fetchError.message.includes('SSL')) {
          errorType = 'ssl';
          errorDetails = 'SSL certificate issue';
        }
        
        console.error(`Fetch error type: ${errorType}, details: ${errorDetails || fetchError.message || 'Unknown'}`);
        
        // Try a simple HTTP request to check general connectivity
        try {
          console.log('Testing general network connectivity...');
          const testResponse = await fetch('https://www.google.com');
          console.log('Test request status:', testResponse.status);
        } catch (testError) {
          console.error('Even test request failed:', testError);
        }
        
        const errorMessage = fetchError.message || 'Unknown fetch error';
        return NextResponse.json({ 
          error: `Fetch error: ${errorMessage}`,
          type: errorType,
          details: errorDetails || errorMessage
        }, { status: 500 });
      }
      // This line is now handled inside the try/catch block
    } catch (error: any) {
      console.error('OpenAI API error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      
      return NextResponse.json({ error: 'OpenAI API error: ' + (error.message || 'Unknown error') }, { status: 500 });
    }
  } catch (error) {
    console.error('Error generating summary:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper function to format questionnaire data for GPT-4
function formatQuestionnaireData(questionnaireAnswers: Record<string, any>): string {
  // Convert the answers object to a more readable format
  const formattedAnswers = Object.entries(questionnaireAnswers).map(([key, value]) => {
    // Split the key to get section and question id
    const [sectionId, questionId] = key.split('_');
    
    // Format the value (handle arrays, etc.)
    let formattedValue = value;
    if (Array.isArray(value)) {
      formattedValue = value.join(', ');
    }
    
    return `${sectionId} ${questionId}: ${formattedValue}`;
  });

  return formattedAnswers.join('\n');
}

// Create a prompt for GPT-4
function createGPTPrompt(userName: string, formattedData: string): string {
  return `As an expert matchmaker, create a personalised dating profile summary for ${userName} based on their questionnaire answers below.

The summary should:
- Be 3-4 paragraphs long
- Have a warm, friendly tone
- Highlight their key personality traits, interests, and values
- Mention what they're looking for in a partner
- Be written in first person (as if ${userName} is speaking)
- Sound natural and authentic, not like a generic template

Here are ${userName}'s questionnaire answers:

${formattedData}

Based on this information, write a compelling dating profile summary that will help ${userName} make meaningful connections.`;
}

// Helper function to generate a mock summary
function generateMockSummary(userName: string, introExtro: string, hobbies: string[], personalValues: string[], children: string, marriage: string): string {
  // Default values if not provided
  const name = userName || 'Bob';
  const personality = introExtro || 'balanced';
  const interests = hobbies && hobbies.length > 0 ? hobbies : ['hiking', 'reading', 'cooking'];
  const values = personalValues && personalValues.length > 0 ? personalValues : ['honesty', 'kindness', 'adventure'];
  
  // Intro paragraph based on personality
  let intro = '';
  if (personality === 'introvert') {
    intro = `Hi there! I'm ${name}, and while I might seem a bit reserved at first, I warm up quickly once I get to know you. I value deep, meaningful connections and enjoy thoughtful conversations.`;
  } else if (personality === 'extrovert') {
    intro = `Hey! I'm ${name}, an outgoing and energetic person who loves meeting new people and trying new things. I thrive in social settings and always bring positive energy to any situation.`;
  } else {
    intro = `Hello! I'm ${name}, and I enjoy a good balance between social activities and quiet time. I'm comfortable in most situations and adapt easily to different environments and people.`;
  }
  
  // Interests paragraph
  const interestsText = interests.join(', ');
  const interestsParagraph = `In my free time, you'll find me ${interestsText}. I'm passionate about these activities and always looking to share them with someone special or learn about what excites you.`;
  
  // Values paragraph
  const valuesText = values.join(', ');
  const valuesParagraph = `What's important to me? ${valuesText}. I believe these values form the foundation of any strong relationship, and I'm looking for someone who shares similar principles.`;
  
  // Looking for paragraph
  let lookingFor = `I'm looking for someone who enjoys life, has a good sense of humor, and is ready for a meaningful connection. `;
  
  if (children === 'yes') {
    lookingFor += `As a parent, my children are an important part of my life. `;
  } else if (children === 'want') {
    lookingFor += `I hope to have children someday, so I'm looking for someone who shares that desire. `;
  }
  
  if (marriage === 'yes') {
    lookingFor += `I believe in commitment and am ultimately looking for a long-term partner to share life's journey.`;
  } else {
    lookingFor += `I'm open to seeing where things go naturally without rushing into anything.`;
  }
  
  // Combine all paragraphs
  return `${intro}\n\n${interestsParagraph}\n\n${valuesParagraph}\n\n${lookingFor}`;
}
