# Setting Up OpenRouter for Automatic Title Generation

This document explains how to set up OpenRouter integration for automatic title generation in Prompt Garden.

## What is OpenRouter?

[OpenRouter](https://openrouter.ai/) is a unified API that provides access to various large language models (LLMs) including Claude, GPT-4, and more. In Prompt Garden, we use OpenRouter to automatically generate descriptive titles for prompts when users don't specify them.

## Getting Started

1. **Create an OpenRouter Account**
   - Visit [OpenRouter](https://openrouter.ai/)
   - Sign up for an account

2. **Generate an API Key**
   - After signing in, navigate to your account settings
   - Generate a new API key
   - Copy the API key for later use

3. **Configure Prompt Garden**
   - Copy the `.env.local.example` file to `.env.local` if you haven't already
   - Add your OpenRouter API key to the environment variable:
     ```
     OPENROUTER_API_KEY=your_openrouter_api_key_here
     ```
   - Restart the development server for changes to take effect

## How It Works

When a user creates a new prompt without specifying a title (no "# Title" at the beginning), Prompt Garden will automatically:

1. Extract the content of the prompt
2. Send it to OpenRouter's API
3. Use Claude 3 Haiku to generate a concise, relevant title
4. Apply this title to the prompt instead of using "Untitled Prompt"

## Customization

You can modify the title generation behavior by editing:
- `/app/api/generate-title/route.ts` - Server-side API endpoint
- `/lib/api/titleGeneratorService.ts` - Client-side service

## Troubleshooting

If automatic title generation isn't working:

1. Check that your OpenRouter API key is correctly set in `.env.local`
2. Ensure the development server has been restarted after making changes
3. Check the browser console and server logs for any error messages
4. Verify your OpenRouter account has sufficient credits

## Security Considerations

The OpenRouter API key is stored as a server-side environment variable and is never exposed to the client. All API calls to OpenRouter are made server-side to maintain security. 