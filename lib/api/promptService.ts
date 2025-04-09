// Types imported from the Google Sheets module
import { Prompt, Tag } from '../googleSheets';

// Error handling for API responses
class ApiError extends Error {
  status: number;
  
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

// Helper function to handle API responses
async function handleResponse<T>(response: Response): Promise<T> {
  const data = await response.json();
  
  if (!response.ok) {
    throw new ApiError(
      data.message || 'An error occurred while processing your request',
      response.status
    );
  }
  
  return data;
}

// Prompt Service with API methods
export const PromptService = {
  // Initialize the Google Sheets database
  async initializeDatabase(): Promise<{ success: boolean; message: string }> {
    const response = await fetch('/api/setup');
    return handleResponse<{ success: boolean; message: string }>(response);
  },
  
  // Get all prompts
  async getAllPrompts(): Promise<Prompt[]> {
    const response = await fetch('/api/prompts');
    const data = await handleResponse<{ success: boolean; prompts: Prompt[] }>(response);
    return data.prompts;
  },
  
  // Get prompt by ID
  async getPromptById(id: string): Promise<Prompt> {
    const response = await fetch(`/api/prompts/${id}`);
    const data = await handleResponse<{ success: boolean; prompt: Prompt }>(response);
    return data.prompt;
  },
  
  // Add a new prompt
  async addPrompt(promptData: Omit<Prompt, 'id' | 'createdAt' | 'updatedAt'>): Promise<Prompt> {
    const response = await fetch('/api/prompts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(promptData),
    });
    
    const data = await handleResponse<{ success: boolean; prompt: Prompt }>(response);
    return data.prompt;
  },
  
  // Update a prompt
  async updatePrompt(id: string, promptData: Partial<Omit<Prompt, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Prompt> {
    const response = await fetch(`/api/prompts/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(promptData),
    });
    
    const data = await handleResponse<{ success: boolean; prompt: Prompt }>(response);
    return data.prompt;
  },
  
  // Delete a prompt
  async deletePrompt(id: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`/api/prompts/${id}`, {
      method: 'DELETE',
    });
    
    return handleResponse<{ success: boolean; message: string }>(response);
  },
  
  // Search prompts
  async searchPrompts(query: string): Promise<Prompt[]> {
    const response = await fetch(`/api/prompts?q=${encodeURIComponent(query)}`);
    const data = await handleResponse<{ success: boolean; prompts: Prompt[] }>(response);
    return data.prompts;
  },
  
  // Get prompts by tag
  async getPromptsByTag(tag: string): Promise<Prompt[]> {
    const response = await fetch(`/api/prompts?tag=${encodeURIComponent(tag)}`);
    const data = await handleResponse<{ success: boolean; prompts: Prompt[] }>(response);
    return data.prompts;
  },
  
  // Get all tags
  async getAllTags(): Promise<Tag[]> {
    const response = await fetch('/api/tags');
    const data = await handleResponse<{ success: boolean; tags: Tag[] }>(response);
    return data.tags;
  },
  
  // Get all categories
  async getAllCategories(): Promise<string[]> {
    const response = await fetch('/api/categories');
    const data = await handleResponse<{ success: boolean; categories: string[] }>(response);
    return data.categories;
  },
}; 