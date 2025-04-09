require('dotenv').config({ path: '.env.local' });
const { google } = require('googleapis');
const { GoogleAuth } = require('google-auth-library');

// Print environment variables (redacted for security)
console.log('=== Environment Variables Check ===');
console.log('GOOGLE_SHEET_ID:', process.env.GOOGLE_SHEET_ID ? '✓ Defined' : '✗ Missing');
console.log('GOOGLE_SERVICE_ACCOUNT_EMAIL:', process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ? '✓ Defined' : '✗ Missing');
console.log('GOOGLE_PRIVATE_KEY:', process.env.GOOGLE_PRIVATE_KEY ? '✓ Defined (starts with: ' + process.env.GOOGLE_PRIVATE_KEY.substring(0, 25) + '...)' : '✗ Missing');

// Function to test Google Sheets API
async function testGoogleSheetsAPI() {
  try {
    console.log('\n=== Testing Google Sheets API Connection ===');
    
    // Format the private key correctly (handling escaped newlines)
    const privateKey = process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n');
    
    // Create a JWT client using service account credentials
    const auth = new GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: privateKey,
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    
    console.log('✓ Auth client created successfully');
    
    // Create the Google Sheets API client
    const sheets = google.sheets({ version: 'v4', auth });
    console.log('✓ Sheets client created successfully');
    
    // Test access to the spreadsheet
    const sheetInfo = await sheets.spreadsheets.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
    });
    
    console.log('✓ Successfully accessed spreadsheet: ' + sheetInfo.data.properties.title);
    console.log('✓ All tests passed! Your Google Sheets configuration is working correctly.');
    
  } catch (error) {
    console.error('❌ Error testing Google Sheets API:', error.message);
    
    if (error.message.includes('invalid_grant')) {
      console.error('\nThis error often occurs when:');
      console.error('1. The private key format is incorrect (should include "-----BEGIN PRIVATE KEY-----")');
      console.error('2. The service account email is incorrect');
      console.error('3. The service account doesn\'t have access to the spreadsheet');
    }
    
    if (error.message.includes('not found')) {
      console.error('\nThis error indicates:');
      console.error('1. The spreadsheet ID is incorrect');
      console.error('2. The spreadsheet has been deleted');
      console.error('3. The service account doesn\'t have access to the spreadsheet');
      console.error('\nMake sure you\'ve shared the spreadsheet with the service account email!');
    }
  }
}

// Run the test
testGoogleSheetsAPI(); 