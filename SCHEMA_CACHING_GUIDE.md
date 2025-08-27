# Schema Caching and Documentation System

## Overview

Your MCP server now includes a powerful schema caching system that stores database schema information locally, making AI interactions much faster and more efficient.

## How It Works

### 1. **Schema Caching**
- **First Request**: AI asks for schema → Server queries database → Stores in cache file
- **Subsequent Requests**: AI asks for schema → Server loads from cache instantly
- **Cache Expiry**: Cache is valid for 24 hours, then automatically refreshes

### 2. **Generated Files**
- `schema-cache.json` - Cached schema data with timestamp
- `schema_explained.md` - Comprehensive markdown documentation
- `schema_export.json` - Raw schema data for external tools

### 3. **Performance Benefits**
- **Before**: Every schema request = Database query (slow)
- **Now**: First request = Database query, others = Instant cache (fast)

## New MCP Tools Available

### Schema Management Tools
- `get_schema_info` - Get schema info (uses cache when available)
- `refresh_schema_cache` - Force refresh cache from database
- `get_cache_status` - Check cache status and age

### Documentation Tools
- `generate_schema_docs` - Generate comprehensive markdown docs
- `export_schema_json` - Export schema to JSON file

## Usage Examples

### For AI Assistants

**Get Schema Info (Fast)**
```
Use get_schema_info to get the database schema. This will be instant if cached.
```

**Refresh Schema (When needed)**
```
Use refresh_schema_cache to get the latest schema from the database.
```

**Generate Documentation**
```
Use generate_schema_docs to create comprehensive markdown documentation.
```

### For Developers

**Test the System**
```bash
node test-schema-cache.js
```

**Check Cache Status**
```bash
# Via MCP server
get_cache_status
```

## Cache Management

### Automatic Cache Refresh
- Cache expires after 24 hours
- Server automatically fetches fresh data when expired
- No manual intervention required

### Manual Cache Refresh
- Use `refresh_schema_cache` when you need immediate updates
- Useful after database schema changes
- Forces fresh database query

### Cache Files Location
- All cache files are stored in your project root
- `schema-cache.json` - Main cache file
- `schema_explained.md` - Generated documentation
- `schema_export.json` - Exported data

## Benefits for AI Integration

### 1. **Instant Schema Access**
- AI gets schema information instantly
- No waiting for database queries
- Faster response times

### 2. **Comprehensive Documentation**
- AI has access to complete table structures
- Column types, relationships, and constraints
- Better understanding of your database

### 3. **Offline Capability**
- Schema info available even when database is offline
- Useful for development and planning
- Backup of your database structure

## Technical Details

### Cache Structure
```json
{
  "timestamp": 1234567890,
  "schema": {
    "totalTables": 165,
    "successfulTables": 160,
    "failedTables": 5,
    "tables": [...],
    "errors": [...]
  }
}
```

### Cache Validation
- Timestamp-based expiration
- 24-hour validity period
- Automatic refresh on expiry

### Error Handling
- Failed tables don't break the cache
- Partial schema information is still cached
- Clear error reporting for problematic tables

## Best Practices

### 1. **Initial Setup**
- Run `generate_schema_docs` once to create documentation
- This will also populate the cache

### 2. **Regular Maintenance**
- Use `refresh_schema_cache` after database changes
- Monitor cache status with `get_cache_status`
- Check generated documentation for accuracy

### 3. **AI Integration**
- AI should use `get_schema_info` for fast access
- Use `refresh_schema_cache` only when fresh data is needed
- Leverage generated documentation for context

## Troubleshooting

### Cache Issues
- **Cache not loading**: Check file permissions
- **Stale data**: Use `refresh_schema_cache`
- **Corrupted cache**: Delete `schema-cache.json` and restart

### Documentation Issues
- **Missing tables**: Check database permissions
- **Incomplete info**: Some tables may have access restrictions
- **Format issues**: Regenerate with `generate_schema_docs`

## Future Enhancements

### Planned Features
- Configurable cache expiry times
- Incremental cache updates
- Schema change detection
- Multiple documentation formats

### Integration Possibilities
- Git integration for schema versioning
- Automated documentation updates
- Schema comparison tools
- Migration script generation

---

## Quick Start

1. **Test the system**:
   ```bash
   node test-schema-cache.js
   ```

2. **Generate documentation**:
   ```bash
   # Via MCP server
   generate_schema_docs
   ```

3. **Check cache status**:
   ```bash
   # Via MCP server
   get_cache_status
   ```

Your MCP server is now equipped with a powerful schema caching system that will make AI interactions much more efficient and provide comprehensive database documentation!
