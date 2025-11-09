// Chat interface JavaScript
let conversationHistory = [];

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  // Set up event listeners
  window.electronAPI.onMcpServerReady((data) => {
    checkAIStatus();
  });

  window.electronAPI.onMcpServerError((error) => {
    updateStatus('error', `Error: ${error}`);
  });

  window.electronAPI.onClaudeCodeReady(() => {
    updateStatus('active', '🤖 Claude AI Ready (Powered by Claude Code)');
  });

  window.electronAPI.onClaudeCodeError((error) => {
    console.error('Claude Code error:', error);
    updateStatus('active', 'AI Assistant Ready (Fallback Mode)');
  });

  // Check server status
  await checkServerStatus();

  // Set up input handlers
  const input = document.getElementById('userInput');
  const sendBtn = document.getElementById('sendBtn');

  sendBtn.addEventListener('click', () => sendMessage());
  
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // Set up example click handlers
  document.querySelectorAll('.example').forEach(example => {
    example.addEventListener('click', () => {
      const query = example.dataset.query;
      input.value = query;
      sendMessage();
    });
  });
});

/**
 * Check MCP server status
 */
async function checkServerStatus() {
  try {
    const status = await window.electronAPI.getMcpServerStatus();
    if (status.status === 'running') {
      await checkAIStatus();
    } else {
      updateStatus('error', 'Server not responding');
    }
  } catch (error) {
    updateStatus('error', `Error: ${error.message}`);
  }
}

/**
 * Check AI (Claude Code) status
 */
async function checkAIStatus() {
  try {
    const claudeStatus = await window.electronAPI.getClaudeCodeStatus();
    if (claudeStatus.available) {
      updateStatus('active', '🤖 Claude AI Ready (Powered by Claude Code)');
    } else {
      updateStatus('active', 'AI Assistant Ready (Pattern Matching)');
    }
  } catch (error) {
    updateStatus('active', 'AI Assistant Ready (Fallback Mode)');
  }
}

/**
 * Update status indicator
 */
function updateStatus(status, text) {
  const indicator = document.getElementById('statusIndicator');
  const statusText = document.getElementById('statusText');
  
  indicator.className = `status-indicator ${status}`;
  statusText.textContent = text;
}

/**
 * Send user message
 */
async function sendMessage() {
  const input = document.getElementById('userInput');
  const sendBtn = document.getElementById('sendBtn');
  const message = input.value.trim();

  if (!message) return;

  // Add user message to UI
  addMessage('user', message);
  
  // Clear input and disable
  input.value = '';
  sendBtn.disabled = true;

  // Show thinking indicator
  const thinkingId = showThinking();

  try {
    // Process the message with AI
    const response = await processNaturalLanguageQuery(message);
    
    // Remove thinking indicator
    removeThinking(thinkingId);
    
    // Add assistant response
    addMessage('assistant', response);
  } catch (error) {
    removeThinking(thinkingId);
    addMessage('assistant', {
      error: true,
      message: `Sorry, I encountered an error: ${error.message}`
    });
  } finally {
    sendBtn.disabled = false;
    input.focus();
  }
}

/**
 * Process natural language query with AI
 */
async function processNaturalLanguageQuery(query) {
  // Check if Claude Code is available
  const claudeStatus = await window.electronAPI.getClaudeCodeStatus();
  
  if (claudeStatus.available) {
    // Use Claude Code for AI-powered processing
    return await processWithClaudeCode(query);
  } else {
    // Fallback to basic pattern matching
    return await processwithFallback(query);
  }
}

/**
 * Process query with Claude Code (Real AI)
 */
async function processWithClaudeCode(query) {
  try {
    const result = await window.electronAPI.sendToClaudeCode(query);
    
    if (result.error) {
      // Fallback to pattern matching for database queries only
      if (isDatabaseQuery(query)) {
        return await processWithFallback(query);
      } else {
        // For non-database queries, show the error
        return {
          message: result.message || "Claude Code is not available right now.",
          note: "The app will still help with database queries using basic patterns."
        };
      }
    }

    // Parse Claude Code's response - it handles EVERYTHING (database, weather, coding, etc.)
    return {
      aiResponse: result.response,
      usingAI: true
    };
  } catch (error) {
    // Fallback only for database queries
    if (isDatabaseQuery(query)) {
      return await processWithFallback(query);
    } else {
      return {
        message: "I'm a database assistant. For non-database questions, I need Claude Code to be running.",
        note: "You can ask me about database tables, schemas, and queries."
      };
    }
  }
}

/**
 * Check if query is database-related
 */
function isDatabaseQuery(query) {
  const lowerQuery = query.toLowerCase();
  return lowerQuery.match(/table|schema|query|select|database|sql|find|show|get|list|which|top|customer|order|product|sales|revenue|fabric/);
}

/**
 * Fallback processing with pattern matching
 */
async function processWithFallback(query) {
  // First, get database schema to understand the structure
  const schemaResponse = await window.electronAPI.callMcpTool('list_tables', {});
  
  let schema = '';
  if (schemaResponse.content && schemaResponse.content.length > 0) {
    schema = schemaResponse.content[0].text;
  }

  // Determine what the user wants
  const intent = analyzeIntent(query);

  // Execute based on intent
  if (intent.type === 'list_tables') {
    return await handleListTables();
  } else if (intent.type === 'schema') {
    return await handleSchemaQuery(intent.tableName);
  } else if (intent.type === 'query') {
    return await handleSQLQuery(query, intent.suggestedSQL, schema);
  } else {
    return {
      message: "I'll help you query your database. Try asking:\n- List all tables\n- Show schema for [table_name]\n- Select data from [table_name]\n- Or describe what you're looking for",
      suggestions: true,
      note: "💡 For better AI understanding, ensure Claude Code is installed and configured."
    };
  }
}

/**
 * Analyze user intent from natural language
 */
function analyzeIntent(query) {
  const lowerQuery = query.toLowerCase();

  // Check for list tables intent
  if (lowerQuery.match(/list.*tables?|show.*tables?|what tables?|all tables/)) {
    return { type: 'list_tables' };
  }

  // Check for schema intent
  const schemaMatch = lowerQuery.match(/schema|structure|columns?.*in|describe.*table|table.*structure/);
  if (schemaMatch) {
    // Try to extract table name
    const tableMatch = query.match(/(?:for|of|in)\s+(?:the\s+)?(\w+)/i);
    return {
      type: 'schema',
      tableName: tableMatch ? tableMatch[1] : null
    };
  }

  // Check for common query patterns and suggest SQL
  const suggestedSQL = generateSQLFromNaturalLanguage(query);
  
  return {
    type: 'query',
    suggestedSQL: suggestedSQL
  };
}

/**
 * Generate SQL from natural language (basic implementation)
 */
function generateSQLFromNaturalLanguage(query) {
  const lowerQuery = query.toLowerCase();

  // Sales queries
  if (lowerQuery.match(/sales.*last month/)) {
    return "SELECT * FROM orders WHERE order_date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month') AND order_date < DATE_TRUNC('month', CURRENT_DATE) ORDER BY order_date DESC LIMIT 100";
  }

  if (lowerQuery.match(/top.*customers?.*revenue|customers?.*most.*revenue/)) {
    return "SELECT customer_id, customer_name, SUM(total_amount) as total_revenue FROM orders JOIN customers ON orders.customer_id = customers.id GROUP BY customer_id, customer_name ORDER BY total_revenue DESC LIMIT 10";
  }

  if (lowerQuery.match(/which.*sold.*most|most.*sold|best.*selling/)) {
    return "SELECT product_name, COUNT(*) as sales_count, SUM(quantity) as total_quantity FROM order_items JOIN products ON order_items.product_id = products.id GROUP BY product_name ORDER BY sales_count DESC LIMIT 10";
  }

  if (lowerQuery.match(/revenue.*this year|sales.*this year/)) {
    return "SELECT DATE_TRUNC('month', order_date) as month, SUM(total_amount) as monthly_revenue FROM orders WHERE order_date >= DATE_TRUNC('year', CURRENT_DATE) GROUP BY month ORDER BY month";
  }

  // Extract table name and basic SELECT
  const tableMatch = query.match(/from\s+(\w+)|in\s+(\w+)|table\s+(\w+)/i);
  if (tableMatch) {
    const tableName = tableMatch[1] || tableMatch[2] || tableMatch[3];
    return `SELECT * FROM ${tableName} LIMIT 10`;
  }

  return null;
}

/**
 * Handle list tables request
 */
async function handleListTables() {
  const response = await window.electronAPI.callMcpTool('list_tables', {});
  
  if (response.content && response.content.length > 0) {
    return {
      message: "Here are the tables in your database:",
      data: response.content[0].text
    };
  }
  
  return { error: true, message: "Could not retrieve tables" };
}

/**
 * Handle schema query
 */
async function handleSchemaQuery(tableName) {
  if (!tableName) {
    return {
      message: "Which table would you like to see the schema for?",
      suggestions: true
    };
  }

  const response = await window.electronAPI.callMcpTool('get_schema', { tableName });
  
  if (response.content && response.content.length > 0) {
    return {
      message: `Here's the schema for the ${tableName} table:`,
      data: response.content[0].text
    };
  }
  
  return { error: true, message: `Could not retrieve schema for ${tableName}` };
}

/**
 * Handle SQL query execution
 */
async function handleSQLQuery(originalQuery, suggestedSQL, schema) {
  if (!suggestedSQL) {
    return {
      message: "I understand you want to query the database, but I need more specific information. Could you rephrase your question or provide more details?\n\nAvailable tables:\n" + (schema || "Use 'list tables' to see available tables"),
      suggestions: true
    };
  }

  // Execute the SQL
  const response = await window.electronAPI.callMcpTool('execute_query', { 
    query: suggestedSQL,
    purpose: originalQuery 
  });

  if (response.error) {
    return {
      error: true,
      message: "The query encountered an error. Let me try a different approach.",
      sql: suggestedSQL,
      errorDetails: response.error
    };
  }

  if (response.content && response.content.length > 0) {
    return {
      message: "Here are the results:",
      sql: suggestedSQL,
      data: response.content[1] ? response.content[1].text : response.content[0].text
    };
  }

  return { error: true, message: "No results found" };
}

/**
 * Add message to UI
 */
function addMessage(role, content) {
  const messagesDiv = document.getElementById('messages');
  
  // Remove welcome message if it exists
  const welcome = messagesDiv.querySelector('.welcome-message');
  if (welcome) {
    welcome.remove();
  }

  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${role}`;

  const avatar = document.createElement('div');
  avatar.className = 'message-avatar';
  avatar.textContent = role === 'user' ? 'U' : 'AI';

  const contentDiv = document.createElement('div');
  contentDiv.className = 'message-content';

  if (typeof content === 'string') {
    contentDiv.innerHTML = formatMessage(content);
  } else {
    // Complex response
    if (content.error) {
      contentDiv.innerHTML = `<div class="error">${escapeHtml(content.message)}</div>`;
      if (content.sql) {
        contentDiv.innerHTML += `<div class="sql-query"><div class="sql-label">SQL Query:</div><pre>${escapeHtml(content.sql)}</pre></div>`;
      }
    } else {
      if (content.message) {
        contentDiv.innerHTML = `<p>${escapeHtml(content.message)}</p>`;
      }
      if (content.usingAI) {
        contentDiv.innerHTML += `<div style="background: rgba(78, 201, 176, 0.1); padding: 0.5rem; border-radius: 4px; margin: 0.5rem 0; font-size: 0.85rem;">
          ✨ Powered by Claude AI
        </div>`;
      }
      if (content.note) {
        contentDiv.innerHTML += `<div style="color: #858585; font-size: 0.85rem; margin: 0.5rem 0;">${escapeHtml(content.note)}</div>`;
      }
      if (content.aiResponse) {
        contentDiv.innerHTML += `<div style="margin: 0.5rem 0;">${formatMessage(content.aiResponse)}</div>`;
      }
      if (content.sql) {
        contentDiv.innerHTML += `<div class="sql-query"><div class="sql-label">📝 SQL Query:</div><pre>${escapeHtml(content.sql)}</pre></div>`;
      }
      if (content.data) {
        contentDiv.innerHTML += `<pre>${escapeHtml(content.data)}</pre>`;
      }
    }
  }

  messageDiv.appendChild(avatar);
  messageDiv.appendChild(contentDiv);
  messagesDiv.appendChild(messageDiv);

  // Scroll to bottom
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

/**
 * Show thinking indicator
 */
function showThinking() {
  const messagesDiv = document.getElementById('messages');
  const thinkingDiv = document.createElement('div');
  const thinkingId = 'thinking-' + Date.now();
  thinkingDiv.id = thinkingId;
  thinkingDiv.className = 'message assistant';
  
  thinkingDiv.innerHTML = `
    <div class="message-avatar">AI</div>
    <div class="message-content">
      <div class="thinking">
        <span>Thinking</span>
        <div class="thinking-dots">
          <div class="thinking-dot"></div>
          <div class="thinking-dot"></div>
          <div class="thinking-dot"></div>
        </div>
      </div>
    </div>
  `;
  
  messagesDiv.appendChild(thinkingDiv);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
  
  return thinkingId;
}

/**
 * Remove thinking indicator
 */
function removeThinking(thinkingId) {
  const thinkingDiv = document.getElementById(thinkingId);
  if (thinkingDiv) {
    thinkingDiv.remove();
  }
}

/**
 * Format message text
 */
function formatMessage(text) {
  return escapeHtml(text).replace(/\n/g, '<br>');
}

/**
 * Escape HTML
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

