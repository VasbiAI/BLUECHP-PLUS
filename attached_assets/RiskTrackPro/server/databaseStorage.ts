import { 
  risks, type Risk, type InsertRisk, 
  projects, type Project, type InsertProject,
  criticalDates, type CriticalDate, type InsertCriticalDate,
  users, type User, type InsertUser,
  issues, type Issue, type InsertIssue,
  projectTasks, type ProjectTask, type InsertProjectTask,
  taskRiskLinks, type TaskRiskLink, type InsertTaskRiskLink,
  scheduleUploads, type ScheduleUpload, type InsertScheduleUpload,
  documentUploads, type DocumentUpload, type InsertDocumentUpload,
  criticalDateDocuments, type CriticalDateDocument, type InsertCriticalDateDocument,
  externalAccessTokens, type ExternalAccessToken, type InsertExternalAccessToken,
  externalAccessPermissions, type ExternalAccessPermission, type InsertExternalAccessPermission,
  criticalDateDependencies, type CriticalDateDependency, type InsertCriticalDateDependency
} from "@shared/schema";

import { eq, and, sql, SQL, inArray } from "drizzle-orm";
import { db } from "./db";
import { IStorage } from "./storage";

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Project methods
  async getProject(id: number): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project || undefined;
  }

  async getProjects(): Promise<Project[]> {
    return await db.select().from(projects);
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const [project] = await db
      .insert(projects)
      .values(insertProject)
      .returning();
    return project;
  }

  async updateProject(id: number, projectUpdate: Partial<InsertProject>): Promise<Project | undefined> {
    const [project] = await db
      .update(projects)
      .set(projectUpdate)
      .where(eq(projects.id, id))
      .returning();
    return project || undefined;
  }

  async deleteProject(id: number): Promise<boolean> {
    const result = await db
      .delete(projects)
      .where(eq(projects.id, id));
    return true;
  }

  // Risk methods
  async getRisk(id: number): Promise<Risk | undefined> {
    const [risk] = await db.select().from(risks).where(eq(risks.id, id));
    return risk || undefined;
  }

  async getRisks(projectId?: number): Promise<Risk[]> {
    // First, get all the risks
    let fetchedRisks: Risk[];
    if (projectId) {
      fetchedRisks = await db.select().from(risks).where(eq(risks.projectId, projectId));
    } else {
      fetchedRisks = await db.select().from(risks);
    }
    
    // Then, for each risk, get any task-risk links
    const risksWithLinks = await Promise.all(
      fetchedRisks.map(async (risk) => {
        const links = await db.select().from(taskRiskLinks).where(eq(taskRiskLinks.riskId, risk.id));
        return {
          ...risk,
          taskLinks: links
        };
      })
    );
    
    return risksWithLinks;
  }

  async createRisk(insertRisk: InsertRisk): Promise<Risk> {
    const [risk] = await db
      .insert(risks)
      .values(insertRisk)
      .returning();
    return risk;
  }

  async updateRisk(id: number, riskUpdate: Partial<InsertRisk>): Promise<Risk | undefined> {
    const [risk] = await db
      .update(risks)
      .set(riskUpdate)
      .where(eq(risks.id, id))
      .returning();
    return risk || undefined;
  }

  async deleteRisk(id: number): Promise<boolean> {
    await db.delete(risks).where(eq(risks.id, id));
    return true;
  }

  // Critical Date methods
  async getCriticalDate(id: number): Promise<CriticalDate | undefined> {
    try {
      // Use raw SQL query to avoid schema mapping issues
      const result = await db.execute(sql`
        SELECT * FROM critical_dates WHERE id = ${id}
      `);
      
      if (!result || !result.rows || result.rows.length === 0) {
        return undefined;
      }
      
      const row = result.rows[0];
      
      // Map using the same approach as getCriticalDates
      const criticalDate: CriticalDate = {
        id: row.id,
        title: row.title || '',
        status: row.status || 'Active',
        projectId: null,
        
        // Entity information
        entity: row.entity || null,
        department: row.department || null,
        state: row.state || null,
        
        // Date information
        dueDate: row.due_date ? new Date(row.due_date) : new Date(),
        createdAt: row.created_at ? new Date(row.created_at) : null,
        updatedAt: row.updated_at ? new Date(row.updated_at) : null,
        
        // Contract and issue details
        contractValue: row.contract_value || null,
        criticalIssue: row.critical_issue || null,
        criticalIssueDescription: row.critical_issue_description || null,
        calendarOrBusinessDay: "Calendar",
        
        // Project and reminder information
        criticalDateReminderType: row.reminder_type || null,
        projectName: row.project_name || null,
        projectAddress: row.project_address || null,
        
        // Agreement details
        agreementType: row.agreement_type || null,
        agreementDate: row.agreement_date ? new Date(row.agreement_date) : null,
        agreementReference: row.agreement_reference || null,
        
        // Recurrence settings
        reminderScheduling: row.reminder_scheduling || null,
        occurrenceFrequency: row.occurrence_frequency || null,
        occurrenceStartDate: row.occurrence_start_date ? new Date(row.occurrence_start_date) : null,
        occurrenceLastNotificationDate: row.occurrence_last_notification_date ? new Date(row.occurrence_last_notification_date) : null,
        
        // Reminder days
        firstReminderDaysBeforeDueDate: row.reminder1_days || null,
        secondReminderDaysBeforeDueDate: row.reminder2_days || null,
        thirdReminderDaysBeforeDueDate: row.reminder3_days || null,
        fourthReminderDaysBeforeDueDate: row.reminder4_days || null,
        postTriggerReminderDaysAfterDueDate: row.post_trigger_date_reminder_days || null,
        
        // Legacy field for compatibility
        reminderDays: row.reminder1_days || null,
        
        // Contact information
        emails: row.emails || [],
        
        // Additional fields required by the schema
        hasRelatedClause: false,
        relatedClauseAndContractDetails: null,
        relatedClauseAction: null,
        relatedAgreementType: null,
        relatedAgreementDate: null,
        blueCHPResponsiblePerson: null,
        blueCHPManager: null,
        externalResponsiblePartyEmail: null,
        createdBy: null,
        lastModifiedBy: null
      };
      
      return criticalDate;
    } catch (error) {
      console.error("Error fetching critical date:", error);
      return undefined;
    }
  }

  async getCriticalDates(): Promise<CriticalDate[]> {
    try {
      // Use raw SQL query to avoid schema mapping issues
      const result = await db.execute(sql`
        SELECT * FROM critical_dates
      `);
      
      if (!result || !result.rows || result.rows.length === 0) {
        return [];
      }
      
      // Map the rows to the expected format
      const criticalDatesList: CriticalDate[] = result.rows.map((row: any) => {
        return {
          id: row.id,
          title: row.title || '',
          status: row.status || 'Active',
          projectId: null,
          
          // Entity information
          entity: row.entity || null,
          department: row.department || null,
          state: row.state || null,
          
          // Date information
          dueDate: row.due_date ? new Date(row.due_date) : new Date(),
          createdAt: row.created_at ? new Date(row.created_at) : null,
          updatedAt: row.updated_at ? new Date(row.updated_at) : null,
          
          // Contract and issue details
          contractValue: row.contract_value || null,
          criticalIssue: row.critical_issue || null,
          criticalIssueDescription: row.critical_issue_description || null,
          calendarOrBusinessDay: "Calendar",
          
          // Project and reminder information
          criticalDateReminderType: row.reminder_type || null,
          projectName: row.project_name || null,
          projectAddress: row.project_address || null,
          
          // Agreement details
          agreementType: row.agreement_type || null,
          agreementDate: row.agreement_date ? new Date(row.agreement_date) : null,
          agreementReference: row.agreement_reference || null,
          
          // Recurrence settings
          reminderScheduling: row.reminder_scheduling || null,
          occurrenceFrequency: row.occurrence_frequency || null,
          occurrenceStartDate: row.occurrence_start_date ? new Date(row.occurrence_start_date) : null,
          occurrenceLastNotificationDate: row.occurrence_last_notification_date ? new Date(row.occurrence_last_notification_date) : null,
          
          // Reminder days
          firstReminderDaysBeforeDueDate: row.reminder1_days || null,
          secondReminderDaysBeforeDueDate: row.reminder2_days || null,
          thirdReminderDaysBeforeDueDate: row.reminder3_days || null,
          fourthReminderDaysBeforeDueDate: row.reminder4_days || null,
          postTriggerReminderDaysAfterDueDate: row.post_trigger_date_reminder_days || null,
          
          // Legacy field for compatibility
          reminderDays: row.reminder1_days || null,
          
          // Contact information
          emails: row.emails || [],
          
          // Additional fields required by the schema
          hasRelatedClause: false,
          relatedClauseAndContractDetails: null,
          relatedClauseAction: null,
          relatedAgreementType: null,
          relatedAgreementDate: null,
          blueCHPResponsiblePerson: null,
          blueCHPManager: null,
          externalResponsiblePartyEmail: null,
          createdBy: null,
          lastModifiedBy: null
        };
      });
      
      return criticalDatesList;
    } catch (error) {
      console.error("Error fetching critical dates:", error);
      return [];
    }
  }
  
  async getCriticalDatesByProject(projectId: number): Promise<CriticalDate[]> {
    try {
      // Use raw SQL query with project filtering
      const result = await db.execute(sql`
        SELECT * FROM critical_dates
        WHERE project_name LIKE ${`%${projectId}%`} 
        OR project_name LIKE ${`Project ${projectId}`}
      `);
      
      if (!result || !result.rows || result.rows.length === 0) {
        return [];
      }
      
      // Map the rows to the expected format - same as getCriticalDates
      const criticalDatesList: CriticalDate[] = result.rows.map((row: any) => {
        return {
          id: row.id,
          title: row.title || '',
          status: row.status || 'Active',
          projectId, // Use the provided projectId
          
          // Entity information
          entity: row.entity || null,
          department: row.department || null,
          state: row.state || null,
          
          // Date information
          dueDate: row.due_date ? new Date(row.due_date) : new Date(),
          createdAt: row.created_at ? new Date(row.created_at) : null,
          updatedAt: row.updated_at ? new Date(row.updated_at) : null,
          
          // Contract and issue details
          contractValue: row.contract_value || null,
          criticalIssue: row.critical_issue || null,
          criticalIssueDescription: row.critical_issue_description || null,
          calendarOrBusinessDay: "Calendar",
          
          // Project and reminder information
          criticalDateReminderType: row.reminder_type || null,
          projectName: row.project_name || null,
          projectAddress: row.project_address || null,
          
          // Agreement details
          agreementType: row.agreement_type || null,
          agreementDate: row.agreement_date ? new Date(row.agreement_date) : null,
          agreementReference: row.agreement_reference || null,
          
          // Recurrence settings
          reminderScheduling: row.reminder_scheduling || null,
          occurrenceFrequency: row.occurrence_frequency || null,
          occurrenceStartDate: row.occurrence_start_date ? new Date(row.occurrence_start_date) : null,
          occurrenceLastNotificationDate: row.occurrence_last_notification_date ? new Date(row.occurrence_last_notification_date) : null,
          
          // Reminder days
          firstReminderDaysBeforeDueDate: row.reminder1_days || null,
          secondReminderDaysBeforeDueDate: row.reminder2_days || null,
          thirdReminderDaysBeforeDueDate: row.reminder3_days || null,
          fourthReminderDaysBeforeDueDate: row.reminder4_days || null,
          postTriggerReminderDaysAfterDueDate: row.post_trigger_date_reminder_days || null,
          
          // Legacy field for compatibility
          reminderDays: row.reminder1_days || null,
          
          // Contact information
          emails: row.emails || [],
          
          // Additional fields required by the schema
          hasRelatedClause: false,
          relatedClauseAndContractDetails: null,
          relatedClauseAction: null,
          relatedAgreementType: null,
          relatedAgreementDate: null,
          blueCHPResponsiblePerson: null,
          blueCHPManager: null,
          externalResponsiblePartyEmail: null,
          createdBy: null,
          lastModifiedBy: null
        };
      });
      
      return criticalDatesList;
    } catch (error) {
      console.error("Error fetching critical dates by project:", error);
      return [];
    }
  }

  async createCriticalDate(insertCriticalDate: InsertCriticalDate): Promise<CriticalDate> {
    const [criticalDate] = await db
      .insert(criticalDates)
      .values(insertCriticalDate)
      .returning();
    return criticalDate;
  }

  async updateCriticalDate(id: number, criticalDateUpdate: Partial<InsertCriticalDate>): Promise<CriticalDate | undefined> {
    const [criticalDate] = await db
      .update(criticalDates)
      .set(criticalDateUpdate)
      .where(eq(criticalDates.id, id))
      .returning();
    return criticalDate || undefined;
  }

  async deleteCriticalDate(id: number): Promise<boolean> {
    await db.delete(criticalDates).where(eq(criticalDates.id, id));
    return true;
  }
  
  // External Access Token methods
  async createExternalAccessToken(token: InsertExternalAccessToken): Promise<ExternalAccessToken> {
    const [newToken] = await db
      .insert(externalAccessTokens)
      .values(token)
      .returning();
    return newToken;
  }
  
  async getExternalAccessToken(tokenString: string): Promise<ExternalAccessToken | undefined> {
    const [token] = await db.select().from(externalAccessTokens).where(eq(externalAccessTokens.token, tokenString));
    
    if (token) {
      // Update the access count and last used timestamp
      await db
        .update(externalAccessTokens)
        .set({
          accessCount: token.accessCount + 1,
          lastUsedAt: new Date(),
        })
        .where(eq(externalAccessTokens.id, token.id));
        
      return token;
    }
    
    return undefined;
  }
  
  async getExternalAccessTokens(): Promise<ExternalAccessToken[]> {
    return await db.select().from(externalAccessTokens).orderBy(externalAccessTokens.createdAt);
  }
  
  async updateExternalAccessToken(id: number, update: Partial<InsertExternalAccessToken>): Promise<ExternalAccessToken | undefined> {
    const [token] = await db
      .update(externalAccessTokens)
      .set(update)
      .where(eq(externalAccessTokens.id, id))
      .returning();
    return token;
  }
  
  async deleteExternalAccessToken(id: number): Promise<boolean> {
    await db.delete(externalAccessTokens).where(eq(externalAccessTokens.id, id));
    return true;
  }
  
  // External Access Permission methods
  async createExternalAccessPermission(permission: InsertExternalAccessPermission): Promise<ExternalAccessPermission> {
    const [newPermission] = await db
      .insert(externalAccessPermissions)
      .values(permission)
      .returning();
    return newPermission;
  }
  
  async getExternalAccessPermissions(tokenId: number): Promise<ExternalAccessPermission[]> {
    return await db.select().from(externalAccessPermissions).where(eq(externalAccessPermissions.tokenId, tokenId));
  }
  
  async deleteExternalAccessPermission(id: number): Promise<boolean> {
    await db.delete(externalAccessPermissions).where(eq(externalAccessPermissions.id, id));
    return true;
  }
  
  // Document Upload methods
  async createDocumentUpload(document: InsertDocumentUpload): Promise<DocumentUpload> {
    // Convert Date objects to string if needed
    const documentData = {
      ...document,
      uploadedAt: document.uploadedAt ? document.uploadedAt : undefined,
      analysisCompletedAt: document.analysisCompletedAt ? document.analysisCompletedAt.toString() : undefined
    };
    
    const [newDocument] = await db
      .insert(documentUploads)
      .values(documentData)
      .returning();
    return newDocument;
  }
  
  async getDocumentUpload(id: number): Promise<DocumentUpload | undefined> {
    const [document] = await db.select().from(documentUploads).where(eq(documentUploads.id, id));
    return document || undefined;
  }
  
  async updateDocumentUpload(id: number, update: Partial<InsertDocumentUpload>): Promise<DocumentUpload | undefined> {
    // Convert Date objects to string if needed
    const updateData = {
      ...update,
      uploadedAt: update.uploadedAt ? update.uploadedAt : undefined,
      analysisCompletedAt: update.analysisCompletedAt ? update.analysisCompletedAt.toString() : undefined
    };
    
    const [document] = await db
      .update(documentUploads)
      .set(updateData)
      .where(eq(documentUploads.id, id))
      .returning();
    return document || undefined;
  }
  
  async deleteDocumentUpload(id: number): Promise<boolean> {
    await db.delete(documentUploads).where(eq(documentUploads.id, id));
    return true;
  }
  
  // Critical Date Document methods
  async linkDocumentToCriticalDate(link: InsertCriticalDateDocument): Promise<CriticalDateDocument> {
    // Ensure the criticalDateId and documentId are properly formatted as numbers
    const linkData = {
      criticalDateId: typeof link.criticalDateId === 'string' ? parseInt(link.criticalDateId) : link.criticalDateId,
      documentId: typeof link.documentId === 'string' ? parseInt(link.documentId) : link.documentId,
      relationshipType: link.relationshipType || 'source'
    };
    
    const [newLink] = await db
      .insert(criticalDateDocuments)
      .values(linkData)
      .returning();
    return newLink;
  }
  
  async getDocumentsForCriticalDate(criticalDateId: number): Promise<DocumentUpload[]> {
    const links = await db
      .select()
      .from(criticalDateDocuments)
      .where(eq(criticalDateDocuments.criticalDateId, criticalDateId));
    
    if (links.length === 0) return [];
    
    const documentIds = links.map(link => link.documentId);
    
    return await db
      .select()
      .from(documentUploads)
      .where(
        documentIds.length === 1 
          ? eq(documentUploads.id, documentIds[0]) 
          : sql`${documentUploads.id} IN (${documentIds.join(',')})`
      );
  }
  
  async unlinkDocumentFromCriticalDate(id: number): Promise<boolean> {
    await db.delete(criticalDateDocuments).where(eq(criticalDateDocuments.id, id));
    return true;
  }
  
  // Critical Date Dependency methods
  async createCriticalDateDependency(dependency: InsertCriticalDateDependency): Promise<CriticalDateDependency> {
    const [newDependency] = await db
      .insert(criticalDateDependencies)
      .values(dependency)
      .returning();
    return newDependency;
  }
  
  async getCriticalDateDependencies(criticalDateId: number): Promise<CriticalDateDependency[]> {
    // Get both dependencies where this date is a predecessor or successor
    const asPredecessor = await db
      .select()
      .from(criticalDateDependencies)
      .where(eq(criticalDateDependencies.predecessorId, criticalDateId));
      
    const asSuccessor = await db
      .select()
      .from(criticalDateDependencies)
      .where(eq(criticalDateDependencies.successorId, criticalDateId));
    
    return [...asPredecessor, ...asSuccessor];
  }
  
  async deleteCriticalDateDependency(id: number): Promise<boolean> {
    await db.delete(criticalDateDependencies).where(eq(criticalDateDependencies.id, id));
    return true;
  }
  
  async deleteCriticalDate(id: number): Promise<boolean> {
    try {
      // First check if the critical date exists
      const exists = await db
        .select({ count: sql`count(*)` })
        .from(criticalDates)
        .where(eq(criticalDates.id, id));
      
      if (!exists || exists.length === 0 || exists[0].count === 0) {
        return false;
      }
      
      // Delete the critical date
      await db.delete(criticalDates).where(eq(criticalDates.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting critical date:', error);
      return false;
    }
  }

  // Issue methods
  async getIssue(id: number): Promise<Issue | undefined> {
    const [issue] = await db.select().from(issues).where(eq(issues.id, id));
    return issue || undefined;
  }

  async getIssues(projectId?: number): Promise<Issue[]> {
    if (projectId) {
      return await db.select().from(issues).where(eq(issues.projectId, projectId));
    }
    return await db.select().from(issues);
  }

  async getIssueByIssueId(issueId: string): Promise<Issue | undefined> {
    const [issue] = await db.select().from(issues).where(eq(issues.uniqueId, issueId));
    return issue || undefined;
  }

  async createIssue(insertIssue: InsertIssue): Promise<Issue> {
    const [issue] = await db
      .insert(issues)
      .values(insertIssue)
      .returning();
    return issue;
  }

  async updateIssue(id: number, issueUpdate: Partial<InsertIssue>): Promise<Issue | undefined> {
    const [issue] = await db
      .update(issues)
      .set(issueUpdate)
      .where(eq(issues.id, id))
      .returning();
    return issue || undefined;
  }

  async deleteIssue(id: number): Promise<boolean> {
    await db.delete(issues).where(eq(issues.id, id));
    return true;
  }

  // Project Task methods
  async getProjectTask(id: number): Promise<ProjectTask | undefined> {
    const [task] = await db.select().from(projectTasks).where(eq(projectTasks.id, id));
    return task || undefined;
  }

  async getProjectTasks(projectId: number): Promise<ProjectTask[]> {
    return await db.select().from(projectTasks).where(eq(projectTasks.projectId, projectId));
  }

  async getProjectTaskByTaskId(projectId: number, taskId: string): Promise<ProjectTask | undefined> {
    const [task] = await db.select().from(projectTasks).where(
      and(
        eq(projectTasks.projectId, projectId),
        eq(projectTasks.taskId, taskId)
      )
    );
    return task || undefined;
  }

  async createProjectTask(task: InsertProjectTask): Promise<ProjectTask> {
    const [newTask] = await db
      .insert(projectTasks)
      .values(task)
      .returning();
    return newTask;
  }

  async updateProjectTask(id: number, taskUpdate: Partial<InsertProjectTask>): Promise<ProjectTask | undefined> {
    const [task] = await db
      .update(projectTasks)
      .set({
        ...taskUpdate,
        lastUpdatedAt: new Date()
      })
      .where(eq(projectTasks.id, id))
      .returning();
    return task || undefined;
  }

  async deleteProjectTask(id: number): Promise<boolean> {
    await db.delete(projectTasks).where(eq(projectTasks.id, id));
    return true;
  }

  // Task-Risk Link methods
  async getTaskRiskLink(id: number): Promise<TaskRiskLink | undefined> {
    const [link] = await db.select().from(taskRiskLinks).where(eq(taskRiskLinks.id, id));
    return link || undefined;
  }

  async getTaskRiskLinks(taskId?: number, riskId?: number): Promise<TaskRiskLink[]> {
    if (taskId && riskId) {
      return await db.select().from(taskRiskLinks).where(
        and(
          eq(taskRiskLinks.taskId, taskId),
          eq(taskRiskLinks.riskId, riskId)
        )
      );
    } else if (taskId) {
      return await db.select().from(taskRiskLinks).where(eq(taskRiskLinks.taskId, taskId));
    } else if (riskId) {
      return await db.select().from(taskRiskLinks).where(eq(taskRiskLinks.riskId, riskId));
    }
    return await db.select().from(taskRiskLinks);
  }

  async createTaskRiskLink(link: InsertTaskRiskLink): Promise<TaskRiskLink> {
    const [newLink] = await db
      .insert(taskRiskLinks)
      .values(link)
      .returning();
    return newLink;
  }

  async updateTaskRiskLink(id: number, linkUpdate: Partial<InsertTaskRiskLink>): Promise<TaskRiskLink | undefined> {
    const [link] = await db
      .update(taskRiskLinks)
      .set({
        ...linkUpdate,
        lastValidated: new Date()
      })
      .where(eq(taskRiskLinks.id, id))
      .returning();
    return link || undefined;
  }

  async deleteTaskRiskLink(id: number): Promise<boolean> {
    await db.delete(taskRiskLinks).where(eq(taskRiskLinks.id, id));
    return true;
  }

  // Schedule Upload methods
  async getScheduleUpload(id: number): Promise<ScheduleUpload | undefined> {
    const [upload] = await db.select().from(scheduleUploads).where(eq(scheduleUploads.id, id));
    return upload || undefined;
  }

  async getScheduleUploads(projectId: number): Promise<ScheduleUpload[]> {
    return await db.select().from(scheduleUploads)
      .where(eq(scheduleUploads.projectId, projectId))
      .orderBy(scheduleUploads.uploadedAt);
  }

  async createScheduleUpload(upload: InsertScheduleUpload): Promise<ScheduleUpload> {
    const [newUpload] = await db
      .insert(scheduleUploads)
      .values(upload)
      .returning();
    return newUpload;
  }

  async updateScheduleUpload(id: number, uploadUpdate: Partial<InsertScheduleUpload>): Promise<ScheduleUpload | undefined> {
    const [upload] = await db
      .update(scheduleUploads)
      .set(uploadUpdate)
      .where(eq(scheduleUploads.id, id))
      .returning();
    return upload || undefined;
  }

  // Bulk Operations
  async bulkCreateProjectTasks(tasks: InsertProjectTask[]): Promise<ProjectTask[]> {
    if (tasks.length === 0) return [];
    const result = await db
      .insert(projectTasks)
      .values(tasks)
      .returning();
    return result;
  }

  async bulkUpdateRisksFromTasks(taskIds: number[]): Promise<number> {
    let updatedCount = 0;
    
    // Get all task-risk links for the given task IDs
    const links = await db.select().from(taskRiskLinks).where(
      taskIds.length === 1
        ? eq(taskRiskLinks.taskId, taskIds[0])
        : sql`${taskRiskLinks.taskId} IN (${taskIds.join(',')})`
    );
    
    if (links.length === 0) return 0;
    
    // Get the tasks for these links to check completion status
    const taskIdsToFetch = links.map(link => link.taskId);
    const tasks = await db.select().from(projectTasks).where(
      taskIdsToFetch.length === 1
        ? eq(projectTasks.id, taskIdsToFetch[0])
        : sql`${projectTasks.id} IN (${taskIdsToFetch.join(',')})`
    );
    
    // Create a map of tasks by ID for easy lookup
    const taskMap = new Map<number, ProjectTask>();
    for (const task of tasks) {
      taskMap.set(task.id, task);
    }
    
    // Group links by risk ID
    const riskLinks = new Map<number, TaskRiskLink[]>();
    for (const link of links) {
      if (!riskLinks.has(link.riskId)) {
        riskLinks.set(link.riskId, []);
      }
      riskLinks.get(link.riskId)?.push(link);
    }
    
    // Update risks based on task completion
    const riskEntriesArray = Array.from(riskLinks.entries());
    for (let i = 0; i < riskEntriesArray.length; i++) {
      const [riskId, riskTaskLinks] = riskEntriesArray[i];
      // Check if all linked tasks are complete (100%)
      const allTasksComplete = riskTaskLinks.every((link: TaskRiskLink) => {
        const task = taskMap.get(link.taskId);
        return task && task.percentComplete >= 100;
      });
      
      if (allTasksComplete) {
        // Update risk to be closed
        const [risk] = await db.select().from(risks).where(eq(risks.id, riskId));
        if (risk && risk.riskStatus !== 'Closed') {
          await db.update(risks)
            .set({
              riskStatus: 'Closed',
              statusChangeDate: new Date().toISOString().split('T')[0]
              // Use riskStatus: 'Closed' as the schema doesn't have closedDate field
            })
            .where(eq(risks.id, riskId));
          updatedCount++;
        }
      }
    }
    
    return updatedCount;
  }
}