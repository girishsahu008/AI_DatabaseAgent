#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { DatabaseManager } from './src/database/databaseManager.js';
import { SchemaExplorer } from './src/tools/schemaExplorer.js';
import { QueryExecutor } from './src/tools/queryExecutor.js';
import { SchemaDocumentationGenerator } from './src/tools/schemaDocumentationGenerator.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get the directory path for this module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create the server
const server = new Server({
  name: 'postgresql-erp-server',
  version: '1.0.0',
});

// Initialize database components
let databaseManager, schemaExplorer, queryExecutor, schemaDocumentationGenerator;

// Initialize database connection
async function initializeDatabase() {
  try {
    databaseManager = new DatabaseManager();
    await databaseManager.initialize();
    
    schemaExplorer = new SchemaExplorer(databaseManager);
    queryExecutor = new QueryExecutor(databaseManager);
    schemaDocumentationGenerator = new SchemaDocumentationGenerator(schemaExplorer);
    
    console.error('Database connection initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error.message);
    throw error;
  }
}

// Define the tool call handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'get_schema_info':
        return await schemaExplorer.getSchemaInfo(args);
      
      case 'list_tables':
        return await schemaExplorer.listTables(args);
      
      case 'describe_table':
        return await schemaExplorer.describeTable(args);
      
      case 'get_table_relationships':
        return await schemaExplorer.getTableRelationships(args);
      
      case 'refresh_schema_cache':
        return await schemaExplorer.refreshSchemaCache();
      
      case 'get_cache_status':
        return await schemaExplorer.getCacheStatus();
      
      case 'generate_schema_docs':
        return await schemaDocumentationGenerator.generateSchemaDocumentation();
      
      case 'export_schema_json':
        return await schemaDocumentationGenerator.exportSchemaToJSON();
      
      case 'execute_query':
        return await queryExecutor.executeQuery(args);
      
      case 'test_connection':
        return await databaseManager.testConnection();
      
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    console.error(`Error in tool ${name}:`, error);
    throw error;
  }
});

// Define the tool list handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'get_schema_info',
        description: 'Get comprehensive schema information including all tables, columns, and relationships',
        inputSchema: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
      {
        name: 'list_tables',
        description: 'List all tables in the database with their descriptions',
        inputSchema: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
      {
        name: 'describe_table',
        description: 'Get detailed information about a specific table including columns, types, and constraints',
        inputSchema: {
          type: 'object',
          properties: {
            tableName: {
              type: 'string',
              description: 'Name of the table to describe',
            },
          },
          required: ['tableName'],
        },
      },
      {
        name: 'get_table_relationships',
        description: 'Get foreign key relationships for a specific table',
        inputSchema: {
          type: 'object',
          properties: {
            tableName: {
              type: 'string',
              description: 'Name of the table to get relationships for',
            },
          },
          required: ['tableName'],
        },
      },
      {
        name: 'refresh_schema_cache',
        description: 'Force refresh the schema cache by fetching fresh data from the database',
        inputSchema: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
      {
        name: 'get_cache_status',
        description: 'Get the current status of the schema cache including last update time and cache age',
        inputSchema: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
      {
        name: 'generate_schema_docs',
        description: 'Generate comprehensive markdown documentation of the database schema and save to schema_explained.md',
        inputSchema: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
      {
        name: 'export_schema_json',
        description: 'Export the complete database schema to a JSON file for external use',
        inputSchema: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
      {
        name: 'execute_query',
        description: 'Execute a read-only SQL query on the database',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'SQL query to execute (read-only only)',
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'test_connection',
        description: 'Test the database connection and SSH tunnel',
        inputSchema: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
    ],
  };
});

// Start the server
async function startServer() {
  try {
    console.error('Starting PostgreSQL ERP MCP Server...');
    
    // Initialize database first
    await initializeDatabase();
    
    // Start the server
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('MCP Server started successfully');
    
  } catch (error) {
    console.error('Failed to start MCP server:', error);
    process.exit(1);
  }
}

startServer();
