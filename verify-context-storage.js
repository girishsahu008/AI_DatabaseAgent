#!/usr/bin/env node

/**
 * Quick verification script to check context storage location and functionality
 */

import { ContextManager } from './src/tools/contextManager.js';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔍 Verifying Context Storage Setup\n');
console.log('='.repeat(60));

// Check directory location
const cm = new ContextManager();
const contextsDir = cm.contextsDir;
const dirExists = existsSync(contextsDir);

console.log('\n📁 Storage Location:');
console.log(`   Directory: ${contextsDir}`);
console.log(`   Exists: ${dirExists ? '✅ YES' : '❌ NO'}`);

if (dirExists) {
  const { readdirSync, statSync } = await import('fs');
  try {
    const files = readdirSync(contextsDir).filter(f => f.endsWith('.json'));
    console.log(`   Files found: ${files.length}`);
    
    if (files.length > 0) {
      console.log('\n📄 Saved Contexts:');
      files.forEach((file, index) => {
        const filePath = join(contextsDir, file);
        const stats = statSync(filePath);
        const size = (stats.size / 1024).toFixed(2);
        console.log(`   ${index + 1}. ${file} (${size} KB)`);
      });
    } else {
      console.log('\n   ℹ️  No contexts saved yet.');
      console.log('   💡 To save a context, use the save_chat_context tool in Claude Desktop');
    }
  } catch (error) {
    console.log(`   ⚠️  Error reading directory: ${error.message}`);
  }
} else {
  console.log('\n   ⚠️  Directory will be created when you first save a context');
}

console.log('\n' + '='.repeat(60));
console.log('\n✅ Verification Complete!');
console.log('\n📝 Next Steps:');
console.log('   1. Start your MCP server: npm start');
console.log('   2. In Claude Desktop, execute some queries');
console.log('   3. Save a context using: save_chat_context tool');
console.log('   4. Check this directory again to see saved contexts');
console.log(`\n   Directory: ${contextsDir}\n`);

