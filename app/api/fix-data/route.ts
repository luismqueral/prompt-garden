import { NextResponse } from 'next/server';
import { getGoogleSheetsClient } from '@/lib/googleSheets/auth';
import { GOOGLE_SHEETS_CONFIG } from '@/lib/googleSheets/config';
import { getAllPrompts } from '@/lib/googleSheets/prompts';

export async function GET() {
  try {
    // Step 1: Get all prompts with our fixed function that handles misaligned data
    const prompts = await getAllPrompts();
    
    // Step 2: Get the Google Sheets client
    const sheets = await getGoogleSheetsClient();
    const sheetId = GOOGLE_SHEETS_CONFIG.SHEET_ID;
    const sheetName = GOOGLE_SHEETS_CONFIG.SHEETS.PROMPTS;
    
    // Step 3: Clear all data except the header row
    await sheets.spreadsheets.values.clear({
      spreadsheetId: sheetId,
      range: `${sheetName}!A2:G`,
    });
    
    // Step 4: Format the prompts as rows
    const formattedRows = prompts.map(prompt => [
      prompt.id,
      prompt.title,
      prompt.content,
      prompt.tags.join(', '),
      prompt.category || '',
      prompt.createdAt,
      prompt.updatedAt,
    ]);
    
    // Step 5: Rewrite the data with correct structure
    if (formattedRows.length > 0) {
      await sheets.spreadsheets.values.append({
        spreadsheetId: sheetId,
        range: `${sheetName}!A2:G`,
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        requestBody: {
          values: formattedRows,
        },
      });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `Fixed ${prompts.length} prompts in the Google Sheet`,
      prompts: prompts
    });
  } catch (error) {
    console.error('Error fixing data:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fix data',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 