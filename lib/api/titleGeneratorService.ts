/**
 * Title Generator Service
 * 
 * This service provides functions to generate titles for prompts
 * by calling the server-side API.
 */

/**
 * Generate title response type
 */
interface GenerateTitleResponse {
  success: boolean;
  title?: string;
  message?: string;
}

/**
 * TitleGeneratorService provides methods to generate titles for prompts
 */
export const TitleGeneratorService = {
  /**
   * Generate a title based on prompt content
   * 
   * @param content - The prompt content to generate a title for
   * @returns A promise resolving to the generated title or 'Untitled Prompt' if generation fails
   */
  async generateTitle(content: string): Promise<string> {
    try {
      // Make sure we have content to work with
      if (!content.trim()) {
        return 'Untitled Prompt';
      }
      
      // Call the API endpoint
      const response = await fetch('/api/generate-title', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });
      
      // Parse the response
      const data = await response.json() as GenerateTitleResponse;
      
      // Return the generated title or fallback
      if (data.success && data.title) {
        return data.title;
      } else {
        console.error('Title generation failed:', data.message);
        return 'Untitled Prompt';
      }
    } catch (error) {
      console.error('Error generating title:', error);
      return 'Untitled Prompt';
    }
  }
}; 