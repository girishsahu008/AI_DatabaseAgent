// Example: How to use the PostgreSQL MCP Server from a client

// This is a conceptual example showing how the MCP server would be used
// In practice, you would use an MCP client library to connect to the server

const exampleUsage = {
  // 1. Test the database connection
  testConnection: {
    tool: 'test_connection',
    description: 'Verify database connectivity and get PostgreSQL version'
  },

  // 2. List all tables in the database
  listTables: {
    tool: 'list_tables',
    description: 'Get all tables with descriptions and column counts'
  },

  // 3. Get detailed information about a specific table
  describeTable: {
    tool: 'describe_table',
    arguments: {
      tableName: 'Customers'  // Example table name
    },
    description: 'Get comprehensive table information including columns, keys, and relationships'
  },

  // 4. Get foreign key relationships for a table
  getRelationships: {
    tool: 'get_table_relationships',
    arguments: {
      tableName: 'Orders'  // Example table name
    },
    description: 'Find all foreign key relationships for a specific table'
  },

  // 5. Execute a read-only query
  executeQuery: {
    tool: 'execute_query',
    arguments: {
      query: 'SELECT COUNT(*) as total_customers FROM "Customers"'
    },
    description: 'Execute a safe SELECT query with validation'
  },

  // 6. Get comprehensive schema information
  getSchemaInfo: {
    tool: 'get_schema_info',
    description: 'Get complete database schema with all tables and relationships'
  }
};

// Example workflow for exploring a textile ERP database
const textileERPWorkflow = [
  {
    step: 1,
    action: 'test_connection',
    purpose: 'Verify we can connect to the database'
  },
  {
    step: 2,
    action: 'list_tables',
    purpose: 'See what tables are available in the ERP system'
  },
  {
    step: 3,
    action: 'describe_table',
    tableName: 'Products',
    purpose: 'Understand the product catalog structure'
  },
  {
    step: 4,
    action: 'describe_table',
    tableName: 'Customers',
    purpose: 'Understand customer data structure'
  },
  {
    step: 5,
    action: 'describe_table',
    tableName: 'Orders',
    purpose: 'Understand order processing structure'
  },
  {
    step: 6,
    action: 'get_table_relationships',
    tableName: 'Orders',
    purpose: 'See how orders relate to customers and products'
  },
  {
    step: 7,
    action: 'execute_query',
    query: `
      SELECT 
        c."CustomerName",
        COUNT(o."OrderID") as total_orders,
        SUM(o."TotalAmount") as total_spent
      FROM "Customers" c
      LEFT JOIN "Orders" o ON c."CustomerID" = o."CustomerID"
      GROUP BY c."CustomerID", c."CustomerName"
      ORDER BY total_spent DESC
      LIMIT 10
    `,
    purpose: 'Get top customers by spending'
  }
];

// Example queries for textile ERP analysis
const exampleQueries = {
  // Sales Analysis
  topSellingProducts: `
    SELECT 
      p."ProductName",
      p."Category",
      COUNT(oi."OrderItemID") as times_ordered,
      SUM(oi."Quantity") as total_quantity_sold
    FROM "Products" p
    LEFT JOIN "OrderItems" oi ON p."ProductID" = oi."ProductID"
    GROUP BY p."ProductID", p."ProductName", p."Category"
    ORDER BY total_quantity_sold DESC
    LIMIT 20
  `,

  // Customer Analysis
  customerSegments: `
    SELECT 
      CASE 
        WHEN total_spent >= 10000 THEN 'Premium'
        WHEN total_spent >= 5000 THEN 'Regular'
        ELSE 'Occasional'
      END as customer_segment,
      COUNT(*) as customer_count,
      AVG(total_spent) as avg_spending
    FROM (
      SELECT 
        c."CustomerID",
        SUM(o."TotalAmount") as total_spent
      FROM "Customers" c
      LEFT JOIN "Orders" o ON c."CustomerID" = o."CustomerID"
      GROUP BY c."CustomerID"
    ) customer_totals
    GROUP BY customer_segment
    ORDER BY avg_spending DESC
  `,

  // Inventory Analysis
  lowStockProducts: `
    SELECT 
      p."ProductName",
      p."CurrentStock",
      p."ReorderLevel",
      (p."ReorderLevel" - p."CurrentStock") as stock_needed
    FROM "Products" p
    WHERE p."CurrentStock" <= p."ReorderLevel"
    ORDER BY stock_needed DESC
  `,

  // Sales Trends
  monthlySales: `
    SELECT 
      DATE_TRUNC('month', o."OrderDate") as month,
      COUNT(o."OrderID") as total_orders,
      SUM(o."TotalAmount") as total_revenue,
      AVG(o."TotalAmount") as avg_order_value
    FROM "Orders" o
    WHERE o."OrderDate" >= CURRENT_DATE - INTERVAL '12 months'
    GROUP BY DATE_TRUNC('month', o."OrderDate")
    ORDER BY month DESC
  `
};

console.log('PostgreSQL MCP Server Usage Examples');
console.log('=====================================\n');

console.log('Available Tools:');
Object.entries(exampleUsage).forEach(([key, value]) => {
  console.log(`- ${key}: ${value.description}`);
});

console.log('\nExample Workflow for Textile ERP:');
textileERPWorkflow.forEach(step => {
  console.log(`${step.step}. ${step.action}: ${step.purpose}`);
});

console.log('\nExample Queries for Analysis:');
Object.keys(exampleQueries).forEach(queryName => {
  console.log(`- ${queryName}: ${queryName.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
});

module.exports = {
  exampleUsage,
  textileERPWorkflow,
  exampleQueries
}; 