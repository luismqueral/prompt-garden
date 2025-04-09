// Export configuration
export * from './config';

// Export authentication
export * from './auth';

// Export prompt operations
export * from './prompts';

// Export tag operations
export * from './tags';

// Export setup functionality
export * from './setup';

// Export the debug functions
export { getRawPromptData } from './test-debug';

// Export a convenient API for external use
import { GOOGLE_SHEETS_CONFIG } from './config';
import { initializeGoogleSheet } from './setup';
import { getAllPrompts, getPromptById, addPrompt, updatePrompt, deletePrompt, getPromptsByTag, searchPrompts } from './prompts';
import { getAllTags, getCategories, updateTagCounts } from './tags';
import { Prompt } from './prompts';
import { Tag } from './tags';

// Re-export types
export type { Prompt, Tag };

// Export a single API object for easy access
export const GoogleSheetsAPI = {
  // Configuration
  config: GOOGLE_SHEETS_CONFIG,
  
  // Setup
  initialize: initializeGoogleSheet,
  
  // Prompt operations
  prompts: {
    getAll: getAllPrompts,
    getById: getPromptById,
    add: addPrompt,
    update: updatePrompt,
    delete: deletePrompt,
    getByTag: getPromptsByTag,
    search: searchPrompts,
  },
  
  // Tag operations
  tags: {
    getAll: getAllTags,
    getCategories,
    updateCounts: updateTagCounts,
  },
}; 