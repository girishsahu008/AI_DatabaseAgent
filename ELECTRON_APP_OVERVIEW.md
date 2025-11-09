# Electron Desktop Application Overview

## 🎯 Purpose

This Electron desktop application embeds a Model Context Protocol (MCP) server that provides secure, local PostgreSQL database access. All data remains on your machine for maximum privacy and security.

## 📁 Directory Structure

```
electron-app/
├── main.js                    # Electron main process
│   ├── MCP server initialization
│   ├── HTTP server (localhost:3000)
│   ├── Window management
│   └── IPC handlers
├── preload.js                 # Secure IPC bridge
├── renderer/
│   ├── index.html            # UI markup
│   └── renderer.js           # UI logic
├── package.json              # Dependencies & build config
├── claude-code-config.json   # Claude Code CLI configuration
├── README.md                 # App documentation
├── SETUP_GUIDE.md           # Setup instructions
└── ELECTRON_SETUP.md        # Development guide
```

## 🏗️ Architecture

### Components

1. **Electron Main Process** (`main.js`)
   - Manages application lifecycle
   - Initializes MCP server components
   - Creates HTTP server on localhost:3000
   - Handles IPC communication
   - Manages windows

2. **Electron Renderer Process** (`renderer/`)
   - Provides user interface
   - Communicates with main process via IPC
   - Calls MCP tools
   - Displays results

3. **MCP Server Components**
   - DatabaseManager - Database connection
   - SchemaExplorer - Schema exploration
   - QueryExecutor - Query execution
   - ContextManager - Context management
   - SchemaDocumentationGenerator - Documentation

4. **HTTP Server** (localhost:3000)
   - Provides REST API for MCP tools
   - Health check endpoint
   - Tool listing endpoint
   - Tool execution endpoint

## 🔌 MCP Server Integration

### HTTP API Endpoints

#### Health Check
```
GET /health
Response: { status: "ok", port: 3000 }
```

#### List Tools
```
GET /mcp/tools/list
Response: { tools: [...] }
```

#### Call Tool
```
POST /mcp/tools/call
Body: { name: "tool_name", arguments: {...} }
Response: { content: [...] }
```

### Available Tools

1. **list_tables** - List all tables
2. **get_schema** - Get schema information
3. **execute_query** - Execute SQL queries
4. **get_relationships** - Get table relationships
5. **analyze_data** - Analyze table data

## 🔒 Privacy & Security

### Data Privacy

- ✅ All data stays on your machine
- ✅ MCP server only accessible from localhost
- ✅ No external network connections
- ✅ No telemetry
- ✅ Local database access only

### Security Features

- Context isolation in Electron
- Secure IPC communication
- No node integration in renderer
- Preload script for secure API
- Localhost-only server binding

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd electron-app
npm install
```

### 2. Configure Database

```bash
cp ../config.env .
# Edit config.env with your credentials
```

### 3. Start Application

```bash
npm start
```

### 4. Use Tools

- Select a tool from the sidebar
- Fill in parameters
- Click "Execute"
- View results

## 📦 Building for Distribution

### Windows
```bash
npm run build:win
```

### macOS
```bash
npm run build:mac
```

### Linux
```bash
npm run build:linux
```

## 🔗 Claude Code CLI Integration

The application includes configuration for Claude Code CLI:

1. **Start the Electron app** (MCP server runs on localhost:3000)
2. **Use Claude Code CLI:**
   ```bash
   claude-code --config electron-app/claude-code-config.json
   ```
3. **Claude Code CLI connects** to local MCP server
4. **All data stays local** - no cloud connections

## 🛠️ Development

### Running in Development

```bash
npm run dev
```

Features:
- Auto-reload on changes
- DevTools open by default
- Detailed error logging

### Debugging

- **Main Process**: Check console output
- **Renderer Process**: Use browser DevTools (F12)
- **MCP Server**: Check server logs, test with curl

## 📝 Configuration

### Database Configuration

Edit `config.env`:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=your_database
DB_USER=your_username
DB_PASSWORD=your_password
```

### MCP Server Port

Change in `main.js`:
```javascript
let mcpServerPort = 3000; // Change port
```

### Claude Code CLI Config

Edit `claude-code-config.json`:
```json
{
  "mcp": {
    "servers": {
      "postgresql-mcp": {
        "url": "http://localhost:3000"
      }
    }
  }
}
```

## 🐛 Troubleshooting

### Common Issues

1. **Port 3000 in use** - Change port in main.js
2. **Database connection fails** - Check config.env
3. **MCP server not starting** - Check Node.js version (18+)
4. **Module import errors** - Verify dependencies installed

### Solutions

- Check console logs
- Verify database connection
- Test with curl commands
- Review error messages

## 📚 Documentation

- **README.md** - Application overview
- **SETUP_GUIDE.md** - Setup instructions
- **ELECTRON_SETUP.md** - Development guide
- **This file** - Architecture overview

## 🎯 Key Features

1. **Embedded MCP Server** - Runs on localhost:3000
2. **Desktop UI** - Native Electron interface
3. **Tool Integration** - All MCP tools available
4. **Privacy First** - All data local
5. **Claude Code CLI** - Ready for integration
6. **Cross-Platform** - Windows, macOS, Linux

## 🔄 Lifecycle

### Application Startup

1. Electron app starts
2. Main process initializes
3. MCP server components load
4. HTTP server starts (localhost:3000)
5. Window opens
6. Renderer connects

### Application Shutdown

1. User closes window
2. MCP server stops
3. Database connections close
4. Application quits

## 📊 Data Flow

```
User Interface
    ↓
Renderer Process
    ↓
IPC (preload.js)
    ↓
Main Process
    ↓
MCP HTTP Server (localhost:3000)
    ↓
MCP Server Components
    ↓
PostgreSQL Database
```

## ✨ Benefits

1. **Privacy** - All data stays on your machine
2. **Security** - Localhost-only access
3. **Convenience** - Desktop app with UI
4. **Integration** - Works with Claude Code CLI
5. **Flexibility** - Customizable and extensible

## 🎉 Getting Started

1. Install dependencies
2. Configure database
3. Start application
4. Use tools via UI
5. Integrate with Claude Code CLI (optional)

For detailed instructions, see `SETUP_GUIDE.md`.

