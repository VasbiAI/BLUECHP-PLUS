import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { storage } from "./storage";
import { pool } from "./db";
import path from "path";
import { promises as fs } from 'fs';
import { importRiskData } from './import-risk-data';
import { migrateRiskData, fixProjectIdIssue } from './migrate-risk-data';

// Memory session store is initialized below

// Initialize Express application
const app = express();

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve static files from the uploads directory for document storage
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Setup session store
// Using memory store for development to avoid database connection issues
// In production, this should use a proper session store

import MemoryStore from 'memorystore';
const MemoryStoreSession = MemoryStore(session);

app.use(
  session({
    store: new MemoryStoreSession({
      checkPeriod: 86400000 // prune expired entries every 24h
    }),
    secret: process.env.SESSION_SECRET || "bluechp-intelligence-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax"
    }
  })
);

// Setup Passport authentication
passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const user = await storage.getUserByUsername(username);

      if (!user) {
        return done(null, false, { message: "Incorrect username." });
      }

      // In a real app, you would use bcrypt to compare passwords
      // This is just for demo purposes
      if (user.password !== password) {
        return done(null, false, { message: "Incorrect password." });
      }

      // Check if user is approved (for admin approval flow)
      if (!user.isApproved) {
        return done(null, false, { message: "Account pending approval." });
      }

      return done(null, user);
    } catch (err) {
      return done(err);
    }
  })
);

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: number, done) => {
  try {
    const user = await storage.getUser(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

app.use(passport.initialize());
app.use(passport.session());

// Request logging middleware
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
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Authentication route middleware
const ensureAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    return next();
  }

  // If it's an API call, return 401
  if (req.path.startsWith('/api/')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // Otherwise redirect to login
  res.redirect('/auth');
};

// Admin access middleware
const ensureAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated() && req.user && (req.user as any).accessRights === 'admin') {
    return next();
  }

  if (req.path.startsWith('/api/')) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  res.status(403).send('Access Denied: Admin rights required');
};

// Start the application
(async () => {
  // Register authentication routes
  app.post('/api/auth/login', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        return res.status(401).json({ error: info.message });
      }
      req.logIn(user, (err) => {
        if (err) {
          return next(err);
        }
        return res.json({ success: true, user });
      });
    })(req, res, next);
  });

  app.post('/api/auth/logout', (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ error: 'Logout failed' });
      }
      res.json({ success: true });
    });
  });

  app.get('/api/auth/status', (req, res) => {
    if (req.isAuthenticated()) {
      res.json({ 
        authenticated: true, 
        user: req.user 
      });
    } else {
      res.json({ authenticated: false });
    }
  });

  // Register API routes
  const server = await registerRoutes(app);

    // Run database migrations
  async function runMigrations() {
    try {
      console.log('Running database migrations...');

      // Read migration files
      const migrationFiles = [
        'migrations/002_risk_track_pro.sql',
        'migrations/003_add_risk_track_pro_tables.sql'
      ];

      for (const file of migrationFiles) {
        try {
          // Use process.cwd() instead of __dirname in ES modules
          const sql = await fs.readFile(path.join(process.cwd(), file), 'utf8');
          await pool.query(sql);
          console.log(`Executed migration: ${file}`);
        } catch (error) {
          console.error(`Error executing migration ${file}:`, error);
        }
      }

      // Import sample data
      await importRiskData();

      console.log('Database migrations completed');
    } catch (error) {
      console.error('Error running migrations:', error);
    }
  }

  // Run migrations on startup
  await runMigrations();
  
  // Fix the projectId column issue and migrate data from old database
  try {
    if (process.env.OLDRISK_DATABASE_URL) {
      console.log('Starting database fixes and migration from old risk database...');
      await fixProjectIdIssue();
      await migrateRiskData();
      console.log('Database migration from old risk database completed successfully!');
    } else {
      console.log('OLDRISK_DATABASE_URL not found, skipping old database migration');
    }
  } catch (error) {
    console.error('Error during database migration:', error);
  }

  // Error handling middleware
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    log(`Error: ${message}`);
    if (err.stack) {
      log(err.stack);
    }

    res.status(status).json({ error: message });
  });

  // Setup for development or production
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Server startup
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    const address = server.address();
    const actualPort = typeof address === 'object' && address ? address.port : port;

    log(`BlueCHP Intelligence application server started`);
    log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    log(`Serving on port ${actualPort}`);
    log(`http://localhost:${actualPort}`);
  });
})();