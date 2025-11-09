# PostgreSQL MCP Desktop Application

An Electron desktop application that embeds a Model Context Protocol (MCP) server for secure, local PostgreSQL database access. All data remains on your machine for maximum privacy and security.

## Features

- 🔒 **Privacy First**: All data stays on your machine
- 🖥️ **Desktop App**: Native Electron application
- 🔌 **Embedded MCP Server**: Runs on localhost:3000
- 🛠️ **Database Tools**: list_tables, get_schema, execute_query, get_relationships, analyze_data
- 🎨 **Modern UI**: Clean, intuitive interface
- ⚡ **Fast**: Local execution, no cloud dependencies

## Directory Structure

```
electron-app/
├── main.js                 # Electron main process
├── preload.js             # Preload script for secure IPC
├── package.json           # Electron app dependencies
├── claude-code-config.json # Claude Code CLI configuration
├── renderer/
│   ├── index.html         # Main UI
│   └── renderer.js        # Renderer process logic
└── assets/
    ├── icon.png           # App icon
    ├── icon.ico           # Windows icon
    └── icon.icns          # macOS icon
```

## Installation

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database access
- Electron (installed via npm)

### Setup

1. **Install dependencies:**
   ```bash
   cd electron-app
   npm install
   ```

2. **Configure database connection:**
   - Copy `../config.env` to the electron-app directory
   - Update database credentials in `config.env`

3. **Start the application:**
   ```bash
   npm start
   ```

## Development

### Running in Development Mode

```bash
npm run dev
```

This will:
- Start the MCP server on localhost:3000
- Launch the Electron app
- Open DevTools automatically

### Building for Production

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

Built applications will be in the `dist/` directory.

## Architecture

### MCP Server

The MCP server runs as an HTTP server on `localhost:3000` and provides:

- **HTTP API**: RESTful endpoints for tool calls
- **Health Check**: `/health` endpoint for status
- **Tools API**: `/mcp/tools/list` and `/mcp/tools/call`

### Electron Main Process

- Manages MCP server lifecycle
- Handles IPC communication
- Manages application windows
- Ensures server starts/stops with app

### Renderer Process

- Provides user interface
- Communicates with main process via IPC
- Calls MCP tools through secure channels
- Displays results in real-time

## Available Tools

1. **list_tables** - List all tables in the database
2. **get_schema** - Get comprehensive schema information
3. **execute_query** - Execute read-only SQL queries
4. **get_relationships** - Get foreign key relationships
5. **analyze_data** - Analyze table data with statistics

## Claude Code CLI Integration

The application includes configuration for Claude Code CLI integration. The configuration file (`claude-code-config.json`) specifies:

- MCP server URL: `http://localhost:3000`
- Available tools
- Privacy settings (all data local)
- Claude model configuration

### Using with Claude Code CLI

1. **Install Claude Code CLI** (if not already installed)
2. **Point to local MCP server:**
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

3. **Use Claude Code CLI** - It will automatically connect to the local MCP server

## Privacy & Security

### Data Privacy

- ✅ All data remains on your machine
- ✅ No cloud connections
- ✅ No telemetry
- ✅ Local database access only
- ✅ MCP server runs on localhost only

### Security Features

- Context isolation in Electron
- Secure IPC communication
- No external network access
- Local file system access only
- SSH tunnel support for secure database connections

## Configuration

### Database Configuration

Edit `config.env`:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=your_database
DB_USER=your_username
DB_PASSWORD=your_password

# Optional: SSH tunnel
SSH_HOST=your_ssh_host
SSH_PORT=22
SSH_USERNAME=your_username
SSH_PRIVATE_KEY_PATH=~/.ssh/id_rsa
```

### MCP Server Port

Change the port in `main.js`:

```javascript
let mcpServerPort = 3000; // Change to your preferred port
```

## Troubleshooting

### Port Already in Use

If port 3000 is already in use:

1. Change the port in `main.js`
2. Update `claude-code-config.json` with the new port
3. Restart the application

### Database Connection Issues

1. Check `config.env` settings
2. Verify database is accessible
3. Check SSH tunnel configuration (if used)
4. Review server logs in the console

### MCP Server Not Starting

1. Check Node.js version (18+ required)
2. Verify all dependencies are installed
3. Check for error messages in the console
4. Ensure database connection is working

## Building Standalone Application

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

## License

MIT

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review server logs
3. Check database connection
4. Verify MCP server is running on localhost:3000

