import { Request, Response, Express } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import { storage } from './storage';
import { insertExternalAccessTokenSchema, insertCriticalDateSchema } from '@shared/schema';
import { addDays } from 'date-fns';

// Schema for token creation
const createExternalAccessSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  name: z.string().min(1, "Please enter a name"),
  organization: z.string().min(1, "Please enter an organization"),
  purpose: z.string().min(1, "Please describe the purpose"),
  accessType: z.enum(["view", "edit", "submit"]),
  expirationDays: z.number().int().min(1).max(180),
  criticalDateIds: z.array(z.number()).optional(),
  projectId: z.number().optional(),
});

// Generate a secure random token
function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function registerExternalAccessRoutes(app: Express) {
  // Create a new external access token
  app.post('/api/external-access-tokens', async (req: Request, res: Response) => {
    try {
      const validatedData = createExternalAccessSchema.parse(req.body);
      
      // Generate a secure token
      const token = generateSecureToken();
      
      // Calculate expiration date
      const expiresAt = addDays(new Date(), validatedData.expirationDays);
      
      // Create the token in the database
      const newToken = await storage.createExternalAccessToken({
        token,
        email: validatedData.email,
        name: validatedData.name,
        organization: validatedData.organization,
        purpose: validatedData.purpose,
        accessType: validatedData.accessType,
        isActive: true,
        expiresAt: expiresAt.toISOString(),
        createdBy: 1, // Default to first user for now
      });
      
      // If specific critical dates were selected, create permissions for each
      if (validatedData.criticalDateIds && validatedData.criticalDateIds.length > 0) {
        for (const criticalDateId of validatedData.criticalDateIds) {
          await storage.createExternalAccessPermission({
            tokenId: newToken.id,
            criticalDateId,
            canView: true,
            canEdit: validatedData.accessType !== 'view',
          });
        }
      }
      // If a project ID was provided, create a project-level permission
      else if (validatedData.projectId) {
        await storage.createExternalAccessPermission({
          tokenId: newToken.id,
          projectId: validatedData.projectId,
          canView: true,
          canEdit: validatedData.accessType !== 'view',
        });
      }
      
      res.status(201).json({ 
        id: newToken.id, 
        token: newToken.token
      });
    } catch (error) {
      console.error('Error creating access token:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: 'Invalid request data', 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: 'Failed to create access token' });
    }
  });

  // Get all access tokens (optionally filtered by project)
  app.get('/api/external-access-tokens', async (req: Request, res: Response) => {
    try {
      const projectId = req.query.projectId ? parseInt(req.query.projectId as string) : undefined;
      
      // Get all tokens
      let tokens = await storage.getExternalAccessTokens();
      
      // If project filter is applied, filter tokens that have permission for this project
      if (projectId) {
        const filteredTokens = [];
        for (const token of tokens) {
          const permissions = await storage.getExternalAccessPermissions(token.id);
          if (permissions.some(p => p.projectId === projectId)) {
            filteredTokens.push(token);
          }
        }
        tokens = filteredTokens;
      }
      
      res.json(tokens);
    } catch (error) {
      console.error('Error fetching access tokens:', error);
      res.status(500).json({ message: 'Failed to fetch access tokens' });
    }
  });

  // Delete/revoke an access token
  app.delete('/api/external-access-tokens/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid token ID' });
      }
      
      // Delete all permissions first
      const permissions = await storage.getExternalAccessPermissions(id);
      for (const permission of permissions) {
        await storage.deleteExternalAccessPermission(permission.id);
      }
      
      // Then delete the token
      await storage.deleteExternalAccessToken(id);
      
      res.status(204).end();
    } catch (error) {
      console.error('Error deleting access token:', error);
      res.status(500).json({ message: 'Failed to delete access token' });
    }
  });

  // Validate external access token and return accessible critical dates
  app.get('/api/external-access/:token/validate', async (req: Request, res: Response) => {
    try {
      const { token } = req.params;
      
      // Get token from database
      const accessToken = await storage.getExternalAccessToken(token);
      
      if (!accessToken || !accessToken.isActive) {
        return res.status(404).json({ message: 'Invalid or expired access token' });
      }
      
      // Check if token is expired
      const expiresAt = new Date(accessToken.expiresAt);
      if (expiresAt < new Date()) {
        return res.status(403).json({ 
          message: 'Access token has expired',
          expiredAt: expiresAt.toISOString()
        });
      }
      
      // Get permissions for this token
      const permissions = await storage.getExternalAccessPermissions(accessToken.id);
      
      // Get critical dates based on permissions
      const criticalDates = [];
      
      // First, add any critical dates with direct permissions
      for (const permission of permissions) {
        if (permission.criticalDateId) {
          const criticalDate = await storage.getCriticalDate(permission.criticalDateId);
          if (criticalDate) {
            criticalDates.push(criticalDate);
          }
        }
      }
      
      // Then, add critical dates from any projects with permissions
      for (const permission of permissions) {
        if (permission.projectId) {
          const projectCriticalDates = await storage.getCriticalDatesByProject(permission.projectId);
          for (const date of projectCriticalDates) {
            // Only add if not already in the array
            if (!criticalDates.some(d => d.id === date.id)) {
              criticalDates.push(date);
            }
          }
        }
      }
      
      // Return token info with critical dates
      res.json({
        ...accessToken,
        criticalDates
      });
      
    } catch (error) {
      console.error('Error validating access token:', error);
      res.status(500).json({ message: 'Failed to validate access token' });
    }
  });
  
  // Allow external users to update critical dates
  app.patch('/api/external-access/:token/critical-dates/:id', async (req: Request, res: Response) => {
    try {
      const { token, id } = req.params;
      const criticalDateId = parseInt(id);
      
      if (isNaN(criticalDateId)) {
        return res.status(400).json({ message: 'Invalid critical date ID' });
      }
      
      // Get token from database
      const accessToken = await storage.getExternalAccessToken(token);
      
      if (!accessToken || !accessToken.isActive) {
        return res.status(404).json({ message: 'Invalid or expired access token' });
      }
      
      // Check if token is expired
      const expiresAt = new Date(accessToken.expiresAt);
      if (expiresAt < new Date()) {
        return res.status(403).json({ message: 'Access token has expired' });
      }
      
      // Check if token has permission to edit this critical date
      const permissions = await storage.getExternalAccessPermissions(accessToken.id);
      
      // Check if the token has direct permission for this critical date
      const directPermission = permissions.find(p => p.criticalDateId === criticalDateId);
      
      // If no direct permission, check if the date belongs to a project the token has permission for
      let hasPermission = !!directPermission;
      
      if (!hasPermission) {
        const criticalDate = await storage.getCriticalDate(criticalDateId);
        if (criticalDate && criticalDate.projectId) {
          hasPermission = permissions.some(p => p.projectId === criticalDate.projectId);
        }
      }
      
      if (!hasPermission) {
        return res.status(403).json({ message: 'No permission to edit this critical date' });
      }
      
      // Check if token has write access
      if (accessToken.accessType === 'view') {
        return res.status(403).json({ message: 'Read-only access' });
      }
      
      // Validate the update data
      const validatedData = insertExternalAccessTokenSchema.partial().parse(req.body);
      
      // Update the critical date
      const updatedCriticalDate = await storage.updateCriticalDate(criticalDateId, validatedData);
      
      if (!updatedCriticalDate) {
        return res.status(404).json({ message: 'Critical date not found' });
      }
      
      res.json(updatedCriticalDate);
    } catch (error) {
      console.error('Error updating critical date:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: 'Invalid request data', 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: 'Failed to update critical date' });
    }
  });
}