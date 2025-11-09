# 🚀 Start Here - Electron App & Claude Code CLI Testing

## Quick Start (3 Steps)

### 1. Start Electron App

```bash
cd electron-app
npm start
```

**Wait for:**
- ✅ Electron window to open
- ✅ Status to show "Server running on localhost:3001"
- ✅ Tools to appear in sidebar

### 2. Test MCP Server

```powershell
# Quick health check
Invoke-WebRequest -Uri "http://localhost:3001/health" -Method GET
```

**Or use the test script:**
```bash
node test-mcp-server.js
```

### 3. Test Claude Code CLI

**If Claude Code CLI is installed:**

```bash
claude-code --config electron-app/claude-code-config.json
```

**Then try commands like:**
- "List all tables in the database"
- "Get the schema for the database"
- "Execute a query to get the first 5 rows from [table]"

## 📋 What You Need

1. ✅ Node.js 18+
2. ✅ Database configured in `config.env`
3. ✅ Dependencies installed (`npm install`)
4. ✅ Claude Code CLI installed (for CLI testing)

## 🔧 Configuration

- **MCP Server Port:** 3001 (localhost only)
- **Config File:** `claude-code-config.json`
- **Database Config:** `config.env`

## 🐛 Troubleshooting

### App Won't Start
- Check Node.js version
- Verify dependencies: `npm install`
- Check database config: `config.env`

### Server Not Running
- Check console for errors
- Verify database connection
- Check port 3001 is available

### Claude Code CLI Not Connecting
- Ensure Electron app is running
- Test server: `curl http://localhost:3001/health`
- Check configuration file path

## 📚 Documentation

- **Quick Start:** `QUICK_START.md`
- **Testing:** `TESTING_INSTRUCTIONS.md`
- **Setup:** `SETUP_GUIDE.md`
- **Claude Code CLI:** `CLAUDE_CODE_CLI_TEST.md`

## ✅ Success Indicators

- ✅ Electron window opens
- ✅ Status shows "Server running"
- ✅ Tools appear in sidebar
- ✅ Health endpoint responds
- ✅ Tools execute successfully
- ✅ Claude Code CLI connects (if installed)

## 🎯 Next Steps

1. Start the app
2. Test the server
3. Test tools in UI
4. Test Claude Code CLI
5. Verify privacy (all data local)

---

**Need help?** Check the troubleshooting section or review the detailed documentation files.

