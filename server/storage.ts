import { 
  users, type User, type InsertUser, 
  documents, type Document, type InsertDocument, 
  sections, type Section, type InsertSection, 
  projects, type Project, type InsertProject,
  developmentTypes, financeModels, contractTypes, fundingSources, revenueStreams, documentCategories,
  projectStatuses, projectRisks, timelineEvents, criticalDates,
  type InsertDevelopmentType, type InsertFinanceModel, type InsertContractType,
  type InsertFundingSource, type InsertRevenueStream, type DocumentCategory, type InsertDocumentCategory,
  type ProjectStatus, type InsertProjectStatus,
  type ProjectRisk, type InsertProjectRisk,
  type TimelineEvent, type InsertTimelineEvent,
  type CriticalDate, type InsertCriticalDate,
  // Manual related imports
  manuals, manualSections, contentTypes, states, manualContents, contentStates,
  type Manual, type InsertManual, type ManualSection, type InsertManualSection,
  type ContentType, type InsertContentType, type State, type InsertState,
  type ManualContent, type InsertManualContent, type ContentState, type InsertContentState,
  // Diagram Editor related imports
  entityCategories, entities, diagramTemplates, diagrams,
  type EntityCategory, type InsertEntityCategory, type Entity, type InsertEntity,
  type DiagramTemplate, type InsertDiagramTemplate, type Diagram, type InsertDiagram
} from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

// Enhanced storage interface with methods for all major models
export interface IStorage {
  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined>;
  
  // Manual management
  getManual(id: number): Promise<Manual | undefined>;
  getAllManuals(): Promise<Manual[]>;
  createManual(manual: InsertManual): Promise<Manual>;
  updateManual(id: number, updates: Partial<InsertManual>): Promise<Manual | undefined>;
  deleteManual(id: number): Promise<boolean>;
  
  // Manual section management
  getManualSection(id: number): Promise<ManualSection | undefined>;
  getManualSectionsByManual(manualId: number): Promise<ManualSection[]>;
  getManualSectionsByParent(parentId: number): Promise<ManualSection[]>;
  createManualSection(section: InsertManualSection): Promise<ManualSection>;
  updateManualSection(id: number, updates: Partial<InsertManualSection>): Promise<ManualSection | undefined>;
  deleteManualSection(id: number): Promise<boolean>;
  
  // Content type management
  getContentType(id: number): Promise<ContentType | undefined>;
  getAllContentTypes(): Promise<ContentType[]>;
  createContentType(contentType: InsertContentType): Promise<ContentType>;
  
  // State management
  getState(id: number): Promise<State | undefined>;
  getAllStates(): Promise<State[]>;
  createState(state: InsertState): Promise<State>;
  
  // Manual content management
  getManualContent(id: number): Promise<ManualContent | undefined>;
  getManualContentsBySection(sectionId: number): Promise<ManualContent[]>;
  createManualContent(content: InsertManualContent): Promise<ManualContent>;
  updateManualContent(id: number, updates: Partial<InsertManualContent>): Promise<ManualContent | undefined>;
  deleteManualContent(id: number): Promise<boolean>;
  reorderManualContents(contentIds: {id: number, orderId: number}[]): Promise<boolean>;
  
  // Content state management
  getContentStates(contentId: number): Promise<State[]>;
  setContentStates(contentId: number, stateIds: number[]): Promise<boolean>;
  
  // Document management
  getDocument(id: number): Promise<Document | undefined>;
  getAllDocuments(): Promise<Document[]>;
  getDocumentsByType(type: string): Promise<Document[]>;
  getDocumentsByProject(projectId: number): Promise<Document[]>;
  createDocument(document: InsertDocument): Promise<Document>;
  updateDocument(id: number, updates: Partial<InsertDocument>): Promise<Document | undefined>;
  deleteDocument(id: number): Promise<boolean>;
  
  // Section management
  getSection(id: number): Promise<Section | undefined>;
  getSectionsByDocument(documentId: number): Promise<Section[]>;
  getSectionsByParent(parentId: number): Promise<Section[]>;
  createSection(section: InsertSection): Promise<Section>;
  updateSection(id: number, updates: Partial<InsertSection>): Promise<Section | undefined>;
  deleteSection(id: number): Promise<boolean>;
  
  // Project management
  getProject(id: number): Promise<Project | undefined>;
  getAllProjects(): Promise<Project[]>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, updates: Partial<InsertProject>): Promise<Project | undefined>;
  deleteProject(id: number): Promise<boolean>;
  
  // Project dashboard data
  getProjectStatus(projectId: number): Promise<ProjectStatus | undefined>;
  getProjectRisks(projectId: number): Promise<ProjectRisk[]>;
  getTimelineEvents(projectId: number): Promise<TimelineEvent[]>;
  getCriticalDates(projectId: number): Promise<CriticalDate[]>;
  
  // Project Status management
  createProjectStatus(status: InsertProjectStatus): Promise<ProjectStatus>;
  updateProjectStatus(id: number, updates: Partial<InsertProjectStatus>): Promise<ProjectStatus | undefined>;
  
  // Project Risk management
  createProjectRisk(risk: InsertProjectRisk): Promise<ProjectRisk>;
  updateProjectRisk(id: number, updates: Partial<InsertProjectRisk>): Promise<ProjectRisk | undefined>;
  deleteProjectRisk(id: number): Promise<boolean>;
  
  // Timeline Event management
  createTimelineEvent(event: InsertTimelineEvent): Promise<TimelineEvent>;
  updateTimelineEvent(id: number, updates: Partial<InsertTimelineEvent>): Promise<TimelineEvent | undefined>;
  deleteTimelineEvent(id: number): Promise<boolean>;
  
  // Critical Date management
  createCriticalDate(date: InsertCriticalDate): Promise<CriticalDate>;
  updateCriticalDate(id: number, updates: Partial<InsertCriticalDate>): Promise<CriticalDate | undefined>;
  deleteCriticalDate(id: number): Promise<boolean>;
  
  // Lookup tables management
  getAllDevelopmentTypes(): Promise<any[]>;
  getDevelopmentType(id: number): Promise<any | undefined>;
  createDevelopmentType(data: any): Promise<any>;
  deleteDevelopmentType(id: number): Promise<boolean>;
  
  getAllFinanceModels(): Promise<any[]>;
  getFinanceModel(id: number): Promise<any | undefined>;
  createFinanceModel(data: any): Promise<any>;
  deleteFinanceModel(id: number): Promise<boolean>;
  
  getAllContractTypes(): Promise<any[]>;
  getContractType(id: number): Promise<any | undefined>;
  createContractType(data: any): Promise<any>;
  deleteContractType(id: number): Promise<boolean>;
  
  getAllFundingSources(): Promise<any[]>;
  getFundingSource(id: number): Promise<any | undefined>;
  createFundingSource(data: any): Promise<any>;
  deleteFundingSource(id: number): Promise<boolean>;
  
  getAllRevenueStreams(): Promise<any[]>;
  getRevenueStream(id: number): Promise<any | undefined>;
  createRevenueStream(data: any): Promise<any>;
  deleteRevenueStream(id: number): Promise<boolean>;
  
  // Document categories management
  getAllDocumentCategories(): Promise<DocumentCategory[]>;
  getDocumentCategory(id: number): Promise<DocumentCategory | undefined>;
  createDocumentCategory(data: InsertDocumentCategory): Promise<DocumentCategory>;
  deleteDocumentCategory(id: number): Promise<boolean>;
}

// Complete implementation using Drizzle ORM and PostgreSQL
export class DatabaseStorage implements IStorage {
  // Manual management
  async getManual(id: number): Promise<Manual | undefined> {
    try {
      const result = await db.select().from(manuals).where(eq(manuals.id, id));
      return result.length > 0 ? result[0] : undefined;
    } catch (error) {
      console.error("Error getting manual:", error);
      throw error;
    }
  }
  
  async getAllManuals(): Promise<Manual[]> {
    try {
      return await db.select().from(manuals);
    } catch (error) {
      console.error("Error getting all manuals:", error);
      throw error;
    }
  }
  
  async createManual(manual: InsertManual): Promise<Manual> {
    try {
      // Don't set dates here, the database will handle it with defaultNow()
      const result = await db.insert(manuals).values(manual).returning();
      return result[0];
    } catch (error) {
      console.error("Error creating manual:", error);
      throw error;
    }
  }
  
  async updateManual(id: number, updates: Partial<InsertManual>): Promise<Manual | undefined> {
    try {
      const now = new Date().toISOString();
      const updatedManual = {
        ...updates,
        updatedAt: now
      };
      
      const result = await db.update(manuals)
        .set(updatedManual)
        .where(eq(manuals.id, id))
        .returning();
      
      return result.length > 0 ? result[0] : undefined;
    } catch (error) {
      console.error("Error updating manual:", error);
      throw error;
    }
  }
  
  async deleteManual(id: number): Promise<boolean> {
    try {
      const result = await db.delete(manuals).where(eq(manuals.id, id)).returning();
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting manual:", error);
      throw error;
    }
  }
  
  // Manual section management
  async getManualSection(id: number): Promise<ManualSection | undefined> {
    try {
      const result = await db.select().from(manualSections).where(eq(manualSections.id, id));
      return result.length > 0 ? result[0] : undefined;
    } catch (error) {
      console.error("Error getting manual section:", error);
      throw error;
    }
  }
  
  async getManualSectionsByManual(manualId: number): Promise<ManualSection[]> {
    try {
      return await db.select().from(manualSections).where(eq(manualSections.manualId, manualId));
    } catch (error) {
      console.error("Error getting manual sections by manual:", error);
      throw error;
    }
  }
  
  async getManualSectionsByParent(parentId: number): Promise<ManualSection[]> {
    try {
      return await db.select().from(manualSections).where(eq(manualSections.parentId, parentId));
    } catch (error) {
      console.error("Error getting manual sections by parent:", error);
      throw error;
    }
  }
  
  async createManualSection(section: InsertManualSection): Promise<ManualSection> {
    try {
      // Let the database handle timestamps with defaultNow()
      const result = await db.insert(manualSections).values(section).returning();
      return result[0];
    } catch (error) {
      console.error("Error creating manual section:", error);
      throw error;
    }
  }
  
  async updateManualSection(id: number, updates: Partial<InsertManualSection>): Promise<ManualSection | undefined> {
    try {
      // Don't set dates here - let the database handle it
      const result = await db.update(manualSections)
        .set(updates)
        .where(eq(manualSections.id, id))
        .returning();
      
      return result.length > 0 ? result[0] : undefined;
    } catch (error) {
      console.error("Error updating manual section:", error);
      throw error;
    }
  }
  
  async deleteManualSection(id: number): Promise<boolean> {
    try {
      const result = await db.delete(manualSections).where(eq(manualSections.id, id)).returning();
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting manual section:", error);
      throw error;
    }
  }
  
  // Content type management
  async getContentType(id: number): Promise<ContentType | undefined> {
    try {
      const result = await db.select().from(contentTypes).where(eq(contentTypes.id, id));
      return result.length > 0 ? result[0] : undefined;
    } catch (error) {
      console.error("Error getting content type:", error);
      throw error;
    }
  }
  
  async getAllContentTypes(): Promise<ContentType[]> {
    try {
      return await db.select().from(contentTypes);
    } catch (error) {
      console.error("Error getting all content types:", error);
      throw error;
    }
  }
  
  async createContentType(contentType: InsertContentType): Promise<ContentType> {
    try {
      const now = new Date().toISOString();
      const newContentType = {
        ...contentType,
        createdAt: now
      };
      
      const result = await db.insert(contentTypes).values(newContentType).returning();
      return result[0];
    } catch (error) {
      console.error("Error creating content type:", error);
      throw error;
    }
  }
  
  // State management
  async getState(id: number): Promise<State | undefined> {
    try {
      const result = await db.select().from(states).where(eq(states.id, id));
      return result.length > 0 ? result[0] : undefined;
    } catch (error) {
      console.error("Error getting state:", error);
      throw error;
    }
  }
  
  async getAllStates(): Promise<State[]> {
    try {
      return await db.select().from(states);
    } catch (error) {
      console.error("Error getting all states:", error);
      throw error;
    }
  }
  
  async createState(state: InsertState): Promise<State> {
    try {
      const now = new Date().toISOString();
      const newState = {
        ...state,
        createdAt: now
      };
      
      const result = await db.insert(states).values(newState).returning();
      return result[0];
    } catch (error) {
      console.error("Error creating state:", error);
      throw error;
    }
  }
  
  // Manual content management
  async getManualContent(id: number): Promise<ManualContent | undefined> {
    try {
      const result = await db.select().from(manualContents).where(eq(manualContents.id, id));
      return result.length > 0 ? result[0] : undefined;
    } catch (error) {
      console.error("Error getting manual content:", error);
      throw error;
    }
  }
  
  async getManualContentsBySection(sectionId: number): Promise<ManualContent[]> {
    try {
      // First get all contents for this section
      const contents = await db.select()
        .from(manualContents)
        .where(eq(manualContents.sectionId, sectionId))
        .orderBy(manualContents.orderId);
      
      // For each content, get its associated states
      const result = await Promise.all(contents.map(async (content) => {
        const states = await this.getContentStates(content.id);
        return {
          ...content,
          states: states
        };
      }));
      
      return result;
    } catch (error) {
      console.error("Error getting manual contents by section:", error);
      throw error;
    }
  }
  
  async createManualContent(content: InsertManualContent): Promise<ManualContent> {
    try {
      // Let the database handle timestamps with defaultNow()
      const result = await db.insert(manualContents).values(content).returning();
      return result[0];
    } catch (error) {
      console.error("Error creating manual content:", error);
      throw error;
    }
  }
  
  async updateManualContent(id: number, updates: Partial<InsertManualContent>): Promise<ManualContent | undefined> {
    try {
      // Let database handle the timestamps with defaultNow()
      const result = await db.update(manualContents)
        .set(updates)
        .where(eq(manualContents.id, id))
        .returning();
      
      return result.length > 0 ? result[0] : undefined;
    } catch (error) {
      console.error("Error updating manual content:", error);
      throw error;
    }
  }
  
  async deleteManualContent(id: number): Promise<boolean> {
    try {
      const result = await db.delete(manualContents).where(eq(manualContents.id, id)).returning();
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting manual content:", error);
      throw error;
    }
  }
  
  async reorderManualContents(contentIds: {id: number, orderId: number}[]): Promise<boolean> {
    try {
      const now = new Date().toISOString();
      
      for (const item of contentIds) {
        await db.update(manualContents)
          .set({ 
            orderId: item.orderId,
            updatedAt: now
          })
          .where(eq(manualContents.id, item.id));
      }
      
      return true;
    } catch (error) {
      console.error("Error reordering manual contents:", error);
      throw error;
    }
  }
  
  // Content state management
  async getContentStates(contentId: number): Promise<State[]> {
    try {
      const result = await db.select({
        id: states.id,
        name: states.name,
        code: states.code,
        createdAt: states.createdAt
      })
      .from(contentStates)
      .innerJoin(states, eq(contentStates.stateId, states.id))
      .where(eq(contentStates.contentId, contentId));
      
      return result;
    } catch (error) {
      console.error("Error getting content states:", error);
      throw error;
    }
  }
  
  async setContentStates(contentId: number, stateIds: number[]): Promise<boolean> {
    try {
      console.log(`[storage] Starting setContentStates for content ${contentId} with stateIds:`, stateIds);
      
      // First delete existing associations
      console.log(`[storage] Deleting existing state associations for content ${contentId}`);
      const deleteResult = await db.delete(contentStates).where(eq(contentStates.contentId, contentId));
      console.log(`[storage] Delete result:`, deleteResult);
      
      // Then insert new associations
      if (stateIds.length > 0) {
        const values = stateIds.map(stateId => ({
          contentId,
          stateId
        }));
        
        console.log(`[storage] Inserting ${values.length} new state associations:`, values);
        
        try {
          const insertResult = await db.insert(contentStates).values(values);
          console.log(`[storage] Insert result:`, insertResult);
        } catch (insertError) {
          console.error(`[storage] Error inserting content states:`, insertError);
          throw insertError;
        }
      } else {
        console.log(`[storage] No state IDs to insert for content ${contentId}`);
      }
      
      // Verify the insert by querying
      const verifyResult = await db.select().from(contentStates).where(eq(contentStates.contentId, contentId));
      console.log(`[storage] Verification query result:`, verifyResult);
      console.log(`[storage] Number of states inserted: ${verifyResult.length}`);
      
      return true;
    } catch (error) {
      console.error("[storage] Error setting content states:", error);
      throw error;
    }
  }
  // Project dashboard data methods
  async getProjectStatus(projectId: number): Promise<ProjectStatus | undefined> {
    const [status] = await db
      .select()
      .from(projectStatuses)
      .where(eq(projectStatuses.projectId, projectId));
    return status;
  }

  async getProjectRisks(projectId: number): Promise<ProjectRisk[]> {
    return db
      .select()
      .from(projectRisks)
      .where(eq(projectRisks.projectId, projectId));
  }

  async getTimelineEvents(projectId: number): Promise<TimelineEvent[]> {
    return db
      .select()
      .from(timelineEvents)
      .where(eq(timelineEvents.projectId, projectId));
  }

  async getCriticalDates(projectId: number): Promise<CriticalDate[]> {
    return db
      .select({
        id: criticalDates.id,
        projectId: criticalDates.projectId,
        title: criticalDates.title,
        description: criticalDates.description,
        dueDate: criticalDates.dueDate,
        priority: criticalDates.priority,
        status: criticalDates.status,
        assignedTo: criticalDates.assignedTo,
        category: criticalDates.category,
        createdAt: criticalDates.createdAt,
        updatedAt: criticalDates.updatedAt
      })
      .from(criticalDates)
      .where(eq(criticalDates.projectId, projectId));
  }

  // Project Status management
  async createProjectStatus(status: InsertProjectStatus): Promise<ProjectStatus> {
    const [newStatus] = await db
      .insert(projectStatuses)
      .values(status)
      .returning();
    return newStatus;
  }

  async updateProjectStatus(id: number, updates: Partial<InsertProjectStatus>): Promise<ProjectStatus | undefined> {
    const [updatedStatus] = await db
      .update(projectStatuses)
      .set(updates)
      .where(eq(projectStatuses.id, id))
      .returning();
    return updatedStatus;
  }

  // Project Risk management
  async createProjectRisk(risk: InsertProjectRisk): Promise<ProjectRisk> {
    const [newRisk] = await db
      .insert(projectRisks)
      .values(risk)
      .returning();
    return newRisk;
  }

  async updateProjectRisk(id: number, updates: Partial<InsertProjectRisk>): Promise<ProjectRisk | undefined> {
    const [updatedRisk] = await db
      .update(projectRisks)
      .set(updates)
      .where(eq(projectRisks.id, id))
      .returning();
    return updatedRisk;
  }

  async deleteProjectRisk(id: number): Promise<boolean> {
    const [deletedRisk] = await db
      .delete(projectRisks)
      .where(eq(projectRisks.id, id))
      .returning();
    return !!deletedRisk;
  }

  // Timeline Event management
  async createTimelineEvent(event: InsertTimelineEvent): Promise<TimelineEvent> {
    const [newEvent] = await db
      .insert(timelineEvents)
      .values(event)
      .returning();
    return newEvent;
  }

  async updateTimelineEvent(id: number, updates: Partial<InsertTimelineEvent>): Promise<TimelineEvent | undefined> {
    const [updatedEvent] = await db
      .update(timelineEvents)
      .set(updates)
      .where(eq(timelineEvents.id, id))
      .returning();
    return updatedEvent;
  }

  async deleteTimelineEvent(id: number): Promise<boolean> {
    const [deletedEvent] = await db
      .delete(timelineEvents)
      .where(eq(timelineEvents.id, id))
      .returning();
    return !!deletedEvent;
  }

  // Critical Date management
  async createCriticalDate(date: InsertCriticalDate): Promise<CriticalDate> {
    const [newDate] = await db
      .insert(criticalDates)
      .values(date)
      .returning();
    return newDate;
  }

  async updateCriticalDate(id: number, updates: Partial<InsertCriticalDate>): Promise<CriticalDate | undefined> {
    const [updatedDate] = await db
      .update(criticalDates)
      .set(updates)
      .where(eq(criticalDates.id, id))
      .returning();
    return updatedDate;
  }

  async deleteCriticalDate(id: number): Promise<boolean> {
    const [deletedDate] = await db
      .delete(criticalDates)
      .where(eq(criticalDates.id, id))
      .returning();
    return !!deletedDate;
  }
  
  // User management methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // Add timestamps for created and updated
    const userWithTimestamps = {
      ...insertUser,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const [user] = await db
      .insert(users)
      .values(userWithTimestamps)
      .returning();
    return user;
  }
  
  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined> {
    // Always update the updatedAt timestamp
    const updatesWithTimestamp = {
      ...updates,
      updatedAt: new Date()
    };
    
    const [updatedUser] = await db
      .update(users)
      .set(updatesWithTimestamp)
      .where(eq(users.id, id))
      .returning();
    
    return updatedUser || undefined;
  }
  
  // Document management methods
  async getDocument(id: number): Promise<Document | undefined> {
    const [document] = await db.select().from(documents).where(eq(documents.id, id));
    return document || undefined;
  }
  
  async getAllDocuments(): Promise<Document[]> {
    return await db.select().from(documents);
  }
  
  async getDocumentsByType(type: string): Promise<Document[]> {
    return await db.select().from(documents).where(eq(documents.type, type));
  }
  
  async getDocumentsByProject(projectId: number): Promise<Document[]> {
    return await db.select().from(documents).where(eq(documents.projectId, projectId));
  }
  
  async createDocument(document: InsertDocument): Promise<Document> {
    // Add current timestamps
    const now = new Date().toISOString();
    const documentWithTimestamps = {
      ...document,
      createdAt: now,
      updatedAt: now
    };
    
    const [createdDocument] = await db
      .insert(documents)
      .values(documentWithTimestamps)
      .returning();
    
    return createdDocument;
  }
  
  async updateDocument(id: number, updates: Partial<InsertDocument>): Promise<Document | undefined> {
    // Update timestamp
    const now = new Date().toISOString();
    const updatesWithTimestamp = {
      ...updates,
      updatedAt: now
    };
    
    const [updatedDocument] = await db
      .update(documents)
      .set(updatesWithTimestamp)
      .where(eq(documents.id, id))
      .returning();
    
    return updatedDocument || undefined;
  }
  
  async deleteDocument(id: number): Promise<boolean> {
    const result = await db
      .delete(documents)
      .where(eq(documents.id, id));
    
    return true; // PostgreSQL doesn't return deleted rows count by default
  }
  
  // Section management methods
  async getSection(id: number): Promise<Section | undefined> {
    const [section] = await db.select().from(sections).where(eq(sections.id, id));
    return section || undefined;
  }
  
  async getSectionsByDocument(documentId: number): Promise<Section[]> {
    return await db
      .select()
      .from(sections)
      .where(eq(sections.documentId, documentId))
      .orderBy(sections.order);
  }
  
  async getSectionsByParent(parentId: number): Promise<Section[]> {
    return await db
      .select()
      .from(sections)
      .where(eq(sections.parentId, parentId))
      .orderBy(sections.order);
  }
  
  async createSection(section: InsertSection): Promise<Section> {
    // Add current timestamps
    const now = new Date().toISOString();
    const sectionWithTimestamps = {
      ...section,
      createdAt: now,
      updatedAt: now
    };
    
    const [createdSection] = await db
      .insert(sections)
      .values(sectionWithTimestamps)
      .returning();
    
    return createdSection;
  }
  
  async updateSection(id: number, updates: Partial<InsertSection>): Promise<Section | undefined> {
    // Update timestamp
    const now = new Date().toISOString();
    const updatesWithTimestamp = {
      ...updates,
      updatedAt: now
    };
    
    const [updatedSection] = await db
      .update(sections)
      .set(updatesWithTimestamp)
      .where(eq(sections.id, id))
      .returning();
    
    return updatedSection || undefined;
  }
  
  async deleteSection(id: number): Promise<boolean> {
    // First delete all child sections
    await db
      .delete(sections)
      .where(eq(sections.parentId, id));
    
    // Then delete the section itself
    await db
      .delete(sections)
      .where(eq(sections.id, id));
    
    return true;
  }
  
  // Project management methods
  async getProject(id: number): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project || undefined;
  }
  
  async getAllProjects(): Promise<Project[]> {
    try {
      return await db.select().from(projects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      return [];
    }
  }
  
  async createProject(project: InsertProject): Promise<Project> {
    // Add current timestamps
    const now = new Date().toISOString();
    const projectWithTimestamps = {
      ...project,
      createdAt: now,
      updatedAt: now
    };
    
    const [createdProject] = await db
      .insert(projects)
      .values(projectWithTimestamps)
      .returning();
    
    return createdProject;
  }
  
  async updateProject(id: number, updates: Partial<InsertProject>): Promise<Project | undefined> {
    // Update timestamp
    const now = new Date().toISOString();
    const updatesWithTimestamp = {
      ...updates,
      updatedAt: now
    };
    
    const [updatedProject] = await db
      .update(projects)
      .set(updatesWithTimestamp)
      .where(eq(projects.id, id))
      .returning();
    
    return updatedProject || undefined;
  }
  
  async deleteProject(id: number): Promise<boolean> {
    await db
      .delete(projects)
      .where(eq(projects.id, id));
    
    return true;
  }

  // Development Types methods
  async getAllDevelopmentTypes(): Promise<any[]> {
    try {
      return await db.select().from(developmentTypes);
    } catch (error) {
      console.error("Error fetching development types:", error);
      return [];
    }
  }

  async getDevelopmentType(id: number): Promise<any | undefined> {
    try {
      const [item] = await db.select().from(developmentTypes).where(eq(developmentTypes.id, id));
      return item || undefined;
    } catch (error) {
      console.error("Error fetching development type:", error);
      return undefined;
    }
  }

  async createDevelopmentType(data: any): Promise<any> {
    try {
      const [item] = await db.insert(developmentTypes).values(data).returning();
      return item;
    } catch (error) {
      console.error("Error creating development type:", error);
      throw error;
    }
  }

  async deleteDevelopmentType(id: number): Promise<boolean> {
    try {
      await db.delete(developmentTypes).where(eq(developmentTypes.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting development type:", error);
      return false;
    }
  }

  // Finance Models methods
  async getAllFinanceModels(): Promise<any[]> {
    try {
      return await db.select().from(financeModels);
    } catch (error) {
      console.error("Error fetching finance models:", error);
      return [];
    }
  }

  async getFinanceModel(id: number): Promise<any | undefined> {
    try {
      const [item] = await db.select().from(financeModels).where(eq(financeModels.id, id));
      return item || undefined;
    } catch (error) {
      console.error("Error fetching finance model:", error);
      return undefined;
    }
  }

  async createFinanceModel(data: any): Promise<any> {
    try {
      const [item] = await db.insert(financeModels).values(data).returning();
      return item;
    } catch (error) {
      console.error("Error creating finance model:", error);
      throw error;
    }
  }

  async deleteFinanceModel(id: number): Promise<boolean> {
    try {
      await db.delete(financeModels).where(eq(financeModels.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting finance model:", error);
      return false;
    }
  }

  // Contract Types methods
  async getAllContractTypes(): Promise<any[]> {
    try {
      return await db.select().from(contractTypes);
    } catch (error) {
      console.error("Error fetching contract types:", error);
      return [];
    }
  }

  async getContractType(id: number): Promise<any | undefined> {
    try {
      const [item] = await db.select().from(contractTypes).where(eq(contractTypes.id, id));
      return item || undefined;
    } catch (error) {
      console.error("Error fetching contract type:", error);
      return undefined;
    }
  }

  async createContractType(data: any): Promise<any> {
    try {
      const [item] = await db.insert(contractTypes).values(data).returning();
      return item;
    } catch (error) {
      console.error("Error creating contract type:", error);
      throw error;
    }
  }

  async deleteContractType(id: number): Promise<boolean> {
    try {
      await db.delete(contractTypes).where(eq(contractTypes.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting contract type:", error);
      return false;
    }
  }

  // Funding Sources methods
  async getAllFundingSources(): Promise<any[]> {
    try {
      return await db.select().from(fundingSources);
    } catch (error) {
      console.error("Error fetching funding sources:", error);
      return [];
    }
  }

  async getFundingSource(id: number): Promise<any | undefined> {
    try {
      const [item] = await db.select().from(fundingSources).where(eq(fundingSources.id, id));
      return item || undefined;
    } catch (error) {
      console.error("Error fetching funding source:", error);
      return undefined;
    }
  }

  async createFundingSource(data: any): Promise<any> {
    try {
      const [item] = await db.insert(fundingSources).values(data).returning();
      return item;
    } catch (error) {
      console.error("Error creating funding source:", error);
      throw error;
    }
  }

  async deleteFundingSource(id: number): Promise<boolean> {
    try {
      await db.delete(fundingSources).where(eq(fundingSources.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting funding source:", error);
      return false;
    }
  }

  // Revenue Streams methods
  async getAllRevenueStreams(): Promise<any[]> {
    try {
      return await db.select().from(revenueStreams);
    } catch (error) {
      console.error("Error fetching revenue streams:", error);
      return [];
    }
  }

  async getRevenueStream(id: number): Promise<any | undefined> {
    try {
      const [item] = await db.select().from(revenueStreams).where(eq(revenueStreams.id, id));
      return item || undefined;
    } catch (error) {
      console.error("Error fetching revenue stream:", error);
      return undefined;
    }
  }

  async createRevenueStream(data: any): Promise<any> {
    try {
      const [item] = await db.insert(revenueStreams).values(data).returning();
      return item;
    } catch (error) {
      console.error("Error creating revenue stream:", error);
      throw error;
    }
  }

  async deleteRevenueStream(id: number): Promise<boolean> {
    try {
      await db.delete(revenueStreams).where(eq(revenueStreams.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting revenue stream:", error);
      return false;
    }
  }

  // Document Categories methods
  async getAllDocumentCategories(): Promise<DocumentCategory[]> {
    try {
      return await db.select().from(documentCategories);
    } catch (error) {
      console.error("Error fetching document categories:", error);
      return [];
    }
  }

  async getDocumentCategory(id: number): Promise<DocumentCategory | undefined> {
    try {
      const [item] = await db.select().from(documentCategories).where(eq(documentCategories.id, id));
      return item || undefined;
    } catch (error) {
      console.error("Error fetching document category:", error);
      return undefined;
    }
  }

  async createDocumentCategory(data: InsertDocumentCategory): Promise<DocumentCategory> {
    try {
      const [item] = await db.insert(documentCategories).values(data).returning();
      return item;
    } catch (error) {
      console.error("Error creating document category:", error);
      throw error;
    }
  }

  async deleteDocumentCategory(id: number): Promise<boolean> {
    try {
      await db.delete(documentCategories).where(eq(documentCategories.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting document category:", error);
      return false;
    }
  }

  // =============== Diagram Editor Storage Methods ===============

  // Entity Categories Methods
  async getAllEntityCategories(): Promise<EntityCategory[]> {
    try {
      return await db.select().from(entityCategories).orderBy(entityCategories.name);
    } catch (error) {
      console.error("Error fetching entity categories:", error);
      return [];
    }
  }

  async getEntityCategory(id: number): Promise<EntityCategory | undefined> {
    try {
      const [category] = await db.select().from(entityCategories).where(eq(entityCategories.id, id));
      return category;
    } catch (error) {
      console.error("Error fetching entity category:", error);
      return undefined;
    }
  }

  async createEntityCategory(data: InsertEntityCategory): Promise<EntityCategory> {
    try {
      const now = new Date();
      const [category] = await db.insert(entityCategories).values({
        ...data,
        createdAt: now,
        updatedAt: now
      }).returning();
      return category;
    } catch (error) {
      console.error("Error creating entity category:", error);
      throw error;
    }
  }

  async updateEntityCategory(id: number, data: Partial<InsertEntityCategory>): Promise<EntityCategory | undefined> {
    try {
      const [updated] = await db.update(entityCategories)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(entityCategories.id, id))
        .returning();
      return updated;
    } catch (error) {
      console.error("Error updating entity category:", error);
      return undefined;
    }
  }

  async deleteEntityCategory(id: number): Promise<boolean> {
    try {
      await db.delete(entityCategories).where(eq(entityCategories.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting entity category:", error);
      return false;
    }
  }

  // Entities Methods
  async getAllEntities(): Promise<Entity[]> {
    try {
      return await db.select().from(entities).orderBy(entities.name);
    } catch (error) {
      console.error("Error fetching entities:", error);
      return [];
    }
  }

  async getEntitiesByCategory(categoryId: number): Promise<Entity[]> {
    try {
      return await db.select()
        .from(entities)
        .where(eq(entities.categoryId, categoryId))
        .orderBy(entities.name);
    } catch (error) {
      console.error("Error fetching entities by category:", error);
      return [];
    }
  }

  async getEntity(id: number): Promise<Entity | undefined> {
    try {
      const [entity] = await db.select().from(entities).where(eq(entities.id, id));
      return entity;
    } catch (error) {
      console.error("Error fetching entity:", error);
      return undefined;
    }
  }

  async createEntity(data: InsertEntity): Promise<Entity> {
    try {
      const now = new Date();
      const [entity] = await db.insert(entities).values({
        ...data,
        createdAt: now,
        updatedAt: now
      }).returning();
      return entity;
    } catch (error) {
      console.error("Error creating entity:", error);
      throw error;
    }
  }

  async updateEntity(id: number, data: Partial<InsertEntity>): Promise<Entity | undefined> {
    try {
      const [updated] = await db.update(entities)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(entities.id, id))
        .returning();
      return updated;
    } catch (error) {
      console.error("Error updating entity:", error);
      return undefined;
    }
  }

  async deleteEntity(id: number): Promise<boolean> {
    try {
      await db.delete(entities).where(eq(entities.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting entity:", error);
      return false;
    }
  }

  // Diagram Templates Methods
  async getAllDiagramTemplates(): Promise<DiagramTemplate[]> {
    try {
      return await db.select().from(diagramTemplates).orderBy(diagramTemplates.name);
    } catch (error) {
      console.error("Error fetching diagram templates:", error);
      return [];
    }
  }

  async getDiagramTemplate(id: number): Promise<DiagramTemplate | undefined> {
    try {
      const [template] = await db.select().from(diagramTemplates).where(eq(diagramTemplates.id, id));
      return template;
    } catch (error) {
      console.error("Error fetching diagram template:", error);
      return undefined;
    }
  }

  async createDiagramTemplate(data: InsertDiagramTemplate): Promise<DiagramTemplate> {
    try {
      const now = new Date();
      const [template] = await db.insert(diagramTemplates).values({
        ...data,
        createdAt: now,
        updatedAt: now
      }).returning();
      return template;
    } catch (error) {
      console.error("Error creating diagram template:", error);
      throw error;
    }
  }

  async updateDiagramTemplate(id: number, data: Partial<InsertDiagramTemplate>): Promise<DiagramTemplate | undefined> {
    try {
      const [updated] = await db.update(diagramTemplates)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(diagramTemplates.id, id))
        .returning();
      return updated;
    } catch (error) {
      console.error("Error updating diagram template:", error);
      return undefined;
    }
  }

  async deleteDiagramTemplate(id: number): Promise<boolean> {
    try {
      await db.delete(diagramTemplates).where(eq(diagramTemplates.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting diagram template:", error);
      return false;
    }
  }

  // Diagrams Methods
  async getAllDiagrams(): Promise<Diagram[]> {
    try {
      return await db.select().from(diagrams).orderBy(diagrams.name);
    } catch (error) {
      console.error("Error fetching diagrams:", error);
      return [];
    }
  }

  async getDiagramsByProject(projectId: number): Promise<Diagram[]> {
    try {
      return await db.select()
        .from(diagrams)
        .where(eq(diagrams.projectId, projectId))
        .orderBy(diagrams.name);
    } catch (error) {
      console.error("Error fetching diagrams by project:", error);
      return [];
    }
  }

  async getDiagramsByDocument(documentId: number): Promise<Diagram[]> {
    try {
      return await db.select()
        .from(diagrams)
        .where(eq(diagrams.documentId, documentId))
        .orderBy(diagrams.name);
    } catch (error) {
      console.error("Error fetching diagrams by document:", error);
      return [];
    }
  }

  async getDiagram(id: number): Promise<Diagram | undefined> {
    try {
      const [diagram] = await db.select().from(diagrams).where(eq(diagrams.id, id));
      return diagram;
    } catch (error) {
      console.error("Error fetching diagram:", error);
      return undefined;
    }
  }

  async createDiagram(data: InsertDiagram): Promise<Diagram> {
    try {
      const now = new Date();
      const [diagram] = await db.insert(diagrams).values({
        ...data,
        createdAt: now,
        updatedAt: now
      }).returning();
      return diagram;
    } catch (error) {
      console.error("Error creating diagram:", error);
      throw error;
    }
  }

  async updateDiagram(id: number, data: Partial<InsertDiagram>): Promise<Diagram | undefined> {
    try {
      const [updated] = await db.update(diagrams)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(diagrams.id, id))
        .returning();
      return updated;
    } catch (error) {
      console.error("Error updating diagram:", error);
      return undefined;
    }
  }

  async deleteDiagram(id: number): Promise<boolean> {
    try {
      await db.delete(diagrams).where(eq(diagrams.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting diagram:", error);
      return false;
    }
  }
}

// Use DatabaseStorage for the PostgreSQL database
export const storage = new DatabaseStorage();
