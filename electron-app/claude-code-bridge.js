const { spawn } = require('child_process');
const path = require('path');
const { EventEmitter } = require('events');

/**
 * Bridge between Electron app and Claude Code CLI
 * Manages Claude Code process and communication
 */
class ClaudeCodeBridge extends EventEmitter {
  constructor(mcpServerPath) {
    super();
    this.mcpServerPath = mcpServerPath || path.join(__dirname, '../src/index.js');
    this.claudeProcess = null;
    this.isReady = false;
    this.messageQueue = [];
    this.currentResponse = '';
    this.conversationHistory = [];
  }

  /**
   * Start Claude Code process with MCP server
   */
  async start() {
    return new Promise((resolve, reject) => {
      console.log('Starting Claude Code with MCP server...');

      // Create temporary config for Claude Code
      const config = {
        mcpServers: {
          postgresql: {
            command: 'node',
            args: [this.mcpServerPath],
          },
        },
      };

      // Start Claude Code process
      // Note: Claude Code should be started with the MCP server configuration
      // We'll use headless mode if available
      const claudeArgs = [
        '--headless',  // Run without TUI
        '--config', path.join(__dirname, 'claude-code-config-stdio.json'),
      ];

      // Use 'claude' command (Claude Code v2.0.36)
      this.claudeProcess = spawn('claude', claudeArgs, {
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true,
      });

      // Handle stdout (Claude's responses)
      this.claudeProcess.stdout.on('data', (data) => {
        const text = data.toString();
        this.handleOutput(text);
      });

      // Handle stderr (errors and logs)
      this.claudeProcess.stderr.on('data', (data) => {
        const text = data.toString();
        console.error('Claude Code stderr:', text);
        
        // Check for ready indicators
        if (text.includes('Connected to MCP') || text.includes('Ready')) {
          this.isReady = true;
          this.emit('ready');
          resolve();
        }
      });

      // Handle process exit
      this.claudeProcess.on('exit', (code) => {
        console.log(`Claude Code process exited with code ${code}`);
        this.isReady = false;
        this.emit('exit', code);
      });

      // Handle errors
      this.claudeProcess.on('error', (error) => {
        console.error('Claude Code process error:', error);
        this.emit('error', error);
        reject(error);
      });

      // Timeout if not ready in 10 seconds
      setTimeout(() => {
        if (!this.isReady) {
          console.log('Claude Code started (assuming ready)');
          this.isReady = true;
          this.emit('ready');
          resolve();
        }
      }, 10000);
    });
  }

  /**
   * Handle output from Claude Code
   */
  handleOutput(text) {
    this.currentResponse += text;
    
    // Check if response is complete (simple heuristic)
    // In a real implementation, you'd parse Claude Code's output format
    if (text.includes('\n>') || text.includes('User:')) {
      // Response complete
      this.emit('response', this.currentResponse);
      this.currentResponse = '';
    }
  }

  /**
   * Send message to Claude Code
   */
  sendMessage(message) {
    if (!this.isReady) {
      console.error('Claude Code is not ready');
      this.emit('error', new Error('Claude Code is not ready'));
      return;
    }

    try {
      // Add to conversation history
      this.conversationHistory.push({
        role: 'user',
        content: message,
      });

      // Send to Claude Code stdin
      this.claudeProcess.stdin.write(message + '\n');
      
      console.log('Message sent to Claude Code:', message);
    } catch (error) {
      console.error('Failed to send message:', error);
      this.emit('error', error);
    }
  }

  /**
   * Stop Claude Code process
   */
  stop() {
    if (this.claudeProcess) {
      this.claudeProcess.kill();
      this.claudeProcess = null;
      this.isReady = false;
    }
  }

  /**
   * Get conversation history
   */
  getHistory() {
    return this.conversationHistory;
  }

  /**
   * Clear conversation history
   */
  clearHistory() {
    this.conversationHistory = [];
    this.currentResponse = '';
  }
}

module.exports = { ClaudeCodeBridge };

