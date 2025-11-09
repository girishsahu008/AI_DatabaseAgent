# How to Use Claude Code CLI with the MCP Server

## ✅ Electron App is Running

The Electron app should now be running with the MCP server on `http://localhost:3001`.

## 🔗 Connecting Claude Code CLI

### Step 1: Open a New Terminal

Open a **new terminal window** (keep the Electron app running in the background).

### Step 2: Start Claude Code CLI

```bash
cd D:\AI\MCPDatabase\electron-app
claude-code --config claude-code-config.json
```

**Alternative methods if the above doesn't work:**

```bash
# Method 2: Using absolute path
claude-code --config D:\AI\MCPDatabase\electron-app\claude-code-config.json

# Method 3: If Claude Code uses environment variables
$env:MCP_SERVER_URL="http://localhost:3001"
claude-code

# Method 4: If Claude Code uses different config format
# You may need to manually configure Claude Code to use:
# Server URL: http://localhost:3001
```

## 🧪 Testing Commands

Once Claude Code CLI is connected, try these commands:

### 1. List Tables
```
List all tables in the database
```

**What happens:**
- Claude Code CLI calls the `list_tables` tool
- MCP server queries your database
- Returns list of all tables

### 2. Get Schema
```
Get the complete schema for the database
```

**What happens:**
- Claude Code CLI calls the `get_schema` tool
- Returns comprehensive schema information

### 3. Execute a Query
```
Execute a query to get the first 10 rows from [your_table_name]
```

**Replace `[your_table_name]` with an actual table from your database.**

**What happens:**
- Claude Code CLI calls the `execute_query` tool
- Executes your SQL query
- Returns results

### 4. Get Relationships
```
Show me the foreign key relationships for the [table_name] table
```

**What happens:**
- Claude Code CLI calls the `get_relationships` tool
- Returns foreign key relationships

### 5. Analyze Data
```
Analyze the data in the [table_name] table
```

**What happens:**
- Claude Code CLI calls the `analyze_data` tool
- Gets table structure and sample data
- Returns analysis

## 🎯 Example Conversation

```
You: List all tables in the database

Claude Code: [Uses list_tables tool]
I can see the following tables in your database:
- customers
- orders
- products
- order_items
- categories

You: Get the schema for the orders table

Claude Code: [Uses get_schema tool]
Here's the schema for the orders table:
...

You: Execute a query to get the 5 most recent orders

Claude Code: [Uses execute_query tool]
Here are the 5 most recent orders:
...
```

## 🔍 Verifying Connection

To verify Claude Code CLI is connected to the MCP server:

1. **Check that Electron app is running:**
   ```powershell
   Invoke-WebRequest -Uri "http://localhost:3001/health"
   ```

2. **Check available tools:**
   ```powershell
   Invoke-RestMethod -Uri "http://localhost:3001/mcp/tools/list"
   ```

3. **Ask Claude Code CLI:**
   ```
   What tools do you have available?
   ```

   Claude Code should list the 5 tools:
   - list_tables
   - get_schema
   - execute_query
   - get_relationships
   - analyze_data

## 🐛 Troubleshooting

### Claude Code CLI Cannot Find Config File

**Solution 1:** Use absolute path
```bash
claude-code --config D:\AI\MCPDatabase\electron-app\claude-code-config.json
```

**Solution 2:** Copy config to Claude Code's config directory
```bash
# Find where Claude Code stores configs
# Then copy claude-code-config.json there
```

### Claude Code CLI Doesn't Support --config Flag

Some versions of Claude Code CLI may use different configuration methods:

**Option A:** Set environment variable
```powershell
$env:MCP_SERVER_URL="http://localhost:3001"
claude-code
```

**Option B:** Edit Claude Code's default config file
Find Claude Code's configuration file (usually in `~/.config/claude-code/` or similar) and add:
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

### Claude Code CLI Cannot Connect

**Check:**
1. Electron app is running
2. MCP server is responding:
   ```powershell
   Invoke-WebRequest -Uri "http://localhost:3001/health"
   ```
3. No firewall blocking localhost:3001
4. Claude Code CLI version supports MCP protocol

### Tools Not Available

**Check:**
1. Claude Code CLI successfully connected
2. Tools are listed in config file
3. MCP server tools endpoint works:
   ```powershell
   Invoke-RestMethod -Uri "http://localhost:3001/mcp/tools/list"
   ```

## 📝 Important Notes

1. **Keep Electron app running** - Claude Code CLI needs it to function
2. **All data stays local** - No external connections
3. **Privacy preserved** - Everything runs on localhost
4. **Database access** - Only what your database user can access

## ✅ Success Indicators

You know Claude Code CLI is working when:
- ✅ Claude Code CLI starts without errors
- ✅ Can ask about available tools
- ✅ Commands execute successfully
- ✅ Database queries return results
- ✅ No connection errors

## 🎉 You're Ready!

If Claude Code CLI is connected, you can now:
- Query your database conversationally
- Explore schema and relationships
- Analyze data
- Execute SQL queries
- All while keeping data local!

## 💡 Tips

1. **Be specific** - Mention table names when relevant
2. **Start simple** - Try listing tables first
3. **Check results** - Verify query results make sense
4. **Use natural language** - Claude Code understands context
5. **Keep app running** - Don't close Electron app while using Claude Code CLI

---

**Need help?** Check the troubleshooting section or test the MCP server directly with the Electron app UI.

