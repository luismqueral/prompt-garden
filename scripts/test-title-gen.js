/**
 * Test script for title generation API
 * 
 * This script tests the API endpoint directly without going through the UI
 */

async function testTitleGeneration() {
  console.log('Starting title generation test...');
  
  const testContent = `
This is a test prompt content.

I would like to generate a great email template for customer service.
It should be professional but friendly, and include placeholders for:
- Customer name
- Order number
- Issue description
- Resolution steps
  `;
  
  const apiUrl = typeof window !== 'undefined' 
    ? '/api/generate-title'  // Browser environment
    : 'http://localhost:3001/api/generate-title';  // Node.js environment
  
  try {
    console.log(`Making API request to ${apiUrl}...`);
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content: testContent }),
    });
    
    console.log('Response status:', response.status);
    
    const data = await response.json();
    console.log('Response data:', data);
    
    if (data.success && data.title) {
      console.log('Success! Generated title:', data.title);
    } else {
      console.error('Title generation failed:', data.message || 'Unknown error');
    }
  } catch (error) {
    console.error('Error making API request:', error);
  }
}

// Run the test automatically in Node.js but not in browser
if (typeof window === 'undefined') {
  testTitleGeneration();
}

// Export the function so it can be called in browser console:
// test.testTitleGeneration()
if (typeof window !== 'undefined') {
  window.test = { testTitleGeneration };
}

// Note: Run this with Node.js using:
// node scripts/test-title-gen.js
//
// Or in browser console:
// 1. Add <script src="/scripts/test-title-gen.js"></script> to your HTML
// 2. Open browser console and run: test.testTitleGeneration() 