import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage as dbStorage } from "./storage";
import { uploadToBluechpBucket, downloadFromBluechpBucket, deleteFromBluechpBucket } from "./bluechp-storage";
import { uniphiApiClient } from "./uniphi-api-client";
import axios from 'axios';
import { 
  insertUserSchema, 
  insertDocumentSchema, 
  insertSectionSchema,
  insertProjectSchema,
  RiskStatusEnum,
  riskSchema,
  riskCategorySchema,
  riskRegisterSchema,
  documentComments,
  insertDocumentCommentSchema,
  insertDevelopmentTypeSchema,
  insertFinanceModelSchema,
  insertContractTypeSchema,
  insertFundingSourceSchema,
  insertRevenueStreamSchema,
  documents,
  insertManualSchema,
  insertManualSectionSchema,
  insertManualContentSchema
} from "@shared/schema";
import multer from 'multer';
import { randomUUID } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

import { fromZodError } from "zod-validation-error";
import { z } from "zod";

// Error handling middleware
const handleApiError = (err: any, res: Response) => {
  console.error("API Error:", err);
  const statusCode = err.statusCode || 500;
  const message = err.message || 'An unexpected error occurred';
  res.status(statusCode).json({ error: message });
};

// Configure paths for document storage
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
const DOCUMENTS_DIR = path.join(UPLOADS_DIR, 'documents');

// Ensure the uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
if (!fs.existsSync(DOCUMENTS_DIR)) {
  fs.mkdirSync(DOCUMENTS_DIR, { recursive: true });
}

// Helper function to format file size
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' bytes';
  else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  else if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB';
  else return (bytes / 1073741824).toFixed(1) + ' GB';
};

// Get content type based on file extension
const getContentType = (filePath: string): string => {
  const ext = path.extname(filePath).toLowerCase();

  const contentTypes: Record<string, string> = {
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.ppt': 'application/vnd.ms-powerpoint',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.txt': 'text/plain',
    '.csv': 'text/csv',
    '.rtf': 'application/rtf',
    '.zip': 'application/zip',
  };

  return contentTypes[ext] || 'application/octet-stream';
};

// Configure multer storage
const multerStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Ensure uploads directories exist
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }
    if (!fs.existsSync(DOCUMENTS_DIR)) {
      fs.mkdirSync(DOCUMENTS_DIR, { recursive: true });
    }

    cb(null, DOCUMENTS_DIR);
  },
  filename: function (req, file, cb) {
    const uniqueId = randomUUID();
    const fileExtension = path.extname(file.originalname).toLowerCase();
    cb(null, `${uniqueId}${fileExtension}`);
  }
});

// Configure upload middleware
const upload = multer({ 
  storage: multerStorage,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB
});

// Document upload handler
const handleDocumentUpload = async (req: Request, res: Response) => {
  try {
    // Use multer to handle the upload
    const uploadMiddleware = upload.single('file');

    // Process the upload
    await new Promise<void>((resolve, reject) => {
      uploadMiddleware(req, res, (err) => {
        if (err) {
          console.error('Error in multer upload:', err);
          return reject(err);
        }
        resolve();
      });
    });

    // Check if file was received
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('Uploaded file:', req.file);

    // Extract form data from request body
    const { title = 'Untitled', category = '', projectId: projectIdString = '', description = '' } = req.body;

    const projectId = parseInt(projectIdString);

    console.log('Form data:', { title, category, projectId, description });

    // File details
    const originalFilename = req.file.originalname || 'unknown';
    const fileExtension = path.extname(originalFilename).toLowerCase();
    let fileType = fileExtension.replace('.', '') || 'unknown';

    // More descriptive document types
    switch (fileType.toLowerCase()) {
      case 'pdf':
        fileType = 'PDF Document';
        break;
      case 'doc':
      case 'docx':
        fileType = 'Word Document';
        break;
      case 'xls':
      case 'xlsx':
        fileType = 'Excel Spreadsheet';
        break;
      case 'ppt':
      case 'pptx':
        fileType = 'PowerPoint Presentation';
        break;
      default:
        fileType = fileType.toUpperCase() + ' File';
    }

    // Get the temporary file path after upload
    const tempFilePath = req.file.path;

    // Generate file ID (UUID) for storage
    const fileId = path.parse(req.file.filename).name;

    // Get file stats
    const stats = await fs.promises.stat(tempFilePath);
    const fileSizeBytes = stats.size;
    const fileSizeFormatted = formatFileSize(fileSizeBytes);

    // Define the storage key for Replit object storage (BLUECHP BUCKET)
    const storageKey = `documents/${fileId}${fileExtension}`;

    // Upload to BLUECHP BUCKET (Replit object storage)
    console.log(`Uploading file to BLUECHP BUCKET (Replit object storage): ${storageKey}`);
    const storageUrl = await uploadToBluechpBucket(tempFilePath, storageKey);

    // Define download URL
    const downloadUrl = `/api/documents/download/${fileId}`;

    // Create document record in database with BLUECHP BUCKET integration
    const document = await dbStorage.createDocument({
      title,
      type: fileType,
      status: 'draft',
      projectId: isNaN(projectId) ? null : projectId,
      content: {},
      filename: originalFilename,
      size: fileSizeFormatted,
      sizeBytes: fileSizeBytes,
      storagePath: storageKey, // Store the object storage key
      storageUrl, // URL from the object storage
      downloadUrl,
      category,
      description,
      version: '1.0',
      createdBy: (req.user as any)?.username || 'system',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    console.log('Document uploaded successfully to BLUECHP BUCKET:', {
      id: document.id,
      title: document.title,
      storageKey,
      storageUrl
    });

    res.status(201).json({
      success: true,
      message: 'Document uploaded successfully to BLUECHP BUCKET',
      document
    });
  } catch (error) {
    console.error('Error uploading document:', error);
    handleApiError(error, res);
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({ 
      status: 'ok',
      version: '1.0.0',
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    });
  });

  // =============== User Management Routes ===============

  // Get all users
  app.get('/api/users', async (req: Request, res: Response) => {
    try {
      const users = await dbStorage.getAllUsers();
      res.json(users);
    } catch (error) {
      handleApiError(error, res);
    }
  });

  // Get user by ID
  app.get('/api/users/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid ID format' });
      }

      const user = await dbStorage.getUser(id);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json(user);
    } catch (error) {
      handleApiError(error, res);
    }
  });

  // Create new user
  app.post('/api/users', async (req: Request, res: Response) => {
    try {
      const result = insertUserSchema.safeParse(req.body);

      if (!result.success) {
        const errorMessage = fromZodError(result.error).message;
        return res.status(400).json({ error: errorMessage });
      }

      // Check if username already exists
      const existingUser = await dbStorage.getUserByUsername(result.data.username);
      if (existingUser) {
        return res.status(409).json({ error: 'Username already exists' });
      }

      // Check if email already exists
      const existingEmail = await dbStorage.getUserByEmail(result.data.email);
      if (existingEmail) {
        return res.status(409).json({ error: 'Email already exists' });
      }

      const newUser = await dbStorage.createUser(result.data);
      res.status(201).json(newUser);
    } catch (error) {
      handleApiError(error, res);
    }
  });

  // Update existing user
  app.put('/api/users/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid ID format' });
      }

      // Validate the request body - allow partial updates
      const updateSchema = insertUserSchema.partial();
      const result = updateSchema.safeParse(req.body);

      if (!result.success) {
        const errorMessage = fromZodError(result.error).message;
        return res.status(400).json({ error: errorMessage });
      }

      // Check if user exists
      const existingUser = await dbStorage.getUser(id);
      if (!existingUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Check if username is being changed and if it's already taken
      if (result.data.username && result.data.username !== existingUser.username) {
        const userWithSameUsername = await dbStorage.getUserByUsername(result.data.username);
        if (userWithSameUsername && userWithSameUsername.id !== id) {
          return res.status(409).json({ error: 'Username already exists' });
        }
      }

      // Check if email is being changed and if it's already taken
      if (result.data.email && result.data.email !== existingUser.email) {
        const userWithSameEmail = await dbStorage.getUserByEmail(result.data.email);
        if (userWithSameEmail && userWithSameEmail.id !== id) {
          return res.status(409).json({ error: 'Email already exists' });
        }
      }

      const updatedUser = await dbStorage.updateUser(id, result.data);
      res.json(updatedUser);
    } catch (error) {
      handleApiError(error, res);
    }
  });

  // =============== Document Management Routes ===============

  // Get all documents
  app.get('/api/documents', async (req: Request, res: Response) => {
    try {
      // Support filtering by type
      const type = req.query.type as string | undefined;

      let documents;
      if (type) {
        documents = await dbStorage.getDocumentsByType(type);
      } else {
        documents = await dbStorage.getAllDocuments();
      }

      res.json(documents);
    } catch (error) {
      handleApiError(error, res);
    }
  });

  // Get document by ID
  app.get('/api/documents/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid ID format' });
      }

      const document = await dbStorage.getDocument(id);

      if (!document) {
        return res.status(404).json({ error: 'Document not found' });
      }

      res.json(document);
    } catch (error) {
      handleApiError(error, res);
    }
  });

  // Create new document
  app.post('/api/documents', async (req: Request, res: Response) => {
    try {
      const result = insertDocumentSchema.safeParse(req.body);

      if (!result.success) {
        const errorMessage = fromZodError(result.error).message;
        return res.status(400).json({ error: errorMessage });
      }

      // Add timestamps
      const now = new Date().toISOString();
      const documentWithTimestamps = {
        ...result.data,
        createdAt: now,
        updatedAt: now
      };

      const newDocument = await dbStorage.createDocument(documentWithTimestamps);
      res.status(201).json(newDocument);
    } catch (error) {
      handleApiError(error, res);
    }
  });

  // Document upload endpoint
  app.post('/api/documents/upload', handleDocumentUpload);

  // Document download endpoint
  app.get('/api/documents/download/:id', async (req: Request, res: Response) => {
    try {
      // Get document ID or UUID from path
      const id = req.params.id;
      console.log('Download request for document ID:', id);

      let storageKey = '';
      let filename = '';

      // Check if it's a numeric ID or a UUID
      const documentId = parseInt(id);
      if (!isNaN(documentId)) {
        // Look up the document in the database
        console.log('Looking up document with ID:', documentId);
        const document = await dbStorage.getDocument(documentId);

        if (!document || !document.storagePath) {
          return res.status(404).json({ error: 'Document not found in database' });
        }

        // Get the storage key and filename
        storageKey = document.storagePath;
        filename = document.filename || path.basename(storageKey);
        console.log('Found document, storage key:', storageKey);
      } else {
        // This is a UUID request, try to find matching document
        console.log('Searching for document with UUID in storage path:', id);
        const documents = await dbStorage.getAllDocuments();

        // Look for a document with this UUID in its storage path
        const document = documents.find(doc => 
          doc.storagePath && doc.storagePath.includes(id)
        );

        if (document && document.storagePath) {
          storageKey = document.storagePath;
          filename = document.filename || path.basename(document.storagePath);
          console.log('Found matching document:', document.id, storageKey);
        } else {
          // No matching document found, try direct UUID lookup
          storageKey = `documents/${id}`;
          filename = `file-${id}`;
          console.log('No matching document found, trying direct UUID lookup with key:', storageKey);
        }
      }

      // Create temporary storage directory if needed
      const tempDir = path.join(process.cwd(), 'uploads', 'temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      // Create a temporary file path for downloading
      const tempFilePath = path.join(tempDir, filename);
      console.log('Downloading from BLUECHP BUCKET to temporary path:', tempFilePath);

      // Try to download the file from BLUECHP BUCKET
      let downloadSuccess = await downloadFromBluechpBucket(storageKey, tempFilePath);

      // If first attempt fails, try alternative storage locations
      if (!downloadSuccess) {
        console.log('Primary download failed, trying alternative keys');

        // Try possible alternative keys
        const fileExtension = path.extname(filename);
        const alternativeKeys = [
          `documents/${id}${fileExtension}`,
          id,
          `${id}${fileExtension}`
        ];

        for (const altKey of alternativeKeys) {
          console.log('Trying alternative storage key:', altKey);
          downloadSuccess = await downloadFromBluechpBucket(altKey, tempFilePath);
          if (downloadSuccess) {
            console.log('Download successful with alternative key:', altKey);
            break;
          }
        }

        // If all alternatives failed, check local fallback
        if (!downloadSuccess) {
          console.log('All BLUECHP BUCKET downloads failed, checking local fallback');
          const localDir = path.join(process.cwd(), 'uploads', 'documents');
          if (fs.existsSync(localDir)) {
            try {
              const files = await fs.promises.readdir(localDir);
              const matchingFile = files.find(file => file.includes(id));

              if (matchingFile) {
                const localPath = path.join(localDir, matchingFile);
                fs.copyFileSync(localPath, tempFilePath);
                downloadSuccess = true;
                filename = matchingFile;
                console.log('Found file in local fallback directory:', localPath);
              }
            } catch (error) {
              console.error('Error checking local fallback:', error);
            }
          }
        }

        // If all attempts failed, return 404
        if (!downloadSuccess) {
          return res.status(404).json({ 
            error: 'Document not found in BLUECHP BUCKET storage',
            id,
            storageKey
          });
        }
      }

      // Determine content type
      const contentType = getContentType(filename);

      // Set appropriate headers for download
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
      res.setHeader('Content-Type', contentType);

      // Stream the file to the response
      const fileStream = fs.createReadStream(tempFilePath);
      fileStream.pipe(res);

      // Clean up the temporary file after sending
      fileStream.on('end', () => {
        try {
          fs.unlinkSync(tempFilePath);
          console.log('Temporary file deleted:', tempFilePath);
        } catch (cleanupError) {
          console.error('Error cleaning up temporary file:', cleanupError);
        }
      });

      // Handle streaming errors
      fileStream.on('error', (err) => {
        console.error('Error streaming file:', err);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Error streaming file' });
        }

        // Still try to clean up
        try {
          fs.unlinkSync(tempFilePath);
        } catch (cleanupError) {
          console.error('Error cleaning up temporary file:', cleanupError);
        }
      });
    } catch (error) {
      console.error('Error in document download:', error);
      handleApiError(error, res);
    }
  });

  // Update document
  app.put('/api/documents/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid ID format' });
      }

      // Validate the request body - allow partial updates
      const updateSchema = insertDocumentSchema.partial();
      const result = updateSchema.safeParse(req.body);

      if (!result.success) {
        const errorMessage = fromZodError(result.error).message;
        return res.status(400).json({ error: errorMessage });
      }

      // Check if document exists
      const existingDocument = await dbStorage.getDocument(id);
      if (!existingDocument) {
        return res.status(404).json({ error: 'Document not found' });
      }

      const updatedDocument = await dbStorage.updateDocument(id, result.data);
      res.json(updatedDocument);
    } catch (error) {
      handleApiError(error, res);
    }
  });

  // Delete document
  app.delete('/api/documents/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid ID format' });
      }

      // Check if document exists
      const existingDocument = await dbStorage.getDocument(id);
      if (!existingDocument) {
        return res.status(404).json({ error: 'Document not found' });
      }

      // Delete from BLUECHP BUCKET storage if we have a storage path
      if (existingDocument.storagePath) {
        console.log('Deleting file from BLUECHP BUCKET:', existingDocument.storagePath);

        try {
          // Delete from Replit object storage bucket
          const deleteSuccess = await deleteFromBluechpBucket(existingDocument.storagePath);

          if (deleteSuccess) {
            console.log('File successfully deleted from BLUECHP BUCKET');
          } else {
            console.error('Failed to delete file from BLUECHP BUCKET');

            // Continue with document deletion even if file deletion fails
            // This prevents orphaned database records when storage is unavailable
          }
        } catch (storageError) {
          console.error('Error when deleting from BLUECHP BUCKET:', storageError);
          // Continue with database record deletion despite storage error
        }
      }

      // Delete document record from database
      await dbStorage.deleteDocument(id);

      console.log('Document successfully deleted:', id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting document:', error);
      handleApiError(error, res);
    }
  });

  // =============== Section Management Routes ===============

  // Get sections by document ID
  app.get('/api/documents/:documentId/sections', async (req: Request, res: Response) => {
    try {
      const documentId = parseInt(req.params.documentId);
      if (isNaN(documentId)) {
        return res.status(400).json({ error: 'Invalid document ID format' });
      }

      // Check if document exists
      const existingDocument = await dbStorage.getDocument(documentId);
      if (!existingDocument) {
        return res.status(404).json({ error: 'Document not found' });
      }

      const sections = await dbStorage.getSectionsByDocument(documentId);
      res.json(sections);
    } catch (error) {
      handleApiError(error, res);
    }
  });

  // Get section by ID
  app.get('/api/sections/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid ID format' });
      }

      const section = await dbStorage.getSection(id);

      if (!section) {
        return res.status(404).json({ error: 'Section not found' });
      }

      res.json(section);
    } catch (error) {
      handleApiError(error, res);
    }
  });

  // Create new section
  app.post('/api/sections', async (req: Request, res: Response) => {
    try {
      const result = insertSectionSchema.safeParse(req.body);

      if (!result.success) {
        const errorMessage = fromZodError(result.error).message;
        return res.status(400).json({ error: errorMessage });
      }

      // Check if document exists
      const existingDocument = await dbStorage.getDocument(result.data.documentId);
      if (!existingDocument) {
        return res.status(404).json({ error: 'Document not found' });
      }

      // Check if parent section exists if parentId is provided
      if (result.data.parentId) {
        const parentSection = await dbStorage.getSection(result.data.parentId);
        if (!parentSection) {
          return res.status(404).json({ error: 'Parent section not found' });
        }
      }

      // Add timestamps
      const now = new Date().toISOString();
      const sectionWithTimestamps = {
        ...result.data,
        createdAt: now,
        updatedAt: now
      };

      const newSection = await dbStorage.createSection(sectionWithTimestamps);
      res.status(201).json(newSection);
    } catch (error) {
      handleApiError(error, res);
    }
  });

  // Update section
  app.put('/api/sections/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid ID format' });
      }

      // Validate the request body - allow partial updates
      const updateSchema = insertSectionSchema.partial();
      const result = updateSchema.safeParse(req.body);

      if (!result.success) {
        const errorMessage = fromZodError(result.error).message;
        return res.status(400).json({ error: errorMessage });
      }

      // Check if section exists
      const existingSection = await dbStorage.getSection(id);
      if (!existingSection) {
        return res.status(404).json({ error: 'Section not found' });
      }

      const updatedSection = await dbStorage.updateSection(id, result.data);
      res.json(updatedSection);
    } catch (error) {
      handleApiError(error, res);
    }
  });

  // Delete section
  app.delete('/api/sections/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid ID format' });
      }

      // Check if section exists
      const existingSection = await dbStorage.getSection(id);
      if (!existingSection) {
        return res.status(404).json({ error: 'Section not found' });
      }

      await dbStorage.deleteSection(id);
      res.status(204).send();
    } catch (error) {
      handleApiError(error, res);
    }
  });

  // =============== Project Management Routes ===============

  // Get all projects
  app.get('/api/projects', async (req: Request, res: Response) => {
    try {
      const projects = await dbStorage.getAllProjects();
      res.json(projects);
    } catch (error) {
      handleApiError(error, res);
    }
  });

  // Get project by ID
  app.get('/api/projects/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid ID format' });
      }

      const project = await dbStorage.getProject(id);

      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      res.json(project);
    } catch (error) {
      handleApiError(error, res);
    }
  });

  // Create new project
  app.post('/api/projects', async (req: Request, res: Response) => {
    try {
      const result = insertProjectSchema.safeParse(req.body);

      if (!result.success) {
        const errorMessage = fromZodError(result.error).message;
        return res.status(400).json({ error: errorMessage });
      }

      // Create a new document for the project if documentId is not provided
      let documentId = req.body.documentId;
      if (!documentId) {
        // Create a new document with timestamps
        const now = new Date().toISOString();
        const document = await dbStorage.createDocument({
          title: `${result.data.projectName} Document`,
          type: 'project',
          status: 'draft',
          content: null,
          createdAt: now,
          updatedAt: now
        });
        documentId = document.id;
      } else {
        // Check if document exists
        const existingDocument = await dbStorage.getDocument(documentId);
        if (!existingDocument) {
          return res.status(404).json({ error: 'Document not found' });
        }
      }

      // Add document ID and timestamps to project data
      const now = new Date().toISOString();
      const projectData = {
        ...result.data,
        documentId,
        createdAt: now,
        updatedAt: now
      };

      const newProject = await dbStorage.createProject(projectData);
      res.status(201).json(newProject);
    } catch (error) {
      handleApiError(error, res);
    }
  });

  // Update project
  app.put('/api/projects/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid ID format' });
      }

      // Validate the request body - allow partial updates
      const updateSchema = insertProjectSchema.partial();
      const result = updateSchema.safeParse(req.body);

      if (!result.success) {
        const errorMessage = fromZodError(result.error).message;
        return res.status(400).json({ error: errorMessage });
      }

      // Check if project exists
      const existingProject = await dbStorage.getProject(id);
      if (!existingProject) {
        return res.status(404).json({ error: 'Project not found' });
      }

      const updatedProject = await dbStorage.updateProject(id, result.data);
      res.json(updatedProject);
    } catch (error) {
      handleApiError(error, res);
    }
  });

  // Delete project
  app.delete('/api/projects/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid ID format' });
      }

      // Check if project exists
      const existingProject = await dbStorage.getProject(id);
      if (!existingProject) {
        return res.status(404).json({ error: 'Project not found' });
      }

      await dbStorage.deleteProject(id);
      res.status(204).send();
    } catch (error) {
      handleApiError(error, res);
    }
  });

  // Get documents for a project
  app.get('/api/projects/:id/documents', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid ID format' });
      }

      // Check if project exists
      const existingProject = await dbStorage.getProject(id);
      if (!existingProject) {
        return res.status(404).json({ error: 'Project not found' });
      }

      const documents = await dbStorage.getDocumentsByProject(id);
      res.json(documents);
    } catch (error) {
      handleApiError(error, res);
    }
  });

  // Project dashboard data endpoints
  app.get('/api/projects/:id/status', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid ID format' });
      }

      //      // Check if project exists
      const existingProject = await dbStorage.getProject(id);
      if (!existingProject) {
        return res.status(404).json({ error: 'Project not found' });
      }

      const projectStatus = await dbStorage.getProjectStatus(id);
      res.json(projectStatus || {});
    } catch (error) {
      handleApiError(error, res);
    }
  });

  app.get('/api/projects/:id/risks', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid ID format' });
      }

      // Check if project exists
      const existingProject = await dbStorage.getProject(id);
      if (!existingProject) {
        return res.status(404).json({ error: 'Project not found' });
      }

      const risks = await dbStorage.getProjectRisks(id);
      res.json(risks || []);
    } catch (error) {
      handleApiError(error, res);
    }
  });

  app.get('/api/projects/:id/timeline', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid ID format' });
      }

      // Check if project exists
      const existingProject = await dbStorage.getProject(id);
      if (!existingProject) {
        return res.status(404).json({ error: 'Project not found' });
      }

      const events = await dbStorage.getTimelineEvents(id);
      res.json(events || []);
    } catch (error) {
      handleApiError(error, res);
    }
  });

  app.get('/api/projects/:id/critical-dates', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid ID format' });
      }

      // Check if project exists
      const existingProject = await dbStorage.getProject(id);
      if (!existingProject) {
        return res.status(404).json({ error: 'Project not found' });
      }

      const dates = await dbStorage.getCriticalDates(id);
      res.json(dates || []);
    } catch (error) {
      handleApiError(error, res);
    }
  });

  // =============== Risk Register Routes ===============

  // Get risk register for a document
  app.get('/api/documents/:id/risk-register', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid ID format' });
      }

      // Check if document exists
      const document = await dbStorage.getDocument(id);
      if (!document) {
        return res.status(404).json({ error: 'Document not found' });
      }

      // For now, return a placeholder risk register
      // In a real implementation, this would fetch risk data from storage
      const riskRegister = {
        documentId: document.id,
        documentTitle: document.title,
        projectId: document.projectId,
        projectName: document.projectId ? (await dbStorage.getProject(document.projectId))?.projectName : undefined,
        categories: []
      };

      res.json(riskRegister);
    } catch (error) {
      handleApiError(error, res);
    }
  });

  // =============== Document Comments Routes ===============

  // Get comments for a document
  app.get('/api/documents/:id/comments', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid ID format' });
      }

      // Check if document exists
      const document = await dbStorage.getDocument(id);
      if (!document) {
        return res.status(404).json({ error: 'Document not found' });
      }

      // This would normally fetch comments from storage
      // For now, return an empty array
      res.json([]);
    } catch (error) {
      handleApiError(error, res);
    }
  });

  // Add a comment to a document
  app.post('/api/documents/:id/comments', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid ID format' });
      }

      // Check if document exists
      const document = await dbStorage.getDocument(id);
      if (!document) {
        return res.status(404).json({ error: 'Document not found' });
      }

      const result = insertDocumentCommentSchema.safeParse({
        ...req.body,
        documentId: id
      });

      if (!result.success) {
        const errorMessage = fromZodError(result.error).message;
        return res.status(400).json({ error: errorMessage });
      }

      // This would normally create a comment in storage
      // For now, just return the comment data
      const now = new Date().toISOString();
      const newComment = {
        ...result.data,
        id: 1, // Placeholder ID
        createdAt: now,
        updatedAt: now
      };

      res.status(201).json(newComment);
    } catch (error) {
      handleApiError(error, res);
    }
  });

  // =============== Admin Lookup Tables Routes ===============

  // Generic lookup endpoint to handle all lookups
  app.get('/api/admin/lookups/:type', async (req: Request, res: Response) => {
    try {
      const type = req.params.type;
      let items = [];

      switch (type) {
        case 'developmentTypes':
          items = await dbStorage.getAllDevelopmentTypes();
          break;
        case 'financeModels':
          items = await dbStorage.getAllFinanceModels();
          break;
        case 'contractTypes':
          items = await dbStorage.getAllContractTypes();
          break;
        case 'fundingSources':
          items = await dbStorage.getAllFundingSources();
          break;
        case 'revenueStreams':
          items = await dbStorage.getAllRevenueStreams();
          break;
        case 'documentCategories':
          items = await dbStorage.getAllDocumentCategories();
          break;
        default:
          return res.status(400).json({ error: "Invalid lookup type" });
      }

      res.status(200).json(items);
    } catch (err) {
      handleApiError(err, res);
    }
  });

  // Create lookup item
  app.post('/api/admin/lookups/:type', async (req: Request, res: Response) => {
    try {
      const type = req.params.type;
      const data = {
        name: req.body.name,
        description: req.body.description || null
      };

      let item;
      switch (type) {
        case 'developmentTypes':
          item = await dbStorage.createDevelopmentType(data);
          break;
        case 'financeModels':
          item = await dbStorage.createFinanceModel(data);
          break;
        case 'contractTypes':
          item = await dbStorage.createContractType(data);
          break;
        case 'fundingSources':
          item = await dbStorage.createFundingSource(data);
          break;
        case 'revenueStreams':
          item = await dbStorage.createRevenueStream(data);
          break;
        case 'documentCategories':
          // Include iconName if provided
          item = await dbStorage.createDocumentCategory({
            ...data,
            iconName: req.body.iconName || null
          });
          break;
        default:
          return res.status(400).json({ error: "Invalid lookup type" });
      }

      res.status(201).json(item);
    } catch (err) {
      handleApiError(err, res);
    }
  });

  // Delete lookup item
  app.delete('/api/admin/lookups/:type/:id', async (req: Request, res: Response) => {
    try {
      const type = req.params.type;
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid ID format' });
      }

      let success;
      switch (type) {
        case 'developmentTypes':
          success = await dbStorage.deleteDevelopmentType(id);
          break;
        case 'financeModels':
          success = await dbStorage.deleteFinanceModel(id);
          break;
        case 'contractTypes':
          success = await dbStorage.deleteContractType(id);
          break;
        case 'fundingSources':
          success = await dbStorage.deleteFundingSource(id);
          break;
        case 'revenueStreams':
          success = await dbStorage.deleteRevenueStream(id);
          break;
        case 'documentCategories':
          success = await dbStorage.deleteDocumentCategory(id);
          break;
        default:
          return res.status(400).json({ error: "Invalid lookup type" });
      }

      if (success) {
        res.status(200).json({ message: `${type} item deleted successfully` });
      } else {
        res.status(404).json({ error: `${type} item not found` });
      }
    } catch (err) {
      handleApiError(err, res);
    }
  });

  // =============== Manuals Routes ===============

  // Get all manuals
  app.get('/api/manuals', async (req: Request, res: Response) => {
    try {
      const manuals = await dbStorage.getAllManuals();
      res.json(manuals);
    } catch (error) {
      handleApiError(error, res);
    }
  });

  // Get a specific manual
  app.get('/api/manuals/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid manual ID format' });
      }

      const manual = await dbStorage.getManual(id);
      if (!manual) {
        return res.status(404).json({ error: 'Manual not found' });
      }

      res.json(manual);
    } catch (error) {
      handleApiError(error, res);
    }
  });

  // Create a new manual
  app.post('/api/manuals', async (req: Request, res: Response) => {
    try {
      const validatedData = insertManualSchema.parse(req.body);

      // Let the database handle the timestamps with defaultNow()
      const manual = await dbStorage.createManual(validatedData);

      res.status(201).json(manual);
    } catch (error) {
      handleApiError(error, res);
    }
  });

  // Update a manual
  app.put('/api/manuals/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid manual ID format' });
      }

      const validatedData = insertManualSchema.partial().parse(req.body);
      const updatedManual = await dbStorage.updateManual(id, validatedData);

      if (!updatedManual) {
        return res.status(404).json({ error: 'Manual not found' });
      }

      res.json(updatedManual);
    } catch (error) {
      handleApiError(error, res);
    }
  });

  // Delete a manual
  app.delete('/api/manuals/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid manual ID format' });
      }

      const success = await dbStorage.deleteManual(id);
      if (!success) {
        return res.status(404).json({ error: 'Manual not found' });
      }

      res.status(204).send();
    } catch (error) {
      handleApiError(error, res);
    }
  });

  // =============== Manual Sections Routes ===============

  // Get sections by manual ID
  app.get('/api/manuals/:manualId/sections', async (req: Request, res: Response) => {
    try {
      const manualId = parseInt(req.params.manualId);
      if (isNaN(manualId)) {
        return res.status(400).json({ error: 'Invalid manual ID format' });
      }

      // Check if manual exists
      const existingManual = await dbStorage.getManual(manualId);
      if (!existingManual) {
        return res.status(404).json({ error: 'Manual not found' });
      }

      const sections = await dbStorage.getManualSectionsByManual(manualId);
      res.json(sections);
    } catch (error) {
      handleApiError(error, res);
    }
  });

  // Get section by ID
  app.get('/api/manual-sections/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid ID format' });
      }

      const section = await dbStorage.getManualSection(id);

      if (!section) {
        return res.status(404).json({ error: 'Section not found' });
      }

      res.json(section);
    } catch (error) {
      handleApiError(error, res);
    }
  });

  // Create a new manual section
  app.post('/api/manual-sections', async (req: Request, res: Response) => {
    try {
      const validatedData = insertManualSectionSchema.parse(req.body);

      // Let database handle the timestamps with defaultNow()
      const section = await dbStorage.createManualSection(validatedData);

      res.status(201).json(section);
    } catch (error) {
      handleApiError(error, res);
    }
  });

  // Update a manual section
  app.put('/api/manual-sections/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid section ID format' });
      }

      const validatedData = insertManualSectionSchema.partial().parse(req.body);
      const updatedSection = await dbStorage.updateManualSection(id, validatedData);

      if (!updatedSection) {
        return res.status(404).json({ error: 'Section not found' });
      }

      res.json(updatedSection);
    } catch (error) {
      handleApiError(error, res);
    }
  });

  // Delete a manual section
  app.delete('/api/manual-sections/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid section ID format' });
      }

      const success = await dbStorage.deleteManualSection(id);
      if (!success) {
        return res.status(404).json({ error: 'Section not found' });
      }

      res.status(204).send();
    } catch (error) {
      handleApiError(error, res);
    }
  });

  // =============== Content Types Routes ===============

  // Get all content types
  app.get('/api/content-types', async (req: Request, res: Response) => {
    try {
      const contentTypes = await dbStorage.getAllContentTypes();
      res.json(contentTypes);
    } catch (error) {
      handleApiError(error, res);
    }
  });

  // =============== States Routes ===============

  // Get all states
  app.get('/api/states', async (req: Request, res: Response) => {
    try {
      const states = await dbStorage.getAllStates();
      res.json(states);
    } catch (error) {
      handleApiError(error, res);
    }
  });

  // =============== Manual Contents Routes ===============

  // Get contents by section ID
  app.get('/api/manual-sections/:sectionId/contents', async (req: Request, res: Response) => {
    try {
      const sectionId = parseInt(req.params.sectionId);
      if (isNaN(sectionId)) {
        return res.status(400).json({ error: 'Invalid section ID format' });
      }

      // Check if section exists
      const existingSection = await dbStorage.getManualSection(sectionId);
      if (!existingSection) {
        return res.status(404).json({ error: 'Section not found' });
      }

      const contents = await dbStorage.getManualContentsBySection(sectionId);
      res.json(contents);
    } catch (error) {
      handleApiError(error, res);
    }
  });

  // Create a new content
  app.post('/api/manual-contents', async (req: Request, res: Response) => {
    try {
      const { stateIds, ...contentData } = req.body;
      const validatedContentData = insertManualContentSchema.parse(contentData);

      // Let the database handle timestamps with defaultNow()
      const content = await dbStorage.createManualContent(validatedContentData);

      // If stateIds are provided, set the content states
      if (stateIds && Array.isArray(stateIds) && stateIds.length > 0) {
        await dbStorage.setContentStates(content.id, stateIds);
      }

      // Get the content states to include in the response
      const contentStates = await dbStorage.getContentStates(content.id);

      res.status(201).json({
        ...content,
        states: contentStates
      });
    } catch (error) {
      handleApiError(error, res);
    }
  });

  // Update a content
  app.put('/api/manual-contents/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid content ID format' });
      }

      const { stateIds, ...contentData } = req.body;
      const validatedContentData = insertManualContentSchema.partial().parse(contentData);

      console.log(`Updating content ${id} with data:`, validatedContentData);
      console.log(`State IDs received:`, stateIds);

      const updatedContent = await dbStorage.updateManualContent(id, validatedContentData);

      if (!updatedContent) {
        return res.status(404).json({ error: 'Content not found' });
      }

      // If stateIds are provided, update the content states
      if (stateIds && Array.isArray(stateIds)) {
        console.log(`Setting content states for content ${id}:`, stateIds);
        console.log(`Content states data type: ${typeof stateIds}, is array: ${Array.isArray(stateIds)}`);
        console.log(`Raw stateIds from request:`, JSON.stringify(stateIds));

        try {
          await dbStorage.setContentStates(id, stateIds);
          console.log(`Content states set successfully for content ${id}`);
        } catch (stateError) {
          console.error(`Error setting content states for content ${id}:`, stateError);
          // Continue despite error to return the content update
        }
      } else {
        console.log(`No valid stateIds provided for content ${id}, value:`, stateIds);
      }

      // Get the updated content states to include in the response
      const contentStates = await dbStorage.getContentStates(id);
      console.log(`Retrieved content states after update for content ${id}:`, contentStates);
      console.log(`Number of states retrieved: ${contentStates.length}`);

      res.json({
        ...updatedContent,
        states: contentStates
      });
    } catch (error) {
      console.error("Error updating manual content:", error);
      handleApiError(error, res);
    }
  });

  // Delete a content
  app.delete('/api/manual-contents/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid content ID format' });
      }

      const success = await dbStorage.deleteManualContent(id);
      if (!success) {
        return res.status(404).json({ error: 'Content not found' });
      }

      res.status(204).send();
    } catch (error) {
      handleApiError(error, res);
    }
  });

  // Reorder contents
  app.put('/api/manual-contents/reorder', async (req: Request, res: Response) => {
    try {
      const { contents } = req.body;

      if (!contents || !Array.isArray(contents) || contents.length === 0) {
        return res.status(400).json({ error: 'Invalid request body. Expected an array of contents with id and orderId.' });
      }

      const success = await dbStorage.reorderManualContents(contents);

      if (!success) {
        return res.status(500).json({ error: 'Failed to reorder contents' });
      }

      res.status(200).json({ success: true });
    } catch (error) {
      handleApiError(error, res);
    }
  });

  // ================ Diagram Editor API Routes ================

  // Entity Categories Routes
  app.get('/api/entity-categories', async (req: Request, res: Response) => {
    try {
      const categories = await dbStorage.getAllEntityCategories();
      res.status(200).json(categories);
    } catch (error) {
      handleApiError(error, res);
    }
  });

  app.get('/api/entity-categories/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid category ID' });
      }

      const category = await dbStorage.getEntityCategory(id);
      if (!category) {
        return res.status(404).json({ message: 'Entity category not found' });
      }

      res.status(200).json(category);
    } catch (error) {
      handleApiError(error, res);
    }
  });

  app.post('/api/entity-categories', async (req: Request, res: Response) => {
    try {
      const { name, description } = req.body;

      if (!name) {
        return res.status(400).json({ message: 'Name is required' });
      }

      const category = await dbStorage.createEntityCategory({ name, description });
      res.status(201).json(category);
    } catch (error) {
      handleApiError(error, res);
    }
  });

  app.put('/api/entity-categories/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid category ID' });
      }

      const { name, description } = req.body;

      const updated = await dbStorage.updateEntityCategory(id, { name, description });
      if (!updated) {
        return res.status(404).json({ message: 'Entity category not found' });
      }

      res.status(200).json(updated);
    } catch (error) {
      handleApiError(error, res);
    }
  });

  app.delete('/api/entity-categories/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid category ID' });
      }

      const result = await dbStorage.deleteEntityCategory(id);
      if (!result) {
        return res.status(404).json({ message: 'Entity category not found' });
      }

      res.status(200).json({ message: 'Entity category deleted successfully' });
    } catch (error) {
      handleApiError(error, res);
    }
  });

  // Entities Routes
  app.get('/api/entities', async (req: Request, res: Response) => {
    try {
      const categoryId = req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined;

      let entities;
      if (categoryId && !isNaN(categoryId)) {
        entities = await dbStorage.getEntitiesByCategory(categoryId);
      } else {
        entities = await dbStorage.getAllEntities();
      }

      res.status(200).json(entities);
    } catch (error) {
      handleApiError(error, res);
    }
  });

  app.get('/api/entities/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid entity ID' });
      }

      const entity = await dbStorage.getEntity(id);
      if (!entity) {
        return res.status(404).json({ message: 'Entity not found' });
      }

      res.status(200).json(entity);
    } catch (error) {
      handleApiError(error, res);
    }
  });

  app.post('/api/entities', async (req: Request, res: Response) => {
    try {
      const { name, categoryId, description, contactName, contactEmail, contactPhone, address } = req.body;

      if (!name) {
        return res.status(400).json({ message: 'Name is required' });
      }

      if (!categoryId) {
        return res.status(400).json({ message: 'Category ID is required' });
      }

      const entity = await dbStorage.createEntity({ 
        name, 
        categoryId, 
        description, 
        contactName, 
        contactEmail, 
        contactPhone, 
        address 
      });

      res.status(201).json(entity);
    } catch (error) {
      handleApiError(error, res);
    }
  });

  app.put('/api/entities/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid entity ID' });
      }

      const { name, categoryId, description, contactName, contactEmail, contactPhone, address } = req.body;

      const updated = await dbStorage.updateEntity(id, { 
        name, 
        categoryId, 
        description, 
        contactName, 
        contactEmail, 
        contactPhone, 
        address 
      });

      if (!updated) {
        return res.status(404).json({ message: 'Entity not found' });
      }

      res.status(200).json(updated);
    } catch (error) {
      handleApiError(error, res);
    }
  });

  app.delete('/api/entities/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid entity ID' });
      }

      const result = await dbStorage.deleteEntity(id);
      if (!result) {
        return res.status(404).json({ message: 'Entity not found' });
      }

      res.status(200).json({ message: 'Entity deleted successfully' });
    } catch (error) {
      handleApiError(error, res);
    }
  });

  // Diagram Templates Routes
  app.get('/api/diagram-templates', async (req: Request, res: Response) => {
    try {
      const templates = await dbStorage.getAllDiagramTemplates();
      res.status(200).json(templates);
    } catch (error) {
      handleApiError(error, res);
    }
  });

  app.get('/api/diagram-templates/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid template ID' });
      }

      const template = await dbStorage.getDiagramTemplate(id);
      if (!template) {
        return res.status(404).json({ message: 'Diagram template not found' });
      }

      res.status(200).json(template);
    } catch (error) {
      handleApiError(error, res);
    }
  });

  app.post('/api/diagram-templates', async (req: Request, res: Response) => {
    try {
      const { name, description, layout, nodes, edges } = req.body;

      if (!name) {
        return res.status(400).json({ message: 'Name is required' });
      }

      // Ensure nodes and edges are valid JSON arrays
      const validatedNodes = Array.isArray(nodes) ? nodes : [];
      const validatedEdges = Array.isArray(edges) ? edges : [];

      const template = await dbStorage.createDiagramTemplate({ 
        name, 
        description, 
        layout: layout || 'hierarchical',
        nodes: validatedNodes, 
        edges: validatedEdges 
      });

      res.status(201).json(template);
    } catch (error) {
      handleApiError(error, res);
    }
  });

  app.put('/api/diagram-templates/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid template ID' });
      }

      const { name, description, layout, nodes, edges } = req.body;

      // Validate the incoming data
      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (layout !== undefined) updateData.layout = layout;
      if (nodes !== undefined) updateData.nodes = Array.isArray(nodes) ? nodes : [];
      if (edges !== undefined) updateData.edges = Array.isArray(edges) ? edges : [];

      const updated = await dbStorage.updateDiagramTemplate(id, updateData);
      if (!updated) {
        return res.status(404).json({ message: 'Diagram template not found' });
      }

      res.status(200).json(updated);
    } catch (error) {
      handleApiError(error, res);
    }
  });

  app.delete('/api/diagram-templates/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid template ID' });
      }

      const result = await dbStorage.deleteDiagramTemplate(id);
      if (!result) {
        return res.status(404).json({ message: 'Diagram template not found' });
      }

      res.status(200).json({ message: 'Diagram template deleted successfully' });
    } catch (error) {
      handleApiError(error, res);
    }
  });

  // Diagrams Routes
  app.get('/api/diagrams', async (req: Request, res: Response) => {
    try {
      const projectId = req.query.projectId ? parseInt(req.query.projectId as string) : undefined;
      const documentId = req.query.documentId ? parseInt(req.query.documentId as string) : undefined;

      let diagrams;
      if (projectId && !isNaN(projectId)) {
        diagrams = await dbStorage.getDiagramsByProject(projectId);
      } else if (documentId && !isNaN(documentId)) {
        diagrams = await dbStorage.getDiagramsByDocument(documentId);
      } else {
        diagrams = await dbStorage.getAllDiagrams();
      }

      res.status(200).json(diagrams);
    } catch (error) {
      handleApiError(error, res);
    }
  });

  app.get('/api/diagrams/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid diagram ID' });
      }

      const diagram = await dbStorage.getDiagram(id);
      if (!diagram) {
        return res.status(404).json({ message: 'Diagram not found' });
      }

      res.status(200).json(diagram);
    } catch (error) {
      handleApiError(error, res);
    }
  });

  app.post('/api/diagrams', async (req: Request, res: Response) => {
    try {
      const { name, description, templateId, projectId, documentId, nodeEntities } = req.body;

      if (!name) {
        return res.status(400).json({ message: 'Name is required' });
      }

      if (!templateId) {
        return res.status(400).json({ message: 'Template ID is required' });
      }

      if (!nodeEntities || typeof nodeEntities !== 'object') {
        return res.status(400).json({ message: 'Node entities mapping is required' });
      }

      const diagram = await dbStorage.createDiagram({ 
        name, 
        description, 
        templateId,
        projectId, 
        documentId,
        nodeEntities 
      });

      res.status(201).json(diagram);
    } catch (error) {
      handleApiError(error, res);
    }
  });

  app.put('/api/diagrams/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid diagram ID' });
      }

      const { name, description, projectId, documentId, nodeEntities } = req.body;

      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (projectId !== undefined) updateData.projectId = projectId;
      if (documentId !== undefined) updateData.documentId = documentId;
      if (nodeEntities !== undefined) updateData.nodeEntities = nodeEntities;

      const updated = await dbStorage.updateDiagram(id, updateData);
      if (!updated) {
        return res.status(404).json({ message: 'Diagram not found' });
      }

      res.status(200).json(updated);
    } catch (error) {
      handleApiError(error, res);
    }
  });

  app.delete('/api/diagrams/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid diagram ID' });
      }

      const result = await dbStorage.deleteDiagram(id);
      if (!result) {
        return res.status(404).json({ message: 'Diagram not found' });
      }

      res.status(200).json({ message: 'Diagram deleted successfully' });
    } catch (error) {
      handleApiError(error, res);
    }
  });

  // =============== UniPhi API Integration Routes ===============

  // Get projects from UniPhi
  app.get('/api/uniphi/projects', async (req: Request, res: Response) => {
    try {
      const projects = await uniphiApiClient.getProjects();
      res.json(projects);
    } catch (error) {
      console.error('Error fetching UniPhi projects:', error);
      res.status(500).json({ 
        error: 'Failed to fetch projects from UniPhi API', 
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Get a specific project from UniPhi
  app.get('/api/uniphi/projects/:id', async (req: Request, res: Response) => {
    try {
      const projectId = req.params.id;
      const project = await uniphiApiClient.getProject(projectId);
      res.json(project);
    } catch (error) {
      console.error(`Error fetching UniPhi project ${req.params.id}:`, error);
      res.status(500).json({ 
        error: 'Failed to fetch project from UniPhi API', 
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // API endpoint tester for UniPhi - test any endpoint
  app.get('/api/uniphi/test/:endpoint/:id?', async (req: Request, res: Response) => {
    try {
      const endpoint = req.params.endpoint;
      const id = req.params.id;

      // Ensure we have a valid token
      await uniphiApiClient.authenticate();

      const url = id 
        ? `${uniphiApiClient.baseUrl}/${endpoint}/${id}`
        : `${uniphiApiClient.baseUrl}/${endpoint}`;

      console.log(`Testing UniPhi endpoint: ${url}`);

      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${uniphiApiClient.accessToken}`,
          'Accept': 'application/json'
        }
      });

      res.json(response.data);
    } catch (error: any) {
      console.error('Error testing UniPhi endpoint:', error);
      if (axios.isAxiosError(error)) {
        res.status(error.response?.status || 500).json({
          error: `Failed to fetch from UniPhi API: ${error.message}`,
          response: error.response?.data || {},
          url: error.config?.url,
          method: error.config?.method
        });
      } else {
        res.status(500).json({
          error: 'Failed to fetch from UniPhi API',
          details: error instanceof Error ? error.message : String(error)
        });
      }
    }
  });

  const httpServer = createServer(app);
  // UniPhi API Schema endpoints
  app.get('/api/uniphi/schema/:endpoint', async (req: Request, res: Response) => {
    try {
      const endpoint = req.params.endpoint;
      const uniphiClient = new UniPhiApiClient(
        process.env.UNIPHI_CLIENT_ID || '',
        process.env.UNIPHI_CLIENT_SECRET || ''
      );

      // This is a mock implementation since we don't have actual schema fetching yet
      // In a real implementation, you'd fetch the schema from the UniPhi API if they provide that
      res.json({
        type: "object",
        properties: {
          ID: { type: "number", description: "Unique identifier for the record" },
          ProjID: { type: "string", description: "Project ID code" },
          Name: { type: "string", description: "Project name" },
          ParentProjID: { type: "string", description: "Parent project ID if applicable" },
          ParentName: { type: "string", description: "Parent project name if applicable" },
          IsParentProject: { type: "boolean", description: "Whether this is a parent project" },
          Sector: { type: "string", description: "Project sector" },
          ProjectType: { type: "string", description: "Type of project" },
          ServiceLine: { type: "string", description: "Service line" },
          Region: { type: "string", description: "Geographic region" },
          Location: { type: "string", description: "Project location" },
          CurrentPhase: { type: "string", description: "Current project phase" },
          Priority: { type: "string", description: "Project priority" },
          CreatedDate: { type: "string", format: "date-time", description: "When the project was created" },
          BaselineStartDate: { type: "string", format: "date-time", description: "Baseline start date" },
          BaselineFinishDate: { type: "string", format: "date-time", description: "Baseline finish date" },
          ActualStartDate: { type: "string", format: "date-time", description: "Actual start date" },
          ForecastStartDate: { type: "string", format: "date-time", description: "Forecast start date" },
          ForecastFinishDate: { type: "string", format: "date-time", description: "Forecast finish date" }
        },
        required: ["ID", "ProjID", "Name"]
      });
    } catch (err) {
      handleApiError(err, res);
    }
  });

  // Simple greeting endpoint
  app.get("/api/hello", (req, res) => {
    res.json({ message: "Hello from BlueCHP API!" });
  });

  // Register RiskTrackPro routes
  registerRiskTrackProRoutes(app);

  return httpServer;
}
// Import the register function from risk-track-pro-routes
import { registerRiskTrackProRoutes } from './risk-track-pro-routes';
import express, { Express } from "express";
import { Server } from "http";
import { log } from "./vite";
import { registerRiskTrackProRoutes } from "./risk-track-pro-routes";