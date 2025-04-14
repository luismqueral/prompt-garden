import { NextRequest, NextResponse } from 'next/server';

// Define the response type from OpenRouter
interface OpenRouterResponse {
  id: string;
  choices: {
    message: {
      content: string;
    };
  }[];
}

/**
 * POST /api/generate-title
 * 
 * Generates a title for the provided prompt content using OpenRouter API
 */
export async function POST(request: NextRequest) {
  console.log("API: /api/generate-title endpoint called");
  
  try {
    // Parse the request body
    const body = await request.json();
    const { content } = body;
    
    console.log("API: Received content length:", content?.length || 0);
    
    // Validate the content
    if (!content) {
      console.log("API: Missing content in request");
      return NextResponse.json(
        { success: false, message: 'Content is required' },
        { status: 400 }
      );
    }
    
    // Get the API key from environment variables
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      console.error('API: OpenRouter API key is not configured');
      return NextResponse.json(
        { success: false, message: 'API key not configured' },
        { status: 500 }
      );
    }
    
    console.log("API: API key is configured, preparing prompt");
    
    // Prepare prompt for title generation
    const systemPrompt = "You are a helpful assistant that generates concise, descriptive titles for AI prompts. The title should be 2-6 words, capturing the essence of the prompt.";
    
    // Clean up the content for the prompt
    const cleanContent = content
      .replace(/<pg-prompt>|<\/pg-prompt>|<pg-note>|<\/pg-note>/g, '')
      .trim();
    
    // Limit content length to avoid excessive token usage
    const truncatedContent = cleanContent.length > 1000 
      ? cleanContent.substring(0, 1000) + "..." 
      : cleanContent;
    
    const userPrompt = `Generate a short, descriptive title for this prompt:\n\n${truncatedContent}`;
    
    console.log("API: Calling OpenRouter API");
    
    // Make API request to OpenRouter
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': request.headers.get('referer') || 'https://promptgarden.app',
        'X-Title': 'Prompt Garden'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3-haiku:beta', // Using Claude 3 Haiku for efficiency
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 50 // Short response for a title
      })
    });
    
    console.log("API: OpenRouter response status:", response.status);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('API: OpenRouter API error:', errorData);
      return NextResponse.json(
        { success: false, message: 'Error from OpenRouter API' },
        { status: 500 }
      );
    }
    
    // Parse the response
    const data = await response.json() as OpenRouterResponse;
    console.log("API: OpenRouter raw response:", data);
    
    // Extract the title from the response
    let generatedTitle = data.choices[0]?.message?.content?.trim() || 'Untitled Prompt';
    
    // Remove quotes if the model returned them
    generatedTitle = generatedTitle.replace(/^["'](.*)["']$/, '$1');
    
    console.log("API: Generated title:", generatedTitle);
    
    // Return the generated title
    return NextResponse.json({ success: true, title: generatedTitle });
  } catch (error) {
    console.error('API: Error generating title:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to generate title', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 