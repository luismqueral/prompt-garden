import { NextResponse } from 'next/server';
import { GoogleSheetsAPI } from '@/lib/googleSheets';

// GET /api/tags - Get all tags
export async function GET() {
  try {
    const tags = await GoogleSheetsAPI.tags.getAll();
    return NextResponse.json({ success: true, tags });
  } catch (error) {
    console.error('Error fetching tags:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch tags', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 