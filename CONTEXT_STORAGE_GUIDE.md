# Context Session Storage Guide

## 📍 Where Context Sessions Are Stored

### Physical Storage Location

**Directory:** `./chat_contexts/` (in your project root)

**Full Path:**
- **Windows:** `D:\AI\MCPDatabase\chat_contexts\`
- **Linux/Mac:** `./chat_contexts/` (relative to project root)

**File Naming Pattern:**
```
context_YYYY-MM-DD_HH-MM-SS_[session-name].json
```

**Example:**
```
context_2024-11-06_14-30-45_sales_analysis.json
```

---

## 📂 Directory Structure

```
MCPDatabase/
├── chat_contexts/                    ← Context sessions stored here
│   ├── context_2024-11-06_14-30-45_sales_analysis.json
│   ├── context_2024-11-06_15-20-10_customer_review.json
│   └── context_2024-11-07_09-15-30_q3_report.json
├── src/
├── working-postgresql-mcp.js
└── ...
```

---

## 🔍 How to Find Your Stored Contexts

### Method 1: Command Line

**Windows (PowerShell):**
```powershell
# List all context files
dir chat_contexts\

# View a specific context file
Get-Content chat_contexts\context_*.json | ConvertFrom-Json | ConvertTo-Json -Depth 10
```

**Linux/Mac:**
```bash
# List all context files
ls -la chat_contexts/

# View a specific context file
cat chat_contexts/context_*.json | jq .
```

### Method 2: Using MCP Tools

**In Claude Desktop, use the tool:**
```
Use list_saved_contexts to see all saved sessions
```

This will show you:
- Session names
- Session IDs
- Creation dates
- Summaries
- Query counts
- Findings counts

### Method 3: Check File System

The directory is created automatically when the MCP server starts. You can verify it exists:

```bash
# Check if directory exists
ls -la chat_contexts/  # Linux/Mac
dir chat_contexts      # Windows PowerShell
```

---

## 📄 Context File Structure

Each context file is a JSON file with this structure:

```json
{
  "sessionId": "2024-11-06_14-30-45",
  "sessionName": "sales_analysis",
  "createdAt": "2024-11-06T14:30:45Z",
  "summary": "Analyzed Q3 sales data, focused on customer segments",
  "queriesExecuted": [
    {
      "timestamp": "2024-11-06T14:31:00Z",
      "query": "SELECT * FROM orders WHERE order_date >= '2024-07-01'",
      "purpose": "Get Q3 orders",
      "rowsReturned": 1250
    }
  ],
  "keyFindings": [
    "Revenue increased 23% in Q3",
    "Enterprise segment growing fastest"
  ],
  "tablesAccessed": ["orders", "customers", "order_items"],
  "columnsAnalyzed": {
    "orders": ["total_amount", "order_date", "status"],
    "customers": ["segment", "created_at"]
  },
  "userNotes": "Initial analysis of Q3 performance"
}
```

---

## 🔄 How Claude Desktop Accesses Contexts

### MCP Resources (Auto-Loading)

Claude Desktop accesses saved contexts through **MCP Resources**, which automatically load into Claude's context window.

**Resource URIs:**
1. `session://latest/summary` - Latest session summary
2. `session://history/overview` - Last 5 sessions overview

### How It Works

1. **When you save a context:**
   - Context is saved to `./chat_contexts/` directory as JSON file
   - File persists on disk

2. **When Claude Desktop starts:**
   - Claude Desktop requests available resources from MCP server
   - MCP server reads the latest context from `./chat_contexts/` directory
   - Formats it as markdown and returns it as a resource
   - Claude Desktop automatically loads it into the context window

3. **When you start a new conversation:**
   - Latest session summary is automatically available
   - Claude can reference previous analysis
   - You can continue from where you left off

### Resource Flow Diagram

```
┌─────────────────┐
│  Claude Desktop │
│  (New Chat)     │
└────────┬────────┘
         │
         │ 1. Request Resources
         ▼
┌─────────────────┐
│   MCP Server    │
│  (working-      │
│   postgresql-   │
│   mcp.js)       │
└────────┬────────┘
         │
         │ 2. Read from disk
         ▼
┌─────────────────┐
│  chat_contexts/ │
│  directory      │
│                 │
│  context_*.json │
└────────┬────────┘
         │
         │ 3. Format as markdown
         ▼
┌─────────────────┐
│  MCP Resource   │
│  (Markdown)     │
└────────┬────────┘
         │
         │ 4. Return to Claude
         ▼
┌─────────────────┐
│  Claude Desktop │
│  (Context Loaded)│
└─────────────────┘
```

---

## 🚀 How to Continue from a Saved Context

### Method 1: Automatic (Recommended)

1. **Save your context:**
   ```
   Use save_chat_context with:
   - sessionName: "my_analysis"
   - summary: "What I was working on"
   ```

2. **Restart Claude Desktop** (or start a new conversation)

3. **The latest session automatically loads:**
   - Claude Desktop requests resources
   - Latest session summary appears in context
   - You can ask: "Continue from the previous analysis"

### Method 2: Manual Load

1. **List available contexts:**
   ```
   Use list_saved_contexts
   ```

2. **Load a specific context:**
   ```
   Use load_chat_context with:
   - sessionIdOrName: "my_analysis"
   ```

3. **Continue your work:**
   - Claude now has the full context
   - You can reference previous queries and findings

### Method 3: Reference in Conversation

Simply ask Claude:
```
"What was the last analysis session about?"
"Continue from the previous sales analysis"
"Show me the queries from the last session"
```

Claude will access the saved context through MCP Resources.

---

## 🔧 Configuration

### Context Directory Location

The context directory is automatically created at:
```
[Project Root]/chat_contexts/
```

**To change the location**, modify `src/tools/contextManager.js`:

```javascript
// Current (line 11)
this.contextsDir = join(__dirname, '../../chat_contexts');

// Change to custom location
this.contextsDir = join(__dirname, '../../my_custom_contexts');
// or absolute path
this.contextsDir = 'C:/Users/YourName/Documents/contexts';
```

### Git Ignore

The `chat_contexts/` directory is already in `.gitignore` to prevent committing user data:

```gitignore
# Chat context files (user-specific conversation data)
chat_contexts/
*.context.json
```

---

## 📊 Viewing Context Files

### View All Contexts

**Using MCP Tool (in Claude Desktop):**
```
Use list_saved_contexts
```

**Using Command Line:**
```bash
# List all files
ls -la chat_contexts/

# Count contexts
ls chat_contexts/*.json | wc -l

# View latest context
ls -t chat_contexts/*.json | head -1 | xargs cat | jq .
```

### View Specific Context

**Using MCP Tool:**
```
Use load_chat_context with sessionIdOrName: "session_name"
```

**Using Command Line:**
```bash
# Find by name
grep -l "session_name" chat_contexts/*.json

# View file
cat chat_contexts/context_*_session_name.json | jq .
```

### View Context Content

**Pretty Print JSON:**
```bash
# Linux/Mac
cat chat_contexts/context_*.json | jq .

# Windows PowerShell
Get-Content chat_contexts\context_*.json | ConvertFrom-Json | ConvertTo-Json -Depth 10
```

---

## 🔍 Troubleshooting

### Contexts Not Appearing in Claude Desktop

**Problem:** Saved contexts don't auto-load in Claude Desktop

**Solutions:**
1. **Verify contexts exist:**
   ```bash
   ls -la chat_contexts/
   ```

2. **Check MCP server is running:**
   - Server must be running for resources to be available
   - Restart the server if needed

3. **Restart Claude Desktop:**
   - Resources are loaded when Claude Desktop starts
   - Restart to trigger resource loading

4. **Check server logs:**
   - Look for errors in server console
   - Verify ContextManager is initialized

5. **Verify MCP configuration:**
   - Check Claude Desktop MCP settings
   - Ensure server is properly configured

### Can't Find Context Files

**Problem:** Context files are not in expected location

**Solutions:**
1. **Check current working directory:**
   ```bash
   pwd  # Linux/Mac
   cd   # Windows
   ```

2. **Search for context files:**
   ```bash
   # Linux/Mac
   find . -name "context_*.json"

   # Windows PowerShell
   Get-ChildItem -Recurse -Filter "context_*.json"
   ```

3. **Check ContextManager initialization:**
   - Verify `chat_contexts/` directory is created
   - Check server logs for initialization errors

### Context Not Loading

**Problem:** Can't load a specific context

**Solutions:**
1. **Verify context exists:**
   ```
   Use list_saved_contexts
   ```

2. **Check file is not corrupted:**
   ```bash
   cat chat_contexts/context_*.json | jq .  # Should not error
   ```

3. **Try loading by ID instead of name:**
   ```
   Use load_chat_context with sessionIdOrName: "2024-11-06_14-30-45"
   ```

---

## 📝 Best Practices

### Organizing Contexts

1. **Use descriptive session names:**
   - ✅ Good: `sales_analysis_q3_2024`
   - ❌ Bad: `test`, `session1`

2. **Add meaningful summaries:**
   - Helps identify contexts later
   - Makes auto-loaded summaries more useful

3. **Regular cleanup:**
   - Delete old/unused contexts
   - Keep only relevant sessions

### Backup Contexts

**To backup your contexts:**
```bash
# Create backup
tar -czf contexts_backup_$(date +%Y%m%d).tar.gz chat_contexts/

# Or copy directory
cp -r chat_contexts/ contexts_backup/
```

### Sharing Contexts

**To share a context with someone:**
1. Copy the JSON file from `chat_contexts/`
2. They can place it in their `chat_contexts/` directory
3. They can load it using `load_chat_context`

**Note:** Be careful sharing contexts that contain sensitive data!

---

## 🎯 Quick Reference

| Action | Command/Tool |
|--------|-------------|
| **List contexts** | `list_saved_contexts` tool |
| **Load context** | `load_chat_context` tool |
| **Save context** | `save_chat_context` tool |
| **View files** | `ls chat_contexts/` or `dir chat_contexts` |
| **View JSON** | `cat chat_contexts/*.json \| jq .` |
| **Directory location** | `./chat_contexts/` (project root) |
| **File pattern** | `context_YYYY-MM-DD_HH-MM-SS_name.json` |

---

## 📌 Summary

- **Storage Location:** `./chat_contexts/` directory in project root
- **File Format:** JSON files with pattern `context_*.json`
- **Access Method:** MCP Resources (auto-loads in Claude Desktop)
- **Manual Access:** Use `list_saved_contexts` and `load_chat_context` tools
- **Auto-Loading:** Latest session automatically loads when Claude Desktop starts

The contexts are stored locally on your machine and are automatically made available to Claude Desktop through the MCP server's resource system.

