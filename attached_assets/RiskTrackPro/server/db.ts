import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Configure pool with strict connection limits to prevent rate limiting issues
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 3, // Further limit maximum connections to avoid rate limits
  idleTimeoutMillis: 10000, // Close idle connections faster (10 seconds)
  connectionTimeoutMillis: 3000, // Reduce connection timeout to fail faster
  allowExitOnIdle: true // Allow process to exit if there are no connections
});

// Export db instance with Drizzle ORM
export const db = drizzle({ client: pool, schema });

// Create a reusable utility for DB operations with retry logic
export async function executeWithRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 5, // Increase max retries
  initialDelay = 500 // Increase initial delay
): Promise<T> {
  let retries = 0;
  let lastError: any = null;

  while (true) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      retries++;

      // Log the specific error for better diagnostics
      console.error(`Database operation error (attempt ${retries}/${maxRetries}):`, {
        message: error.message,
        code: error.code,
        stack: error.stack?.split('\n')[0]
      });

      // Check if we've hit max retries or if it's not a retryable error
      const isRetryableError = 
        error.message?.includes('rate limit') ||
        error.message?.includes('Control plane request') ||
        error.message?.includes('connection') ||
        error.message?.includes('timeout') ||
        error.code === 'XX000' ||
        error.code === '08000' ||  // connection_exception
        error.code === '08003' ||  // connection_does_not_exist
        error.code === '08006' ||  // connection_failure
        error.code === '57P01';    // admin_shutdown

      if (retries >= maxRetries || !isRetryableError) {
        // Enhanced error reporting before giving up
        console.error(`Database operation failed after ${retries} attempts`, {
          finalError: error.message,
          code: error.code
        });
        throw error; // Re-throw if max retries or not a retryable error
      }

      // Calculate exponential backoff delay with some jitter to prevent thundering herd
      const baseDelay = initialDelay * Math.pow(2, retries - 1);
      const jitter = Math.random() * 200; // Add up to 200ms of random jitter
      const delay = baseDelay + jitter;

      console.log(`DB operation failed (retry ${retries}/${maxRetries}), retrying in ${Math.round(delay)}ms...`);

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}