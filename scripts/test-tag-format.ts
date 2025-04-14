#!/usr/bin/env node

/**
 * Tag Format Testing Script
 * 
 * This script tests the functionality of the new tag-based format for prompts and notes.
 * It validates the conversion between content string and block arrays in both directions,
 * and tests various edge cases.
 * 
 * Usage: 
 * npx ts-node scripts/test-tag-format.ts
 */

import { contentToBlocks, blocksToContent } from '../lib/utils/blockUtils';
import { migrateToTagFormat, migrateToLegacyFormat } from '../lib/utils/migration';
import { Block } from '@/components/ui/block-editor';

// Helper function to print results
function printResult(description: string, success: boolean, details?: string) {
  const prefix = success ? '✅ PASS:' : '❌ FAIL:';
  console.log(`${prefix} ${description}`);
  if (details && !success) {
    console.log(`  ${details}`);
  }
}

// Test samples
const samples = {
  legacyFormat: `This is a prompt block.
It continues for multiple lines.

> This is a note block.
> It also continues for multiple lines.
> But it conflicts with markdown blockquotes.`,

  tagFormat: `<pg-prompt>
This is a prompt block.
It continues for multiple lines.
</pg-prompt>

<pg-note>
This is a note block.
It also continues for multiple lines.
And can include proper markdown blockquotes like:
> This is a blockquote in markdown
Without conflicting with the block type.
</pg-note>`,

  mixedContent: `<pg-prompt>
First prompt block
</pg-prompt>

> Legacy note block

<pg-note>
Another note block
</pg-note>

Final plain text prompt`,

  edgeCases: {
    empty: '',
    whitespaceOnly: '   \n  \n  ',
    promptOnly: `<pg-prompt>
Just a prompt, no notes
</pg-prompt>`,
    noteOnly: `<pg-note>
Just a note, no prompts
</pg-note>`,
    nestedTags: `<pg-prompt>
This contains a <pg-note>fake note tag</pg-note> that should be treated as text
</pg-prompt>`,
    brokenTags: `<pg-prompt>
Missing closing tag

<pg-note>
This note is fine
</pg-note>`,
    markdownHeavy: `<pg-prompt>
# Markdown heading
- List item 1
- List item 2

\`\`\`javascript
const x = 1;
\`\`\`
</pg-prompt>

<pg-note>
## Note with markdown
> This is a blockquote
> With multiple lines

**Bold text** and *italic text*
</pg-note>`
  }
};

// Run tests
function runTests() {
  console.log('🧪 TESTING TAG FORMAT FUNCTIONALITY\n');
  
  // Test 1: Convert from legacy format to tag format
  try {
    const tagFormatted = migrateToTagFormat(samples.legacyFormat);
    const blocks = contentToBlocks(tagFormatted);
    const success = blocks.length === 2 && 
                    blocks[0].type === 'prompt' && 
                    blocks[1].type === 'note';
    
    printResult('Convert legacy format to tag format', success);
  } catch (error: any) {
    printResult('Convert legacy format to tag format', false, error.message);
  }
  
  // Test 2: Parse tag format into blocks
  try {
    const blocks = contentToBlocks(samples.tagFormat);
    const success = blocks.length === 2 && 
                    blocks[0].type === 'prompt' && 
                    blocks[1].type === 'note' &&
                    blocks[1].content.includes('> This is a blockquote');
    
    printResult('Parse tag format into blocks', success);
  } catch (error: any) {
    printResult('Parse tag format into blocks', false, error.message);
  }
  
  // Test 3: Convert blocks back to tag format content
  try {
    const blocks = contentToBlocks(samples.tagFormat);
    const content = blocksToContent(blocks);
    const newBlocks = contentToBlocks(content);
    
    const success = blocks.length === newBlocks.length && 
                    blocks.every((block, i) => 
                      block.type === newBlocks[i].type && 
                      block.content === newBlocks[i].content
                    );
    
    printResult('Round-trip conversion (blocks -> content -> blocks)', success);
  } catch (error: any) {
    printResult('Round-trip conversion (blocks -> content -> blocks)', false, error.message);
  }
  
  // Test 4: Mixed content handling
  try {
    const blocks = contentToBlocks(samples.mixedContent);
    const success = blocks.length === 3 && 
                    blocks[0].type === 'prompt' &&
                    blocks[1].type === 'note' &&
                    blocks[2].type === 'note';
    
    printResult('Handle mixed format content', success);
  } catch (error: any) {
    printResult('Handle mixed format content', false, error.message);
  }
  
  // Test 5: Edge cases
  console.log('\n--- Edge Cases ---');
  
  // Test 5.1: Empty content
  try {
    const blocks = contentToBlocks(samples.edgeCases.empty);
    printResult('Handle empty content', blocks.length === 0);
  } catch (error: any) {
    printResult('Handle empty content', false, error.message);
  }
  
  // Test 5.2: Whitespace only
  try {
    const blocks = contentToBlocks(samples.edgeCases.whitespaceOnly);
    printResult('Handle whitespace-only content', blocks.length === 0 || 
                (blocks.length === 1 && blocks[0].content.trim() === ''));
  } catch (error: any) {
    printResult('Handle whitespace-only content', false, error.message);
  }
  
  // Test 5.3: Prompt only
  try {
    const blocks = contentToBlocks(samples.edgeCases.promptOnly);
    printResult('Handle prompt-only content', blocks.length === 1 && blocks[0].type === 'prompt');
  } catch (error: any) {
    printResult('Handle prompt-only content', false, error.message);
  }
  
  // Test 5.4: Note only
  try {
    const blocks = contentToBlocks(samples.edgeCases.noteOnly);
    printResult('Handle note-only content', blocks.length === 1 && blocks[0].type === 'note');
  } catch (error: any) {
    printResult('Handle note-only content', false, error.message);
  }
  
  // Test 5.5: Nested tags
  try {
    const blocks = contentToBlocks(samples.edgeCases.nestedTags);
    printResult('Handle nested tags', blocks.length === 1 && 
                blocks[0].content.includes('<pg-note>fake note tag</pg-note>'));
  } catch (error: any) {
    printResult('Handle nested tags', false, error.message);
  }
  
  // Test 5.6: Broken tags
  try {
    const blocks = contentToBlocks(samples.edgeCases.brokenTags);
    printResult('Handle broken tags', blocks.length >= 1);
  } catch (error: any) {
    printResult('Handle broken tags', false, error.message);
  }
  
  // Test 5.7: Markdown heavy content
  try {
    const blocks = contentToBlocks(samples.edgeCases.markdownHeavy);
    const success = blocks.length === 2 && 
                    blocks[0].content.includes('# Markdown heading') &&
                    blocks[1].content.includes('> This is a blockquote');
    
    printResult('Handle markdown-heavy content', success);
  } catch (error: any) {
    printResult('Handle markdown-heavy content', false, error.message);
  }
  
  // Test 6: Backward compatibility (convert to legacy format)
  try {
    const legacyContent = migrateToLegacyFormat(samples.tagFormat);
    const success = legacyContent.includes('> This is a note block') && 
                    !legacyContent.includes('<pg-note>');
    
    printResult('Convert back to legacy format', success);
  } catch (error: any) {
    printResult('Convert back to legacy format', false, error.message);
  }
  
  console.log('\n🏁 Testing completed!');
}

// Run the tests
runTests(); 