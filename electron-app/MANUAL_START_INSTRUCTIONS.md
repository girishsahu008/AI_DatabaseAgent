# Manual Start Instructions

## The Electron app has been started in the background

It may take 10-20 seconds for the MCP server to fully initialize, especially on the first run.

## ✅ Step 1: Check if Electron Window Opened

You should see:
- **Electron window** opened on your screen
- **Status indicator** showing connection status
- **Sidebar** with 5 tools listed

If you don't see the window, it may be behind other windows or minimized.

## ✅ Step 2: Wait for MCP Server to Initialize

The console in the Electron app will show:
```
MCP Server components initialized successfully
MCP HTTP Server running on http://localhost:3001
```

**This can take 10-20 seconds**, especially for database initialization.

## ✅ Step 3: Verify MCP Server is Running

Open a **new PowerShell window** and test:

```powershell
# Test health endpoint
Invoke-WebRequest -Uri "http://localhost:3001/health" -Method GET
```

**Expected response:**
```json
{"status":"ok","port":3001}
```

If you get an error, wait a few more seconds and try again.

## ✅ Step 4: Test in Electron UI

1. **Look at the Electron window**
2. **Check the status** (top right) - should show "Server running on localhost:3001"
3. **Click on "list_tables"** in the sidebar
4. **Click "Execute"** button
5. **View results** in the results panel

## ✅ Step 5: Start Claude Code CLI

Once the MCP server is running (status shows "Server running"), open a **new terminal** and run:

```bash
cd D:\AI\MCPDatabase\electron-app
claude-code --config claude-code-config.json
```

**If that doesn't work, try:**

```bash
# Method 1: Absolute path
claude-code --config D:\AI\MCPDatabase\electron-app\claude-code-config.json

# Method 2: Environment variable
$env:MCP_SERVER_URL="http://localhost:3001"
claude-code

# Method 3: Check Claude Code CLI documentation
# for the correct configuration method
```

## 🧪 Testing Claude Code CLI

Once Claude Code CLI is running, try these commands:

### Test 1: Check Available Tools
```
What tools do you have available?
```

### Test 2: List Database Tables
```
List all tables in the database
```

### Test 3: Get Schema
```
Get the schema for the database
```

### Test 4: Execute a Query
```
Execute a query to get the first 5 rows from [your_table_name]
```

Replace `[your_table_name]` with an actual table from your database.

## 🐛 If Something Goes Wrong

### Electron App Won't Start

**Check:**
1. Look for the Electron window (may be behind other windows)
2. Check console output for errors
3. Verify database connection in `config.env`

**Restart:**
```bash
# Close the app and restart
cd D:\AI\MCPDatabase\electron-app
npm start
```

### MCP Server Not Responding

**Check:**
```powershell
# Test if server is running
Invoke-WebRequest -Uri "http://localhost:3001/health"
```

**If it fails:**
1. Check the Electron app console for errors
2. Verify database connection
3. Check if port 3001 is available

### Database Connection Error

**Check `config.env`:**
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=your_database
DB_USER=your_username
DB_PASSWORD=your_password
```

**Test database connection:**
```bash
cd D:\AI\MCPDatabase
node test-connection.js
```

## 📝 Quick Reference

**MCP Server URL:** `http://localhost:3001`

**Available Tools:**
1. `list_tables` - List all database tables
2. `get_schema` - Get schema information
3. `execute_query` - Execute SQL queries
4. `get_relationships` - Get table relationships
5. `analyze_data` - Analyze table data

**Claude Code CLI Config:** `D:\AI\MCPDatabase\electron-app\claude-code-config.json`

## ✅ Success Indicators

- ✅ Electron window is open
- ✅ Status shows "Server running on localhost:3001"
- ✅ Health endpoint responds: `http://localhost:3001/health`
- ✅ Tools are listed in sidebar
- ✅ Can execute tools in UI
- ✅ Claude Code CLI can connect

## 💡 Next Steps

1. **Wait for Electron app to fully start** (10-20 seconds)
2. **Verify status** in Electron window
3. **Test tools** in Electron UI
4. **Start Claude Code CLI** in new terminal
5. **Test commands** in Claude Code CLI

---

**The Electron app should be starting now. Give it 10-20 seconds to fully initialize, then check the Electron window and try the verification steps above.**

