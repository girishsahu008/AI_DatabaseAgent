# Quick Start Guide - Electron App & Claude Code CLI Testing

## ⚠️ Important: Port Changed

The MCP server now runs on **port 3001** (changed from 3000 to avoid conflicts).

## Step 1: Start Electron App

```bash
cd electron-app
npm start
```

Wait for:
- ✅ Electron window to open
- ✅ Status to show "Server running on localhost:3001"
- ✅ Tools to appear in sidebar

## Step 2: Test MCP Server

### Test Health Endpoint
```powershell
Invoke-WebRequest -Uri "http://localhost:3001/health" -Method GET
```

### Test Tools List
```powershell
Invoke-WebRequest -Uri "http://localhost:3001/mcp/tools/list" -Method GET
```

### Run Test Script
```bash
node test-mcp-server.js
```

(Note: Update the script to use port 3001)

## Step 3: Test in Electron App UI

1. **Select a tool** from sidebar (e.g., "list_tables")
2. **Click "Execute"**
3. **View results**

## Step 4: Test with Claude Code CLI

### Update Configuration

The `claude-code-config.json` is already configured for port 3001.

### Start Claude Code CLI

```bash
claude-code --config electron-app/claude-code-config.json
```

### Test Commands in Claude Code CLI

1. **"List all tables in the database"**
2. **"Get the schema for the database"**
3. **"Execute a query to get the first 5 rows from [table]"**
4. **"Show relationships for [table]"**
5. **"Analyze data in [table]"**

## Troubleshooting

### Port Already in Use

If port 3001 is also in use, change it in:
1. `electron-app/main.js` - Change `mcpServerPort`
2. `electron-app/claude-code-config.json` - Update URL

### Electron App Not Starting

1. Check Node.js version (18+ required)
2. Verify dependencies installed: `npm install`
3. Check database connection in `config.env`
4. Review console for errors

### Claude Code CLI Not Connecting

1. Verify Electron app is running
2. Test MCP server: `curl http://localhost:3001/health`
3. Check configuration file path
4. Verify port matches in config

## Success Checklist

- [ ] Electron app starts
- [ ] MCP server runs on localhost:3001
- [ ] Health endpoint responds
- [ ] Tools list works
- [ ] Tools can be executed in UI
- [ ] Claude Code CLI can connect (if installed)
- [ ] All data stays local

## Next Steps

1. Test all tools in Electron app
2. Test with Claude Code CLI
3. Verify privacy (all data local)
4. Build app for distribution (optional)

