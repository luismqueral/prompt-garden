import { getGoogleSheetsClient } from './auth';
import { GOOGLE_SHEETS_CONFIG } from './config';

/**
 * Initialize the Google Sheet with necessary sheets and headers
 */
export async function initializeGoogleSheet(): Promise<void> {
  try {
    const sheets = await getGoogleSheetsClient();
    const sheetId = GOOGLE_SHEETS_CONFIG.SHEET_ID;
    
    // Check if the spreadsheet exists and we have access
    await sheets.spreadsheets.get({
      spreadsheetId: sheetId,
    });
    
    // Get all the sheets in the spreadsheet
    const response = await sheets.spreadsheets.get({
      spreadsheetId: sheetId,
      fields: 'sheets.properties.title',
    });
    
    const existingSheets = response.data.sheets?.map(sheet => sheet.properties?.title) || [];
    
    // Create necessary sheets if they don't exist
    const requiredSheets = [
      GOOGLE_SHEETS_CONFIG.SHEETS.PROMPTS,
      GOOGLE_SHEETS_CONFIG.SHEETS.TAGS,
      GOOGLE_SHEETS_CONFIG.SHEETS.CATEGORIES,
    ];
    
    for (const sheetName of requiredSheets) {
      if (!existingSheets.includes(sheetName)) {
        // Add a new sheet
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId: sheetId,
          requestBody: {
            requests: [
              {
                addSheet: {
                  properties: {
                    title: sheetName,
                  },
                },
              },
            ],
          },
        });
        
        // Add headers to the new sheet
        if (sheetName === GOOGLE_SHEETS_CONFIG.SHEETS.PROMPTS) {
          await sheets.spreadsheets.values.update({
            spreadsheetId: sheetId,
            range: `${sheetName}!A1:G1`,
            valueInputOption: 'RAW',
            requestBody: {
              values: [['ID', 'Title', 'Content', 'Tags', 'Category', 'Created At', 'Updated At']],
            },
          });
        } else if (sheetName === GOOGLE_SHEETS_CONFIG.SHEETS.TAGS) {
          await sheets.spreadsheets.values.update({
            spreadsheetId: sheetId,
            range: `${sheetName}!A1:C1`,
            valueInputOption: 'RAW',
            requestBody: {
              values: [['Name', 'Count', 'Is Category']],
            },
          });
        } else if (sheetName === GOOGLE_SHEETS_CONFIG.SHEETS.CATEGORIES) {
          await sheets.spreadsheets.values.update({
            spreadsheetId: sheetId,
            range: `${sheetName}!A1:B1`,
            valueInputOption: 'RAW',
            requestBody: {
              values: [['Name', 'Description']],
            },
          });
        }
      }
    }
    
    console.log('Google Sheet initialized successfully');
  } catch (error) {
    console.error('Error initializing Google Sheet:', error);
    throw error;
  }
} 