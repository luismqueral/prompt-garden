import { google } from 'googleapis';
import { GoogleAuth } from 'google-auth-library';
import { GOOGLE_SHEETS_CONFIG } from './config';

// Function to create an authenticated Google Sheets client
export async function getGoogleSheetsClient() {
  try {
    // Check if required environment variables are set
    if (!GOOGLE_SHEETS_CONFIG.SERVICE_ACCOUNT_EMAIL || !GOOGLE_SHEETS_CONFIG.PRIVATE_KEY) {
      throw new Error('Google Sheets credentials are not properly configured in environment variables');
    }

    // Format the private key correctly (handling escaped newlines)
    const privateKey = GOOGLE_SHEETS_CONFIG.PRIVATE_KEY.replace(/\\n/g, '\n');

    // Create a JWT client using service account credentials
    const auth = new GoogleAuth({
      credentials: {
        client_email: GOOGLE_SHEETS_CONFIG.SERVICE_ACCOUNT_EMAIL,
        private_key: privateKey,
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    // Create and return the Google Sheets API client
    const sheets = google.sheets({ version: 'v4', auth });
    return sheets;
  } catch (error) {
    console.error('Error creating Google Sheets client:', error);
    throw error;
  }
} 