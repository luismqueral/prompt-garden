# Prompt Garden Testing Strategy: Implementation Plan

## Step 1: Set Up the Testing Environment
1. Create a new file `test-data-generator.js` in the project root directory
2. Install required dependencies:
   ```bash
   npm install google-auth-library googleapis uuid @faker-js/faker dotenv
   ```

## Step 2: Implement the Generator Script
1. Copy the provided script code to `test-data-generator.js`
2. Ensure your `.env.local` file contains the required Google Sheets credentials:
   - `GOOGLE_SHEET_ID`
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   - `GOOGLE_PRIVATE_KEY`

## Step 3: Initialize the Database
1. Start the development server:
   ```bash
   npm run dev
   ```
2. Navigate to `http://localhost:3000/admin`
3. Click the "Initialize Database" button to set up the required sheets

## Step 4: Generate Test Data
1. Run the script with a small batch first to verify functionality:
   ```bash
   node test-data-generator.js --count=10
   ```
2. Check the Google Sheet to confirm data was added correctly
3. Scale up gradually:
   ```bash
   node test-data-generator.js --count=100
   node test-data-generator.js --count=500
   node test-data-generator.js --count=1000
   ```

## Step 5: Performance Testing
1. **Load Time Testing**:
   - Open Chrome DevTools (Network tab)
   - Measure initial load time with different data volumes
   - Record metrics in a spreadsheet (time-to-interactive, time-to-first-byte)

2. **UI Responsiveness**:
   - Test filtering by tag/category
   - Measure search response time with different queries
   - Check prompt rendering performance with large datasets

3. **Memory Usage**:
   - Monitor browser memory consumption in Chrome DevTools (Memory tab)
   - Record baseline and peak memory usage

## Step 6: Identify and Address Performance Bottlenecks
1. Check network requests for optimization opportunities
2. Implement pagination if needed
3. Consider client-side caching strategies
4. Add virtualized lists for large datasets

## Step 7: Extend Testing for Edge Cases
1. Modify the generator to create edge cases:
   ```javascript
   // Add to test-data-generator.js
   function generateEdgeCasePrompts() {
     return [
       // Very long prompt
       {
         title: "Extremely Long Prompt",
         content: faker.lorem.paragraphs(30),
         tags: ["long", "performance-test"],
         category: "Testing"
       },
       // Prompt with many tags
       {
         title: "Many Tags Prompt",
         content: "Test prompt with many tags",
         tags: TAGS,
         category: "Testing"
       },
       // Add more edge cases as needed
     ];
   }
   ```
2. Run edge case testing:
   ```bash
   node test-data-generator.js --mode=edge-cases
   ```

## Step 8: Document Findings
1. Create a performance testing report including:
   - Load times at different data volumes
   - UI responsiveness metrics
   - Identified bottlenecks
   - Recommendations for improvements

## Step 9: Clean Up Test Data (When Needed)
1. Add a cleanup function to the script:
   ```javascript
   // Add to test-data-generator.js
   async function cleanupTestData() {
     try {
       const sheets = await getGoogleSheetsClient();
       console.log("Cleaning up test data...");
       
       // Clear all data except headers in Prompts sheet
       await sheets.spreadsheets.values.clear({
         spreadsheetId: GOOGLE_SHEET_ID,
         range: 'Prompts!A2:G',
       });
       
       // Clear all data except headers in Tags sheet
       await sheets.spreadsheets.values.clear({
         spreadsheetId: GOOGLE_SHEET_ID,
         range: 'Tags!A2:C',
       });
       
       console.log("Test data cleanup completed successfully");
     } catch (error) {
       console.error("Error cleaning up test data:", error);
       throw error;
     }
   }
   ```
2. Run cleanup when needed:
   ```bash
   node test-data-generator.js --mode=cleanup
   ```

## Step 10: Automate Regular Testing
1. Create a simple shell script to run the tests regularly:
   ```bash
   # test-automation.sh
   #!/bin/bash
   echo "Running performance tests..."
   node test-data-generator.js --count=100 --mode=cleanup
   node test-data-generator.js --count=100
   echo "Tests completed."
   ```
2. Make the script executable:
   ```bash
   chmod +x test-automation.sh
   ```

## Script Implementation

Below is the complete implementation of the test data generator:

```javascript
// test-data-generator.js
const fs = require('fs');
const path = require('path');
const { JWT } = require('google-auth-library');
const { google } = require('googleapis');
const { v4: uuidv4 } = require('uuid');
const { faker } = require('@faker-js/faker');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// Configure Google Sheets API authentication
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n');
const GOOGLE_SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const GOOGLE_SHEET_ID = process.env.GOOGLE_SHEET_ID;

// Define the ranges
const PROMPTS_RANGE = 'Prompts!A:G';
const TAGS_RANGE = 'Tags!A:C';

// Categories and tags to use in generated data
const CATEGORIES = [
  'Writing', 'Programming', 'Marketing', 'Design', 
  'Education', 'Research', 'Productivity', 'Creativity'
];

const TAGS = [
  'code', 'tutorial', 'explanation', 'summary', 'analysis',
  'story', 'blog', 'email', 'social-media', 'report',
  'academic', 'business', 'technical', 'creative', 'conversational',
  'python', 'javascript', 'typescript', 'react', 'nextjs',
  'nodejs', 'ai', 'machine-learning', 'prompt-engineering'
];

// Helper function to generate a realistic prompt
function generatePrompt() {
  const usedTags = Array.from({ length: faker.number.int({ min: 1, max: 5 }) }, 
    () => faker.helpers.arrayElement(TAGS));
  
  const category = faker.helpers.arrayElement(CATEGORIES);
  
  // Generate different types of prompt content
  const promptTypes = [
    // Standard prompt with variables
    () => {
      return `I need you to ${faker.word.verb()} a ${faker.word.adjective()} ${faker.word.noun()} about [TOPIC]. 
      
Include the following sections:
1. Introduction to [TOPIC]
2. Key aspects of [TOPIC]
3. ${faker.word.adjective()} applications of [TOPIC]
4. Conclusion

> Note: This is for a ${faker.word.adjective()} audience with ${faker.word.adjective()} knowledge of the subject.

1. If I ask for revisions, please implement them promptly.
2. If I need specific examples, provide them with detailed explanations.`;
    },
    
    // Code-focused prompt
    () => {
      const languages = ['JavaScript', 'Python', 'TypeScript', 'React', 'HTML/CSS'];
      const language = faker.helpers.arrayElement(languages);
      
      return `Create a ${faker.word.adjective()} ${language} ${faker.word.noun()} that implements [FUNCTIONALITY].

The code should:
- Be well-commented
- Follow best practices for ${language}
- Handle edge cases
- Include [SPECIFIC_FEATURE]

> Note: Optimize for ${faker.helpers.arrayElement(['readability', 'performance', 'maintainability'])}.

1. First show the complete implementation
2. Then explain how it works`;
    },
    
    // Creative writing prompt
    () => {
      return `Write a ${faker.word.adjective()} [CONTENT_TYPE] about [SUBJECT] with the following characteristics:
      
- Tone: ${faker.word.adjective()}
- Length: ${faker.helpers.arrayElement(['short', 'medium', 'long'])}
- Style: ${faker.word.adjective()}
- Include [ELEMENT] as a key component

> Note: This should appeal to ${faker.word.adjective()} audiences.

1. If I ask for edits, please revise accordingly.`;
    }
  ];
  
  const contentGenerator = faker.helpers.arrayElement(promptTypes);
  
  return {
    id: uuidv4(),
    title: `${faker.word.adjective()} ${faker.word.noun()} ${faker.word.verb()}`,
    content: contentGenerator(),
    tags: [...new Set(usedTags)],
    category,
    createdAt: new Date(faker.date.past()).toISOString(),
    updatedAt: new Date().toISOString()
  };
}

// Function to generate edge cases
function generateEdgeCasePrompts() {
  return [
    // Very long prompt
    {
      id: uuidv4(),
      title: "Extremely Long Prompt",
      content: faker.lorem.paragraphs(30),
      tags: ["long", "performance-test"],
      category: "Testing",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    // Prompt with many tags
    {
      id: uuidv4(),
      title: "Many Tags Prompt",
      content: "Test prompt with many tags",
      tags: TAGS,
      category: "Testing",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    // Prompt with special characters
    {
      id: uuidv4(),
      title: "Special Characters Test",
      content: "Test with special characters: !@#$%^&*()_+<>?\\/|{}[]~`€£¥©®™℠",
      tags: ["special-chars", "test"],
      category: "Testing",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    // Empty content or minimal content
    {
      id: uuidv4(),
      title: "Minimal Content",
      content: "Test.",
      tags: ["minimal"],
      category: "Testing",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];
}

// Initialize the Google Sheets API client
async function getGoogleSheetsClient() {
  const auth = new JWT({
    email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: GOOGLE_PRIVATE_KEY,
    scopes: SCOPES,
  });

  return google.sheets({ version: 'v4', auth });
}

// Generate and add test prompts
async function addTestPrompts(count = 100) {
  try {
    console.log(`Generating ${count} test prompts...`);
    
    const sheets = await getGoogleSheetsClient();
    const generatedPrompts = [];
    const batchSize = 100;
    
    // Generate prompts in batches for better performance
    for (let i = 0; i < count; i += batchSize) {
      const currentBatchSize = Math.min(batchSize, count - i);
      console.log(`Generating batch ${i/batchSize + 1} (${currentBatchSize} prompts)...`);
      
      const batch = Array.from({ length: currentBatchSize }, () => {
        const prompt = generatePrompt();
        generatedPrompts.push(prompt);
        return [
          prompt.id,
          prompt.title,
          prompt.content,
          prompt.tags.join(', '),
          prompt.category,
          prompt.createdAt,
          prompt.updatedAt
        ];
      });
      
      await sheets.spreadsheets.values.append({
        spreadsheetId: GOOGLE_SHEET_ID,
        range: PROMPTS_RANGE,
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        requestBody: {
          values: batch,
        },
      });
      
      console.log(`Added ${currentBatchSize} prompts (${i + currentBatchSize}/${count} total)`);
    }
    
    // Update tag counts
    await updateTagCounts(generatedPrompts);
    
    console.log(`Successfully added ${count} test prompts!`);
    return generatedPrompts;
  } catch (error) {
    console.error('Error adding test prompts:', error);
    throw error;
  }
}

// Add edge case prompts
async function addEdgeCasePrompts() {
  try {
    console.log('Generating edge case prompts...');
    
    const sheets = await getGoogleSheetsClient();
    const edgeCases = generateEdgeCasePrompts();
    
    const batch = edgeCases.map(prompt => [
      prompt.id,
      prompt.title,
      prompt.content,
      prompt.tags.join(', '),
      prompt.category,
      prompt.createdAt,
      prompt.updatedAt
    ]);
    
    await sheets.spreadsheets.values.append({
      spreadsheetId: GOOGLE_SHEET_ID,
      range: PROMPTS_RANGE,
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: batch,
      },
    });
    
    // Update tag counts
    await updateTagCounts(edgeCases);
    
    console.log(`Successfully added ${edgeCases.length} edge case prompts!`);
    return edgeCases;
  } catch (error) {
    console.error('Error adding edge case prompts:', error);
    throw error;
  }
}

// Update tag counts based on the generated prompts
async function updateTagCounts(prompts) {
  try {
    const sheets = await getGoogleSheetsClient();
    
    // Calculate tag usage
    const tagCounts = {};
    const categorySet = new Set();
    
    prompts.forEach(prompt => {
      if (prompt.category) {
        categorySet.add(prompt.category);
      }
      
      prompt.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });
    
    // Add categories to tag counts
    Array.from(categorySet).forEach(category => {
      tagCounts[category] = (tagCounts[category] || 0);
    });
    
    // Format tag data for Google Sheets
    const tagData = Object.entries(tagCounts).map(([name, count]) => {
      const isCategory = CATEGORIES.includes(name);
      return [name, count.toString(), isCategory ? 'TRUE' : 'FALSE'];
    });
    
    // Clear existing tags data
    await sheets.spreadsheets.values.clear({
      spreadsheetId: GOOGLE_SHEET_ID,
      range: TAGS_RANGE,
    });
    
    // Insert header row
    await sheets.spreadsheets.values.append({
      spreadsheetId: GOOGLE_SHEET_ID,
      range: TAGS_RANGE,
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: [['name', 'count', 'isCategory']],
      },
    });
    
    // Add tag data
    await sheets.spreadsheets.values.append({
      spreadsheetId: GOOGLE_SHEET_ID,
      range: TAGS_RANGE,
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: tagData,
      },
    });
    
    console.log(`Updated counts for ${tagData.length} tags and categories`);
  } catch (error) {
    console.error('Error updating tag counts:', error);
    throw error;
  }
}

// Clean up test data
async function cleanupTestData() {
  try {
    const sheets = await getGoogleSheetsClient();
    console.log("Cleaning up test data...");
    
    // Clear all data except headers in Prompts sheet
    await sheets.spreadsheets.values.clear({
      spreadsheetId: GOOGLE_SHEET_ID,
      range: 'Prompts!A2:G',
    });
    
    // Clear all data except headers in Tags sheet
    await sheets.spreadsheets.values.clear({
      spreadsheetId: GOOGLE_SHEET_ID,
      range: 'Tags!A2:C',
    });
    
    console.log("Test data cleanup completed successfully");
  } catch (error) {
    console.error("Error cleaning up test data:", error);
    throw error;
  }
}

// Run the script
async function main() {
  try {
    // First, check if the database is initialized
    const sheets = await getGoogleSheetsClient();
    
    // Get spreadsheet info to check if the necessary sheets exist
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: GOOGLE_SHEET_ID,
    });
    
    const sheetNames = spreadsheet.data.sheets.map(sheet => sheet.properties.title);
    
    // Check if required sheets exist
    const requiredSheets = ['Prompts', 'Tags'];
    const missingSheets = requiredSheets.filter(sheet => !sheetNames.includes(sheet));
    
    if (missingSheets.length > 0) {
      console.error(`Error: Missing required sheets: ${missingSheets.join(', ')}`);
      console.log('Please initialize the database first using the admin interface.');
      return;
    }
    
    // Parse command line arguments
    const args = process.argv.slice(2);
    const countArg = args.find(arg => arg.startsWith('--count='));
    const modeArg = args.find(arg => arg.startsWith('--mode='));
    
    const count = countArg ? parseInt(countArg.split('=')[1], 10) : 100;
    const mode = modeArg ? modeArg.split('=')[1] : 'normal';
    
    if (mode === 'cleanup') {
      await cleanupTestData();
    } else if (mode === 'edge-cases') {
      await addEdgeCasePrompts();
    } else {
      // Add test prompts
      await addTestPrompts(count);
    }
  } catch (error) {
    console.error('Error running test data generator:', error);
  }
}

main();
```

## Performance Testing Metrics Template

Here's a template for documenting performance metrics:

| Test Case | Data Volume | Load Time (ms) | Memory Usage (MB) | Notes |
|-----------|-------------|----------------|-------------------|-------|
| Homepage | 10 prompts | | | |
| Homepage | 100 prompts | | | |
| Homepage | 500 prompts | | | |
| Homepage | 1000 prompts | | | |
| Filter by Tag | 100 prompts | | | |
| Filter by Tag | 1000 prompts | | | |
| Search | 100 prompts | | | |
| Search | 1000 prompts | | | |

## Conclusion

This implementation plan provides a comprehensive approach to test how well the Prompt Garden application scales with increasing amounts of data. By generating diverse prompt content, the testing strategy helps identify potential performance bottlenecks and ensures the application can handle real-world usage scenarios. 

The incremental approach to data generation allows for controlled testing at different volumes, while edge case testing ensures the application is robust against unusual inputs. Regular performance monitoring will help track improvements and regressions over time. 