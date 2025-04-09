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
- **Google Sheets Integration**: Store all prompts in a Google Sheet for easy sharing and editing

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Google Cloud Platform account (for Google Sheets API)

### Setting up Google Sheets

1. Create a new Google Sheet in your Google Drive
2. Create a service account in Google Cloud Platform:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Navigate to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "Service Account"
   - Fill in the details and create the service account
   - Generate a new key (JSON format) for the service account
3. Share your Google Sheet with the service account email (with Editor permissions)
4. Enable Google Sheets API for your project in Google Cloud Console
5. Copy the values from your service account key JSON file to your `.env.local` file:
   ```
   GOOGLE_SHEET_ID=your_google_sheet_id_here
   GOOGLE_SERVICE_ACCOUNT_EMAIL=your_service_account_email@example.com
   GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour_Private_Key_Here\n-----END PRIVATE KEY-----\n"
   ```

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

3. Create a `.env.local` file with your Google Sheets credentials (see `.env.local.example` for reference)

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

6. Initialize the Google Sheets database by navigating to `/admin` in your browser and clicking the "Initialize Database" button.

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
- Google Sheets API for data storage

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Google Sheets Integration

This project uses Google Sheets as a database to store prompts, tags, and categories. The integration includes:

- Storage of prompts in a structured format
- Automatic tracking of tags and their usage count
- Support for categories to organize prompts

### Data Structure

The Google Sheets integration uses a specific data structure:

1. **Prompts Sheet**:
   - Columns: ID, Title, Content, Tags, Category, Created At, Updated At
   - Each prompt is stored in a single row
   - Tags are stored as comma-separated values

2. **Tags Sheet**:
   - Columns: Name, Count, Is Category
   - Tracks usage count of each tag
   - Flags whether a tag is also a category

### Troubleshooting

If you encounter data alignment issues, you can use the fix-data endpoint to realign your data:
```
curl http://localhost:3000/api/fix-data
```
This endpoint will reformat all prompts with proper column alignment.

## Test Automation

The project includes a test automation script that helps generate test data for development and testing purposes. The script can generate various types of prompts with different complexity levels and lengths.

### Using the Test Automation Script

```bash
./test-automation.sh [options]
```

### Options

- `--count N` - Generate N test prompts (default: 100)
- `--clean-test-data` - Clean all test data from the spreadsheet
- `--long-prompts` - Generate long content prompts for testing
- `--complexity LEVEL` - Set syntax complexity level (low, medium, high, extreme)
- `--help` - Display help message

### Examples

```bash
# Generate 500 standard test prompts
./test-automation.sh --count 500

# Generate prompts with varying lengths at medium complexity
./test-automation.sh --long-prompts

# Generate prompts with high syntax complexity
./test-automation.sh --complexity high

# Combined options: Generate both 50 standard prompts and long prompts with extreme complexity
./test-automation.sh --count 50 --long-prompts --complexity extreme

# Clean all test data from the spreadsheet
./test-automation.sh --clean-test-data
```

### Complexity Levels

The script supports four complexity levels for generating prompts:

- **Low**: Basic prompt structure with a few variables
- **Medium**: More variables, context notes, and follow-ups
- **High**: Many variables, context notes, follow-ups, and complex formatting
- **Extreme**: All syntax features extensively used, including complex nesting and formatting

This is particularly useful for testing the application's performance and rendering capabilities with different types of prompt content.
