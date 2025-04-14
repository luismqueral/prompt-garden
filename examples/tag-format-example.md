# Tag Format Example

This file demonstrates the new tag-based format for prompts and notes in Prompt Garden.

## Example 1: Simple Prompt and Note

<pg-prompt>
You are a helpful assistant. Please provide a concise answer to the user's question.
</pg-prompt>

<pg-note>
This is a simple system prompt that instructs the AI to be helpful and concise.
It doesn't specify any specific role or domain expertise.
</pg-note>

## Example 2: Markdown in Notes

<pg-prompt>
You are a culinary expert specializing in Italian cuisine. Provide authentic recipes 
and cooking techniques when asked about Italian dishes. Include traditional methods 
and ingredient substitutions when appropriate.
</pg-prompt>

<pg-note>
This prompt creates a culinary expert persona with:
- Specific focus on **Italian cuisine**
- Instructions to include:
  1. Authentic recipes
  2. Traditional cooking techniques
  3. Ingredient substitutions

> Note: The AI will stay focused on Italian cooking and may not have expertise in other cuisines.
</pg-note>

## Example 3: Multiple Blocks

<pg-prompt>
You are a programming tutor specializing in Python.
</pg-prompt>

<pg-note>
This establishes the basic role as a Python teacher.
</pg-note>

<pg-prompt>
When explaining code concepts, always provide working examples that demonstrate the principle.
Use clear comments and follow PEP 8 style guidelines.
</pg-prompt>

<pg-note>
This second prompt block adds specific instructions about:
- Including working code examples
- Using clear comments
- Following PEP 8 style
> This is a blockquote with a reference to **PEP 8** that demonstrates markdown works inside notes.
</pg-note>

## When to Use Each Block Type

- Use **Prompt Blocks** (`<pg-prompt>...</pg-prompt>`) for actual content that will be sent to the AI
- Use **Note Blocks** (`<pg-note>...</pg-note>`) for:
  - Documentation
  - Explanations
  - Usage guidance
  - Context that shouldn't be included in the prompt

## Benefits of the New Format

1. **Clear separation** between prompts and notes
2. **Support for Markdown** in notes, including blockquotes (`>`)
3. **Improved readability** with explicit tags
4. **More flexibility** in organizing your prompt content

For more information, see the [Tag Format Migration Guide](../docs/tag-format-migration.md). 