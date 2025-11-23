/**
 * Database Service - Neon PostgreSQL
 * 
 * Professional database connection with connection pooling,
 * error handling, and query optimization
 */

import { neon, neonConfig } from '@neondatabase/serverless';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Configure Neon for optimal performance
neonConfig.fetchConnectionCache = true;

// Neon serverless SQL for queries
let sql;

// Traditional Pool for connection pooling (optional, for complex queries)
let pool;

/**
 * Initialize database connection
 */
export function initializeDatabase() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.warn('⚠️  DATABASE_URL not configured. Using in-memory store.');
    return false;
  }

  try {
    // Neon serverless driver (recommended for serverless environments)
    sql = neon(connectionString);

    // Traditional pool (for connection pooling)
    pool = new Pool({
      connectionString,
      max: 10, // Maximum number of clients
    });

    console.log('✅ Database connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

/**
 * Execute a query using Neon serverless
 */
export async function query(text, params = []) {
  if (!sql) {
    throw new Error('Database not initialized');
  }

  try {
    const result = await sql(text, params);
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

/**
 * Execute a query using connection pool
 */
export async function poolQuery(text, params = []) {
  if (!pool) {
    throw new Error('Database pool not initialized');
  }

  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } catch (error) {
    console.error('Database pool query error:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Transaction helper
 */
export async function transaction(callback) {
  if (!pool) {
    throw new Error('Database pool not initialized');
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Transaction error:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Initialize database schema
 */
export async function initializeSchema() {
  const fs = await import('fs');
  const path = await import('path');
  const { fileURLToPath } = await import('url');
  
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  
  try {
    console.log('🔄 Initializing database schema...');
    
    // Use __dirname to get the correct path relative to this file
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Advanced SQL statement parser that handles dollar-quoted strings and functions
    function parseSQL(sql) {
      const statements = [];
      let current = '';
      let inDollarQuote = false;
      let dollarTag = '';
      let inSingleQuote = false;
      let inDoubleQuote = false;
      let inComment = false;
      
      for (let i = 0; i < sql.length; i++) {
        const char = sql[i];
        const nextChar = sql[i + 1];
        const prevChar = sql[i - 1];
        
        // Handle line comments
        if (char === '-' && nextChar === '-' && !inDollarQuote && !inSingleQuote && !inDoubleQuote) {
          inComment = true;
          // Skip the comment line entirely, don't add to current statement
          while (i < sql.length && sql[i] !== '\n') {
            i++;
          }
          if (i < sql.length && sql[i] === '\n') {
            current += '\n'; // Keep the newline for formatting
            inComment = false;
          }
          continue;
        }
        
        if (inComment) {
          continue; // Skip comment characters entirely
        }
        
        // Handle dollar-quoted strings ($$, $tag$, etc.)
        if (char === '$' && !inSingleQuote && !inDoubleQuote) {
          if (!inDollarQuote) {
            // Starting dollar quote - find the tag
            let tagEnd = i + 1;
            while (tagEnd < sql.length && sql[tagEnd] !== '$') {
              tagEnd++;
            }
            if (tagEnd < sql.length) {
              dollarTag = sql.substring(i, tagEnd + 1);
              inDollarQuote = true;
              current += char;
              continue;
            }
          } else {
            // Check if this ends the current dollar quote
            const possibleEndTag = sql.substring(i, i + dollarTag.length);
            if (possibleEndTag === dollarTag) {
              inDollarQuote = false;
              current += dollarTag;
              i += dollarTag.length - 1;
              continue;
            }
          }
        }
        
        // Handle regular quotes
        if (!inDollarQuote) {
          if (char === "'" && prevChar !== '\\') {
            inSingleQuote = !inSingleQuote;
          } else if (char === '"' && prevChar !== '\\') {
            inDoubleQuote = !inDoubleQuote;
          }
        }
        
        // Handle statement termination
        if (char === ';' && !inDollarQuote && !inSingleQuote && !inDoubleQuote) {
          current += char;
          const statement = current.trim();
          if (statement && !statement.startsWith('--')) {
            statements.push(statement);
          }
          current = '';
          continue;
        }
        
        current += char;
      }
      
      // Add any remaining content as the last statement
      const lastStatement = current.trim();
      if (lastStatement && !lastStatement.startsWith('--')) {
        statements.push(lastStatement);
      }
      
      return statements;
    }
    
    // Debug: Log the first 1000 characters of the schema to see what we're parsing
    console.log('📄 Schema file content (first 1000 chars):');
    console.log(schema.substring(0, 1000));
    console.log('📄 Schema file content (last 500 chars):');
    console.log(schema.substring(schema.length - 500));
    
    const statements = parseSQL(schema);
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    // Debug: Log the first few characters of each statement to identify them
    statements.forEach((stmt, index) => {
      const preview = stmt.substring(0, 100).replace(/\s+/g, ' ').trim();
      console.log(`Statement ${index + 1}: ${preview}...`);
    });
    
    let successCount = 0;
    let errorCount = 0;
    
    // Execute each statement individually
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (!statement || statement.length === 0) continue;
      
      try {
        await poolQuery(statement);
        successCount++;
        console.log(`✅ Statement ${i + 1} executed successfully`);
      } catch (error) {
        errorCount++;
        
        // Check if it's an "already exists" error that we can safely ignore
        const errorMessage = error.message.toLowerCase();
        const isIgnorableError = 
          errorMessage.includes('already exists') ||
          errorMessage.includes('duplicate key') ||
          errorMessage.includes('relation') && errorMessage.includes('already exists') ||
          errorMessage.includes('trigger') && errorMessage.includes('already exists') ||
          errorMessage.includes('function') && errorMessage.includes('already exists');
        
        if (isIgnorableError) {
          console.log(`⚠️  Skipping existing database object: ${error.message}`);
        } else {
          console.error(`❌ Error executing statement: ${error.message}`);
          console.error(`Statement content: ${statement.substring(0, 200)}...`);
          // Don't throw here - continue with other statements
        }
      }
    }
    
    console.log(`✅ Schema initialization completed: ${successCount} successful, ${errorCount} errors`);
    return true;
  } catch (error) {
    console.error('❌ Schema initialization failed:', error.message);
    return false;
  }
}

/**
 * Check database connection
 */
export async function checkConnection() {
  try {
    const result = await query('SELECT NOW()');
    return { connected: true, timestamp: result[0].now };
  } catch (error) {
    return { connected: false, error: error.message };
  }
}

/**
 * Close database connections
 */
export async function closeDatabase() {
  if (pool) {
    await pool.end();
    console.log('Database connections closed');
  }
}

export default {
  initializeDatabase,
  query,
  poolQuery,
  transaction,
  initializeSchema,
  checkConnection,
  closeDatabase
};

