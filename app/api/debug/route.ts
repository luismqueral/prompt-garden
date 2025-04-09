import { NextResponse } from 'next/server';
import { getRawPromptData } from '@/lib/googleSheets/test-debug';

export async function GET() {
  try {
    const rawData = await getRawPromptData();
    
    return NextResponse.json({ 
      success: true, 
      data: rawData
    });
  } catch (error) {
    console.error('Error fetching debug data:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch debug data',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 