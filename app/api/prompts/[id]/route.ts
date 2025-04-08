import { NextRequest, NextResponse } from 'next/server';
import { GoogleSheetsAPI } from '@/lib/googleSheets';

// GET /api/prompts/[id] - Get a specific prompt
export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const prompt = await GoogleSheetsAPI.prompts.getById(params.id);
    
    if (!prompt) {
      return NextResponse.json(
        { success: false, message: 'Prompt not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, prompt });
  } catch (error) {
    console.error(`Error fetching prompt with ID ${params.id}:`, error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch prompt', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// PUT /api/prompts/[id] - Update a specific prompt
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    
    // Update the prompt
    const updatedPrompt = await GoogleSheetsAPI.prompts.update(params.id, {
      title: body.title,
      content: body.content,
      tags: body.tags,
      category: body.category,
    });
    
    if (!updatedPrompt) {
      return NextResponse.json(
        { success: false, message: 'Prompt not found' },
        { status: 404 }
      );
    }
    
    // Update tag counts
    const allPrompts = await GoogleSheetsAPI.prompts.getAll();
    await GoogleSheetsAPI.tags.updateCounts(allPrompts);
    
    return NextResponse.json({ success: true, prompt: updatedPrompt });
  } catch (error) {
    console.error(`Error updating prompt with ID ${params.id}:`, error);
    return NextResponse.json(
      { success: false, message: 'Failed to update prompt', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// DELETE /api/prompts/[id] - Delete a specific prompt
export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const result = await GoogleSheetsAPI.prompts.delete(params.id);
    
    if (!result) {
      return NextResponse.json(
        { success: false, message: 'Prompt not found' },
        { status: 404 }
      );
    }
    
    // Update tag counts
    const allPrompts = await GoogleSheetsAPI.prompts.getAll();
    await GoogleSheetsAPI.tags.updateCounts(allPrompts);
    
    return NextResponse.json({ success: true, message: 'Prompt deleted successfully' });
  } catch (error) {
    console.error(`Error deleting prompt with ID ${params.id}:`, error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete prompt', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 