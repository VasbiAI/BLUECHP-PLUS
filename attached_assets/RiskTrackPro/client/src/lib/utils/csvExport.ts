import { type Risk, type Issue, type CriticalDate as SchemaDate } from "@shared/schema";

// Add a more flexible interface for critical dates that can handle both strict DB types and UI types
interface CriticalDate {
  id: number;
  title: string;
  status: string;
  entity?: string | null;
  department?: string | null;
  state?: string | null;
  contractValue?: string | null;
  criticalIssue?: string | null;
  criticalIssueDescription?: string | null;
  reminderType?: string | null;
  projectName?: string | null;
  projectAddress?: string | null;
  agreementType?: string | null;
  agreementDate?: string | null;
  agreementReference?: string | null;
  dueDate: string;
  reminderScheduling?: string | null;
  occurrenceFrequency?: string | null;
  occurrenceStartDate?: string | null;
  occurrenceLastNotificationDate?: string | null;
  reminder1Days?: number | null;
  reminder2Days?: number | null;
  reminder3Days?: number | null;
  reminder4Days?: number | null;
  postTriggerDateReminderDays?: number | null;
  emails?: string[] | null;
}

export const exportRisksToCSV = (risks: Risk[], projectName: string): void => {
  // Define the headers for the CSV file
  const headers = [
    "Priority / Rank",
    "Risk ID",
    "Issue ID",
    "Open Date (D/M/Y)",
    "Raised By",
    "Owned By",
    "Risk Cause (Due to)",
    "Risk Event (There is a risk that)",
    "Risk Effect (Which may occur)",
    "Risk Category",
    "Probability",
    "Impact",
    "Risk Rating",
    "Risk Status",
    "Recommended Response Type",
    "Mitigation",
    "Prevention"
  ];
  
  // Map the risks array to an array of arrays containing the values
  const data = risks.map(risk => [
    risk.priorityRank.toString(),
    risk.riskId,
    risk.issueId || '',
    risk.openDate,
    risk.raisedBy,
    risk.ownedBy,
    risk.riskCause,
    risk.riskEvent,
    risk.riskEffect,
    risk.riskCategory,
    risk.probability.toString(),
    risk.impact.toString(),
    risk.riskRating.toString(),
    risk.riskStatus,
    risk.responseType,
    risk.mitigation,
    risk.prevention
  ]);
  
  // Add headers to the beginning of the data
  data.unshift(headers);
  
  // Convert the data to CSV format
  const csvContent = data.map(row => row.map(cell => {
    // If the cell contains commas, quotes, or newlines, enclose it in quotes
    if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
      // Replace any double quotes with two double quotes
      const escapedCell = cell.replace(/"/g, '""');
      return `"${escapedCell}"`;
    }
    return cell;
  }).join(',')).join('\n');
  
  // Create a Blob containing the CSV data
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  
  // Create a URL for the Blob
  const url = URL.createObjectURL(blob);
  
  // Create a link element and set its attributes
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `BlueCHP_${projectName.replace(/[^a-z0-9]/gi, '_')}_Risk_Register.csv`);
  
  // Append the link to the document, click it, and then remove it
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Release the URL object
  URL.revokeObjectURL(url);
};

// Define Task interface to match the structure we're using in the application
interface Task {
  id: number;
  taskId: string;
  taskName: string;
  percentComplete: number;
  startDate: string | null;
  finishDate: string | null;
  duration: number | null;
  resources: string | null;
  notes: string | null;
  links?: any[];
  projectId: number;
}

// Linked task export function
export const exportLinkedTasksToCSV = (tasks: Task[], projectName: string, riskId?: number): void => {
  // Define the headers for the CSV file
  const headers = [
    "Task ID",
    "Task Name",
    "% Complete",
    "Start Date",
    "Finish Date",
    "Duration",
    "Resources",
    "Notes",
    "Linked to Risk IDs"
  ];
  
  // Map the tasks array to an array of arrays containing the values
  const data = tasks.map(task => {
    // Format the linked risk IDs if available
    const linkedRisks = task.links && task.links.length > 0 
      ? task.links.map((link: any) => link.riskId).join(', ') 
      : '';
      
    return [
      task.taskId,
      task.taskName,
      task.percentComplete.toString() + '%',
      task.startDate ? new Date(task.startDate).toLocaleDateString() : '',
      task.finishDate ? new Date(task.finishDate).toLocaleDateString() : '',
      task.duration ? task.duration.toString() + ' days' : '',
      task.resources || '',
      task.notes || '',
      linkedRisks
    ];
  });
  
  // Add headers to the beginning of the data
  data.unshift(headers);
  
  // Convert the data to CSV format
  const csvContent = data.map(row => row.map(cell => {
    // If the cell contains commas, quotes, or newlines, enclose it in quotes
    if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
      // Replace any double quotes with two double quotes
      const escapedCell = cell.replace(/"/g, '""');
      return `"${escapedCell}"`;
    }
    return cell;
  }).join(',')).join('\n');
  
  // Create a Blob containing the CSV data
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  
  // Create a URL for the Blob
  const url = URL.createObjectURL(blob);
  
  // Create filename based on whether we're exporting for a specific risk or all linked tasks
  const filename = riskId 
    ? `BlueCHP_${projectName.replace(/[^a-z0-9]/gi, '_')}_Risk_${riskId}_Linked_Tasks.csv`
    : `BlueCHP_${projectName.replace(/[^a-z0-9]/gi, '_')}_Linked_Tasks.csv`;
  
  // Create a link element and set its attributes
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  
  // Append the link to the document, click it, and then remove it
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Release the URL object
  URL.revokeObjectURL(url);
};

// Export function for issues
export const exportIssuesToCSV = (issues: Issue[], projectName: string): void => {
  // Define the headers for the CSV file
  const headers = [
    "Priority Rank",
    "Issue ID",
    "Related Risk ID",
    "Issue Date",
    "Raised By",
    "Owned By",
    "Issue Event",
    "Issue Effect",
    "Status",
    "Resolution",
    "Closed Date",
    "Category",
    "Impact",
    "Assigned To"
  ];
  
  // Map the issues array to an array of arrays containing the values
  const data = issues.map(issue => [
    issue.priorityRank.toString(),
    issue.uniqueId || '',
    issue.riskId || '',
    issue.issueDate || '',
    issue.raisedBy || '',
    issue.ownedBy || '',
    issue.issueEvent || '',
    issue.issueEffect || '',
    issue.status || '',
    issue.resolution || '',
    issue.closedDate || '',
    issue.category || '',
    issue.impact?.toString() || '',
    issue.assignedTo || ''
  ]);
  
  // Add headers to the beginning of the data
  data.unshift(headers);
  
  // Convert the data to CSV format
  const csvContent = data.map(row => row.map(cell => {
    // If the cell contains commas, quotes, or newlines, enclose it in quotes
    if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
      // Replace any double quotes with two double quotes
      const escapedCell = cell.replace(/"/g, '""');
      return `"${escapedCell}"`;
    }
    return cell;
  }).join(',')).join('\n');
  
  // Create a Blob containing the CSV data
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  
  // Create a URL for the Blob
  const url = URL.createObjectURL(blob);
  
  // Create a link element and set its attributes
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `BlueCHP_${projectName.replace(/[^a-z0-9]/gi, '_')}_Issues_Register.csv`);
  
  // Append the link to the document, click it, and then remove it
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Release the URL object
  URL.revokeObjectURL(url);
};

// Export function for critical dates
export const exportCriticalDatesToCSV = (criticalDates: CriticalDate[], projectName: string): void => {
  // Define the headers for the CSV file
  const headers = [
    "Title",
    "Status",
    "Due Date",
    "Entity",
    "Department",
    "State",
    "Contract Value",
    "Critical Issue",
    "Critical Issue Description",
    "Project Name",
    "Project Address",
    "Agreement Type",
    "Agreement Date",
    "Agreement Reference",
    "Reminder Type",
    "Reminder Scheduling",
    "Occurrence Frequency",
    "Occurrence Start Date",
    "Reminder 1 (Days)",
    "Reminder 2 (Days)",
    "Reminder 3 (Days)",
    "Reminder 4 (Days)",
    "Post Trigger Reminder (Days)",
    "Notification Recipients"
  ];
  
  // Map the critical dates array to an array of arrays containing the values
  const data = criticalDates.map(date => [
    date.title || '',
    date.status || '',
    date.dueDate || '',
    date.entity || '',
    date.department || '',
    date.state || '',
    date.contractValue || '',
    date.criticalIssue || '',
    date.criticalIssueDescription || '',
    date.projectName || '',
    date.projectAddress || '',
    date.agreementType || '',
    date.agreementDate || '',
    date.agreementReference || '',
    date.reminderType || '',
    date.reminderScheduling || 'One Off Event',
    date.occurrenceFrequency || '',
    date.occurrenceStartDate || '',
    date.reminder1Days?.toString() || '',
    date.reminder2Days?.toString() || '',
    date.reminder3Days?.toString() || '',
    date.reminder4Days?.toString() || '',
    date.postTriggerDateReminderDays?.toString() || '',
    date.emails?.join(', ') || ''
  ]);
  
  // Add headers to the beginning of the data
  data.unshift(headers);
  
  // Convert the data to CSV format
  const csvContent = data.map(row => row.map(cell => {
    // If the cell contains commas, quotes, or newlines, enclose it in quotes
    if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
      // Replace any double quotes with two double quotes
      const escapedCell = cell.replace(/"/g, '""');
      return `"${escapedCell}"`;
    }
    return cell;
  }).join(',')).join('\n');
  
  // Create a Blob containing the CSV data
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  
  // Create a URL for the Blob
  const url = URL.createObjectURL(blob);
  
  // Create a link element and set its attributes
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `BlueCHP_${projectName.replace(/[^a-z0-9]/gi, '_')}_Critical_Dates.csv`);
  
  // Append the link to the document, click it, and then remove it
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Release the URL object
  URL.revokeObjectURL(url);
};