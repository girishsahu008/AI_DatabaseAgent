import { writeFileSync, readFileSync, existsSync, readdirSync, statSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class ContextManager {
  constructor() {
    // Get the project root directory (two levels up from src/tools)
    this.contextsDir = join(__dirname, '../../chat_contexts');
    this.currentContext = null;
    
    // Ensure contexts directory exists
    this.ensureContextsDirectory();
  }

  ensureContextsDirectory() {
    if (!existsSync(this.contextsDir)) {
      try {
        mkdirSync(this.contextsDir, { recursive: true });
      } catch (error) {
        console.error(`Failed to create contexts directory: ${error.message}`);
      }
    }
  }

  // Generate session ID based on timestamp
  generateSessionId() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
  }

  // Initialize or get current context
  getCurrentContext() {
    if (!this.currentContext) {
      const sessionId = this.generateSessionId();
      this.currentContext = {
        sessionId,
        sessionName: null,
        createdAt: new Date().toISOString(),
        summary: '',
        queriesExecuted: [],
        keyFindings: [],
        tablesAccessed: new Set(),
        columnsAnalyzed: {},
        userNotes: '',
      };
    }
    return this.currentContext;
  }

  // Track a query execution
  trackQuery(query, rowsReturned = null, purpose = null) {
    const context = this.getCurrentContext();
    const queryEntry = {
      timestamp: new Date().toISOString(),
      query: query,
      purpose: purpose || 'Query execution',
      rowsReturned: rowsReturned,
    };
    context.queriesExecuted.push(queryEntry);

    // Extract table and column names from query (basic parsing)
    this.extractTableAndColumns(query, context);
  }

  // Extract table and column names from SQL query (basic implementation)
  extractTableAndColumns(query, context) {
    const normalizedQuery = query.toLowerCase();
    
    // Extract table names from FROM and JOIN clauses
    const fromMatch = normalizedQuery.match(/from\s+["']?(\w+)["']?/i);
    if (fromMatch) {
      context.tablesAccessed.add(fromMatch[1]);
    }
    
    const joinMatches = normalizedQuery.matchAll(/join\s+["']?(\w+)["']?/gi);
    for (const match of joinMatches) {
      context.tablesAccessed.add(match[1]);
    }

    // Extract column names from SELECT clause (basic)
    const selectMatch = query.match(/select\s+(.*?)\s+from/i);
    if (selectMatch) {
      const columns = selectMatch[1].split(',').map(col => {
        const colMatch = col.match(/(?:["']?(\w+)["']?\.)?["']?(\w+)["']?/);
        if (colMatch) {
          return {
            table: colMatch[1] || null,
            column: colMatch[2],
          };
        }
        return null;
      }).filter(Boolean);

      columns.forEach(({ table, column }) => {
        if (table) {
          if (!context.columnsAnalyzed[table]) {
            context.columnsAnalyzed[table] = [];
          }
          if (!context.columnsAnalyzed[table].includes(column)) {
            context.columnsAnalyzed[table].push(column);
          }
        }
      });
    }
  }

  // Add a finding to current context
  addFinding(finding) {
    const context = this.getCurrentContext();
    if (!context.keyFindings.includes(finding)) {
      context.keyFindings.push(finding);
    }
  }

  // Save current context to file
  async saveContext(sessionName, summary = '', userNotes = '') {
    const context = this.getCurrentContext();
    
    if (!sessionName) {
      throw new Error('Session name is required');
    }

    context.sessionName = sessionName;
    if (summary) {
      context.summary = summary;
    }
    if (userNotes) {
      context.userNotes = userNotes;
    }

    // Convert Set to Array for JSON serialization
    const contextToSave = {
      ...context,
      tablesAccessed: Array.from(context.tablesAccessed),
    };

    // Generate filename
    const filename = `context_${context.sessionId}_${sessionName.replace(/[^a-zA-Z0-9_-]/g, '_')}.json`;
    const filepath = join(this.contextsDir, filename);

    try {
      writeFileSync(filepath, JSON.stringify(contextToSave, null, 2), 'utf8');
      
      // Reset current context after saving
      this.currentContext = null;
      
      return {
        content: [
          {
            type: 'text',
            text: `Context saved successfully!\n\nSession ID: ${context.sessionId}\nSession Name: ${sessionName}\nFile: ${filename}\nQueries: ${context.queriesExecuted.length}\nFindings: ${context.keyFindings.length}\nTables: ${context.tablesAccessed.size}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to save context: ${error.message}`);
    }
  }

  // List all saved contexts
  async listSavedContexts() {
    try {
      if (!existsSync(this.contextsDir)) {
        return {
          content: [
            {
              type: 'text',
              text: 'No saved contexts found. The contexts directory does not exist.',
            },
          ],
        };
      }

      const files = readdirSync(this.contextsDir)
        .filter(file => file.startsWith('context_') && file.endsWith('.json'))
        .map(file => {
          const filepath = join(this.contextsDir, file);
          const stats = statSync(filepath);
          try {
            const content = JSON.parse(readFileSync(filepath, 'utf8'));
            return {
              sessionId: content.sessionId,
              sessionName: content.sessionName || 'Unnamed',
              createdAt: content.createdAt,
              summary: content.summary || '',
              queriesCount: content.queriesExecuted?.length || 0,
              findingsCount: content.keyFindings?.length || 0,
              filename: file,
              fileSize: stats.size,
              modifiedAt: stats.mtime.toISOString(),
            };
          } catch (error) {
            return {
              filename: file,
              error: `Failed to parse: ${error.message}`,
            };
          }
        })
        .sort((a, b) => {
          if (a.createdAt && b.createdAt) {
            return new Date(b.createdAt) - new Date(a.createdAt);
          }
          return 0;
        });

      if (files.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: 'No saved contexts found.',
            },
          ],
        };
      }

      const contextsList = files.map((ctx, index) => {
        if (ctx.error) {
          return `${index + 1}. ${ctx.filename} - ERROR: ${ctx.error}`;
        }
        const date = new Date(ctx.createdAt).toLocaleString();
        return `${index + 1}. ${ctx.sessionName} (${ctx.sessionId})\n   Created: ${date}\n   Summary: ${ctx.summary || 'No summary'}\n   Queries: ${ctx.queriesCount}, Findings: ${ctx.findingsCount}\n   File: ${ctx.filename}`;
      }).join('\n\n');

      return {
        content: [
          {
            type: 'text',
            text: `Saved Contexts (${files.length} total):\n\n${contextsList}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to list contexts: ${error.message}`);
    }
  }

  // Load a specific context
  async loadContext(sessionIdOrName) {
    try {
      if (!existsSync(this.contextsDir)) {
        throw new Error('No contexts directory found');
      }

      const files = readdirSync(this.contextsDir)
        .filter(file => file.startsWith('context_') && file.endsWith('.json'));

      let contextFile = null;

      // Try to find by sessionId or sessionName
      for (const file of files) {
        const filepath = join(this.contextsDir, file);
        try {
          const content = JSON.parse(readFileSync(filepath, 'utf8'));
          if (content.sessionId === sessionIdOrName || 
              content.sessionName === sessionIdOrName ||
              file.includes(sessionIdOrName)) {
            contextFile = content;
            break;
          }
        } catch (error) {
          continue;
        }
      }

      if (!contextFile) {
        throw new Error(`Context not found: ${sessionIdOrName}`);
      }

      // Format context for display
      const formattedContext = this.formatContextForDisplay(contextFile);

      return {
        content: [
          {
            type: 'text',
            text: formattedContext,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to load context: ${error.message}`);
    }
  }

  // Format context as markdown for display
  formatContextForDisplay(context) {
    const date = new Date(context.createdAt).toLocaleString();
    
    let markdown = `# Analysis Session: ${context.sessionName || 'Unnamed'}\n\n`;
    markdown += `**Session ID:** ${context.sessionId}\n`;
    markdown += `**Created:** ${date}\n\n`;
    
    if (context.summary) {
      markdown += `## Summary\n${context.summary}\n\n`;
    }

    if (context.queriesExecuted && context.queriesExecuted.length > 0) {
      markdown += `## Queries Executed (${context.queriesExecuted.length})\n\n`;
      context.queriesExecuted.forEach((query, index) => {
        const queryDate = new Date(query.timestamp).toLocaleString();
        markdown += `### Query ${index + 1}\n`;
        markdown += `**Time:** ${queryDate}\n`;
        markdown += `**Purpose:** ${query.purpose}\n`;
        if (query.rowsReturned !== null) {
          markdown += `**Rows Returned:** ${query.rowsReturned}\n`;
        }
        markdown += `\n\`\`\`sql\n${query.query}\n\`\`\`\n\n`;
      });
    }

    if (context.keyFindings && context.keyFindings.length > 0) {
      markdown += `## Key Findings\n\n`;
      context.keyFindings.forEach((finding, index) => {
        markdown += `${index + 1}. ${finding}\n`;
      });
      markdown += `\n`;
    }

    if (context.tablesAccessed && context.tablesAccessed.length > 0) {
      markdown += `## Tables Accessed\n\n`;
      context.tablesAccessed.forEach(table => {
        markdown += `- ${table}`;
        if (context.columnsAnalyzed && context.columnsAnalyzed[table]) {
          markdown += ` (columns: ${context.columnsAnalyzed[table].join(', ')})`;
        }
        markdown += `\n`;
      });
      markdown += `\n`;
    }

    if (context.userNotes) {
      markdown += `## User Notes\n${context.userNotes}\n\n`;
    }

    return markdown;
  }

  // Append finding to current context
  async appendFinding(finding) {
    this.addFinding(finding);
    const context = this.getCurrentContext();
    
    return {
      content: [
        {
          type: 'text',
          text: `Finding added to current session context.\n\nCurrent session: ${context.sessionId}\nTotal findings: ${context.keyFindings.length}\n\nFinding: ${finding}`,
        },
      ],
    };
  }

  // Get latest session summary for resource
  getLatestSessionSummary() {
    try {
      if (!existsSync(this.contextsDir)) {
        return null;
      }

      const files = readdirSync(this.contextsDir)
        .filter(file => file.startsWith('context_') && file.endsWith('.json'))
        .map(file => {
          const filepath = join(this.contextsDir, file);
          const stats = statSync(filepath);
          return { file, filepath, mtime: stats.mtime };
        })
        .sort((a, b) => b.mtime - a.mtime);

      if (files.length === 0) {
        return null;
      }

      const latestFile = files[0];
      const content = JSON.parse(readFileSync(latestFile.filepath, 'utf8'));
      return content;
    } catch (error) {
      console.error(`Error getting latest session: ${error.message}`);
      return null;
    }
  }

  // Get session history overview (last 5 sessions)
  getSessionHistoryOverview() {
    try {
      if (!existsSync(this.contextsDir)) {
        return [];
      }

      const files = readdirSync(this.contextsDir)
        .filter(file => file.startsWith('context_') && file.endsWith('.json'))
        .map(file => {
          const filepath = join(this.contextsDir, file);
          const stats = statSync(filepath);
          try {
            const content = JSON.parse(readFileSync(filepath, 'utf8'));
            return {
              ...content,
              modifiedAt: stats.mtime,
            };
          } catch (error) {
            return null;
          }
        })
        .filter(Boolean)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);

      return files;
    } catch (error) {
      console.error(`Error getting session history: ${error.message}`);
      return [];
    }
  }

  // Format latest session as markdown for resource
  formatLatestSessionForResource(context) {
    if (!context) {
      return '# Previous Analysis Context\n\n*No previous sessions found.*';
    }

    const date = new Date(context.createdAt).toLocaleString();
    
    let markdown = `# Previous Analysis Context\n\n`;
    markdown += `**Session:** ${context.sessionName || 'Unnamed'}\n`;
    markdown += `**Date:** ${date}\n`;
    if (context.summary) {
      markdown += `**Summary:** ${context.summary}\n`;
    }
    markdown += `\n`;

    if (context.queriesExecuted && context.queriesExecuted.length > 0) {
      markdown += `## Recent Queries:\n`;
      context.queriesExecuted.slice(0, 5).forEach((query, index) => {
        markdown += `${index + 1}. ${query.purpose}`;
        if (query.rowsReturned !== null) {
          markdown += ` (${query.rowsReturned} rows)`;
        }
        markdown += `\n`;
      });
      if (context.queriesExecuted.length > 5) {
        markdown += `... and ${context.queriesExecuted.length - 5} more queries\n`;
      }
      markdown += `\n`;
    }

    if (context.keyFindings && context.keyFindings.length > 0) {
      markdown += `## Key Findings:\n`;
      context.keyFindings.forEach(finding => {
        markdown += `- ${finding}\n`;
      });
      markdown += `\n`;
    }

    if (context.tablesAccessed && context.tablesAccessed.length > 0) {
      markdown += `## Tables Explored:\n`;
      context.tablesAccessed.forEach(table => {
        markdown += `- ${table}`;
        if (context.columnsAnalyzed && context.columnsAnalyzed[table]) {
          markdown += ` (columns: ${context.columnsAnalyzed[table].join(', ')})`;
        }
        markdown += `\n`;
      });
      markdown += `\n`;
    }

    markdown += `---\n*You can continue from where this analysis left off.*\n`;

    return markdown;
  }

  // Format session history overview for resource
  formatSessionHistoryForResource(sessions) {
    if (sessions.length === 0) {
      return '# Analysis History\n\n*No previous sessions found.*';
    }

    let markdown = `# Analysis History\n\n`;
    markdown += `*Last ${sessions.length} analysis sessions*\n\n`;

    sessions.forEach((session, index) => {
      const date = new Date(session.createdAt).toLocaleString();
      markdown += `## ${index + 1}. ${session.sessionName || 'Unnamed'}\n`;
      markdown += `**Date:** ${date}\n`;
      if (session.summary) {
        markdown += `**Summary:** ${session.summary}\n`;
      }
      markdown += `**Queries:** ${session.queriesExecuted?.length || 0} | `;
      markdown += `**Findings:** ${session.keyFindings?.length || 0} | `;
      markdown += `**Tables:** ${Array.isArray(session.tablesAccessed) ? session.tablesAccessed.length : 0}\n\n`;
    });

    return markdown;
  }
}

