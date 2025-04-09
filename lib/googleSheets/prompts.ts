import { getGoogleSheetsClient } from './auth';
import { GOOGLE_SHEETS_CONFIG } from './config';
import { v4 as uuidv4 } from 'uuid';

// Type definitions
export interface Prompt {
  id: string;
  title: string;
  content: string;
  tags: string[];
  category?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Get all prompts from the Google Sheet
 */
export async function getAllPrompts(): Promise<Prompt[]> {
  try {
    const sheets = await getGoogleSheetsClient();
    
    // Get the sheet ID and sheet name
    const sheetId = GOOGLE_SHEETS_CONFIG.SHEET_ID;
    const sheetName = GOOGLE_SHEETS_CONFIG.SHEETS.PROMPTS;
    
    // Fetch data from the sheet (skipping the header row)
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: `${sheetName}!A2:G`,
    });
    
    const rows = response.data.values || [];
    
    // Convert rows to Prompt objects with validation
    return rows.filter(row => row.length > 0).map((row) => {
      // Destructure row fields with proper validation
      const [id, title, content, tagsString, category, createdAt, updatedAt] = row;
      
      // Parse tags
      const tags = tagsString ? tagsString.split(',').map((tag: string) => tag.trim()) : [];
      
      return {
        id: id || '',
        title: title || '',
        content: content || '',
        tags,
        category: category || undefined,
        createdAt: createdAt || new Date().toISOString(),
        updatedAt: updatedAt || new Date().toISOString(),
      };
    });
  } catch (error) {
    console.error('Error fetching prompts from Google Sheets:', error);
    throw error;
  }
}

/**
 * Get a single prompt by ID
 */
export async function getPromptById(id: string): Promise<Prompt | null> {
  try {
    const allPrompts = await getAllPrompts();
    return allPrompts.find(prompt => prompt.id === id) || null;
  } catch (error) {
    console.error(`Error fetching prompt with ID ${id}:`, error);
    throw error;
  }
}

/**
 * Add a new prompt to the Google Sheet
 */
export async function addPrompt(promptData: Omit<Prompt, 'id' | 'createdAt' | 'updatedAt'>): Promise<Prompt> {
  try {
    const sheets = await getGoogleSheetsClient();
    
    // Get the sheet ID and sheet name
    const sheetId = GOOGLE_SHEETS_CONFIG.SHEET_ID;
    const sheetName = GOOGLE_SHEETS_CONFIG.SHEETS.PROMPTS;
    
    // Generate a new UUID for the prompt
    const id = uuidv4();
    
    // Create timestamp for created/updated
    const timestamp = new Date().toISOString();
    
    // Format tags as a comma-separated string
    const tagsString = promptData.tags.join(', ');
    
    // Prepare the row data
    const newRow = [
      id,
      promptData.title,
      promptData.content,
      tagsString,
      promptData.category || '',
      timestamp,
      timestamp,
    ];
    
    // Append the new row to the sheet
    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: `${sheetName}!A:G`,
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: [newRow],
      },
    });
    
    // Return the newly created prompt
    return {
      id,
      title: promptData.title,
      content: promptData.content,
      tags: promptData.tags,
      category: promptData.category,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
  } catch (error) {
    console.error('Error adding prompt to Google Sheets:', error);
    throw error;
  }
}

/**
 * Update an existing prompt in the Google Sheet
 */
export async function updatePrompt(id: string, promptData: Partial<Omit<Prompt, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Prompt | null> {
  try {
    const sheets = await getGoogleSheetsClient();
    
    // Get all prompts to find the one we want to update
    const allPrompts = await getAllPrompts();
    const promptIndex = allPrompts.findIndex(prompt => prompt.id === id);
    
    if (promptIndex === -1) {
      return null; // Prompt not found
    }
    
    // Get the prompt to update
    const existingPrompt = allPrompts[promptIndex];
    
    // Get the sheet ID and sheet name
    const sheetId = GOOGLE_SHEETS_CONFIG.SHEET_ID;
    const sheetName = GOOGLE_SHEETS_CONFIG.SHEETS.PROMPTS;
    
    // Create updated prompt data
    const updatedPrompt: Prompt = {
      ...existingPrompt,
      title: promptData.title || existingPrompt.title,
      content: promptData.content || existingPrompt.content,
      tags: promptData.tags || existingPrompt.tags,
      category: promptData.category || existingPrompt.category,
      updatedAt: new Date().toISOString(),
    };
    
    // Format tags as a comma-separated string
    const tagsString = updatedPrompt.tags.join(', ');
    
    // Prepare the row data
    const updatedRow = [
      updatedPrompt.id,
      updatedPrompt.title,
      updatedPrompt.content,
      tagsString,
      updatedPrompt.category || '',
      updatedPrompt.createdAt,
      updatedPrompt.updatedAt,
    ];
    
    // Calculate the row index (add 2 because rows are 1-indexed and we have a header row)
    const rowIndex = promptIndex + 2;
    
    // Update the row in the sheet
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: `${sheetName}!A${rowIndex}:G${rowIndex}`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [updatedRow],
      },
    });
    
    return updatedPrompt;
  } catch (error) {
    console.error(`Error updating prompt with ID ${id}:`, error);
    throw error;
  }
}

/**
 * Delete a prompt from the Google Sheet
 */
export async function deletePrompt(id: string): Promise<boolean> {
  try {
    const sheets = await getGoogleSheetsClient();
    
    // Get all prompts to find the one we want to delete
    const allPrompts = await getAllPrompts();
    const promptIndex = allPrompts.findIndex(prompt => prompt.id === id);
    
    if (promptIndex === -1) {
      return false; // Prompt not found
    }
    
    // Get the sheet ID and sheet name
    const sheetId = GOOGLE_SHEETS_CONFIG.SHEET_ID;
    const sheetName = GOOGLE_SHEETS_CONFIG.SHEETS.PROMPTS;
    
    // Calculate the row index (add 2 because rows are 1-indexed and we have a header row)
    const rowIndex = promptIndex + 2;
    
    // Delete the row by clearing its contents
    // (Sheets API doesn't have a direct "delete row" method, so we clear it instead)
    await sheets.spreadsheets.values.clear({
      spreadsheetId: sheetId,
      range: `${sheetName}!A${rowIndex}:G${rowIndex}`,
    });
    
    return true;
  } catch (error) {
    console.error(`Error deleting prompt with ID ${id}:`, error);
    throw error;
  }
}

/**
 * Filter prompts by tag or category
 */
export async function getPromptsByTag(tag: string): Promise<Prompt[]> {
  try {
    const allPrompts = await getAllPrompts();
    
    // Filter prompts that have the specified tag or category
    return allPrompts.filter(prompt => 
      prompt.tags.some(t => t.toLowerCase() === tag.toLowerCase()) || 
      (prompt.category && prompt.category.toLowerCase() === tag.toLowerCase())
    );
  } catch (error) {
    console.error(`Error fetching prompts with tag ${tag}:`, error);
    throw error;
  }
}

/**
 * Search prompts by title or content
 */
export async function searchPrompts(query: string): Promise<Prompt[]> {
  try {
    const allPrompts = await getAllPrompts();
    const normalizedQuery = query.toLowerCase();
    
    // Filter prompts that match the query in title or content
    return allPrompts.filter(prompt => 
      prompt.title.toLowerCase().includes(normalizedQuery) || 
      prompt.content.toLowerCase().includes(normalizedQuery)
    );
  } catch (error) {
    console.error(`Error searching prompts with query ${query}:`, error);
    throw error;
  }
} 