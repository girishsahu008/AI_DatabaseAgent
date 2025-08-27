#!/usr/bin/env node

import { config } from 'dotenv';
import { DatabaseManager } from './src/database/databaseManager.js';
import { writeFileSync } from 'fs';
import { join } from 'path';

// Load environment variables from config.env
config({ path: './config.env' });

console.log('🧹 Generating Clean Schema (Excluding Abp Tables)...\n');

async function generateCleanSchema() {
  try {
    // Initialize database manager
    const databaseManager = new DatabaseManager();
    await databaseManager.initialize();
    
    const client = await databaseManager.getClient();
    
    console.log('1️⃣ Getting business tables (excluding Abp)...');
    
    // Get only business tables, excluding Abp and migration tables
    const tablesQuery = `
      SELECT 
        t.table_name,
        obj_description(c.oid) as table_description
      FROM information_schema.tables t
      JOIN pg_class c ON c.relname = t.table_name
      WHERE t.table_schema = 'public'
      AND t.table_type = 'BASE TABLE'
      AND t.table_name NOT LIKE 'Abp%'
      AND t.table_name NOT LIKE '__EFMigrationsHistory'
      AND t.table_name NOT LIKE '%Migration%'
      AND t.table_name NOT LIKE '%Backup%'
      ORDER BY t.table_name;
    `;
    
    const tablesResult = await client.query(tablesQuery);
    console.log(`✅ Found ${tablesResult.rows.length} business tables`);
    
    console.log('\n2️⃣ Building schema cache (continuing on errors)...');
    
    const schemaInfo = {
      tables: [],
      totalTables: tablesResult.rows.length,
      successfulTables: 0,
      failedTables: 0,
      errors: []
    };

    // Process each table with error resilience
    for (let i = 0; i < tablesResult.rows.length; i++) {
      const table = tablesResult.rows[i];
      console.log(`  📋 Processing ${i + 1}/${tablesResult.rows.length}: ${table.table_name}`);
      
      try {
        // Get basic table info
        const tableInfo = {
          name: table.table_name,
          description: table.table_description || 'No description available',
          rowCount: null,
          columns: [],
          primaryKeys: [],
          foreignKeys: [],
          indexes: []
        };
        
        // Try to get row count - continue if fails
        try {
          const rowCountQuery = `SELECT COUNT(*) as row_count FROM "${table.table_name}";`;
          const rowCountResult = await client.query(rowCountQuery);
          tableInfo.rowCount = parseInt(rowCountResult.rows[0].row_count);
          console.log(`    ✅ Row count: ${tableInfo.rowCount.toLocaleString()}`);
        } catch (error) {
          console.log(`    ⚠️  Row count failed: ${error.message} - continuing...`);
        }
        
        // Try to get columns - continue if fails
        try {
          const columnsQuery = `
            SELECT 
              c.column_name,
              c.data_type,
              c.is_nullable,
              c.column_default,
              c.character_maximum_length,
              c.numeric_precision,
              c.numeric_scale
            FROM information_schema.columns c
            WHERE c.table_name = $1
            AND c.table_schema = 'public'
            ORDER BY c.ordinal_position;
          `;
          
          const columnsResult = await client.query(columnsQuery, [table.table_name]);
          tableInfo.columns = columnsResult.rows.map(col => ({
            name: col.column_name,
            type: col.data_type,
            nullable: col.is_nullable === 'YES',
            defaultValue: col.column_default,
            maxLength: col.character_maximum_length,
            precision: col.numeric_precision,
            scale: col.numeric_scale,
          }));
          console.log(`    ✅ Columns: ${tableInfo.columns.length} found`);
        } catch (error) {
          console.log(`    ⚠️  Columns failed: ${error.message} - continuing...`);
        }
        
        // Try to get primary keys - continue if fails
        try {
          const primaryKeyQuery = `
            SELECT kcu.column_name
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu
              ON tc.constraint_name = kcu.constraint_name
              AND tc.table_schema = kcu.table_schema
            WHERE tc.constraint_type = 'PRIMARY KEY'
              AND tc.table_name = $1;
          `;
          
          const primaryKeyResult = await client.query(primaryKeyQuery, [table.table_name]);
          tableInfo.primaryKeys = primaryKeyResult.rows.map(pk => pk.column_name);
          if (tableInfo.primaryKeys.length > 0) {
            console.log(`    ✅ Primary keys: ${tableInfo.primaryKeys.join(', ')}`);
          }
        } catch (error) {
          console.log(`    ⚠️  Primary keys failed: ${error.message} - continuing...`);
        }
        
        // Try to get foreign keys - continue if fails
        try {
          const foreignKeyQuery = `
            SELECT
              tc.constraint_name,
              kcu.column_name,
              ccu.table_name AS foreign_table_name,
              ccu.column_name AS foreign_column_name
            FROM information_schema.table_constraints AS tc
            JOIN information_schema.key_column_usage AS kcu
              ON tc.constraint_name = kcu.constraint_name
              AND tc.table_schema = kcu.table_schema
            JOIN information_schema.constraint_column_usage AS ccu
              ON ccu.constraint_name = tc.constraint_name
              AND tc.table_schema = tc.table_schema
            WHERE tc.constraint_type = 'FOREIGN KEY'
              AND tc.table_name = $1;
          `;
          
          const foreignKeyResult = await client.query(foreignKeyQuery, [table.table_name]);
          tableInfo.foreignKeys = foreignKeyResult.rows.map(fk => ({
            constraintName: fk.constraint_name,
            column: fk.column_name,
            referencesTable: fk.foreign_table_name,
            referencesColumn: fk.foreign_column_name,
          }));
          if (tableInfo.foreignKeys.length > 0) {
            console.log(`    ✅ Foreign keys: ${tableInfo.foreignKeys.length} found`);
          }
        } catch (error) {
          console.log(`    ⚠️  Foreign keys failed: ${error.message} - continuing...`);
        }
        
        // Try to get indexes - continue if fails
        try {
          const indexesQuery = `
            SELECT 
              i.relname as index_name,
              a.attname as column_name,
              ix.indisunique as is_unique,
              ix.indisprimary as is_primary
            FROM pg_class t
            JOIN pg_index ix ON t.oid = ix.indrelid
            JOIN pg_class i ON ix.indexrelid = i.oid
            JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
            WHERE t.relname = $1
            ORDER BY i.relname, a.attnum;
          `;
          
          const indexesResult = await client.query(indexesQuery, [table.table_name]);
          tableInfo.indexes = indexesResult.rows.map(idx => ({
            name: idx.index_name,
            column: idx.column_name,
            isUnique: idx.is_unique,
            isPrimary: idx.is_primary,
          }));
          if (tableInfo.indexes.length > 0) {
            console.log(`    ✅ Indexes: ${tableInfo.indexes.length} found`);
          }
        } catch (error) {
          console.log(`    ⚠️  Indexes failed: ${error.message} - continuing...`);
        }
        
        schemaInfo.tables.push(tableInfo);
        schemaInfo.successfulTables++;
        console.log(`    ✅ Table processed successfully`);
        
      } catch (error) {
        console.log(`    ❌ Table failed completely: ${error.message}`);
        schemaInfo.failedTables++;
        schemaInfo.errors.push({
          table: table.table_name,
          error: error.message
        });
        
        // Still add basic table info even if everything failed
        schemaInfo.tables.push({
          name: table.table_name,
          description: table.table_description || 'No description available',
          rowCount: null,
          columns: [],
          primaryKeys: [],
          foreignKeys: [],
          indexes: [],
          error: `Failed to get detailed information: ${error.message}`,
        });
      }
    }
    
    console.log('\n3️⃣ Saving schema cache...');
    
    // Save to cache file
    const cacheData = {
      timestamp: Date.now(),
      schema: schemaInfo
    };
    
    const cacheFile = join(process.cwd(), 'schema-cache.json');
    writeFileSync(cacheFile, JSON.stringify(cacheData, null, 2));
    console.log(`✅ Schema cache saved to: ${cacheFile}`);
    
    console.log('\n4️⃣ Generating documentation...');
    
    // Generate markdown documentation
    let markdown = `# Textile ERP System Database Schema Documentation

Generated on: ${new Date().toLocaleString()}
Total Tables: ${schemaInfo.totalTables}
Successfully Analyzed: ${schemaInfo.successfulTables}
Failed to Analyze: ${schemaInfo.failedTables}

## Table of Contents

`;
    
    // Generate table of contents
    schemaInfo.tables.forEach((table, index) => {
      markdown += `${index + 1}. [${table.name}](#${table.name.toLowerCase().replace(/[^a-z0-9]/g, '-')})\n`;
    });
    
    markdown += `\n---\n\n`;
    
    // Generate detailed table documentation
    schemaInfo.tables.forEach((table, index) => {
      markdown += `## ${index + 1}. ${table.name}\n\n`;
      
      // Add error notice if table has issues
      if (table.error) {
        markdown += `⚠️ **Note**: This table could not be fully analyzed due to: ${table.error}\n\n`;
      }
      
      markdown += `**Description**: ${table.description}\n`;
      if (table.rowCount !== null) {
        markdown += `**Row Count**: ${table.rowCount.toLocaleString()}\n`;
      }
      markdown += `**Column Count**: ${table.columns.length}\n\n`;
      
      // Columns section
      if (table.columns && table.columns.length > 0) {
        markdown += `### Columns\n\n`;
        markdown += `| Column Name | Data Type | Nullable | Default |\n`;
        markdown += `|-------------|-----------|----------|---------|\n`;
        
        table.columns.forEach(column => {
          const nullable = column.nullable ? 'Yes' : 'No';
          const defaultValue = column.defaultValue || 'None';
          markdown += `| ${column.name} | ${column.type} | ${nullable} | ${defaultValue} |\n`;
        });
        markdown += `\n`;
      }
      
      // Primary keys
      if (table.primaryKeys && table.primaryKeys.length > 0) {
        markdown += `### Primary Keys\n\n`;
        table.primaryKeys.forEach(pk => {
          markdown += `- ${pk}\n`;
        });
        markdown += `\n`;
      }
      
      // Foreign keys
      if (table.foreignKeys && table.foreignKeys.length > 0) {
        markdown += `### Foreign Key Relationships\n\n`;
        markdown += `| Column | References Table | References Column |\n`;
        markdown += `|--------|------------------|-------------------|\n`;
        
        table.foreignKeys.forEach(fk => {
          markdown += `| ${fk.column} | ${fk.referencesTable} | ${fk.referencesColumn} |\n`;
        });
        markdown += `\n`;
      }
      
      // Indexes
      if (table.indexes && table.indexes.length > 0) {
        markdown += `### Indexes\n\n`;
        markdown += `| Index Name | Column | Type |\n`;
        markdown += `|-------------|--------|------|\n`;
        
        table.indexes.forEach(idx => {
          let type = 'Regular';
          if (idx.isPrimary) type = 'Primary Key';
          else if (idx.isUnique) type = 'Unique';
          
          markdown += `| ${idx.name} | ${idx.column} | ${type} |\n`;
        });
        markdown += `\n`;
      }
      
      markdown += `---\n\n`;
    });
    
    // Add error summary if any tables failed
    if (schemaInfo.errors && schemaInfo.errors.length > 0) {
      markdown += `\n## Tables with Analysis Errors\n\nThe following tables could not be fully analyzed:\n\n`;
      schemaInfo.errors.forEach(error => {
        markdown += `- **${error.table}**: ${error.error}\n`;
      });
    }
    
    // Save documentation
    const docsFile = join(process.cwd(), 'schema_explained.md');
    writeFileSync(docsFile, markdown);
    console.log(`✅ Documentation saved to: ${docsFile}`);
    
    console.log('\n🎉 Clean schema generation completed!');
    console.log(`\n📊 Summary:`);
    console.log(`   - Total Tables: ${schemaInfo.totalTables}`);
    console.log(`   - Successful: ${schemaInfo.successfulTables}`);
    console.log(`   - Failed: ${schemaInfo.failedTables}`);
    console.log(`\n📁 Generated files:`);
    console.log(`   - ${cacheFile}`);
    console.log(`   - ${docsFile}`);
    
  } catch (error) {
    console.error(`❌ Generation failed: ${error.message}`);
  } finally {
    process.exit(0);
  }
}

// Run the generation
generateCleanSchema();
