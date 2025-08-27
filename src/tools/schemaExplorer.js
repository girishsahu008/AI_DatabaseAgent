import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

export class SchemaExplorer {
  constructor(databaseManager) {
    this.databaseManager = databaseManager;
    this.schemaCache = null;
    
    // Get the directory path for this module and use absolute path for cache file
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    this.cacheFile = join(__dirname, '../../schema-cache.json');
    
    this.lastCacheUpdate = null;
    this.cacheValidityHours = 24; // Cache is valid for 24 hours
  }

  // Load cached schema if available and valid
  async loadCachedSchema() {
    try {
      if (existsSync(this.cacheFile)) {
        const cacheData = JSON.parse(readFileSync(this.cacheFile, 'utf8'));
        const cacheAge = Date.now() - cacheData.timestamp;
        const cacheAgeHours = cacheAge / (1000 * 60 * 60);
        
        if (cacheAgeHours < this.cacheValidityHours) {
          this.schemaCache = cacheData.schema;
          this.lastCacheUpdate = cacheData.timestamp;
          console.log(`✅ Loaded schema from cache (age: ${cacheAgeHours.toFixed(1)} hours)`);
          return true;
        } else {
          console.log(`⏰ Schema cache expired (age: ${cacheAgeHours.toFixed(1)} hours)`);
        }
      }
    } catch (error) {
      console.log(`⚠️ Failed to load schema cache: ${error.message}`);
    }
    return false;
  }

  // Save schema to cache file
  async saveSchemaToCache(schema) {
    try {
      const cacheData = {
        timestamp: Date.now(),
        schema: schema
      };
      writeFileSync(this.cacheFile, JSON.stringify(cacheData, null, 2));
      this.schemaCache = schema;
      this.lastCacheUpdate = cacheData.timestamp;
      console.log(`💾 Schema saved to cache`);
    } catch (error) {
      console.error(`❌ Failed to save schema cache: ${error.message}`);
    }
  }

  // Get schema info with caching
  async getSchemaInfo() {
    try {
      // Try to load from cache first
      if (!this.schemaCache) {
        await this.loadCachedSchema();
      }

      // If no cache or cache is invalid, fetch from database
      if (!this.schemaCache) {
        console.log(`🔄 Fetching fresh schema from database...`);
        const schema = await this.fetchSchemaFromDatabase();
        await this.saveSchemaToCache(schema);
        return {
          content: [
            {
              type: 'text',
              text: `Database Schema Information (Fresh)\nTotal Tables: ${schema.totalTables}\nSuccessful: ${schema.successfulTables}\nFailed: ${schema.failedTables}\n\n${JSON.stringify(schema, null, 2)}`,
            },
          ],
        };
      }

      // Return cached schema
      return {
        content: [
          {
            type: 'text',
            text: `Database Schema Information (Cached - Updated ${new Date(this.lastCacheUpdate).toLocaleString()})\nTotal Tables: ${this.schemaCache.totalTables}\nSuccessful: ${this.schemaCache.successfulTables}\nFailed: ${this.schemaCache.failedTables}\n\n${JSON.stringify(this.schemaCache, null, 2)}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to get schema info: ${error.message}`);
    }
  }

  // Fetch schema from database (original method)
  async fetchSchemaFromDatabase() {
    try {
      const client = await this.databaseManager.getClient();
      
      // Get all tables with proper case handling, excluding Abp tables
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
        ORDER BY t.table_name;
      `;
      
      const tablesResult = await client.query(tablesQuery);
      
      const schemaInfo = {
        tables: [],
        totalTables: tablesResult.rows.length,
        successfulTables: 0,
        failedTables: 0,
        errors: []
      };

      // Get detailed information for each table with error handling
      for (const table of tablesResult.rows) {
        try {
          const tableInfo = await this.getDetailedTableInfo(table.table_name, table.table_description);
          schemaInfo.tables.push(tableInfo);
          schemaInfo.successfulTables++;
        } catch (error) {
          console.error(`Warning: Failed to get info for table "${table.table_name}": ${error.message}`);
          schemaInfo.failedTables++;
          schemaInfo.errors.push({
            table: table.table_name,
            error: error.message
          });
          
          // Add basic table info even if detailed info fails
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

      return schemaInfo;
    } catch (error) {
      throw new Error(`Failed to fetch schema from database: ${error.message}`);
    }
  }

  // Force refresh schema cache
  async refreshSchemaCache() {
    try {
      console.log(`🔄 Forcing schema cache refresh...`);
      const schema = await this.fetchSchemaFromDatabase();
      await this.saveSchemaToCache(schema);
      return {
        content: [
          {
            type: 'text',
            text: `Schema cache refreshed successfully!\nTotal Tables: ${schema.totalTables}\nSuccessful: ${schema.successfulTables}\nFailed: ${schema.failedTables}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to refresh schema cache: ${error.message}`);
    }
  }

  // Get cache status
  async getCacheStatus() {
    const status = {
      hasCache: !!this.schemaCache,
      lastUpdate: this.lastCacheUpdate ? new Date(this.lastCacheUpdate).toLocaleString() : 'Never',
      cacheFile: this.cacheFile,
      cacheAge: this.lastCacheUpdate ? `${((Date.now() - this.lastCacheUpdate) / (1000 * 60 * 60)).toFixed(1)} hours` : 'N/A'
    };

    return {
      content: [
        {
          type: 'text',
          text: `Schema Cache Status:\n${JSON.stringify(status, null, 2)}`,
        },
      ],
    };
  }

  async listTables() {
    try {
      const client = await this.databaseManager.getClient();
      
      const query = `
        SELECT 
          t.table_name,
          obj_description(c.oid) as table_description,
          (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
        FROM information_schema.tables t
        JOIN pg_class c ON c.relname = t.table_name
        WHERE t.table_schema = 'public'
        AND t.table_type = 'BASE TABLE'
        ORDER BY t.table_name;
      `;
      
      const result = await client.query(query);
      
      const tablesList = result.rows.map(row => ({
        name: row.table_name,
        description: row.table_description || 'No description available',
        columnCount: parseInt(row.column_count),
      }));

      return {
        content: [
          {
            type: 'text',
            text: `Database Tables (${tablesList.length} total):\n\n${JSON.stringify(tablesList, null, 2)}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to list tables: ${error.message}`);
    }
  }

  async describeTable(args) {
    try {
      const { tableName } = args;
      const client = await this.databaseManager.getClient();
      
      const tableInfo = await this.getDetailedTableInfo(tableName);
      
      return {
        content: [
          {
            type: 'text',
            text: `Table: ${tableName}\n\n${JSON.stringify(tableInfo, null, 2)}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to describe table: ${error.message}`);
    }
  }

  async getTableRelationships(args) {
    try {
      const { tableName } = args;
      const client = await this.databaseManager.getClient();
      
      const query = `
        SELECT
          tc.constraint_name,
          tc.table_name,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = $1
        ORDER BY tc.constraint_name;
      `;
      
      const result = await client.query(query, [tableName]);
      
      const relationships = result.rows.map(row => ({
        constraintName: row.constraint_name,
        column: row.column_name,
        referencesTable: row.foreign_table_name,
        referencesColumn: row.foreign_column_name,
      }));

      return {
        content: [
          {
            type: 'text',
            text: `Foreign Key Relationships for table "${tableName}":\n\n${JSON.stringify(relationships, null, 2)}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to get table relationships: ${error.message}`);
    }
  }

  async getDetailedTableInfo(tableName, tableDescription = null) {
    const client = await this.databaseManager.getClient();
    
    // Get columns information
    const columnsQuery = `
      SELECT 
        c.column_name,
        c.data_type,
        c.is_nullable,
        c.column_default,
        col_description(c.table_name::regclass, c.ordinal_position) as column_description,
        c.character_maximum_length,
        c.numeric_precision,
        c.numeric_scale
      FROM information_schema.columns c
      WHERE c.table_name = $1
      AND c.table_schema = 'public'
      ORDER BY c.ordinal_position;
    `;
    
    const columnsResult = await client.query(columnsQuery, [tableName]);
    
    // Get primary key information
    const primaryKeyQuery = `
      SELECT 
        kcu.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      WHERE tc.constraint_type = 'PRIMARY KEY'
        AND tc.table_name = $1;
    `;
    
    const primaryKeyResult = await client.query(primaryKeyQuery, [tableName]);
    
    // Get foreign key relationships
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
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = $1;
    `;
    
    const foreignKeyResult = await client.query(foreignKeyQuery, [tableName]);
    
    // Get indexes
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
    
    const indexesResult = await client.query(indexesQuery, [tableName]);
    
    // Get row count
    const rowCountQuery = `SELECT COUNT(*) as row_count FROM "${tableName}";`;
    let rowCount = 0;
    try {
      const rowCountResult = await client.query(rowCountQuery);
      rowCount = parseInt(rowCountResult.rows[0].row_count);
    } catch (error) {
      // Table might not exist or be accessible
      rowCount = null;
    }
    
    return {
      name: tableName,
      description: tableDescription || 'No description available',
      rowCount: rowCount,
      columns: columnsResult.rows.map(col => ({
        name: col.column_name,
        type: col.data_type,
        nullable: col.is_nullable === 'YES',
        defaultValue: col.column_default,
        description: col.column_description || 'No description available',
        maxLength: col.character_maximum_length,
        precision: col.numeric_precision,
        scale: col.numeric_scale,
      })),
      primaryKeys: primaryKeyResult.rows.map(pk => pk.column_name),
      foreignKeys: foreignKeyResult.rows.map(fk => ({
        constraintName: fk.constraint_name,
        column: fk.column_name,
        referencesTable: fk.foreign_table_name,
        referencesColumn: fk.foreign_column_name,
      })),
      indexes: indexesResult.rows.map(idx => ({
        name: idx.index_name,
        column: idx.column_name,
        isUnique: idx.is_unique,
        isPrimary: idx.is_primary,
      })),
    };
  }
} 