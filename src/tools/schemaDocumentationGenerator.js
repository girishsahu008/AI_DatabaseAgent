import { writeFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

export class SchemaDocumentationGenerator {
  constructor(schemaExplorer) {
    this.schemaExplorer = schemaExplorer;
  }

  // Generate comprehensive schema documentation
  async generateSchemaDocumentation() {
    try {
      // Get schema info (will use cache if available)
      const schemaResponse = await this.schemaExplorer.getSchemaInfo();
      const schemaText = schemaResponse.content[0].text;
      
      // Extract schema data from the response
      const schemaMatch = schemaText.match(/JSON\.stringify\(([\s\S]*)\)/);
      if (!schemaMatch) {
        throw new Error('Could not parse schema response');
      }
      
      const schema = JSON.parse(schemaMatch[1]);
      
      // Generate markdown documentation
      const markdown = this.generateMarkdown(schema);
      
      // Save to file using absolute path
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = dirname(__filename);
      const outputFile = join(__dirname, '../../schema_explained.md');
      writeFileSync(outputFile, markdown, 'utf8');
      
      return {
        content: [
          {
            type: 'text',
            text: `✅ Schema documentation generated successfully!\n\nFile: ${outputFile}\nTotal Tables: ${schema.totalTables}\nSuccessful: ${schema.successfulTables}\nFailed: ${schema.failedTables}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to generate schema documentation: ${error.message}`);
    }
  }

  // Generate markdown from schema data
  generateMarkdown(schema) {
    let markdown = `# Textile ERP System Database Schema Documentation

Generated on: ${new Date().toLocaleString()}
Total Tables: ${schema.totalTables}
Successfully Analyzed: ${schema.successfulTables}
Failed to Analyze: ${schema.failedTables}

## Table of Contents

`;

    // Generate table of contents
    schema.tables.forEach((table, index) => {
      markdown += `${index + 1}. [${table.name}](#${table.name.toLowerCase().replace(/[^a-z0-9]/g, '-')})\n`;
    });

    markdown += `\n---\n\n`;

    // Generate detailed table documentation
    schema.tables.forEach((table, index) => {
      markdown += this.generateTableDocumentation(table, index + 1);
    });

    // Add error summary if any tables failed
    if (schema.errors && schema.errors.length > 0) {
      markdown += `\n## Tables with Analysis Errors

The following tables could not be fully analyzed:

`;
      schema.errors.forEach(error => {
        markdown += `- **${error.table}**: ${error.error}\n`;
      });
    }

    return markdown;
  }

  // Generate documentation for a single table
  generateTableDocumentation(table, tableNumber) {
    let markdown = `## ${tableNumber}. ${table.name}

`;

    // Add error notice if table has issues
    if (table.error) {
      markdown += `⚠️ **Note**: This table could not be fully analyzed due to: ${table.error}\n\n`;
    }

    // Basic table info
    markdown += `**Description**: ${table.description}\n`;
    if (table.rowCount !== null) {
      markdown += `**Row Count**: ${table.rowCount.toLocaleString()}\n`;
    }
    markdown += `**Column Count**: ${table.columns.length}\n\n`;

    // Columns section
    if (table.columns && table.columns.length > 0) {
      markdown += `### Columns\n\n`;
      markdown += `| Column Name | Data Type | Nullable | Default | Description |\n`;
      markdown += `|-------------|-----------|----------|---------|-------------|\n`;
      
      table.columns.forEach(column => {
        const nullable = column.nullable ? 'Yes' : 'No';
        const defaultValue = column.defaultValue || 'None';
        const description = column.description || 'No description';
        markdown += `| ${column.name} | ${column.type} | ${nullable} | ${defaultValue} | ${description} |\n`;
      });
      markdown += `\n`;
    }

    // Primary keys
    if (table.primaryKeys && table.primaryKeys.length > 0) {
      markdown += `### Primary Keys\n\n`;
      table.primaryKeys.forEach(pk => {
        markdown += `- ${pk}\n`;
      });
      markdown += `\n`;
    }

    // Foreign keys
    if (table.foreignKeys && table.foreignKeys.length > 0) {
      markdown += `### Foreign Key Relationships\n\n`;
      markdown += `| Column | References Table | References Column |\n`;
      markdown += `|--------|------------------|-------------------|\n`;
      
      table.foreignKeys.forEach(fk => {
        markdown += `| ${fk.column} | ${fk.referencesTable} | ${fk.referencesColumn} |\n`;
      });
      markdown += `\n`;
    }

    // Indexes
    if (table.indexes && table.indexes.length > 0) {
      markdown += `### Indexes\n\n`;
      markdown += `| Index Name | Column | Type |\n`;
      markdown += `|-------------|--------|------|\n`;
      
      table.indexes.forEach(idx => {
        let type = 'Regular';
        if (idx.isPrimary) type = 'Primary Key';
        else if (idx.isUnique) type = 'Unique';
        
        markdown += `| ${idx.name} | ${idx.column} | ${type} |\n`;
      });
      markdown += `\n`;
    }

    markdown += `---\n\n`;
    return markdown;
  }

  // Export schema to JSON file
  async exportSchemaToJSON() {
    try {
      const schemaResponse = await this.schemaExplorer.getSchemaInfo();
      const schemaText = schemaResponse.content[0].text;
      
      const schemaMatch = schemaText.match(/JSON\.stringify\(([\s\S]*)\)/);
      if (!schemaMatch) {
        throw new Error('Could not parse schema response');
      }
      
      const schema = JSON.parse(schemaMatch[1]);
      
      // Save to JSON file using absolute path
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = dirname(__filename);
      const outputFile = join(__dirname, '../../schema_export.json');
      writeFileSync(outputFile, JSON.stringify(schema, null, 2), 'utf8');
      
      return {
        content: [
          {
            type: 'text',
            text: `✅ Schema exported to JSON successfully!\n\nFile: ${outputFile}\nTotal Tables: ${schema.totalTables}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to export schema to JSON: ${error.message}`);
    }
  }
}
