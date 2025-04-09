import { getGoogleSheetsClient } from './auth';
import { GOOGLE_SHEETS_CONFIG } from './config';

/**
 * Debug function to get raw data from the prompts sheet
 */
export async function getRawPromptData() {
  try {
    const sheets = await getGoogleSheetsClient();
    
    // Get the sheet ID and sheet name
    const sheetId = GOOGLE_SHEETS_CONFIG.SHEET_ID;
    const sheetName = GOOGLE_SHEETS_CONFIG.SHEETS.PROMPTS;
    
    // Fetch all data from the sheet including headers
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: `${sheetName}!A1:G`,
    });
    
    return response.data.values || [];
  } catch (error) {
    console.error('Error fetching raw prompt data:', error);
    throw error;
  }
} 