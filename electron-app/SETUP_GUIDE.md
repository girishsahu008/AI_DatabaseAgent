# Electron Desktop App Setup Guide

## Complete Setup Instructions

### Step 1: Install Dependencies

```bash
cd electron-app
npm install
```

This will install:
- Electron
- electron-builder (for creating distributables)
- All MCP server dependencies (inherited from parent)

### Step 2: Configure Database

1. **Copy database configuration:**
   ```bash
   cp ../config.env .
   ```

2. **Edit `config.env` with your database credentials:**
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=your_database
   DB_USER=your_username
   DB_PASSWORD=your_password
   ```

### Step 3: Start the Application

**Development mode:**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

### Step 4: Verify MCP Server

The MCP server should start automatically on `localhost:3000`. You can verify by:

1. **Check the application status** - The status indicator in the UI should show "Server running"
2. **Test the health endpoint:**
   ```bash
   curl http://localhost:3000/health
   ```
3. **List available tools:**
   ```bash
   curl http://localhost:3000/mcp/tools/list
   ```

## Directory Structure

```
electron-app/
├── main.js                 # Electron main process
├── preload.js             # Secure IPC bridge
├── package.json           # App dependencies
├── claude-code-config.json # Claude Code CLI config
├── renderer/
│   ├── index.html        # UI
│   └── renderer.js       # UI logic
└── assets/               # App icons (add your own)
```

## How It Works

### 1. Application Startup

1. Electron app starts
2. Main process initializes MCP server components
3. HTTP server starts on `localhost:3000`
4. Window opens with UI
5. Renderer connects to MCP server via IPC

### 2. MCP Server Lifecycle

- **Start**: When Electron app launches
- **Stop**: When Electron app quits
- **Port**: `localhost:3000` (configurable)
- **Access**: Only from localhost (privacy)

### 3. Tool Execution Flow

```
User Action (UI)
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

## Available Tools

1. **list_tables** - List all database tables
2. **get_schema** - Get schema information
3. **execute_query** - Execute SQL queries
4. **get_relationships** - Get table relationships
5. **analyze_data** - Analyze table data

## Claude Code CLI Integration

### Configuration

The `claude-code-config.json` file is pre-configured to use the local MCP server:

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

### Using Claude Code CLI

1. **Start the Electron app** (MCP server must be running)
2. **Use Claude Code CLI:**
   ```bash
   claude-code --config electron-app/claude-code-config.json
   ```
3. **Claude Code CLI will:**
   - Connect to `localhost:3000`
   - Discover available tools
   - Use tools for database operations
   - All data stays local

## Building for Distribution

### Windows

```bash
npm run build:win
```

Creates:
- `dist/PostgreSQL MCP Desktop Setup.exe` - Installer
- `dist/win-unpacked/` - Portable version

### macOS

```bash
npm run build:mac
```

Creates:
- `dist/PostgreSQL MCP Desktop.dmg` - Disk image
- `dist/mac/` - Application bundle

### Linux

```bash
npm run build:linux
```

Creates:
- `dist/PostgreSQL MCP Desktop.AppImage` - AppImage
- `dist/linux-unpacked/` - Portable version

## Privacy & Security

### Data Privacy

- ✅ All data remains on your machine
- ✅ MCP server only accessible from localhost
- ✅ No external network connections
- ✅ No telemetry or tracking
- ✅ Local database access only

### Security Features

- Context isolation in Electron
- Secure IPC communication
- No node integration in renderer
- Preload script for secure API access
- Localhost-only server binding

## Troubleshooting

### Port 3000 Already in Use

**Solution:** Change port in `main.js`:
```javascript
let mcpServerPort = 3001; // Change port
```

Then update `claude-code-config.json`:
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

### Database Connection Fails

1. Check `config.env` settings
2. Verify database is accessible
3. Check SSH tunnel configuration (if used)
4. Review console logs for errors

### MCP Server Not Starting

1. Check Node.js version (18+ required)
2. Verify all dependencies installed
3. Check database connection
4. Review error messages in console

### Module Import Errors

If you see ES module import errors:

1. Ensure you're using Node.js 18+
2. Check that all dependencies are installed
3. Verify file paths are correct
4. Check that `config.env` exists

## Development

### Hot Reload

In development mode, the app will:
- Auto-reload on code changes
- Open DevTools automatically
- Show detailed error messages

### Debugging

**Main Process:**
- Check console output
- Use `console.log()` in `main.js`
- Check Electron DevTools

**Renderer Process:**
- Use browser DevTools (F12)
- Check console for errors
- Inspect network requests

**MCP Server:**
- Check server logs in main process
- Test endpoints with curl
- Verify database connection

## Next Steps

1. **Customize UI** - Edit `renderer/index.html` and `renderer/renderer.js`
2. **Add Icons** - Add app icons to `assets/` directory
3. **Configure Build** - Update `package.json` build configuration
4. **Test Tools** - Test all MCP tools in the UI
5. **Build App** - Create distributable packages

## Support

For issues:
1. Check troubleshooting section
2. Review console logs
3. Verify database connection
4. Check MCP server status
5. Test with curl commands

