import { NextResponse } from 'next/server';
import { GoogleSheetsAPI } from '@/lib/googleSheets';

export async function GET() {
  try {
    // Initialize the Google Sheets database
    await GoogleSheetsAPI.initialize();
    
    return NextResponse.json({ 
      success: true, 
      message: 'Google Sheets database initialized successfully' 
    });
  } catch (error) {
    console.error('Error initializing Google Sheets database:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to initialize Google Sheets database',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 