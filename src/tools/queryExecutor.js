export class QueryExecutor {
  constructor(databaseManager, contextManager = null) {
    this.databaseManager = databaseManager;
    this.contextManager = contextManager;
  }

  setContextManager(contextManager) {
    this.contextManager = contextManager;
  }

  async executeQuery(args) {
    try {
      const { query, purpose } = args;
      
      if (!query || typeof query !== 'string') {
        throw new Error('Query parameter is required and must be a string');
      }

      // Execute the query through the database manager (validation is handled there)
      const result = await this.databaseManager.executeQuery(query);
      
      // Track query in context manager if available
      if (this.contextManager) {
        try {
          // Extract row count from result if available
          let rowsReturned = null;
          if (result && result.content && result.content[0]) {
            // Extract row count from result text (format: "Query executed successfully. Rows returned: X")
            const resultText = result.content[0].text || '';
            const rowMatch = resultText.match(/Rows returned:\s*(\d+)/i);
            if (rowMatch) {
              rowsReturned = parseInt(rowMatch[1]);
            } else {
              // Try alternative patterns
              const altMatch = resultText.match(/(\d+)\s+row/i);
              if (altMatch) {
                rowsReturned = parseInt(altMatch[1]);
              }
            }
          }
          
          this.contextManager.trackQuery(query, rowsReturned, purpose || 'Query execution');
        } catch (trackError) {
          // Don't fail query execution if tracking fails
          console.error('Failed to track query:', trackError.message);
        }
      }
      
      return result;
    } catch (error) {
      throw new Error(`Query execution failed: ${error.message}`);
    }
  }

  validateReadOnlyQuery(query) {
    const normalizedQuery = query.trim().toLowerCase();
    
    // Check for forbidden keywords that modify data
    const forbiddenKeywords = [
      'insert', 'update', 'delete', 'drop', 'create', 'alter', 'truncate',
      'grant', 'revoke', 'commit', 'rollback', 'savepoint', 'release'
    ];
    
    for (const keyword of forbiddenKeywords) {
      if (normalizedQuery.includes(keyword)) {
        return {
          isValid: false,
          error: `Query contains forbidden keyword: ${keyword}. Only read-only queries are allowed.`
        };
      }
    }

    // Check for multiple statements (prevent injection)
    if (normalizedQuery.includes(';') && normalizedQuery.split(';').filter(stmt => stmt.trim()).length > 1) {
      return {
        isValid: false,
        error: 'Multiple SQL statements are not allowed. Please execute one query at a time.'
      };
    }

    // Ensure query starts with SELECT
    if (!normalizedQuery.startsWith('select')) {
      return {
        isValid: false,
        error: 'Only SELECT queries are allowed for read-only operations.'
      };
    }

    return { isValid: true };
  }

  async getQueryPlan(query) {
    try {
      const client = await this.databaseManager.getClient();
      
      // Get query execution plan
      const planQuery = `EXPLAIN (FORMAT JSON) ${query}`;
      const result = await client.query(planQuery);
      
      return {
        content: [
          {
            type: 'text',
            text: `Query Execution Plan:\n\n${JSON.stringify(result.rows[0]['QUERY PLAN'], null, 2)}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to get query plan: ${error.message}`);
    }
  }

  async getTableSample(tableName, limit = 10) {
    try {
      const client = await this.databaseManager.getClient();
      
      // Validate table name to prevent injection
      if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(tableName)) {
        throw new Error('Invalid table name format');
      }

      const query = `SELECT * FROM "${tableName}" LIMIT $1`;
      const result = await client.query(query, [limit]);
      
      return {
        content: [
          {
            type: 'text',
            text: `Sample data from table "${tableName}" (${result.rows.length} rows):\n\n${JSON.stringify(result.rows, null, 2)}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to get table sample: ${error.message}`);
    }
  }

  async getTableStats(tableName) {
    try {
      const client = await this.databaseManager.getClient();
      
      // Validate table name
      if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(tableName)) {
        throw new Error('Invalid table name format');
      }

      const queries = [
        `SELECT COUNT(*) as total_rows FROM "${tableName}"`,
        `SELECT COUNT(*) as null_count FROM "${tableName}" WHERE "ID" IS NULL`,
        `SELECT MIN("ID") as min_id, MAX("ID") as max_id FROM "${tableName}"`,
      ];

      const results = await Promise.all(
        queries.map(query => client.query(query))
      );

      const stats = {
        totalRows: parseInt(results[0].rows[0].total_rows),
        nullCount: parseInt(results[1].rows[0].null_count),
        idRange: {
          min: results[2].rows[0].min_id,
          max: results[2].rows[0].max_id,
        },
      };

      return {
        content: [
          {
            type: 'text',
            text: `Table Statistics for "${tableName}":\n\n${JSON.stringify(stats, null, 2)}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to get table stats: ${error.message}`);
    }
  }
} 