import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertRiskSchema, insertProjectSchema, insertCriticalDateSchema, insertIssueSchema } from "@shared/schema";
import { z } from "zod";
import { registerProjectTaskRoutes } from "./projectTaskRoutes";
import { registerExternalAccessRoutes } from "./externalAccessRoutes";
import { registerDocumentRoutes } from "./documentRoutes";
import OpenAI from 'openai';
import { runAITest } from './services/aiTestScript';

export async function registerRoutes(app: Express): Promise<Server> {
  // prefix all routes with /api
  
  // Register external access routes
  registerExternalAccessRoutes(app);
  
  // Register document routes
  registerDocumentRoutes(app);
  
  // Register project task routes
  registerProjectTaskRoutes(app);
  
  // Project routes
  app.get("/api/projects", async (req: Request, res: Response) => {
    try {
      const projects = await storage.getProjects();
      res.json(projects);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });
  
  app.get("/api/projects/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }
      
      const project = await storage.getProject(id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      res.json(project);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch project" });
    }
  });
  
  app.post("/api/projects", async (req: Request, res: Response) => {
    try {
      const validatedData = insertProjectSchema.parse(req.body);
      const project = await storage.createProject(validatedData);
      res.status(201).json(project);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid project data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create project" });
    }
  });
  
  app.patch("/api/projects/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }
      
      const validatedData = insertProjectSchema.partial().parse(req.body);
      const updatedProject = await storage.updateProject(id, validatedData);
      
      if (!updatedProject) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      res.json(updatedProject);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid project data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update project" });
    }
  });
  
  app.delete("/api/projects/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }
      
      const deleted = await storage.deleteProject(id);
      if (!deleted) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete project" });
    }
  });
  
  // Risk routes
  app.get("/api/risks", async (req: Request, res: Response) => {
    try {
      let projectId: number | undefined = undefined;
      
      if (req.query.projectId) {
        projectId = parseInt(req.query.projectId as string, 10);
        if (isNaN(projectId)) {
          return res.status(400).json({ message: "Invalid project ID" });
        }
      }
      
      const risks = await storage.getRisks(projectId);
      res.json(risks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch risks" });
    }
  });
  
  app.get("/api/risks/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid risk ID" });
      }
      
      const risk = await storage.getRisk(id);
      if (!risk) {
        return res.status(404).json({ message: "Risk not found" });
      }
      
      res.json(risk);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch risk" });
    }
  });
  
  app.post("/api/risks", async (req: Request, res: Response) => {
    try {
      const validatedData = insertRiskSchema.parse(req.body);
      
      // Make sure the project exists
      const project = await storage.getProject(validatedData.projectId);
      if (!project) {
        return res.status(400).json({ message: "Invalid project ID" });
      }
      
      const risk = await storage.createRisk(validatedData);
      res.status(201).json(risk);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid risk data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create risk" });
    }
  });
  
  app.patch("/api/risks/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid risk ID" });
      }
      
      const validatedData = insertRiskSchema.partial().parse(req.body);
      
      // If projectId is provided, make sure the project exists
      if (validatedData.projectId) {
        const project = await storage.getProject(validatedData.projectId);
        if (!project) {
          return res.status(400).json({ message: "Invalid project ID" });
        }
      }
      
      const updatedRisk = await storage.updateRisk(id, validatedData);
      
      if (!updatedRisk) {
        return res.status(404).json({ message: "Risk not found" });
      }
      
      res.json(updatedRisk);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid risk data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update risk" });
    }
  });
  
  app.delete("/api/risks/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid risk ID" });
      }
      
      const deleted = await storage.deleteRisk(id);
      if (!deleted) {
        return res.status(404).json({ message: "Risk not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete risk" });
    }
  });
  
  // Critical Date routes
  app.get("/api/critical-dates", async (req: Request, res: Response) => {
    try {
      const criticalDates = await storage.getCriticalDates();
      res.json(criticalDates);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch critical dates" });
    }
  });
  
  app.get("/api/critical-dates/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid critical date ID" });
      }
      
      const criticalDate = await storage.getCriticalDate(id);
      if (!criticalDate) {
        return res.status(404).json({ message: "Critical date not found" });
      }
      
      res.json(criticalDate);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch critical date" });
    }
  });
  
  app.post("/api/critical-dates", async (req: Request, res: Response) => {
    try {
      const validatedData = insertCriticalDateSchema.parse(req.body);
      const criticalDate = await storage.createCriticalDate(validatedData);
      res.status(201).json(criticalDate);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid critical date data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create critical date" });
    }
  });
  
  app.patch("/api/critical-dates/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid critical date ID" });
      }
      
      const validatedData = insertCriticalDateSchema.partial().parse(req.body);
      const updatedCriticalDate = await storage.updateCriticalDate(id, validatedData);
      
      if (!updatedCriticalDate) {
        return res.status(404).json({ message: "Critical date not found" });
      }
      
      res.json(updatedCriticalDate);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid critical date data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update critical date" });
    }
  });
  
  app.delete("/api/critical-dates/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid critical date ID" });
      }
      
      const deleted = await storage.deleteCriticalDate(id);
      if (!deleted) {
        return res.status(404).json({ message: "Critical date not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete critical date" });
    }
  });
  
  // Issues routes
  app.get("/api/issues", async (req: Request, res: Response) => {
    try {
      let projectId: number | undefined = undefined;
      
      if (req.query.projectId) {
        projectId = parseInt(req.query.projectId as string, 10);
        if (isNaN(projectId)) {
          return res.status(400).json({ message: "Invalid project ID" });
        }
      }
      
      const issues = await storage.getIssues(projectId);
      res.json(issues);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch issues" });
    }
  });
  
  app.get("/api/issues/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid issue ID" });
      }
      
      const issue = await storage.getIssue(id);
      if (!issue) {
        return res.status(404).json({ message: "Issue not found" });
      }
      
      res.json(issue);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch issue" });
    }
  });
  
  app.post("/api/issues", async (req: Request, res: Response) => {
    try {
      const validatedData = insertIssueSchema.parse(req.body);
      
      // Make sure the project exists
      const project = await storage.getProject(validatedData.projectId);
      if (!project) {
        return res.status(400).json({ message: "Invalid project ID" });
      }
      
      const issue = await storage.createIssue(validatedData);
      res.status(201).json(issue);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid issue data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create issue" });
    }
  });
  
  app.patch("/api/issues/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid issue ID" });
      }
      
      const validatedData = insertIssueSchema.partial().parse(req.body);
      
      // If projectId is provided, make sure the project exists
      if (validatedData.projectId) {
        const project = await storage.getProject(validatedData.projectId);
        if (!project) {
          return res.status(400).json({ message: "Invalid project ID" });
        }
      }
      
      const updatedIssue = await storage.updateIssue(id, validatedData);
      
      if (!updatedIssue) {
        return res.status(404).json({ message: "Issue not found" });
      }
      
      res.json(updatedIssue);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid issue data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update issue" });
    }
  });
  
  app.delete("/api/issues/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid issue ID" });
      }
      
      const deleted = await storage.deleteIssue(id);
      if (!deleted) {
        return res.status(404).json({ message: "Issue not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete issue" });
    }
  });

  // AI test diagnostics
  app.get("/api/test-ai-suggestions", runAITest);
  
  // OpenAI test endpoint
  app.get("/api/test-openai", async (req: Request, res: Response) => {
    try {
      if (!process.env.OPENAI_API_KEY) {
        return res.status(400).json({
          success: false,
          error: "OPENAI_API_KEY environment variable is not set"
        });
      }

      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      
      // Make a simple API call to test the connection
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          { role: "user", content: "Return a simple JSON with a success property set to true and a message property with value 'OpenAI connection is working.'" }
        ],
        temperature: 0.2,
        max_tokens: 100,
        response_format: { type: "json_object" }
      });
      
      const content = response.choices[0].message.content;
      console.log("OpenAI test response:", content);
      
      return res.json({
        success: true,
        message: "OpenAI API connection successful",
        response: content
      });
    } catch (error) {
      console.error("OpenAI test error:", error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Register project task routes
  registerProjectTaskRoutes(app);

  const httpServer = createServer(app);
  return httpServer;
}
