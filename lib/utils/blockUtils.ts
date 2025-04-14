import { Block } from '@/components/ui/block-editor';

/**
 * Convert a prompt string to an array of blocks
 * 
 * This function takes a prompt string and converts it to an array of prompt and note blocks.
 * 
 * Rules:
 * - Content within <pg-prompt>...</pg-prompt> tags is converted to prompt blocks
 * - Content within <pg-note>...</pg-note> tags is converted to note blocks
 * - Legacy format (lines starting with ">") is still supported for backward compatibility
 * 
 * @param content - The prompt content string
 * @returns An array of Block objects
 */
export function contentToBlocks(content: string): Block[] {
  if (!content) return [];
  
  const blocks: Block[] = [];
  
  // Check if the content uses the new tag format
  const hasPromptTags = content.includes('<pg-prompt>');
  const hasNoteTags = content.includes('<pg-note>');
  
  // If we have the new tag format, use it
  if (hasPromptTags || hasNoteTags) {
    // Parse content using tags
    let remainingContent = content;
    
    // Regular expressions to match blocks
    const promptRegex = /<pg-prompt>([\s\S]*?)<\/pg-prompt>/g;
    const noteRegex = /<pg-note>([\s\S]*?)<\/pg-note>/g;
    
    // Extract all prompt blocks
    let promptMatch;
    while ((promptMatch = promptRegex.exec(remainingContent)) !== null) {
      blocks.push({
        id: `block-${Date.now()}-${blocks.length}`,
        type: 'prompt',
        content: promptMatch[1].trim()
      });
    }
    
    // Extract all note blocks
    let noteMatch;
    while ((noteMatch = noteRegex.exec(remainingContent)) !== null) {
      blocks.push({
        id: `block-${Date.now()}-${blocks.length}`,
        type: 'note',
        content: noteMatch[1].trim()
      });
    }
    
    // Sort blocks by their position in the original content
    blocks.sort((a, b) => {
      const posA = content.indexOf(`<pg-${a.type}>`);
      const posB = content.indexOf(`<pg-${b.type}>`);
      return posA - posB;
    });
    
    return blocks;
  }
  
  // Legacy format parsing (using ">" prefix)
  const lines = content.split('\n');
  
  let currentType: 'prompt' | 'note' | null = null;
  let currentContent: string[] = [];
  
  // Process each line
  lines.forEach((line, index) => {
    // Determine if this is a note line (starting with >)
    const isNoteLine = line.trim().startsWith('>');
    const lineType = isNoteLine ? 'note' : 'prompt';
    
    // If we're starting a new block type
    if (lineType !== currentType) {
      // Save the previous block if we have content
      if (currentType && currentContent.length > 0) {
        blocks.push({
          id: `block-${Date.now()}-${blocks.length}`,
          type: currentType,
          content: currentContent.join('\n')
        });
      }
      
      // Start a new block
      currentType = lineType;
      currentContent = [];
    }
    
    // Add content to the current block, removing ">" prefix for notes
    if (isNoteLine) {
      currentContent.push(line.replace(/^>\s*/, ''));
    } else {
      currentContent.push(line);
    }
    
    // If this is the last line, add the final block
    if (index === lines.length - 1 && currentContent.length > 0) {
      blocks.push({
        id: `block-${Date.now()}-${blocks.length}`,
        type: currentType,
        content: currentContent.join('\n')
      });
    }
  });
  
  return blocks;
}

/**
 * Convert an array of blocks to a prompt string
 * 
 * This function takes an array of Block objects and converts them
 * to a string with XML-style tags to differentiate block types.
 * 
 * Rules:
 * - Prompt blocks are wrapped in <pg-prompt>...</pg-prompt> tags
 * - Note blocks are wrapped in <pg-note>...</pg-note> tags
 * - Blocks are separated by newlines
 * 
 * @param blocks - Array of Block objects
 * @returns A string representation of the blocks
 */
export function blocksToContent(blocks: Block[]): string {
  if (!blocks || blocks.length === 0) return '';
  
  return blocks.map((block) => {
    if (block.type === 'prompt') {
      return `<pg-prompt>\n${block.content}\n</pg-prompt>`;
    } else {
      return `<pg-note>\n${block.content}\n</pg-note>`;
    }
  }).join('\n\n');
} 