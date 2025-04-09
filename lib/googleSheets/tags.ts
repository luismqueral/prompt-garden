/**
 * Tags Management Module for Google Sheets Integration
 * 
 * This module manages tags and categories for prompts in the application.
 * It handles tag storage, retrieval, and count updates in the Google Sheets backend.
 * 
 * Key Functionality:
 * - Retrieving all tags and their usage counts from Google Sheets
 * - Retrieving categories (a special type of tag)
 * - Updating tag counts based on prompt usage
 * 
 * Architecture Notes:
 * - Tags are stored in a separate sheet from prompts
 * - Categories are implemented as a special type of tag (with isCategory=true)
 * - Tag counts are managed centrally rather than calculated on-the-fly
 * - The module handles synchronization of tags with prompt data
 */

import { getGoogleSheetsClient } from './auth';
import { GOOGLE_SHEETS_CONFIG } from './config';

/**
 * Tag Interface
 * 
 * Defines the structure of a tag object in the application.
 * 
 * Properties:
 * - name: The tag text/label that is displayed and used for filtering
 * - count: Number of prompts that use this tag
 * - isCategory: Boolean flag indicating if this tag is also a category
 *   (Categories are a special type of tag used for primary classification)
 */
export interface Tag {
  name: string;
  count: number;
  isCategory: boolean;
}

/**
 * Get All Tags
 * 
 * Fetches all tags and their metadata from the Google Sheet.
 * 
 * This function:
 * 1. Connects to the Google Sheets API
 * 2. Retrieves all rows from the Tags sheet (excluding the header)
 * 3. Transforms each row into a Tag object with proper typing
 * 
 * The sheet structure expected is:
 * | name | count | isCategory |
 * 
 * @returns Promise resolving to an array of Tag objects
 * @throws Error if the Google Sheets API call fails
 */
export async function getAllTags(): Promise<Tag[]> {
  try {
    const sheets = await getGoogleSheetsClient();
    
    // Get the sheet ID and sheet name
    const sheetId = GOOGLE_SHEETS_CONFIG.SHEET_ID;
    const sheetName = GOOGLE_SHEETS_CONFIG.SHEETS.TAGS;
    
    // Fetch data from the sheet (skipping the header row)
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: `${sheetName}!A2:C`,
    });
    
    const rows = response.data.values || [];
    
    // Convert rows to Tag objects
    return rows.map(row => {
      const [name, countStr, isCategoryStr] = row;
      return {
        name,
        count: parseInt(countStr, 10) || 0,
        isCategory: isCategoryStr === 'true',
      };
    });
  } catch (error) {
    console.error('Error fetching tags from Google Sheets:', error);
    throw error;
  }
}

/**
 * Get Categories
 * 
 * Retrieves only the tags that are marked as categories.
 * Categories are a special subset of tags used for primary classification.
 * 
 * This function:
 * 1. Fetches all tags using getAllTags()
 * 2. Filters to include only those marked as categories
 * 3. Returns just the category names as strings
 * 
 * @returns Promise resolving to an array of category names
 * @throws Error if the Google Sheets API call fails
 */
export async function getCategories(): Promise<string[]> {
  try {
    const allTags = await getAllTags();
    return allTags
      .filter(tag => tag.isCategory)
      .map(tag => tag.name);
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
}

/**
 * Update Tag Counts
 * 
 * Recalculates and updates tag and category counts based on current prompt data.
 * This should be called after adding, updating, or deleting prompts to keep tag counts accurate.
 * 
 * This function:
 * 1. Processes all prompts to count tag and category occurrences
 * 2. Clears the existing tag data in the sheet
 * 3. Writes the updated tag data with new counts
 * 
 * Tag counts are stored in the sheet rather than calculated on-the-fly for performance reasons,
 * especially as the number of prompts grows.
 * 
 * @param prompts - Array of prompt objects with tags and optional category
 * @returns Promise that resolves when the operation is complete
 * @throws Error if the Google Sheets API call fails
 */
export async function updateTagCounts(prompts: Array<{ tags: string[], category?: string }>): Promise<void> {
  try {
    const sheets = await getGoogleSheetsClient();
    
    // Get the sheet ID and sheet name
    const sheetId = GOOGLE_SHEETS_CONFIG.SHEET_ID;
    const sheetName = GOOGLE_SHEETS_CONFIG.SHEETS.TAGS;
    
    // Count occurrences of each tag and category
    const tagCounts: Record<string, number> = {};
    const categories = new Set<string>();
    
    // Process all prompts to count tags and identify categories
    prompts.forEach(prompt => {
      // Process tags
      prompt.tags.forEach(tag => {
        const normalizedTag = tag.trim();
        if (normalizedTag) {
          tagCounts[normalizedTag] = (tagCounts[normalizedTag] || 0) + 1;
        }
      });
      
      // Process category
      if (prompt.category) {
        const normalizedCategory = prompt.category.trim();
        if (normalizedCategory) {
          categories.add(normalizedCategory);
          tagCounts[normalizedCategory] = (tagCounts[normalizedCategory] || 0) + 1;
        }
      }
    });
    
    // Convert to rows for the sheet
    // Each row represents a tag with its count and category status
    const tagRows = Object.entries(tagCounts).map(([name, count]) => [
      name,
      count.toString(),
      categories.has(name).toString(),
    ]);
    
    // Clear the existing tags data (except header)
    // This is done to remove any tags that are no longer in use
    await sheets.spreadsheets.values.clear({
      spreadsheetId: sheetId,
      range: `${sheetName}!A2:C`,
    });
    
    // If we have tags to update
    if (tagRows.length > 0) {
      // Write the new tag data
      // This rebuilds the entire tags sheet with fresh counts
      await sheets.spreadsheets.values.append({
        spreadsheetId: sheetId,
        range: `${sheetName}!A2:C`,
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        requestBody: {
          values: tagRows,
        },
      });
    }
  } catch (error) {
    console.error('Error updating tag counts:', error);
    throw error;
  }
} 