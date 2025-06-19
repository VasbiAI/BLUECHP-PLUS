
import express, { Request, Response, Router } from 'express';
import { eq, desc, and } from 'drizzle-orm';
import { db } from './db';
import { z } from 'zod';
import { 
  risks as riskTrackProRisks, 
  risk_categories as riskCategories, 
  issues, 
  criticalDates,
  issueRisks
} from '../shared/riskTrackProSchema';
import * as riskCalculationService from './services/risk-calculations';

const validateRequest = <T extends z.ZodType<any, any>>(
  schema: T,
  data: unknown
): z.infer<T> | null => {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Validation error:", error.errors);
      return null;
    }
    throw error;
  }
};

export function registerRiskTrackProRoutes(app: express.Application) {
  const router = Router();

  // Risk management routes
  router.get('/risks/:projectId', async (req: Request, res: Response) => {
    try {
      const { projectId } = req.params;

      if (!projectId) {
        return res.status(400).json({ error: 'Project ID is required' });
      }

      // Support both column naming styles
      const risks = await db.select().from(riskTrackProRisks)
        .where(
          riskTrackProRisks.projectId ? eq(riskTrackProRisks.projectId, projectId) : 
          riskTrackProRisks.project_id ? eq(riskTrackProRisks.project_id, projectId) : 
          eq(riskTrackProRisks.projectId, projectId)
        )
        .orderBy(desc(riskTrackProRisks.updatedAt));

      return res.json(risks);
    } catch (error) {
      console.error(`Error fetching risks: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return res.status(500).json({ error: 'Failed to fetch risks' });
    }
  });

  router.post('/risks', async (req: Request, res: Response) => {
    try {
      const riskData = req.body;

      if (!riskData.projectId) {
        return res.status(400).json({ error: 'Project ID is required' });
      }

      // Calculate risk rating based on likelihood and impact
      const riskRating = riskCalculationService.calculateRiskRating(
        riskData.probability || riskData.likelihood, 
        riskData.impact
      );

      const riskWithRating = {
        ...riskData,
        riskRating,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const newRisk = await db.insert(riskTrackProRisks).values(riskWithRating).returning();

      return res.status(201).json(newRisk[0]);
    } catch (error) {
      console.error(`Error creating risk: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return res.status(500).json({ error: 'Failed to create risk' });
    }
  });

  router.put('/risks/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const riskData = req.body;

      if (!id) {
        return res.status(400).json({ error: 'Risk ID is required' });
      }

      // Recalculate risk rating if probability or impact changed
      if ((riskData.probability !== undefined || riskData.likelihood !== undefined) && riskData.impact !== undefined) {
        riskData.riskRating = riskCalculationService.calculateRiskRating(
          riskData.probability || riskData.likelihood, 
          riskData.impact
        );
      }

      const updatedRisk = {
        ...riskData,
        updatedAt: new Date()
      };

      const result = await db.update(riskTrackProRisks)
        .set(updatedRisk)
        .where(eq(riskTrackProRisks.id, id))
        .returning();

      if (result.length === 0) {
        return res.status(404).json({ error: 'Risk not found' });
      }

      return res.json(result[0]);
    } catch (error) {
      console.error(`Error updating risk: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return res.status(500).json({ error: 'Failed to update risk' });
    }
  });

  router.delete('/risks/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ error: 'Risk ID is required' });
      }

      await db.delete(riskTrackProRisks)
        .where(eq(riskTrackProRisks.id, id));

      return res.status(204).send();
    } catch (error) {
      console.error(`Error deleting risk: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return res.status(500).json({ error: 'Failed to delete risk' });
    }
  });

  // Convert risk to issue
  router.post('/risks/:id/convert-to-issue', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ error: 'Risk ID is required' });
      }

      // Get the risk to convert
      const riskResult = await db.select().from(riskTrackProRisks)
        .where(eq(riskTrackProRisks.id, id));

      if (riskResult.length === 0) {
        return res.status(404).json({ error: 'Risk not found' });
      }

      const risk = riskResult[0];

      // Calculate priority level based on risk factors
      const priorityLevel = (risk.probability || 0) >= 4 || (risk.likelihood || 0) >= 4 
        ? 'high' 
        : ((risk.probability || 0) >= 2 || (risk.likelihood || 0) >= 2 
            ? 'medium' 
            : 'low');

      // Prepare the issue data with proper type safety
      const newIssueData = {
        id: undefined, // Let database generate UUID
        projectId: (risk.projectId || risk.project_id || '1') as string,
        project_id: (risk.projectId || risk.project_id || '1') as string, // Support both column formats
        issueId: `I-${new Date().getTime().toString().slice(-6)}`,
        dateRaised: new Date().toISOString(),
        title: `Issue from risk: ${risk.riskEvent || risk.title || 'Unknown Risk'}`,
        description: risk.description || `${risk.riskCause || ''} leading to ${risk.riskEvent || ''} resulting in ${risk.riskEffect || ''}`,
        raisedBy: risk.raisedBy || 'System',
        assignedTo: risk.responseOwner || risk.owner || 'Unassigned',
        priority: priorityLevel as 'low' | 'medium' | 'high',
        status: 'open' as 'open' | 'in-progress' | 'resolved' | 'closed',
        dueDate: risk.responseTimeframe || null,
        resolution: undefined,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Insert the new issue with array syntax
      const newIssue = await db.insert(issues).values([newIssueData]).returning();

      // Link the risk to the issue
      await db.insert(issueRisks).values([{
        issueId: newIssue[0].id,
        riskId: risk.id
      }]);

      // Update the risk status to indicate it has become an issue
      await db.update(riskTrackProRisks)
        .set({ 
          status: 'converted',
          updatedAt: new Date()
        })
        .where(eq(riskTrackProRisks.id, id));

      return res.status(201).json(newIssue[0]);
    } catch (error) {
      console.error(`Error converting risk to issue: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return res.status(500).json({ error: 'Failed to convert risk to issue' });
    }
  });

  // Issues management routes
  router.get('/issues/:projectId', async (req: Request, res: Response) => {
    try {
      const { projectId } = req.params;

      if (!projectId) {
        return res.status(400).json({ error: 'Project ID is required' });
      }
      
      // First check the column names to avoid errors
      let hasProjectId = false;
      let hasUpdatedAt = false;
      
      try {
        // Check if columns exist before using them in the query
        const columnCheck = await db.execute(
          `SELECT column_name FROM information_schema.columns 
           WHERE table_name = 'issues' AND column_name IN ('projectId', 'updatedAt')`
        );
        
        // Extract column names to an array
        const columns = columnCheck.rows.map(row => row.column_name);
        hasProjectId = columns.includes('projectId');
        hasUpdatedAt = columns.includes('updatedAt');
      } catch (err) {
        console.log('Error checking columns:', err);
      }
      
      let issuesList;
      
      // Check if projectId is valid before using it in queries
      if (!projectId || projectId === 'undefined' || projectId === 'null') {
        return res.status(400).json({ error: 'Invalid project ID' });
      }
      
      try {
        // Use raw SQL query to avoid column errors
        issuesList = await db.execute(
          `SELECT * FROM issues 
          WHERE project_id = $1 OR "projectId" = $1
          ORDER BY COALESCE("dateUpdated", "updatedAt", created_at, updated_at) DESC`,
          [projectId]
        );
        
        return res.json(issuesList.rows);
      } catch (sqlError) {
        console.error(`SQL error fetching issues: ${sqlError instanceof Error ? sqlError.message : 'Unknown error'}`);
        
        // Fallback to less specific query if the first one fails
        try {
          issuesList = await db.execute(
            `SELECT * FROM issues 
            WHERE project_id = $1`,
            [projectId]
          );
          
          return res.json(issuesList.rows);
        } catch (fallbackError) {
          console.error(`Fallback error fetching issues: ${fallbackError instanceof Error ? fallbackError.message : 'Unknown error'}`);
          return res.status(500).json({ error: 'Failed to fetch issues' });
        }
      }
    } catch (error) {
      console.error(`Error fetching issues: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return res.status(500).json({ error: 'Failed to fetch issues' });
    }
  });

  router.post('/issues', async (req: Request, res: Response) => {
    try {
      const issueData = req.body;

      if (!issueData.projectId) {
        return res.status(400).json({ error: 'Project ID is required' });
      }

      const issueWithDates = {
        ...issueData,
        issueId: `I-${new Date().getTime().toString().slice(-6)}`,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const newIssue = await db.insert(issues).values(issueWithDates).returning();

      return res.status(201).json(newIssue[0]);
    } catch (error) {
      console.error(`Error creating issue: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return res.status(500).json({ error: 'Failed to create issue' });
    }
  });

  router.put('/issues/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const issueData = req.body;

      if (!id) {
        return res.status(400).json({ error: 'Issue ID is required' });
      }

      const updatedIssue = {
        ...issueData,
        updatedAt: new Date()
      };

      const result = await db.update(issues)
        .set(updatedIssue)
        .where(eq(issues.id, id))
        .returning();

      if (result.length === 0) {
        return res.status(404).json({ error: 'Issue not found' });
      }

      return res.json(result[0]);
    } catch (error) {
      console.error(`Error updating issue: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return res.status(500).json({ error: 'Failed to update issue' });
    }
  });

  router.delete('/issues/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ error: 'Issue ID is required' });
      }

      await db.delete(issues)
        .where(eq(issues.id, id));

      return res.status(204).send();
    } catch (error) {
      console.error(`Error deleting issue: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return res.status(500).json({ error: 'Failed to delete issue' });
    }
  });

  // Critical dates management routes
  router.get('/critical-dates/:projectId', async (req: Request, res: Response) => {
    try {
      const { projectId } = req.params;

      if (!projectId) {
        return res.status(400).json({ error: 'Project ID is required' });
      }
      
      // Check if projectId is valid before using it in queries
      if (projectId === 'undefined' || projectId === 'null') {
        return res.status(400).json({ error: 'Invalid project ID' });
      }

      try {
        // Use raw SQL query to avoid column errors
        const datesList = await db.execute(
          `SELECT * FROM critical_dates 
          WHERE project_id = $1 OR "projectId" = $1
          ORDER BY "dueDate" ASC`,
          [projectId]
        );
        
        return res.json(datesList.rows);
      } catch (sqlError) {
        console.error(`SQL error fetching critical dates: ${sqlError instanceof Error ? sqlError.message : 'Unknown error'}`);
        
        // Fallback to simpler query if the first one fails
        try {
          const datesList = await db.execute(
            `SELECT * FROM critical_dates 
            WHERE project_id = $1`,
            [projectId]
          );
          
          return res.json(datesList.rows);
        } catch (fallbackError) {
          console.error(`Fallback error fetching critical dates: ${fallbackError instanceof Error ? fallbackError.message : 'Unknown error'}`);
          return res.status(500).json({ error: 'Failed to fetch critical dates' });
        }
      }
    } catch (error) {
      console.error(`Error fetching critical dates: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return res.status(500).json({ error: 'Failed to fetch critical dates' });
    }
  });

  router.post('/critical-dates', async (req: Request, res: Response) => {
    try {
      const dateData = req.body;

      if (!dateData.projectId) {
        return res.status(400).json({ error: 'Project ID is required' });
      }

      const dateWithTimestamps = {
        ...dateData,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const newDate = await db.insert(criticalDates).values(dateWithTimestamps).returning();

      return res.status(201).json(newDate[0]);
    } catch (error) {
      console.error(`Error creating critical date: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return res.status(500).json({ error: 'Failed to create critical date' });
    }
  });

  router.put('/critical-dates/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const dateData = req.body;

      if (!id) {
        return res.status(400).json({ error: 'Critical date ID is required' });
      }

      const updatedDate = {
        ...dateData,
        updatedAt: new Date()
      };

      const result = await db.update(criticalDates)
        .set(updatedDate)
        .where(eq(criticalDates.id, id))
        .returning();

      if (result.length === 0) {
        return res.status(404).json({ error: 'Critical date not found' });
      }

      return res.json(result[0]);
    } catch (error) {
      console.error(`Error updating critical date: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return res.status(500).json({ error: 'Failed to update critical date' });
    }
  });

  router.delete('/critical-dates/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ error: 'Critical date ID is required' });
      }

      await db.delete(criticalDates)
        .where(eq(criticalDates.id, id));

      return res.status(204).send();
    } catch (error) {
      console.error(`Error deleting critical date: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return res.status(500).json({ error: 'Failed to delete critical date' });
    }
  });

  app.use('/api', router);
}
