# MCP Integration Testing Guide

## Quick Start Testing

This guide helps you test the MCP server integration with Claude Desktop.

## Prerequisites

1. **MCP Server Running**
   ```bash
   npm start
   # or
   node working-postgresql-mcp.js
   ```

2. **Claude Desktop Configured**
   - MCP server should be configured in Claude Desktop settings
   - Server should be accessible and running

3. **Test Database**
   - Database connection should be working
   - Some sample data for testing queries

---

## Quick Test Sequence

### Step 1: Test Basic Functionality

1. **Start the MCP server**
   ```bash
   node working-postgresql-mcp.js
   ```

2. **In Claude Desktop, test a simple query:**
   ```
   Execute a query: SELECT * FROM [your_table] LIMIT 5
   ```

3. **Verify:**
   - ✅ Query executes successfully
   - ✅ Results are returned
   - ✅ No errors in server logs

---

### Step 2: Test Context Tracking

1. **Execute multiple queries:**
   ```
   Execute these queries:
   1. SELECT * FROM orders LIMIT 10
   2. SELECT COUNT(*) FROM customers
   3. SELECT * FROM products WHERE price > 100
   ```

2. **Add findings:**
   ```
   Use append_to_current_context to add:
   - "Found 150 orders in the system"
   - "Average order value is $250"
   ```

3. **Verify tracking:**
   - Check server logs (queries should be tracked silently)
   - No errors should occur

---

### Step 3: Save Context

1. **Save the current session:**
   ```
   Use save_chat_context with:
   - sessionName: "test_session_1"
   - summary: "Initial testing of context features"
   - userNotes: "Testing basic functionality"
   ```

2. **Verify:**
   - ✅ Success message returned
   - ✅ File created in `chat_contexts/` directory
   - ✅ File contains all queries and findings

3. **Check the file:**
   ```bash
   ls -la chat_contexts/
   cat chat_contexts/context_*_test_session_1.json
   ```

---

### Step 4: Test Context Loading

1. **List saved contexts:**
   ```
   Use list_saved_contexts
   ```

2. **Verify:**
   - ✅ Your test session appears in the list
   - ✅ Shows correct summary and counts

3. **Load the context:**
   ```
   Use load_chat_context with:
   - sessionIdOrName: "test_session_1"
   ```

4. **Verify:**
   - ✅ Context loads successfully
   - ✅ All queries are shown
   - ✅ All findings are shown
   - ✅ Format is readable markdown

---

### Step 5: Test MCP Resources

1. **Restart Claude Desktop** (to trigger resource loading)

2. **Start a new conversation**

3. **Check if resources are loaded:**
   - Look for context in Claude's context panel
   - Resources should auto-load if contexts exist

4. **Test resource access:**
   ```
   Ask Claude: "What was the last analysis session about?"
   ```
   - Claude should reference the saved context

---

### Step 6: Test Auto-Loading

1. **Save a context with meaningful data:**
   ```
   Save context:
   - sessionName: "sales_analysis"
   - summary: "Analyzed Q3 sales data"
   - Add some findings about sales trends
   ```

2. **Close and reopen Claude Desktop**

3. **Start a new conversation**

4. **Verify:**
   - ✅ Latest session summary appears automatically
   - ✅ Claude can reference previous analysis
   - ✅ Context is useful for continuing work

---

## Testing Checklist

Use this checklist to verify all features:

### Basic Functionality
- [ ] Server starts without errors
- [ ] Database connection works
- [ ] Queries execute successfully
- [ ] Results are returned correctly

### Context Tracking
- [ ] Queries are automatically tracked
- [ ] Table names are extracted
- [ ] Column names are extracted
- [ ] Row counts are captured
- [ ] Findings can be added

### Context Saving
- [ ] Context can be saved with name
- [ ] Summary is saved
- [ ] User notes are saved
- [ ] All queries are saved
- [ ] All findings are saved
- [ ] File is created correctly

### Context Loading
- [ ] Contexts can be listed
- [ ] Context can be loaded by name
- [ ] Context can be loaded by ID
- [ ] Loaded context is formatted correctly
- [ ] All data is preserved

### MCP Resources
- [ ] Resources are listed correctly
- [ ] Latest session resource exists (if contexts saved)
- [ ] History resource exists (if contexts saved)
- [ ] Resources can be read
- [ ] Resource content is formatted correctly

### Auto-Loading
- [ ] Resources auto-load in Claude Desktop
- [ ] Latest session appears in context
- [ ] History overview appears in context
- [ ] Claude can reference saved contexts

### Error Handling
- [ ] Saving without name fails gracefully
- [ ] Loading non-existent context fails gracefully
- [ ] Listing when no contexts exist works
- [ ] Resources handle empty state correctly

---

## Common Test Scenarios

### Scenario 1: Complete Analysis Session

1. Execute 5-10 queries about sales data
2. Add 3-5 key findings
3. Save context as "sales_analysis_q3"
4. Close Claude Desktop
5. Reopen and verify context auto-loads
6. Continue analysis using previous context

### Scenario 2: Multiple Sessions

1. Save context "session_1"
2. Execute new queries
3. Save context "session_2"
4. List contexts - verify both appear
5. Load "session_1" - verify it's correct
6. Load "session_2" - verify it's correct

### Scenario 3: Complex Queries

1. Execute queries with JOINs
2. Execute queries with subqueries
3. Execute queries with aggregations
4. Save context
5. Verify all tables and columns are tracked correctly

### Scenario 4: Large Context

1. Execute 20+ queries
2. Add 10+ findings
3. Save context
4. Load context
5. Verify all data is preserved
6. Verify performance is acceptable

---

## Troubleshooting

### Resources Not Appearing

**Problem:** Resources don't appear in Claude Desktop

**Solutions:**
1. Restart Claude Desktop
2. Check MCP server is running
3. Verify at least one context is saved
4. Check server logs for errors
5. Verify MCP server configuration in Claude Desktop

### Queries Not Tracked

**Problem:** Queries execute but aren't tracked

**Solutions:**
1. Check server logs for errors
2. Verify ContextManager is initialized
3. Verify QueryExecutor has contextManager reference
4. Check initialization order in server code

### Context Save Fails

**Problem:** Error when saving context

**Solutions:**
1. Check file system permissions
2. Verify `chat_contexts/` directory exists
3. Check disk space
4. Verify sessionName is provided
5. Check server logs for detailed error

### Context Load Fails

**Problem:** Can't load saved context

**Solutions:**
1. Verify context exists (use list_saved_contexts)
2. Check session name/ID is correct
3. Verify file is not corrupted
4. Check server logs for errors

---

## Performance Testing

### Measure These Metrics

1. **Query Execution Time**
   - Baseline: Query execution time without tracking
   - With tracking: Query execution time with tracking
   - Overhead should be < 10ms

2. **Context Save Time**
   - Time to save context with N queries
   - Should be < 100ms for typical contexts

3. **Context Load Time**
   - Time to load and format context
   - Should be < 50ms

4. **Resource Read Time**
   - Time to read and format resources
   - Should be < 50ms

### Test with Different Sizes

- Small context: 5 queries, 3 findings
- Medium context: 20 queries, 10 findings
- Large context: 50+ queries, 20+ findings

---

## Success Criteria

All features are working correctly when:

1. ✅ All basic functionality tests pass
2. ✅ Context tracking works automatically
3. ✅ Contexts can be saved and loaded
4. ✅ MCP Resources are available
5. ✅ Resources auto-load in Claude Desktop
6. ✅ Claude can reference saved contexts
7. ✅ Error handling works correctly
8. ✅ Performance is acceptable
9. ✅ No data loss occurs
10. ✅ Contexts persist after server restart

---

## Next Steps After Testing

Once all tests pass:

1. **Document any issues found**
2. **Create sample contexts** for demonstration
3. **Update documentation** with any findings
4. **Share test results** with team
5. **Plan improvements** based on test feedback

---

## Quick Reference

### Tool Names
- `save_chat_context` - Save current session
- `list_saved_contexts` - List all saved sessions
- `load_chat_context` - Load a specific session
- `append_to_current_context` - Add a finding
- `execute_query` - Execute query (auto-tracked)

### Resource URIs
- `session://latest/summary` - Latest session summary
- `session://history/overview` - Session history overview

### File Locations
- Context files: `./chat_contexts/context_*.json`
- Server file: `working-postgresql-mcp.js`
- Context manager: `src/tools/contextManager.js`

