#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { DatabaseManager } from './database/databaseManager.js';
import { SchemaExplorer } from './tools/schemaExplorer.js';
import { QueryExecutor } from './tools/queryExecutor.js';
import { SchemaDocumentationGenerator } from './tools/schemaDocumentationGenerator.js';

class PostgreSQLMCPServer {
  constructor() {
    this.server = new Server({
      name: 'postgresql-erp-server',
      version: '1.0.0',
    }, {
      capabilities: {
        tools: {},
      },
    });

    this.databaseManager = new DatabaseManager();
    this.schemaExplorer = new SchemaExplorer(this.databaseManager);
    this.queryExecutor = new QueryExecutor(this.databaseManager);
    this.schemaDocumentationGenerator = new SchemaDocumentationGenerator(this.schemaExplorer);

    this.setupTools();
  }

  setupTools() {
    // Register tools
    this.server.setRequestHandler('tools/list', async () => {
      return {
        tools: [
          {
            name: 'get_schema_info',
            description: 'Get comprehensive schema information including all tables, columns, and relationships',
            inputSchema: {
              type: 'object',
              properties: {},
              additionalProperties: false,
            },
          },
          {
            name: 'list_tables',
            description: 'List all tables in the database with their descriptions',
            inputSchema: {
              type: 'object',
              properties: {},
              additionalProperties: false,
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
              additionalProperties: false,
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
              additionalProperties: false,
            },
          },
          {
            name: 'refresh_schema_cache',
            description: 'Force refresh the schema cache by fetching fresh data from the database',
            inputSchema: {
              type: 'object',
              properties: {},
              additionalProperties: false,
            },
          },
          {
            name: 'get_cache_status',
            description: 'Get the current status of the schema cache including last update time and cache age',
            inputSchema: {
              type: 'object',
              properties: {},
              additionalProperties: false,
            },
          },
          {
            name: 'generate_schema_docs',
            description: 'Generate comprehensive markdown documentation of the database schema and save to schema_explained.md',
            inputSchema: {
              type: 'object',
              properties: {},
              additionalProperties: false,
            },
          },
          {
            name: 'export_schema_json',
            description: 'Export the complete database schema to a JSON file for external use',
            inputSchema: {
              type: 'object',
              properties: {},
              additionalProperties: false,
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
              additionalProperties: false,
            },
          },
          {
            name: 'test_connection',
            description: 'Test the database connection and SSH tunnel',
            inputSchema: {
              type: 'object',
              properties: {},
              additionalProperties: false,
            },
          },
        ],
      };
    });

    // Set up the tool call handler
    this.server.setRequestHandler('tools/call', async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'get_schema_info':
            return await this.schemaExplorer.getSchemaInfo(args);
          
          case 'list_tables':
            return await this.schemaExplorer.listTables(args);
          
          case 'describe_table':
            return await this.schemaExplorer.describeTable(args);
          
          case 'get_table_relationships':
            return await this.schemaExplorer.getTableRelationships(args);
          
          case 'refresh_schema_cache':
            return await this.schemaExplorer.refreshSchemaCache();
          
          case 'get_cache_status':
            return await this.schemaExplorer.getCacheStatus();
          
          case 'generate_schema_docs':
            return await this.schemaDocumentationGenerator.generateSchemaDocumentation();
          
          case 'export_schema_json':
            return await this.schemaDocumentationGenerator.exportSchemaToJSON();
          
          case 'execute_query':
            return await this.queryExecutor.executeQuery(args);
          
          case 'test_connection':
            return await this.databaseManager.testConnection();
          
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        console.error(`Error in tool ${name}:`, error);
        throw error;
      }
    });
  }

  async start() {
    try {
      console.error('Starting PostgreSQL ERP MCP Server...');
      
      // Initialize database connection
      await this.databaseManager.initialize();
      console.error('Database connection initialized');
      
      // Start the server
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      console.error('MCP Server started successfully');
      
    } catch (error) {
      console.error('Failed to start MCP server:', error);
      process.exit(1);
    }
  }
}

// Start the server
const server = new PostgreSQLMCPServer();
server.start().catch((error) => {
  console.error('Server startup failed:', error);
  process.exit(1);
}); 