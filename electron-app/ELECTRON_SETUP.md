# Electron Application Setup Guide

## Quick Start

### 1. Install Dependencies

```bash
cd electron-app
npm install
```

### 2. Configure Database

Copy your database configuration:

```bash
cp ../config.env .
# Edit config.env with your database credentials
```

### 3. Start the Application

```bash
npm start
```

## Architecture Overview

### File Structure

```
electron-app/
├── main.js                    # Electron main process
│   ├── MCP Server HTTP wrapper
│   ├── Window management
│   └── IPC handlers
├── preload.js                 # Secure IPC bridge
├── renderer/
│   ├── index.html            # UI markup
│   └── renderer.js           # UI logic
├── claude-code-config.json   # Claude Code CLI config
└── package.json              # Dependencies & build config
```

### MCP Server Integration

The MCP server is embedded and runs on `localhost:3000`:

1. **Server Startup**: Started when Electron app launches
2. **HTTP Interface**: Provides REST API for tool calls
3. **Lifecycle Management**: Automatically starts/stops with app
4. **Privacy**: Only accessible from localhost

### Communication Flow

```
Claude Code CLI
    ↓
localhost:3000 (MCP HTTP Server)
    ↓
Electron Main Process
    ↓
MCP Server Components
    ↓
PostgreSQL Database
```

## MCP Server HTTP API

### Endpoints

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

## Claude Code CLI Configuration

The `claude-code-config.json` file configures Claude Code CLI to use the local MCP server:

```json
{
  "mcp": {
    "servers": {
      "postgresql-mcp": {
        "url": "http://localhost:3000",
        "transport": "http"
      }
    }
  }
}
```

### Using Claude Code CLI

1. **Install Claude Code CLI** (if needed)
2. **Point to configuration:**
   ```bash
   claude-code --config electron-app/claude-code-config.json
   ```

3. **Claude Code CLI will:**
   - Connect to localhost:3000
   - Discover available tools
   - Use tools for database operations
   - All data stays local

## Development

### Running in Development

```bash
npm run dev
```

Features:
- Auto-reload on changes
- DevTools open by default
- Detailed error logging
- Hot reload for renderer

### Debugging

**Main Process:**
- Check console output
- Use `console.log()` in main.js
- Check Electron DevTools

**Renderer Process:**
- Use browser DevTools (F12)
- Check console for errors
- Inspect network requests

**MCP Server:**
- Check server logs in main process
- Test endpoints with curl:
  ```bash
  curl http://localhost:3000/health
  curl http://localhost:3000/mcp/tools/list
  ```

## Building for Production

### Prerequisites

```bash
npm install -g electron-builder
```

### Build Commands

**Windows:**
```bash
npm run build:win
```

**macOS:**
```bash
npm run build:mac
```

**Linux:**
```bash
npm run build:linux
```

### Build Output

Built applications are in `dist/` directory:

- **Windows**: Setup installer (.exe)
- **macOS**: Disk image (.dmg)
- **Linux**: AppImage or deb package

## Security Considerations

### Privacy

- ✅ MCP server only binds to localhost
- ✅ No external network access
- ✅ All data stays on machine
- ✅ No telemetry or tracking

### Security

- ✅ Context isolation enabled
- ✅ Secure IPC communication
- ✅ No node integration in renderer
- ✅ Preload script for secure API access

## Troubleshooting

### Port 3000 Already in Use

**Solution:**
1. Change port in `main.js`:
   ```javascript
   let mcpServerPort = 3001; // Change port
   ```

2. Update `claude-code-config.json`:
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

### MCP Server Not Starting

**Check:**
1. Database connection in `config.env`
2. Node.js version (18+ required)
3. All dependencies installed
4. Console for error messages

### Claude Code CLI Not Connecting

**Check:**
1. MCP server is running (check /health)
2. Configuration file path is correct
3. Port matches in config
4. Firewall isn't blocking localhost

## Next Steps

1. **Customize UI**: Edit `renderer/index.html` and `renderer/renderer.js`
2. **Add Tools**: Extend tool list in `main.js`
3. **Configure Icons**: Add icons to `assets/` directory
4. **Build App**: Create standalone executables
5. **Distribute**: Share the built application

## Additional Resources

- [Electron Documentation](https://www.electronjs.org/docs)
- [MCP Protocol](https://modelcontextprotocol.io)
- [Claude Code CLI](https://github.com/anthropics/claude-code-cli)

