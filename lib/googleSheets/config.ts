// Google Sheets Configuration
export const GOOGLE_SHEETS_CONFIG = {
  // The ID of your Google Sheet (extract from your sheet URL)
  // Example: https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit
  // Replace with your actual Sheet ID in the .env file
  SHEET_ID: process.env.GOOGLE_SHEET_ID,
  
  // Service Account credentials (stored as a JSON string in environment variables)
  SERVICE_ACCOUNT_EMAIL: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  PRIVATE_KEY: process.env.GOOGLE_PRIVATE_KEY,
  
  // Sheet Names for different data types
  SHEETS: {
    PROMPTS: 'Prompts',
    TAGS: 'Tags',
    CATEGORIES: 'Categories',
  },
  
  // Column definitions for the Prompts sheet
  PROMPTS_COLUMNS: {
    ID: 'A',
    TITLE: 'B',
    CONTENT: 'C',
    TAGS: 'D',
    CATEGORY: 'E',
    CREATED_AT: 'F',
    UPDATED_AT: 'G',
  }
}; 