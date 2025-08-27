# PostgreSQL MCP Server

A Model Context Protocol (MCP) server that provides secure read-only access to PostgreSQL databases via SSH tunneling. This server is designed for textile ERP systems and includes comprehensive schema exploration capabilities.

## Features

- 🔐 **Secure SSH Tunneling**: Connect to remote PostgreSQL databases securely
- 📊 **Schema Exploration**: Discover tables, columns, relationships, and metadata
- 🔍 **Read-Only Queries**: Execute safe SELECT queries with validation
- 🛡️ **Security**: Prevents data modification operations
- 📝 **Comprehensive Documentation**: Generate schema documentation templates

## Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd MCPDatabase
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   ```bash
   cp config.env.example .env
   # Edit .env with your database credentials
   ```

## Configuration

### Environment Variables

Create a `.env` file with the following variables:

```env
# PostgreSQL Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=your_database_name
DB_USER=your_username
DB_PASSWORD=your_password

# SSH Tunnel Configuration (if connecting via SSH)
SSH_HOST=your_ssh_host
SSH_PORT=22
SSH_USERNAME=your_ssh_username
SSH_PRIVATE_KEY_PATH=~/.ssh/id_rsa
SSH_PASSPHRASE=your_ssh_passphrase

# MCP Server Configuration
MCP_SERVER_NAME=postgresql-mcp-server
MCP_SERVER_VERSION=1.0.0
```

### SSH Key Setup

1. **Generate SSH key pair (if not exists):**
   ```bash
   ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa
   ```

2. **Add public key to remote server:**
   ```bash
   ssh-copy-id username@remote-server
   ```

3. **Test SSH connection:**
   ```bash
   ssh username@remote-server
   ```

## Usage

### Starting the MCP Server

```bash
npm start
```

### Development Mode (with auto-restart)

```bash
npm run dev
```

### Testing Connection

The server provides several tools for database exploration:

1. **Test Connection**: Verify database connectivity
2. **List Tables**: Get all tables in the database
3. **Describe Table**: Get detailed information about a specific table
4. **Get Schema Info**: Comprehensive schema information
5. **Get Table Relationships**: Foreign key relationships
6. **Execute Query**: Run read-only SQL queries

## Available Tools

### 1. `test_connection`
Test the database connection and get PostgreSQL version.

### 2. `list_tables`
List all tables in the database with descriptions and column counts.

### 3. `describe_table`
Get detailed information about a specific table including:
- Column details (name, type, nullable, default values)
- Primary keys
- Foreign key relationships
- Indexes
- Row count

### 4. `get_schema_info`
Get comprehensive schema information for all tables.

### 5. `get_table_relationships`
Get foreign key relationships for a specific table.

### 6. `execute_query`
Execute read-only SQL queries with validation.

## Security Features

- **Read-Only Operations**: Only SELECT queries are allowed
- **Query Validation**: Prevents SQL injection and modification operations
- **SSH Tunneling**: Secure connection to remote databases
- **Input Sanitization**: Validates table names and query parameters

## Schema Documentation

The server generates a `schema_explained.md` template file that you can fill in with:

- Table purposes and business context
- Column descriptions and business meanings
- Relationship explanations
- Business rules and data flows
- Example data and common queries

## Error Handling

The server includes comprehensive error handling for:

- Connection failures
- SSH tunnel issues
- Invalid queries
- Permission errors
- Network timeouts

## Troubleshooting

### Common Issues

1. **SSH Connection Failed**
   - Verify SSH key permissions: `chmod 600 ~/.ssh/id_rsa`
   - Check SSH host connectivity: `ssh username@host`
   - Verify SSH key is added to remote server

2. **Database Connection Failed**
   - Verify database credentials in `.env`
   - Check PostgreSQL is running on remote server
   - Verify database user permissions

3. **Permission Denied**
   - Ensure database user has SELECT permissions
   - Check table access permissions

### Debug Mode

Enable debug logging by setting environment variable:
```bash
DEBUG=* npm start
```

## Development

### Project Structure

```
src/
├── index.js              # Main MCP server entry point
├── database/
│   └── databaseManager.js # Database connection and SSH tunneling
└── tools/
    ├── schemaExplorer.js  # Schema exploration tools
    └── queryExecutor.js   # Query execution and validation
```

### Adding New Tools

1. Create a new tool class in `src/tools/`
2. Register the tool in `src/index.js`
3. Add tool description to the tools list

## License

ISC License

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review error logs
3. Create an issue with detailed error information 