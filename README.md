# 🪴 Prompt Garden

An assorted collection of LMM prompts for various use cases. Browse, create, and share effective prompts for AI language models.

## Features

- **Browse Prompts**: Explore a curated collection of effective prompts
- **Create Prompts**: Add your own prompts with a user-friendly editor
- **Remix Existing Prompts**: Build upon others' work to create variations
- **Rich Formatting**:
  - Variables in `[brackets]` are automatically styled
  - Support for follow-up prompts with visual indicators
  - Context notes for providing additional information
- **Tagging System**: Organize prompts with tags and categories
- **Keyboard Shortcuts**: Use Cmd+Enter (or Ctrl+Enter) to quickly submit prompts

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/luismqueral/prompt-garden.git
   cd prompt-garden
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

## Usage Guide

### Creating Prompts

1. Click the "+ Add Prompt" button in the header
2. Enter your prompt content in the editor
3. Use special syntax for enhanced formatting:
   - `[VARIABLE]` for variables (displayed in uppercase)
   - `> Note` for context notes (not visible on homepage cards)
   - `1. Follow-up` for follow-up prompts (with circle indicators)
4. Add relevant tags and categories
5. Click "Add Prompt" or use Cmd+Enter (Ctrl+Enter on Windows/Linux)

### Editing and Remixing

- Click on any prompt card to view details
- Click "Remix Prompt" to create your own version

## Technologies

- Next.js 15+
- React
- TailwindCSS
- CodeMirror for the prompt editor

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
