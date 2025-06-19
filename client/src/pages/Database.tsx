export default function Database() {
  return (
    <>
      <h2 className="text-2xl font-semibold mb-4">Database</h2>
      <p className="text-gray-700 mb-6">
        The project uses PostgreSQL with type-safe database interactions through Drizzle ORM.
      </p>
      
      <section id="postgresql" className="mb-12">
        <h3 className="text-xl font-semibold mb-4">PostgreSQL Setup</h3>
        <p className="text-gray-700 mb-6">
          PostgreSQL is a powerful, open-source relational database system that provides robust data storage for our application.
        </p>
        
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
          <h4 className="text-lg font-medium mb-4">Database Connection</h4>
          <div className="bg-[#1e293b] text-[#e2e8f0] rounded-lg p-4 overflow-x-auto font-mono text-sm">
            <pre>
{`// server/db.ts
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

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });`}
            </pre>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h4 className="text-lg font-medium mb-4">Environment Setup</h4>
          <div className="bg-[#1e293b] text-[#e2e8f0] rounded-lg p-4 overflow-x-auto font-mono text-sm">
            <pre>
{`# Required PostgreSQL Environment Variables
DATABASE_URL=postgresql://username:password@hostname:port/database

# Alternative separate configuration
PGDATABASE=database_name
PGHOST=hostname
PGPASSWORD=password
PGPORT=5432
PGUSER=username`}
            </pre>
          </div>
        </div>
      </section>
      
      <section id="drizzle-orm" className="mb-12">
        <h3 className="text-xl font-semibold mb-4">Drizzle ORM Integration</h3>
        <p className="text-gray-700 mb-6">
          Drizzle ORM provides type-safe database interactions with a simple, flexible API for working with PostgreSQL.
        </p>
        
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
          <h4 className="text-lg font-medium mb-4">Schema Definition</h4>
          <div className="bg-[#1e293b] text-[#e2e8f0] rounded-lg p-4 overflow-x-auto font-mono text-sm">
            <pre>
{`// shared/schema.ts
import { pgTable, text, serial, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;`}
            </pre>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h4 className="text-lg font-medium mb-4">Usage Example</h4>
          <div className="bg-[#1e293b] text-[#e2e8f0] rounded-lg p-4 overflow-x-auto font-mono text-sm">
            <pre>
{`// Example of Drizzle ORM usage
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

// Select all users
const allUsers = await db.select().from(users);

// Select a specific user
const [user] = await db
  .select()
  .from(users)
  .where(eq(users.username, "johndoe"));

// Insert a new user
const [newUser] = await db
  .insert(users)
  .values({
    username: "janedoe",
    password: "hashedpassword",
  })
  .returning();

// Update a user
const [updatedUser] = await db
  .update(users)
  .set({ password: "newhashedpassword" })
  .where(eq(users.id, 1))
  .returning();

// Delete a user
await db
  .delete(users)
  .where(eq(users.id, 1));`}
            </pre>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h4 className="text-lg font-medium mb-4">Migration Management</h4>
          <p className="text-gray-700 mb-4">
            Drizzle provides a simple way to manage database migrations. Use the following command to push schema changes to the database:
          </p>
          <div className="bg-gray-100 p-3 rounded-md font-mono text-sm">
            npm run db:push
          </div>
        </div>
      </section>
      
      <div className="p-6 bg-gray-100 rounded-lg border border-gray-200 mt-8">
        <h3 className="text-lg font-semibold mb-2">Database Best Practices</h3>
        <ul className="list-disc pl-6 space-y-2 text-gray-700">
          <li>Always use the Drizzle ORM for database operations to ensure type safety</li>
          <li>Define your schema once in <code>shared/schema.ts</code> to maintain consistency between frontend and backend</li>
          <li>Use the schema's type definitions for both database operations and API request/response types</li>
          <li>Apply proper validation using Zod schemas before inserting or updating data</li>
          <li>For complex queries, consider using raw SQL with proper parameterization to prevent SQL injection</li>
        </ul>
      </div>
    </>
  );
}
