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
      console.log("TitleGeneratorService: Starting title generation process");
      
      // Make sure we have content to work with
      if (!content.trim()) {
        console.log("TitleGeneratorService: Empty content, returning default title");
        return 'Untitled Prompt';
      }
      
      console.log("TitleGeneratorService: Calling API endpoint with content length:", content.length);
      
      // Call the API endpoint
      console.log("TitleGeneratorService: Preparing to fetch from /api/generate-title");
      try {
        const response = await fetch('/api/generate-title', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ content }),
        });
        
        console.log("TitleGeneratorService: API response status:", response.status);
        
        // Parse the response
        const data = await response.json() as GenerateTitleResponse;
        
        console.log("TitleGeneratorService: API response data:", data);
        
        // Return the generated title or fallback
        if (data.success && data.title) {
          console.log("TitleGeneratorService: Successfully generated title:", data.title);
          return data.title;
        } else {
          console.error('TitleGeneratorService: Title generation failed:', data.message);
          return 'Untitled Prompt';
        }
      } catch (fetchError) {
        console.error('TitleGeneratorService: Fetch error:', fetchError);
        return 'Untitled Prompt (API Error)';
      }
    } catch (error) {
      console.error('TitleGeneratorService: Error generating title:', error);
      return 'Untitled Prompt';
    }
  }
}; 