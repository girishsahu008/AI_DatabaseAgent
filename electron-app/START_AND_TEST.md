# How to Start and Test the Electron App

## 🚀 Starting the Electron App

### Step 1: Install Dependencies (if not done)

```bash
cd electron-app
npm install
```

### Step 2: Ensure Database Configuration Exists

```bash
# Copy config from parent directory
cp ../config.env .
```

### Step 3: Start the App

```bash
npm start
```

**What should happen:**
1. Electron window opens
2. Console shows "MCP Server components initialized successfully"
3. Console shows "MCP HTTP Server running on http://localhost:3001"
4. UI shows status as "Server running on localhost:3001"
5. Tools appear in sidebar

## 🧪 Testing the MCP Server

### Test 1: Check if Server is Running

**Wait 5-10 seconds after starting the app, then:**

```powershell
# Test health endpoint
Invoke-WebRequest -Uri "http://localhost:3001/health" -Method GET
```

**Expected response:**
```json
{"status":"ok","port":3001}
```

### Test 2: List Available Tools

```powershell
Invoke-WebRequest -Uri "http://localhost:3001/mcp/tools/list" -Method GET
```

**Expected:** JSON with 5 tools (list_tables, get_schema, execute_query, get_relationships, analyze_data)

### Test 3: Run Test Script

```bash
node test-mcp-server.js
```

## 🎨 Testing in Electron App UI

1. **Open the Electron app window**
2. **Check status** - Should show "Server running on localhost:3001"
3. **Look at sidebar** - Should show 5 tools
4. **Click on "list_tables"**
5. **Click "Execute"** button
6. **View results** in the results panel

## 🔗 Testing Claude Code CLI

### Step 1: Ensure Electron App is Running

The MCP server must be running before Claude Code CLI can connect.

### Step 2: Check Claude Code CLI Installation

```bash
claude-code --version
```

If not installed, you'll need to install it first. The installation method depends on how Claude Code CLI is distributed.

### Step 3: Configure Claude Code CLI

The configuration file `claude-code-config.json` is already set up for port 3001:

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

### Step 4: Start Claude Code CLI

**Option A: If Claude Code CLI accepts config file:**

```bash
claude-code --config electron-app/claude-code-config.json
```

**Option B: If Claude Code CLI uses environment variables:**

```bash
export MCP_SERVER_URL="http://localhost:3001"
claude-code
```

**Option C: If Claude Code CLI has its own config file:**

You may need to edit Claude Code CLI's configuration file to point to:
```
http://localhost:3001
```

### Step 5: Test Claude Code CLI Commands

Once connected, try:

1. **"List all tables in the database"**
   - Should use `list_tables` tool

2. **"Get the schema for the database"**
   - Should use `get_schema` tool

3. **"Execute a query to get the first 5 rows from [table_name]"**
   - Should use `execute_query` tool

4. **"Show relationships for [table_name]"**
   - Should use `get_relationships` tool

5. **"Analyze data in [table_name]"**
   - Should use `analyze_data` tool

## 🐛 Troubleshooting

### Electron App Won't Start

**Check:**
1. Node.js version: `node --version` (should be 18+)
2. Dependencies: `npm install`
3. Database config: `config.env` exists and is correct
4. Console errors: Check terminal for error messages

### MCP Server Not Starting

**Common issues:**
1. **Database connection fails:**
   - Check `config.env` settings
   - Verify database is accessible
   - Test connection with: `node ../test-connection.js`

2. **Port already in use:**
   - Change port in `main.js` (line 7)
   - Update `claude-code-config.json`

3. **Module import errors:**
   - Check that `../src/` directory exists
   - Verify all dependencies are installed
   - Check console for specific error messages

### Claude Code CLI Cannot Connect

**Check:**
1. Electron app is running
2. MCP server is accessible: `curl http://localhost:3001/health`
3. Configuration file path is correct
4. Port matches (3001)
5. Claude Code CLI supports HTTP transport for MCP

### Tools Not Working

**Check:**
1. Database connection is working
2. Tool parameters are correct
3. Database permissions allow queries
4. Console logs for errors

## 📝 Important Notes

1. **Port:** MCP server runs on **localhost:3001** (changed from 3000)
2. **Privacy:** All data stays on your machine
3. **Security:** Server only accessible from localhost
4. **Database:** Must be configured in `config.env`

## ✅ Success Checklist

- [ ] Electron app starts
- [ ] Electron window opens
- [ ] Status shows "Server running"
- [ ] Tools appear in sidebar
- [ ] Health endpoint responds
- [ ] Tools list endpoint works
- [ ] Can execute tools in UI
- [ ] Claude Code CLI can connect (if installed)
- [ ] All data stays local

## 📚 Additional Resources

- **Quick Start:** `QUICK_START.md`
- **Testing Instructions:** `TESTING_INSTRUCTIONS.md`
- **Claude Code CLI Test:** `CLAUDE_CODE_CLI_TEST.md`
- **Setup Guide:** `SETUP_GUIDE.md`

## 💡 Tips

1. **Keep Electron app running** while testing
2. **Check console** for detailed logs
3. **Test one tool at a time**
4. **Verify database connection** first
5. **Use test script** to verify server

## 🎯 Next Steps

1. Start Electron app: `npm start`
2. Verify MCP server: Test with curl or test script
3. Test tools in UI: Try each tool
4. Test Claude Code CLI: Connect and test commands
5. Verify privacy: Ensure all data stays local

