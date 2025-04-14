/**
 * OpenRouter API Service
 * 
 * This service provides functions to interact with the OpenRouter API
 * for generating titles based on prompt content.
 */

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
 * Generate a title from prompt content using OpenRouter API
 * 
 * @param content - The prompt content to generate a title for
 * @returns A promise that resolves to the generated title
 */
export async function generateTitle(content: string): Promise<string> {
  try {
    // Check for API key
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      console.error('OpenRouter API key is not defined');
      return 'Untitled Prompt';
    }

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

    // Make API request to OpenRouter
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': window.location.origin, // Required for OpenRouter
        'X-Title': 'Prompt Garden' // Application name
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

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenRouter API error:', errorData);
      return 'Untitled Prompt';
    }

    // Parse the response
    const data = await response.json() as OpenRouterResponse;
    
    // Extract the title from the response
    const generatedTitle = data.choices[0]?.message?.content?.trim() || 'Untitled Prompt';
    
    // Remove quotes if the model returned them
    return generatedTitle.replace(/^["'](.*)["']$/, '$1');
  } catch (error) {
    console.error('Error generating title:', error);
    return 'Untitled Prompt';
  }
} 