# Claude Code CLI Testing Guide

## Prerequisites

1. ✅ Electron app is running (MCP server on localhost:3000)
2. ✅ Claude Code CLI is installed

## Step 1: Verify MCP Server is Running

### Test with curl (Windows PowerShell)

```powershell
# Test health endpoint
Invoke-WebRequest -Uri "http://localhost:3000/health" -Method GET

# Test tools list
Invoke-WebRequest -Uri "http://localhost:3000/mcp/tools/list" -Method GET
```

### Test with Node.js script

```bash
node test-mcp-server.js
```

This will:
- ✅ Test health endpoint
- ✅ Test tools list
- ✅ Test tool execution
- ✅ Show available tools

## Step 2: Verify Claude Code CLI Installation

### Check if Claude Code CLI is installed

```bash
claude-code --version
```

If not installed, you may need to install it first.

## Step 3: Configure Claude Code CLI

### Option 1: Use the provided configuration file

The configuration file `claude-code-config.json` is already set up:

```json
{
  "mcp": {
    "servers": {
      "postgresql-mcp": {
        "url": "http://localhost:3000",
        "transport": "http",
        "tools": [
          "list_tables",
          "get_schema",
          "execute_query",
          "get_relationships",
          "analyze_data"
        ]
      }
    }
  }
}
```

### Option 2: Manual configuration

If Claude Code CLI uses a different configuration format, you may need to:

1. **Find Claude Code CLI config file** (usually in user home directory)
2. **Add MCP server configuration**:
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

## Step 4: Start Claude Code CLI

### Method 1: Using configuration file

```bash
claude-code --config electron-app/claude-code-config.json
```

### Method 2: If Claude Code CLI reads from default location

1. **Copy configuration** to Claude Code CLI config directory
2. **Start Claude Code CLI** normally
3. **It should automatically connect** to localhost:3000

### Method 3: Environment variable

Some Claude Code CLI implementations use environment variables:

```bash
export MCP_SERVER_URL="http://localhost:3000"
claude-code
```

## Step 5: Test Claude Code CLI Integration

### Test 1: List Available Tools

In Claude Code CLI, ask:
```
What tools are available?
```

Expected response: Should list all 5 tools (list_tables, get_schema, execute_query, get_relationships, analyze_data)

### Test 2: List Database Tables

In Claude Code CLI, ask:
```
List all tables in the database
```

Expected: Claude Code CLI should use the `list_tables` tool and return a list of tables.

### Test 3: Get Schema Information

In Claude Code CLI, ask:
```
Get the schema for the database
```

Expected: Claude Code CLI should use the `get_schema` tool and return schema information.

### Test 4: Execute a Query

In Claude Code CLI, ask:
```
Execute a query to get the first 5 rows from the orders table
```

Expected: Claude Code CLI should use the `execute_query` tool and return query results.

### Test 5: Get Table Relationships

In Claude Code CLI, ask:
```
Show me the relationships for the orders table
```

Expected: Claude Code CLI should use the `get_relationships` tool and return foreign key relationships.

### Test 6: Analyze Data

In Claude Code CLI, ask:
```
Analyze the data in the products table
```

Expected: Claude Code CLI should use the `analyze_data` tool and return analysis results.

## Step 6: Verify Privacy

### Check that all data stays local

1. **Monitor network traffic** - No external connections should be made
2. **Check Electron app** - All requests should go to localhost:3000
3. **Verify database** - All queries should go to your local database
4. **Check logs** - No external API calls should be logged

## Troubleshooting

### Claude Code CLI Cannot Connect

**Problem:** Claude Code CLI cannot connect to MCP server

**Solutions:**
1. **Verify MCP server is running:**
   ```bash
   curl http://localhost:3000/health
   ```

2. **Check configuration file path:**
   - Ensure the path to `claude-code-config.json` is correct
   - Use absolute path if relative path doesn't work

3. **Check port:**
   - Verify port 3000 is not blocked by firewall
   - Try changing port in `main.js` if needed

4. **Check Claude Code CLI version:**
   - Ensure Claude Code CLI supports MCP protocol
   - Update Claude Code CLI if needed

### Tools Not Available

**Problem:** Claude Code CLI doesn't show available tools

**Solutions:**
1. **Test tools endpoint:**
   ```bash
   curl http://localhost:3000/mcp/tools/list
   ```

2. **Check configuration:**
   - Verify tools are listed in `claude-code-config.json`
   - Ensure tool names match exactly

3. **Restart Claude Code CLI:**
   - Close and reopen Claude Code CLI
   - Reconnect to MCP server

### Tool Execution Fails

**Problem:** Tools execute but return errors

**Solutions:**
1. **Check database connection:**
   - Verify `config.env` has correct database credentials
   - Test database connection in Electron app UI

2. **Check tool parameters:**
   - Ensure required parameters are provided
   - Verify parameter names match tool schema

3. **Check console logs:**
   - Look for error messages in Electron app console
   - Check MCP server logs for details

## Success Criteria

✅ MCP server is running on localhost:3000
✅ Health endpoint responds correctly
✅ Tools list endpoint returns all 5 tools
✅ Claude Code CLI can connect to MCP server
✅ Claude Code CLI can discover available tools
✅ Claude Code CLI can execute tools
✅ All data stays local (privacy verified)
✅ No external network connections made

## Next Steps

1. **Test all tools** with Claude Code CLI
2. **Verify privacy** - all data stays local
3. **Test with different queries** and scenarios
4. **Monitor performance** and response times
5. **Document any issues** or improvements needed

## Additional Resources

- **MCP Server Test Script:** `test-mcp-server.js`
- **Configuration File:** `claude-code-config.json`
- **Setup Guide:** `SETUP_GUIDE.md`
- **Electron App README:** `README.md`

## Notes

- **Privacy:** All data remains on your machine
- **Security:** MCP server only accessible from localhost
- **Performance:** Local execution is fast
- **Reliability:** No external dependencies for core functionality

