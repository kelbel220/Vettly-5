import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// OpenAI API configuration
// Using environment variable for the API key
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';

// Log whether API key is available and its format
console.log('Using API key from environment variable:', OPENAI_API_KEY ? 'Available' : 'Not available');
if (OPENAI_API_KEY) {
  console.log('API key format check:', OPENAI_API_KEY.startsWith('sk-') ? 'Valid format' : 'Invalid format (should start with sk-)');
  console.log('API key length:', OPENAI_API_KEY.length, 'characters');
}

// Function to verify OpenAI API key with a simple test request
async function verifyApiKey(apiKey: string): Promise<{valid: boolean, message: string}> {
  if (!apiKey || apiKey.trim() === '') {
    return { valid: false, message: 'API key is empty' };
  }
  
  if (!apiKey.startsWith('sk-')) {
    return { valid: false, message: 'API key format is invalid (should start with sk-)' };
  }
  
  try {
    // Make a minimal test request to OpenAI API
    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });
    
    if (response.status === 200) {
      return { valid: true, message: 'API key is valid' };
    } else if (response.status === 401) {
      return { valid: false, message: 'API key is invalid (unauthorized)' };
    } else {
      return { valid: false, message: `API key validation failed with status: ${response.status}` };
    }
  } catch (error: any) {
    return { valid: false, message: `API key validation error: ${error.message}` };
  }
}

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
    
    // If no API key is available, return an error
    if (!OPENAI_API_KEY) {
      console.log('No OpenAI API key found, returning error');
      return NextResponse.json({ 
        error: 'OpenAI API key is required but not configured',
        details: 'Please set the OPENAI_API_KEY environment variable with a valid API key'
      }, { status: 400 });
    }
    
    // Verify the API key before proceeding
    console.log('Verifying OpenAI API key...');
    const keyVerification = await verifyApiKey(OPENAI_API_KEY);
    console.log('API key verification result:', keyVerification.message);
    
    if (!keyVerification.valid) {
      return NextResponse.json({ 
        error: 'OpenAI API key validation failed', 
        details: keyVerification.message 
      }, { status: 400 });
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
        model: 'gpt-3.5-turbo',
        messages: messages,
        max_tokens: 500,
        temperature: 0.7
      };
      
      console.log('Sending direct fetch request to OpenAI API...');
      
      try {
        console.log('Attempting to connect to OpenAI API...');
        
        // Verify API key format
        if (OPENAI_API_KEY.startsWith('sk-') === false) {
          console.error('API key format appears invalid - should start with "sk-"');
        }
        
        // Use the standard OpenAI API endpoint
        const apiUrl = 'https://api.openai.com/v1/chat/completions';
        console.log('Using API URL:', apiUrl);
        
        // Log request details (without showing the full API key)
        const maskedKey = OPENAI_API_KEY.substring(0, 5) + '...' + OPENAI_API_KEY.substring(OPENAI_API_KEY.length - 4);
        console.log('Request headers with masked API key:', {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${maskedKey}`
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
        } else if (fetchError.message && fetchError.message.includes('ENOTFOUND')) {
          errorType = 'dns';
          errorDetails = 'DNS resolution failed - cannot resolve hostname';
        } else if (fetchError.message && fetchError.message.includes('ECONNREFUSED')) {
          errorType = 'connection_refused';
          errorDetails = 'Connection refused - the server actively rejected the connection';
        } else if (fetchError.message && fetchError.message.includes('ETIMEDOUT')) {
          errorType = 'connection_timeout';
          errorDetails = 'Connection timed out - server did not respond in time';
        } else if (fetchError.message && fetchError.message.includes('proxy')) {
          errorType = 'proxy';
          errorDetails = 'Proxy configuration issue';
        }
        
        console.error(`Fetch error type: ${errorType}, details: ${errorDetails || fetchError.message || 'Unknown'}`);
        
        // Try a simple HTTP request to check general connectivity
        try {
          console.log('Testing general network connectivity...');
          const testResponse = await fetch('https://www.google.com');
          console.log('Test request status:', testResponse.status);
          console.log('Network connectivity appears OK - issue may be specific to OpenAI API');
        } catch (testError) {
          console.error('Even test request failed:', testError);
          console.error('General network connectivity issues detected');
        }
        
        // Check if we're running in a development environment
        const isDevelopment = process.env.NODE_ENV === 'development';
        console.log('Running in development mode:', isDevelopment ? 'Yes' : 'No');
        
        if (isDevelopment) {
          console.log('Development environment detected - check if you need to configure CORS or proxy settings');
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
- Be 2-3 paragraphs long
- Use direct, concise language (avoid flowery or overly poetic language)
- Highlight their key personality traits, interests, and values
- Mention what they're looking for in a partner
- Be written in second person (addressing ${userName} directly with 'you')
- Use declarative statements only (no questions like "What's important to me?")
- Be straightforward and factual

Here are ${userName}'s questionnaire answers:

${formattedData}

Create a clear, direct summary based on this information.`;
}
