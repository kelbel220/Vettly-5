import { NextResponse } from 'next/server';
import { WeeklyTipCategory } from '@/lib/models/weeklyTip';
import { createPromptForCategory, parseOpenAIResponse } from '@/lib/services/openaiTipGenerator';

// OpenAI API configuration
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const OPENAI_MODEL = 'gpt-4.1-nano';

export async function POST(request: Request) {
  try {
    // Parse the request body
    const { category } = await request.json();
    
    if (!category) {
      return NextResponse.json(
        { error: 'Category is required' },
        { status: 400 }
      );
    }
    
    // Get API key from environment variables (server-side)
    const apiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY;
    
    if (!apiKey) {
      console.error('OpenAI API key is missing');
      return NextResponse.json(
        { error: 'OpenAI API key is not configured on the server' },
        { status: 500 }
      );
    }
    
    // Generate the prompt
    const prompt = createPromptForCategory(category as WeeklyTipCategory);
    
    // Define the function schema for structured tip generation
    const functions = [
      {
        name: 'generate_weekly_tip',
        description: 'Generate a structured weekly dating tip',
        parameters: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              description: 'A catchy, engaging title for the tip'
            },
            shortDescription: {
              type: 'string',
              description: 'A brief 1-2 sentence summary of the tip'
            },
            mainContent: {
              type: 'string',
              description: 'Detailed explanation of the tip (2-3 paragraphs)'
            },
            whyThisMatters: {
              type: 'string',
              description: 'Explain why this advice is important (1 paragraph)'
            },
            quickTips: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: '5 actionable bullet points related to the main tip'
            },
            didYouKnow: {
              type: 'string',
              description: 'An interesting fact or statistic related to dating'
            },
            weeklyChallenge: {
              type: 'string',
              description: 'A simple action users can take this week'
            }
          },
          required: ['title', 'shortDescription', 'mainContent', 'whyThisMatters', 'quickTips', 'didYouKnow', 'weeklyChallenge']
        }
      }
    ];

    // Call OpenAI API with function calling
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
            content: 'You are a helpful assistant that generates dating tips.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        functions: functions,
        function_call: { name: 'generate_weekly_tip' },
        temperature: 0.7,
        max_tokens: 1000
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      return NextResponse.json(
        { error: `OpenAI API error: ${errorData.error?.message || 'Unknown error'}` },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    console.log('OpenAI API response:', JSON.stringify(data, null, 2));
    
    // Extract the function call arguments from the response
    const functionCall = data.choices[0].message.function_call;
    
    if (!functionCall || functionCall.name !== 'generate_weekly_tip') {
      return NextResponse.json(
        { error: 'Failed to generate structured tip data' },
        { status: 500 }
      );
    }
    
    // Parse the function arguments
    const tipData = JSON.parse(functionCall.arguments);
    
    // Create a weekly tip object from the structured data
    const generatedTip = {
      title: tipData.title,
      shortDescription: tipData.shortDescription,
      mainContent: tipData.mainContent,
      whyThisMatters: tipData.whyThisMatters,
      quickTips: tipData.quickTips,
      didYouKnow: tipData.didYouKnow,
      weeklyChallenge: tipData.weeklyChallenge,
      category: category as WeeklyTipCategory,
      publishedAt: new Date(),
      status: 'draft'
    };
    
    return NextResponse.json({ tip: generatedTip });
  } catch (error) {
    console.error('Error in OpenAI API route:', error);
    return NextResponse.json(
      { error: 'Failed to generate tip: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}
