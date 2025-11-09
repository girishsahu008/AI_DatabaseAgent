# Testing Claude Code CLI Integration

## Prerequisites

1. ✅ Electron app is running (MCP server on localhost:3000)
2. ✅ Claude Code CLI is installed

## Step 1: Start Electron App

```bash
cd electron-app
npm start
```

Wait for the app to start and verify:
- Status shows "Server running on localhost:3000"
- Tools are listed in the sidebar

## Step 2: Verify MCP Server is Running

### Test Health Endpoint
```bash
curl http://localhost:3000/health
```

Expected response:
```json
{"status":"ok","port":3000}
```

### Test Tools List
```bash
curl http://localhost:3000/mcp/tools/list
```

Expected response:
```json
{
  "tools": [
    {
      "name": "list_tables",
      "description": "List all tables in the database",
      ...
    }
  ]
}
```

## Step 3: Test with Claude Code CLI

### Option 1: Using Claude Code CLI Directly

If you have Claude Code CLI installed globally:
```bash
claude-code --config electron-app/claude-code-config.json
```

### Option 2: Using Claude Code CLI with MCP Server

1. **Start the Electron app** (MCP server must be running)
2. **Open Claude Code CLI** in a separate terminal
3. **Configure Claude Code CLI** to use the local MCP server

### Option 3: Test with HTTP Requests

You can test the MCP server directly with HTTP requests:

#### List Tables
```bash
curl -X POST http://localhost:3000/mcp/tools/call \
  -H "Content-Type: application/json" \
  -d '{"name":"list_tables","arguments":{}}'
```

#### Execute Query
```bash
curl -X POST http://localhost:3000/mcp/tools/call \
  -H "Content-Type: application/json" \
  -d '{"name":"execute_query","arguments":{"query":"SELECT * FROM your_table LIMIT 5"}}'
```

#### Get Schema
```bash
curl -X POST http://localhost:3000/mcp/tools/call \
  -H "Content-Type: application/json" \
  -d '{"name":"get_schema","arguments":{}}'
```

## Step 4: Test in Electron App UI

1. **Select a tool** from the sidebar (e.g., "list_tables")
2. **Click "Execute"** (no parameters needed for list_tables)
3. **View results** in the results panel
4. **Try other tools**:
   - `execute_query` - Enter a SQL query
   - `get_schema` - Get database schema
   - `get_relationships` - Enter a table name
   - `analyze_data` - Enter a table name

## Step 5: Verify Claude Code CLI Integration

### Check Claude Code CLI Configuration

The configuration file (`claude-code-config.json`) should point to:
```json
{
  "mcp": {
    "servers": {
      "postgresql-mcp": {
        "url": "http://localhost:3000"
      }
    }
  }
}
```

### Test Claude Code CLI Connection

1. **Ensure Electron app is running**
2. **Start Claude Code CLI** with the config:
   ```bash
   claude-code --config electron-app/claude-code-config.json
   ```
3. **Claude Code CLI should**:
   - Connect to localhost:3000
   - Discover available tools
   - Be ready to use tools

### Example Claude Code CLI Usage

Once connected, you can ask Claude Code CLI to:
- "List all tables in the database"
- "Get the schema for the orders table"
- "Execute a query to get the first 10 customers"
- "Show relationships for the orders table"
- "Analyze data in the products table"

## Troubleshooting

### MCP Server Not Starting

**Check:**
1. Database connection in `config.env`
2. Node.js version (18+ required)
3. All dependencies installed
4. Console for error messages

### Port 3000 Already in Use

**Solution:**
1. Change port in `main.js`:
   ```javascript
   let mcpServerPort = 3001; // Change port
   ```
2. Update `claude-code-config.json`:
   ```json
   {
     "mcp": {
       "servers": {
         "postgresql-mcp": {
           "url": "http://localhost:3001"
         }
       }
     }
   }
   ```

### Claude Code CLI Not Connecting

**Check:**
1. MCP server is running (test with curl)
2. Configuration file path is correct
3. Port matches in config
4. Firewall isn't blocking localhost

### Tools Not Working

**Check:**
1. Database connection is working
2. Tool names are correct
3. Parameters are provided correctly
4. Check console logs for errors

## Success Criteria

✅ Electron app starts successfully
✅ MCP server runs on localhost:3000
✅ Health endpoint responds
✅ Tools list endpoint works
✅ Tools can be executed via UI
✅ Tools can be executed via HTTP
✅ Claude Code CLI can connect (if installed)
✅ All data stays local (privacy)

## Next Steps

1. **Test all tools** in the Electron app UI
2. **Test with HTTP requests** using curl
3. **Test with Claude Code CLI** (if installed)
4. **Verify privacy** - all data stays local
5. **Build app** for distribution (optional)

