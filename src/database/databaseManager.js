import { Client } from 'pg';
import { Client as SSHClient } from 'ssh2';
import { readFileSync } from 'fs';
import { config } from 'dotenv';
import { createServer } from 'net';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get the directory path for this module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from config.env using absolute path
config({ path: join(__dirname, '../../config.env') });

export class DatabaseManager {
  constructor() {
    this.client = null;
    this.sshClient = null;
    this.localServer = null;
    this.isConnected = false;
    this.accessMode = process.env.DB_ACCESS_MODE || 'readonly';
  }

  async initialize() {
    try {
      // Check if SSH tunneling is required
      if (process.env.SSH_HOST) {
        await this.setupSSHTunnel();
      }
      
      await this.connectToDatabase();
      this.isConnected = true;
      console.error('Database connection established successfully');
    } catch (error) {
      console.error('Failed to initialize database connection:', error);
      throw error;
    }
  }

  async setupSSHTunnel() {
    return new Promise((resolve, reject) => {
      this.sshClient = new SSHClient();
      
      const sshConfig = {
        host: process.env.SSH_HOST,
        port: parseInt(process.env.SSH_PORT) || 22,
        username: process.env.SSH_USERNAME,
      };

      // Configure authentication method
      const authMethod = process.env.SSH_AUTH_METHOD || 'key';
      
      if (authMethod === 'password') {
        // Password-based authentication
        if (!process.env.SSH_PASSWORD) {
          reject(new Error('SSH_PASSWORD is required when using password authentication'));
          return;
        }
        sshConfig.password = process.env.SSH_PASSWORD;
      } else if (authMethod === 'key') {
        // Key-based authentication
        if (!process.env.SSH_PRIVATE_KEY_PATH) {
          reject(new Error('SSH_PRIVATE_KEY_PATH is required when using key authentication'));
          return;
        }
        
        try {
          sshConfig.privateKey = readFileSync(process.env.SSH_PRIVATE_KEY_PATH);
          
          if (process.env.SSH_PASSPHRASE) {
            sshConfig.passphrase = process.env.SSH_PASSPHRASE;
          }
        } catch (error) {
          reject(new Error(`Failed to read private key: ${error.message}`));
          return;
        }
      } else {
        reject(new Error(`Invalid SSH_AUTH_METHOD: ${authMethod}. Use 'password' or 'key'`));
        return;
      }

      this.sshClient.on('ready', () => {
        console.error('SSH connection established');
        
        // Create a local server that forwards connections through SSH
        this.localServer = createServer((socket) => {
          this.sshClient.forwardOut(
            socket.remoteAddress,
            socket.remotePort,
            process.env.DB_HOST,
            parseInt(process.env.DB_PORT) || 5432,
            (err, stream) => {
              if (err) {
                console.error('SSH forward error:', err);
                socket.destroy();
                return;
              }
              
              // Pipe the socket to the SSH stream and vice versa
              socket.pipe(stream);
              stream.pipe(socket);
              
              // Handle errors and cleanup
              socket.on('error', () => {
                stream.destroy();
              });
              stream.on('error', () => {
                socket.destroy();
              });
            }
          );
        });
        
        // Start listening on a local port
        const localPort = 5433; // Use a different port to avoid conflicts
        this.localServer.listen(localPort, '127.0.0.1', () => {
          console.error(`SSH tunnel established on local port ${localPort}`);
          this.localPort = localPort;
          resolve();
        });
        
        this.localServer.on('error', (err) => {
          console.error('Local server error:', err);
          reject(err);
        });
      });

      this.sshClient.on('error', (err) => {
        console.error('SSH connection error:', err);
        reject(err);
      });

      this.sshClient.connect(sshConfig);
    });
  }

  async connectToDatabase() {
    const dbConfig = {
      host: '127.0.0.1', // Always connect to localhost when using SSH tunnel
      port: this.localPort || parseInt(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      ssl: false, // Disable SSL when using SSH tunnel
    };

    // If using SSH tunnel, connect to the local forwarded port
    if (this.localPort) {
      dbConfig.port = this.localPort;
    } else {
      // Direct connection
      dbConfig.host = process.env.DB_HOST;
      dbConfig.port = parseInt(process.env.DB_PORT) || 5432;
      dbConfig.ssl = process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false;
    }

    this.client = new Client(dbConfig);
    
    return new Promise((resolve, reject) => {
      this.client.connect((err) => {
        if (err) {
          console.error('Database connection error:', err);
          reject(err);
          return;
        }
        resolve();
      });
    });
  }

  async testConnection() {
    try {
      if (!this.client) {
        throw new Error('Database client not initialized');
      }

      const result = await this.client.query('SELECT version()');
      return {
        content: [
          {
            type: 'text',
            text: `Database connection successful. PostgreSQL version: ${result.rows[0].version}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Connection test failed: ${error.message}`);
    }
  }

  async executeQuery(query) {
    try {
      if (!this.client) {
        throw new Error('Database client not initialized');
      }

      // Validate query based on access mode
      if (this.accessMode === 'readonly') {
        this.validateReadOnlyQuery(query);
      } else if (this.accessMode === 'full') {
        this.validateFullAccessQuery(query);
      } else {
        throw new Error(`Invalid DB_ACCESS_MODE: ${this.accessMode}. Use 'readonly' or 'full'`);
      }

      const result = await this.client.query(query);
      
      return {
        content: [
          {
            type: 'text',
            text: `Query executed successfully. Rows returned: ${result.rows.length}`,
          },
          {
            type: 'text',
            text: JSON.stringify(result.rows, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Query execution failed: ${error.message}`);
    }
  }

  validateReadOnlyQuery(query) {
    const normalizedQuery = query.trim().toLowerCase();
    const forbiddenKeywords = ['insert', 'update', 'delete', 'drop', 'create', 'alter', 'truncate'];
    
    for (const keyword of forbiddenKeywords) {
      if (normalizedQuery.includes(keyword)) {
        throw new Error(`Query contains forbidden keyword: ${keyword}. Only read-only queries are allowed.`);
      }
    }
  }

  validateFullAccessQuery(query) {
    const normalizedQuery = query.trim().toLowerCase();
    
    // Check for multiple statements (prevent injection)
    if (normalizedQuery.includes(';') && normalizedQuery.split(';').filter(stmt => stmt.trim()).length > 1) {
      throw new Error('Multiple SQL statements are not allowed. Please execute one query at a time.');
    }

    // Basic safety check - warn about dangerous operations
    const dangerousKeywords = ['drop', 'truncate', 'delete'];
    for (const keyword of dangerousKeywords) {
      if (normalizedQuery.includes(keyword)) {
        console.warn(`⚠️  WARNING: Executing potentially dangerous operation: ${keyword.toUpperCase()}`);
      }
    }
  }

  async getClient() {
    if (!this.client) {
      throw new Error('Database client not initialized');
    }
    return this.client;
  }

  async close() {
    try {
      if (this.client) {
        await this.client.end();
        this.client = null;
      }
      
      if (this.sshClient) {
        this.sshClient.end();
        this.sshClient = null;
      }
      
      if (this.localServer) {
        this.localServer.close();
        this.localServer = null;
      }

      this.isConnected = false;
      console.error('Database connection closed');
    } catch (error) {
      console.error('Error closing database connection:', error);
    }
  }
} 