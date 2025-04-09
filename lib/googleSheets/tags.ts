import { getGoogleSheetsClient } from './auth';
import { GOOGLE_SHEETS_CONFIG } from './config';

// Type definition for tags
export interface Tag {
  name: string;
  count: number;
  isCategory: boolean;
}

/**
 * Get all tags from the Google Sheet
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
 * Get categories (special type of tags)
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
 * Update tag counts based on the prompts
 * Call this after adding, updating, or deleting prompts
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
    const tagRows = Object.entries(tagCounts).map(([name, count]) => [
      name,
      count.toString(),
      categories.has(name).toString(),
    ]);
    
    // Clear the existing tags data (except header)
    await sheets.spreadsheets.values.clear({
      spreadsheetId: sheetId,
      range: `${sheetName}!A2:C`,
    });
    
    // If we have tags to update
    if (tagRows.length > 0) {
      // Write the new tag data
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