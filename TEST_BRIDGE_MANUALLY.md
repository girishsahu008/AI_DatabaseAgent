# Test Bridge Server Manually

## Step-by-Step Testing

### Step 1: Start Bridge Server in a NEW Terminal

**Open a FRESH PowerShell terminal** (not in Claude Code), then:

```bash
cd D:\AI\MCPDatabase
node claude-code-bridge-server.cjs
```

### Step 2: Watch the Output

You should see:
```
╔══════════════════════════════════════════════════════════╗
║   Claude Code Bridge Server                              ║
║   Connects Electron App ↔ Claude Code                   ║
╚══════════════════════════════════════════════════════════╝

🚀 Starting Claude Code...
```

Then Claude Code should start and show its welcome screen.

### Step 3: Wait for Ready Message

Look for ONE of these:
```
✅ Claude Code is ready!
```

**OR** (after 15 seconds):
```
✅ Claude Code initialized (timeout reached, assuming ready)
💡 If you see Claude Code running above, it should work!
```

**If you see the Claude Code welcome screen with the box drawing characters and ">", it IS ready!**

### Step 4: Check if Claude Code Actually Started

You should see Claude Code's interface in that terminal, like:
```
╭─── Claude Code v2.0.36 ──────────────────────────────────╮
│        Welcome back Girish!        │ Tips ...             │
│               ▐▛███▜▌              │                      │
│      Sonnet 4.5 · Claude Pro       │                      │
╰──────────────────────────────────────────────────────────╯

> 
```

**If you see this, Claude Code IS running!** Even if the timeout message appeared.

### Step 5: Test the Bridge Server

**Open ANOTHER PowerShell terminal** and test:

```powershell
# Test health
Invoke-RestMethod -Uri "http://localhost:3002/health"
```

**Expected:**
```json
{
  "status": "ok",
  "claudeRunning": true,
  "port": 3002
}
```

### Step 6: Test Sending a Query

```powershell
$body = @{
    query = "List all tables in the database"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3002/claude/query" -Method POST -Body $body -ContentType "application/json"
```

**Watch Terminal 1 (Bridge Server):**
- Should show "Sending to Claude: List all tables..."
- Claude Code should process it
- Should show "Response received"

**Terminal 2 should show:**
- The response from Claude Code

### Step 7: If That Works, Start Electron App

**In yet another terminal:**

```bash
cd D:\AI\MCPDatabase\electron-app
npm start
```

The Electron app should:
- Connect to bridge server (localhost:3002)
- Show status: "🤖 Claude AI Ready"
- Let you chat with Claude Code

## 🐛 Troubleshooting

### Bridge Shows "timeout reached, assuming ready"

**This is OK if:**
- You can see Claude Code's welcome screen
- The terminal shows ">"  prompt
- Health check returns `claudeRunning: true`

**The timeout just means Claude Code's output didn't match expected patterns, but it still started!**

### Health Check Shows "claudeRunning: false"

**Means:**
- Claude Code process didn't start
- Check for error messages
- Try running `claude` manually to see if it works

### Query Test Hangs

**Possible issues:**
1. Claude Code not seeing the input
2. Response not being captured
3. Timeout too short

**Try:**
- Type directly in Terminal 1 (bridge server terminal)
- See if Claude responds there
- If it does, the bridge is working!

## ✅ Success Indicators

**Terminal 1 (Bridge Server):**
- Shows Claude Code welcome screen
- Shows "Bridge Server running on http://localhost:3002"
- Has a ">" prompt or Claude interface visible

**Terminal 2 (Test):**
- Health check returns `claudeRunning: true`
- Query test returns a response

**Electron App:**
- Status: "🤖 Claude AI Ready (Powered by Claude Code)"
- Can send messages and get responses

---

**The bridge server is updated. Try starting it again and watch for the Claude Code welcome screen!**

