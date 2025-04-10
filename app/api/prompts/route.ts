import { NextRequest, NextResponse } from 'next/server';
import { GoogleSheetsAPI } from '@/lib/googleSheets';

// GET /api/prompts - Get all prompts
export async function GET(request: NextRequest) {
  try {
    // Parse query parameters for filtering
    const searchParams = request.nextUrl.searchParams;
    const tag = searchParams.get('tag');
    const query = searchParams.get('q');
    
    let prompts;
    
    if (tag) {
      // Filter by tag/category
      prompts = await GoogleSheetsAPI.prompts.getByTag(tag);
    } else if (query) {
      // Search prompts
      prompts = await GoogleSheetsAPI.prompts.search(query);
    } else {
      // Get all prompts
      prompts = await GoogleSheetsAPI.prompts.getAll();
    }
    
    return NextResponse.json({ success: true, prompts });
  } catch (error) {
    console.error('Error fetching prompts:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch prompts', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST /api/prompts - Create a new prompt
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("POST /api/prompts - Request body:", body);
    
    // Validate that content is required
    if (!body.content) {
      return NextResponse.json(
        { success: false, message: 'Content is required' },
        { status: 400 }
      );
    }
    
    // Use default title if not provided
    const title = body.title || 'Untitled Prompt';
    
    // Ensure tags is an array
    const tags = Array.isArray(body.tags) ? body.tags : [];
    
    // Create the prompt
    const prompt = await GoogleSheetsAPI.prompts.add({
      title,
      content: body.content,
      tags,
      category: body.category,
    });
    
    console.log("Created prompt:", prompt);
    
    // Update tag counts
    const allPrompts = await GoogleSheetsAPI.prompts.getAll();
    await GoogleSheetsAPI.tags.updateCounts(allPrompts);
    
    return NextResponse.json({ success: true, prompt });
  } catch (error) {
    console.error('Error creating prompt:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create prompt', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 