# Testing Plan for Context Persistence and Auto-Loading Features

## Overview
This document outlines a comprehensive testing plan for the new chat context saving system and automatic context summary loading features.

## Prerequisites
1. MCP server is running (`npm start` or `node working-postgresql-mcp.js`)
2. Database connection is configured and working
3. Claude Desktop is configured to use this MCP server
4. Test database with some sample data

---

## Test 1: Basic Context Manager Initialization

### Objective
Verify that ContextManager initializes correctly and creates the contexts directory.

### Steps
1. Start the MCP server
2. Check if `./chat_contexts/` directory is created automatically
3. Verify no errors in server logs

### Expected Results
- ✅ `chat_contexts/` directory exists
- ✅ No initialization errors in console
- ✅ Server starts successfully

### Verification Command
```bash
# Check if directory exists
ls -la chat_contexts/  # Linux/Mac
dir chat_contexts      # Windows
```

---

## Test 2: Automatic Query Tracking

### Objective
Verify that queries are automatically tracked when executed.

### Steps
1. Execute a simple query using `execute_query` tool:
   ```json
   {
     "query": "SELECT * FROM orders LIMIT 10",
     "purpose": "Get sample orders"
   }
   ```
2. Execute another query:
   ```json
   {
     "query": "SELECT customer_id, COUNT(*) FROM orders GROUP BY customer_id",
     "purpose": "Count orders per customer"
   }
   ```
3. Check if queries are being tracked (they should be in memory)

### Expected Results
- ✅ Queries are executed successfully
- ✅ Queries are tracked in the current context
- ✅ Table names are extracted (e.g., "orders")
- ✅ Row counts are captured

### Verification
- No errors during query execution
- Check server logs for tracking messages (if any)

---

## Test 3: Save Chat Context

### Objective
Test saving a conversation context with queries and findings.

### Steps
1. Execute a few queries (from Test 2)
2. Add some findings using `append_to_current_context`:
   ```json
   {
     "finding": "Revenue increased 23% in Q3"
   }
   ```
   ```json
   {
     "finding": "Enterprise segment growing fastest"
   }
   ```
3. Save the context using `save_chat_context`:
   ```json
   {
     "sessionName": "test_sales_analysis",
     "summary": "Analyzed Q3 sales data, focused on customer segments",
     "userNotes": "Initial test of context saving feature"
   }
   ```

### Expected Results
- ✅ Context is saved successfully
- ✅ File is created in `chat_contexts/` directory
- ✅ Filename follows pattern: `context_YYYY-MM-DD_HH-MM-SS_test_sales_analysis.json`
- ✅ JSON file contains:
  - Session ID
  - Session name
  - Created timestamp
  - Summary
  - All executed queries
  - Key findings
  - Tables accessed
  - Columns analyzed
  - User notes

### Verification
```bash
# Check if file was created
ls -la chat_contexts/

# View the saved context
cat chat_contexts/context_*.json | jq .
```

### Sample Expected JSON Structure
```json
{
  "sessionId": "2024-11-06_14-30-45",
  "sessionName": "test_sales_analysis",
  "createdAt": "2024-11-06T14:30:45Z",
  "summary": "Analyzed Q3 sales data, focused on customer segments",
  "queriesExecuted": [
    {
      "timestamp": "2024-11-06T14:31:00Z",
      "query": "SELECT * FROM orders LIMIT 10",
      "purpose": "Get sample orders",
      "rowsReturned": 10
    }
  ],
  "keyFindings": [
    "Revenue increased 23% in Q3",
    "Enterprise segment growing fastest"
  ],
  "tablesAccessed": ["orders"],
  "columnsAnalyzed": {
    "orders": ["customer_id"]
  },
  "userNotes": "Initial test of context saving feature"
}
```

---

## Test 4: List Saved Contexts

### Objective
Test listing all saved contexts.

### Steps
1. Save at least 2-3 different contexts with different names
2. Call `list_saved_contexts` tool (no parameters)

### Expected Results
- ✅ Returns list of all saved contexts
- ✅ Shows session names, IDs, creation dates
- ✅ Shows summary, query count, findings count
- ✅ Sorted by most recent first

### Verification
- Check the response contains all saved sessions
- Verify sorting is correct (newest first)

---

## Test 5: Load Chat Context

### Objective
Test loading a specific saved context.

### Steps
1. Save a context with a known name (e.g., "test_sales_analysis")
2. Load it using `load_chat_context`:
   ```json
   {
     "sessionIdOrName": "test_sales_analysis"
   }
   ```
3. Also test loading by session ID:
   ```json
   {
     "sessionIdOrName": "2024-11-06_14-30-45"
   }
   ```

### Expected Results
- ✅ Context loads successfully by name
- ✅ Context loads successfully by ID
- ✅ Returns formatted markdown with:
  - Session information
  - All queries executed
  - Key findings
  - Tables and columns accessed
  - User notes

### Verification
- Check response format is readable markdown
- Verify all data from saved context is present

---

## Test 6: Append Findings to Current Context

### Objective
Test adding findings to the current session without saving.

### Steps
1. Execute a query (creates current context)
2. Add a finding:
   ```json
   {
     "finding": "Customer retention improved to 87%"
   }
   ```
3. Add another finding
4. Verify findings are accumulated
5. Save context and verify all findings are included

### Expected Results
- ✅ Findings are added successfully
- ✅ Multiple findings can be added
- ✅ All findings are saved when context is saved
- ✅ No duplicate findings

---

## Test 7: MCP Resources - List Resources

### Objective
Test that MCP Resources are listed correctly.

### Steps
1. Save at least one context (so there's a latest session)
2. Use Claude Desktop or MCP client to list resources
3. Check if resources are available

### Expected Results
- ✅ `session://latest/summary` resource is listed (if contexts exist)
- ✅ `session://history/overview` resource is listed (if contexts exist)
- ✅ Resource names and descriptions are correct

### Verification via MCP Client
```javascript
// Example using MCP client
const resources = await client.request(
  { method: "resources/list" },
  ListResourcesResultSchema
);
console.log(resources);
```

### Expected Response
```json
{
  "resources": [
    {
      "uri": "session://latest/summary",
      "name": "Recent Analysis: test_sales_analysis",
      "description": "Last session: 11/6/2024 - Analyzed Q3 sales data...",
      "mimeType": "text/markdown"
    },
    {
      "uri": "session://history/overview",
      "name": "Analysis History",
      "description": "Overview of last 3 analysis sessions",
      "mimeType": "text/markdown"
    }
  ]
}
```

---

## Test 8: MCP Resources - Read Latest Session Summary

### Objective
Test reading the latest session summary resource.

### Steps
1. Save a context with known data
2. Read the `session://latest/summary` resource
3. Verify content format

### Expected Results
- ✅ Resource content is returned
- ✅ Format is markdown
- ✅ Contains:
  - Session name and date
  - Summary
  - Recent queries (up to 5)
  - Key findings
  - Tables explored
  - Continuation message

### Verification
- Check markdown formatting is correct
- Verify all expected sections are present

---

## Test 9: MCP Resources - Read Session History

### Objective
Test reading the session history overview resource.

### Steps
1. Save at least 5 different contexts
2. Read the `session://history/overview` resource
3. Verify it shows last 5 sessions

### Expected Results
- ✅ Returns overview of last 5 sessions
- ✅ Shows session names, dates, summaries
- ✅ Shows query counts, findings counts, table counts
- ✅ Sorted by most recent first

---

## Test 10: Auto-Loading in Claude Desktop

### Objective
Test that resources auto-load in Claude Desktop context window.

### Steps
1. Save a context with meaningful data
2. Restart Claude Desktop (or reconnect to MCP server)
3. Start a new conversation
4. Check if previous session context is automatically loaded

### Expected Results
- ✅ Latest session summary appears in context automatically
- ✅ Session history overview is available
- ✅ Claude can reference previous analysis
- ✅ Context is readable and useful

### Verification
- Look for context in Claude Desktop's context panel
- Ask Claude: "What was the last analysis session about?"
- Claude should be able to reference the saved context

---

## Test 11: Edge Cases and Error Handling

### Objective
Test error handling and edge cases.

### Test Cases

#### 11.1: Save Context Without Queries
- Save context with no queries executed
- **Expected**: Context saves successfully with empty queries array

#### 11.2: Save Context Without Name
- Try to save context without sessionName
- **Expected**: Error message about required sessionName

#### 11.3: Load Non-Existent Context
- Try to load context that doesn't exist
- **Expected**: Error message "Context not found"

#### 11.4: List Contexts When None Exist
- List contexts when chat_contexts directory is empty
- **Expected**: Returns message "No saved contexts found"

#### 11.5: Resources When No Contexts Exist
- List resources when no contexts are saved
- **Expected**: Returns empty resources array (no errors)

#### 11.6: Multiple Queries with Same Table
- Execute multiple queries on same table
- **Expected**: Table appears once in tablesAccessed, all columns tracked

#### 11.7: Complex Query with JOINs
- Execute query with multiple JOINs
- **Expected**: All tables from JOINs are tracked

---

## Test 12: Query Tracking Accuracy

### Objective
Verify that query tracking accurately extracts table and column information.

### Steps
1. Execute various query types:
   - Simple SELECT: `SELECT * FROM orders`
   - SELECT with specific columns: `SELECT id, name, email FROM customers`
   - JOIN query: `SELECT o.id, c.name FROM orders o JOIN customers c ON o.customer_id = c.id`
   - Subquery: `SELECT * FROM (SELECT * FROM orders) AS sub`
2. Save context and verify extracted data

### Expected Results
- ✅ Tables are correctly identified from FROM and JOIN clauses
- ✅ Columns are extracted from SELECT clauses
- ✅ Table aliases are handled correctly
- ✅ Complex queries don't break extraction

---

## Test 13: Context Persistence Across Server Restarts

### Objective
Verify that saved contexts persist after server restart.

### Steps
1. Save a context
2. Stop the MCP server
3. Restart the MCP server
4. List saved contexts
5. Load the previously saved context

### Expected Results
- ✅ Contexts are still available after restart
- ✅ Can list and load previously saved contexts
- ✅ No data loss

---

## Test 14: Concurrent Context Management

### Objective
Test behavior when multiple contexts are created in quick succession.

### Steps
1. Execute queries (creates context 1)
2. Save context 1
3. Execute more queries (should create new context 2)
4. Save context 2
5. Verify both contexts are saved correctly

### Expected Results
- ✅ Each save creates a new context
- ✅ Previous context is not overwritten
- ✅ Each context has unique session ID
- ✅ Queries are tracked in correct context

---

## Test 15: Large Context Handling

### Objective
Test behavior with many queries and findings.

### Steps
1. Execute 20+ queries
2. Add 10+ findings
3. Save context
4. Load context
5. Verify all data is preserved

### Expected Results
- ✅ All queries are saved
- ✅ All findings are saved
- ✅ Context loads without errors
- ✅ Performance is acceptable

---

## Automated Testing Script

Create a test script to automate some of these tests:

```javascript
// test-context-features.js
import { ContextManager } from './src/tools/contextManager.js';

async function runTests() {
  const cm = new ContextManager();
  
  // Test 1: Initialize
  console.log('Test 1: Initialization');
  const context = cm.getCurrentContext();
  console.log('✅ Context created:', context.sessionId);
  
  // Test 2: Track queries
  console.log('\nTest 2: Query Tracking');
  cm.trackQuery('SELECT * FROM orders', 10, 'Get orders');
  cm.trackQuery('SELECT * FROM customers', 5, 'Get customers');
  console.log('✅ Queries tracked:', context.queriesExecuted.length);
  
  // Test 3: Add findings
  console.log('\nTest 3: Add Findings');
  cm.addFinding('Test finding 1');
  cm.addFinding('Test finding 2');
  console.log('✅ Findings added:', context.keyFindings.length);
  
  // Test 4: Save context
  console.log('\nTest 4: Save Context');
  const result = await cm.saveContext('test_session', 'Test summary', 'Test notes');
  console.log('✅ Context saved');
  
  // Test 5: List contexts
  console.log('\nTest 5: List Contexts');
  const list = await cm.listSavedContexts();
  console.log('✅ Contexts listed');
  
  // Test 6: Load context
  console.log('\nTest 6: Load Context');
  const loaded = await cm.loadContext('test_session');
  console.log('✅ Context loaded');
  
  console.log('\n✅ All tests passed!');
}

runTests().catch(console.error);
```

---

## Manual Testing Checklist

Use this checklist when testing manually:

- [ ] Server starts without errors
- [ ] `chat_contexts/` directory is created
- [ ] Queries are automatically tracked
- [ ] Table and column names are extracted correctly
- [ ] Findings can be added to context
- [ ] Context can be saved with all data
- [ ] Saved contexts can be listed
- [ ] Saved contexts can be loaded by name
- [ ] Saved contexts can be loaded by ID
- [ ] MCP Resources are listed correctly
- [ ] Latest session resource can be read
- [ ] Session history resource can be read
- [ ] Resources auto-load in Claude Desktop
- [ ] Error handling works for edge cases
- [ ] Contexts persist after server restart
- [ ] Multiple contexts can be saved
- [ ] Large contexts are handled correctly

---

## Performance Testing

### Metrics to Monitor
1. **Query Tracking Overhead**: Time added to query execution
2. **Context Save Time**: Time to save context with N queries
3. **Context Load Time**: Time to load and format context
4. **Resource Read Time**: Time to read and format resources
5. **Memory Usage**: Memory used by context manager

### Expected Performance
- Query tracking should add < 10ms overhead
- Context save should complete in < 100ms for typical contexts
- Context load should complete in < 50ms
- Resource reads should complete in < 50ms

---

## Regression Testing

After implementing fixes or changes, verify:
1. All existing MCP tools still work
2. Database queries still execute correctly
3. Schema exploration still works
4. No breaking changes to existing functionality

---

## Notes

- Test with real database queries when possible
- Use meaningful test data for better verification
- Check server logs for any errors or warnings
- Test in both development and production-like environments
- Verify .gitignore prevents committing chat_contexts directory

---

## Troubleshooting

### Common Issues

**Issue**: Contexts directory not created
- **Solution**: Check file system permissions
- **Solution**: Verify ContextManager initialization

**Issue**: Queries not being tracked
- **Solution**: Verify QueryExecutor has contextManager reference
- **Solution**: Check server initialization order

**Issue**: Resources not appearing in Claude Desktop
- **Solution**: Restart Claude Desktop
- **Solution**: Verify MCP server is properly configured
- **Solution**: Check server logs for errors

**Issue**: Context save fails
- **Solution**: Check file system permissions
- **Solution**: Verify directory exists
- **Solution**: Check disk space

---

## Success Criteria

All features are considered working when:
1. ✅ All automated tests pass
2. ✅ All manual test cases pass
3. ✅ No errors in server logs
4. ✅ Resources auto-load in Claude Desktop
5. ✅ Contexts persist correctly
6. ✅ Performance is acceptable
7. ✅ Error handling works correctly

