# Tag Format Migration Guide

## Overview

Prompt Garden now uses a new format for storing prompts and notes in the database. This document explains the changes and how to migrate existing data.

## Why Change the Format?

The previous format used `>` prefixes to indicate note blocks, which conflicted with Markdown blockquote syntax. This made it difficult to use blockquotes within notes. The new format uses explicit XML-style tags for clearer separation between prompt and note blocks.

## New Format

### Old Format (Legacy)

```
This is a prompt block.
It continues for multiple lines.

> This is a note block.
> It also continues for multiple lines.
> But it conflicts with markdown blockquotes.
```

### New Format (Tag-based)

```
<pg-prompt>
This is a prompt block.
It continues for multiple lines.
</pg-prompt>

<pg-note>
This is a note block.
It also continues for multiple lines.
And can include proper markdown blockquotes like:
> This is a blockquote in markdown
Without conflicting with the block type.
</pg-note>
```

## Benefits of the New Format

1. **No more conflicts with Markdown syntax** - You can use `>` for blockquotes within note blocks
2. **Clearer boundaries** - Each block has explicit start and end markers
3. **More extensible** - We can add more block types or attributes in the future
4. **Better handling of mixed content** - Blocks can be interleaved in any order
5. **More robust parsing** - Less chance of errors when parsing blocks

## Migration Process

### Automatic Migration

We've created a script to automatically migrate all existing prompts in the database:

```
npx ts-node scripts/migrate-content.ts
```

This script:
1. Fetches all prompts from Google Sheets
2. Converts content from the old format to the new format
3. Updates each prompt in the database
4. Provides a summary of migrated, skipped, and failed items

### Manual Migration

If you need to manually convert content:

```typescript
import { migrateToTagFormat } from '../lib/utils/migration';

// Convert from old format to new format
const newContent = migrateToTagFormat(oldContent);
```

## Implementation Details

The migration is implemented through several files:

1. **lib/utils/blockUtils.ts** - Modified to support both formats, with preference for the new format
2. **lib/utils/migration.ts** - Contains utilities for converting between formats
3. **scripts/migrate-content.ts** - Database migration script

## Backward Compatibility

The system maintains backward compatibility:

- Old format content is still properly parsed
- If needed, new format content can be converted back to the old format using `migrateToLegacyFormat()`

## Testing Considerations

When testing the new format:

1. Ensure both formats are correctly parsed into blocks
2. Verify that blocks are correctly saved in the new format
3. Test using markdown blockquotes within note blocks
4. Confirm that blocks can be interleaved in any order
5. Check edge cases like empty blocks, blocks with only whitespace, etc. 