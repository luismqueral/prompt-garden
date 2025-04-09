/**
 * Google Sheets Prompts Integration Module
 * 
 * This module provides a comprehensive interface for managing prompts stored in Google Sheets.
 * It serves as the data access layer for prompt-related operations throughout the application.
 * 
 * Key Functionality:
 * - Create, read, update, and delete (CRUD) operations for prompts
 * - Data fetching from Google Sheets
 * - Data transformation between application types and spreadsheet rows
 * - Error handling for API operations
 * 
 * Architecture Notes:
 * - Uses Google Sheets API v4 for spreadsheet operations
 * - Implements a repository pattern to abstract the data source
 * - Handles data validation and transformation
 * - Uses UUID for generating unique identifiers
 */

import { getGoogleSheetsClient } from './auth';
import { GOOGLE_SHEETS_CONFIG } from './config';
import { v4 as uuidv4 } from 'uuid';

/**
 * Prompt Interface
 * 
 * Defines the structure of a prompt object in the application.
 * This interface is used throughout the application to maintain type safety.
 * 
 * Properties:
 * - id: Unique identifier for the prompt (UUID)
 * - title: Display title for the prompt
 * - content: The actual prompt text content
 * - tags: Array of tags for categorization and filtering
 * - category: Optional primary category classification
 * - createdAt: ISO timestamp of when the prompt was created
 * - updatedAt: ISO timestamp of when the prompt was last updated
 */
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
 * Get All Prompts
 * 
 * Fetches all prompts from the Google Sheet and converts them to Prompt objects.
 * This function:
 * 1. Connects to the Google Sheets API
 * 2. Retrieves all rows from the Prompts sheet (excluding the header)
 * 3. Transforms each row into a Prompt object with proper typing
 * 4. Handles validation and defaults for missing data
 * 
 * The sheet structure expected is:
 * | id | title | content | tags | category | createdAt | updatedAt |
 * 
 * @returns Promise resolving to an array of Prompt objects
 * @throws Error if the Google Sheets API call fails
 */
export async function getAllPrompts(): Promise<Prompt[]> {
  try {
    const sheets = await getGoogleSheetsClient();
    
    // Get the sheet ID and sheet name
    const sheetId = GOOGLE_SHEETS_CONFIG.SHEET_ID;
    const sheetName = GOOGLE_SHEETS_CONFIG.SHEETS.PROMPTS;
    
    // Fetch data from the sheet (skipping the header row)
    // A2:G means columns A through G starting from row 2
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: `${sheetName}!A2:G`,
    });
    
    const rows = response.data.values || [];
    
    // Convert rows to Prompt objects with validation
    return rows.filter(row => row.length > 0).map((row) => {
      // Destructure row fields with proper validation
      const [id, title, content, tagsString, category, createdAt, updatedAt] = row;
      
      // Parse tags from comma-separated string to array
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
 * Get Prompt By ID
 * 
 * Retrieves a single prompt by its unique identifier.
 * This function:
 * 1. Fetches all prompts using getAllPrompts()
 * 2. Filters the results to find the prompt with the matching ID
 * 3. Returns the matching prompt or null if not found
 * 
 * Note: This could be optimized in the future to directly query the specific row
 * rather than fetching all prompts, but this approach simplifies error handling.
 * 
 * @param id - The unique identifier of the prompt to retrieve
 * @returns Promise resolving to the matching Prompt object or null if not found
 * @throws Error if the Google Sheets API call fails
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
 * Add Prompt
 * 
 * Creates a new prompt in the Google Sheet.
 * This function:
 * 1. Generates a new UUID for the prompt
 * 2. Creates timestamps for creation and update times
 * 3. Formats the data as a row for the spreadsheet
 * 4. Appends the new row to the sheet
 * 
 * Note: The Omit<Prompt, ...> type means we accept a Prompt object 
 * without the id, createdAt, and updatedAt fields, as these are 
 * generated automatically.
 * 
 * @param promptData - The prompt data without ID and timestamps
 * @returns Promise resolving to the newly created Prompt with ID and timestamps
 * @throws Error if the Google Sheets API call fails
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
    // The 'RAW' valueInputOption means the values are not interpreted (vs 'USER_ENTERED')
    // The 'INSERT_ROWS' insertDataOption adds rows at the end
    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: `${sheetName}!A:G`,
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: [newRow],
      },
    });
    
    // Return the newly created prompt with generated fields
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
 * Update Prompt
 * 
 * Updates an existing prompt in the Google Sheet.
 * This function:
 * 1. Fetches all prompts to find the one to update
 * 2. Creates an updated prompt object with merged data
 * 3. Updates the specific row in the spreadsheet
 * 
 * Note: This uses a two-step process:
 * 1. Find the row index by getting all prompts
 * 2. Update the specific row with new data
 * 
 * The Partial<Omit<...>> type means we accept a partial prompt object
 * without id, createdAt, and updatedAt, allowing selective updates of fields.
 * 
 * @param id - The ID of the prompt to update
 * @param promptData - The partial prompt data to update
 * @returns Promise resolving to the updated Prompt or null if not found
 * @throws Error if the Google Sheets API call fails
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
    
    // Create updated prompt data by merging existing data with updates
    // We use the spread operator (...) to merge objects
    const updatedPrompt: Prompt = {
      ...existingPrompt,
      title: promptData.title || existingPrompt.title,
      content: promptData.content || existingPrompt.content,
      tags: promptData.tags || existingPrompt.tags,
      category: promptData.category || existingPrompt.category,
      updatedAt: new Date().toISOString(), // Update the timestamp
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
 * Delete Prompt
 * 
 * Removes a prompt from the Google Sheet by its ID.
 * This function:
 * 1. Fetches all prompts to find the one to delete
 * 2. Clears the content of the specific row
 * 
 * Note: The Google Sheets API doesn't provide a direct way to delete a row,
 * so instead we clear its contents. A more robust solution would involve 
 * sheet restructuring or using a "deleted" flag column.
 * 
 * @param id - The ID of the prompt to delete
 * @returns Promise resolving to a boolean indicating success
 * @throws Error if the Google Sheets API call fails
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
 * Get Prompts By Tag
 * 
 * Filters prompts that match a specific tag or category.
 * This function:
 * 1. Fetches all prompts
 * 2. Filters them to include only those with the matching tag or category
 * 3. Returns the filtered array
 * 
 * Note: The filtering is case-insensitive to improve user experience.
 * 
 * @param tag - The tag or category to filter by
 * @returns Promise resolving to an array of matching Prompts
 * @throws Error if the Google Sheets API call fails
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
 * Search Prompts
 * 
 * Searches for prompts containing a specific query string in their title or content.
 * This function:
 * 1. Fetches all prompts
 * 2. Filters them to include only those with the query in title or content
 * 3. Returns the filtered array
 * 
 * Note: The search is case-insensitive to improve user experience.
 * This is a simple implementation of search that could be enhanced with
 * more sophisticated text search algorithms in the future.
 * 
 * @param query - The search string to look for
 * @returns Promise resolving to an array of matching Prompts
 * @throws Error if the Google Sheets API call fails
 */
export async function searchPrompts(query: string): Promise<Prompt[]> {
  try {
    const allPrompts = await getAllPrompts();
    
    // If query is empty, return all prompts
    if (!query.trim()) {
      return allPrompts;
    }
    
    // Convert query to lowercase for case-insensitive search
    const lowerQuery = query.toLowerCase();
    
    // Filter prompts that contain the query in title or content
    return allPrompts.filter(prompt => 
      prompt.title.toLowerCase().includes(lowerQuery) || 
      prompt.content.toLowerCase().includes(lowerQuery)
    );
  } catch (error) {
    console.error(`Error searching prompts with query "${query}":`, error);
    throw error;
  }
} 