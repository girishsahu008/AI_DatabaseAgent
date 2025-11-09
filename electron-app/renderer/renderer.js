// Renderer process JavaScript
let currentTool = null;
let tools = [];

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  // Set up event listeners
  window.electronAPI.onMcpServerReady((data) => {
    updateStatus('running', 'Server running on localhost:3000');
  });

  window.electronAPI.onMcpServerError((error) => {
    updateStatus('error', `Error: ${error}`);
  });

  // Check server status
  await checkServerStatus();
  
  // Load tools
  await loadTools();
});

/**
 * Check MCP server status
 */
async function checkServerStatus() {
  try {
    const status = await window.electronAPI.getMcpServerStatus();
    if (status.status === 'running') {
      updateStatus('running', 'Server running on localhost:3000');
    } else {
      updateStatus('error', 'Server not responding');
    }
  } catch (error) {
    updateStatus('error', `Error: ${error.message}`);
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
 * Load available tools
 */
async function loadTools() {
  try {
    const response = await window.electronAPI.listMcpTools();
    tools = response.tools || [];
    renderToolList();
  } catch (error) {
    console.error('Failed to load tools:', error);
    document.getElementById('toolList').innerHTML = 
      '<li class="tool-item error">Failed to load tools</li>';
  }
}

/**
 * Render tool list in sidebar
 */
function renderToolList() {
  const toolList = document.getElementById('toolList');
  
  if (tools.length === 0) {
    toolList.innerHTML = '<li class="tool-item">No tools available</li>';
    return;
  }

  toolList.innerHTML = tools.map((tool, index) => `
    <li class="tool-item" data-tool-index="${index}">
      ${tool.name}
    </li>
  `).join('');

  // Add click handlers
  toolList.querySelectorAll('.tool-item').forEach(item => {
    item.addEventListener('click', () => {
      const index = parseInt(item.dataset.toolIndex);
      selectTool(tools[index]);
    });
  });
}

/**
 * Select a tool and show its panel
 */
function selectTool(tool) {
  currentTool = tool;
  
  // Update active state
  document.querySelectorAll('.tool-item').forEach(item => {
    item.classList.remove('active');
  });
  document.querySelector(`[data-tool-index="${tools.indexOf(tool)}"]`).classList.add('active');

  // Render tool panel
  renderToolPanel(tool);
}

/**
 * Render tool panel
 */
function renderToolPanel(tool) {
  const panel = document.getElementById('toolPanel');
  
  // Generate form based on tool schema
  const formFields = generateFormFields(tool.inputSchema);
  
  panel.innerHTML = `
    <div class="tool-form">
      <h2>${tool.name}</h2>
      <p style="margin: 0.5rem 0; color: #858585;">${tool.description}</p>
      <form id="toolForm">
        ${formFields}
        <button type="submit" class="btn" id="executeBtn">Execute</button>
      </form>
      <div class="results" id="results" style="display: none;"></div>
    </div>
  `;

  // Add form submit handler
  document.getElementById('toolForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    await executeTool(tool);
  });
}

/**
 * Generate form fields from schema
 */
function generateFormFields(schema) {
  if (!schema.properties || Object.keys(schema.properties).length === 0) {
    return '<p>This tool requires no parameters.</p>';
  }

  return Object.entries(schema.properties).map(([key, prop]) => {
    const required = schema.required && schema.required.includes(key);
    const isTextarea = key === 'query' || (prop.type === 'string' && prop.description && prop.description.length > 100);
    
    return `
      <div class="form-group">
        <label for="${key}">
          ${key}${required ? ' *' : ''}
          ${prop.description ? `<br><small style="color: #858585;">${prop.description}</small>` : ''}
        </label>
        ${isTextarea ? 
          `<textarea id="${key}" name="${key}" ${required ? 'required' : ''}></textarea>` :
          `<input type="text" id="${key}" name="${key}" ${required ? 'required' : ''} />`
        }
      </div>
    `;
  }).join('');
}

/**
 * Execute tool
 */
async function executeTool(tool) {
  const form = document.getElementById('toolForm');
  const results = document.getElementById('results');
  const executeBtn = document.getElementById('executeBtn');
  
  // Get form data
  const formData = new FormData(form);
  const args = {};
  
  for (const [key, value] of formData.entries()) {
    if (value.trim()) {
      args[key] = value.trim();
    }
  }

  // Show loading state
  executeBtn.disabled = true;
  executeBtn.textContent = 'Executing...';
  results.style.display = 'block';
  results.innerHTML = '<pre class="loading">Executing tool...</pre>';

  try {
    // Call tool
    const response = await window.electronAPI.callMcpTool(tool.name, args);
    
    // Display results
    if (response.error) {
      results.innerHTML = `<pre class="error">Error: ${response.error}</pre>`;
    } else if (response.content && response.content.length > 0) {
      const content = response.content.map(c => c.text || JSON.stringify(c, null, 2)).join('\n\n');
      results.innerHTML = `<pre class="success">${escapeHtml(content)}</pre>`;
    } else {
      results.innerHTML = `<pre>${JSON.stringify(response, null, 2)}</pre>`;
    }
  } catch (error) {
    results.innerHTML = `<pre class="error">Error: ${error.message}</pre>`;
  } finally {
    executeBtn.disabled = false;
    executeBtn.textContent = 'Execute';
  }
}

/**
 * Escape HTML
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

