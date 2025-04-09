import { NextResponse } from 'next/server';
import { GoogleSheetsAPI } from '@/lib/googleSheets';

// GET /api/categories - Get all categories
export async function GET() {
  try {
    const categories = await GoogleSheetsAPI.tags.getCategories();
    return NextResponse.json({ success: true, categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch categories', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 