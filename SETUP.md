# Setup Guide for PostgreSQL MCP Server

## Quick Start

### 1. Environment Configuration

Copy the example configuration file:
```bash
cp config.env.example .env
```

### 2. Configure Database Connection

Edit the `.env` file with your PostgreSQL database credentials:

#### For Direct Connection (No SSH):
```env
# PostgreSQL Database Configuration
DB_HOST=your_database_host
DB_PORT=5432
DB_NAME=your_database_name
DB_USER=your_username
DB_PASSWORD=your_password

# Leave SSH settings empty for direct connection
SSH_HOST=
SSH_PORT=
SSH_USERNAME=
SSH_PRIVATE_KEY_PATH=
SSH_PASSPHRASE=
```

#### For SSH Tunnel Connection:
```env
# PostgreSQL Database Configuration
DB_HOST=localhost  # This will be tunneled through SSH
DB_PORT=5432
DB_NAME=your_database_name
DB_USER=your_username
DB_PASSWORD=your_password

# SSH Tunnel Configuration
SSH_HOST=your_ssh_server.com
SSH_PORT=22
SSH_USERNAME=your_ssh_username
SSH_PRIVATE_KEY_PATH=~/.ssh/id_rsa
SSH_PASSPHRASE=your_ssh_passphrase  # Leave empty if no passphrase
```

### 3. Test the Connection

Run the test script to verify everything is working:
```bash
node test-connection.js
```

### 4. Start the MCP Server

```bash
npm start
```

## SSH Key Setup (if using SSH tunneling)

### Generate SSH Key (if you don't have one):
```bash
ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa
```

### Add Public Key to Remote Server:
```bash
ssh-copy-id username@your-ssh-server.com
```

### Test SSH Connection:
```bash
ssh username@your-ssh-server.com
```

## Common Configuration Examples

### Example 1: Local PostgreSQL
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=textile_erp
DB_USER=postgres
DB_PASSWORD=mypassword
```

### Example 2: Remote PostgreSQL via SSH
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=textile_erp
DB_USER=dbuser
DB_PASSWORD=dbpassword

SSH_HOST=192.168.1.100
SSH_PORT=22
SSH_USERNAME=admin
SSH_PRIVATE_KEY_PATH=~/.ssh/id_rsa
SSH_PASSPHRASE=
```

### Example 3: Cloud PostgreSQL (AWS RDS, etc.)
```env
DB_HOST=your-rds-endpoint.amazonaws.com
DB_PORT=5432
DB_NAME=textile_erp
DB_USER=admin
DB_PASSWORD=securepassword
```

## Troubleshooting

### Connection Issues:
1. **"Connection refused"**: Check if PostgreSQL is running
2. **"Authentication failed"**: Verify username/password
3. **"Database does not exist"**: Check database name
4. **"Permission denied"**: Ensure user has SELECT permissions

### SSH Issues:
1. **"SSH connection failed"**: Check SSH host and credentials
2. **"Permission denied (publickey)"**: Verify SSH key is added to server
3. **"No such file or directory"**: Check SSH key path

### Database Permission Issues:
```sql
-- Grant necessary permissions to your user
GRANT CONNECT ON DATABASE your_database TO your_username;
GRANT USAGE ON SCHEMA public TO your_username;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO your_username;
```

## Security Notes

- Never commit your `.env` file to version control
- Use strong passwords for database access
- Consider using environment-specific SSH keys
- Regularly rotate database passwords
- Use SSL connections when possible for direct connections

## Next Steps

Once your connection is working:

1. **Explore the Schema**: Use the MCP tools to discover your database structure
2. **Document Business Logic**: Fill in the `schema_explained.md` template
3. **Test Queries**: Try the `execute_query` tool with SELECT statements
4. **Integrate with MCP Client**: Connect this server to your MCP client application 