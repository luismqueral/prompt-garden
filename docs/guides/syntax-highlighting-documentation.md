# Prompt Garden - Custom Syntax Highlighting

This document explains the custom syntax highlighting system implemented in Prompt Garden. The application provides specialized formatting for various syntax elements in prompts, both in the editor and when displaying prompts.

## Syntax Elements

Prompt Garden supports the following special syntax elements:

1. **Variables**: Text within `[square brackets]`
2. **Context Notes**: Lines beginning with `>`
3. **Numbered Items**: Lines beginning with numbers followed by a period (e.g., `1.`, `2.`)
4. **Follow-up Text**: Lines immediately following numbered items

## Implementation Overview

The syntax highlighting system consists of two main components:

1. **Display Highlighting**: Transforms plain text into styled React components when displaying prompts
2. **Editor Highlighting**: Custom CodeMirror extensions that provide syntax highlighting while editing

## Display Highlighting

When displaying prompts in the UI, the text is processed by two main functions:

### `highlightPromptSyntax()`

This function handles the overall processing of a prompt's text:

```typescript
const highlightPromptSyntax = (text: string): React.ReactNode[] => {
  if (!text) return [text];
  
  // First split by line to handle line-based highlighting
  const lines = text.split('\n');
  
  // Identify numbered lines and sequence terminators
  const numberedLines = new Set<number>();
  const sequenceEndLines = new Set<number>();
  
  lines.forEach((line, index) => {
    if (/^\d+\.\s+.*/.test(line)) {
      numberedLines.add(index);
    }
    
    // Consider these patterns as sequence terminators
    if (
      /^\d+\.\s+.*/.test(line) || // Another numbered item
      /^>/.test(line.trim()) || // A note line
      /^```/.test(line.trim()) || // Code block
      /^#/.test(line.trim()) // Heading
    ) {
      sequenceEndLines.add(index);
    }
  });
  
  // Process lines
  let inNumberedSequence = false;
  let currentSequenceStartLine = 0;
  
  return lines.map((line, lineIndex) => {
    // Check if this is a note line (starts with >)
    if (line.trim().startsWith('>')) {
      inNumberedSequence = false;
      return (
        <div key={`line-${lineIndex}`} className="block border-l-4 border-gray-300 bg-gray-50 text-gray-600 pl-2">
          {highlightVariableSyntax(line)}
        </div>
      );
    }
    
    // Handle numbered lines
    // ...rest of the function
  });
};
```

The function works by:

1. Splitting the text into lines
2. Identifying special lines (numbered items, notes)
3. Processing each line with appropriate styling
4. Tracking "numbered sequences" to properly style follow-up text
5. Calling `highlightVariableSyntax()` to handle variables within each line

### `highlightVariableSyntax()`

This function specifically handles the variable syntax:

```typescript
const highlightVariableSyntax = (text: string): React.ReactNode[] => {
  // Split text by [variable] pattern
  const parts = text.split(/(\[[^\]]+\])/g);
  
  if (parts.length === 1) {
    // No variables found
    return [text];
  }
  
  // Transform each part
  return parts.map((part, index) => {
    if (part.match(/^\[[^\]]+\]$/)) {
      // It's a variable in brackets - convert to uppercase and style
      const variableText = part.slice(1, -1).toUpperCase();
      return (
        <span key={index} className="text-emerald-700 font-medium uppercase">
          {variableText}
        </span>
      );
    }
    return part;
  });
};
```

The function:
1. Uses regex to split the text by variable patterns `[like this]`
2. Processes each part, applying special styling to variables
3. Returns an array of styled React nodes

## Visual Examples

### Variables

Plain text: `This is a [variable] in the text`

Rendered output:
```
This is a VARIABLE in the text
```

Where "VARIABLE" is displayed in green, uppercase, and medium font weight.

### Context Notes

Plain text:
```
> This is a context note
> It can span multiple lines
```

Rendered output:
```
│ This is a context note
│ It can span multiple lines
```

Where the lines are indented, have a left border, and lighter background.

### Numbered Items and Follow-ups

Plain text:
```
1. This is a numbered item
This is follow-up text that's part of item 1

2. This is another numbered item
More follow-up text
```

Rendered output:
```
1. This is a numbered item
   This is follow-up text that's part of item 1

2. This is another numbered item
   More follow-up text
```

Where:
- Numbered items have bold numbers
- Follow-up text is indented and styled differently (yellow background, left border)
- Empty lines within a sequence maintain the grouping

## Editor Highlighting

The CodeMirror editor uses custom extensions to provide real-time syntax highlighting:

```typescript
const variableSyntaxHighlighter = (
  hasTextAfterSequence: boolean,
  setHasTextAfterSequence: (value: boolean) => void
): Extension => {
  return EditorView.decorations.of(view => {
    const decorations = [];
    const content = view.state.doc.toString();
    
    // Match variables
    const variableRegex = /\[([^\]]+)\]/g;
    let match;
    
    while ((match = variableRegex.exec(content)) !== null) {
      const from = match.index;
      const to = from + match[0].length;
      
      decorations.push({
        from,
        to,
        value: Decoration.mark({
          attributes: {
            class: "cm-variable-syntax",
            style: "color: #047857; font-weight: 500; text-transform: uppercase;"
          }
        })
      });
    }
    
    // Process numbered sequences
    // ...additional logic for numbered items and follow-ups
    
    return Decoration.set(decorations);
  });
};
```

This creates a consistent editing experience where the text is styled in the editor the same way it will appear when displayed.

## Implementation Challenges

### Multi-Pass Text Processing

The syntax highlighting requires multiple passes through the text:

1. First pass: Identify special lines (numbered items, sequence terminators)
2. Second pass: Process each line with the appropriate styling
3. Variable processing: Within each line, identify and style variables

### State Tracking

The system needs to track state while processing:

- `inNumberedSequence`: Whether we're in a sequence of text following a numbered item
- `currentSequenceStartLine`: The line where the current sequence started
- `sequenceEndLines`: Set of lines that terminate sequences

### Integration with React

Transforming plain text into React components requires careful handling of keys and component hierarchies. Each line and variable is rendered as a separate React component with appropriate styling.

## Usage for Developers

### Adding a New Syntax Feature

To add a new syntax feature (e.g., highlighting text with asterisks):

1. Add detection logic in `highlightPromptSyntax()`
2. Add styling for the new syntax element
3. Update the editor extension in `variableSyntaxHighlighter()` to match
4. Add appropriate CSS classes or inline styles

### Modifying Existing Styles

To change the styling of an existing syntax element:

1. Locate the relevant section in `highlightPromptSyntax()`
2. Update the className or inline styles
3. Make corresponding changes in the editor extension

## Performance Considerations

The syntax highlighting system processes text line by line and character by character, which could become a performance issue with very large prompts. The implementation includes several optimizations:

1. Early returns when no special syntax is detected
2. Set data structures for efficient lookups
3. Single-pass processing where possible
4. Minimal re-renders by using stable keys for React components

For very large prompts, consider implementing virtualization or lazy rendering strategies to maintain performance. 