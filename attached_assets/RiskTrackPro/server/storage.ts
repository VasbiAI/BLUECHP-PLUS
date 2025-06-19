import { 
  risks, type Risk, type InsertRisk, 
  projects, type Project, type InsertProject,
  criticalDates, type CriticalDate, type InsertCriticalDate,
  users, type User, type InsertUser,
  issues, type Issue, type InsertIssue,
  projectTasks, type ProjectTask, type InsertProjectTask,
  taskRiskLinks, type TaskRiskLink, type InsertTaskRiskLink,
  scheduleUploads, type ScheduleUpload, type InsertScheduleUpload,
  externalAccessTokens, type ExternalAccessToken, type InsertExternalAccessToken,
  externalAccessPermissions, type ExternalAccessPermission, type InsertExternalAccessPermission,
  documentUploads, type DocumentUpload, type InsertDocumentUpload,
  criticalDateDocuments, type CriticalDateDocument, type InsertCriticalDateDocument,
  criticalDateDependencies, type CriticalDateDependency, type InsertCriticalDateDependency
} from "@shared/schema";

import { eq } from "drizzle-orm";
import { db } from "./db";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Project methods
  getProject(id: number): Promise<Project | undefined>;
  getProjects(): Promise<Project[]>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, project: Partial<InsertProject>): Promise<Project | undefined>;
  deleteProject(id: number): Promise<boolean>;
  
  // Risk methods
  getRisk(id: number): Promise<Risk | undefined>;
  getRisks(projectId?: number): Promise<Risk[]>;
  createRisk(risk: InsertRisk): Promise<Risk>;
  updateRisk(id: number, risk: Partial<InsertRisk>): Promise<Risk | undefined>;
  deleteRisk(id: number): Promise<boolean>;
  
  // Critical Date methods
  getCriticalDate(id: number): Promise<CriticalDate | undefined>;
  getCriticalDates(): Promise<CriticalDate[]>;
  getCriticalDatesByProject(projectId: number): Promise<CriticalDate[]>;
  createCriticalDate(criticalDate: InsertCriticalDate): Promise<CriticalDate>;
  updateCriticalDate(id: number, criticalDate: Partial<InsertCriticalDate>): Promise<CriticalDate | undefined>;
  deleteCriticalDate(id: number): Promise<boolean>;
  
  // External Access Token methods
  createExternalAccessToken(token: InsertExternalAccessToken): Promise<ExternalAccessToken>;
  getExternalAccessToken(tokenId: string): Promise<ExternalAccessToken | undefined>;
  getExternalAccessTokens(): Promise<ExternalAccessToken[]>;
  updateExternalAccessToken(id: number, update: Partial<InsertExternalAccessToken>): Promise<ExternalAccessToken | undefined>;
  deleteExternalAccessToken(id: number): Promise<boolean>;
  
  // External Access Permission methods
  createExternalAccessPermission(permission: InsertExternalAccessPermission): Promise<ExternalAccessPermission>;
  getExternalAccessPermissions(tokenId: number): Promise<ExternalAccessPermission[]>;
  deleteExternalAccessPermission(id: number): Promise<boolean>;
  
  // Document Upload methods
  createDocumentUpload(document: InsertDocumentUpload): Promise<DocumentUpload>;
  getDocumentUpload(id: number): Promise<DocumentUpload | undefined>;
  updateDocumentUpload(id: number, update: Partial<InsertDocumentUpload>): Promise<DocumentUpload | undefined>;
  deleteDocumentUpload(id: number): Promise<boolean>;
  
  // Critical Date Document methods
  linkDocumentToCriticalDate(link: InsertCriticalDateDocument): Promise<CriticalDateDocument>;
  getDocumentsForCriticalDate(criticalDateId: number): Promise<DocumentUpload[]>;
  unlinkDocumentFromCriticalDate(id: number): Promise<boolean>;
  
  // Critical Date Dependency methods
  createCriticalDateDependency(dependency: InsertCriticalDateDependency): Promise<CriticalDateDependency>;
  getCriticalDateDependencies(criticalDateId: number): Promise<CriticalDateDependency[]>;
  deleteCriticalDateDependency(id: number): Promise<boolean>;
  
  // Issue methods
  getIssue(id: number): Promise<Issue | undefined>;
  getIssues(projectId?: number): Promise<Issue[]>;
  createIssue(issue: InsertIssue): Promise<Issue>;
  updateIssue(id: number, issue: Partial<InsertIssue>): Promise<Issue | undefined>;
  deleteIssue(id: number): Promise<boolean>;
  getIssueByIssueId(issueId: string): Promise<Issue | undefined>;
  
  // Project Task methods
  getProjectTask(id: number): Promise<ProjectTask | undefined>;
  getProjectTasks(projectId: number): Promise<ProjectTask[]>;
  getProjectTaskByTaskId(projectId: number, taskId: string): Promise<ProjectTask | undefined>;
  createProjectTask(task: InsertProjectTask): Promise<ProjectTask>;
  updateProjectTask(id: number, task: Partial<InsertProjectTask>): Promise<ProjectTask | undefined>;
  deleteProjectTask(id: number): Promise<boolean>;
  
  // Task-Risk Link methods
  getTaskRiskLink(id: number): Promise<TaskRiskLink | undefined>;
  getTaskRiskLinks(taskId?: number, riskId?: number): Promise<TaskRiskLink[]>;
  createTaskRiskLink(link: InsertTaskRiskLink): Promise<TaskRiskLink>;
  updateTaskRiskLink(id: number, link: Partial<InsertTaskRiskLink>): Promise<TaskRiskLink | undefined>;
  deleteTaskRiskLink(id: number): Promise<boolean>;
  
  // Schedule Upload methods
  getScheduleUpload(id: number): Promise<ScheduleUpload | undefined>;
  getScheduleUploads(projectId: number): Promise<ScheduleUpload[]>;
  createScheduleUpload(upload: InsertScheduleUpload): Promise<ScheduleUpload>;
  updateScheduleUpload(id: number, upload: Partial<InsertScheduleUpload>): Promise<ScheduleUpload | undefined>;
  
  // Bulk Operations
  bulkCreateProjectTasks(tasks: InsertProjectTask[]): Promise<ProjectTask[]>;
  bulkUpdateRisksFromTasks(taskIds: number[]): Promise<number>; // Returns number of risks updated
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private projects: Map<number, Project>;
  private risks: Map<number, Risk>;
  private criticalDates: Map<number, CriticalDate>;
  private issues: Map<number, Issue>;
  
  private userCurrentId: number;
  private projectCurrentId: number;
  private riskCurrentId: number;
  private criticalDateCurrentId: number;
  private issueCurrentId: number;

  constructor() {
    this.users = new Map();
    this.projects = new Map();
    this.risks = new Map();
    this.criticalDates = new Map();
    this.issues = new Map();
    
    this.userCurrentId = 1;
    this.projectCurrentId = 1;
    this.riskCurrentId = 1;
    this.criticalDateCurrentId = 1;
    this.issueCurrentId = 1;
    
    // Initialize with default project data
    const defaultProject: InsertProject = {
      name: "43 - 45 Beerwah Parade, BEERWAH",
      registerName: "Construction",
      financialOption: "TBD",
      projectManager: "BlueCHP Limited",
      registerDate: "14/05/2025",
      organization: "BlueCHP Limited"
    };
    
    this.createProject(defaultProject);
    
    // Initialize with some sample risk data from the CSV
    const sampleRisks: InsertRisk[] = [
      {
        priorityRank: 19,
        riskId: "R - 43",
        issueId: "",
        openDate: "12/6/23",
        raisedBy: "BlueCHP",
        ownedBy: "BlueCHP",
        riskCause: "Disability Discrimination Act (DDA) Requirements",
        riskEvent: "DDA compliance issues post construction",
        riskEffect: "Post construction rectification works",
        riskCategory: "Construction",
        probability: 0.4,
        impact: 100,
        riskRating: 40,
        riskStatus: "Open",
        responseType: "Transfer",
        mitigation: "Complete ongoing inspections with DDA consultant",
        prevention: "DDA consultant to be engaged for staged inspections",
        projectId: 1
      },
      {
        priorityRank: 5,
        riskId: "R - 17",
        issueId: "",
        openDate: "12/6/23",
        raisedBy: "BlueCHP",
        ownedBy: "BlueCHP",
        riskCause: "Labour shortages",
        riskEvent: "Shortage of skilled and unskilled subcontractors to complete the works",
        riskEffect: "Increase in costs, and project and delivery timeframe impacted, delaying project handover",
        riskCategory: "Construction",
        probability: 0.6,
        impact: 100,
        riskRating: 60,
        riskStatus: "Open",
        responseType: "Transfer",
        mitigation: "Ensure Contractor gain commitment from all subcontractors during the procurement and contract execution phase",
        prevention: "Book in all subcontractor resources early",
        projectId: 1
      },
      {
        priorityRank: 26,
        riskId: "R - 19",
        issueId: "",
        openDate: "12/6/23",
        raisedBy: "BlueCHP",
        ownedBy: "BlueCHP",
        riskCause: "Road/footpath public interaction/incident",
        riskEvent: "Incidents occurs on footpath/road",
        riskEffect: "Undermine project completion",
        riskCategory: "Site",
        probability: 0.6,
        impact: 60,
        riskRating: 36,
        riskStatus: "Open",
        responseType: "Transfer",
        mitigation: "Review Traffic Management, Site Management & Staging plans to identify all potential areas of interface and public exposure.",
        prevention: "Builder and Developer to engage in community consultation prior to the commencement of works",
        projectId: 1
      },
      {
        priorityRank: 1,
        riskId: "R - 11",
        issueId: "",
        openDate: "12/6/23",
        raisedBy: "BlueCHP",
        ownedBy: "BlueCHP",
        riskCause: "Geotechnical conditions",
        riskEvent: "Geotechnical conditions have adverse cost implications",
        riskEffect: "Project delivery delays and additional costs",
        riskCategory: "Site",
        probability: 0.8,
        impact: 80,
        riskRating: 64,
        riskStatus: "Open",
        responseType: "Accept",
        mitigation: "Whilst adverse geotechnical conditions aren't easily mitigated however unfavourable conditions can be dealt with by working closely with Contractor & Structural/Civil disciplines to modify and implement alternative footing and civil designs",
        prevention: "Addition geotechnical testing",
        projectId: 1
      },
      {
        priorityRank: 1,
        riskId: "R - 31",
        issueId: "",
        openDate: "12/6/23",
        raisedBy: "BlueCHP",
        ownedBy: "BlueCHP",
        riskCause: "Project visibility",
        riskEvent: "Loss of visibility on site progress and construction costs due to builder and developer being at arm's length, resulting in below par contract administration",
        riskEffect: "Cost increase and delay to programme",
        riskCategory: "Construction",
        probability: 0.8,
        impact: 80,
        riskRating: 64,
        riskStatus: "Open",
        responseType: "Accept",
        mitigation: "Ongoing meeting and contract administration documentation review",
        prevention: "Shared Access to contract admin documentation",
        projectId: 1
      }
    ];
    
    sampleRisks.forEach(risk => this.createRisk(risk));
    
    // Initialize with sample critical date data from the CSV
    const sampleCriticalDates: InsertCriticalDate[] = [
      {
        title: "CD-1",
        status: "Open",
        entity: "",
        department: "",
        state: "",
        contractValue: "$1,000",
        criticalIssue: "",
        criticalIssueDescription: "test",
        reminderType: "",
        projectName: "",
        projectAddress: "",
        agreementType: "",
        agreementDate: "",
        agreementReference: "",
        dueDate: "1/08/2024",
        reminderScheduling: "",
        occurrenceFrequency: "",
        occurrenceStartDate: "",
        occurrenceLastNotificationDate: "",
        reminder1Days: 60,
        reminder2Days: 30,
        reminder3Days: 14,
        reminder4Days: 7,
        postTriggerDateReminderDays: 0,
        emails: ["xpapeter@bluechp.com.au"]
      },
      {
        title: "CD-2",
        status: "Open",
        entity: "BlueCHPQ Limited",
        department: "Governance",
        state: "QLD",
        contractValue: "$1,000",
        criticalIssue: "Licence Renewal",
        criticalIssueDescription: "TEST - Car Registration Renewal",
        reminderType: "Operations",
        projectName: "",
        projectAddress: "",
        agreementType: "",
        agreementDate: "",
        agreementReference: "",
        dueDate: "30/09/2024",
        reminderScheduling: "One Off Event",
        occurrenceFrequency: "",
        occurrenceStartDate: "",
        occurrenceLastNotificationDate: "",
        reminder1Days: 14,
        reminder2Days: 7,
        reminder3Days: 4,
        reminder4Days: 2,
        postTriggerDateReminderDays: 1,
        emails: ["Warren.Flood@bluechp.com.au", "Sarah.Donovan@bluechp.com.au", "sarah.donovan@bluechp.com.au"]
      }
    ];
    
    sampleCriticalDates.forEach(criticalDate => this.createCriticalDate(criticalDate));
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Project methods
  async getProject(id: number): Promise<Project | undefined> {
    return this.projects.get(id);
  }
  
  async getProjects(): Promise<Project[]> {
    return Array.from(this.projects.values());
  }
  
  async createProject(insertProject: InsertProject): Promise<Project> {
    const id = this.projectCurrentId++;
    const project: Project = { ...insertProject, id };
    this.projects.set(id, project);
    return project;
  }
  
  async updateProject(id: number, projectUpdate: Partial<InsertProject>): Promise<Project | undefined> {
    const existingProject = this.projects.get(id);
    if (!existingProject) return undefined;
    
    const updatedProject = { ...existingProject, ...projectUpdate };
    this.projects.set(id, updatedProject);
    return updatedProject;
  }
  
  async deleteProject(id: number): Promise<boolean> {
    return this.projects.delete(id);
  }
  
  // Risk methods
  async getRisk(id: number): Promise<Risk | undefined> {
    return this.risks.get(id);
  }
  
  async getRisks(projectId?: number): Promise<Risk[]> {
    const allRisks = Array.from(this.risks.values());
    if (projectId) {
      return allRisks.filter(risk => risk.projectId === projectId);
    }
    return allRisks;
  }
  
  async createRisk(insertRisk: InsertRisk): Promise<Risk> {
    const id = this.riskCurrentId++;
    const now = new Date();
    const risk: Risk = { 
      ...insertRisk, 
      id, 
      createdAt: now, 
      updatedAt: now 
    };
    this.risks.set(id, risk);
    return risk;
  }
  
  async updateRisk(id: number, riskUpdate: Partial<InsertRisk>): Promise<Risk | undefined> {
    const existingRisk = this.risks.get(id);
    if (!existingRisk) return undefined;
    
    const updatedRisk = { 
      ...existingRisk, 
      ...riskUpdate, 
      updatedAt: new Date() 
    };
    this.risks.set(id, updatedRisk);
    return updatedRisk;
  }
  
  async deleteRisk(id: number): Promise<boolean> {
    return this.risks.delete(id);
  }
  
  // Critical Date methods
  async getCriticalDate(id: number): Promise<CriticalDate | undefined> {
    return this.criticalDates.get(id);
  }
  
  async getCriticalDates(): Promise<CriticalDate[]> {
    return Array.from(this.criticalDates.values());
  }
  
  async createCriticalDate(insertCriticalDate: InsertCriticalDate): Promise<CriticalDate> {
    const id = this.criticalDateCurrentId++;
    const now = new Date();
    const criticalDate: CriticalDate = { 
      ...insertCriticalDate, 
      id, 
      createdAt: now, 
      updatedAt: now 
    };
    this.criticalDates.set(id, criticalDate);
    return criticalDate;
  }
  
  async updateCriticalDate(id: number, criticalDateUpdate: Partial<InsertCriticalDate>): Promise<CriticalDate | undefined> {
    const existingCriticalDate = this.criticalDates.get(id);
    if (!existingCriticalDate) return undefined;
    
    const updatedCriticalDate = { 
      ...existingCriticalDate, 
      ...criticalDateUpdate, 
      updatedAt: new Date() 
    };
    this.criticalDates.set(id, updatedCriticalDate);
    return updatedCriticalDate;
  }
  
  async deleteCriticalDate(id: number): Promise<boolean> {
    return this.criticalDates.delete(id);
  }
  
  // Issue methods
  async getIssue(id: number): Promise<Issue | undefined> {
    return this.issues.get(id);
  }
  
  async getIssueByIssueId(issueId: string): Promise<Issue | undefined> {
    for (const issue of this.issues.values()) {
      if (issue.issueId === issueId) {
        return issue;
      }
    }
    return undefined;
  }
  
  async getIssues(projectId?: number): Promise<Issue[]> {
    if (projectId) {
      return Array.from(this.issues.values()).filter(issue => issue.projectId === projectId);
    }
    return Array.from(this.issues.values());
  }
  
  async createIssue(insertIssue: InsertIssue): Promise<Issue> {
    const id = this.issueCurrentId++;
    const now = new Date();
    const issue: Issue = { 
      ...insertIssue, 
      id, 
      createdAt: now, 
      updatedAt: now 
    };
    this.issues.set(id, issue);
    return issue;
  }
  
  async updateIssue(id: number, issueUpdate: Partial<InsertIssue>): Promise<Issue | undefined> {
    const existingIssue = this.issues.get(id);
    if (!existingIssue) return undefined;
    
    const updatedIssue = { 
      ...existingIssue, 
      ...issueUpdate, 
      updatedAt: new Date() 
    };
    this.issues.set(id, updatedIssue);
    return updatedIssue;
  }
  
  async deleteIssue(id: number): Promise<boolean> {
    return this.issues.delete(id);
  }
}

// Always use database storage for persistence
import { DatabaseStorage } from './databaseStorage';
export const storage = new DatabaseStorage();
