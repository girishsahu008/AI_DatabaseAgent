const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // MCP Server methods
  getMcpServerStatus: () => ipcRenderer.invoke('get-mcp-server-status'),
  listMcpTools: () => ipcRenderer.invoke('list-mcp-tools'),
  callMcpTool: (toolName, args) => ipcRenderer.invoke('call-mcp-tool', toolName, args),
  
  // Claude Code integration
  sendToClaudeCode: (message) => ipcRenderer.invoke('send-to-claude-code', message),
  getClaudeCodeStatus: () => ipcRenderer.invoke('claude-code-status'),
  
  // Event listeners
  onMcpServerReady: (callback) => {
    ipcRenderer.on('mcp-server-ready', (event, data) => callback(data));
  },
  onMcpServerError: (callback) => {
    ipcRenderer.on('mcp-server-error', (event, error) => callback(error));
  },
  onClaudeCodeReady: (callback) => {
    ipcRenderer.on('claude-code-ready', (event, data) => callback(data));
  },
  onClaudeCodeResponse: (callback) => {
    ipcRenderer.on('claude-code-response', (event, response) => callback(response));
  },
  onClaudeCodeError: (callback) => {
    ipcRenderer.on('claude-code-error', (event, error) => callback(error));
  },
  
  // Remove listeners
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  },
});

