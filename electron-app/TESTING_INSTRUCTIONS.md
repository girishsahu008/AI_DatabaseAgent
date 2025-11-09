# Complete Testing Instructions

## 🚀 Quick Start

### 1. Start Electron App

```bash
cd electron-app
npm start
```

**What to expect:**
- Electron window opens
- Status shows "Server running on localhost:3001"
- Tools appear in sidebar (list_tables, get_schema, execute_query, get_relationships, analyze_data)

### 2. Verify MCP Server is Running

**Test with PowerShell:**
```powershell
# Health check
Invoke-WebRequest -Uri "http://localhost:3001/health" -Method GET

# List tools
Invoke-WebRequest -Uri "http://localhost:3001/mcp/tools/list" -Method GET
```

**Test with Node.js script:**
```bash
node test-mcp-server.js
```

### 3. Test in Electron App UI

1. **Select "list_tables"** from sidebar
2. **Click "Execute"** (no parameters needed)
3. **View results** - Should show list of database tables

4. **Try "execute_query":**
   - Enter: `SELECT * FROM your_table LIMIT 5`
   - Click "Execute"
   - View query results

5. **Try "get_schema":**
   - Leave empty or enter table name
   - Click "Execute"
   - View schema information

## 🔗 Testing Claude Code CLI

### Prerequisites

1. ✅ Electron app is running (MCP server on localhost:3001)
2. ✅ Claude Code CLI is installed

### Step 1: Verify Claude Code CLI Installation

```bash
claude-code --version
```

If not installed, you may need to install it first.

### Step 2: Start Claude Code CLI

**Option 1: Using configuration file**
```bash
claude-code --config electron-app/claude-code-config.json
```

**Option 2: If Claude Code CLI uses different format**

You may need to configure it manually. Check Claude Code CLI documentation for:
- Configuration file location
- Configuration format
- How to specify MCP server URL

### Step 3: Test Claude Code CLI Commands

Once Claude Code CLI is connected, try these commands:

#### 1. List Tables
```
List all tables in the database
```

**Expected:** Claude Code CLI uses `list_tables` tool and returns table list.

#### 2. Get Schema
```
Get the schema for the database
```

**Expected:** Claude Code CLI uses `get_schema` tool and returns schema information.

#### 3. Execute Query
```
Execute a query to get the first 5 rows from the orders table
```

**Expected:** Claude Code CLI uses `execute_query` tool and returns query results.

#### 4. Get Relationships
```
Show me the relationships for the orders table
```

**Expected:** Claude Code CLI uses `get_relationships` tool and returns foreign key relationships.

#### 5. Analyze Data
```
Analyze the data in the products table
```

**Expected:** Claude Code CLI uses `analyze_data` tool and returns analysis results.

### Step 4: Verify Privacy

**Check that all data stays local:**
1. Monitor network traffic - No external connections
2. Check Electron app - All requests go to localhost:3001
3. Verify database - All queries go to your local database
4. Check logs - No external API calls

## 🧪 Manual Testing with HTTP Requests

### Test Health Endpoint

```powershell
Invoke-RestMethod -Uri "http://localhost:3001/health" -Method GET
```

### Test Tools List

```powershell
Invoke-RestMethod -Uri "http://localhost:3001/mcp/tools/list" -Method GET
```

### Test Tool Execution (list_tables)

```powershell
$body = @{
    name = "list_tables"
    arguments = @{}
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3001/mcp/tools/call" -Method POST -Body $body -ContentType "application/json"
```

### Test Tool Execution (execute_query)

```powershell
$body = @{
    name = "execute_query"
    arguments = @{
        query = "SELECT * FROM your_table LIMIT 5"
    }
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3001/mcp/tools/call" -Method POST -Body $body -ContentType "application/json"
```

## 📋 Testing Checklist

### Electron App
- [ ] App starts successfully
- [ ] MCP server runs on localhost:3001
- [ ] Status shows "Server running"
- [ ] Tools appear in sidebar
- [ ] Can execute list_tables
- [ ] Can execute execute_query
- [ ] Can execute get_schema
- [ ] Can execute get_relationships
- [ ] Can execute analyze_data
- [ ] Results display correctly

### MCP Server
- [ ] Health endpoint responds
- [ ] Tools list endpoint works
- [ ] Tool execution endpoint works
- [ ] All 5 tools are available
- [ ] Database connection works
- [ ] Queries execute successfully

### Claude Code CLI
- [ ] Claude Code CLI can connect
- [ ] Can discover available tools
- [ ] Can execute list_tables
- [ ] Can execute execute_query
- [ ] Can execute get_schema
- [ ] Can execute get_relationships
- [ ] Can execute analyze_data
- [ ] All data stays local

## 🐛 Troubleshooting

### Electron App Not Starting

**Check:**
1. Node.js version (18+ required)
2. Dependencies installed (`npm install`)
3. Database connection in `config.env`
4. Console for error messages

### MCP Server Not Starting

**Check:**
1. Port 3001 is available
2. Database connection works
3. Console for initialization errors
4. Check `config.env` settings

### Claude Code CLI Not Connecting

**Check:**
1. Electron app is running
2. MCP server is running (test with curl)
3. Configuration file path is correct
4. Port matches (3001)
5. Claude Code CLI version supports MCP

### Tools Not Working

**Check:**
1. Database connection
2. Tool parameters
3. Console logs for errors
4. Database permissions

## ✅ Success Criteria

- ✅ Electron app starts and runs
- ✅ MCP server runs on localhost:3001
- ✅ All tools are available and working
- ✅ Claude Code CLI can connect (if installed)
- ✅ All data stays local (privacy verified)
- ✅ No external network connections

## 📝 Next Steps

1. **Test all tools** in Electron app
2. **Test with Claude Code CLI** (if installed)
3. **Verify privacy** - all data local
4. **Test with different queries**
5. **Monitor performance**
6. **Build app for distribution** (optional)

## 📚 Additional Resources

- **Quick Start:** `QUICK_START.md`
- **Setup Guide:** `SETUP_GUIDE.md`
- **Claude Code CLI Test:** `CLAUDE_CODE_CLI_TEST.md`
- **Electron Setup:** `ELECTRON_SETUP.md`

## 💡 Tips

1. **Keep Electron app running** while testing Claude Code CLI
2. **Check console logs** for detailed error messages
3. **Test one tool at a time** to isolate issues
4. **Verify database connection** before testing tools
5. **Use test script** to quickly verify MCP server

