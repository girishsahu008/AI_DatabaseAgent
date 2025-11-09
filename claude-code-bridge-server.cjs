#!/usr/bin/env node

/**
 * Claude Code Bridge Server
 * 
 * This server runs Claude Code in a terminal and exposes it via HTTP
 * so the Electron app can communicate with it.
 * 
 * Run this in a separate terminal: node claude-code-bridge-server.cjs
 */

const http = require('http');
const { spawn } = require('child_process');
const path = require('path');
const { writeFileSync, readFileSync, existsSync, mkdirSync } = require('fs');

const BRIDGE_PORT = 3002;
const SHARED_DIR = path.join(__dirname, 'shared-claude');

// Ensure shared directory exists
if (!existsSync(SHARED_DIR)) {
  mkdirSync(SHARED_DIR, { recursive: true });
}

let claudeProcess = null;
let currentQuery = null;
let queryCallback = null;
let responseBuffer = '';

/**
 * Start Claude Code in interactive mode
 */
function startClaudeCode() {
  return new Promise((resolve, reject) => {
    console.log('🚀 Starting Claude Code...');
    
    const options = {
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true,
      cwd: path.join(__dirname, 'electron-app'),
      env: {
        ...process.env,
        TERM: 'xterm-256color',
      },
    };

    claudeProcess = spawn('claude', [], options);

    let initBuffer = '';

    let isResolved = false;

    claudeProcess.stdout.on('data', (data) => {
      const text = data.toString();
      initBuffer += text;
      
      // Print to console so we can see Claude's output
      process.stdout.write(text);
      
      // Check if Claude is ready - look for any interactive prompt
      // Common patterns: ">", "User:", "╰", or any prompt-like text
      if (!isResolved && (text.includes('>') || 
          text.includes('Welcome') || 
          text.includes('User:') ||
          text.includes('╰') ||
          text.includes('Recent activity') ||
          initBuffer.length > 500)) {  // If we got substantial output, Claude is probably ready
        console.log('\n✅ Claude Code is ready!');
        console.log('💡 You can also interact directly in this terminal\n');
        console.log('📝 Waiting for queries from Electron app...\n');
        isResolved = true;
        resolve();
      }

      // Capture responses for queries
      if (currentQuery) {
        responseBuffer += text;
        
        // Check if response is complete (shows prompt again)
        // Be more lenient with completion detection
        if (text.includes('>') || 
            text.includes('User:') ||
            text.trim().endsWith('>') ||
            (responseBuffer.length > 50 && text.includes('\n\n'))) {
          // Give it a moment to ensure response is complete
          setTimeout(() => {
            if (currentQuery) {  // Still waiting for this query
              handleQueryComplete();
            }
          }, 500);
        }
      }
    });

    claudeProcess.stderr.on('data', (data) => {
      const text = data.toString();
      initBuffer += text;
      
      // Print stderr for debugging
      process.stderr.write(text);
      
      // Check stderr for ready signals too
      if (!isResolved && (text.includes('Welcome') || 
          text.includes('Ready') ||
          text.includes('MCP') ||
          text.includes('Connected'))) {
        console.log('\n✅ Claude Code is ready (from stderr)!');
        console.log('💡 You can also interact directly in this terminal\n');
        console.log('📝 Waiting for queries from Electron app...\n');
        isResolved = true;
        resolve();
      }
    });

    claudeProcess.on('exit', (code) => {
      console.log(`\n❌ Claude Code exited with code ${code}`);
      claudeProcess = null;
    });

    claudeProcess.on('error', (error) => {
      console.error('❌ Claude Code error:', error);
      reject(error);
    });

    // Timeout - Claude Code should be ready within 15 seconds
    setTimeout(() => {
      if (!isResolved && claudeProcess) {
        console.log('\n✅ Claude Code initialized (timeout reached, assuming ready)');
        console.log('💡 If you see Claude Code running above, it should work!');
        console.log('📝 Waiting for queries from Electron app...\n');
        isResolved = true;
        resolve();
      }
    }, 15000);
  });
}

/**
 * Send query to Claude Code
 */
function sendToClaude(query) {
  return new Promise((resolve, reject) => {
    if (!claudeProcess) {
      reject(new Error('Claude Code is not running'));
      return;
    }

    console.log(`\n📤 Sending to Claude: "${query.substring(0, 50)}..."`);
    
    currentQuery = query;
    queryCallback = resolve;
    responseBuffer = '';

    // Send to Claude's stdin
    claudeProcess.stdin.write(query + '\n');

    // Timeout after 60 seconds
    setTimeout(() => {
      if (queryCallback) {
        console.log('⏱️ Query timeout');
        const response = responseBuffer || 'Response timeout';
        queryCallback(response);
        queryCallback = null;
        currentQuery = null;
      }
    }, 60000);
  });
}

/**
 * Handle query completion
 */
function handleQueryComplete() {
  if (queryCallback && responseBuffer) {
    console.log(`\n📥 Response received (${responseBuffer.length} chars)`);
    
    // Clean up the response - remove prompts and control characters
    let cleanResponse = responseBuffer
      .replace(/\n>/g, '')  // Remove prompts
      .replace(/^>.*$/gm, '')  // Remove prompt lines
      .replace(/╭[─│╮╯├┤┬┴┼╰]+/g, '')  // Remove box drawing characters
      .replace(/^.*Tips for getting started.*$/gm, '')  // Remove startup tips
      .replace(/^.*Recent activity.*$/gm, '')  // Remove activity section
      .replace(/\x1b\[[0-9;]*m/g, '')  // Remove ANSI color codes
      .replace(/\r/g, '')  // Remove carriage returns
      .trim();
    
    // Remove the original query if it's echoed back
    if (currentQuery && cleanResponse.startsWith(currentQuery)) {
      cleanResponse = cleanResponse.substring(currentQuery.length).trim();
    }
    
    queryCallback(cleanResponse);
    queryCallback = null;
    currentQuery = null;
    responseBuffer = '';
  }
}

/**
 * Create HTTP server for Electron to communicate with
 */
function createBridgeServer() {
  const server = http.createServer(async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Content-Type', 'application/json');

    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    // Health check
    if (req.url === '/health' && req.method === 'GET') {
      res.writeHead(200);
      res.end(JSON.stringify({ 
        status: 'ok', 
        claudeRunning: claudeProcess !== null,
        port: BRIDGE_PORT 
      }));
      return;
    }

    // Send query to Claude
    if (req.url === '/claude/query' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk.toString());
      req.on('end', async () => {
        try {
          const { query } = JSON.parse(body);
          
          if (!query) {
            res.writeHead(400);
            res.end(JSON.stringify({ error: 'Query is required' }));
            return;
          }

          // Send to Claude Code
          const response = await sendToClaude(query);
          
          res.writeHead(200);
          res.end(JSON.stringify({ response }));
        } catch (error) {
          res.writeHead(500);
          res.end(JSON.stringify({ error: error.message }));
        }
      });
      return;
    }

    // 404
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Not found' }));
  });

  server.listen(BRIDGE_PORT, 'localhost', () => {
    console.log(`\n🌐 Bridge Server running on http://localhost:${BRIDGE_PORT}`);
    console.log(`📡 Electron app can now communicate with Claude Code via this server`);
  });

  return server;
}

/**
 * Main startup
 */
async function start() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║   Claude Code Bridge Server                              ║');
  console.log('║   Connects Electron App ↔ Claude Code                   ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  try {
    // Start Claude Code
    await startClaudeCode();
    
    // Start HTTP bridge
    createBridgeServer();
    
    console.log('\n✅ Bridge server ready!');
    console.log('💡 Now start your Electron app: cd electron-app && npm start\n');
    console.log('📝 You can also type directly in this terminal to interact with Claude\n');
    
  } catch (error) {
    console.error('\n❌ Failed to start:', error.message);
    process.exit(1);
  }
}

// Handle shutdown
process.on('SIGINT', () => {
  console.log('\n\n👋 Shutting down...');
  if (claudeProcess) {
    claudeProcess.kill();
  }
  process.exit(0);
});

process.on('SIGTERM', () => {
  if (claudeProcess) {
    claudeProcess.kill();
  }
  process.exit(0);
});

// Start the server
start();

