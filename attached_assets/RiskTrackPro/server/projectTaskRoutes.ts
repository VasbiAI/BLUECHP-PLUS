import { Express, Request, Response } from "express";
import multer from "multer";
import { storage } from "./storage";
import { parseExcelSchedule, suggestTaskRiskLinks } from "./services/excelService";
import { z } from "zod";
import { insertTaskRiskLinkSchema } from "@shared/schema";

// Set up multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB size limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only Excel files
    const validTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel.sheet.macroEnabled.12'
    ];
    
    if (validTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only Excel files are allowed.') as any);
    }
  }
});

export function registerProjectTaskRoutes(app: Express) {
  // Get project tasks
  app.get("/api/projects/:projectId/tasks", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId, 10);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }
      
      const tasks = await storage.getProjectTasks(projectId);
      
      // For each task, get its links to risks
      const tasksWithLinks = await Promise.all(
        tasks.map(async (task) => {
          const links = await storage.getTaskRiskLinks(task.id);
          return {
            ...task,
            links,
          };
        })
      );
      
      res.json(tasksWithLinks);
    } catch (error) {
      console.error("Error fetching project tasks:", error);
      res.status(500).json({ message: "Failed to fetch project tasks" });
    }
  });
  
  // Get schedule uploads for a project
  app.get("/api/projects/:projectId/schedules", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId, 10);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }
      
      const schedules = await storage.getScheduleUploads(projectId);
      res.json(schedules);
    } catch (error) {
      console.error("Error fetching schedule uploads:", error);
      res.status(500).json({ message: "Failed to fetch schedule uploads" });
    }
  });
  
  // Upload a schedule file
  app.post(
    "/api/projects/:projectId/upload-schedule",
    upload.single("file"),
    async (req: Request, res: Response) => {
      try {
        const projectId = parseInt(req.params.projectId, 10);
        if (isNaN(projectId)) {
          return res.status(400).json({ message: "Invalid project ID" });
        }
        
        if (!req.file) {
          return res.status(400).json({ message: "No file uploaded" });
        }
        
        const username = req.body.username || "Anonymous";
        const filename = req.file.originalname;
        
        // Parse the Excel file and create tasks
        const result = await parseExcelSchedule(
          projectId,
          req.file.buffer,
          filename,
          username
        );
        
        res.status(201).json(result);
      } catch (error: unknown) {
        console.error("Error uploading schedule:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        res.status(500).json({ message: errorMessage || "Failed to upload schedule" });
      }
    }
  );
  
  // Get AI suggestions for task-risk links
  app.get("/api/projects/:projectId/suggest-links", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId, 10);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }
      
      const suggestions = await suggestTaskRiskLinks(projectId);
      res.json(suggestions);
    } catch (error) {
      console.error("Error suggesting task-risk links:", error);
      res.status(500).json({ message: "Failed to generate link suggestions" });
    }
  });
  
  // Create task-risk links
  app.post("/api/task-risk-links", async (req: Request, res: Response) => {
    try {
      // Validate that the request body has a links array
      if (!req.body.links || !Array.isArray(req.body.links)) {
        return res.status(400).json({ message: "Links array is required" });
      }
      
      const createdBy = req.body.createdBy || "Anonymous";
      const createdLinks = [];
      
      // Process each link in the array
      for (const linkData of req.body.links) {
        try {
          const validatedData = insertTaskRiskLinkSchema.parse({
            ...linkData,
            createdBy,
            createdAt: new Date().toISOString(),
            aiSuggested: linkData.aiSuggested || false,
            userConfirmed: true,
          });
          
          const link = await storage.createTaskRiskLink(validatedData);
          createdLinks.push(link);
        } catch (linkError) {
          if (linkError instanceof z.ZodError) {
            console.error("Invalid link data:", linkError.errors);
            // Continue processing other links
          } else {
            throw linkError;
          }
        }
      }
      
      res.status(201).json(createdLinks);
    } catch (error) {
      console.error("Error creating task-risk links:", error);
      res.status(500).json({ message: "Failed to create task-risk links" });
    }
  });
  
  // Get task links
  app.get("/api/tasks/:taskId/links", async (req: Request, res: Response) => {
    try {
      const taskId = parseInt(req.params.taskId, 10);
      if (isNaN(taskId)) {
        return res.status(400).json({ message: "Invalid task ID" });
      }
      
      const links = await storage.getTaskRiskLinks(taskId);
      res.json(links);
    } catch (error) {
      console.error("Error fetching task links:", error);
      res.status(500).json({ message: "Failed to fetch task links" });
    }
  });
  
  // Get risk links
  app.get("/api/risks/:riskId/links", async (req: Request, res: Response) => {
    try {
      const riskId = parseInt(req.params.riskId, 10);
      if (isNaN(riskId)) {
        return res.status(400).json({ message: "Invalid risk ID" });
      }
      
      const links = await storage.getTaskRiskLinks(undefined, riskId);
      res.json(links);
    } catch (error) {
      console.error("Error fetching risk links:", error);
      res.status(500).json({ message: "Failed to fetch risk links" });
    }
  });
  
  // Get a specific project task
  app.get("/api/project-tasks/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid task ID" });
      }
      
      const task = await storage.getProjectTask(id);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      res.json(task);
    } catch (error) {
      console.error("Error fetching project task:", error);
      res.status(500).json({ message: "Failed to fetch task" });
    }
  });
  
  // Delete a task-risk link
  app.delete("/api/task-risk-links/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid link ID" });
      }
      
      const deleted = await storage.deleteTaskRiskLink(id);
      if (!deleted) {
        return res.status(404).json({ message: "Link not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting task-risk link:", error);
      res.status(500).json({ message: "Failed to delete task-risk link" });
    }
  });
  
  // Update project task progress
  app.patch("/api/project-tasks/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid task ID" });
      }
      
      // Validate the percentComplete field
      if (req.body.percentComplete !== undefined) {
        const percentComplete = Number(req.body.percentComplete);
        if (isNaN(percentComplete) || percentComplete < 0 || percentComplete > 100) {
          return res.status(400).json({ message: "Percent complete must be a number between 0 and 100" });
        }
      }
      
      // Update the task
      const updatedTask = await storage.updateProjectTask(id, req.body);
      if (!updatedTask) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      // If task is now 100% complete, check if any linked risks should be closed
      let updatedRisksCount = 0;
      if (updatedTask.percentComplete === 100) {
        // Update any linked risks to closed if all their linked tasks are complete
        updatedRisksCount = await storage.bulkUpdateRisksFromTasks([id]);
      }
      
      res.json({
        ...updatedTask,
        updatedRisksCount
      });
    } catch (error: unknown) {
      console.error("Error updating project task:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: `Failed to update project task: ${errorMessage}` });
    }
  });
  
  // Bulk update project tasks
  app.post("/api/projects/:projectId/tasks/bulk-update", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId, 10);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }
      
      if (!req.body.tasks || !Array.isArray(req.body.tasks)) {
        return res.status(400).json({ message: "Tasks array is required" });
      }
      
      const taskUpdates = req.body.tasks;
      const updatedTasks = [];
      const completedTaskIds = [];
      
      // Process each task update
      for (const update of taskUpdates) {
        if (!update.id) continue;
        
        const taskId = parseInt(update.id, 10);
        if (isNaN(taskId)) continue;
        
        // Update the task
        const updatedTask = await storage.updateProjectTask(taskId, update);
        if (updatedTask) {
          updatedTasks.push(updatedTask);
          
          // Track completed tasks for risk updates
          if (updatedTask.percentComplete === 100) {
            completedTaskIds.push(taskId);
          }
        }
      }
      
      // If we have completed tasks, update linked risks
      let updatedRisksCount = 0;
      if (completedTaskIds.length > 0) {
        updatedRisksCount = await storage.bulkUpdateRisksFromTasks(completedTaskIds);
      }
      
      res.json({
        updatedTasks,
        updatedTasksCount: updatedTasks.length,
        updatedRisksCount
      });
    } catch (error) {
      console.error("Error bulk updating tasks:", error);
      res.status(500).json({ message: "Failed to update tasks" });
    }
  });
}