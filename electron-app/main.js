const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { createServer } = require('http');
const { URL, pathToFileURL } = require('url');
const { ClaudeCodeBridge } = require('./claude-code-bridge-fixed.js');

let mainWindow;
let mcpServerPort = 3001; // Changed from 3000 to avoid conflicts
let mcpHttpServer = null;
let mcpServerComponents = null;
let claudeCodeBridge = null;

/**
 * Initialize MCP Server Components
 */
async function initializeMcpServerComponents() {
  try {
    // Use dynamic import for ES modules with proper file:// URLs
    const dbModule = await import(pathToFileURL(path.join(__dirname, '../src/database/databaseManager.js')).href);
    const schemaModule = await import(pathToFileURL(path.join(__dirname, '../src/tools/schemaExplorer.js')).href);
    const queryModule = await import(pathToFileURL(path.join(__dirname, '../src/tools/queryExecutor.js')).href);
    const contextModule = await import(pathToFileURL(path.join(__dirname, '../src/tools/contextManager.js')).href);
    const docModule = await import(pathToFileURL(path.join(__dirname, '../src/tools/schemaDocumentationGenerator.js')).href);

    const DatabaseManager = dbModule.DatabaseManager;
    const SchemaExplorer = schemaModule.SchemaExplorer;
    const QueryExecutor = queryModule.QueryExecutor;
    const ContextManager = contextModule.ContextManager;
    const SchemaDocumentationGenerator = docModule.SchemaDocumentationGenerator;

    // Initialize components
    const databaseManager = new DatabaseManager();
    await databaseManager.initialize();
    
    const contextManager = new ContextManager();
    const schemaExplorer = new SchemaExplorer(databaseManager);
    const queryExecutor = new QueryExecutor(databaseManager, contextManager);
    const schemaDocumentationGenerator = new SchemaDocumentationGenerator(schemaExplorer);

    mcpServerComponents = {
      databaseManager,
      schemaExplorer,
      queryExecutor,
      contextManager,
      schemaDocumentationGenerator,
    };

    console.log('MCP Server components initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize MCP server components:', error);
    return false;
  }
}

/**
 * Start the MCP HTTP Server
 */
function startMcpHttpServer() {
  return new Promise(async (resolve, reject) => {
    try {
      // Initialize components first
      const initialized = await initializeMcpServerComponents();
      if (!initialized) {
        reject(new Error('Failed to initialize MCP server components'));
        return;
      }

      const { schemaExplorer, queryExecutor } = mcpServerComponents;

      // Create HTTP server
      mcpHttpServer = createServer(async (req, res) => {
        // CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        res.setHeader('Content-Type', 'application/json');

        // Handle OPTIONS for CORS preflight
        if (req.method === 'OPTIONS') {
          res.writeHead(200);
          res.end();
          return;
        }

        const url = new URL(req.url, `http://${req.headers.host}`);

        // Health check endpoint
        if (url.pathname === '/health' && req.method === 'GET') {
          res.writeHead(200);
          res.end(JSON.stringify({ status: 'ok', port: mcpServerPort }));
          return;
        }

        // List tools endpoint
        if (url.pathname === '/mcp/tools/list' && req.method === 'GET') {
          const tools = [
            {
              name: 'list_tables',
              description: 'List all tables in the database',
              inputSchema: {
                type: 'object',
                properties: {},
              },
            },
            {
              name: 'get_schema',
              description: 'Get comprehensive schema information including all tables, columns, and relationships',
              inputSchema: {
                type: 'object',
                properties: {
                  tableName: {
                    type: 'string',
                    description: 'Optional: specific table name to get schema for',
                  },
                },
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
                  purpose: {
                    type: 'string',
                    description: 'Optional description of what this query is for',
                  },
                },
                required: ['query'],
              },
            },
            {
              name: 'get_relationships',
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
              name: 'analyze_data',
              description: 'Analyze data in a table with statistics and insights',
              inputSchema: {
                type: 'object',
                properties: {
                  tableName: {
                    type: 'string',
                    description: 'Name of the table to analyze',
                  },
                },
                required: ['tableName'],
              },
            },
          ];

          res.writeHead(200);
          res.end(JSON.stringify({ tools }));
          return;
        }

        // Call tool endpoint
        if (url.pathname === '/mcp/tools/call' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => {
            body += chunk.toString();
          });

          req.on('end', async () => {
            try {
              const { name, arguments: args } = JSON.parse(body);
              let result;

              switch (name) {
                case 'list_tables':
                  result = await schemaExplorer.listTables(args || {});
                  break;

                case 'get_schema':
                  if (args && args.tableName) {
                    result = await schemaExplorer.describeTable({ tableName: args.tableName });
                  } else {
                    result = await schemaExplorer.getSchemaInfo(args || {});
                  }
                  break;

                case 'execute_query':
                  if (!args || !args.query) {
                    throw new Error('Query parameter is required');
                  }
                  result = await queryExecutor.executeQuery(args);
                  break;

                case 'get_relationships':
                  if (!args || !args.tableName) {
                    throw new Error('tableName parameter is required');
                  }
                  result = await schemaExplorer.getTableRelationships({ tableName: args.tableName });
                  break;

                case 'analyze_data':
                  if (!args || !args.tableName) {
                    throw new Error('tableName parameter is required');
                  }
                  // Get table info
                  const tableInfo = await schemaExplorer.describeTable({ tableName: args.tableName });
                  // Get sample data
                  const sampleQuery = `SELECT * FROM "${args.tableName}" LIMIT 100`;
                  const sampleResult = await queryExecutor.executeQuery({ query: sampleQuery });
                  
                  result = {
                    content: [
                      {
                        type: 'text',
                        text: `Data Analysis for table "${args.tableName}":\n\nTable Structure:\n${tableInfo.content[0].text}\n\nSample Data (first 100 rows):\n${sampleResult.content[0].text}`,
                      },
                    ],
                  };
                  break;

                default:
                  throw new Error(`Unknown tool: ${name}`);
              }

              res.writeHead(200);
              res.end(JSON.stringify(result));
            } catch (error) {
              console.error('Tool execution error:', error);
              res.writeHead(500);
              res.end(JSON.stringify({ 
                error: error.message,
                content: [{
                  type: 'text',
                  text: `Error: ${error.message}`,
                }],
              }));
            }
          });
          return;
        }

        // 404 for unknown endpoints
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'Not found' }));
      });

      // Start server
      mcpHttpServer.listen(mcpServerPort, 'localhost', () => {
        console.log(`MCP HTTP Server running on http://localhost:${mcpServerPort}`);
        resolve();
      });

      mcpHttpServer.on('error', (error) => {
        if (error.code === 'EADDRINUSE') {
          console.error(`Port ${mcpServerPort} is already in use`);
          reject(error);
        } else {
          console.error('MCP HTTP Server error:', error);
          reject(error);
        }
      });
    } catch (error) {
      console.error('Failed to start MCP HTTP server:', error);
      reject(error);
    }
  });
}

/**
 * Stop the MCP HTTP Server
 */
function stopMcpHttpServer() {
  return new Promise((resolve) => {
    if (mcpHttpServer) {
      mcpHttpServer.close(() => {
        console.log('MCP HTTP Server stopped');
        mcpHttpServer = null;
        mcpServerComponents = null;
        resolve();
      });
    } else {
      resolve();
    }
  });
}

/**
 * Create the main application window
 */
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // Load the chat renderer (AI chat interface)
  mainWindow.loadFile(path.join(__dirname, 'renderer', 'chat.html'));

  // Open DevTools in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

/**
 * App event handlers
 */
app.whenReady().then(async () => {
  try {
    // Start MCP server first
    await startMcpHttpServer();
    console.log('MCP Server started successfully');
    
    // Initialize Claude Code bridge
    claudeCodeBridge = new ClaudeCodeBridge(path.join(__dirname, '../src/index.js'));
    
    // Set up Claude Code event handlers
    claudeCodeBridge.on('ready', () => {
      console.log('Claude Code is ready');
      if (mainWindow) {
        mainWindow.webContents.send('claude-code-ready');
      }
    });

    claudeCodeBridge.on('response', (response) => {
      console.log('Claude Code response received');
      if (mainWindow) {
        mainWindow.webContents.send('claude-code-response', response);
      }
    });

    claudeCodeBridge.on('error', (error) => {
      console.error('Claude Code error:', error);
      if (mainWindow) {
        mainWindow.webContents.send('claude-code-error', error.message);
      }
    });

    // Start Claude Code
    try {
      await claudeCodeBridge.start();
      console.log('Claude Code bridge initialized');
    } catch (error) {
      console.error('Failed to start Claude Code:', error.message);
      console.log('Continuing without Claude Code integration...');
    }
    
    // Create window
    createWindow();

    // Check server health after a short delay
    setTimeout(async () => {
      try {
        const http = require('http');
        const healthCheck = http.get(`http://localhost:${mcpServerPort}/health`, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            try {
              const health = JSON.parse(data);
              console.log('MCP Server health check:', health);
              
              // Notify renderer that server is ready
              if (mainWindow) {
                mainWindow.webContents.send('mcp-server-ready', health);
              }
            } catch (error) {
              console.error('Failed to parse health check response:', error);
            }
          });
        });
        
        healthCheck.on('error', (error) => {
          console.error('MCP Server health check failed:', error);
          if (mainWindow) {
            mainWindow.webContents.send('mcp-server-error', error.message);
          }
        });
      } catch (error) {
        console.error('Health check error:', error);
      }
    }, 1000);
  } catch (error) {
    console.error('Failed to start application:', error);
    app.quit();
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', async () => {
  // Stop MCP server before quitting
  await stopMcpHttpServer();
  
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', async () => {
  // Stop Claude Code bridge
  if (claudeCodeBridge) {
    claudeCodeBridge.stop();
  }
  
  // Ensure server is stopped
  await stopMcpHttpServer();
});

// IPC handlers for renderer communication
ipcMain.handle('get-mcp-server-status', async () => {
  try {
    const http = require('http');
    return new Promise((resolve) => {
      const req = http.get(`http://localhost:${mcpServerPort}/health`, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const health = JSON.parse(data);
            resolve({ status: 'running', ...health });
          } catch (error) {
            resolve({ status: 'error', error: error.message });
          }
        });
      });
      
      req.on('error', (error) => {
        resolve({ status: 'error', error: error.message });
      });
      
      req.setTimeout(2000, () => {
        req.destroy();
        resolve({ status: 'error', error: 'Timeout' });
      });
    });
  } catch (error) {
    return { status: 'error', error: error.message };
  }
});

ipcMain.handle('call-mcp-tool', async (event, toolName, args) => {
  try {
    const http = require('http');
    return new Promise((resolve, reject) => {
      const postData = JSON.stringify({
        name: toolName,
        arguments: args,
      });

      const options = {
        hostname: 'localhost',
        port: mcpServerPort,
        path: '/mcp/tools/call',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
        },
      };

      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            resolve(result);
          } catch (error) {
            resolve({
              error: error.message,
              content: [{
                type: 'text',
                text: `Error parsing response: ${error.message}`,
              }],
            });
          }
        });
      });

      req.on('error', (error) => {
        resolve({
          error: error.message,
          content: [{
            type: 'text',
            text: `Error calling tool: ${error.message}`,
          }],
        });
      });

      req.setTimeout(30000, () => {
        req.destroy();
        resolve({
          error: 'Timeout',
          content: [{
            type: 'text',
            text: 'Request timed out after 30 seconds',
          }],
        });
      });

      req.write(postData);
      req.end();
    });
  } catch (error) {
    return {
      error: error.message,
      content: [{
        type: 'text',
        text: `Error calling tool: ${error.message}`,
      }],
    };
  }
});

ipcMain.handle('list-mcp-tools', async () => {
  try {
    const http = require('http');
    return new Promise((resolve) => {
      const req = http.get(`http://localhost:${mcpServerPort}/mcp/tools/list`, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const tools = JSON.parse(data);
            resolve(tools);
          } catch (error) {
            resolve({ error: error.message, tools: [] });
          }
        });
      });
      
      req.on('error', (error) => {
        resolve({ error: error.message, tools: [] });
      });
      
      req.setTimeout(2000, () => {
        req.destroy();
        resolve({ error: 'Timeout', tools: [] });
      });
    });
  } catch (error) {
    return { error: error.message, tools: [] };
  }
});

// IPC handler for Claude Code integration
ipcMain.handle('send-to-claude-code', async (event, message) => {
  try {
    if (!claudeCodeBridge || !claudeCodeBridge.isReady) {
      return {
        error: true,
        message: 'Claude Code is not available. Using fallback query processing.',
        useFallback: true,
      };
    }

    // Send message to Claude Code and wait for response
    try {
      const response = await claudeCodeBridge.sendMessage(message);
      return {
        error: false,
        response: response,
      };
    } catch (error) {
      return {
        error: true,
        message: error.message,
      };
    }
  } catch (error) {
    return {
      error: true,
      message: error.message,
    };
  }
});

ipcMain.handle('claude-code-status', async () => {
  return {
    available: claudeCodeBridge && claudeCodeBridge.isReady,
    processRunning: claudeCodeBridge && claudeCodeBridge.claudeProcess !== null,
  };
});
