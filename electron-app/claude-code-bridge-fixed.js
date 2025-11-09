const { spawn } = require('child_process');
const path = require('path');
const { EventEmitter } = require('events');
const { writeFileSync } = require('fs');

/**
 * Bridge between Electron app and Claude Code CLI
 * Based on Claude Code documentation: https://code.claude.com/docs/en/sub-agents
 */
class ClaudeCodeBridge extends EventEmitter {
  constructor(mcpServerPath) {
    super();
    this.mcpServerPath = mcpServerPath || path.join(__dirname, '../src/index.js');
    this.claudeProcess = null;
    this.isReady = false;
    this.responseBuffer = '';
    this.currentPrompt = '';
    this.waitingForResponse = false;
    this.responseCallback = null;

    // Create Claude Code config file
    this.createClaudeConfig();
  }

  /**
   * Create Claude Code configuration file with MCP server
   */
  createClaudeConfig() {
    const configDir = path.join(__dirname, '.claude');
    const { mkdirSync, existsSync } = require('fs');
    
    if (!existsSync(configDir)) {
      mkdirSync(configDir, { recursive: true });
    }

    const config = {
      mcpServers: {
        postgresql: {
          command: 'node',
          args: [this.mcpServerPath],
          description: 'PostgreSQL database MCP server with context persistence',
        },
      },
    };

    const configPath = path.join(configDir, 'config.json');
    writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log('Created Claude Code config at:', configPath);
    
    return configPath;
  }

  /**
   * Start Claude Code process in headless mode
   */
  async start() {
    return new Promise((resolve, reject) => {
      console.log('Initializing Claude Code bridge...');
      console.log('Checking connection to Claude Code Bridge Server on port 3002...');

      // Check if bridge server is running
      const http = require('http');
      const req = http.get('http://localhost:3002/health', (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const health = JSON.parse(data);
            if (health.claudeRunning) {
              console.log('✅ Connected to Claude Code Bridge Server');
              this.isReady = true;
              this.emit('ready');
              resolve();
            } else {
              console.warn('⚠️  Bridge server running but Claude Code not started');
              console.warn('⚠️  Start the bridge server first: node claude-code-bridge-server.js');
              reject(new Error('Claude Code not running in bridge server'));
            }
          } catch (error) {
            reject(error);
          }
        });
      });

      req.on('error', (error) => {
        console.error('❌ Cannot connect to bridge server on port 3002');
        console.error('💡 Start the bridge server in another terminal:');
        console.error('   node claude-code-bridge-server.js');
        reject(new Error('Bridge server not running'));
      });

      req.setTimeout(3000, () => {
        req.destroy();
        reject(new Error('Bridge server connection timeout'));
      });
    });
  }

  /**
   * Send message to Claude Code Bridge Server
   * The bridge server runs Claude Code in a separate terminal
   */
  sendMessage(message) {
    return new Promise((resolve, reject) => {
      if (!this.isReady) {
        reject(new Error('Claude Code bridge is not ready'));
        return;
      }

      try {
        console.log('Sending to Claude Code Bridge:', message);
        
        const postData = JSON.stringify({ query: message });
        
        const options = {
          hostname: 'localhost',
          port: 3002,  // Bridge server port
          path: '/claude/query',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData),
          },
        };

        const http = require('http');
        const req = http.request(options, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            try {
              const result = JSON.parse(data);
              if (result.error) {
                reject(new Error(result.error));
              } else {
                resolve(result.response);
              }
            } catch (error) {
              reject(new Error('Failed to parse bridge response'));
            }
          });
        });

        req.on('error', (error) => {
          reject(error);
        });

        req.setTimeout(60000, () => {
          req.destroy();
          reject(new Error('Bridge request timeout'));
        });

        req.write(postData);
        req.end();
        
      } catch (error) {
        console.error('Failed to send message to bridge:', error);
        reject(error);
      }
    });
  }

  /**
   * Handle complete response from Claude Code
   */
  handleCompleteResponse() {
    if (this.responseCallback && this.responseBuffer) {
      this.waitingForResponse = false;
      const response = this.responseBuffer.trim();
      this.responseCallback(response);
      this.responseCallback = null;
      this.responseBuffer = '';
    }
  }

  /**
   * Stop Claude Code process
   */
  stop() {
    if (this.claudeProcess) {
      console.log('Stopping Claude Code process...');
      this.claudeProcess.kill('SIGTERM');
      this.claudeProcess = null;
      this.isReady = false;
    }
  }

  /**
   * Check if Claude Code is running and ready
   */
  getStatus() {
    return {
      isReady: this.isReady,
      processRunning: this.claudeProcess !== null,
    };
  }
}

module.exports = { ClaudeCodeBridge };

