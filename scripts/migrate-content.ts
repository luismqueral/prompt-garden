#!/usr/bin/env node

/**
 * Database Content Migration Script
 * 
 * This script converts all prompts in the database from the legacy format (with ">" prefixes)
 * to the new tag-based format (<pg-prompt> and <pg-note> tags).
 * 
 * Usage:
 * 1. Make sure your .env file contains proper Google Sheets credentials
 * 2. Run: `npx ts-node scripts/migrate-content.ts`
 */

import { getGoogleSheetsClient } from '../lib/googleSheets/auth';
import { GOOGLE_SHEETS_CONFIG } from '../lib/googleSheets/config';
import { getAllPrompts, updatePrompt } from '../lib/googleSheets/prompts';
import { migrateToTagFormat } from '../lib/utils/migration';

async function migrateDatabase() {
  console.log('🚀 Starting database migration...');
  
  try {
    // Get all prompts
    console.log('📚 Fetching all prompts from Google Sheets...');
    const allPrompts = await getAllPrompts();
    console.log(`✅ Found ${allPrompts.length} prompts to process.`);
    
    // Track progress
    let migratedCount = 0;
    let skippedCount = 0;
    let failedCount = 0;
    
    // Process each prompt
    for (const prompt of allPrompts) {
      try {
        // Skip if prompt is already in the new format
        if (prompt.content.includes('<pg-prompt>') || prompt.content.includes('<pg-note>')) {
          console.log(`⏩ Skipping prompt "${prompt.title}" (ID: ${prompt.id}) - already in new format.`);
          skippedCount++;
          continue;
        }
        
        // Check if the prompt has content to migrate
        if (!prompt.content.trim()) {
          console.log(`⏩ Skipping prompt "${prompt.title}" (ID: ${prompt.id}) - empty content.`);
          skippedCount++;
          continue;
        }
        
        // Migrate content
        console.log(`🔄 Migrating prompt "${prompt.title}" (ID: ${prompt.id})...`);
        const newContent = migrateToTagFormat(prompt.content);
        
        // Update prompt in database
        await updatePrompt(prompt.id, { content: newContent });
        
        migratedCount++;
        console.log(`✅ Successfully migrated prompt "${prompt.title}" (ID: ${prompt.id}).`);
      } catch (error) {
        failedCount++;
        console.error(`❌ Error migrating prompt "${prompt.title}" (ID: ${prompt.id}):`, error);
      }
    }
    
    // Summary
    console.log('\n=== Migration Summary ===');
    console.log(`✅ Successfully migrated: ${migratedCount}`);
    console.log(`⏩ Skipped (already migrated): ${skippedCount}`);
    console.log(`❌ Failed: ${failedCount}`);
    console.log(`📚 Total prompts: ${allPrompts.length}`);
    
    if (failedCount > 0) {
      console.error('⚠️ Some prompts failed to migrate. Please check the logs above.');
      process.exit(1);
    } else {
      console.log('🎉 Migration completed successfully!');
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ Error during migration:', error);
    process.exit(1);
  }
}

// Run the migration
migrateDatabase(); 