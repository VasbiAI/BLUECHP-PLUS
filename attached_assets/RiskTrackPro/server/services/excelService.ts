import { read, utils } from 'xlsx';
import { InsertProjectTask, InsertScheduleUpload, InsertTaskRiskLink } from '@shared/schema';
import { storage } from '../storage';
import { suggestTaskRiskLinksWithAI } from './openaiService';

type ColumnMap = {
  [key: string]: string;
}

interface ParsedTaskData {
  taskId: string;
  taskName: string;
  percentComplete: number;
  startDate: string | null;
  finishDate: string | null;
  duration: number | null;
  predecessors: string | null;
  successors: string | null;
  taskType: string | null;
  notes: string | null;
  priority: number | null;
  milestoneFlag: boolean | null;
  resources: string | null;
}

// Helper function to normalize dates from Excel
function normalizeDate(excelDate: any): string | null {
  if (!excelDate) return null;
  
  // Handle string dates
  if (typeof excelDate === 'string') {
    try {
      const date = new Date(excelDate);
      if (isNaN(date.getTime())) return null;
      return date.toISOString().split('T')[0]; // return YYYY-MM-DD
    } catch (e) {
      return null;
    }
  }
  
  // Handle Excel serial dates (days since 1900-01-01)
  if (typeof excelDate === 'number') {
    try {
      // Need to adjust for Excel's date system quirk (Excel treats 1900 as a leap year)
      const date = new Date((excelDate - (excelDate > 59 ? 1 : 0) - 25569) * 86400 * 1000);
      if (isNaN(date.getTime())) return null;
      return date.toISOString().split('T')[0];
    } catch (e) {
      return null;
    }
  }
  
  return null;
}

// Helper function to normalize percentage values
function normalizePercentage(value: any): number {
  if (value === undefined || value === null) return 0;
  
  // If it's already a number, constrain to 0-100
  if (typeof value === 'number') {
    return Math.min(100, Math.max(0, value));
  }
  
  // If it's a string, try to parse it
  if (typeof value === 'string') {
    // Remove any % sign
    const cleanValue = value.replace('%', '').trim();
    try {
      return Math.min(100, Math.max(0, parseFloat(cleanValue)));
    } catch (e) {
      return 0;
    }
  }
  
  return 0;
}

// Helper function to normalize text values
function normalizeText(value: any): string | null {
  if (value === undefined || value === null) return null;
  return String(value).trim() || null;
}

// Helper function to normalize number values
function normalizeNumber(value: any): number | null {
  if (value === undefined || value === null) return null;
  
  if (typeof value === 'number') return value;
  
  if (typeof value === 'string') {
    try {
      return parseFloat(value);
    } catch (e) {
      return null;
    }
  }
  
  return null;
}

// Helper function to normalize boolean values
function normalizeBoolean(value: any): boolean | null {
  if (value === undefined || value === null) return null;
  
  if (typeof value === 'boolean') return value;
  
  if (typeof value === 'number') return value !== 0;
  
  if (typeof value === 'string') {
    const lowerValue = value.toLowerCase().trim();
    if (['yes', 'true', '1', 'y'].includes(lowerValue)) return true;
    if (['no', 'false', '0', 'n'].includes(lowerValue)) return false;
  }
  
  return null;
}

export async function parseExcelSchedule(
  projectId: number, 
  fileBuffer: Buffer, 
  filename: string,
  username: string
): Promise<{
  uploadId: number;
  taskCount: number;
  completedCount: number;
}> {
  try {
    // Read the file
    const workbook = read(fileBuffer, { type: 'buffer' });
    const firstSheet = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheet];
    
    // Get the data as an array of objects
    const rawData = utils.sheet_to_json<any>(worksheet);
    
    if (!rawData || !rawData.length) {
      throw new Error('No task data found in the Excel file');
    }
    
    // Try to auto-detect columns based on the first row
    const columnMap: ColumnMap = {};
    const firstRow = rawData[0];
    const possibleColumns = Object.keys(firstRow);
    
    // Map for common column names - we check if the column name includes these patterns
    const columnPatterns = {
      taskId: ['id', 'task id', 'unique id', 'uniqueid', 'task_id', 'taskid', 'uid', 'guid', 'task #', 'task no'],
      taskName: ['name', 'task name', 'task', 'title', 'task_name', 'taskname', 'description'],
      percentComplete: ['% complete', 'percent complete', 'complete', 'percentage', 'completion', '% comp', 'percent'],
      startDate: ['start', 'start date', 'begin date', 'begin', 'date start', 'from date'],
      finishDate: ['finish', 'finish date', 'end date', 'end', 'date finish', 'to date', 'due date'],
      duration: ['duration', 'time', 'days', 'length', 'period'],
      predecessors: ['predecessor', 'predecessors', 'prev', 'before', 'prior tasks'],
      successors: ['successor', 'successors', 'next', 'after', 'following tasks'],
      taskType: ['type', 'task type', 'category'],
      notes: ['note', 'notes', 'comment', 'comments', 'description', 'details'],
      priority: ['priority', 'importance', 'prio'],
      milestoneFlag: ['milestone', 'is milestone', 'milestone flag'],
      resources: ['resource', 'resources', 'assignee', 'assigned to', 'assigned']
    };
    
    // Try to match each possible column to a known field
    for (const col of possibleColumns) {
      const lowerCol = col.toLowerCase();
      
      for (const [field, patterns] of Object.entries(columnPatterns)) {
        if (patterns.some(pattern => lowerCol.includes(pattern.toLowerCase()))) {
          columnMap[field] = col;
          break;
        }
      }
    }
    
    // If we still haven't found some key fields, look for exact matches for common MS Project column names
    if (!columnMap.taskId && possibleColumns.includes('ID')) columnMap.taskId = 'ID';
    if (!columnMap.taskName && possibleColumns.includes('Task Name')) columnMap.taskName = 'Task Name';
    if (!columnMap.percentComplete && possibleColumns.includes('% Complete')) columnMap.percentComplete = '% Complete';
    if (!columnMap.startDate && possibleColumns.includes('Start')) columnMap.startDate = 'Start';
    if (!columnMap.finishDate && possibleColumns.includes('Finish')) columnMap.finishDate = 'Finish';
    if (!columnMap.duration && possibleColumns.includes('Duration')) columnMap.duration = 'Duration';
    if (!columnMap.predecessors && possibleColumns.includes('Predecessors')) columnMap.predecessors = 'Predecessors';
    
    // Make sure we have at least the required fields
    if (!columnMap.taskId || !columnMap.taskName) {
      throw new Error('Required columns (Task ID and Task Name) were not found in the Excel file');
    }
    
    // Parse all tasks in the file
    const tasks: InsertProjectTask[] = [];
    let completedCount = 0;
    
    for (const row of rawData) {
      try {
        // Skip summary tasks if we can identify them (usually they have sub-tasks)
        const taskType = normalizeText(row[columnMap.taskType])?.toLowerCase();
        if (taskType && ['summary', 'group', 'heading'].includes(taskType)) {
          continue;
        }
        
        // Get task data with fallbacks for missing fields
        const taskId = normalizeText(row[columnMap.taskId]) || `TASK-${tasks.length + 1}`;
        const taskName = normalizeText(row[columnMap.taskName]) || `Unnamed Task ${tasks.length + 1}`;
        const percentComplete = normalizePercentage(row[columnMap.percentComplete]);
        
        // Create the task object
        const taskData: InsertProjectTask = {
          projectId,
          taskId,
          taskName,
          percentComplete,
          startDate: normalizeDate(row[columnMap.startDate]),
          finishDate: normalizeDate(row[columnMap.finishDate]),
          duration: normalizeNumber(row[columnMap.duration]),
          predecessors: normalizeText(row[columnMap.predecessors]),
          successors: normalizeText(row[columnMap.successors]),
          notes: normalizeText(row[columnMap.notes]),
          priority: normalizeNumber(row[columnMap.priority]),
          milestoneFlag: normalizeBoolean(row[columnMap.milestoneFlag]),
          resources: normalizeText(row[columnMap.resources]),
          uploadedBy: username,
          excluded: false
        };
        
        // Add to tasks list
        tasks.push(taskData);
        
        // Count completed tasks
        if (percentComplete === 100) {
          completedCount++;
        }
      } catch (e) {
        console.error(`Error parsing task row:`, e);
        // Continue with the next row
      }
    }
    
    if (tasks.length === 0) {
      throw new Error('No valid tasks could be parsed from the Excel file');
    }
    
    // Create the schedule upload record
    const scheduleUpload: InsertScheduleUpload = {
      projectId,
      fileName: filename,
      uploadedBy: username,
      taskCount: tasks.length,
      completedTaskCount: completedCount,
      fileType: 'excel',
      status: 'processed'
    };
    
    const upload = await storage.createScheduleUpload(scheduleUpload);
    
    // Handle existing tasks - we'll mark the existing ones with the same task ID as excluded
    const existingTasks = await storage.getProjectTasks(projectId);
    const existingTaskIds = new Set(existingTasks.map(t => t.taskId));
    
    // Create the new tasks
    const createdTasks = await storage.bulkCreateProjectTasks(tasks);
    
    // Check for completed tasks and update linked risks if any
    if (completedCount > 0) {
      // Identify the IDs of completed tasks
      const completedTaskIds = createdTasks
        .filter(task => task.percentComplete === 100)
        .map(task => task.id);
      
      if (completedTaskIds.length > 0) {
        // Update any linked risks
        await storage.bulkUpdateRisksFromTasks(completedTaskIds);
      }
    }
    
    return {
      uploadId: upload.id,
      taskCount: tasks.length,
      completedCount
    };
  } catch (error: unknown) {
    console.error('Excel parsing error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to parse Excel file: ${errorMessage}`);
  }
}

// Function to analyze tasks and risks to suggest potential links
export async function suggestTaskRiskLinks(projectId: number): Promise<Array<{
  taskId: number;
  riskId: number;
  taskName: string;
  riskTitle: string;
  confidence: number;
}>> {
  try {
    // Get all project tasks and risks
    const tasks = await storage.getProjectTasks(projectId);
    const risks = await storage.getRisks(projectId);
    
    // Get existing links to avoid duplicates
    const existingLinks = await storage.getTaskRiskLinks();
    const existingLinkMap = new Map<string, boolean>();
    
    existingLinks.forEach(link => {
      existingLinkMap.set(`${link.taskId}-${link.riskId}`, true);
    });
    
    // First try to use OpenAI for suggestions if API key is available
    try {
      if (process.env.OPENAI_API_KEY) {
        console.log('Using OpenAI for task-risk link suggestions');
        const aiSuggestions = await suggestTaskRiskLinksWithAI(tasks, risks);
        
        // Filter out existing links
        const filteredAiSuggestions = aiSuggestions.filter(suggestion => 
          !existingLinkMap.has(`${suggestion.taskId}-${suggestion.riskId}`)
        );
        
        // If we got AI suggestions, return them
        if (filteredAiSuggestions.length > 0) {
          return filteredAiSuggestions;
        }
      }
    } catch (aiError) {
      console.error('Error using AI for suggestions, falling back to keyword matching:', aiError);
      // Fall back to keyword matching
    }
    
    console.log('Using keyword matching for task-risk link suggestions');
    const suggestions: Array<{
      taskId: number;
      riskId: number;
      taskName: string;
      riskTitle: string;
      confidence: number;
    }> = [];
    
    // Simple keyword matching algorithm as a fallback
    for (const task of tasks) {
      const taskKeywords = extractKeywords(task.taskName + ' ' + (task.notes || ''));
      
      for (const risk of risks) {
        // Skip if there's already a link
        if (existingLinkMap.has(`${task.id}-${risk.id}`)) {
          continue;
        }
        
        // Skip closed risks
        if (risk.riskStatus === 'Closed') {
          continue;
        }
        
        // Extract keywords from risk content
        const riskContent = [
          risk.riskEvent,
          risk.riskCause,
          risk.riskEffect,
          risk.responseType,
          risk.mitigation,
          risk.prevention
        ].filter(Boolean).join(' ');
        
        const riskKeywords = extractKeywords(riskContent);
        
        // Calculate similarity score
        const similarity = calculateSimilarity(taskKeywords, riskKeywords);
        
        // If similarity is above threshold, add as a suggestion
        if (similarity > 0.1) {
          suggestions.push({
            taskId: task.id,
            riskId: risk.id,
            taskName: task.taskName,
            riskTitle: risk.riskEvent,
            confidence: similarity
          });
        }
      }
    }
    
    // Sort by confidence score (descending)
    return suggestions.sort((a, b) => b.confidence - a.confidence);
    
  } catch (error: unknown) {
    console.error('Error suggesting task-risk links:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to suggest links: ${errorMessage}`);
  }
}

// Helper function to extract keywords from text
function extractKeywords(text: string): Set<string> {
  if (!text) return new Set<string>();
  
  // Convert to lowercase
  const lowerText = text.toLowerCase();
  
  // Split into words and remove common stop words
  const stopWords = new Set([
    'a', 'an', 'the', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 
    'to', 'of', 'in', 'for', 'with', 'on', 'at', 'by', 'from',
    'this', 'that', 'these', 'those', 'it', 'its', 'they', 'their'
  ]);
  
  // Extract words and filter out stop words and short words
  const words = lowerText.split(/\W+/)
    .filter(word => word.length > 2 && !stopWords.has(word));
  
  return new Set(words);
}

// Simple similarity calculation based on keyword overlap
function calculateSimilarity(set1: Set<string>, set2: Set<string>): number {
  if (set1.size === 0 || set2.size === 0) return 0;
  
  // Count common words
  let commonCount = 0;
  // Convert set to array for iteration to avoid TypeScript downlevelIteration issues
  Array.from(set1).forEach(word => {
    if (set2.has(word)) {
      commonCount++;
    }
  });
  
  // Jaccard similarity: size of intersection / size of union
  const unionSize = set1.size + set2.size - commonCount;
  return commonCount / unionSize;
}