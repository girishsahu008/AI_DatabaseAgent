#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { 
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema
} from '@modelcontextprotocol/sdk/types.js';
import { DatabaseManager } from './database/databaseManager.js';
import { SchemaExplorer } from './tools/schemaExplorer.js';
import { QueryExecutor } from './tools/queryExecutor.js';
import { SchemaDocumentationGenerator } from './tools/schemaDocumentationGenerator.js';
import { ContextManager } from './tools/contextManager.js';

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
    this.contextManager = new ContextManager();
    this.schemaExplorer = new SchemaExplorer(this.databaseManager);
    this.queryExecutor = new QueryExecutor(this.databaseManager, this.contextManager);
    this.schemaDocumentationGenerator = new SchemaDocumentationGenerator(this.schemaExplorer);

    this.setupTools();
    this.setupResources();
  }

  setupTools() {
    // Register tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
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
            description: 'Execute a read-only SQL query on the database. Queries are automatically tracked in the current session context.',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'SQL query to execute (read-only only)',
                },
                purpose: {
                  type: 'string',
                  description: 'Optional description of what this query is for (e.g., "Get Q3 orders")',
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
          {
            name: 'save_chat_context',
            description: 'Save the current conversation context including all executed queries, findings, and notes. Use this when the user asks to "save this chat", "save the context", "save this session", or similar. Automatically includes all queries executed in this conversation. The user can provide a session name, summary, and optional notes.',
            inputSchema: {
              type: 'object',
              properties: {
                sessionName: {
                  type: 'string',
                  description: 'Name for this session (e.g., "sales_analysis", "q3_review"). If user doesn\'t provide one, suggest a descriptive name based on the conversation topic.',
                },
                summary: {
                  type: 'string',
                  description: 'Brief summary of the analysis session. If user doesn\'t provide one, create a summary based on the queries and findings.',
                },
                userNotes: {
                  type: 'string',
                  description: 'Additional notes or observations from the user',
                },
              },
              required: ['sessionName'],
              additionalProperties: false,
            },
          },
          {
            name: 'list_saved_contexts',
            description: 'List all saved conversation contexts with summaries. Shows numbered list that can be used to load contexts. Use this when user asks to "show history", "list saved sessions", "show previous contexts", or "what contexts are saved".',
            inputSchema: {
              type: 'object',
              properties: {},
              additionalProperties: false,
            },
          },
          {
            name: 'load_chat_context',
            description: 'Load a specific saved conversation context. Can load by: 1) Number from the list (e.g., "1", "2"), 2) Session name (e.g., "sales_analysis"), or 3) Session ID (e.g., "2024-11-06_14-30-45"). Use this when user asks to "load history", "load previous session", "continue from session X", or "show me context X". If user says "load history" without specifying which, first call list_saved_contexts to show options, then ask which one to load or load the most recent (number 1).',
            inputSchema: {
              type: 'object',
              properties: {
                sessionIdOrName: {
                  type: 'string',
                  description: 'Can be: 1) A number (e.g., "1", "2") to load by index from the list, 2) Session name (e.g., "sales_analysis"), or 3) Session ID (e.g., "2024-11-06_14-30-45"). If user says "latest" or "most recent", use "1". If user says "load history" without specifying, first list contexts, then use "1" for the most recent.',
                },
              },
              required: ['sessionIdOrName'],
              additionalProperties: false,
            },
          },
          {
            name: 'append_to_current_context',
            description: 'Add a key finding or insight to the current session context',
            inputSchema: {
              type: 'object',
              properties: {
                finding: {
                  type: 'string',
                  description: 'Key finding or insight to add to the current context',
                },
              },
              required: ['finding'],
              additionalProperties: false,
            },
          },
        ],
      };
    });

    // Set up the tool call handler
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
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
          
          case 'save_chat_context':
            return await this.contextManager.saveContext(
              args.sessionName,
              args.summary || '',
              args.userNotes || ''
            );
          
          case 'list_saved_contexts':
            return await this.contextManager.listSavedContexts();
          
          case 'load_chat_context':
            // Handle "latest", "most recent", "last" as alias for "1"
            let loadParam = args.sessionIdOrName;
            if (typeof loadParam === 'string') {
              const lower = loadParam.toLowerCase();
              if (lower === 'latest' || lower === 'most recent' || lower === 'last' || lower === 'recent') {
                loadParam = '1';
              }
            }
            return await this.contextManager.loadContext(loadParam);
          
          case 'append_to_current_context':
            return await this.contextManager.appendFinding(args.finding);
          
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        console.error(`Error in tool ${name}:`, error);
        throw error;
      }
    });
  }

  setupResources() {
    // Define resources handler (for auto-loading context summaries)
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      const resources = [];
      
      // Add latest session context resource if available
      if (this.contextManager) {
        try {
          const latestSession = this.contextManager.getLatestSessionSummary();
          if (latestSession) {
            resources.push({
              uri: 'session://latest/summary',
              name: `Recent Analysis: ${latestSession.sessionName || 'Unnamed'}`,
              description: `Last session: ${new Date(latestSession.createdAt).toLocaleDateString()} - ${latestSession.summary || 'No summary'}`,
              mimeType: 'text/markdown',
            });
          }
          
          // Add session history overview resource
          const history = this.contextManager.getSessionHistoryOverview();
          if (history.length > 0) {
            resources.push({
              uri: 'session://history/overview',
              name: 'Analysis History',
              description: `Overview of last ${history.length} analysis sessions`,
              mimeType: 'text/markdown',
            });
          }
        } catch (error) {
          // Silently fail if resources can't be loaded
          console.error('Error loading resources:', error.message);
        }
      }
      
      return { resources };
    });

    // Define resource read handler
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;
      
      if (!this.contextManager) {
        throw new Error('Context manager not initialized');
      }
      
      if (uri === 'session://latest/summary') {
        const latestSession = this.contextManager.getLatestSessionSummary();
        if (!latestSession) {
          throw new Error('No previous sessions found');
        }
        
        const content = this.contextManager.formatLatestSessionForResource(latestSession);
        return {
          contents: [
            {
              uri: 'session://latest/summary',
              mimeType: 'text/markdown',
              text: content,
            },
          ],
        };
      } else if (uri === 'session://history/overview') {
        const history = this.contextManager.getSessionHistoryOverview();
        const content = this.contextManager.formatSessionHistoryForResource(history);
        return {
          contents: [
            {
              uri: 'session://history/overview',
              mimeType: 'text/markdown',
              text: content,
            },
          ],
        };
      } else {
        throw new Error(`Resource not found: ${uri}`);
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