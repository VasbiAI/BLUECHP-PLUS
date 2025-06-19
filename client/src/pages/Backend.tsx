export default function Backend() {
  return (
    <>
      <h2 className="text-2xl font-semibold mb-4">Backend</h2>
      <p className="text-gray-700 mb-6">
        The backend uses Express.js with TypeScript for robust API development with type safety.
      </p>
      
      <section id="express-setup" className="mb-12">
        <h3 className="text-xl font-semibold mb-4">Express Setup</h3>
        <p className="text-gray-700 mb-6">
          Our Express.js setup provides a solid foundation for building RESTful APIs with TypeScript support.
        </p>
        
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
          <h4 className="text-lg font-medium mb-4">Server Entry Point</h4>
          <div className="bg-[#1e293b] text-[#e2e8f0] rounded-lg p-4 overflow-x-auto font-mono text-sm">
            <pre>
{`// server/index.ts
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = \`\${req.method} \${path} \${res.statusCode} in \${duration}ms\`;
      if (capturedJsonResponse) {
        logLine += \` :: \${JSON.stringify(capturedJsonResponse)}\`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  // error handling middleware
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // vite setup for development
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // server on port 5000
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(\`serving on port \${port}\`);
  });
})();`}
            </pre>
          </div>
        </div>
      </section>
      
      <section id="api-endpoints" className="mb-12">
        <h3 className="text-xl font-semibold mb-4">API Endpoints</h3>
        <p className="text-gray-700 mb-6">
          The backend implements a structured API with routes organized by feature and type-safe request/response handling.
        </p>
        
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
          <h4 className="text-lg font-medium mb-4">API Routes Setup</h4>
          <div className="bg-[#1e293b] text-[#e2e8f0] rounded-lg p-4 overflow-x-auto font-mono text-sm">
            <pre>
{`// server/routes.ts
import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes with /api prefix
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok' });
  });

  // Users routes
  app.get('/api/users', async (req: Request, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch users' });
    }
  });

  app.get('/api/users/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUser(id);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch user' });
    }
  });

  app.post('/api/users', async (req: Request, res: Response) => {
    try {
      const result = insertUserSchema.safeParse(req.body);
      
      if (!result.success) {
        const errorMessage = fromZodError(result.error).message;
        return res.status(400).json({ message: errorMessage });
      }
      
      const newUser = await storage.createUser(result.data);
      res.status(201).json(newUser);
    } catch (error) {
      res.status(500).json({ message: 'Failed to create user' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}`}
            </pre>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h4 className="text-lg font-medium mb-4">Storage Interface</h4>
          <div className="bg-[#1e293b] text-[#e2e8f0] rounded-lg p-4 overflow-x-auto font-mono text-sm">
            <pre>
{`// server/storage.ts
import { users, type User, type InsertUser } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private currentId: number;

  constructor() {
    this.users = new Map();
    this.currentId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }
}

// Use MemStorage for development, DatabaseStorage for production
// export const storage = new DatabaseStorage();
export const storage = new MemStorage();`}
            </pre>
          </div>
        </div>
      </section>
    </>
  );
}
