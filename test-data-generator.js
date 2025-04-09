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
const PROMPTS_RANGE = 'Prompts!A:H';  // Added column H for test_data flag
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
    updatedAt: new Date().toISOString(),
    test_data: true  // Flag to identify this as test data
  };
}

// Function to generate a very long prompt with specified paragraph count and syntax complexity
function generateLongPrompt(paragraphCount = 30, complexityLevel = 'medium') {
  // Base content is paragraphs of lorem ipsum
  let paragraphs = faker.lorem.paragraphs(paragraphCount, '\n\n');
  let title = `Long Prompt (${paragraphCount} paragraphs, ${complexityLevel} complexity)`;
  let tags = ["long", "performance-test", `paragraphs-${paragraphCount}`, `complexity-${complexityLevel}`];
  
  // Add syntax complexity based on the specified level
  switch (complexityLevel) {
    case 'low':
      // Add a few variables
      paragraphs = paragraphs.replace(/\b[a-zA-Z]{5,10}\b/g, (match, index) => {
        // Replace about 5% of words with variables
        return index % 20 === 0 ? `[${match.toUpperCase()}]` : match;
      });
      break;
      
    case 'medium':
      // Add more variables, some context notes, and a few follow-ups
      // Add variables (about 10% of 5-10 letter words)
      paragraphs = paragraphs.replace(/\b[a-zA-Z]{5,10}\b/g, (match, index) => {
        return index % 10 === 0 ? `[${match.toUpperCase()}]` : match;
      });
      
      // Add 2-3 context notes
      const notePositions = Array.from({ length: 3 }, () => 
        Math.floor(Math.random() * paragraphCount));
      
      paragraphs = paragraphs.split('\n\n').map((para, idx) => {
        if (notePositions.includes(idx)) {
          return para + '\n\n> Note: ' + faker.lorem.sentence();
        }
        return para;
      }).join('\n\n');
      
      // Add 2-3 follow-ups at the end
      paragraphs += '\n\n1. ' + faker.lorem.sentence();
      paragraphs += '\n\n2. ' + faker.lorem.sentence();
      break;
      
    case 'high':
      // Add many variables, context notes, follow-ups, and complex formatting
      // Add variables (about 20% of 5-10 letter words)
      paragraphs = paragraphs.replace(/\b[a-zA-Z]{5,10}\b/g, (match, index) => {
        return index % 5 === 0 ? `[${match.toUpperCase()}]` : match;
      });
      
      // Add 5-7 context notes throughout
      const highNotePositions = Array.from({ length: 7 }, () => 
        Math.floor(Math.random() * paragraphCount));
      
      paragraphs = paragraphs.split('\n\n').map((para, idx) => {
        if (highNotePositions.includes(idx)) {
          return para + '\n\n> Note: ' + faker.lorem.paragraph();
        }
        return para;
      }).join('\n\n');
      
      // Add 5-7 follow-ups at the end
      paragraphs += '\n\n1. ' + faker.lorem.paragraph();
      paragraphs += '\n\n2. ' + faker.lorem.paragraph();
      paragraphs += '\n\n3. ' + faker.lorem.paragraph();
      paragraphs += '\n\n4. ' + faker.lorem.paragraph();
      paragraphs += '\n\n5. ' + faker.lorem.paragraph();
      
      // Add some nested formatting
      paragraphs = paragraphs.replace(/\. /g, (match, index) => {
        // Add some nested formatting around 5% of sentences
        return index % 20 === 0 ? '.\n\n- ' + faker.lorem.sentence() + '\n- ' + faker.lorem.sentence() + '\n\n' : match;
      });
      break;
      
    case 'extreme':
      // Create a prompt that uses all possible syntax features extensively
      // Start with base content
      paragraphs = '';
      
      // Add a section with many variables
      paragraphs += "# Section with Many Variables\n\n";
      for (let i = 0; i < 10; i++) {
        const sentence = faker.lorem.sentence();
        // Replace most words with variables
        paragraphs += sentence.replace(/\b[a-zA-Z]{4,}\b/g, match => `[${match.toUpperCase()}]`) + '\n\n';
      }
      
      // Add a section with many context notes
      paragraphs += "# Section with Many Context Notes\n\n";
      for (let i = 0; i < 10; i++) {
        paragraphs += faker.lorem.paragraph() + '\n\n> Note: ' + faker.lorem.paragraph() + '\n\n';
      }
      
      // Add a section with many follow-ups
      paragraphs += "# Section with Many Follow-ups\n\n";
      paragraphs += faker.lorem.paragraphs(5) + '\n\n';
      for (let i = 1; i <= 15; i++) {
        paragraphs += `${i}. ${faker.lorem.paragraph()}\n\n`;
      }
      
      // Add a section with nested lists
      paragraphs += "# Section with Nested Lists\n\n";
      for (let i = 1; i <= 5; i++) {
        paragraphs += `${i}. ${faker.lorem.sentence()}\n`;
        for (let j = 1; j <= 3; j++) {
          paragraphs += `   - ${faker.lorem.sentence()}\n`;
          for (let k = 1; k <= 2; k++) {
            paragraphs += `      * ${faker.lorem.sentence()}\n`;
          }
        }
        paragraphs += '\n';
      }
      
      // Add normal paragraphs to reach the desired count
      if (paragraphCount > 40) {
        paragraphs += faker.lorem.paragraphs(paragraphCount - 40) + '\n\n';
      }
      
      // Add some final complexity with mixed syntax
      paragraphs += "# Final Complex Section\n\n";
      paragraphs += `This section combines [VARIABLES] with > Note: context notes\n\n`;
      paragraphs += `1. Follow-up with [NESTED_VARIABLES]\n\n`;
      paragraphs += `> Final note: This is an extremely complex prompt designed to test the limits of the rendering engine.`;
      
      break;
  }
  
  return {
    id: uuidv4(),
    title,
    content: paragraphs,
    tags,
    category: "Testing",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    test_data: true
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
      updatedAt: new Date().toISOString(),
      test_data: true
    },
    // Prompt with many tags
    {
      id: uuidv4(),
      title: "Many Tags Prompt",
      content: "Test prompt with many tags",
      tags: TAGS,
      category: "Testing",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      test_data: true
    },
    // Prompt with special characters
    {
      id: uuidv4(),
      title: "Special Characters Test",
      content: "Test with special characters: !@#$%^&*()_+<>?\\/|{}[]~`€£¥©®™℠",
      tags: ["special-chars", "test"],
      category: "Testing",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      test_data: true
    },
    // Empty content or minimal content
    {
      id: uuidv4(),
      title: "Minimal Content",
      content: "Test.",
      tags: ["minimal"],
      category: "Testing",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      test_data: true
    }
  ];
}

// Function to generate a variety of long prompts for specific testing
function generateLongPromptsTest() {
  const result = [];
  
  // Create prompts with different lengths and complexity levels
  const lengths = [5, 10, 20, 30, 50, 75, 100];
  const complexityLevels = ['low', 'medium', 'high', 'extreme'];
  
  // Generate one prompt for each length with medium complexity
  lengths.forEach(paragraphCount => {
    result.push(generateLongPrompt(paragraphCount, 'medium'));
  });
  
  // Generate 50-paragraph prompts with varying complexity levels
  complexityLevels.forEach(complexity => {
    result.push(generateLongPrompt(50, complexity));
  });
  
  // Add a few specific combinations that are likely to stress test the system
  result.push(generateLongPrompt(100, 'high'));    // Very long with high complexity
  result.push(generateLongPrompt(75, 'extreme'));  // Long with extreme complexity
  
  return result;
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
          prompt.updatedAt,
          'TRUE'  // test_data flag
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
      prompt.updatedAt,
      'TRUE'  // test_data flag
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

// Add variable length long prompts
async function addLongPrompts() {
  try {
    console.log('Generating long prompt test set...');
    
    const sheets = await getGoogleSheetsClient();
    const longPrompts = generateLongPromptsTest();
    
    const batch = longPrompts.map(prompt => [
      prompt.id,
      prompt.title,
      prompt.content,
      prompt.tags.join(', '),
      prompt.category,
      prompt.createdAt,
      prompt.updatedAt,
      'TRUE'  // test_data flag
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
    await updateTagCounts(longPrompts);
    
    console.log(`Successfully added ${longPrompts.length} long prompts with varying lengths!`);
    return longPrompts;
  } catch (error) {
    console.error('Error adding long prompts:', error);
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

// Clean up all test data
async function cleanupAllTestData() {
  try {
    const sheets = await getGoogleSheetsClient();
    console.log("Cleaning up all test data...");
    
    // Clear all data except headers in Prompts sheet
    await sheets.spreadsheets.values.clear({
      spreadsheetId: GOOGLE_SHEET_ID,
      range: 'Prompts!A2:H',
    });
    
    // Clear all data except headers in Tags sheet
    await sheets.spreadsheets.values.clear({
      spreadsheetId: GOOGLE_SHEET_ID,
      range: 'Tags!A2:C',
    });
    
    console.log("All test data cleanup completed successfully");
  } catch (error) {
    console.error("Error cleaning up test data:", error);
    throw error;
  }
}

// Clean up test data only (preserving real user data)
async function cleanupTestDataOnly() {
  try {
    console.log("Cleaning up flagged test data only...");
    
    // First, get all data from the Prompts sheet
    const sheets = await getGoogleSheetsClient();
    
    // Get all prompts
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: GOOGLE_SHEET_ID,
      range: 'Prompts!A2:H',
    });
    
    const rows = response.data.values || [];
    
    if (rows.length === 0) {
      console.log("No data found to clean up");
      return;
    }
    
    // Filter out test data and keep indices of real data
    const realDataRows = [];
    const testDataRows = [];
    
    rows.forEach((row, index) => {
      if (row.length > 7 && row[7] === 'TRUE') {
        testDataRows.push(index + 2); // +2 because of 1-indexing and header row
      } else {
        realDataRows.push(row);
      }
    });
    
    console.log(`Found ${testDataRows.length} test data rows to clean up`);
    
    if (testDataRows.length === 0) {
      console.log("No test data found to clean up");
      return;
    }
    
    // Clear all data
    await sheets.spreadsheets.values.clear({
      spreadsheetId: GOOGLE_SHEET_ID,
      range: 'Prompts!A2:H',
    });
    
    // Re-add only real data rows if there are any
    if (realDataRows.length > 0) {
      await sheets.spreadsheets.values.append({
        spreadsheetId: GOOGLE_SHEET_ID,
        range: 'Prompts!A2:H',
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        requestBody: {
          values: realDataRows,
        },
      });
    }
    
    // Recalculate tags based on remaining data
    const remainingPromptsResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: GOOGLE_SHEET_ID,
      range: 'Prompts!A2:H',
    });
    
    const remainingRows = remainingPromptsResponse.data.values || [];
    const remainingPrompts = remainingRows.map(row => {
      const tagsString = row[3] || '';
      return {
        category: row[4] || '',
        tags: tagsString.split(',').map(tag => tag.trim()).filter(tag => tag),
      };
    });
    
    // Recalculate tag counts
    const tagCounts = {};
    const categorySet = new Set();
    
    remainingPrompts.forEach(prompt => {
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
      range: 'Tags!A2:C',
    });
    
    // Insert header row if needed (in case it was cleared)
    await sheets.spreadsheets.values.append({
      spreadsheetId: GOOGLE_SHEET_ID,
      range: 'Tags!A1:C1',
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: [['name', 'count', 'isCategory']],
      },
    });
    
    // Add tag data
    if (tagData.length > 0) {
      await sheets.spreadsheets.values.append({
        spreadsheetId: GOOGLE_SHEET_ID,
        range: 'Tags!A2:C',
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        requestBody: {
          values: tagData,
        },
      });
    }
    
    console.log(`Test data cleanup completed successfully. Preserved ${realDataRows.length} real data rows.`);
  } catch (error) {
    console.error("Error cleaning up test data:", error);
    throw error;
  }
}

// Initialize prompts sheet with test_data column if needed
async function ensureTestDataColumn() {
  try {
    const sheets = await getGoogleSheetsClient();
    
    // Get spreadsheet info to check if the necessary sheets exist
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: GOOGLE_SHEET_ID,
    });
    
    // Get the header row to see if we need to add the test_data column
    const headerResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: GOOGLE_SHEET_ID,
      range: 'Prompts!A1:H1',
    });
    
    const headerRow = headerResponse.data.values && headerResponse.data.values[0];
    
    if (!headerRow || headerRow.length < 8 || headerRow[7] !== 'test_data') {
      console.log("Adding test_data column to Prompts sheet");
      
      // Append the test_data header
      await sheets.spreadsheets.values.update({
        spreadsheetId: GOOGLE_SHEET_ID,
        range: 'Prompts!H1',
        valueInputOption: 'RAW',
        requestBody: {
          values: [['test_data']]
        },
      });
      
      // Mark existing data as not test data
      const dataResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: GOOGLE_SHEET_ID,
        range: 'Prompts!A2:G',
      });
      
      const existingRows = dataResponse.data.values || [];
      
      if (existingRows.length > 0) {
        // For each existing row, add FALSE for test_data
        for (let i = 0; i < existingRows.length; i++) {
          const rowIndex = i + 2; // +2 because of 1-indexing and header row
          
          await sheets.spreadsheets.values.update({
            spreadsheetId: GOOGLE_SHEET_ID,
            range: `Prompts!H${rowIndex}`,
            valueInputOption: 'RAW',
            requestBody: {
              values: [['FALSE']]
            },
          });
        }
      }
      
      console.log("Added test_data column and marked existing data as non-test data");
    } else {
      console.log("test_data column already exists");
    }
    
    return true;
  } catch (error) {
    console.error("Error ensuring test_data column:", error);
    return false;
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
    
    // Ensure test_data column exists
    await ensureTestDataColumn();
    
    // Parse command line arguments
    const args = process.argv.slice(2);
    
    // Check for --clean mode
    if (args.includes('--clean')) {
      await cleanupTestDataOnly();
      return;
    }
    
    // Parse count parameter
    const countArg = args.find(arg => arg.startsWith('--count=')) || args[args.indexOf('--count') + 1];
    const count = countArg && !countArg.startsWith('--') ? 
      parseInt(countArg.includes('=') ? countArg.split('=')[1] : countArg, 10) : 100;
    
    // Check for complexity level
    const complexityArg = args.find(arg => arg.startsWith('--complexity=')) || 
      (args.includes('--complexity') ? args[args.indexOf('--complexity') + 1] : null);
    
    const complexityLevel = complexityArg && !complexityArg.startsWith('--') ? 
      (complexityArg.includes('=') ? complexityArg.split('=')[1] : complexityArg) : 'medium';
    
    // Check for long-prompts mode
    if (args.includes('--long-prompts')) {
      console.log(`Generating long prompts with ${complexityLevel} complexity level`);
      
      // Generate long prompts with specified complexity
      const longPrompts = [];
      const lengths = [5, 10, 20, 30, 50, 75, 100];
      
      // Generate prompts with different lengths at specified complexity
      lengths.forEach(paragraphCount => {
        longPrompts.push(generateLongPrompt(paragraphCount, complexityLevel));
      });
      
      // Add specific combination that is likely to stress test the system
      if (complexityLevel === 'high' || complexityLevel === 'extreme') {
        longPrompts.push(generateLongPrompt(100, complexityLevel));
      }
      
      // Add the long prompts to the spreadsheet
      const sheets = await getGoogleSheetsClient();
      const batch = longPrompts.map(prompt => [
        prompt.id,
        prompt.title,
        prompt.content,
        prompt.tags.join(', '),
        prompt.category,
        prompt.createdAt,
        prompt.updatedAt,
        'TRUE'  // test_data flag
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
      await updateTagCounts(longPrompts);
      
      console.log(`Successfully added ${longPrompts.length} long prompts with ${complexityLevel} complexity!`);
      
      // Also generate standard test prompts if count was specified
      if (args.includes('--count')) {
        console.log(`Also generating ${count} standard test prompts...`);
        await addTestPrompts(count);
      }
    } else {
      // Add standard test prompts
      await addTestPrompts(count);
    }
  } catch (error) {
    console.error('Error running test data generator:', error);
    process.exit(1);
  }
}

main(); 