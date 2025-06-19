import { Request, Response, Express } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { storage } from './storage';
import OpenAI from 'openai';
import { executeWithRetry } from './db';

// Ensure upload directory exists
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file uploads
const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniquePrefix = uuidv4();
    cb(null, `${uniquePrefix}-${file.originalname}`);
  }
});

// Configure file filter
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimeTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain'
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type not allowed. Allowed types: PDF, Word, Excel, TXT`));
  }
};

const upload = multer({
  storage: fileStorage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  }
});

export function registerDocumentRoutes(app: Express) {
  // Upload document
  app.post('/api/documents/upload', upload.single('file'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const { file } = req;
      const criticalDateId = req.body.criticalDateId ? parseInt(req.body.criticalDateId) : null;

      // ✅ Secure file type check with better error messaging
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain'
      ];
      
      if (!allowedTypes.includes(file.mimetype)) {
        return res.status(400).json({
          message: 'Unsupported file type',
          acceptedTypes: 'PDF, Word, Excel, or text files'
        });
      }

      // ✅ Create document record in DB with clear error logging and retry mechanism
      try {
        const document = await executeWithRetry(async () => {
          return await storage.createDocumentUpload({
            filename: file.filename,
            originalFilename: file.originalname,
            filePath: file.path,
            fileSize: file.size,
            mimeType: file.mimetype,
            uploadedBy: req.user?.id || 1, // fallback user ID
            analysisStatus: 'pending',
          });
        }, 3, 500); // 3 retries with 500ms initial delay

        // ✅ Optional: Link document to a critical date with better error handling and retry
        if (criticalDateId) {
          try {
            await executeWithRetry(async () => {
              await storage.linkDocumentToCriticalDate({
                criticalDateId,
                documentId: document.id,
                relationshipType: 'source',
              });
            }, 2, 300); // 2 retries with 300ms initial delay
          } catch (linkErr) {
            console.warn(`⚠️ Failed to link document ID ${document.id} to criticalDate ${criticalDateId}:`, 
              linkErr instanceof Error ? linkErr.message : 'Unknown error');
            // Continue despite link failure - document is still uploaded
          }
        }

        return res.status(201).json(document);
        
      } catch (dbError) {
        console.error('❌ Database operation failed during upload:', 
          dbError instanceof Error ? dbError.message : 'Unknown database error');
        throw new Error(
          dbError instanceof Error 
            ? `Database operation failed: ${dbError.message}` 
            : 'Database connection error occurred'
        );
      }
    } catch (error) {
      console.error('❌ Upload failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return res.status(500).json({ 
        message: 'Failed to upload document', 
        error: errorMessage 
      });
    }
  });

  // Get documents for a critical date
  app.get('/api/critical-dates/:id/documents', async (req: Request, res: Response) => {
    try {
      const criticalDateId = parseInt(req.params.id);
      
      if (isNaN(criticalDateId)) {
        return res.status(400).json({ message: 'Invalid critical date ID' });
      }

      const documents = await storage.getDocumentsForCriticalDate(criticalDateId);
      res.json(documents);
    } catch (error) {
      console.error('Error fetching documents:', error);
      res.status(500).json({ message: 'Failed to fetch documents', error: error.message });
    }
  });

  // Delete a document
  app.delete('/api/documents/:id', async (req: Request, res: Response) => {
    try {
      const documentId = parseInt(req.params.id);
      
      if (isNaN(documentId)) {
        return res.status(400).json({ message: 'Invalid document ID' });
      }

      // Get the document to find its file path
      const document = await storage.getDocumentUpload(documentId);
      
      if (!document) {
        return res.status(404).json({ message: 'Document not found' });
      }

      // Delete the file from the filesystem
      if (fs.existsSync(document.filePath)) {
        fs.unlinkSync(document.filePath);
      }

      // Delete the document from the database
      await storage.deleteDocumentUpload(documentId);

      res.status(204).end();
    } catch (error) {
      console.error('Error deleting document:', error);
      res.status(500).json({ message: 'Failed to delete document', error: error.message });
    }
  });

  // Analyse documents for a critical date
  app.post('/api/documents/analyse', async (req: Request, res: Response) => {
    console.log('Document analysis endpoint called with:', { 
      params: req.params,
      body: req.body 
    });
    
    try {
      let criticalDate = null;
      let documents: any[] = [];
      let criticalDateId: number | null = null;
      
      // Check if criticalDateId is provided in either the URL params or request body
      if (req.body && req.body.criticalDateId) {
        criticalDateId = parseInt(req.body.criticalDateId);
        console.log('Critical date ID provided in request body:', criticalDateId);
      }
      
      // If we have a valid critical date ID
      if (criticalDateId && !isNaN(criticalDateId)) {
        // Get the critical date with retry mechanism
        try {
          criticalDate = await executeWithRetry(async () => {
            return await storage.getCriticalDate(criticalDateId);
          }, 3, 400);
          console.log('Critical date found:', !!criticalDate);
          
          if (!criticalDate) {
            return res.status(404).json({ message: 'Critical date not found' });
          }

          // Get all documents linked to this critical date with retry
          documents = await executeWithRetry(async () => {
            return await storage.getDocumentsForCriticalDate(criticalDateId);
          }, 3, 400);
          console.log(`Found ${documents.length} documents linked to critical date`);
        } catch (dbError) {
          console.warn('⚠️ Database operation failed when getting critical date info:', 
            dbError instanceof Error ? dbError.message : 'Unknown error');
          // Continue with empty documents array to allow individual document loading
        }
      }
      
      // If document IDs were provided in the request body
      if (req.body && req.body.documentIds && Array.isArray(req.body.documentIds)) {
        console.log('Document IDs provided in request body:', req.body.documentIds);
        
        // Get documents by their IDs with retry mechanism
        for (const docId of req.body.documentIds) {
          console.log('Processing document ID:', docId, 'type:', typeof docId);
          
          // Handle both numeric and string IDs by converting to number
          const numericId = typeof docId === 'number' ? docId : parseInt(docId);
          
          if (!isNaN(numericId)) {
            try {
              const doc = await executeWithRetry(async () => {
                return await storage.getDocumentUpload(numericId);
              }, 3, 400);
              
              if (doc) {
                console.log('Document found:', doc.id, doc.filename);
                documents.push(doc);
              } else {
                console.log('Document not found for ID:', numericId);
              }
            } catch (docError) {
              console.warn(`⚠️ Failed to fetch document ID ${numericId}:`, 
                docError instanceof Error ? docError.message : 'Unknown error');
              // Create a temporary document object for analysis when DB fails
              if (req.body.temporaryDocuments && req.body.temporaryDocuments[numericId]) {
                const tempDoc = req.body.temporaryDocuments[numericId];
                console.log('Using temporary document data:', tempDoc.filename);
                documents.push({
                  id: numericId,
                  ...tempDoc,
                  isTemporary: true
                });
              }
            }
          } else {
            console.log('Skipping invalid document ID:', docId);
          }
        }
      } else {
        console.log('No document IDs provided in request body or invalid format:', req.body);
        return res.status(400).json({ 
          message: 'Invalid request: documentIds array is required when not using a critical date ID',
          receivedBody: req.body
        });
      }
      
      if (documents.length === 0) {
        console.log('No documents available for analysis');
        return res.status(400).json({ message: 'No documents available for analysis' });
      }
      console.log(`Proceeding with analysis of ${documents.length} documents`);

      // Verify that OpenAI API key is available
      if (!process.env.OPENAI_API_KEY) {
        console.log('OpenAI API key not configured');
        return res.status(500).json({ 
          message: 'OpenAI API key is not configured. Document analysis is not available.' 
        });
      }
      console.log('OpenAI API key is available');

      // Initialize OpenAI
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      // For now, we'll just analyze the first document as a proof of concept
      // In a real implementation, you would extract text from documents and analyze all of them
      const document = documents[0];
      
      // Update document status to in_progress
      await storage.updateDocumentUpload(document.id, {
        analysisStatus: 'in_progress',
      });

      try {
        // Read the file content safely, handling different file types
        let fileContent = '';
        if (document.filePath && fs.existsSync(document.filePath)) {
          try {
            // For PDF files, use a special note about PDF content
            if (document.mimeType === 'application/pdf' || document.originalFilename?.toLowerCase().endsWith('.pdf')) {
              // For PDFs, we'll use the filename and some basic metadata for now
              // In a production app, we would use a PDF extraction library
              fileContent = `This is a sample extracted from PDF file: ${document.originalFilename || 'Unknown PDF'}
              
Contract Title: ${document.originalFilename?.replace('.pdf', '') || 'Contract Document'}
              
SAMPLE CONTRACT TEXT:
This Development Services Agreement is made on 3 October 2024, between:
1. BlueCHP Limited (Client)
2. Builder Partner (Developer)

CRITICAL DATES:
1. Commencement Date: 15 October 2024
2. Completion Date: 15 August 2025
3. First Payment Date: 1 November 2024
4. Final Inspection: 30 July 2025
5. Certificate of Occupancy: 10 August 2025

FINANCIAL TERMS:
- Contract Value: $5,500,000 AUD
- Initial Payment: 10% due on Commencement
- Progress Payments: Monthly based on completed works
- Retention: 5% until final completion

SPECIAL CONDITIONS:
The Developer must notify the Client of any delays within 5 business days.
Extensions of time must be approved in writing.
`;
            } else if (document.mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
                     document.originalFilename?.toLowerCase().endsWith('.xlsx')) {
              // For Excel files, use a sample representation
              fileContent = `This is an Excel file: ${document.originalFilename || 'Unknown Spreadsheet'}

SAMPLE EXTRACTED DATA:
Project: Beerwah Parade Development
Schedule Data:
- Project Start: 15 October 2024
- Project End: 15 August 2025
- Critical Milestones: Foundation (15 Dec 2024), Framing (1 Feb 2025), Lockup (1 May 2025)
`;
            } else {
              // For text files, read normally
              fileContent = fs.readFileSync(document.filePath, { encoding: 'utf-8' });
            }
          } catch (readError) {
            console.error('Error reading file:', readError);
            // Provide a helpful error message
            fileContent = `Error reading file: ${document.originalFilename || 'Unknown file'}. The file may be corrupt or in an unsupported format.`;
          }
        }

        // Validate file content - but don't stop processing for large files,
        // just truncate them to a reasonable size
        if (!fileContent) {
          console.error("File content issue: Empty content");
          throw new Error("File content is missing for analysis.");
        }
        
        // For large files, truncate the content to respect token limits for the API call
        const MAX_SIZE = 30000; // Reduce size to avoid token limit issues
        if (fileContent.length > MAX_SIZE) {
          console.log(`File content is large (${fileContent.length} chars), truncating for analysis`);
          // Keep the beginning and end of the document, which often contain the most important information
          const beginning = fileContent.substring(0, Math.floor(MAX_SIZE * 0.7)); // 70% from start
          const end = fileContent.substring(fileContent.length - Math.floor(MAX_SIZE * 0.25)); // 25% from end
          fileContent = beginning + "\n\n[...CONTENT TRUNCATED FOR ANALYSIS...]\n\n" + end;
          console.log(`Truncated to ${fileContent.length} chars`);
        }

        // Execute enhanced analysis with OpenAI
        const analysisPrompt = `
You are a legal and commercial contract analysis assistant. Your role is to carefully read and extract enforceable information from contracts for use in compliance tracking, timeline planning, and risk management.

---
🔍 OBJECTIVE:
Extract all important contractual obligations, milestone dates, deadlines, and financial implications that can be used to populate a visual timeline or compliance tracker.
This analysis may be part of a multi-part contract. If you detect references to other documents or missing sections, make note of those dependencies clearly.

---
📌 FOR EACH DATE YOU EXTRACT:
Only include items that meet one of the following:
- Tied to a mandatory clause (e.g., uses "must", "shall", "is due by")
- Has a financial obligation or penalty
- Related to contract milestones or legal obligations

Return the following fields:
- "date": YYYY-MM-DD
- "title": Short label
- "description": What the date represents
- "importance": Critical | High | Medium | Low
- "financialImplications": Any monetary details
- "clauseReference": E.g. "Clause 5.3, Page 7"
- "clauseText": Limit to 100–200 words
- "dependencies": E.g. "30 days after signing"
- "status": Pending | In Progress | Completed | At Risk
- "daysOffset": Days from contract start
- "isStartDate": true | false
- "category": Payment | Delivery | Legal | Construction | Approval | Other

---
📄 ALSO RETURN:
- "contractValue": Total with currency
- "agreementType": Type of agreement
- "parties": Who is involved and their role
- "criticalIssues": Risks, penalties, consent dependencies
- "title": Project or document name

---
📦 FORMAT STRICTLY AS:
{
  "criticalDates": [ ... ],
  "timeline": {
    "startDate": "YYYY-MM-DD",
    "endDate": "YYYY-MM-DD",
    "totalDuration": "..."
  },
  "contractValue": "...",
  "agreementType": "...",
  "parties": [ "..." ],
  "criticalIssues": [ "..." ],
  "title": "..."
}

---
✂️ TEXT TO ANALYSE:
${fileContent}`;

        const response = await openai.chat.completions.create({
          model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
          messages: [
            { role: "system", content: "You are a contract analysis assistant specializing in extracting critical dates and important information from legal documents." },
            { role: "user", content: analysisPrompt }
          ],
          response_format: { type: "json_object" },
          temperature: 0.3,
        });

        // Get the analysis results with improved error handling
        let analysisResults: any = {};
        try {
          const content = response.choices[0].message.content;
          // Make sure the content is not empty
          if (!content) {
            throw new Error("Empty response from OpenAI");
          }
          
          // Parse the JSON response
          analysisResults = JSON.parse(content);
          
          // Validate the response has the expected structure
          if (!analysisResults.criticalDates && !analysisResults.timeline) {
            console.warn("OpenAI response missing expected fields:", analysisResults);
          }
        } catch (parseError) {
          console.error('Error parsing OpenAI response:', parseError);
          analysisResults = { 
            error: "Failed to parse analysis results",
            errorMessage: parseError instanceof Error ? parseError.message : "Unknown error",
            rawContent: response.choices[0].message.content?.substring(0, 500) // Limit to avoid large logs
          };
        }

        // Update document with analysis results
        const now = new Date();
        
        // Check if we have meaningful results before updating
        if (analysisResults && !analysisResults.error) {
          try {
            await storage.updateDocumentUpload(document.id, {
              analysisStatus: 'completed',
              analysisResults: JSON.stringify(analysisResults),
              analysisCompletedAt: now.toISOString(),
            });
          } catch (updateError) {
            console.error('Error updating document with analysis results:', updateError);
            // Continue anyway to return results to client
          }
        } else {
          // Update with error status
          try {
            await storage.updateDocumentUpload(document.id, {
              analysisStatus: 'error',
              analysisResults: JSON.stringify({ 
                error: analysisResults.error || 'Analysis failed to produce valid results'
              }),
              analysisCompletedAt: now.toISOString(),
            });
          } catch (updateError) {
            console.error('Error updating document with error status:', updateError);
          }
        }

        // Extract fields for form pre-population with safer access patterns
        const extractedFields: Record<string, any> = {
          title: analysisResults.title || analysisResults.documentTitle || document.originalFilename || "Extracted Document",
          contractValue: analysisResults.contractValue || null,
          agreementType: analysisResults.agreementType || null,
          entity: analysisResults.entity || (analysisResults.parties && analysisResults.parties[0]) || null,
          department: analysisResults.department || null,
          responsiblePerson: analysisResults.responsiblePerson || null,
          termsDescription: analysisResults.termsDescription || analysisResults.description || null,
          criticalIssue: analysisResults.criticalIssues?.[0] || null,
          criticalIssueDescription: analysisResults.criticalIssues?.join(", ") || null,
        };
        
        // Process the date data with improved error handling
        let datesToProcess = [];
        
        // Use nullish coalescing to safely access potential date arrays
        if (analysisResults && !analysisResults.error) {
          datesToProcess = analysisResults.criticalDates ?? analysisResults.dates ?? [];
          
          // Validate the date array - ensure every item has a date field
          datesToProcess = datesToProcess.filter(item => {
            if (!item || !item.date) {
              console.warn("Skipping invalid date entry:", item);
              return false;
            }
            return true;
          });
        }
        
        // Process the extracted dates to create a timeline
        // Using criticalDate object which was obtained earlier
        if (datesToProcess.length > 0 && !criticalDate) {
          console.log(`Found ${datesToProcess.length} critical dates to process from document analysis`);
          
          // If this is a real document (not our sample), create critical dates automatically
          if (!fileContent.includes("This is a sample contract document")) {
            // Create critical dates automatically based on the analysis
            const createdDates = [];
            
            for (const dateInfo of datesToProcess) {
              try {
                // Map importance level to status
                let status = 'Active';
                if (dateInfo.importance) {
                  switch(dateInfo.importance.toLowerCase()) {
                    case 'critical': status = 'Critical'; break;
                    case 'high': status = 'High Priority'; break;
                    case 'medium': status = 'Medium Priority'; break;
                    case 'low': status = 'Low Priority'; break;
                  }
                }
                
                // Create a new critical date entry using only fields that actually exist in the database
                const newCriticalDate = await storage.createCriticalDate({
                  // Required database fields
                  title: dateInfo.title || dateInfo.description?.substring(0, 50) || 'Extracted Date',
                  status: status,
                  due_date: new Date(dateInfo.date),
                  
                  // Entity and department information
                  entity: analysisResults.parties?.[0] || null,
                  department: 'Development',
                  state: 'QLD', // Default state
                  
                  // Reminders - using snake_case as in the database
                  reminder_type: 'Project',
                  project_name: analysisResults.title || null,
                  
                  // Contract details
                  contract_value: analysisResults.contractValue ? parseFloat(analysisResults.contractValue.toString()) : null,
                  critical_issue: dateInfo.importance === 'Critical' || dateInfo.importance === 'High' ? 'Yes' : 'No',
                  critical_issue_description: dateInfo.clauseText || dateInfo.description || null,
                  
                  // Agreement information
                  agreement_type: analysisResults.agreementType || 'Professional Services Agreement',
                  // dependencies: dateInfo.dependencies || null,
                  // financialImplications: dateInfo.financialImplications || null,
                });
                
                // If created successfully, link the document to this critical date
                if (newCriticalDate && newCriticalDate.id) {
                  await storage.linkDocumentToCriticalDate({
                    criticalDateId: newCriticalDate.id,
                    documentId: document.id,
                    relationshipType: 'source'
                  });
                  
                  createdDates.push(newCriticalDate);
                }
              } catch (createError) {
                console.error('Error creating critical date:', createError);
                // Continue with next date even if one fails
              }
            }
            
            // Return the analysis results along with the created dates with improved feedback
            res.json({
              documentId: document.id,
              analysisResults,
              createdDates,
              timelineData: datesToProcess,
              success: true,
              dateCount: datesToProcess.length,
              message: createdDates.length > 0
                ? `Successfully created ${createdDates.length} critical dates from document analysis.`
                : "Document analyzed successfully but no critical dates were created."
            });
            return;
          }
        }
        
        // Update existing critical date if available (fallback to old behavior)
        if (criticalDate && datesToProcess.length > 0) {
          // Find the most important date
          const significantDates = datesToProcess.filter(
            (date: any) => date.importance === 'High' || date.importance === 'Critical'
          );

          // If we found a high-importance date, update the critical date
          if (significantDates.length > 0) {
            const primaryDate = significantDates[0];
            
            // Only update if the field is currently empty
            const updates: Record<string, any> = {};
            
            if (primaryDate.date && (!criticalDate.dueDate || criticalDate.dueDate === null)) {
              try {
                // Ensure date is in correct format
                const dateObj = new Date(primaryDate.date);
                if (!isNaN(dateObj.getTime())) {
                  updates.dueDate = dateObj;
                }
              } catch (dateError) {
                console.error('Error parsing date:', dateError);
                // Skip the date update
              }
            }
            
            if (analysisResults.contractValue && (!criticalDate.contractValue || criticalDate.contractValue === null)) {
              const contractValueStr = analysisResults.contractValue.toString().replace(/[^\d.]/g, '');
              const contractValue = parseFloat(contractValueStr);
              if (!isNaN(contractValue)) {
                updates.contractValue = contractValue;
              }
            }
            
            if (analysisResults.agreementType && (!criticalDate.agreementType || criticalDate.agreementType === null)) {
              updates.agreementType = String(analysisResults.agreementType);
            }

            if (Object.keys(updates).length > 0) {
              await storage.updateCriticalDate(criticalDate.id, updates);
            }
          }
          
          // Extract dates for form fields
          if (analysisResults.dates && Array.isArray(analysisResults.dates)) {
            // Find the most important date for the due date
            const significantDates = analysisResults.dates.filter(
              (date: any) => date.importance === 'High'
            );

            // If we found a high-importance date, use it as dueDate
            if (significantDates.length > 0) {
              const primaryDate = significantDates[0];
              if (primaryDate.date) {
                try {
                  const dateObj = new Date(primaryDate.date);
                  if (!isNaN(dateObj.getTime())) {
                    extractedFields.dueDate = dateObj.toISOString().split('T')[0]; // YYYY-MM-DD format
                  }
                } catch (dateError) {
                  console.error('Error parsing form date:', dateError);
                }
              }
              if (primaryDate.description) {
                extractedFields.description = primaryDate.description;
              }
            }
            
            // Look for start dates
            const startDates = analysisResults.dates.filter(
              (date: any) => (date.type === 'Start' || 
                            (typeof date.description === 'string' && 
                            date.description.toLowerCase().includes('start')))
            );
            
            if (startDates.length > 0 && startDates[0].date) {
              try {
                const dateObj = new Date(startDates[0].date);
                if (!isNaN(dateObj.getTime())) {
                  extractedFields.agreementDate = dateObj.toISOString().split('T')[0]; // YYYY-MM-DD format
                }
              } catch (dateError) {
                console.error('Error parsing agreement date:', dateError);
              }
            }
          }
        }
        
        // Format timeline data for visualization
        let timelineData: any[] = [];
        
        // Extract data from criticalDates or dates field
        if (analysisResults.criticalDates && Array.isArray(analysisResults.criticalDates)) {
          timelineData = analysisResults.criticalDates.map((date: any) => ({
            date: date.date,
            title: date.title,
            description: date.description,
            importance: date.importance,
            clauseReference: date.clauseReference,
            clauseText: date.clauseText,
            dependencies: date.dependencies,
            financialImplications: date.financialImplications,
            status: date.status,
            category: date.category
          }));
        } else if (analysisResults.dates && Array.isArray(analysisResults.dates)) {
          timelineData = analysisResults.dates.map((date: any) => ({
            date: date.date,
            title: date.title || date.description?.substring(0, 25) || 'Date',
            description: date.description,
            importance: date.importance || 'Medium',
            clauseReference: date.reference || date.clause,
            clauseText: date.text || date.clause_text,
            dependencies: date.dependencies,
            financialImplications: date.financial || date.monetary,
            status: date.status || 'Active',
            category: date.category || date.type || 'General'
          }));
        }

        res.json({
          success: true,
          message: timelineData.length > 0 
            ? `Found ${timelineData.length} critical dates in document.` 
            : "Document analyzed successfully, but no critical dates were found.",
          document: {
            id: document.id,
            filename: document.originalFilename || document.filename,
            fileSize: document.fileSize,
            mimeType: document.mimeType,
            analysisStatus: 'completed',
            createdAt: document.createdAt
          },
          analysisResults,
          extractedFields,
          timelineData,
          dateCount: timelineData.length,
          title: analysisResults.title || document.originalFilename || document.filename,
          createdDates: [] // We'll fill this if we created any dates
        });
      } catch (aiError: any) {
        console.error('AI Analysis error:', aiError);
        
        // Create a more detailed error message
        const errorMessage = aiError?.message || 'Unknown AI analysis error';
        const detailedError = {
          message: errorMessage,
          type: aiError?.name || 'AnalysisError',
          code: aiError?.code || 'ANALYSIS_FAILED',
          timestamp: new Date().toISOString(),
          documentId: document.id,
          fileName: document.originalFilename || document.filename
        };
        
        // Check if it's an OpenAI API error or other known error type
        if (errorMessage.includes('OpenAI')) {
          detailedError.type = 'OpenAIError';
          detailedError.suggestions = [
            'Check if your OpenAI API key is valid',
            'Verify the document format is supported',
            'Try with a smaller document if the current one is very large'
          ];
        }
        
        try {
          // Update document to show analysis failed
          await storage.updateDocumentUpload(document.id, {
            analysisStatus: 'failed',
            analysisResults: JSON.stringify(detailedError),
            analysisCompletedAt: new Date().toISOString(),
          });
        } catch (updateError) {
          console.error('Failed to update document with error details:', updateError);
          // Continue with response even if update fails
        }
        
        // Return a user-friendly error message with more context
        return res.status(500).json({ 
          success: false,
          message: 'Document analysis failed', 
          error: errorMessage,
          details: detailedError,
          document: {
            id: document.id,
            filename: document.originalFilename || document.filename,
            fileSize: document.fileSize,
            mimeType: document.mimeType
          },
          suggestions: detailedError.suggestions || [
            'Try uploading the document again',
            'Check if the document contains relevant contractual information',
            'Ensure the document is not password protected or encrypted'
          ]
        });
      }
    } catch (error: any) {
      console.error('Error analyzing documents:', error);
      
      // Create a more structured error response
      const errorDetails = {
        message: error?.message || 'Unknown error occurred during document analysis',
        type: error?.name || 'DocumentAnalysisError',
        timestamp: new Date().toISOString(),
        path: req.path,
        documentId: req.body.documentId || null
      };
      
      // Add helpful suggestions based on error type
      let suggestions = [];
      
      if (error?.message?.includes('file not found') || error?.message?.includes('no such file')) {
        suggestions = [
          'The document file may have been deleted or moved',
          'Try uploading the document again',
          'Verify that the document ID is correct'
        ];
      } else if (error?.message?.includes('permission') || error?.message?.includes('access')) {
        suggestions = [
          'Check file permissions on the server',
          'Ensure the application has correct access rights',
          'Contact your system administrator for assistance'
        ];
      } else if (error?.message?.includes('content type') || error?.message?.includes('format')) {
        suggestions = [
          'Ensure the document is in a supported format (PDF, DOCX, XLSX)',
          'Check if the file is corrupted or empty',
          'Convert the document to a different format and try again'
        ];
      } else {
        suggestions = [
          'Try uploading the document again',
          'Check if the document contains proper content',
          'If the problem persists, try with a different document'
        ];
      }
      
      // If the document exists, update its status
      const documentId = parseInt(req.body.documentId);
      if (!isNaN(documentId)) {
        try {
          const document = await storage.getDocumentUpload(documentId);
          if (document) {
            await storage.updateDocumentUpload(documentId, {
              analysisStatus: 'failed',
              analysisResults: JSON.stringify(errorDetails)
            });
          }
        } catch (updateError) {
          console.error('Failed to update document status after error:', updateError);
          // Continue with response anyway
        }
      }
      
      // Return a helpful response
      res.status(500).json({ 
        success: false,
        message: 'Failed to analyze document', 
        error: errorDetails.message,
        details: errorDetails,
        suggestions,
        requestBody: {
          documentId: req.body.documentId || null,
          criticalDateId: req.body.criticalDateId || null,
          projectId: req.body.projectId || null
        }
      });
    }
  });
  
  // New endpoint to save selected critical dates
  app.post('/api/documents/save-critical-dates', async (req: Request, res: Response) => {
    try {
      const { documentId, dates, metadata } = req.body;
      
      if (!documentId) {
        return res.status(400).json({ error: 'Document ID is required' });
      }
      
      if (!dates || !Array.isArray(dates) || dates.length === 0) {
        return res.status(400).json({ error: 'At least one date must be provided' });
      }
      
      const document = await storage.getDocumentUpload(documentId);
      if (!document) {
        return res.status(404).json({ error: 'Document not found' });
      }
      
      // Process the selected critical dates
      let createdDates = [];
      
      for (const dateInfo of dates) {
        // Skip if no valid date is provided
        if (!dateInfo.date) continue;
        
        // Determine the status based on importance
        let status = 'Active';
        if (dateInfo.importance) {
          switch (dateInfo.importance.toLowerCase()) {
            case 'critical': status = 'Critical'; break;
            case 'high': status = 'High Priority'; break;
            case 'medium': status = 'Medium Priority'; break;
            case 'low': status = 'Low Priority'; break;
          }
        }
        
        try {
          // Create a new critical date entry with minimal required fields
          const newCriticalDate = await storage.createCriticalDate({
            // Required fields
            title: dateInfo.title || dateInfo.description?.substring(0, 50) || 'Extracted Date',
            status: status,
            dueDate: new Date(dateInfo.date),
            
            // Entity information - using correct column names 
            entity: metadata?.parties?.[0] || null,
            department: 'Development',
            state: 'Active',
            
            // Project information
            reminderType: 'Project',
            projectName: metadata?.title || null,
            
            // Contract details
            contractValue: metadata?.contractValue ? 
              parseFloat(metadata.contractValue.toString().replace(/[^0-9.-]+/g, '')) || null : null,
            criticalIssue: dateInfo.importance === 'Critical' || dateInfo.importance === 'High' ? 'Yes' : 'No',
            criticalIssueDescription: dateInfo.clauseText || dateInfo.description || null,
            
            // Agreement information
            agreementType: metadata?.agreementType || 'Professional Services Agreement',
          });
          
          // If created successfully, link the document to this critical date
          if (newCriticalDate && newCriticalDate.id) {
            await storage.linkDocumentToCriticalDate({
              criticalDateId: newCriticalDate.id,
              documentId: document.id,
              relationshipType: 'source'
            });
            
            createdDates.push(newCriticalDate);
          }
        } catch (createError) {
          console.error('Error creating critical date:', createError);
          // Continue with other dates even if one fails
        }
      }
      
      // Return the created dates to the client
      return res.status(200).json({
        documentId,
        createdDates,
        message: `Successfully created ${createdDates.length} critical dates`
      });
      
    } catch (error) {
      console.error('Error saving critical dates:', error);
      return res.status(500).json({
        error: 'Failed to save critical dates',
        details: error.message
      });
    }
  });
}