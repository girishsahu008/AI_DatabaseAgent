# 🚀 Complete System Startup Guide

## Architecture Overview

```
Terminal 1: Claude Code Bridge Server
    ↓
Runs Claude Code in interactive mode
Exposes via HTTP on localhost:3002
    ↓
Terminal 2: Electron App
    ↓
Chat UI connects to Bridge Server
    ↓
Bridge forwards questions to Claude Code
    ↓
Claude Code uses MCP Server
    ↓
PostgreSQL Database
```

## 🎯 Three-Terminal Setup

### Terminal 1: Start Claude Code Bridge

```bash
cd D:\AI\MCPDatabase
node claude-code-bridge-server.js
```

**What you'll see:**
```
🚀 Starting Claude Code...
✅ Claude Code is ready!
🌐 Bridge Server running on http://localhost:3002
💡 You can also interact directly in this terminal
```

**Leave this terminal open!** You can also type directly in it to chat with Claude!

### Terminal 2: Start Electron App

```bash
cd D:\AI\MCPDatabase\electron-app
npm start
```

**What you'll see:**
- Electron window opens
- Status: "🤖 Claude AI Ready (Powered by Claude Code)"
- Chat interface ready

### Terminal 3: (Optional) Test Bridge

```bash
# Test the bridge is working
curl -X POST http://localhost:3002/claude/query \
  -H "Content-Type: application/json" \
  -d "{\"query\":\"Hello, can you hear me?\"}"
```

## 💬 Using the System

### In Electron App Chat:

Type any question:
```
Find the sales for last month
```

```
Which fabric sold the most this year?
```

```
How's the weather today?
```

```
Explain SQL JOIN to me
```

**All questions go to Claude Code via the bridge!**

### In Terminal 1 (Bridge Server):

You can also type directly:
```
> List all tables in the database
```

Claude Code responds in the terminal, and can use your MCP tools!

## ✨ Benefits of This Approach

1. **No API Costs** - Uses your Claude Code Pro license
2. **Full Claude AI** - Real Sonnet 4.5
3. **All Questions** - Database, general, coding, everything
4. **Visual UI** - Electron chat interface
5. **Terminal Access** - Can use both UI and terminal
6. **Your MCP Server** - All tools available
7. **No Process Embedding** - Claude runs naturally in terminal

## 🔧 How It Works

### When You Type in Electron:
```
You type: "Find sales for last month"
    ↓
Electron App sends HTTP POST to localhost:3002
    ↓
Bridge Server receives request
    ↓
Bridge writes to Claude Code's stdin
    ↓
Claude Code processes with AI
    ↓
Claude Code uses MCP tools if needed
    ↓
Claude Code writes response to stdout
    ↓
Bridge captures response
    ↓
Bridge sends HTTP response back
    ↓
Electron displays in chat UI
```

### When You Type in Terminal 1:
```
You type: "List tables"
    ↓
Claude Code receives directly
    ↓
Claude Code processes
    ↓
Uses MCP tools
    ↓
Shows response in terminal
```

## 📝 Quick Start Commands

```bash
# Terminal 1: Start bridge
npm run claude-bridge

# Terminal 2: Start Electron app
cd electron-app
npm start
```

## 🐛 Troubleshooting

### Terminal 1 Error: "Claude Code exited with code 1"

**Try:**
1. Run Claude manually first: `claude`
2. Make sure it works normally
3. Then start the bridge server

### Electron Shows "Pattern Matching"

**Means:**
- Bridge server not running
- Start Terminal 1 first!

### No Response to Queries

**Check:**
- Terminal 1 is showing Claude Code running
- Bridge server shows "Bridge Server running"
- Try typing directly in Terminal 1 to test Claude

## ✅ Success Indicators

**Terminal 1:**
```
✅ Claude Code is ready!
🌐 Bridge Server running on http://localhost:3002
```

**Terminal 2 (Electron):**
```
✅ Connected to Claude Code Bridge Server
```

**Electron Window:**
- Status: "🤖 Claude AI Ready (Powered by Claude Code)"
- Can type and get intelligent responses

## 🎉 Once Running

You can use BOTH:

**Electron Chat UI:**
- Visual interface
- Type questions
- See formatted responses
- Click example queries

**Terminal 1 (Direct):**
- Type directly to Claude
- Same MCP tools available
- See raw Claude responses
- Full terminal experience

**Both work simultaneously!**

---

## 🚀 Start Now!

**Terminal 1:**
```bash
cd D:\AI\MCPDatabase
node claude-code-bridge-server.js
```

**Terminal 2:**
```bash
cd D:\AI\MCPDatabase\electron-app
npm start
```

**Then ask in Electron:**
```
Find the sales for last month
```

or

```
How's the weather today?
```

**Both should work with Claude Code!** 🎉

