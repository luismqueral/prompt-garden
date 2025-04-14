import { Block } from '@/components/ui/block-editor';

/**
 * Convert legacy content to the new tag-based format
 * 
 * This function takes content in the old format (with ">" prefixes for notes)
 * and converts it to the new format using <pg-prompt> and <pg-note> tags.
 * 
 * @param content - The legacy content string
 * @returns Content string in the new tag-based format
 */
export function migrateToTagFormat(content: string): string {
  if (!content) return '';
  
  // Check if content already uses the new format
  if (content.includes('<pg-prompt>') || content.includes('<pg-note>')) {
    return content; // Already in new format
  }
  
  const lines = content.split('\n');
  const blocks: { type: 'prompt' | 'note'; content: string[] }[] = [];
  
  let currentType: 'prompt' | 'note' | null = null;
  let currentContent: string[] = [];
  
  // Process each line to identify blocks
  lines.forEach((line, index) => {
    const isNoteLine = line.trim().startsWith('>');
    const lineType = isNoteLine ? 'note' : 'prompt';
    
    // If starting a new block type
    if (lineType !== currentType) {
      // Save previous block if it has content
      if (currentType && currentContent.length > 0) {
        blocks.push({
          type: currentType,
          content: currentContent
        });
      }
      
      // Start new block
      currentType = lineType;
      currentContent = [];
    }
    
    // Add content to current block
    if (isNoteLine) {
      currentContent.push(line.replace(/^>\s*/, ''));
    } else {
      currentContent.push(line);
    }
    
    // If this is the last line, add the final block
    if (index === lines.length - 1 && currentContent.length > 0) {
      blocks.push({
        type: currentType,
        content: currentContent
      });
    }
  });
  
  // Convert blocks to the new tag format
  return blocks.map(block => {
    if (block.type === 'prompt') {
      return `<pg-prompt>\n${block.content.join('\n')}\n</pg-prompt>`;
    } else {
      return `<pg-note>\n${block.content.join('\n')}\n</pg-note>`;
    }
  }).join('\n\n');
}

/**
 * Convert tag-based content back to legacy format
 * 
 * This function takes content in the new tag-based format and converts it
 * back to the legacy format (with ">" prefixes for notes). This can be
 * useful for backward compatibility with older systems.
 * 
 * @param content - The tag-based content string
 * @returns Content string in the legacy format
 */
export function migrateToLegacyFormat(content: string): string {
  if (!content) return '';
  
  // Check if content is already in legacy format (doesn't use tags)
  if (!content.includes('<pg-prompt>') && !content.includes('<pg-note>')) {
    return content; // Already in legacy format
  }
  
  // Extract blocks using regular expressions
  const blocks: { type: 'prompt' | 'note'; content: string }[] = [];
  
  // Match prompt blocks
  const promptRegex = /<pg-prompt>([\s\S]*?)<\/pg-prompt>/g;
  let promptMatch;
  while ((promptMatch = promptRegex.exec(content)) !== null) {
    blocks.push({
      type: 'prompt',
      content: promptMatch[1].trim()
    });
  }
  
  // Match note blocks
  const noteRegex = /<pg-note>([\s\S]*?)<\/pg-note>/g;
  let noteMatch;
  while ((noteMatch = noteRegex.exec(content)) !== null) {
    blocks.push({
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
  
  // Convert blocks to legacy format
  return blocks.map(block => {
    if (block.type === 'prompt') {
      return block.content;
    } else {
      // For note blocks, prefix each line with ">"
      return block.content
        .split('\n')
        .map(line => `> ${line}`)
        .join('\n');
    }
  }).join('\n\n');
} 