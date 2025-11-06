# Full Database Access Setup Guide

This guide explains how to enable full database access (DDL/DML operations) in your PostgreSQL MCP Server.

## Current Restrictions

The following restrictions are currently in place for security:

### 1. DatabaseManager (`src/database/databaseManager.js`)
- **Lines 197-205**: Blocks INSERT, UPDATE, DELETE, DROP, CREATE, ALTER, TRUNCATE operations
- **Lines 226-235**: `validateReadOnlyQuery()` method enforces read-only restrictions

### 2. QueryExecutor (`src/tools/queryExecutor.js`)
- **Lines 29-64**: `validateReadOnlyQuery()` method blocks all write operations
- **Lines 33-36**: Forbidden keywords include INSERT, UPDATE, DELETE, DROP, CREATE, ALTER, TRUNCATE, GRANT, REVOKE, COMMIT, ROLLBACK, SAVEPOINT, RELEASE

## Enabling Full Access

### Step 1: Update Configuration

Edit your `config.env` file and change the access mode:

```bash
# Change this line in config.env
DB_ACCESS_MODE=full
```

**Available modes:**
- `readonly` (default): Only SELECT queries allowed
- `full`: All SQL operations allowed (use with caution)

### Step 2: Restart the Server

After changing the configuration, restart your MCP server:

```bash
# Stop the current server (Ctrl+C)
# Then restart
npm start
# or
node postgresql-mcp-server.js
```

### Step 3: Verify Access Mode

Use the new `get_access_mode` tool to verify your current settings:

```javascript
// This will show your current access mode
get_access_mode()
```

## Safety Features

When `DB_ACCESS_MODE=full` is enabled:

### 1. Warning System
- Dangerous operations (DROP, TRUNCATE, DELETE) will show warnings in the console
- Example: `⚠️ WARNING: Executing potentially dangerous operation: DROP`

### 2. Query Validation
- Multiple SQL statements are still blocked to prevent injection
- Basic safety checks remain in place

### 3. Access Mode Verification
- Use `get_access_mode` tool to check current settings
- Clear indication of what operations are allowed

## Example Operations

### Read-Only Mode (Default)
```sql
-- ✅ Allowed
SELECT * FROM users;
SELECT COUNT(*) FROM orders;

-- ❌ Blocked
INSERT INTO users (name) VALUES ('John');
UPDATE users SET name = 'Jane' WHERE id = 1;
DROP TABLE users;
```

### Full Access Mode
```sql
-- ✅ Allowed (with warnings for dangerous operations)
SELECT * FROM users;
INSERT INTO users (name) VALUES ('John');
UPDATE users SET name = 'Jane' WHERE id = 1;
CREATE TABLE new_table (id SERIAL PRIMARY KEY);
DROP TABLE old_table; -- ⚠️ Warning shown

-- ❌ Still blocked
-- Multiple statements in one query
```

## Security Considerations

⚠️ **IMPORTANT**: Full access mode should only be used in:

1. **Development environments**
2. **Controlled production environments** where you have proper backups
3. **Testing scenarios** where data loss is acceptable

### Recommended Safety Practices

1. **Always backup your database** before enabling full access
2. **Test changes in a development environment** first
3. **Use transactions** for complex operations
4. **Monitor the console** for warning messages
5. **Consider using read-only mode** for production queries

## Reverting to Read-Only Mode

To revert back to read-only mode:

1. Edit `config.env`:
   ```bash
   DB_ACCESS_MODE=readonly
   ```

2. Restart the server

3. Verify with `get_access_mode` tool

## Troubleshooting

### Common Issues

1. **"Invalid DB_ACCESS_MODE" error**
   - Ensure you're using exactly `readonly` or `full` (case-sensitive)
   - Check for typos in your `config.env` file

2. **Warnings not showing**
   - Check the server console output
   - Warnings are logged to stderr, not returned in query results

3. **Still getting "forbidden keyword" errors**
   - Verify the server was restarted after changing `config.env`
   - Check that `DB_ACCESS_MODE=full` is set correctly

### Getting Help

If you encounter issues:

1. Check the server console for error messages
2. Verify your `config.env` file syntax
3. Use `get_access_mode` to confirm current settings
4. Test with a simple SELECT query first

## File Locations

- **Configuration**: `config.env`
- **Database Manager**: `src/database/databaseManager.js`
- **Query Executor**: `src/tools/queryExecutor.js`
- **Main Server**: `postgresql-mcp-server.js`

