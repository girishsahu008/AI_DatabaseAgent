# Claude Code Integration Guide

## Overview

**Claude Code** is Anthropic's official terminal-based AI coding assistant. It natively supports **Model Context Protocol (MCP)**, which means your MCP server can be used directly with Claude Code!

Reference: https://code.claude.com/docs/en/sub-agents

## 🎯 What This Means for You

Your MCP server (the one we built) can be used with Claude Code's AI to:
- Ask natural language questions
- Generate SQL from English queries
- Execute database operations
- All powered by **real Claude AI** (not pattern matching)

## 🔧 How to Configure Claude Code with Your MCP Server

### Step 1: Install Claude Code

If you haven't installed Claude Code yet, get it from: https://code.claude.com/

### Step 2: Configure MCP Server for Claude Code

Claude Code uses **stdio transport** (not HTTP). Your current MCP server (`src/index.js`) already supports this!

**Your MCP server is already compatible with Claude Code!**

### Step 3: Configure Claude Code

Claude Code needs to know about your MCP server. Configuration is typically in:
- `~/.claude/config.json` (Windows: `C:\Users\YourName\.claude\config.json`)

**Add your MCP server:**

```json
{
  "mcpServers": {
    "postgresql": {
      "command": "node",
      "args": ["D:\\AI\\MCPDatabase\\src\\index.js"],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

**Or use relative path if you're in the project directory:**

```json
{
  "mcpServers": {
    "postgresql": {
      "command": "node",
      "args": ["src/index.js"]
    }
  }
}
```

### Step 4: Start Claude Code

```bash
cd D:\AI\MCPDatabase
claude-code
```

Claude Code will:
- Automatically detect your MCP server configuration
- Start your MCP server (`src/index.js`)
- Connect to it via stdio
- Make all MCP tools available

## 💬 Using Claude Code with Your Database

### Ask Natural Language Questions

```bash
You: Find the sales for last month

Claude Code: I'll query the database for you. Let me use the execute_query tool.

[Generates SQL]:
SELECT * FROM orders 
WHERE order_date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
AND order_date < DATE_TRUNC('month', CURRENT_DATE)

[Executes via your MCP server]
[Shows results]
```

### Example Queries

```
You: List all tables in the database

Claude Code: [Uses list_tables tool from your MCP server]

You: Which fabric sold the most this year?

Claude Code: [Uses execute_query tool, generates smart SQL, shows results]

You: Show me the schema for the orders table

Claude Code: [Uses describe_table tool from your MCP server]

You: Save this chat context as 'sales_analysis'

Claude Code: [Uses save_chat_context tool from your MCP server]
```

## 🛠️ Your MCP Tools Available in Claude Code

All the tools from your MCP server are available:

1. **Database Exploration:**
   - `list_tables` - List all tables
   - `describe_table` - Get table schema
   - `get_table_relationships` - Get foreign keys
   - `get_schema_info` - Get complete schema

2. **Query Execution:**
   - `execute_query` - Run SQL queries

3. **Context Management:**
   - `save_chat_context` - Save conversation
   - `list_saved_contexts` - List saved sessions
   - `load_chat_context` - Load previous session
   - `append_to_current_context` - Add findings

4. **Schema Documentation:**
   - `generate_schema_docs` - Generate docs
   - `export_schema_json` - Export schema

## 🎯 Complete Configuration Example

**File:** `~/.claude/config.json` or `C:\Users\YourName\.claude\config.json`

```json
{
  "mcpServers": {
    "postgresql": {
      "command": "node",
      "args": ["D:\\AI\\MCPDatabase\\src\\index.js"],
      "description": "PostgreSQL database MCP server with context persistence",
      "env": {
        "NODE_ENV": "production"
      }
    }
  },
  "defaultModel": "claude-3-5-sonnet-20241022"
}
```

## 🚀 Quick Start with Claude Code

### 1. Configure Claude Code

Edit `~/.claude/config.json`:

```json
{
  "mcpServers": {
    "postgresql": {
      "command": "node",
      "args": ["D:\\AI\\MCPDatabase\\src\\index.js"]
    }
  }
}
```

### 2. Start Claude Code

```bash
cd D:\AI\MCPDatabase
claude-code
```

### 3. Ask Questions

```
List all tables in the database
```

```
Find the sales for last month
```

```
Which fabric sold the most this year?
```

Claude Code's AI will:
- Understand your natural language question
- Choose the appropriate MCP tool
- Generate SQL if needed
- Execute via your MCP server
- Show formatted results

## 🎨 Features with Claude Code

### Natural Language Understanding
- ✅ Real Claude AI (Sonnet 3.5)
- ✅ Understands complex questions
- ✅ Generates intelligent SQL
- ✅ Explains results

### Context Persistence
- ✅ Save chat contexts
- ✅ Load previous sessions
- ✅ Continue from where you left off
- ✅ Auto-loading resources

### Database Operations
- ✅ Query database with English
- ✅ Explore schema
- ✅ Analyze data
- ✅ Generate reports

## 📝 Configuration File Locations

### Windows
```
C:\Users\YourName\.claude\config.json
```

### Linux/Mac
```
~/.claude/config.json
```

### Project-specific (optional)
```
D:\AI\MCPDatabase\.claude\config.json
```

## 🔍 Verify Configuration

After configuring, start Claude Code:

```bash
claude-code
```

Then ask:
```
What tools do you have available?
```

Claude should list all your MCP tools!

## ✨ Example Conversation with Claude Code

```
$ claude-code

Claude Code v1.0.0
Connected to MCP server: postgresql

You: List all tables in the database

Claude: I'll list the tables for you using the list_tables tool.

[Calls your MCP server's list_tables tool]

Tables in your database:
1. orders
2. customers  
3. products
4. order_items
5. fabrics
...

You: Find the sales for last month

Claude: I'll query the orders for last month. Let me execute this SQL:

SELECT * FROM orders 
WHERE order_date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
AND order_date < DATE_TRUNC('month', CURRENT_DATE)
ORDER BY order_date DESC

[Calls execute_query tool via your MCP server]

Found 45 orders from last month with total revenue of $125,430

You: Which fabric sold the most?

Claude: I'll analyze the product sales. Let me execute:

SELECT p.fabric_type, COUNT(*) as sales_count, SUM(oi.quantity) as total_quantity
FROM order_items oi
JOIN products p ON oi.product_id = p.id
WHERE p.fabric_type IS NOT NULL
GROUP BY p.fabric_type
ORDER BY sales_count DESC
LIMIT 10

[Executes via your MCP server]

Top selling fabrics:
1. Cotton - 1,234 sales
2. Silk - 987 sales
3. Wool - 756 sales
...

You: Save this as 'fabric_sales_analysis'

Claude: I'll save this session for you.

[Calls save_chat_context tool]

✅ Context saved successfully!
```

## 🎯 This is What You Want!

**Claude Code + Your MCP Server = Perfect Terminal-based Database Chat**

- ✅ Real Claude AI (Sonnet 3.5)
- ✅ Natural language queries
- ✅ Terminal-based (no GUI needed)
- ✅ Uses your MCP server
- ✅ All your tools available
- ✅ Context persistence
- ✅ Privacy (all local)

## 📋 Next Steps

1. **Find Claude Code config file:**
   ```powershell
   # Windows
   Test-Path C:\Users\$env:USERNAME\.claude\config.json
   ```

2. **Add MCP server configuration** (see above)

3. **Start Claude Code:**
   ```bash
   claude-code
   ```

4. **Ask:** "List all tables in the database"

5. **Test natural language:** "Find the sales for last month"

---

**This is the terminal-based AI chat you wanted!** 🚀

