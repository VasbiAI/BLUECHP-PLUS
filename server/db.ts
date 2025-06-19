import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";
import * as uniphiSchema from "@shared/uniphiSchema";
import * as riskTrackProSchema from "@shared/riskTrackProSchema";
import * as documentComparisonSchema from "@shared/documentComparisonSchema";

// Check for required environment variables
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Create database connection pool with proper error handling
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 20, // Maximum number of clients the pool should contain
  idleTimeoutMillis: 30000, // How long a client is allowed to remain idle before being closed
  connectionTimeoutMillis: 5000, // How long to wait for a connection
  ssl: process.env.NODE_ENV === 'production' ? true : false
});

// Set up pool error handler
pool.on('error', (err) => {
  console.error('Unexpected error on database connection', err);
  // Don't exit the process immediately - allow for recovery
  // process.exit(-1);
});

// Create Drizzle ORM instance with all schema modules
export const db = drizzle(pool, { 
  schema: {
    ...schema,
    ...uniphiSchema,
    ...riskTrackProSchema,
    ...documentComparisonSchema
  }
});
